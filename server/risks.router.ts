import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";

export const risksRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return await db.getAllRisks(input.projectId);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getRiskById(input.id);
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      riskTypeId: z.number().optional(),
      title: z.string(),
      riskOwnerId: z.number().optional(),
      riskStatusId: z.number().optional(),
      identifiedOn: z.string(), // date string
      impact: z.number().min(1).max(5),
      probability: z.number().min(1).max(5),
      residualImpact: z.number().min(1).max(5).optional(),
      residualProbability: z.number().min(1).max(5).optional(),
      contingencyPlanId: z.number().optional(),
      responseStrategyId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      // Generate Risk ID
      const riskId = await db.generateRiskId(input.projectId);
      
      // Calculate scores
      const score = input.impact * input.probability;
      const residualScore = input.residualImpact && input.residualProbability
        ? input.residualImpact * input.residualProbability
        : null;

      return await db.createRisk({
        projectId: input.projectId,
        riskId,
        riskTypeId: input.riskTypeId || null,
        title: input.title,
        riskOwnerId: input.riskOwnerId || null,
        riskStatusId: input.riskStatusId || null,
        identifiedOn: new Date(input.identifiedOn),
        impact: input.impact,
        probability: input.probability,
        score,
        residualImpact: input.residualImpact || null,
        residualProbability: input.residualProbability || null,
        residualScore,
        contingencyPlanId: input.contingencyPlanId || null,
        responseStrategyId: input.responseStrategyId || null,
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      riskTypeId: z.number().optional(),
      title: z.string().optional(),
      riskOwnerId: z.number().optional(),
      riskStatusId: z.number().optional(),
      identifiedOn: z.string().optional(),
      impact: z.number().min(1).max(5).optional(),
      probability: z.number().min(1).max(5).optional(),
      residualImpact: z.number().min(1).max(5).optional(),
      residualProbability: z.number().min(1).max(5).optional(),
      contingencyPlanId: z.number().optional(),
      responseStrategyId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      
      // Recalculate scores if impact or probability changed
      const updates: any = { ...updateData };
      
      if (input.impact !== undefined || input.probability !== undefined) {
        const currentRisk = await db.getRiskById(id);
        const impact = input.impact ?? currentRisk.impact;
        const probability = input.probability ?? currentRisk.probability;
        updates.score = impact * probability;
      }
      
      if (input.residualImpact !== undefined || input.residualProbability !== undefined) {
        const currentRisk = await db.getRiskById(id);
        const residualImpact = input.residualImpact ?? currentRisk.residualImpact;
        const residualProbability = input.residualProbability ?? currentRisk.residualProbability;
        if (residualImpact && residualProbability) {
          updates.residualScore = residualImpact * residualProbability;
        }
      }

      await db.updateRisk(id, updates);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteRisk(input.id);
      return { success: true };
    }),

  // Risk Updates (historical tracking)
  updates: router({
    list: protectedProcedure
      .input(z.object({ riskId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRiskUpdates(input.riskId);
      }),

    create: protectedProcedure
      .input(z.object({
        riskId: z.number(),
        update: z.string(),
        updateDate: z.string(), // date string
      }))
      .mutation(async ({ input }) => {
        await db.createRiskUpdate({
          ...input,
          updateDate: new Date(input.updateDate),
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRiskUpdate(input.id);
        return { success: true };
      }),
  }),

  // Risk Analysis
  analysis: router({
    list: protectedProcedure
      .input(z.object({ riskId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRiskAnalysis(input.riskId);
      }),

    create: protectedProcedure
      .input(z.object({
        riskId: z.number(),
        causeLevel: z.number(),
        cause: z.string(),
        consequences: z.string(),
        trigger: z.string(),
        mitigationPlanId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createRiskAnalysis({
          ...input,
          mitigationPlanId: input.mitigationPlanId || null,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        causeLevel: z.number().optional(),
        cause: z.string().optional(),
        consequences: z.string().optional(),
        trigger: z.string().optional(),
        mitigationPlanId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        await db.updateRiskAnalysis(id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRiskAnalysis(input.id);
        return { success: true };
      }),
  }),

  // Risk Types
  types: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllRiskTypes(input.projectId);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createRiskType(input);
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        await db.updateRiskType(id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRiskType(input.id);
        return { success: true };
      }),
  }),

  // Risk Status
  status: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllRiskStatuses(input.projectId);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createRiskStatus(input);
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        await db.updateRiskStatus(id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRiskStatus(input.id);
        return { success: true };
      }),
  }),

  // Response Strategy
  strategy: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllResponseStrategies(input.projectId);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createResponseStrategy(input);
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        await db.updateResponseStrategy(id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteResponseStrategy(input.id);
        return { success: true };
      }),
  }),
});
