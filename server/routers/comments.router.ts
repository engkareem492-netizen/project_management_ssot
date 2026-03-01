import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const commentsRouter = router({
  list: protectedProcedure
    .input(z.object({
      entityType: z.string(),
      entityId: z.number(),
      projectId: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.getCommentsByEntity(input.entityType, input.entityId, input.projectId);
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      entityType: z.string(),
      entityId: z.number(),
      body: z.string().min(1),
      parentCommentId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.createComment({
        projectId: input.projectId,
        entityType: input.entityType,
        entityId: input.entityId,
        body: input.body,
        parentCommentId: input.parentCommentId ?? null,
        authorId: ctx.user.id,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      body: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.updateComment(input.id, input.body, ctx.user.id);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db.deleteComment(input.id, ctx.user.id);
      return { success: true };
    }),

  count: protectedProcedure
    .input(z.object({
      entityType: z.string(),
      entityId: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.getCommentCount(input.entityType, input.entityId);
    }),
});
