import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { projectCharter } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const charterRouter = router({
  get: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [charter] = await db.select().from(projectCharter).where(eq(projectCharter.projectId, input.projectId));
      return charter ?? null;
    }),

  upsert: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      objectives: z.string().optional(),
      scopeStatement: z.string().optional(),
      outOfScope: z.string().optional(),
      successCriteria: z.string().optional(),
      constraints: z.string().optional(),
      methodology: z.string().optional(),
      projectStartDate: z.string().optional(),
      projectEndDate: z.string().optional(),
      phase: z.string().optional(),
      ragStatus: z.enum(["Green", "Amber", "Red"]).optional(),
      ragJustification: z.string().optional(),
      sponsorId: z.number().optional(),
      projectManagerId: z.number().optional(),
      budget: z.string().optional(),
      currency: z.string().optional(),
      notes: z.string().optional(),
      // Business Case
      businessCaseCause: z.string().optional(),
      businessCaseSummary: z.string().optional(),
      feasibilityStudy: z.string().optional(),
      // Governance
      governanceStructure: z.string().optional(),
      pmResponsibilities: z.string().optional(),
      escalationPath: z.string().optional(),
      decisionAuthority: z.string().optional(),
      // Need Assessment & Benefits
      needAssessment: z.string().optional(),
      benefitsManagementPlan: z.string().optional(),
      expectedBenefits: z.array(z.object({ benefit: z.string(), metric: z.string(), targetDate: z.string() })).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const { projectId, projectStartDate, projectEndDate, budget, ...rest } = input;
      const values = {
        ...rest,
        projectStartDate: projectStartDate ? new Date(projectStartDate) : null,
        projectEndDate: projectEndDate ? new Date(projectEndDate) : null,
        budget: budget ?? null,
      };
      const [existing] = await db.select({ id: projectCharter.id }).from(projectCharter).where(eq(projectCharter.projectId, projectId));
      if (existing) {
        await db.update(projectCharter).set(values as any).where(eq(projectCharter.projectId, projectId));
      } else {
        await db.insert(projectCharter).values({ projectId, ...values } as any);
      }
      const [updated] = await db.select().from(projectCharter).where(eq(projectCharter.projectId, projectId));
      return updated;
    }),
});
