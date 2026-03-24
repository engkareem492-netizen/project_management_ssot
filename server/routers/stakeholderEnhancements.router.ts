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
  stakeholderSwot,
  developmentPlans,
  stakeholderSkills,
} from "../../drizzle/schema";
import { eq, and, inArray, sql, desc } from "drizzle-orm";

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

  // ─── SWOT ─────────────────────────────────────────────────────────────────────

  listSwot: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(stakeholderSwot)
        .where(eq(stakeholderSwot.stakeholderId, input.stakeholderId));
    }),

  createSwot: protectedProcedure
    .input(
      z.object({
        stakeholderId: z.number(),
        quadrant: z.enum(["Strength", "Weakness", "Opportunity", "Threat"]),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(stakeholderSwot).values(input);
      return result;
    }),

  updateSwot: protectedProcedure
    .input(z.object({ id: z.number(), description: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(stakeholderSwot)
        .set({ description: input.description })
        .where(eq(stakeholderSwot.id, input.id));
      return { success: true };
    }),

  deleteSwot: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .delete(stakeholderSwot)
        .where(eq(stakeholderSwot.id, input.id));
      return { success: true };
    }),

  // ─── Development Plans ────────────────────────────────────────────────────────

  listDevPlans: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(developmentPlans)
        .where(eq(developmentPlans.stakeholderId, input.stakeholderId));
    }),

  createDevPlan: protectedProcedure
    .input(
      z.object({
        stakeholderId: z.number(),
        projectId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        goals: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(["Not Started", "In Progress", "Completed", "On Hold"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(developmentPlans).values({
        stakeholderId: input.stakeholderId,
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        goals: input.goals,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        status: input.status,
      });
      return result;
    }),

  updateDevPlan: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          goals: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          status: z
            .enum(["Not Started", "In Progress", "Completed", "On Hold"])
            .optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { startDate, endDate, ...rest } = input.data;
      await db
        .update(developmentPlans)
        .set({
          ...rest,
          ...(startDate !== undefined ? { startDate: new Date(startDate) } : {}),
          ...(endDate !== undefined ? { endDate: new Date(endDate) } : {}),
        })
        .where(eq(developmentPlans.id, input.id));
      return { success: true };
    }),

  deleteDevPlan: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .delete(developmentPlans)
        .where(eq(developmentPlans.id, input.id));
      return { success: true };
    }),

  // List all dev plans for a project (with stakeholder name) — used by DEV task creation
  listDevPlansByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select({
          id: developmentPlans.id,
          title: developmentPlans.title,
          status: developmentPlans.status,
          stakeholderId: developmentPlans.stakeholderId,
          stakeholderName: stakeholders.fullName,
          linkedSkillId: developmentPlans.linkedSkillId,
          linkedSwotId: developmentPlans.linkedSwotId,
        })
        .from(developmentPlans)
        .leftJoin(stakeholders, eq(developmentPlans.stakeholderId, stakeholders.id))
        .where(eq(developmentPlans.projectId, input.projectId))
        .orderBy(stakeholders.fullName, developmentPlans.title);
    }),

  // List SWOT items for a stakeholder (used by DEV task creation when dev plan selected)
  listSwotByStakeholder: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(stakeholderSwot)
        .where(eq(stakeholderSwot.stakeholderId, input.stakeholderId));
    }),

  // List skills for a stakeholder (used by DEV task creation when dev plan selected)
  listSkillsByStakeholder: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(stakeholderSkills)
        .where(eq(stakeholderSkills.stakeholderId, input.stakeholderId));
    }),

  // ─── Skills ───────────────────────────────────────────────────────────────────

  listSkills: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(stakeholderSkills)
        .where(eq(stakeholderSkills.stakeholderId, input.stakeholderId));
    }),

  createSkill: protectedProcedure
    .input(
      z.object({
        stakeholderId: z.number(),
        name: z.string(),
        level: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]),
        linkedKpiId: z.number().nullable().optional(),
        linkedSwotId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(stakeholderSkills).values({
        stakeholderId: input.stakeholderId,
        name: input.name,
        level: input.level,
        linkedKpiId: input.linkedKpiId ?? null,
        linkedSwotId: input.linkedSwotId ?? null,
      });
      return { success: true };
    }),

  updateSkill: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          level: z
            .enum(["Beginner", "Intermediate", "Advanced", "Expert"])
            .optional(),
          linkedKpiId: z.number().nullable().optional(),
          linkedSwotId: z.number().nullable().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(stakeholderSkills)
        .set(input.data)
        .where(eq(stakeholderSkills.id, input.id));
      return { success: true };
    }),

  deleteSkill: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .delete(stakeholderSkills)
        .where(eq(stakeholderSkills.id, input.id));
      return { success: true };
    }),

  // ─── Batch KPI summary for Team Overview ─────────────────────────────────────

  listProjectKpiSummary: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }): Promise<Array<{
      stakeholderId: number;
      stakeholderName: string | null;
      latestOverallScore: number | null;
      previousOverallScore: number | null;
      averageOverallScore: number | null;
      trend: number[];
      kpiCount: number;
    }>> => {
      const db = await getDb();
      if (!db) return [];

      // Get all assessments for the project, ordered newest-first
      const assessments = await db
        .select({
          stakeholderId: stakeholderAssessments.stakeholderId,
          overallScore: stakeholderAssessments.overallScore,
          assessmentDate: stakeholderAssessments.assessmentDate,
          id: stakeholderAssessments.id,
        })
        .from(stakeholderAssessments)
        .where(eq(stakeholderAssessments.projectId, input.projectId))
        .orderBy(desc(stakeholderAssessments.assessmentDate), desc(stakeholderAssessments.id));

      // Group by stakeholderId — keep last 5 scores for trend, first entry is latest
      const trendByStakeholder = new Map<
        number,
        { overallScore: number | null; assessmentDate: Date | null; previousOverallScore: number | null; trend: number[]; scoreSum: number; scoreCount: number }
      >();
      for (const a of assessments) {
        if (!trendByStakeholder.has(a.stakeholderId)) {
          trendByStakeholder.set(a.stakeholderId, {
            overallScore: a.overallScore,
            assessmentDate: a.assessmentDate,
            previousOverallScore: null,
            trend: a.overallScore !== null ? [a.overallScore] : [],
            scoreSum: a.overallScore !== null ? a.overallScore : 0,
            scoreCount: a.overallScore !== null ? 1 : 0,
          });
        } else {
          const existing = trendByStakeholder.get(a.stakeholderId)!;
          if (existing.previousOverallScore === null && a.overallScore !== null) {
            existing.previousOverallScore = a.overallScore;
          }
          if (a.overallScore !== null && existing.trend.length < 5) {
            existing.trend.push(a.overallScore);
          }
          if (a.overallScore !== null) {
            existing.scoreSum += a.overallScore;
            existing.scoreCount += 1;
          }
        }
      }
      // Alias for downstream use
      const latestByStakeholder = trendByStakeholder;

      // Get KPI counts per stakeholder for this project
      const kpiRows = await db
        .select({
          stakeholderId: stakeholderKpis.stakeholderId,
          kpiCount: sql<number>`count(*)`.as("kpiCount"),
        })
        .from(stakeholderKpis)
        .where(eq(stakeholderKpis.projectId, input.projectId))
        .groupBy(stakeholderKpis.stakeholderId);

      const kpiCountMap = new Map<number, number>();
      for (const row of kpiRows) {
        kpiCountMap.set(row.stakeholderId, Number(row.kpiCount));
      }

      // Get stakeholder names for all relevant stakeholder IDs
      const stakeholderIds = Array.from(latestByStakeholder.keys());
      if (stakeholderIds.length === 0) return [];

      const stakeholderRows = await db
        .select({ id: stakeholders.id, fullName: stakeholders.fullName })
        .from(stakeholders)
        .where(inArray(stakeholders.id, stakeholderIds));

      const nameMap = new Map<number, string>();
      for (const s of stakeholderRows) {
        nameMap.set(s.id, s.fullName);
      }

      // Build the summary result
      return stakeholderIds.map((stakeholderId) => {
        const latest = latestByStakeholder.get(stakeholderId);
        // trend is stored newest-first; reverse for chronological order for chart
        const trendAsc = [...(latest?.trend ?? [])].reverse();
        const avgScore =
          latest && latest.scoreCount > 0
            ? Math.round(latest.scoreSum / latest.scoreCount)
            : null;
        return {
          stakeholderId,
          stakeholderName: nameMap.get(stakeholderId) ?? null,
          latestOverallScore: latest?.overallScore ?? null,
          previousOverallScore: latest?.previousOverallScore ?? null,
          averageOverallScore: avgScore,
          trend: trendAsc,
          kpiCount: kpiCountMap.get(stakeholderId) ?? 0,
        };
      });
    }),
});
