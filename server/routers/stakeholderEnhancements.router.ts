/**
 * Stakeholder Enhancements Router
 * Handles KPIs, Assessments, Internal Team Task Group links
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  stakeholderKpis,
  stakeholderAssessments,
  stakeholderKpiScores,
  stakeholderTaskGroups,
  taskGroups,
  tasks,
  stakeholders,
} from "../../drizzle/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export const stakeholderEnhancementsRouter = router({
  // List KPIs for a stakeholder
  listKpis: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(stakeholderKpis)
        .where(eq(stakeholderKpis.stakeholderId, input.stakeholderId));
    }),

  createKpi: protectedProcedure
    .input(
      z.object({
        stakeholderId: z.number(),
        projectId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        target: z.string().optional(),
        unit: z.string().optional(),
        weight: z.number().default(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(stakeholderKpis).values(input);
      return result;
    }),

  updateKpi: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          target: z.string().optional(),
          unit: z.string().optional(),
          weight: z.number().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(stakeholderKpis)
        .set(input.data)
        .where(eq(stakeholderKpis.id, input.id));
      return { success: true };
    }),

  deleteKpi: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      // Delete scores referencing this KPI first
      await db
        .delete(stakeholderKpiScores)
        .where(eq(stakeholderKpiScores.kpiId, input.id));
      await db
        .delete(stakeholderKpis)
        .where(eq(stakeholderKpis.id, input.id));
      return { success: true };
    }),

  // ─── Assessments ─────────────────────────────────────────────────────────────

  listAssessments: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const assessments = await db
        .select()
        .from(stakeholderAssessments)
        .where(eq(stakeholderAssessments.stakeholderId, input.stakeholderId));

      // Enrich with scores
      const enriched = await Promise.all(
        assessments.map(async (a) => {
          const scores = await db
            .select({
              id: stakeholderKpiScores.id,
              kpiId: stakeholderKpiScores.kpiId,
              score: stakeholderKpiScores.score,
              notes: stakeholderKpiScores.notes,
              kpiName: stakeholderKpis.name,
              kpiUnit: stakeholderKpis.unit,
              kpiWeight: stakeholderKpis.weight,
            })
            .from(stakeholderKpiScores)
            .leftJoin(
              stakeholderKpis,
              eq(stakeholderKpiScores.kpiId, stakeholderKpis.id)
            )
            .where(eq(stakeholderKpiScores.assessmentId, a.id));
          return { ...a, scores };
        })
      );
      return enriched;
    }),

  createAssessment: protectedProcedure
    .input(
      z.object({
        stakeholderId: z.number(),
        projectId: z.number(),
        assessmentDate: z.string(),
        assessorName: z.string().optional(),
        notes: z.string().optional(),
        scores: z.array(
          z.object({
            kpiId: z.number(),
            score: z.number().min(0).max(100),
            notes: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Fetch KPI weights to compute weighted average
      const kpiIds = input.scores.map((s) => s.kpiId);
      let overallScore = 0;
      if (kpiIds.length > 0) {
        const kpis = await db
          .select()
          .from(stakeholderKpis)
          .where(inArray(stakeholderKpis.id, kpiIds));
        const totalWeight = kpis.reduce((sum, k) => sum + (k.weight || 1), 0);
        overallScore = Math.round(
          input.scores.reduce((sum, s) => {
            const kpi = kpis.find((k) => k.id === s.kpiId);
            return sum + s.score * ((kpi?.weight || 1) / totalWeight);
          }, 0)
        );
      }

      await db.insert(stakeholderAssessments).values({
        stakeholderId: input.stakeholderId,
        projectId: input.projectId,
        assessmentDate: new Date(input.assessmentDate),
        assessorName: input.assessorName,
        notes: input.notes,
        overallScore,
      });

      // Get the inserted ID
      const [newAssessment] = await db
        .select()
        .from(stakeholderAssessments)
        .where(
          and(
            eq(stakeholderAssessments.stakeholderId, input.stakeholderId),
            sql`DATE(${stakeholderAssessments.assessmentDate}) = ${input.assessmentDate}`
          )
        )
        .orderBy(stakeholderAssessments.createdAt)
        .limit(1);

      if (newAssessment && input.scores.length > 0) {
        await db.insert(stakeholderKpiScores).values(
          input.scores.map((s) => ({
            assessmentId: newAssessment.id,
            kpiId: s.kpiId,
            score: s.score,
            notes: s.notes,
          }))
        );
      }

      return { success: true, overallScore };
    }),

  deleteAssessment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .delete(stakeholderKpiScores)
        .where(eq(stakeholderKpiScores.assessmentId, input.id));
      await db
        .delete(stakeholderAssessments)
        .where(eq(stakeholderAssessments.id, input.id));
      return { success: true };
    }),

  // ─── Internal Team Task Group Links ──────────────────────────────────────────

  listTaskGroupLinks: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select({
          id: stakeholderTaskGroups.id,
          stakeholderId: stakeholderTaskGroups.stakeholderId,
          taskGroupId: stakeholderTaskGroups.taskGroupId,
          taskGroupName: taskGroups.name,
          taskGroupCode: taskGroups.idCode,
        })
        .from(stakeholderTaskGroups)
        .leftJoin(taskGroups, eq(stakeholderTaskGroups.taskGroupId, taskGroups.id))
        .where(eq(stakeholderTaskGroups.stakeholderId, input.stakeholderId));
    }),

  linkTaskGroup: protectedProcedure
    .input(
      z.object({
        stakeholderId: z.number(),
        taskGroupId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      // Avoid duplicates
      const existing = await db
        .select()
        .from(stakeholderTaskGroups)
        .where(
          and(
            eq(stakeholderTaskGroups.stakeholderId, input.stakeholderId),
            eq(stakeholderTaskGroups.taskGroupId, input.taskGroupId)
          )
        );
      if (existing.length > 0) return { success: true, alreadyLinked: true };
      await db.insert(stakeholderTaskGroups).values(input);
      return { success: true, alreadyLinked: false };
    }),

  unlinkTaskGroup: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .delete(stakeholderTaskGroups)
        .where(eq(stakeholderTaskGroups.id, input.id));
      return { success: true };
    }),

  // ─── Internal Team list ───────────────────────────────────────────────────────

  listInternalTeam: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(stakeholders)
        .where(
          and(
            eq(stakeholders.projectId, input.projectId),
            eq(stakeholders.isInternalTeam, true)
          )
        );
    }),

  // ─── Update stakeholder engagement fields ────────────────────────────────────

  updateEngagement: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        powerLevel: z.number().min(1).max(5).optional(),
        interestLevel: z.number().min(1).max(5).optional(),
        engagementStrategy: z.string().optional(),
        communicationFrequency: z.string().optional(),
        communicationChannel: z.string().optional(),
        communicationMessage: z.string().optional(),
        communicationResponsible: z.string().optional(),
        notes: z.string().optional(),
        isInternalTeam: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      await db.update(stakeholders).set(data).where(eq(stakeholders.id, id));
      return { success: true };
    }),
});
