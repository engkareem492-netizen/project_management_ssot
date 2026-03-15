import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import {
  engagementTaskGroups,
  engagementTasks,
  engagementTaskSubjects,
  engagementStatusHistory,
  stakeholders,
} from "../../drizzle/schema";

const ENGAGEMENT_STATUSES = ["Unaware", "Resistant", "Neutral", "Supportive", "Leading"] as const;
const FROM_STATUSES = ["Unaware", "Resistant", "Neutral", "Supportive", "Leading", "Any"] as const;

export const engagementRouter = router({
  // ─── Task Groups ─────────────────────────────────────────────────────────────
  listGroups: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(engagementTaskGroups)
        .where(eq(engagementTaskGroups.projectId, input.projectId))
        .orderBy(engagementTaskGroups.createdAt);
    }),

  createGroup: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string(),
      description: z.string().optional(),
      fromStatus: z.enum(FROM_STATUSES),
      toStatus: z.enum(ENGAGEMENT_STATUSES),
      color: z.string().optional(),
      initialStakeholderId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { initialStakeholderId, ...groupData } = input;
      const result = await db.insert(engagementTaskGroups).values(groupData);
      const newGroupId = result[0].insertId;
      // Auto-assign initial stakeholder as subject if provided
      if (initialStakeholderId) {
        try {
          await db.insert(engagementTaskSubjects).values({ taskGroupId: newGroupId, stakeholderId: initialStakeholderId });
        } catch { /* duplicate — ignore */ }
      }
      const rows = await db
        .select()
        .from(engagementTaskGroups)
        .where(eq(engagementTaskGroups.id, newGroupId))
        .limit(1);
      return rows[0];
    }),

  updateGroup: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        fromStatus: z.enum(FROM_STATUSES).optional(),
        toStatus: z.enum(ENGAGEMENT_STATUSES).optional(),
        color: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(engagementTaskGroups).set(input.data).where(eq(engagementTaskGroups.id, input.id));
      const rows = await db.select().from(engagementTaskGroups).where(eq(engagementTaskGroups.id, input.id)).limit(1);
      return rows[0];
    }),

  deleteGroup: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      // Cascade: delete tasks and subjects
      const tasks = await db.select().from(engagementTasks).where(eq(engagementTasks.taskGroupId, input.id));
      for (const t of tasks) {
        await db.delete(engagementTasks).where(eq(engagementTasks.id, t.id));
      }
      await db.delete(engagementTaskSubjects).where(eq(engagementTaskSubjects.taskGroupId, input.id));
      await db.delete(engagementTaskGroups).where(eq(engagementTaskGroups.id, input.id));
      return { success: true };
    }),

  // ─── Tasks ───────────────────────────────────────────────────────────────────
  listTasks: protectedProcedure
    .input(z.object({ taskGroupId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(engagementTasks)
        .where(eq(engagementTasks.taskGroupId, input.taskGroupId))
        .orderBy(engagementTasks.sequence, engagementTasks.createdAt);
    }),

  listAllTasks: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(engagementTasks)
        .where(eq(engagementTasks.projectId, input.projectId))
        .orderBy(engagementTasks.createdAt);
    }),

  createTask: protectedProcedure
    .input(z.object({
      taskGroupId: z.number(),
      projectId: z.number(),
      title: z.string(),
      description: z.string().optional(),
      periodic: z.string().optional(),
      sequence: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(engagementTasks).values({
        taskGroupId: input.taskGroupId,
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        periodic: input.periodic,
        sequence: input.sequence ?? 0,
      });
      const rows = await db.select().from(engagementTasks).where(eq(engagementTasks.id, result[0].insertId)).limit(1);
      return rows[0];
    }),

  updateTask: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        title: z.string().optional(),
        description: z.string().nullable().optional(),
        periodic: z.string().nullable().optional(),
        sequence: z.number().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(engagementTasks).set(input.data as any).where(eq(engagementTasks.id, input.id));
      const rows = await db.select().from(engagementTasks).where(eq(engagementTasks.id, input.id)).limit(1);
      return rows[0];
    }),

  deleteTask: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(engagementTasks).where(eq(engagementTasks.id, input.id));
      return { success: true };
    }),

  // ─── Subjects ─────────────────────────────────────────────────────────────────
  listSubjects: protectedProcedure
    .input(z.object({ taskGroupId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(engagementTaskSubjects)
        .where(eq(engagementTaskSubjects.taskGroupId, input.taskGroupId));
    }),

  addSubject: protectedProcedure
    .input(z.object({ taskGroupId: z.number(), stakeholderId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      // Ignore duplicate
      try {
        await db.insert(engagementTaskSubjects).values(input);
      } catch { /* duplicate — ignore */ }
      return { success: true };
    }),

  removeSubject: protectedProcedure
    .input(z.object({ taskGroupId: z.number(), stakeholderId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(engagementTaskSubjects).where(
        and(
          eq(engagementTaskSubjects.taskGroupId, input.taskGroupId),
          eq(engagementTaskSubjects.stakeholderId, input.stakeholderId),
        )
      );
      return { success: true };
    }),

  // ─── Status History ───────────────────────────────────────────────────────────
  listStatusHistory: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(engagementStatusHistory)
        .where(eq(engagementStatusHistory.stakeholderId, input.stakeholderId))
        .orderBy(engagementStatusHistory.assessmentDate);
    }),

  addStatusHistory: protectedProcedure
    .input(z.object({
      stakeholderId: z.number(),
      projectId: z.number(),
      statusType: z.enum(["current", "desired"]),
      status: z.enum(ENGAGEMENT_STATUSES),
      assessedBy: z.string().optional(),
      assessmentDate: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(engagementStatusHistory).values(input);
      const rows = await db
        .select()
        .from(engagementStatusHistory)
        .where(eq(engagementStatusHistory.id, result[0].insertId))
        .limit(1);
      return rows[0];
    }),

  deleteStatusHistory: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(engagementStatusHistory).where(eq(engagementStatusHistory.id, input.id));
      return { success: true };
    }),

  // ─── Auto-sync subjects from stakeholder status ─────────────────────────────
  // When a stakeholder's current+desired status matches a task group's from+to,
  // they should automatically be added as subjects.
  syncSubjects: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const groups = await db
        .select()
        .from(engagementTaskGroups)
        .where(eq(engagementTaskGroups.projectId, input.projectId));

      const allStakeholders = await db
        .select()
        .from(stakeholders)
        .where(eq(stakeholders.projectId, input.projectId));

      for (const group of groups) {
        for (const s of allStakeholders) {
          if (!s.currentEngagementStatus || !s.desiredEngagementStatus) continue;
          const fromMatch = group.fromStatus === "Any" || group.fromStatus === s.currentEngagementStatus;
          const toMatch = group.toStatus === s.desiredEngagementStatus;
          if (fromMatch && toMatch) {
            try {
              await db.insert(engagementTaskSubjects).values({
                taskGroupId: group.id,
                stakeholderId: s.id,
              });
            } catch { /* already exists */ }
          }
        }
      }
      return { success: true };
    }),
});
