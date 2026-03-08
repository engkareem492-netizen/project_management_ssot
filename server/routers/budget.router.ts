import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const budgetRouter = router({
  getSummary: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const [budget, entries] = await Promise.all([
        db.getProjectBudget(input.projectId),
        db.getBudgetEntries(input.projectId),
      ]);
      const totalEstimated = entries.reduce((s, e) => s + parseFloat(e.estimatedCost ?? "0"), 0);
      const totalActual = entries.reduce((s, e) => s + parseFloat(e.actualCost ?? "0"), 0);
      const totalBudget = parseFloat(budget?.totalBudget ?? "0");
      return { budget, entries, totalBudget, totalEstimated, totalActual, remaining: totalBudget - totalActual };
    }),

  upsertBudget: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      totalBudget: z.string(),
      currency: z.string().default("USD"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => db.upsertProjectBudget(input.projectId, input)),

  getEntries: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => db.getBudgetEntries(input.projectId)),

  createEntry: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      category: z.string(),
      description: z.string(),
      estimatedCost: z.string().optional(),
      actualCost: z.string().optional(),
      entityType: z.string().optional(),
      entityId: z.string().optional(),
      status: z.enum(["Planned", "Committed", "Spent", "Cancelled"]).optional(),
      entryDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => db.createBudgetEntry(input as any)),

  updateEntry: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        category: z.string().optional(),
        description: z.string().optional(),
        estimatedCost: z.string().optional(),
        actualCost: z.string().optional(),
        status: z.enum(["Planned", "Committed", "Spent", "Cancelled"]).optional(),
        entryDate: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => db.updateBudgetEntry(input.id, input.data as any)),

  deleteEntry: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { await db.deleteBudgetEntry(input.id); return { success: true }; }),
});
