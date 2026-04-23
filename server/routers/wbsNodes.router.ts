import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { wbsNodes, tasks } from "../../drizzle/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { computeCPM } from "../lib/cpm";

export const wbsNodesRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(wbsNodes)
        .where(eq(wbsNodes.projectId, input.projectId))
        .orderBy(asc(wbsNodes.sequence), asc(wbsNodes.code));
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      code: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      parentId: z.number().optional(),
      sequence: z.number().optional(),
      deliverable: z.string().optional(),
      responsible: z.string().optional(),
      status: z.enum(["Not Started", "In Progress", "Complete", "On Hold"]).optional(),
      linkedTaskId: z.number().optional(),
      taskType: z.enum(["Summary", "Work Package", "Milestone"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(wbsNodes).values({
        projectId: input.projectId,
        code: input.code,
        name: input.name,
        description: input.description ?? null,
        parentId: input.parentId ?? null,
        sequence: input.sequence ?? 0,
        deliverable: input.deliverable ?? null,
        responsible: input.responsible ?? null,
        status: input.status ?? "Not Started",
        linkedTaskId: input.linkedTaskId ?? null,
        taskType: input.taskType ?? "Work Package",
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      code: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      parentId: z.number().nullable().optional(),
      sequence: z.number().optional(),
      deliverable: z.string().optional(),
      responsible: z.string().optional(),
      status: z.enum(["Not Started", "In Progress", "Complete", "On Hold"]).optional(),
      linkedTaskId: z.number().nullable().optional(),
      taskType: z.enum(["Summary", "Work Package", "Milestone"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...rest } = input;
      await db.update(wbsNodes).set(rest as any).where(eq(wbsNodes.id, id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(wbsNodes).where(eq(wbsNodes.id, input.id));
      return { success: true };
    }),

  /**
   * Run CPM on all tasks in a project that have linkedTaskId set.
   * Uses task dependencies (parentTaskId as predecessor chain) to build the graph.
   * Writes earlyStart, earlyFinish, lateStart, lateFinish, totalFloat, isCritical back to each task.
   */
  runCPM: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Get all tasks for this project
      const allTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, input.projectId));

      if (allTasks.length === 0) return { updated: 0, cycle: false };

      // Build CPM nodes from tasks using parentTaskId as predecessor
      const cpmNodes = allTasks.map((t) => ({
        id: t.id,
        plannedStart: t.startDate ?? null,
        plannedEnd: t.dueDate ?? null,
        durationDays: t.durationDays != null ? String(t.durationDays) : null,
        predecessors: t.parentTaskId ? [{ predecessorId: t.parentTaskId, lagDays: 0 }] : [],
        successors: [] as Array<{ successorId: number; lagDays: number }>,
      }));

      // Build successor index
      const nodeMap = new Map(cpmNodes.map((n) => [n.id, n]));
      for (const n of cpmNodes) {
        for (const p of n.predecessors) {
          const pred = nodeMap.get(p.predecessorId);
          if (pred) pred.successors.push({ successorId: n.id, lagDays: p.lagDays });
        }
      }

      const { results, cycle } = computeCPM(cpmNodes);

      if (cycle) return { updated: 0, cycle: true };

      // Write results back to tasks
      let updated = 0;
      for (const r of results) {
        await db.update(tasks).set({
          earlyStart: r.earlyStart,
          earlyFinish: r.earlyFinish,
          lateStart: r.lateStart,
          lateFinish: r.lateFinish,
          totalFloat: String(r.totalFloat),
          isCritical: r.isCritical ? 1 : 0,
        } as any).where(eq(tasks.id, r.id));
        updated++;
      }

      return { updated, cycle: false };
    }),
});
