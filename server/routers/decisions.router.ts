import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const decisionsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => db.getAllDecisions(input.projectId)),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      decisionDate: z.string(),
      decidedBy: z.string().optional(),
      decidedById: z.number().optional(),
      status: z.enum(["Open", "Implemented", "Deferred", "Cancelled"]).optional(),
      impact: z.string().optional(),
      requirementId: z.string().optional(),
      taskId: z.string().optional(),
      issueId: z.string().optional(),
      meetingId: z.number().optional(),
      actionItems: z.array(z.object({
        description: z.string(),
        owner: z.string().optional(),
        dueDate: z.string().optional(),
        done: z.boolean().default(false),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const decisionId = await db.getNextId("decision", "DEC", input.projectId);
      return db.createDecision({ ...input, decisionId, status: input.status ?? "Open", decisionDate: new Date(input.decisionDate) });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        decisionDate: z.string().optional(),
        decidedBy: z.string().optional(),
        status: z.enum(["Open", "Implemented", "Deferred", "Cancelled"]).optional(),
        impact: z.string().optional(),
        actionItems: z.array(z.object({
          description: z.string(),
          owner: z.string().optional(),
          dueDate: z.string().optional(),
          done: z.boolean(),
        })).optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const data: any = { ...input.data };
      if (data.decisionDate) data.decisionDate = new Date(data.decisionDate);
      return db.updateDecision(input.id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { await db.deleteDecision(input.id); return { success: true }; }),
});
