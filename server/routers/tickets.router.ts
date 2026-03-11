import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { tickets, ticketTypes } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

function computeSla(ticket: {
  createdAt: Date;
  respondedAt: Date | null;
  resolvedAt: Date | null;
}, sla: { responseTimeHours: number; resolutionTimeHours: number }) {
  const now = new Date();
  const createdMs = ticket.createdAt.getTime();

  const responseDueAt = new Date(createdMs + sla.responseTimeHours * 3600_000);
  const resolutionDueAt = new Date(createdMs + sla.resolutionTimeHours * 3600_000);

  const responseElapsedMs = (ticket.respondedAt ?? now).getTime() - createdMs;
  const resolutionElapsedMs = (ticket.resolvedAt ?? now).getTime() - createdMs;

  const responseBreached = responseElapsedMs > sla.responseTimeHours * 3600_000;
  const resolutionBreached = resolutionElapsedMs > sla.resolutionTimeHours * 3600_000;

  return {
    responseDueAt,
    resolutionDueAt,
    responseElapsedHours: +(responseElapsedMs / 3600_000).toFixed(2),
    resolutionElapsedHours: +(resolutionElapsedMs / 3600_000).toFixed(2),
    responseBreached,
    resolutionBreached,
    responseRemainingHours: responseBreached ? 0 : +((sla.responseTimeHours * 3600_000 - responseElapsedMs) / 3600_000).toFixed(2),
    resolutionRemainingHours: resolutionBreached ? 0 : +((sla.resolutionTimeHours * 3600_000 - resolutionElapsedMs) / 3600_000).toFixed(2),
  };
}

export const ticketsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(tickets)
        .where(eq(tickets.projectId, input.projectId))
        .orderBy(desc(tickets.createdAt));
      return rows;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.id));
      if (!ticket) return null;

      // Fetch ticket type for SLA thresholds
      const [type] = await db.select().from(ticketTypes).where(eq(ticketTypes.id, ticket.ticketTypeId));
      if (!type) return { ...ticket, sla: null };

      const sla = computeSla(ticket, type);
      return { ...ticket, sla };
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      ticketTypeId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
      assigneeId: z.number().optional(),
      assigneeName: z.string().optional(),
      reporterName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Generate idCode
      const [countRow] = await db.select({ cnt: sql<number>`COUNT(*)` })
        .from(tickets)
        .where(eq(tickets.projectId, input.projectId));
      const seq = (countRow?.cnt ?? 0) + 1;
      const idCode = `TK-${String(seq).padStart(4, "0")}`;

      await db.insert(tickets).values({
        projectId: input.projectId,
        ticketTypeId: input.ticketTypeId,
        idCode,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? "Medium",
        assigneeId: input.assigneeId ?? null,
        assigneeName: input.assigneeName ?? null,
        reporterName: input.reporterName ?? null,
      });
      const [created] = await db.select().from(tickets)
        .where(eq(tickets.projectId, input.projectId))
        .orderBy(desc(tickets.id))
        .limit(1);
      return created;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        ticketTypeId: z.number().optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
        status: z.enum(["Open", "In Progress", "Waiting", "Resolved", "Closed"]).optional(),
        assigneeId: z.number().nullable().optional(),
        assigneeName: z.string().nullable().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(tickets).set(input.data).where(eq(tickets.id, input.id));
      const [updated] = await db.select().from(tickets).where(eq(tickets.id, input.id));
      return updated;
    }),

  respond: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.id));
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      if (ticket.respondedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Already responded" });

      const now = new Date();
      const [type] = await db.select().from(ticketTypes).where(eq(ticketTypes.id, ticket.ticketTypeId));
      const breached = type
        ? (now.getTime() - ticket.createdAt.getTime()) > type.responseTimeHours * 3600_000
        : false;

      await db.update(tickets).set({
        respondedAt: now,
        slaResponseBreached: breached,
        status: "In Progress",
      }).where(eq(tickets.id, input.id));

      const [updated] = await db.select().from(tickets).where(eq(tickets.id, input.id));
      return updated;
    }),

  resolve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.id));
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      if (ticket.resolvedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Already resolved" });

      const now = new Date();
      const [type] = await db.select().from(ticketTypes).where(eq(ticketTypes.id, ticket.ticketTypeId));
      const breached = type
        ? (now.getTime() - ticket.createdAt.getTime()) > type.resolutionTimeHours * 3600_000
        : false;

      await db.update(tickets).set({
        resolvedAt: now,
        slaResolutionBreached: breached,
        status: "Resolved",
      }).where(eq(tickets.id, input.id));

      const [updated] = await db.select().from(tickets).where(eq(tickets.id, input.id));
      return updated;
    }),

  slaSummary: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const allTickets = await db.select().from(tickets)
        .where(eq(tickets.projectId, input.projectId));

      const total = allTickets.length;
      const responseBreached = allTickets.filter(t => t.slaResponseBreached).length;
      const resolutionBreached = allTickets.filter(t => t.slaResolutionBreached).length;
      const open = allTickets.filter(t => t.status === "Open" || t.status === "In Progress" || t.status === "Waiting").length;
      const resolved = allTickets.filter(t => t.status === "Resolved" || t.status === "Closed").length;

      return {
        total,
        open,
        resolved,
        responseBreached,
        resolutionBreached,
        complianceRate: total > 0 ? +((1 - resolutionBreached / total) * 100).toFixed(1) : 100,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(tickets).where(eq(tickets.id, input.id));
      return { success: true };
    }),
});
