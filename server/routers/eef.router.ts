import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eefFactors } from "../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const eefRouter = router({
  // List all EEF factors for a project
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db
        .select()
        .from(eefFactors)
        .where(eq(eefFactors.projectId, input.projectId))
        .orderBy(asc(eefFactors.category), asc(eefFactors.id));
    }),

  // Create a new EEF factor
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        category: z.enum(["Internal", "External"]),
        type: z.string().min(1).max(200),
        description: z.string().optional(),
        impact: z.enum(["Positive", "Negative", "Neutral"]).optional(),
        impactLevel: z.enum(["High", "Medium", "Low"]).optional(),
        owner: z.string().optional(),
        notes: z.string().optional(),
        linkedDocumentId: z.number().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Generate EEF ID
      const existing = await db
        .select({ id: eefFactors.id })
        .from(eefFactors)
        .where(eq(eefFactors.projectId, input.projectId));

      const nextNum = existing.length + 1;
      const eefId = `EEF-${String(nextNum).padStart(4, "0")}`;

      const result = await db.insert(eefFactors).values({
        projectId: input.projectId,
        eefId,
        category: input.category,
        type: input.type,
        description: input.description ?? null,
        impact: input.impact ?? null,
        impactLevel: input.impactLevel ?? null,
        owner: input.owner ?? null,
        notes: input.notes ?? null,
      });

      const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
      const [created] = await db
        .select()
        .from(eefFactors)
        .where(eq(eefFactors.id, insertId));
      return created;
    }),

  // Update an EEF factor
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        projectId: z.number(),
        category: z.enum(["Internal", "External"]).optional(),
        type: z.string().min(1).max(200).optional(),
        description: z.string().optional().nullable(),
        impact: z.enum(["Positive", "Negative", "Neutral"]).optional().nullable(),
        impactLevel: z.enum(["High", "Medium", "Low"]).optional().nullable(),
        owner: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        linkedDocumentId: z.number().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, projectId, ...fields } = input;
      await db
        .update(eefFactors)
        .set(fields as any)
        .where(and(eq(eefFactors.id, id), eq(eefFactors.projectId, projectId)));
      const [updated] = await db
        .select()
        .from(eefFactors)
        .where(eq(eefFactors.id, id));
      return updated;
    }),

  // Delete an EEF factor
  delete: protectedProcedure
    .input(z.object({ id: z.number(), projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .delete(eefFactors)
        .where(and(eq(eefFactors.id, input.id), eq(eefFactors.projectId, input.projectId)));
      return { success: true };
    }),
});
