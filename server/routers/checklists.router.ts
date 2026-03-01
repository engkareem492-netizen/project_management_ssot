import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const checklistsRouter = router({
  list: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getChecklistItems(input.taskId);
    }),

  create: protectedProcedure
    .input(z.object({
      taskId: z.number(),
      title: z.string().min(1).max(500),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.createChecklistItem({
        taskId: input.taskId,
        title: input.title,
        sortOrder: input.sortOrder ?? 0,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      isCompleted: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.isCompleted === true) {
        updateData.completedAt = new Date();
        updateData.completedBy = ctx.user.id;
      } else if (data.isCompleted === false) {
        updateData.completedAt = null;
        updateData.completedBy = null;
      }
      await db.updateChecklistItem(id, updateData);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteChecklistItem(input.id);
      return { success: true };
    }),

  progress: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return await db.getChecklistProgress(input.taskId);
    }),
});
