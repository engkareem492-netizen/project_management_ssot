import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { businessCase, projectOKRs } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const businessCaseRouter = router({
  // ── Business Case ──────────────────────────────────────────────────────────
  get: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [bc] = await db.select().from(businessCase).where(eq(businessCase.projectId, input.projectId));
      return bc ?? null;
    }),

  upsert: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      projectJustification: z.string().optional(),
      problemStatement: z.string().optional(),
      alternativesConsidered: z.string().optional(),
      recommendedSolution: z.string().optional(),
      strategicObjectives: z.string().optional(),
      alignmentRationale: z.string().optional(),
      estimatedCost: z.string().optional(),
      estimatedBenefit: z.string().optional(),
      roi: z.string().optional(),
      paybackPeriodMonths: z.number().optional(),
      costBenefitDetails: z.array(z.object({ item: z.string(), cost: z.string(), benefit: z.string(), notes: z.string() })).optional(),
      successMeasures: z.string().optional(),
      reportSections: z.array(z.object({ section: z.string(), metric: z.string(), target: z.string() })).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const { projectId, ...rest } = input;
      const [existing] = await db.select({ id: businessCase.id }).from(businessCase).where(eq(businessCase.projectId, projectId));
      if (existing) {
        await db.update(businessCase).set(rest as any).where(eq(businessCase.projectId, projectId));
      } else {
        await db.insert(businessCase).values({ projectId, ...rest } as any);
      }
      const [updated] = await db.select().from(businessCase).where(eq(businessCase.projectId, projectId));
      return updated;
    }),

  // ── Project OKRs ───────────────────────────────────────────────────────────
  listOKRs: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(projectOKRs)
        .where(eq(projectOKRs.projectId, input.projectId))
        .orderBy(projectOKRs.okrCode);
    }),

  createOKR: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      objective: z.string(),
      keyResults: z.array(z.object({ kr: z.string(), target: z.string(), current: z.string(), unit: z.string(), status: z.string() })).optional(),
      linkedReportSection: z.string().optional(),
      owner: z.string().optional(),
      ownerId: z.number().optional(),
      dueDate: z.string().optional(),
      status: z.enum(["On Track", "At Risk", "Behind", "Achieved", "Cancelled"]).optional(),
      progressPct: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      // Generate OKR code
      const existing = await db.select({ okrCode: projectOKRs.okrCode }).from(projectOKRs).where(eq(projectOKRs.projectId, input.projectId));
      const nextNum = existing.length + 1;
      const okrCode = `OKR-${String(nextNum).padStart(3, '0')}`;
      const { dueDate, ...rest } = input;
      await db.insert(projectOKRs).values({
        ...rest,
        okrCode,
        dueDate: dueDate ? new Date(dueDate) : null,
      } as any);
      return { success: true, okrCode };
    }),

  updateOKR: protectedProcedure
    .input(z.object({
      id: z.number(),
      objective: z.string().optional(),
      keyResults: z.array(z.object({ kr: z.string(), target: z.string(), current: z.string(), unit: z.string(), status: z.string() })).optional(),
      linkedReportSection: z.string().optional(),
      owner: z.string().optional(),
      ownerId: z.number().optional(),
      dueDate: z.string().optional(),
      status: z.enum(["On Track", "At Risk", "Behind", "Achieved", "Cancelled"]).optional(),
      progressPct: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const { id, dueDate, ...rest } = input;
      await db.update(projectOKRs).set({
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      } as any).where(eq(projectOKRs.id, id));
      return { success: true };
    }),

  deleteOKR: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      await db.delete(projectOKRs).where(eq(projectOKRs.id, input.id));
      return { success: true };
    }),
});
