import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  stakeholderSwot,
  stakeholderKpis,
  stakeholderAssessments,
  stakeholderKpiScores,
  developmentPlans,
  resourceAbsences,
  resourceAllocations,
  stakeholders,
} from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ─── SWOT ─────────────────────────────────────────────────────────────────────
const swotRouter = router({
  list: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.select().from(stakeholderSwot)
        .where(eq(stakeholderSwot.stakeholderId, input.stakeholderId))
        .orderBy(stakeholderSwot.quadrant, stakeholderSwot.createdAt);
    }),
  create: protectedProcedure
    .input(z.object({
      stakeholderId: z.number(),
      quadrant: z.enum(["Strength", "Weakness", "Opportunity", "Threat"]),
      description: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const result = await db.insert(stakeholderSwot).values(input);
      const rows = await db.select().from(stakeholderSwot)
        .where(eq(stakeholderSwot.id, result[0].insertId)).limit(1);
      return rows[0];
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      description: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.update(stakeholderSwot)
        .set({ description: input.description })
        .where(eq(stakeholderSwot.id, input.id));
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.delete(stakeholderSwot).where(eq(stakeholderSwot.id, input.id));
      return { success: true };
    }),
});

// ─── KPIs ─────────────────────────────────────────────────────────────────────
const kpiRouter = router({
  list: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.select().from(stakeholderKpis)
        .where(eq(stakeholderKpis.stakeholderId, input.stakeholderId))
        .orderBy(stakeholderKpis.createdAt);
    }),
  create: protectedProcedure
    .input(z.object({
      stakeholderId: z.number(),
      projectId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      target: z.string().optional(),
      unit: z.string().optional(),
      weight: z.number().default(1),
      linkedSkillId: z.number().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const result = await db.insert(stakeholderKpis).values(input);
      const rows = await db.select().from(stakeholderKpis)
        .where(eq(stakeholderKpis.id, result[0].insertId)).limit(1);
      return rows[0];
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      target: z.string().optional(),
      unit: z.string().optional(),
      weight: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const { id, ...data } = input;
      await db.update(stakeholderKpis).set(data).where(eq(stakeholderKpis.id, id));
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      // Delete scores first
      const assessments = await db.select({ id: stakeholderAssessments.id })
        .from(stakeholderAssessments)
        .where(eq(stakeholderAssessments.stakeholderId,
          (await db.select({ sid: stakeholderKpis.stakeholderId })
            .from(stakeholderKpis).where(eq(stakeholderKpis.id, input.id)).limit(1))[0]?.sid ?? 0
        ));
      for (const a of assessments) {
        await db.delete(stakeholderKpiScores)
          .where(and(eq(stakeholderKpiScores.assessmentId, a.id), eq(stakeholderKpiScores.kpiId, input.id)));
      }
      await db.delete(stakeholderKpis).where(eq(stakeholderKpis.id, input.id));
      return { success: true };
    }),
  // ── Assessments ──────────────────────────────────────────────────────────
  listAssessments: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const assessments = await db.select().from(stakeholderAssessments)
        .where(eq(stakeholderAssessments.stakeholderId, input.stakeholderId))
        .orderBy(desc(stakeholderAssessments.assessmentDate));
      // Attach scores to each assessment
      const result = [];
      for (const a of assessments) {
        const scores = await db.select().from(stakeholderKpiScores)
          .where(eq(stakeholderKpiScores.assessmentId, a.id));
        result.push({ ...a, scores });
      }
      return result;
    }),
  createAssessment: protectedProcedure
    .input(z.object({
      stakeholderId: z.number(),
      projectId: z.number(),
      assessmentDate: z.string(), // YYYY-MM-DD
      assessorName: z.string().optional(),
      notes: z.string().optional(),
      scores: z.array(z.object({
        kpiId: z.number(),
        score: z.number().min(0).max(100),
        notes: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const { scores, ...assessmentData } = input;
      // Calculate weighted overall score
      const kpis = await db.select().from(stakeholderKpis)
        .where(eq(stakeholderKpis.stakeholderId, input.stakeholderId));
      let totalWeight = 0, weightedSum = 0;
      for (const s of scores) {
        const kpi = kpis.find(k => k.id === s.kpiId);
        const w = kpi?.weight ?? 1;
        totalWeight += w;
        weightedSum += s.score * w;
      }
      const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;
      const result = await db.insert(stakeholderAssessments).values({
        ...assessmentData,
        assessmentDate: new Date(assessmentData.assessmentDate),
        overallScore,
      });
      const assessmentId = result[0].insertId;
      // Insert individual scores
      for (const s of scores) {
        await db.insert(stakeholderKpiScores).values({ assessmentId, ...s });
      }
      return { assessmentId, overallScore };
    }),
  deleteAssessment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.delete(stakeholderKpiScores).where(eq(stakeholderKpiScores.assessmentId, input.id));
      await db.delete(stakeholderAssessments).where(eq(stakeholderAssessments.id, input.id));
      return { success: true };
    }),
});

