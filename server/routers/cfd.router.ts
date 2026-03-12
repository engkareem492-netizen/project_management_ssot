import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { tasks, taskStatusHistory } from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// ── Helper: compute task status counts from live tasks ────────────────────────
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
  // ── Get CFD data: historical snapshots + today's live count ───────────────
  getData: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      days: z.number().optional().default(30), // how many days back to show
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      // Get stored snapshots
      const snapshots = await db.select().from(taskStatusHistory)
        .where(eq(taskStatusHistory.projectId, input.projectId))
        .orderBy(taskStatusHistory.snapshotDate);

      // Compute today's live snapshot
      const live = await computeLiveSnapshot(db, input.projectId);
      const today = new Date().toISOString().split("T")[0];

      // Build series: combine stored + live (deduplicate today)
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

      // Add today's live data
      const liveTotal = live.open + live.inProgress + live.blocked + live.done;
      series.push({
        date: today,
        open: live.open,
        inProgress: live.inProgress,
        blocked: live.blocked,
        done: live.done,
        total: liveTotal,
      });

      // Convert to percentage series for stacked area chart
      const percentSeries = series.map(s => {
        const total = s.total || 1; // avoid division by zero
        return {
          date: s.date,
          open: Math.round((s.open / total) * 100),
          inProgress: Math.round((s.inProgress / total) * 100),
          blocked: Math.round((s.blocked / total) * 100),
          done: Math.round((s.done / total) * 100),
          // raw counts for tooltips
          rawOpen: s.open,
          rawInProgress: s.inProgress,
          rawBlocked: s.blocked,
          rawDone: s.done,
          rawTotal: s.total,
        };
      });

      return {
        series: percentSeries,
        latestCounts: live,
        snapshotCount: snapshots.length,
      };
    }),

  // ── Save a manual snapshot (or auto-snapshot today) ───────────────────────
  saveSnapshot: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      snapshotDate: z.string().optional(), // ISO date string, defaults to today
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const live = await computeLiveSnapshot(db, input.projectId);
      const snapshotDate = input.snapshotDate ?? new Date().toISOString().split("T")[0];

      // Check if snapshot for this date already exists
      const existing = await db.select().from(taskStatusHistory)
        .where(and(
          eq(taskStatusHistory.projectId, input.projectId),
          eq(taskStatusHistory.snapshotDate, snapshotDate)
        ));

      if (existing.length > 0) {
        // Update existing
        return db.update(taskStatusHistory)
          .set({
            statusOpen: live.open,
            statusInProgress: live.inProgress,
            statusBlocked: live.blocked,
            statusDone: live.done,
          })
          .where(eq(taskStatusHistory.id, existing[0].id));
      } else {
        // Insert new
        return db.insert(taskStatusHistory).values({
          projectId: input.projectId,
          snapshotDate,
          statusOpen: live.open,
          statusInProgress: live.inProgress,
          statusBlocked: live.blocked,
          statusDone: live.done,
        });
      }
    }),

  // ── List all snapshots ────────────────────────────────────────────────────
  listSnapshots: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.select().from(taskStatusHistory)
        .where(eq(taskStatusHistory.projectId, input.projectId))
        .orderBy(desc(taskStatusHistory.snapshotDate));
    }),

  // ── Delete a snapshot ─────────────────────────────────────────────────────
  deleteSnapshot: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.delete(taskStatusHistory).where(eq(taskStatusHistory.id, input.id));
    }),
});
