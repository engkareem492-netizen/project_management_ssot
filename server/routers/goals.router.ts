import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { goals, keyResults } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const goalsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(goals)
        .where(eq(goals.projectId, input.projectId))
        .orderBy(desc(goals.createdAt));
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      owner: z.string().optional(),
      status: z.enum(["Not Started", "In Progress", "At Risk", "Achieved", "Cancelled"]).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      progress: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { startDate, endDate, ...rest } = input;
      await db.insert(goals).values({
        ...rest,
        status: rest.status ?? "Not Started",
        progress: rest.progress ?? 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      });
      const [created] = await db.select().from(goals)
        .where(eq(goals.projectId, input.projectId))
        .orderBy(desc(goals.id)).limit(1);
      return created;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      owner: z.string().optional(),
      status: z.enum(["Not Started", "In Progress", "At Risk", "Achieved", "Cancelled"]).optional(),
      startDate: z.string().optional().nullable(),
      endDate: z.string().optional().nullable(),
      progress: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, startDate, endDate, ...rest } = input;
      const updateData: any = { ...rest };
      if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
      if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
      await db.update(goals).set(updateData).where(eq(goals.id, id));
      const [updated] = await db.select().from(goals).where(eq(goals.id, id));
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(keyResults).where(eq(keyResults.goalId, input.id));
      await db.delete(goals).where(eq(goals.id, input.id));
      return { success: true };
    }),

  // Key Results sub-router
  keyResults: router({
    list: protectedProcedure
      .input(z.object({ goalId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(keyResults)
          .where(eq(keyResults.goalId, input.goalId))
          .orderBy(desc(keyResults.createdAt));
      }),

    create: protectedProcedure
      .input(z.object({
        goalId: z.number(),
        projectId: z.number(),
        title: z.string().min(1),
        targetValue: z.number().optional(),
        currentValue: z.number().optional(),
        unit: z.string().optional(),
        status: z.enum(["Not Started", "In Progress", "At Risk", "Achieved"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { targetValue, currentValue, ...rest } = input;
        await db.insert(keyResults).values({
          ...rest,
          status: rest.status ?? "Not Started",
          targetValue: targetValue?.toString() ?? null,
          currentValue: (currentValue ?? 0).toString(),
        });
        const [created] = await db.select().from(keyResults)
          .where(eq(keyResults.goalId, input.goalId))
          .orderBy(desc(keyResults.id)).limit(1);
        return created;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        targetValue: z.number().optional().nullable(),
        currentValue: z.number().optional(),
        unit: z.string().optional(),
        status: z.enum(["Not Started", "In Progress", "At Risk", "Achieved"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { id, targetValue, currentValue, ...rest } = input;
        const updateData: any = { ...rest };
        if (targetValue !== undefined) updateData.targetValue = targetValue?.toString() ?? null;
        if (currentValue !== undefined) updateData.currentValue = currentValue.toString();
        await db.update(keyResults).set(updateData).where(eq(keyResults.id, id));
        const [updated] = await db.select().from(keyResults).where(eq(keyResults.id, id));
        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.delete(keyResults).where(eq(keyResults.id, input.id));
        return { success: true };
      }),
  }),
});
