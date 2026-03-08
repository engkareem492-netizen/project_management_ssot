import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => db.getNotifications(ctx.user.id, input.projectId)),

  unreadCount: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      const count = await db.getUnreadNotificationCount(ctx.user.id, input.projectId);
      return { count };
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { await db.markNotificationRead(input.id); return { success: true }; }),

  markAllRead: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => { await db.markAllNotificationsRead(ctx.user.id, input.projectId); return { success: true }; }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      userId: z.number(),
      type: z.enum(["task_overdue", "issue_escalated", "cr_submitted", "risk_high", "task_assigned", "decision_added", "due_soon"]),
      title: z.string(),
      message: z.string(),
      entityType: z.string().optional(),
      entityId: z.string().optional(),
    }))
    .mutation(async ({ input }) => { await db.createNotification(input); return { success: true }; }),
});
