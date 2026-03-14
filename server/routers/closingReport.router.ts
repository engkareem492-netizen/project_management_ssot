import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { closingReport } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const closingReportRouter = router({
  get: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [report] = await db.select().from(closingReport).where(eq(closingReport.projectId, input.projectId));
      return report ?? null;
    }),

  upsert: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      objectivesStatus: z.array(z.object({
        objective: z.string(),
        status: z.enum(["Met", "Partially Met", "Not Met"]),
        completionPct: z.number(),
        notes: z.string(),
      })).optional(),
      initialBudget: z.string().optional(),
      finalCost: z.string().optional(),
      budgetVariance: z.string().optional(),
      fundingNotes: z.string().optional(),
      closureCriteria: z.array(z.object({ criterion: z.string(), met: z.boolean(), notes: z.string() })).optional(),
      closureJustification: z.string().optional(),
      lessonsLearnedSummary: z.string().optional(),
      handoverNotes: z.string().optional(),
      closedDate: z.string().optional(),
      closedById: z.number().optional(),
      closedBy: z.string().optional(),
      status: z.enum(["Draft", "Under Review", "Approved", "Archived"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const { projectId, closedDate, ...rest } = input;
      const values = {
        ...rest,
        closedDate: closedDate ? new Date(closedDate) : null,
      };
      const [existing] = await db.select({ id: closingReport.id }).from(closingReport).where(eq(closingReport.projectId, projectId));
      if (existing) {
        await db.update(closingReport).set(values as any).where(eq(closingReport.projectId, projectId));
      } else {
        await db.insert(closingReport).values({ projectId, ...values } as any);
      }
      const [updated] = await db.select().from(closingReport).where(eq(closingReport.projectId, projectId));
      return updated;
    }),
});
