import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import { communicationLog } from "../../drizzle/schema";

export const communicationLogRouter = router({
  // List all log entries for a project, newest first
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(communicationLog)
        .where(eq(communicationLog.projectId, input.projectId))
        .orderBy(desc(communicationLog.logDate), desc(communicationLog.createdAt));
    }),

  // Create a new log entry
  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      logDate: z.string(), // ISO date string YYYY-MM-DD
      communicationType: z.string().optional(),
      subject: z.string(),
      sentBy: z.string().optional(),
      recipients: z.string().optional(),
      method: z.string().optional(),
      summary: z.string().optional(),
      linkedCommPlanEntryId: z.number().optional(),
      attachmentUrl: z.string().optional(),
      notes: z.string().optional(),
      createdBy: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const { projectId, logDate, ...rest } = input;

      const result = await db.insert(communicationLog).values({
        projectId,
        logDate: logDate as any, // drizzle date column accepts string
        ...rest,
      });

      const insertId: number = (result as any)[0]?.insertId ?? (result as any).insertId;

      const rows = await db
        .select()
        .from(communicationLog)
        .where(eq(communicationLog.id, insertId))
        .limit(1);

      return rows[0];
    }),

  // Update an existing log entry
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      logDate: z.string().optional(),
      communicationType: z.string().nullable().optional(),
      subject: z.string().optional(),
      sentBy: z.string().nullable().optional(),
      recipients: z.string().nullable().optional(),
      method: z.string().nullable().optional(),
      summary: z.string().nullable().optional(),
      linkedCommPlanEntryId: z.number().nullable().optional(),
      attachmentUrl: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const { id, logDate, ...rest } = input;

      const updateData: Record<string, any> = { ...rest };
      if (logDate !== undefined) {
        updateData.logDate = logDate;
      }

      await db
        .update(communicationLog)
        .set(updateData)
        .where(eq(communicationLog.id, id));

      const rows = await db
        .select()
        .from(communicationLog)
        .where(eq(communicationLog.id, id))
        .limit(1);

      return rows[0];
    }),

  // Delete a log entry
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      await db
        .delete(communicationLog)
        .where(eq(communicationLog.id, input.id));

      return { success: true };
    }),
});
