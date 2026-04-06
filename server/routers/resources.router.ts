import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { getDb } from "../db";
import {
  stakeholderSkills,
  stakeholderSuccession,
  stakeholderKpis,
  resourceBreakdownStructure,
  resourceManagementPlan,
  resourceCalendar,
  projectCalendarSettings,
  projectHolidays,
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const resourcesRouter = router({
  getWorkload: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const [stakeholders, tasks, capacities] = await Promise.all([
        db.getAllStakeholders(input.projectId),
        db.getAllTasksSorted(input.projectId),
        db.getResourceCapacities(input.projectId),
      ]);
      return { stakeholders, tasks, capacities };
    }),

  upsertCapacity: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      stakeholderId: z.number(),
      weekStart: z.string(),
      availableHours: z.string(),
    }))
    .mutation(async ({ input }) => {
      await db.upsertResourceCapacity(input.projectId, input.stakeholderId, input.weekStart, input.availableHours);
      return { success: true };
    }),

  /* ── Skills ───────────────────────────────────────────────────────────────────────── */
  listSkills: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return [];
      return dbc.select().from(stakeholderSkills).where(eq(stakeholderSkills.projectId, input.projectId));
    }),

  upsertSkill: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      projectId: z.number(),
      stakeholderId: z.number(),
      skillName: z.string(),
      proficiencyLevel: z.string().default("Intermediate"),
      developmentPlanNote: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return { id: 0 };
      const { id, ...data } = input;
      if (id) {
        await dbc.update(stakeholderSkills).set(data as any).where(eq(stakeholderSkills.id, id));
        return { id };
      }
      const [row] = await dbc.insert(stakeholderSkills).values(data as any);
      return { id: (row as any).insertId };
    }),

  deleteSkill: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return;
      await dbc.delete(stakeholderSkills).where(eq(stakeholderSkills.id, input.id));
    }),

  /* ── KPIs (using existing stakeholderKpis table) ───────────────────────────────────── */
  listKPIs: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return [];
      return dbc.select().from(stakeholderKpis).where(eq(stakeholderKpis.projectId, input.projectId));
    }),

  upsertKPI: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      projectId: z.number(),
      stakeholderId: z.number(),
      name: z.string(),
      description: z.string().optional(),
      target: z.string().optional(),
      unit: z.string().optional(),
      weight: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return { id: 0 };
      const { id, ...data } = input;
      if (id) {
        await dbc.update(stakeholderKpis).set(data as any).where(eq(stakeholderKpis.id, id));
        return { id };
      }
      const [row] = await dbc.insert(stakeholderKpis).values(data as any);
      return { id: (row as any).insertId };
    }),

  deleteKPI: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return;
      await dbc.delete(stakeholderKpis).where(eq(stakeholderKpis.id, input.id));
    }),

  /* ── Succession / Delegation flags ──────────────────────────────────────────── */
  updateSuccession: protectedProcedure
    .input(z.object({
      id: z.number(),
      needsSuccessionPlan: z.boolean(),
      hasDelegation: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return;
      await dbc.update(stakeholderSuccession)
        .set({ requiresSuccessionPlan: input.needsSuccessionPlan, requiresDelegation: input.hasDelegation } as any)
        .where(eq(stakeholderSuccession.stakeholderId, input.id));
    }),

  getSuccession: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return [];
      return dbc.select().from(stakeholderSuccession).where(eq(stakeholderSuccession.projectId, input.projectId));
    }),

  upsertSuccession: protectedProcedure
    .input(z.object({
      stakeholderId: z.number(),
      projectId: z.number(),
      requiresSuccessionPlan: z.boolean().default(false),
      requiresDelegation: z.boolean().default(false),
      successorName: z.string().optional(),
      delegateName: z.string().optional(),
      successionNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return;
      const existing = await dbc.select({ id: stakeholderSuccession.id }).from(stakeholderSuccession)
        .where(eq(stakeholderSuccession.stakeholderId, input.stakeholderId));
      if (existing.length > 0) {
        await dbc.update(stakeholderSuccession).set(input as any).where(eq(stakeholderSuccession.stakeholderId, input.stakeholderId));
      } else {
        await dbc.insert(stakeholderSuccession).values(input as any);
      }
    }),

  /* ── RBS ─────────────────────────────────────────────────────────────────────────── */
  listRBS: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return [];
      return dbc.select().from(resourceBreakdownStructure).where(eq(resourceBreakdownStructure.projectId, input.projectId));
    }),

  upsertRBS: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      projectId: z.number(),
      code: z.string(),
      name: z.string(),
      type: z.string().default("Human"),
      parentId: z.number().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return { id: 0 };
      const { id, ...data } = input;
      if (id) {
        await dbc.update(resourceBreakdownStructure).set(data as any).where(eq(resourceBreakdownStructure.id, id));
        return { id };
      }
      const [row] = await dbc.insert(resourceBreakdownStructure).values(data as any);
      return { id: (row as any).insertId };
    }),

  deleteRBS: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return;
      await dbc.delete(resourceBreakdownStructure).where(eq(resourceBreakdownStructure.id, input.id));
    }),

  /* ── Resource Management Plan ─────────────────────────────────────────────── */
  getRMP: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return null;
      const [row] = await dbc.select().from(resourceManagementPlan).where(eq(resourceManagementPlan.projectId, input.projectId));
      return row ?? null;
    }),

  upsertRMP: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      acquisitionStrategy: z.string().optional(),
      releaseStrategy: z.string().optional(),
      trainingNeeds: z.string().optional(),
      recognitionRewards: z.string().optional(),
      complianceRequirements: z.string().optional(),
      safetyConsiderations: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return;
      const existing = await dbc.select({ id: resourceManagementPlan.id }).from(resourceManagementPlan).where(eq(resourceManagementPlan.projectId, input.projectId));
      if (existing.length > 0) {
        await dbc.update(resourceManagementPlan).set(input as any).where(eq(resourceManagementPlan.projectId, input.projectId));
      } else {
        await dbc.insert(resourceManagementPlan).values(input as any);
      }
    }),

  /* ── Resource Calendar ───────────────────────────────────────────────────────────── */
  listCalendar: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return [];
      return dbc.select().from(resourceCalendar).where(eq(resourceCalendar.projectId, input.projectId));
    }),

  upsertCalendar: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      projectId: z.number(),
      stakeholderId: z.number(),
      entryDate: z.string(),
      availabilityPct: z.number().default(100),
      type: z.string().default("Leave"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return { id: 0 };
      const { id, ...data } = input;
      if (id) {
        await dbc.update(resourceCalendar).set(data as any).where(eq(resourceCalendar.id, id));
        return { id };
      }
      const [row] = await dbc.insert(resourceCalendar).values(data as any);
      return { id: (row as any).insertId };
    }),

  deleteCalendar: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return;
      await dbc.delete(resourceCalendar).where(eq(resourceCalendar.id, input.id));
    }),

  /* ── Project Calendar Settings (weekend days) ──────────────────────────────────── */
  getCalendarSettings: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return { weekendDays: [0, 6] };
      const [row] = await dbc.select().from(projectCalendarSettings).where(eq(projectCalendarSettings.projectId, input.projectId));
      if (!row) return { weekendDays: [0, 6] };
      return { weekendDays: row.weekendDays.split(',').map(Number) };
    }),

  upsertCalendarSettings: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      weekendDays: z.array(z.number()), // e.g. [5, 6] for Fri+Sat
    }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return;
      const weekendDaysStr = input.weekendDays.join(',');
      const existing = await dbc.select({ id: projectCalendarSettings.id }).from(projectCalendarSettings)
        .where(eq(projectCalendarSettings.projectId, input.projectId));
      if (existing.length > 0) {
        await dbc.update(projectCalendarSettings).set({ weekendDays: weekendDaysStr } as any)
          .where(eq(projectCalendarSettings.projectId, input.projectId));
      } else {
        await dbc.insert(projectCalendarSettings).values({ projectId: input.projectId, weekendDays: weekendDaysStr } as any);
      }
    }),

  /* ── Project Holidays ───────────────────────────────────────────────────────────────── */
  listHolidays: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return [];
      return dbc.select().from(projectHolidays).where(eq(projectHolidays.projectId, input.projectId));
    }),

  bulkAddHolidays: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      holidays: z.array(z.object({
        name: z.string(),
        date: z.string(),
        recurring: z.boolean().default(false),
        source: z.string().default('custom'),
      })),
    }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return;
      for (const h of input.holidays) {
        await dbc.insert(projectHolidays).values({ ...h, projectId: input.projectId } as any)
          .onDuplicateKeyUpdate({ set: { name: h.name } });
      }
    }),

  deleteHoliday: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return;
      await dbc.delete(projectHolidays).where(eq(projectHolidays.id, input.id));
    }),

  /* ── Scheduling Helpers ──────────────────────────────────────────────────────────── */
  /**
   * Calculate active man-hours for a stakeholder between two dates,
   * based on their Resource Calendar entries and project weekend settings.
   * Used by Tasks page for Date-Based scheduling (start+end → active hours).
   */
  calculateActiveHours: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      stakeholderId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
      hoursPerDay: z.number().default(8),
    }))
    .query(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return { activeHours: 0, workingDays: 0 };
      const [calSettings] = await dbc.select().from(projectCalendarSettings)
        .where(eq(projectCalendarSettings.projectId, input.projectId));
      const weekendDays = new Set(
        (calSettings?.weekendDays ?? '0,6').split(',').map(Number)
      );
      const entries = await dbc.select().from(resourceCalendar)
        .where(and(
          eq(resourceCalendar.projectId, input.projectId),
          eq(resourceCalendar.stakeholderId, input.stakeholderId)
        ));
      const entryMap: Record<string, { type: string; availableHours: number }> = {};
      entries.forEach((e: any) => {
        const dk = e.date instanceof Date ? e.date.toISOString().split('T')[0] : String(e.date).split('T')[0];
        entryMap[dk] = { type: e.type, availableHours: Number(e.availableHours ?? 0) };
      });
      let totalHours = 0;
      let workingDays = 0;
      const hpd = input.hoursPerDay;
      const cur = new Date(input.startDate + 'T00:00:00');
      const end = new Date(input.endDate + 'T00:00:00');
      while (cur <= end) {
        const dk = cur.toISOString().split('T')[0];
        const dow = cur.getDay();
        const isWeekend = weekendDays.has(dow);
        const entry = entryMap[dk];
        if (entry) {
          const { type, availableHours } = entry;
          if (type === 'Leave' || type === 'Holiday') {
            const leaveHours = availableHours > 0 ? availableHours : hpd;
            const remaining = Math.max(hpd - leaveHours, 0);
            totalHours += remaining;
            if (remaining > 0) workingDays++;
          } else if (type === 'Partial') {
            const hrs = availableHours > 0 ? availableHours : hpd;
            totalHours += hrs;
            workingDays++;
          } else {
            totalHours += hpd;
            workingDays++;
          }
        } else if (!isWeekend) {
          totalHours += hpd;
          workingDays++;
        }
        cur.setDate(cur.getDate() + 1);
      }
      return { activeHours: totalHours, workingDays };
    }),

  /**
   * Calculate the end date for effort-based scheduling:
   * given a start date and required active hours, find the date
   * when those hours are exhausted based on the resource calendar.
   */
  calculateEndDate: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      stakeholderId: z.number(),
      startDate: z.string(),
      activeHours: z.number(),
      hoursPerDay: z.number().default(8),
    }))
    .query(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return { endDate: input.startDate };
      const [calSettings] = await dbc.select().from(projectCalendarSettings)
        .where(eq(projectCalendarSettings.projectId, input.projectId));
      const weekendDays = new Set(
        (calSettings?.weekendDays ?? '0,6').split(',').map(Number)
      );
      const entries = await dbc.select().from(resourceCalendar)
        .where(and(
          eq(resourceCalendar.projectId, input.projectId),
          eq(resourceCalendar.stakeholderId, input.stakeholderId)
        ));
      const entryMap: Record<string, { type: string; availableHours: number }> = {};
      entries.forEach((e: any) => {
        const dk = e.date instanceof Date ? e.date.toISOString().split('T')[0] : String(e.date).split('T')[0];
        entryMap[dk] = { type: e.type, availableHours: Number(e.availableHours ?? 0) };
      });
      let remaining = input.activeHours;
      const hpd = input.hoursPerDay;
      const cur = new Date(input.startDate + 'T00:00:00');
      const maxDate = new Date(cur);
      maxDate.setFullYear(maxDate.getFullYear() + 2);
      while (remaining > 0 && cur <= maxDate) {
        const dk = cur.toISOString().split('T')[0];
        const dow = cur.getDay();
        const isWeekend = weekendDays.has(dow);
        const entry = entryMap[dk];
        let dayHours = 0;
        if (entry) {
          const { type, availableHours } = entry;
          if (type === 'Leave' || type === 'Holiday') {
            const leaveHours = availableHours > 0 ? availableHours : hpd;
            dayHours = Math.max(hpd - leaveHours, 0);
          } else if (type === 'Partial') {
            dayHours = availableHours > 0 ? availableHours : hpd;
          } else {
            dayHours = hpd;
          }
        } else if (!isWeekend) {
          dayHours = hpd;
        }
        remaining -= dayHours;
        if (remaining > 0) cur.setDate(cur.getDate() + 1);
      }
      return { endDate: cur.toISOString().split('T')[0] };
    }),
});
