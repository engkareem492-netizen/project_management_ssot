import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { evmBaseline, evmSnapshots, evmWbsEntries } from "../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";

function toNum(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? 0 : n;
}

function calcEvm(pv: number, ev: number, ac: number, bac: number) {
  const sv = ev - pv;
  const cv = ev - ac;
  const spi = pv === 0 ? 0 : ev / pv;
  const cpi = ac === 0 ? 0 : ev / ac;
  const eac = cpi === 0 ? bac : bac / cpi;
  const etc = eac - ac;
  const vac = bac - eac;
  const tcpi = (bac - ev) === 0 ? 0 : (bac - ev) / (bac - ac);
  const svPct = bac === 0 ? 0 : (sv / bac) * 100;
  const cvPct = bac === 0 ? 0 : (cv / bac) * 100;
  const percentComplete = bac === 0 ? 0 : (ev / bac) * 100;
  return { sv, cv, spi, cpi, eac, etc, vac, tcpi, svPct, cvPct, percentComplete };
}

export const evmRouter = router({
  getBaseline: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db.select().from(evmBaseline).where(eq(evmBaseline.projectId, input.projectId)).limit(1);
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
      const existing = await db.select().from(evmBaseline).where(eq(evmBaseline.projectId, input.projectId)).limit(1);
      if (existing.length > 0) {
        await db.update(evmBaseline).set({
          bac: input.bac.toString(),
          startDate: input.startDate ?? undefined,
          endDate: input.endDate ?? undefined,
          notes: input.notes ?? undefined,
        }).where(eq(evmBaseline.projectId, input.projectId));
      } else {
        await db.insert(evmBaseline).values({
          projectId: input.projectId,
          bac: input.bac.toString(),
          startDate: input.startDate ?? undefined,
          endDate: input.endDate ?? undefined,
          notes: input.notes ?? undefined,
        });
      }
      const rows = await db.select().from(evmBaseline).where(eq(evmBaseline.projectId, input.projectId)).limit(1);
      return rows[0];
    }),

  listSnapshots: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db.select().from(evmSnapshots).where(eq(evmSnapshots.projectId, input.projectId)).orderBy(asc(evmSnapshots.periodDate));
    }),

  upsertSnapshot: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      id: z.number().optional(),
      periodLabel: z.string(),
      periodDate: z.string(),
      pv: z.number(),
      ev: z.number(),
      ac: z.number(),
      notes: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const payload = {
        projectId: input.projectId,
        periodLabel: input.periodLabel,
        periodDate: input.periodDate,
        pv: input.pv.toString(),
        ev: input.ev.toString(),
        ac: input.ac.toString(),
        notes: input.notes ?? undefined,
      };
      if (input.id) {
        await db.update(evmSnapshots).set(payload).where(eq(evmSnapshots.id, input.id));
        const rows = await db.select().from(evmSnapshots).where(eq(evmSnapshots.id, input.id)).limit(1);
        return rows[0];
      } else {
        const [result] = await db.insert(evmSnapshots).values(payload);
        const rows = await db.select().from(evmSnapshots).where(eq(evmSnapshots.id, (result as { insertId: number }).insertId)).limit(1);
        return rows[0];
      }
    }),

  deleteSnapshot: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(evmSnapshots).where(eq(evmSnapshots.id, input.id));
      return { success: true };
    }),

  listWbsEntries: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db.select().from(evmWbsEntries).where(eq(evmWbsEntries.projectId, input.projectId));
    }),

  upsertWbsEntry: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      id: z.number().optional(),
      wbsCode: z.string().optional(),
      wbsTitle: z.string().optional(),
      bac: z.number(),
      pv: z.number(),
      ev: z.number(),
      ac: z.number(),
      percentComplete: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const payload = {
        projectId: input.projectId,
        wbsCode: input.wbsCode,
        wbsTitle: input.wbsTitle,
        bac: input.bac.toString(),
        pv: input.pv.toString(),
        ev: input.ev.toString(),
        ac: input.ac.toString(),
        percentComplete: input.percentComplete.toString(),
      };
      const existing = input.id
        ? await db.select().from(evmWbsEntries).where(eq(evmWbsEntries.id, input.id)).limit(1)
        : [];
      if (existing.length > 0) {
        await db.update(evmWbsEntries).set(payload).where(eq(evmWbsEntries.id, existing[0].id));
        const rows = await db.select().from(evmWbsEntries).where(eq(evmWbsEntries.id, existing[0].id)).limit(1);
        return rows[0];
      } else {
        const [result] = await db.insert(evmWbsEntries).values(payload);
        const rows = await db.select().from(evmWbsEntries).where(eq(evmWbsEntries.id, (result as { insertId: number }).insertId)).limit(1);
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
      const payload = { projectId: input.projectId, periodLabel: input.periodLabel, periodDate: input.periodDate, pv: input.pv.toString(), ev: input.ev.toString(), ac: input.ac.toString(), notes: input.notes ?? undefined };
      const [result] = await db.insert(evmSnapshots).values(payload);
      const rows = await db.select().from(evmSnapshots).where(eq(evmSnapshots.id, (result as { insertId: number }).insertId)).limit(1);
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
      const { id, pv, ev, ac, ...rest } = input;
      const payload: Record<string, unknown> = { ...rest };
      if (pv !== undefined) payload.pv = pv.toString();
      if (ev !== undefined) payload.ev = ev.toString();
      if (ac !== undefined) payload.ac = ac.toString();
      await db.update(evmSnapshots).set(payload).where(eq(evmSnapshots.id, id));
      const rows = await db.select().from(evmSnapshots).where(eq(evmSnapshots.id, id)).limit(1);
      return rows[0];
    }),

  syncFromWbs: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { wbsElements } = await import("../../drizzle/schema");
      const elements = await db.select().from(wbsElements).where(eq(wbsElements.projectId, input.projectId));
      let synced = 0;
      for (const el of elements) {
        const bac = parseFloat(String(el.estimatedCost ?? 0)) || 0;
        const ac = parseFloat(String(el.actualCost ?? 0)) || 0;
        if (bac === 0 && ac === 0) continue;
        let pct = 0;
        if (el.status === "Complete") pct = 100;
        else if (el.status === "In Progress") pct = 50;
        else if (el.status === "On Hold") pct = 25;
        const ev = bac * (pct / 100);
        const pv = bac;
        const existing = await db.select().from(evmWbsEntries).where(and(eq(evmWbsEntries.projectId, input.projectId), eq(evmWbsEntries.wbsElementId, el.id))).limit(1);
        const payload = { projectId: input.projectId, wbsElementId: el.id, wbsCode: el.code, wbsTitle: el.title, bac: bac.toString(), pv: pv.toString(), ev: ev.toString(), ac: ac.toString(), percentComplete: pct.toString() };
        if (existing.length > 0) { await db.update(evmWbsEntries).set(payload).where(eq(evmWbsEntries.id, existing[0].id)); }
        else { await db.insert(evmWbsEntries).values(payload); }
        synced++;
      }
      return { synced };
    }),

  getDashboard: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const baselineRows = await db.select().from(evmBaseline).where(eq(evmBaseline.projectId, input.projectId)).limit(1);
      const baseline = baselineRows[0] ?? null;
      const bac = toNum(baseline?.bac);
      const snapshots = await db.select().from(evmSnapshots).where(eq(evmSnapshots.projectId, input.projectId)).orderBy(asc(evmSnapshots.periodDate));
      const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
      const latestPv = toNum(latest?.pv);
      const latestEv = toNum(latest?.ev);
      const latestAc = toNum(latest?.ac);
      const kpis = calcEvm(latestPv, latestEv, latestAc, bac);
      const trendSeries = snapshots.map((s) => ({
        period: s.periodLabel,
        date: s.periodDate,
        pv: toNum(s.pv),
        ev: toNum(s.ev),
        ac: toNum(s.ac),
      }));
      const wbsEntries = await db.select().from(evmWbsEntries).where(eq(evmWbsEntries.projectId, input.projectId));
      const wbsBreakdown = wbsEntries.map((e) => {
        const ePv = toNum(e.pv);
        const eEv = toNum(e.ev);
        const eAc = toNum(e.ac);
        const eBac = toNum(e.bac);
        return { id: e.id, wbsCode: e.wbsCode, wbsTitle: e.wbsTitle, bac: eBac, pv: ePv, ev: eEv, ac: eAc, percentComplete: toNum(e.percentComplete), ...calcEvm(ePv, eEv, eAc, eBac) };
      });
      return { baseline, bac, latestSnapshot: latest, pv: latestPv, ev: latestEv, ac: latestAc, ...kpis, trendSeries, wbsBreakdown, snapshotCount: snapshots.length };
    }),
});
