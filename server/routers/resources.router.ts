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
} from "../../drizzle/schema";
import { eq } from "drizzle-orm";

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
        .set({ requiresSuccessionPlan: input.needsSuccessionPlan, requiresDelegation: input.hasDelegation })
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
});
