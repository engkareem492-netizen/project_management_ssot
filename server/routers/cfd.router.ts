import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { tasks, taskStatusHistory } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

async function computeLiveSnapshot(db: Awaited<ReturnType<typeof getDb>>, projectId: number) {
  if (!db) return { open: 0, inProgress: 0, blocked: 0, done: 0 };
  const allTasks = await db.select().from(tasks).where(eq(tasks.projectId, projectId));
  let open = 0, inProgress = 0, blocked = 0, done = 0;
  for (const t of allTasks) {
    const s = (t.status ?? "").toLowerCase();
    if (s === "done" || s === "completed" || s === "closed") done++;
    else if (s === "in progress" || s === "in-progress" || s === "inprogress") inProgress++;
    else if (s === "blocked" || s === "on hold") blocked++;
    else open++;
  }
  return { open, inProgress, blocked, done };
}

export const cfdRouter = router({
  getData: protectedProcedure
    .input(z.object({ projectId: z.number(), days: z.number().optional().default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const snapshots = await db.select().from(taskStatusHistory)
        .where(eq(taskStatusHistory.projectId, input.projectId))
        .orderBy(taskStatusHistory.snapshotDate);
      const live = await computeLiveSnapshot(db, input.projectId);
      const today = new Date().toISOString().split("T")[0];
      const series = snapshots
        .filter(s => s.snapshotDate !== today)
        .map(s => ({
          date: s.snapshotDate,
          open: s.statusOpen,
          inProgress: s.statusInProgress,
          blocked: s.statusBlocked,
          done: s.statusDone,
          total: s.statusOpen + s.statusInProgress + s.statusBlocked + s.statusDone,
        }));
      const liveTotal = live.open + live.inProgress + live.blocked + live.done;
      series.push({ date: today, open: live.open, inProgress: live.inProgress, blocked: live.blocked, done: live.done, total: liveTotal });
      const percentSeries = series.map(s => {
        const total = s.total || 1;
        return {
          date: s.date,
          open: Math.round((s.open / total) * 100),
          inProgress: Math.round((s.inProgress / total) * 100),
          blocked: Math.round((s.blocked / total) * 100),
          done: Math.round((s.done / total) * 100),
          rawOpen: s.open,
          rawInProgress: s.inProgress,
          rawBlocked: s.blocked,
          rawDone: s.done,
          rawTotal: s.total,
        };
      });
      return { series: percentSeries, latestCounts: live, snapshotCount: snapshots.length };
    }),

  saveSnapshot: protectedProcedure
    .input(z.object({ projectId: z.number(), snapshotDate: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const live = await computeLiveSnapshot(db, input.projectId);
      const snapshotDate = input.snapshotDate ?? new Date().toISOString().split("T")[0];
      const existing = await db.select().from(taskStatusHistory)
        .where(and(eq(taskStatusHistory.projectId, input.projectId), eq(taskStatusHistory.snapshotDate, snapshotDate)));
      if (existing.length > 0) {
        return db.update(taskStatusHistory).set({ statusOpen: live.open, statusInProgress: live.inProgress, statusBlocked: live.blocked, statusDone: live.done }).where(eq(taskStatusHistory.id, existing[0].id));
      } else {
        return db.insert(taskStatusHistory).values({ projectId: input.projectId, snapshotDate, statusOpen: live.open, statusInProgress: live.inProgress, statusBlocked: live.blocked, statusDone: live.done });
      }
    }),

  listSnapshots: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.select().from(taskStatusHistory).where(eq(taskStatusHistory.projectId, input.projectId)).orderBy(desc(taskStatusHistory.snapshotDate));
    }),

  deleteSnapshot: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.delete(taskStatusHistory).where(eq(taskStatusHistory.id, input.id));
    }),
});
