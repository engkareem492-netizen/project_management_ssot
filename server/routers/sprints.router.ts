import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { sprints, tasks, userStories } from "../../drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";

export const sprintsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(sprints)
        .where(eq(sprints.projectId, input.projectId))
        .orderBy(desc(sprints.createdAt));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [item] = await db.select().from(sprints).where(eq(sprints.id, input.id));
      return item ?? null;
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string().min(1),
      goal: z.string().optional(),
      status: z.enum(["Planning", "Active", "Completed", "Cancelled"]).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      capacity: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { projectId, name, goal, status, startDate, endDate, capacity } = input;
      await db.insert(sprints).values({
        projectId,
        name,
        goal: goal ?? null,
        status: status ?? "Planning",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        capacity: capacity ?? null,
      });
      const [created] = await db.select().from(sprints)
        .where(eq(sprints.projectId, projectId))
        .orderBy(desc(sprints.id))
        .limit(1);
      return created;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      goal: z.string().optional(),
      status: z.enum(["Planning", "Active", "Completed", "Cancelled"]).optional(),
      startDate: z.string().optional().nullable(),
      endDate: z.string().optional().nullable(),
      capacity: z.number().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, startDate, endDate, ...rest } = input;
      const updateData: any = { ...rest };
      if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
      if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
      await db.update(sprints).set(updateData).where(eq(sprints.id, id));
      const [updated] = await db.select().from(sprints).where(eq(sprints.id, id));
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(sprints).where(eq(sprints.id, input.id));
      return { success: true };
    }),

  assignTask: protectedProcedure
    .input(z.object({ taskId: z.number(), sprintId: z.number().nullable() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(tasks).set({ sprintId: input.sprintId }).where(eq(tasks.id, input.taskId));
      return { success: true };
    }),

  // ─── Agile Dashboard helpers ───────────────────────────────────────────────

  backlogStats: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { total: 0, backlog: 0, inSprint: 0, done: 0, totalPoints: 0, unestimated: 0 };
      const stories = await db.select().from(userStories)
        .where(eq(userStories.projectId, input.projectId));
      const total = stories.length;
      const backlog = stories.filter(s => !s.sprintId && s.status !== "Done" && s.status !== "Rejected").length;
      const inSprint = stories.filter(s => !!s.sprintId && s.status !== "Done").length;
      const done = stories.filter(s => s.status === "Done").length;
      const totalPoints = stories.reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);
      const unestimated = stories.filter(s => !s.storyPoints).length;
      return { total, backlog, inSprint, done, totalPoints, unestimated };
    }),

  velocityHistory: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const completedSprints = await db.select().from(sprints)
        .where(and(eq(sprints.projectId, input.projectId), eq(sprints.status, "Completed")))
        .orderBy(asc(sprints.createdAt))
        .limit(10);
      const result = await Promise.all(completedSprints.map(async (sprint) => {
        const stories = await db.select().from(userStories)
          .where(and(eq(userStories.sprintId, sprint.id), eq(userStories.status, "Done")));
        const velocity = stories.reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);
        return { name: sprint.name, velocity };
      }));
      return result;
    }),

  activeSprint: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [active] = await db.select().from(sprints)
        .where(and(eq(sprints.projectId, input.projectId), eq(sprints.status, "Active")))
        .limit(1);
      if (!active) return null;
      const stories = await db.select().from(userStories)
        .where(eq(userStories.sprintId, active.id));
      const totalPoints = stories.reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);
      const donePoints = stories.filter(s => s.status === "Done").reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);
      const byStatus: Record<string, number> = {};
      stories.forEach(s => {
        const st = s.status ?? "Unknown";
        byStatus[st] = (byStatus[st] || 0) + 1;
      });
      return { ...active, totalPoints, donePoints, storyCount: stories.length, byStatus };
    }),
});
