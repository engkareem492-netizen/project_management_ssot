import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { timeLogs } from "../../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export const timeLogsRouter = router({
  list: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      taskId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(timeLogs)
        .where(eq(timeLogs.projectId, input.projectId))
        .orderBy(desc(timeLogs.logDate));
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      taskId: z.number().optional(),
      taskDescription: z.string().optional(),
      loggedBy: z.string().optional(),
      logDate: z.string(),
      hoursLogged: z.number().min(0.1).max(24),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { logDate, hoursLogged, ...rest } = input;
      await db.insert(timeLogs).values({
        ...rest,
        logDate: new Date(logDate),
        hoursLogged: hoursLogged.toString(),
      });
      const [created] = await db.select().from(timeLogs)
        .where(eq(timeLogs.projectId, input.projectId))
        .orderBy(desc(timeLogs.id))
        .limit(1);
      return created;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      hoursLogged: z.number().optional(),
      description: z.string().optional(),
      logDate: z.string().optional(),
      loggedBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, hoursLogged, logDate, ...rest } = input;
      const updateData: any = { ...rest };
      if (hoursLogged !== undefined) updateData.hoursLogged = hoursLogged.toString();
      if (logDate !== undefined) updateData.logDate = new Date(logDate);
      await db.update(timeLogs).set(updateData).where(eq(timeLogs.id, id));
      const [updated] = await db.select().from(timeLogs).where(eq(timeLogs.id, id));
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(timeLogs).where(eq(timeLogs.id, input.id));
      return { success: true };
    }),

  getSummary: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { total: 0, thisWeek: 0, byPerson: [] };
      const logs = await db.select().from(timeLogs)
        .where(eq(timeLogs.projectId, input.projectId));
      const total = logs.reduce((sum, l) => sum + parseFloat(l.hoursLogged as any ?? "0"), 0);
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const thisWeek = logs
        .filter(l => l.logDate && new Date(l.logDate) >= weekStart)
        .reduce((sum, l) => sum + parseFloat(l.hoursLogged as any ?? "0"), 0);
      const byPersonMap: Record<string, number> = {};
      logs.forEach(l => {
        const p = l.loggedBy || "Unknown";
        byPersonMap[p] = (byPersonMap[p] || 0) + parseFloat(l.hoursLogged as any ?? "0");
      });
      const byPerson = Object.entries(byPersonMap).map(([name, hours]) => ({ name, hours }))
        .sort((a, b) => b.hours - a.hours);
      return { total: Math.round(total * 10) / 10, thisWeek: Math.round(thisWeek * 10) / 10, byPerson };
    }),
});
