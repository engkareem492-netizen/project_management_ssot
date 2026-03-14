import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { evmBaseline, evmSnapshots, evmWbsEntries, wbsElements } from "../../drizzle/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ─── EVM Calculation Helpers ──────────────────────────────────────────────────

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

/** Convert a string date (YYYY-MM-DD) or null to a SQL-safe value for a date column */
function toDateOrNull(val: string | null | undefined): string | null {
  if (!val) return null;
  return val; // MySQL accepts 'YYYY-MM-DD' strings for date columns via Drizzle
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const evmRouter = router({

  // ── Baseline CRUD ──────────────────────────────────────────────────────────

  getBaseline: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
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
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const existing = await db
        .select()
        .from(evmBaseline)
        .where(eq(evmBaseline.projectId, input.projectId))
        .limit(1);

      const startDate = toDateOrNull(input.startDate);
      const endDate = toDateOrNull(input.endDate);

      if (existing.length > 0) {
        await db
          .update(evmBaseline)
          .set({
            bac: input.bac.toString(),
            ...(startDate !== undefined ? { startDate: startDate as any } : {}),
            ...(endDate !== undefined ? { endDate: endDate as any } : {}),
            notes: input.notes ?? undefined,
          })
          .where(eq(evmBaseline.projectId, input.projectId));
      } else {
        await db.insert(evmBaseline).values({
          projectId: input.projectId,
          bac: input.bac.toString(),
          startDate: startDate as any,
          endDate: endDate as any,
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
      if (!db) return [];
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
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [result] = await db.insert(evmSnapshots).values({
        projectId: input.projectId,
        periodLabel: input.periodLabel,
        periodDate: input.periodDate as any,
        pv: input.pv.toString(),
        ev: input.ev.toString(),
        ac: input.ac.toString(),
        notes: input.notes ?? undefined,
      });
      const rows = await db
        .select()
        .from(evmSnapshots)
        .where(eq(evmSnapshots.id, (result as any).insertId))
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
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
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
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(evmSnapshots).where(eq(evmSnapshots.id, input.id));
      return { success: true };
    }),

  // ── WBS Entries CRUD ───────────────────────────────────────────────────────

  listWbsEntries: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
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
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
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
        const rows = await db.select().from(evmWbsEntries).where(eq(evmWbsEntries.id, (result as any).insertId)).limit(1);
        return rows[0];
      }
    }),

  deleteWbsEntry: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(evmWbsEntries).where(eq(evmWbsEntries.id, input.id));
      return { success: true };
    }),

  // ── Computed Dashboard ─────────────────────────────────────────────────────

  getDashboard: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const baselineRows = await db
        .select()
        .from(evmBaseline)
        .where(eq(evmBaseline.projectId, input.projectId))
        .limit(1);
      const baseline = baselineRows[0] ?? null;
      const bac = toNum(baseline?.bac);

      const snapshots = await db
        .select()
        .from(evmSnapshots)
        .where(eq(evmSnapshots.projectId, input.projectId))
        .orderBy(asc(evmSnapshots.periodDate));

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
          ...eKpis,
          percentComplete: toNum(e.percentComplete), // override calcEvm's derived value with stored value
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

  syncFromWbs: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const elements = await db
        .select()
        .from(wbsElements)
        .where(eq(wbsElements.projectId, input.projectId));

      let synced = 0;
      for (const el of elements) {
        const bac = toNum(el.estimatedCost);
        const ac = toNum(el.actualCost);
        if (bac === 0 && ac === 0) continue;

        let pct = 0;
        if (el.status === "Complete") pct = 100;
        else if (el.status === "In Progress") pct = 50;
        else if (el.status === "On Hold") pct = 25;

        const ev = bac * (pct / 100);
        const pv = bac;

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
