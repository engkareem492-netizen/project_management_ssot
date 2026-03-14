import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  stakeholders,
  stakeholderSwot,
  engagementTaskGroups,
  engagementTasks,
  engagementTaskSubjects,
  engagementStatusHistory,
} from "../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";

export const engagementRouter = router({
  // ─── SWOT ────────────────────────────────────────────────────────────────────
  listSwot: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(stakeholderSwot)
        .where(eq(stakeholderSwot.stakeholderId, input.stakeholderId))
        .orderBy(stakeholderSwot.sortOrder, stakeholderSwot.createdAt);
    }),

  upsertSwotItem: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        stakeholderId: z.number(),
        projectId: z.number(),
        category: z.enum(["strength", "weakness", "opportunity", "threat"]),
        description: z.string().min(1),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      if (input.id) {
        await db
          .update(stakeholderSwot)
          .set({ description: input.description, sortOrder: input.sortOrder ?? 0 })
          .where(eq(stakeholderSwot.id, input.id));
        return { success: true };
      }
      await db.insert(stakeholderSwot).values({
        stakeholderId: input.stakeholderId,
        projectId: input.projectId,
        category: input.category,
        description: input.description,
        sortOrder: input.sortOrder ?? 0,
      });
      return { success: true };
    }),

  deleteSwotItem: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(stakeholderSwot).where(eq(stakeholderSwot.id, input.id));
      return { success: true };
    }),

  // ─── Engagement Status Update ─────────────────────────────────────────────────
  updateEngagementStatus: protectedProcedure
    .input(
      z.object({
        stakeholderId: z.number(),
        projectId: z.number(),
        currentEngagementStatus: z.string().optional(),
        desiredEngagementStatus: z.string().optional(),
        includeInEngagementPlan: z.boolean().optional(),
        changedBy: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      // Get previous status for history
      const [prev] = await db
        .select({ currentEngagementStatus: stakeholders.currentEngagementStatus })
        .from(stakeholders)
        .where(eq(stakeholders.id, input.stakeholderId));
      const previousStatus = prev?.currentEngagementStatus ?? null;
      // Update stakeholder
      await db
        .update(stakeholders)
        .set({
          currentEngagementStatus: input.currentEngagementStatus,
          desiredEngagementStatus: input.desiredEngagementStatus,
          includeInEngagementPlan: input.includeInEngagementPlan,
        })
        .where(eq(stakeholders.id, input.stakeholderId));
      // Record history if status changed
      if (input.currentEngagementStatus && input.currentEngagementStatus !== previousStatus) {
        await db.insert(engagementStatusHistory).values({
          stakeholderId: input.stakeholderId,
          projectId: input.projectId,
          previousStatus: previousStatus ?? undefined,
          newStatus: input.currentEngagementStatus,
          changedBy: input.changedBy,
          notes: input.notes,
        });
      }
      return { success: true };
    }),

  listStatusHistory: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(engagementStatusHistory)
        .where(eq(engagementStatusHistory.stakeholderId, input.stakeholderId))
        .orderBy(engagementStatusHistory.changedAt);
    }),

  // ─── Engagement Task Groups ───────────────────────────────────────────────────
  listTaskGroups: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(engagementTaskGroups)
        .where(eq(engagementTaskGroups.projectId, input.projectId))
        .orderBy(engagementTaskGroups.sortOrder, engagementTaskGroups.createdAt);
    }),

  upsertTaskGroup: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        projectId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        fromStatus: z.string().optional(),
        toStatus: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      if (input.id) {
        const { id, ...data } = input;
        await db.update(engagementTaskGroups).set(data).where(eq(engagementTaskGroups.id, id));
        return { success: true };
      }
      await db.insert(engagementTaskGroups).values({
        projectId: input.projectId,
        name: input.name,
        description: input.description,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        sortOrder: input.sortOrder ?? 0,
      });
      return { success: true };
    }),

  deleteTaskGroup: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      // Delete tasks and subjects first
      const tasks = await db
        .select({ id: engagementTasks.id })
        .from(engagementTasks)
        .where(eq(engagementTasks.groupId, input.id));
      if (tasks.length > 0) {
        await db
          .delete(engagementTaskSubjects)
          .where(inArray(engagementTaskSubjects.taskId, tasks.map((t: { id: number }) => t.id)));
        await db.delete(engagementTasks).where(eq(engagementTasks.groupId, input.id));
      }
      await db.delete(engagementTaskGroups).where(eq(engagementTaskGroups.id, input.id));
      return { success: true };
    }),

  // ─── Engagement Tasks ─────────────────────────────────────────────────────────
  listTasks: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(engagementTasks)
        .where(eq(engagementTasks.groupId, input.groupId))
        .orderBy(engagementTasks.sortOrder, engagementTasks.createdAt);
    }),

  listAllTasks: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(engagementTasks)
        .where(eq(engagementTasks.projectId, input.projectId))
        .orderBy(engagementTasks.groupId, engagementTasks.sortOrder);
    }),

  upsertTask: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        projectId: z.number(),
        groupId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        responsible: z.string().optional(),
        responsibleId: z.number().optional(),
        dueDate: z.string().optional(),
        status: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      if (input.id) {
        const { id, ...data } = input;
        await db.update(engagementTasks).set({
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        }).where(eq(engagementTasks.id, id));
        return { success: true };
      }
      await db.insert(engagementTasks).values({
        projectId: input.projectId,
        groupId: input.groupId,
        title: input.title,
        description: input.description,
        responsible: input.responsible,
        responsibleId: input.responsibleId,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        status: input.status ?? "Not Started",
        sortOrder: input.sortOrder ?? 0,
      });
      return { success: true };
    }),

  deleteTask: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .delete(engagementTaskSubjects)
        .where(eq(engagementTaskSubjects.taskId, input.id));
      await db.delete(engagementTasks).where(eq(engagementTasks.id, input.id));
      return { success: true };
    }),

  // ─── Task Subjects ────────────────────────────────────────────────────────────
  listTaskSubjects: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select({
          id: engagementTaskSubjects.id,
          taskId: engagementTaskSubjects.taskId,
          stakeholderId: engagementTaskSubjects.stakeholderId,
          stakeholderName: stakeholders.fullName,
          stakeholderRole: stakeholders.role,
        })
        .from(engagementTaskSubjects)
        .leftJoin(stakeholders, eq(engagementTaskSubjects.stakeholderId, stakeholders.id))
        .where(eq(engagementTaskSubjects.taskId, input.taskId));
    }),

  addTaskSubject: protectedProcedure
    .input(z.object({ taskId: z.number(), stakeholderId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const existing = await db
        .select()
        .from(engagementTaskSubjects)
        .where(
          and(
            eq(engagementTaskSubjects.taskId, input.taskId),
            eq(engagementTaskSubjects.stakeholderId, input.stakeholderId)
          )
        );
      if (existing.length > 0) return { success: true, alreadyLinked: true };
      await db.insert(engagementTaskSubjects).values(input);
      return { success: true, alreadyLinked: false };
    }),

  removeTaskSubject: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .delete(engagementTaskSubjects)
        .where(eq(engagementTaskSubjects.id, input.id));
      return { success: true };
    }),

  // ─── Stakeholder engagement plan tasks (for a specific stakeholder) ───────────
  listStakeholderEngagementTasks: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      // Get task IDs where this stakeholder is a subject
      const subjects = await db
        .select({ taskId: engagementTaskSubjects.taskId })
        .from(engagementTaskSubjects)
        .where(eq(engagementTaskSubjects.stakeholderId, input.stakeholderId));
      if (subjects.length === 0) return [];
      const taskIds = subjects.map((s: { taskId: number }) => s.taskId);
      return db
        .select({
          id: engagementTasks.id,
          title: engagementTasks.title,
          status: engagementTasks.status,
          dueDate: engagementTasks.dueDate,
          groupId: engagementTasks.groupId,
          groupName: engagementTaskGroups.name,
          fromStatus: engagementTaskGroups.fromStatus,
          toStatus: engagementTaskGroups.toStatus,
        })
        .from(engagementTasks)
        .leftJoin(engagementTaskGroups, eq(engagementTasks.groupId, engagementTaskGroups.id))
        .where(inArray(engagementTasks.id, taskIds));
    }),

  // ─── Engagement Plan Items (simple per-stakeholder actions) ──────────────────
  listPlanItems: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(engagementTasks)
        .where(eq(engagementTasks.projectId, input.projectId))
        .orderBy(engagementTasks.createdAt);
    }),

  createPlanItem: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      stakeholderId: z.number(),
      action: z.string().min(1),
      objective: z.string().optional(),
      targetStatus: z.string().optional(),
      responsible: z.string().optional(),
      dueDate: z.string().optional(),
      frequency: z.string().optional(),
      notes: z.string().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      // Use a default groupId of 0 for standalone plan items (no task group)
      await db.insert(engagementTasks).values({
        projectId: input.projectId,
        groupId: 0,
        title: input.action,
        description: input.objective,
        responsible: input.responsible,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        status: input.status ?? "Planned",
        sortOrder: 0,
        stakeholderId: input.stakeholderId,
        targetStatus: input.targetStatus,
        frequency: input.frequency,
        notes: input.notes,
      });
      return { success: true };
    }),

  updatePlanItem: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        action: z.string().optional(),
        objective: z.string().optional(),
        targetStatus: z.string().optional(),
        responsible: z.string().optional(),
        dueDate: z.string().optional(),
        frequency: z.string().optional(),
        notes: z.string().optional(),
        status: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(engagementTasks).set({
        title: input.data.action,
        description: input.data.objective,
        targetStatus: input.data.targetStatus,
        responsible: input.data.responsible,
        dueDate: input.data.dueDate ? new Date(input.data.dueDate) : undefined,
        frequency: input.data.frequency,
        notes: input.data.notes,
        status: input.data.status,
      }).where(eq(engagementTasks.id, input.id));
      return { success: true };
    }),

  deletePlanItem: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(engagementTasks).where(eq(engagementTasks.id, input.id));
      return { success: true };
    }),

  // ─── Update stakeholder classification ───────────────────────────────────────
  updateClassification: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        classification: z.enum(["team_member", "external", "stakeholder"]),
        isInternalTeam: z.boolean().optional(),
        isPooledResource: z.boolean().optional(),
        stakeholderManagerId: z.number().optional().nullable(),
        costPerHour: z.string().optional(),
        costPerDay: z.string().optional(),
        workingSchedule: z.string().optional(),
        department: z.string().optional(),
        remark: z.string().optional(),
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
