import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { eefFactors } from "../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import { getDb } from "../db";

export const eefRouter = router({
  // List all EEF factors for a project
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(eefFactors)
        .where(eq(eefFactors.projectId, input.projectId))
        .orderBy(asc(eefFactors.type), asc(eefFactors.category), asc(eefFactors.name));
    }),

  // Create a new EEF factor
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        type: z.enum(["Internal", "External"]),
        category: z.string().min(1).max(100),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        impact: z.enum(["High", "Medium", "Low"]).default("Medium"),
        influence: z.enum(["Positive", "Negative", "Neutral"]).default("Neutral"),
        source: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(eefFactors).values({
        projectId: input.projectId,
        type: input.type,
        category: input.category,
        name: input.name,
        description: input.description ?? null,
        impact: input.impact,
        influence: input.influence,
        source: input.source ?? null,
        notes: input.notes ?? null,
      }).$returningId();
      return { id: result[0].id };
    }),

  // Update an EEF factor
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        projectId: z.number(),
        type: z.enum(["Internal", "External"]).optional(),
        category: z.string().min(1).max(100).optional(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().nullable().optional(),
        impact: z.enum(["High", "Medium", "Low"]).optional(),
        influence: z.enum(["Positive", "Negative", "Neutral"]).optional(),
        source: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, projectId, ...updates } = input;
      await db
        .update(eefFactors)
        .set(updates)
        .where(and(eq(eefFactors.id, id), eq(eefFactors.projectId, projectId)));
      return { success: true };
    }),

  // Delete an EEF factor
  delete: protectedProcedure
    .input(z.object({ id: z.number(), projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .delete(eefFactors)
        .where(and(eq(eefFactors.id, input.id), eq(eefFactors.projectId, input.projectId)));
      return { success: true };
    }),
});