// ─── Development Plans ────────────────────────────────────────────────────────
const devPlanRouter = router({
  list: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.select().from(developmentPlans)
        .where(eq(developmentPlans.stakeholderId, input.stakeholderId))
        .orderBy(developmentPlans.createdAt);
    }),
  create: protectedProcedure
    .input(z.object({
      stakeholderId: z.number(),
      projectId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      goals: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      status: z.enum(["Not Started", "In Progress", "Completed", "On Hold"]).default("Not Started"),
      linkedSkillId: z.number().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const result = await db.insert(developmentPlans).values({
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
      });
      const rows = await db.select().from(developmentPlans)
        .where(eq(developmentPlans.id, result[0].insertId)).limit(1);
      return rows[0];
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      goals: z.string().optional(),
      startDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
      status: z.enum(["Not Started", "In Progress", "Completed", "On Hold"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const { id, startDate, endDate, ...rest } = input;
      const data: Record<string, unknown> = { ...rest };
      if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
      if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
      await db.update(developmentPlans).set(data).where(eq(developmentPlans.id, id));
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.delete(developmentPlans).where(eq(developmentPlans.id, input.id));
      return { success: true };
    }),
});

// ─── Resource Absences ────────────────────────────────────────────────────────
const absencesRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number(), stakeholderId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const conditions = [eq(resourceAbsences.projectId, input.projectId)];
      if (input.stakeholderId) conditions.push(eq(resourceAbsences.stakeholderId, input.stakeholderId));
      const rows = await db.select({
        absence: resourceAbsences,
        stakeholderName: stakeholders.fullName,
      })
        .from(resourceAbsences)
        .leftJoin(stakeholders, eq(resourceAbsences.stakeholderId, stakeholders.id))
        .where(and(...conditions))
        .orderBy(desc(resourceAbsences.startDate));
      return rows.map(r => ({ ...r.absence, stakeholderName: r.stakeholderName }));
    }),
  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      stakeholderId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
      absenceType: z.enum(["Vacation", "Sick Leave", "Training", "Personal", "Part-Time", "Other"]).default("Vacation"),
      status: z.enum(["Approved", "Pending", "Rejected"]).default("Pending"),
      isPartial: z.boolean().default(false),
      hoursPerDay: z.number().nullable().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const { hoursPerDay, ...rest } = input;
      const result = await db.insert(resourceAbsences).values({
        ...rest,
        hoursPerDay: hoursPerDay != null ? String(hoursPerDay) : null,
      });
      const rows = await db.select().from(resourceAbsences)
        .where(eq(resourceAbsences.id, result[0].insertId)).limit(1);
      return rows[0];
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      absenceType: z.enum(["Vacation", "Sick Leave", "Training", "Personal", "Part-Time", "Other"]).optional(),
      status: z.enum(["Approved", "Pending", "Rejected"]).optional(),
      isPartial: z.boolean().optional(),
      hoursPerDay: z.number().nullable().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const { id, hoursPerDay: hpd, ...rest } = input;
      const data: Record<string, unknown> = { ...rest };
      if (hpd !== undefined) data.hoursPerDay = hpd != null ? String(hpd) : null;
      await db.update(resourceAbsences).set(data).where(eq(resourceAbsences.id, id));
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.delete(resourceAbsences).where(eq(resourceAbsences.id, input.id));
      return { success: true };
    }),
  approve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.update(resourceAbsences).set({ status: "Approved" }).where(eq(resourceAbsences.id, input.id));
      return { success: true };
    }),
  reject: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.update(resourceAbsences).set({ status: "Rejected" }).where(eq(resourceAbsences.id, input.id));
      return { success: true };
    }),
});

