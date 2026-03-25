import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

/**
 * Resource leveling / capacity planning router.
 * Computes per-person allocation vs availability for a date range or sprint.
 */
export const capacityPlanningRouter = router({
  // Allocation vs availability per person per week
  weeklyAllocation: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      weekStart: z.string(), // ISO date of Monday
      weeksAhead: z.number().min(1).max(26).default(4),
    }))
    .query(async ({ input }) => {
      const { projectId, weekStart, weeksAhead } = input;
      const start = new Date(weekStart);

      const [stakeholders, tasks, capacities] = await Promise.all([
        db.getAllStakeholders(projectId),
        db.getAllTasksSorted(projectId),
        db.getResourceCapacities(projectId),
      ]);

      const weeks: string[] = [];
      for (let i = 0; i < weeksAhead; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i * 7);
        weeks.push(d.toISOString().split("T")[0]);
      }

      // Build capacity map: stakeholderId -> weekStart -> availableHours
      const capMap: Record<number, Record<string, number>> = {};
      for (const c of capacities) {
        capMap[c.stakeholderId] ??= {};
        capMap[c.stakeholderId][c.weekStart] = parseFloat(c.availableHours ?? "40");
      }

      // Allocate man-hours from tasks to assignees per week (by dueDate week)
      const allocMap: Record<number, Record<string, number>> = {};
      for (const task of tasks) {
        const assigneeId = (task as any).responsibleId;
        if (!assigneeId || !task.dueDate) continue;
        const dueWeek = getWeekStart(new Date(task.dueDate));
        allocMap[assigneeId] ??= {};
        allocMap[assigneeId][dueWeek] = (allocMap[assigneeId][dueWeek] ?? 0) + (task.manHours ?? 0);
      }

      return stakeholders.map(s => {
        const weekData = weeks.map(w => {
          const available = capMap[s.id]?.[w] ?? 40;
          const allocated = allocMap[s.id]?.[w] ?? 0;
          const utilization = available > 0 ? Math.round((allocated / available) * 100) : 0;
          return { week: w, available, allocated, utilization, overloaded: allocated > available };
        });
        return {
          stakeholderId: s.id,
          name: s.fullName,
          weeks: weekData,
          totalAllocated: weekData.reduce((s, w) => s + w.allocated, 0),
          avgUtilization: Math.round(weekData.reduce((s, w) => s + w.utilization, 0) / weekData.length),
        };
      });
    }),

  // Capacity forecast for a sprint
  sprintCapacity: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      sprintId: z.number(),
    }))
    .query(async ({ input }) => {
      const { projectId, sprintId } = input;
      const { getDb } = await import("../db");
      const { sprints, tasks: tasksTable } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const dbc = await getDb();
      if (!dbc) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [sprint] = await dbc.select().from(sprints).where(eq(sprints.id, sprintId));
      if (!sprint) throw new TRPCError({ code: "NOT_FOUND", message: "Sprint not found" });

      const sprintTasks = await dbc.select().from(tasksTable)
        .where(and(eq(tasksTable.projectId, projectId), eq(tasksTable.sprintId, sprintId)));

      const totalManHours = sprintTasks.reduce((s, t) => s + (t.manHours ?? 0), 0);
      const completedHours = sprintTasks
        .filter(t => t.status === "Done" || t.currentStatus === "Completed")
        .reduce((s, t) => s + (t.manHours ?? 0), 0);

      const stakeholders = await db.getAllStakeholders(projectId);
      const capacities = await db.getResourceCapacities(projectId);

      // If sprint has dates, sum capacity for those weeks
      let totalCapacity = 0;
      if (sprint.startDate && sprint.endDate) {
        const sprintWeeks = getWeeksBetween(new Date(sprint.startDate), new Date(sprint.endDate));
        for (const cap of capacities) {
          if (sprintWeeks.includes(cap.weekStart)) {
            totalCapacity += parseFloat(cap.availableHours ?? "40");
          }
        }
        if (totalCapacity === 0) {
          // fallback: team size * 40h * sprint weeks
          totalCapacity = stakeholders.length * 40 * sprintWeeks.length;
        }
      }

      return {
        sprint,
        totalManHours,
        completedHours,
        remainingHours: totalManHours - completedHours,
        totalCapacity,
        utilizationRate: totalCapacity > 0 ? Math.round((totalManHours / totalCapacity) * 100) : null,
        taskCount: sprintTasks.length,
        completedTasks: sprintTasks.filter(t => t.status === "Done" || t.currentStatus === "Completed").length,
      };
    }),

  // Set or update capacity for a person/week (delegates to resources router pattern)
  setCapacity: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      stakeholderId: z.number(),
      weekStart: z.string(),
      availableHours: z.number().min(0).max(168),
    }))
    .mutation(async ({ input }) => {
      await db.upsertResourceCapacity(
        input.projectId,
        input.stakeholderId,
        input.weekStart,
        String(input.availableHours),
      );
      return { success: true };
    }),
});

function getWeekStart(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

function getWeeksBetween(start: Date, end: Date): string[] {
  const weeks: string[] = [];
  const cur = new Date(start);
  cur.setDate(cur.getDate() - cur.getDay() + 1); // Monday
  while (cur <= end) {
    weeks.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 7);
  }
  return weeks;
}
