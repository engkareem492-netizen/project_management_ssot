import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { meetings, decisions } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

async function getNextId(table: "meetings" | "decisions", projectId: number, prefix: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const tbl = table === "meetings" ? meetings : decisions;
  const idField = table === "meetings" ? meetings.meetingId : decisions.decisionId;
  const existing = await db.select({ id: idField }).from(tbl as typeof meetings)
    .where(eq((tbl as typeof meetings).projectId, projectId))
    .orderBy(desc((tbl as typeof meetings).id));
  let maxNum = 0;
  for (const row of existing) {
    const match = (row.id as string)?.match(/(\d+)$/);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
  }
  return `${prefix}-${String(maxNum + 1).padStart(4, "0")}`;
}

export const meetingsRouter = router({
  // ── Meetings ──────────────────────────────────────────────────────────────
  listMeetings: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(meetings)
        .where(eq(meetings.projectId, input.projectId))
        .orderBy(desc(meetings.meetingDate));
    }),

  getMeeting: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [m] = await db.select().from(meetings).where(eq(meetings.id, input.id));
      return m ?? null;
    }),

  createMeeting: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().min(1),
      meetingDate: z.string(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      location: z.string().optional(),
      organizer: z.string().optional(),
      organizerId: z.number().optional(),
      attendees: z.array(z.string()).optional(),
      agenda: z.string().optional(),
      minutes: z.string().optional(),
      status: z.enum(["Scheduled", "In Progress", "Completed", "Cancelled"]).optional(),
      nextMeetingDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const meetingId = await getNextId("meetings", input.projectId, "MTG");
      const { meetingDate, nextMeetingDate, attendees, ...rest } = input;
      await db.insert(meetings).values({
        ...rest,
        meetingId,
        meetingDate: new Date(meetingDate),
        nextMeetingDate: nextMeetingDate ? new Date(nextMeetingDate) : null,
        attendees: attendees ?? [],
        status: rest.status ?? "Scheduled",
      });
      const [created] = await db.select().from(meetings)
        .where(and(eq(meetings.projectId, input.projectId), eq(meetings.meetingId, meetingId)));
      return created;
    }),

  updateMeeting: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      meetingDate: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      location: z.string().optional(),
      organizer: z.string().optional(),
      attendees: z.array(z.string()).optional(),
      agenda: z.string().optional(),
      minutes: z.string().optional(),
      status: z.enum(["Scheduled", "In Progress", "Completed", "Cancelled"]).optional(),
      nextMeetingDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, meetingDate, nextMeetingDate, ...rest } = input;
      const updateData: Partial<typeof meetings.$inferInsert> = { ...rest };
      if (meetingDate) updateData.meetingDate = new Date(meetingDate);
      if (nextMeetingDate) updateData.nextMeetingDate = new Date(nextMeetingDate);
      await db.update(meetings).set(updateData).where(eq(meetings.id, id));
      const [updated] = await db.select().from(meetings).where(eq(meetings.id, id));
      return updated;
    }),

  deleteMeeting: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(meetings).where(eq(meetings.id, input.id));
      return { success: true };
    }),

  // ── Decisions ─────────────────────────────────────────────────────────────
  listDecisions: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(decisions)
        .where(eq(decisions.projectId, input.projectId))
        .orderBy(desc(decisions.decisionDate));
    }),

  createDecision: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      meetingId: z.number().optional(),
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
      actionItems: z.array(z.object({
        description: z.string(),
        owner: z.string().optional(),
        dueDate: z.string().optional(),
        done: z.boolean().optional(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const decisionId = await getNextId("decisions", input.projectId, "DEC");
      const { decisionDate, actionItems, ...rest } = input;
      await db.insert(decisions).values({
        ...rest,
        decisionId,
        decisionDate: new Date(decisionDate),
        actionItems: actionItems ?? [],
        status: rest.status ?? "Open",
      });
      const [created] = await db.select().from(decisions)
        .where(and(eq(decisions.projectId, input.projectId), eq(decisions.decisionId, decisionId)));
      return created;
    }),

  updateDecision: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      decisionDate: z.string().optional(),
      decidedBy: z.string().optional(),
      status: z.enum(["Open", "Implemented", "Deferred", "Cancelled"]).optional(),
      impact: z.string().optional(),
      requirementId: z.string().optional(),
      taskId: z.string().optional(),
      issueId: z.string().optional(),
      meetingId: z.number().nullable().optional(),
      actionItems: z.array(z.object({
        description: z.string(),
        owner: z.string().optional(),
        dueDate: z.string().optional(),
        done: z.boolean().optional(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, decisionDate, ...rest } = input;
      const updateData: Partial<typeof decisions.$inferInsert> = { ...rest };
      if (decisionDate) updateData.decisionDate = new Date(decisionDate);
      await db.update(decisions).set(updateData).where(eq(decisions.id, id));
      const [updated] = await db.select().from(decisions).where(eq(decisions.id, id));
      return updated;
    }),

  deleteDecision: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(decisions).where(eq(decisions.id, input.id));
      return { success: true };
    }),
});
