import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { evmBaseline, evmSnapshots, evmWbsEntries, wbsElements } from "../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";

// ─── EVM Calculation Helpers ──────────────────────────────────────────────────

function toNum(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? 0 : n;
}

function calcEvm(pv: number, ev: number, ac: number, bac: number) {
  const sv = ev - pv;                                   // Schedule Variance
  const cv = ev - ac;                                   // Cost Variance
  const spi = pv === 0 ? 0 : ev / pv;                  // Schedule Performance Index
  const cpi = ac === 0 ? 0 : ev / ac;                  // Cost Performance Index
  const eac = cpi === 0 ? bac : bac / cpi;             // Estimate At Completion
  const etc = eac - ac;                                 // Estimate To Complete
  const vac = bac - eac;                                // Variance At Completion
  const tcpi = (bac - ev) === 0 ? 0 : (bac - ev) / (bac - ac); // To-Complete Performance Index
  const svPct = bac === 0 ? 0 : (sv / bac) * 100;
  const cvPct = bac === 0 ? 0 : (cv / bac) * 100;
  const percentComplete = bac === 0 ? 0 : (ev / bac) * 100;
  return { sv, cv, spi, cpi, eac, etc, vac, tcpi, svPct, cvPct, percentComplete };
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const evmRouter = router({

  // ── Baseline CRUD ──────────────────────────────────────────────────────────

  getBaseline: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db
        .select()
        .from(evmBaseline)
        .where(eq(evmBaseline.projectId, input.projectId))
        .limit(1);
      return rows[0] ?? null;
    }),

  upsertBaseline: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      bac: z.number(),
      startDate: z.string().optional().nullable(),
      endDate: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const existing = await db
        .select()
        .from(evmBaseline)
        .where(eq(evmBaseline.projectId, input.projectId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(evmBaseline)
          .set({
            bac: input.bac.toString(),
            startDate: input.startDate ?? undefined,
            endDate: input.endDate ?? undefined,
            notes: input.notes ?? undefined,
          })
          .where(eq(evmBaseline.projectId, input.projectId));
      } else {
        await db.insert(evmBaseline).values({
          projectId: input.projectId,
          bac: input.bac.toString(),
          startDate: input.startDate ?? undefined,
          endDate: input.endDate ?? undefined,
          notes: input.notes ?? undefined,
        });
      }
      const rows = await db
        .select()
        .from(evmBaseline)
        .where(eq(evmBaseline.projectId, input.projectId))
        .limit(1);
      return rows[0];
    }),

  // ── Snapshots CRUD ─────────────────────────────────────────────────────────

  listSnapshots: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db
        .select()
        .from(evmSnapshots)
        .where(eq(evmSnapshots.projectId, input.projectId))
        .orderBy(asc(evmSnapshots.periodDate));
    }),

  createSnapshot: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      periodLabel: z.string(),
      periodDate: z.string(),
      pv: z.number(),
      ev: z.number(),
      ac: z.number(),
      notes: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [result] = await db.insert(evmSnapshots).values({
        projectId: input.projectId,
        periodLabel: input.periodLabel,
        periodDate: input.periodDate,
        pv: input.pv.toString(),
        ev: input.ev.toString(),
        ac: input.ac.toString(),
        notes: input.notes ?? undefined,
      });
      const rows = await db
        .select()
        .from(evmSnapshots)
        .where(eq(evmSnapshots.id, result.insertId))
        .limit(1);
      return rows[0];
    }),

  updateSnapshot: protectedProcedure
    .input(z.object({
      id: z.number(),
      periodLabel: z.string().optional(),
      periodDate: z.string().optional(),
      pv: z.number().optional(),
      ev: z.number().optional(),
      ac: z.number().optional(),
      notes: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.periodLabel !== undefined) updateData.periodLabel = data.periodLabel;
      if (data.periodDate !== undefined) updateData.periodDate = data.periodDate;
      if (data.pv !== undefined) updateData.pv = data.pv.toString();
      if (data.ev !== undefined) updateData.ev = data.ev.toString();
      if (data.ac !== undefined) updateData.ac = data.ac.toString();
      if (data.notes !== undefined) updateData.notes = data.notes;
      await db.update(evmSnapshots).set(updateData).where(eq(evmSnapshots.id, id));
      const rows = await db.select().from(evmSnapshots).where(eq(evmSnapshots.id, id)).limit(1);
      return rows[0];
    }),

  deleteSnapshot: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(evmSnapshots).where(eq(evmSnapshots.id, input.id));
      return { success: true };
    }),

  // ── WBS Entries CRUD ───────────────────────────────────────────────────────

  listWbsEntries: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db
        .select()
        .from(evmWbsEntries)
        .where(eq(evmWbsEntries.projectId, input.projectId));
    }),

  upsertWbsEntry: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      wbsElementId: z.number().optional().nullable(),
      wbsCode: z.string().optional().nullable(),
      wbsTitle: z.string().optional().nullable(),
      bac: z.number(),
      pv: z.number(),
      ev: z.number(),
      ac: z.number(),
      percentComplete: z.number().min(0).max(100),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      // Check if entry exists for this wbsElementId or wbsCode
      let existing = null;
      if (input.wbsElementId) {
        const rows = await db
          .select()
          .from(evmWbsEntries)
          .where(and(
            eq(evmWbsEntries.projectId, input.projectId),
            eq(evmWbsEntries.wbsElementId, input.wbsElementId)
          ))
          .limit(1);
        existing = rows[0] ?? null;
      }
      const payload = {
        projectId: input.projectId,
        wbsElementId: input.wbsElementId ?? undefined,
        wbsCode: input.wbsCode ?? undefined,
        wbsTitle: input.wbsTitle ?? undefined,
        bac: input.bac.toString(),
        pv: input.pv.toString(),
        ev: input.ev.toString(),
        ac: input.ac.toString(),
        percentComplete: input.percentComplete.toString(),
      };
      if (existing) {
        await db.update(evmWbsEntries).set(payload).where(eq(evmWbsEntries.id, existing.id));
        const rows = await db.select().from(evmWbsEntries).where(eq(evmWbsEntries.id, existing.id)).limit(1);
        return rows[0];
      } else {
        const [result] = await db.insert(evmWbsEntries).values(payload);
        const rows = await db.select().from(evmWbsEntries).where(eq(evmWbsEntries.id, result.insertId)).limit(1);
        return rows[0];
      }
    }),

  deleteWbsEntry: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(evmWbsEntries).where(eq(evmWbsEntries.id, input.id));
      return { success: true };
    }),

  // ── Computed Dashboard ─────────────────────────────────────────────────────
  // Returns baseline + latest snapshot KPIs + trend series + WBS breakdown

  getDashboard: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();

      // 1. Baseline
      const baselineRows = await db
        .select()
        .from(evmBaseline)
        .where(eq(evmBaseline.projectId, input.projectId))
        .limit(1);
      const baseline = baselineRows[0] ?? null;
      const bac = toNum(baseline?.bac);

      // 2. All snapshots (ordered by date)
      const snapshots = await db
        .select()
        .from(evmSnapshots)
        .where(eq(evmSnapshots.projectId, input.projectId))
        .orderBy(asc(evmSnapshots.periodDate));

      // 3. Latest snapshot KPIs
      const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
      const latestPv = toNum(latest?.pv);
      const latestEv = toNum(latest?.ev);
      const latestAc = toNum(latest?.ac);
      const kpis = calcEvm(latestPv, latestEv, latestAc, bac);

      // 4. Trend series for S-curve chart
      const trendSeries = snapshots.map((s) => ({
        period: s.periodLabel,
        date: s.periodDate,
        pv: toNum(s.pv),
        ev: toNum(s.ev),
        ac: toNum(s.ac),
      }));

      // 5. WBS breakdown with per-element KPIs
      const wbsEntries = await db
        .select()
        .from(evmWbsEntries)
        .where(eq(evmWbsEntries.projectId, input.projectId));

      const wbsBreakdown = wbsEntries.map((e) => {
        const ePv = toNum(e.pv);
        const eEv = toNum(e.ev);
        const eAc = toNum(e.ac);
        const eBac = toNum(e.bac);
        const eKpis = calcEvm(ePv, eEv, eAc, eBac);
        return {
          id: e.id,
          wbsElementId: e.wbsElementId,
          wbsCode: e.wbsCode,
          wbsTitle: e.wbsTitle,
          bac: eBac,
          pv: ePv,
          ev: eEv,
          ac: eAc,
          percentComplete: toNum(e.percentComplete),
          ...eKpis,
        };
      });

      return {
        baseline,
        bac,
        latestSnapshot: latest,
        pv: latestPv,
        ev: latestEv,
        ac: latestAc,
        ...kpis,
        trendSeries,
        wbsBreakdown,
        snapshotCount: snapshots.length,
      };
    }),

  // ── Sync WBS cost data into EVM entries ────────────────────────────────────
  // Pulls estimatedCost/actualCost from wbsElements and creates/updates evmWbsEntries

  syncFromWbs: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const elements = await db
        .select()
        .from(wbsElements)
        .where(eq(wbsElements.projectId, input.projectId));

      let synced = 0;
      for (const el of elements) {
        const bac = toNum(el.estimatedCost);
        const ac = toNum(el.actualCost);
        if (bac === 0 && ac === 0) continue;

        // Derive % complete from status
        let pct = 0;
        if (el.status === "Complete") pct = 100;
        else if (el.status === "In Progress") pct = 50;
        else if (el.status === "On Hold") pct = 25;

        const ev = bac * (pct / 100);
        const pv = bac; // simplified: PV = BAC (full budget planned)

        // Upsert
        const existing = await db
          .select()
          .from(evmWbsEntries)
          .where(and(
            eq(evmWbsEntries.projectId, input.projectId),
            eq(evmWbsEntries.wbsElementId, el.id)
          ))
          .limit(1);

        const payload = {
          projectId: input.projectId,
          wbsElementId: el.id,
          wbsCode: el.code,
          wbsTitle: el.title,
          bac: bac.toString(),
          pv: pv.toString(),
          ev: ev.toString(),
          ac: ac.toString(),
          percentComplete: pct.toString(),
        };

        if (existing.length > 0) {
          await db.update(evmWbsEntries).set(payload).where(eq(evmWbsEntries.id, existing[0].id));
        } else {
          await db.insert(evmWbsEntries).values(payload);
        }
        synced++;
      }
      return { synced };
    }),
});