// ─── Resource Allocations ─────────────────────────────────────────────────────
const allocationsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const rows = await db.select({
        allocation: resourceAllocations,
        stakeholderName: stakeholders.fullName,
        costPerHour: stakeholders.costPerHour,
      })
        .from(resourceAllocations)
        .leftJoin(stakeholders, eq(resourceAllocations.stakeholderId, stakeholders.id))
        .where(eq(resourceAllocations.projectId, input.projectId))
        .orderBy(stakeholders.fullName, resourceAllocations.phase);
      return rows.map(r => ({
        ...r.allocation,
        stakeholderName: r.stakeholderName,
        effectiveCostRate: r.allocation.costRate ?? r.costPerHour ?? "0",
      }));
    }),
  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      stakeholderId: z.number(),
      phase: z.enum(["Initiation", "Planning", "Design", "Development", "Testing", "Deployment", "Closure"]),
      wbsElementId: z.number().nullable().optional(),
      roleOnPhase: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      allocationPct: z.number().min(0).max(100).default(100),
      plannedHours: z.number().default(0),
      actualHours: z.number().default(0),
      costRate: z.number().nullable().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const { costRate, plannedHours, actualHours, ...rest } = input;
      const result = await db.insert(resourceAllocations).values({
        ...rest,
        plannedHours: String(plannedHours ?? 0),
        actualHours: String(actualHours ?? 0),
        costRate: costRate != null ? String(costRate) : null,
      });
      const rows = await db.select().from(resourceAllocations)
        .where(eq(resourceAllocations.id, result[0].insertId)).limit(1);
      return rows[0];
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      phase: z.enum(["Initiation", "Planning", "Design", "Development", "Testing", "Deployment", "Closure"]).optional(),
      roleOnPhase: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      allocationPct: z.number().min(0).max(100).optional(),
      plannedHours: z.number().optional(),
      actualHours: z.number().optional(),
      costRate: z.number().nullable().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const { id, costRate, plannedHours, actualHours, ...rest } = input;
      const data: Record<string, unknown> = { ...rest };
      if (costRate !== undefined) data.costRate = costRate != null ? String(costRate) : null;
      if (plannedHours !== undefined) data.plannedHours = String(plannedHours);
      if (actualHours !== undefined) data.actualHours = String(actualHours);
      await db.update(resourceAllocations).set(data).where(eq(resourceAllocations.id, id));
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.delete(resourceAllocations).where(eq(resourceAllocations.id, input.id));
      return { success: true };
    }),
  /** Returns the allocation matrix: resources × phases with planned/actual hours */
  matrix: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const allocs = await db.select({
        allocation: resourceAllocations,
        stakeholderName: stakeholders.fullName,
        costPerHour: stakeholders.costPerHour,
      })
        .from(resourceAllocations)
        .leftJoin(stakeholders, eq(resourceAllocations.stakeholderId, stakeholders.id))
        .where(eq(resourceAllocations.projectId, input.projectId));

      // Group by stakeholder
      const byStakeholder: Record<number, {
        stakeholderId: number;
        stakeholderName: string;
        phases: Record<string, { plannedHours: number; actualHours: number; allocationPct: number; id: number }>;
        totalPlanned: number;
        totalActual: number;
        totalCost: number;
      }> = {};

      for (const row of allocs) {
        const sid = row.allocation.stakeholderId;
        if (!byStakeholder[sid]) {
          byStakeholder[sid] = {
            stakeholderId: sid,
            stakeholderName: row.stakeholderName ?? "Unknown",
            phases: {},
            totalPlanned: 0,
            totalActual: 0,
            totalCost: 0,
          };
        }
        const phase = row.allocation.phase;
        const planned = Number(row.allocation.plannedHours ?? 0);
        const actual = Number(row.allocation.actualHours ?? 0);
        const rate = Number(row.allocation.costRate ?? row.costPerHour ?? 0);
        byStakeholder[sid].phases[phase] = {
          plannedHours: planned,
          actualHours: actual,
          allocationPct: row.allocation.allocationPct ?? 100,
          id: row.allocation.id,
        };
        byStakeholder[sid].totalPlanned += planned;
        byStakeholder[sid].totalActual += actual;
        byStakeholder[sid].totalCost += planned * rate;
      }
      return Object.values(byStakeholder);
    }),
  /** Cost summary: total planned cost, actual cost, variance per resource */
  costSummary: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const allocs = await db.select({
        allocation: resourceAllocations,
        stakeholderName: stakeholders.fullName,
        costPerHour: stakeholders.costPerHour,
      })
        .from(resourceAllocations)
        .leftJoin(stakeholders, eq(resourceAllocations.stakeholderId, stakeholders.id))
        .where(eq(resourceAllocations.projectId, input.projectId));

      let totalPlannedCost = 0, totalActualCost = 0;
      const byResource: Record<number, {
        stakeholderId: number; name: string;
        plannedHours: number; actualHours: number;
        plannedCost: number; actualCost: number; variance: number;
      }> = {};
      const byPhase: Record<string, { plannedCost: number; actualCost: number }> = {};

      for (const row of allocs) {
        const sid = row.allocation.stakeholderId;
        const planned = Number(row.allocation.plannedHours ?? 0);
        const actual = Number(row.allocation.actualHours ?? 0);
        const rate = Number(row.allocation.costRate ?? row.costPerHour ?? 0);
        const plannedCost = planned * rate;
        const actualCost = actual * rate;
        totalPlannedCost += plannedCost;
        totalActualCost += actualCost;
        if (!byResource[sid]) byResource[sid] = { stakeholderId: sid, name: row.stakeholderName ?? "Unknown", plannedHours: 0, actualHours: 0, plannedCost: 0, actualCost: 0, variance: 0 };
        byResource[sid].plannedHours += planned;
        byResource[sid].actualHours += actual;
        byResource[sid].plannedCost += plannedCost;
        byResource[sid].actualCost += actualCost;
        byResource[sid].variance = byResource[sid].plannedCost - byResource[sid].actualCost;
        const phase = row.allocation.phase;
        if (!byPhase[phase]) byPhase[phase] = { plannedCost: 0, actualCost: 0 };
        byPhase[phase].plannedCost += plannedCost;
        byPhase[phase].actualCost += actualCost;
      }
      return {
        totalPlannedCost: Math.round(totalPlannedCost * 100) / 100,
        totalActualCost: Math.round(totalActualCost * 100) / 100,
        variance: Math.round((totalPlannedCost - totalActualCost) * 100) / 100,
        byResource: Object.values(byResource),
        byPhase,
      };
    }),
  /** Utilization: per-resource available vs allocated hours */
  utilization: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const allocs = await db.select({
        allocation: resourceAllocations,
        stakeholderName: stakeholders.fullName,
        workingHoursPerDay: stakeholders.workingHoursPerDay,
        workingDaysPerWeek: stakeholders.workingDaysPerWeek,
      })
        .from(resourceAllocations)
        .leftJoin(stakeholders, eq(resourceAllocations.stakeholderId, stakeholders.id))
        .where(eq(resourceAllocations.projectId, input.projectId));

      const byResource: Record<number, {
        stakeholderId: number; name: string;
        totalPlanned: number; totalActual: number;
        availableHours: number; utilizationPct: number; isOverAllocated: boolean;
      }> = {};

      for (const row of allocs) {
        const sid = row.allocation.stakeholderId;
        const planned = Number(row.allocation.plannedHours ?? 0);
        const actual = Number(row.allocation.actualHours ?? 0);
        // Estimate available hours from date range and working schedule
        let available = 0;
        if (row.allocation.startDate && row.allocation.endDate) {
          const start = new Date(row.allocation.startDate);
          const end = new Date(row.allocation.endDate);
          const days = Math.max(0, (end.getTime() - start.getTime()) / 86400000 + 1);
          const daysPerWeek = row.workingDaysPerWeek ?? 5;
          const hoursPerDay = Number(row.workingHoursPerDay ?? 8);
          const allocationPct = (row.allocation.allocationPct ?? 100) / 100;
          available = (days * daysPerWeek / 7) * hoursPerDay * allocationPct;
        }
        if (!byResource[sid]) byResource[sid] = { stakeholderId: sid, name: row.stakeholderName ?? "Unknown", totalPlanned: 0, totalActual: 0, availableHours: 0, utilizationPct: 0, isOverAllocated: false };
        byResource[sid].totalPlanned += planned;
        byResource[sid].totalActual += actual;
        byResource[sid].availableHours += available;
      }
      // Calculate utilization pct
      for (const r of Object.values(byResource)) {
        r.utilizationPct = r.availableHours > 0 ? Math.round((r.totalPlanned / r.availableHours) * 100) : 0;
        r.isOverAllocated = r.utilizationPct > 100;
      }
      return Object.values(byResource);
    }),
});

// ─── Combined export ──────────────────────────────────────────────────────────
export const stakeholderSubFeaturesRouter = router({
  swot: swotRouter,
  kpi: kpiRouter,
  devPlan: devPlanRouter,
  absences: absencesRouter,
  allocations: allocationsRouter,
});
