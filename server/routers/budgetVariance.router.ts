import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

/**
 * Budget Variance Analysis + Earned Value Management (EVM) router.
 *
 * EVM Metrics:
 *   PV  = Planned Value       (budgeted cost of work scheduled)
 *   EV  = Earned Value        (budgeted cost of work performed = % complete × BAC)
 *   AC  = Actual Cost         (actual cost of work performed)
 *   BAC = Budget at Completion
 *   CV  = EV - AC             (cost variance)
 *   SV  = EV - PV             (schedule variance)
 *   CPI = EV / AC             (cost performance index)
 *   SPI = EV / PV             (schedule performance index)
 *   EAC = BAC / CPI           (estimate at completion)
 *   ETC = EAC - AC            (estimate to complete)
 *   VAC = BAC - EAC           (variance at completion)
 */
export const budgetVarianceRouter = router({
  evmMetrics: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const { projectId } = input;

      const [budgetData, entries, tasks] = await Promise.all([
        db.getProjectBudget(projectId),
        db.getBudgetEntries(projectId),
        db.getAllTasksSorted(projectId),
      ]);

      const BAC = parseFloat(budgetData?.totalBudget ?? "0");
      const AC = entries.reduce((s, e) => s + parseFloat(e.actualCost ?? "0"), 0);
      const PV = entries.reduce((s, e) => s + parseFloat(e.estimatedCost ?? "0"), 0);

      // EV: derive from task completion percentage
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t =>
        t.status === "Done" || t.currentStatus === "Completed"
      ).length;
      const percentComplete = totalTasks > 0 ? completedTasks / totalTasks : 0;
      const EV = BAC * percentComplete;

      const CV = EV - AC;
      const SV = EV - PV;
      const CPI = AC > 0 ? EV / AC : null;
      const SPI = PV > 0 ? EV / PV : null;
      const EAC = CPI && CPI > 0 ? BAC / CPI : BAC - EV + AC;
      const ETC = EAC - AC;
      const VAC = BAC - EAC;

      return {
        BAC,
        PV,
        EV: +EV.toFixed(2),
        AC,
        CV: +CV.toFixed(2),
        SV: +SV.toFixed(2),
        CPI: CPI ? +CPI.toFixed(3) : null,
        SPI: SPI ? +SPI.toFixed(3) : null,
        EAC: +EAC.toFixed(2),
        ETC: +ETC.toFixed(2),
        VAC: +VAC.toFixed(2),
        percentComplete: +(percentComplete * 100).toFixed(1),
        completedTasks,
        totalTasks,
        health: deriveHealth(CPI, SPI),
      };
    }),

  // Per-category variance breakdown
  categoryVariance: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const entries = await db.getBudgetEntries(input.projectId);

      const categories: Record<string, { estimated: number; actual: number; variance: number; items: number }> = {};
      for (const e of entries) {
        const cat = e.category ?? "Uncategorized";
        categories[cat] ??= { estimated: 0, actual: 0, variance: 0, items: 0 };
        const est = parseFloat(e.estimatedCost ?? "0");
        const act = parseFloat(e.actualCost ?? "0");
        categories[cat].estimated += est;
        categories[cat].actual += act;
        categories[cat].variance += est - act;
        categories[cat].items++;
      }

      return Object.entries(categories).map(([category, v]) => ({
        category,
        ...v,
        variancePct: v.estimated > 0 ? +((v.variance / v.estimated) * 100).toFixed(1) : 0,
      }));
    }),

  // Monthly burn rate
  burnRate: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const entries = await db.getBudgetEntries(input.projectId);

      // Group by month based on createdAt (fall back to current month)
      const monthly: Record<string, number> = {};
      for (const e of entries) {
        const d = (e as any).createdAt ? new Date((e as any).createdAt) : new Date();
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthly[key] = (monthly[key] ?? 0) + parseFloat(e.actualCost ?? "0");
      }

      const sorted = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b));
      const avgBurn = sorted.length > 0
        ? sorted.reduce((s, [, v]) => s + v, 0) / sorted.length
        : 0;

      return {
        monthly: sorted.map(([month, actual]) => ({ month, actual })),
        avgMonthlyBurn: +avgBurn.toFixed(2),
      };
    }),
});

function deriveHealth(cpi: number | null, spi: number | null): "Green" | "Amber" | "Red" {
  if (cpi === null || spi === null) return "Amber";
  if (cpi >= 0.95 && spi >= 0.95) return "Green";
  if (cpi >= 0.8 && spi >= 0.8) return "Amber";
  return "Red";
}
