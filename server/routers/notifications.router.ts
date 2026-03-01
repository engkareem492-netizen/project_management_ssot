import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      unreadOnly: z.boolean().default(false),
    }))
    .query(async ({ input, ctx }) => {
      return await db.getNotifications(ctx.user.id, input.limit, input.unreadOnly);
    }),

  unreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      return await db.getUnreadNotificationCount(ctx.user.id);
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db.markNotificationRead(input.id, ctx.user.id);
      return { success: true };
    }),

  markAllRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      await db.markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db.deleteNotification(input.id, ctx.user.id);
      return { success: true };
    }),
});
