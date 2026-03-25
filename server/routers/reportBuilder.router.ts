import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

const EntityEnum = z.enum(["tasks", "requirements", "issues", "risks", "milestones", "tickets", "timeLogs", "budget"]);

export const reportBuilderRouter = router({
  // Build a report: pick entities, date range, groupBy
  build: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      entities: z.array(EntityEnum).min(1),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      groupBy: z.enum(["status", "priority", "assignee", "week", "month", "none"]).default("none"),
    }))
    .query(async ({ input }) => {
      const { projectId, entities, dateFrom, dateTo, groupBy } = input;
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;

      function inRange(d: Date | string | null | undefined) {
        if (!d) return true;
        const dt = new Date(d);
        if (from && dt < from) return false;
        if (to && dt > to) return false;
        return true;
      }

      function groupItems(items: any[], field: string) {
        if (groupBy === "none") return { all: items };
        if (groupBy === "week" || groupBy === "month") {
          return items.reduce((acc, item) => {
            const d = item.createdAt ?? item.dueDate ?? item.startDate;
            if (!d) { (acc["(no date)"] ??= []).push(item); return acc; }
            const key = groupBy === "week"
              ? `W${getWeek(new Date(d))}-${new Date(d).getFullYear()}`
              : `${new Date(d).getFullYear()}-${String(new Date(d).getMonth() + 1).padStart(2, "0")}`;
            (acc[key] ??= []).push(item);
            return acc;
          }, {} as Record<string, any[]>);
        }
        return items.reduce((acc, item) => {
          const key = item[field] ?? "(none)";
          (acc[key] ??= []).push(item);
          return acc;
        }, {} as Record<string, any[]>);
      }

      const groupField: Record<string, string> = {
        status: "status",
        priority: "priority",
        assignee: "responsible",
        week: "week",
        month: "month",
        none: "none",
      };

      const result: Record<string, any> = {};

      await Promise.all(entities.map(async (entity) => {
        let items: any[] = [];
        if (entity === "tasks") {
          const all = await db.getAllTasksSorted(projectId);
          items = all.filter(t => inRange(t.dueDate ?? (t as any).importedAt));
        } else if (entity === "requirements") {
          const all = await db.getAllRequirementsSorted(projectId);
          items = all.filter(r => inRange(r.updateDate ?? (r as any).createdAt));
        } else if (entity === "issues") {
          const all = await db.getAllIssuesSorted(projectId);
          items = all.filter(i => inRange((i as any).createdAt ?? (i as any).openDate));
        } else if (entity === "risks" && db.getAllRisks) {
          const all = await db.getAllRisks(projectId);
          items = all.filter(r => inRange((r as any).createdAt));
        } else if (entity === "milestones" && db.getMilestones) {
          const all = await db.getMilestones(projectId);
          items = all.filter(m => inRange((m as any).dueDate ?? (m as any).createdAt));
        } else if (entity === "budget") {
          const entries = await db.getBudgetEntries(projectId);
          items = entries;
        }

        const grouped = groupItems(items, groupField[groupBy]);
        result[entity] = {
          total: items.length,
          grouped,
          summary: buildSummary(items, entity),
        };
      }));

      return { projectId, dateFrom, dateTo, groupBy, entities, data: result };
    }),

  // Cross-project portfolio report
  portfolioSummary: protectedProcedure
    .input(z.object({ projectIds: z.array(z.number()) }))
    .query(async ({ input }) => {
      const results = await Promise.all(input.projectIds.map(async (projectId) => {
        const [tasks, risks, issues] = await Promise.all([
          db.getAllTasksSorted(projectId),
          db.getAllRisks ? db.getAllRisks(projectId) : [],
          db.getAllIssuesSorted(projectId),
        ]);

        const overdueTasks = tasks.filter(t => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate) < new Date() && t.status !== "Done" && t.currentStatus !== "Completed";
        });

        return {
          projectId,
          totalTasks: tasks.length,
          overdueTasks: overdueTasks.length,
          openIssues: issues.filter(i => (i as any).status !== "Closed").length,
          highRisks: risks.filter((r: any) => r.severity === "High" || r.severity === "Critical").length,
        };
      }));
      return results;
    }),
});

function getWeek(d: Date) {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
}

function buildSummary(items: any[], entity: string) {
  const byStatus = items.reduce((acc, i) => {
    const s = i.status ?? i.currentStatus ?? "(none)";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (entity === "budget") {
    const estimated = items.reduce((s, i) => s + parseFloat(i.estimatedCost ?? "0"), 0);
    const actual = items.reduce((s, i) => s + parseFloat(i.actualCost ?? "0"), 0);
    return { estimated, actual, variance: estimated - actual };
  }

  return { byStatus };
}
