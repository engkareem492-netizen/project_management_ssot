import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { stakeholderPortalTokens } from "../../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import * as db from "../db";
import crypto from "crypto";

export const stakeholderPortalRouter = router({
  // Generate a shareable read-only token for a stakeholder
  generateToken: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      stakeholderId: z.number(),
      expiresInDays: z.number().min(1).max(365).default(30),
      label: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      await dbc.insert(stakeholderPortalTokens).values({
        projectId: input.projectId,
        stakeholderId: input.stakeholderId,
        token,
        label: input.label ?? null,
        expiresAt,
      });

      return { token, expiresAt };
    }),

  // List tokens for a project
  listTokens: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return [];
      return dbc.select().from(stakeholderPortalTokens)
        .where(eq(stakeholderPortalTokens.projectId, input.projectId));
    }),

  // Revoke a token
  revokeToken: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await dbc.delete(stakeholderPortalTokens)
        .where(eq(stakeholderPortalTokens.id, input.id));
      return { success: true };
    }),

  // Public read-only view — no auth, just a valid token
  getPortalView: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [record] = await dbc.select().from(stakeholderPortalTokens)
        .where(and(
          eq(stakeholderPortalTokens.token, input.token),
          gt(stakeholderPortalTokens.expiresAt, new Date()),
        ));

      if (!record) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired link" });

      const { projectId, stakeholderId } = record;

      // Fetch data relevant to this stakeholder
      const [
        stakeholder,
        tasks,
        issues,
        tickets,
        milestones,
        decisions,
        actionItems,
      ] = await Promise.all([
        db.getStakeholderById(stakeholderId),
        db.getAllTasksSorted(projectId),
        db.getAllIssuesSorted(projectId),
        db.getTicketsByProject ? db.getTicketsByProject(projectId) : [],
        db.getMilestones ? db.getMilestones(projectId) : [],
        db.getDecisions ? db.getDecisions(projectId) : [],
        db.getActionItemsByProject ? db.getActionItemsByProject(projectId) : [],
      ]);

      // Filter to items assigned/relevant to this stakeholder
      const myTasks = tasks.filter(t =>
        (t as any).responsibleId === stakeholderId ||
        (t as any).accountableId === stakeholderId
      );

      const myTickets = (tickets as any[]).filter(t => t.assigneeId === stakeholderId);
      const myActionItems = (actionItems as any[]).filter(a => a.assigneeId === stakeholderId || a.ownerId === stakeholderId);

      return {
        stakeholder,
        projectId,
        myTasks: myTasks.map(t => ({
          taskId: (t as any).taskId,
          description: t.description,
          status: t.status ?? t.currentStatus,
          priority: t.priority,
          dueDate: t.dueDate,
        })),
        myTickets: myTickets.map(t => ({
          id: t.id,
          idCode: t.idCode,
          title: t.title,
          status: t.status,
          priority: t.priority,
        })),
        myActionItems: myActionItems.map(a => ({
          id: a.id,
          description: a.description ?? a.title,
          status: a.status,
          dueDate: a.dueDate,
        })),
        milestones: (milestones as any[]).map(m => ({
          name: m.name,
          dueDate: m.dueDate ?? m.endDate,
          status: m.status,
        })),
        decisions: (decisions as any[]).map(d => ({
          title: d.title ?? d.description,
          status: d.status,
          madeAt: d.createdAt,
        })),
        generatedAt: new Date().toISOString(),
      };
    }),
});
