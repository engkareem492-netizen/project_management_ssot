import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { sprints, tasks } from "../../drizzle/schema";
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
});
