import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { getDb, createTask, getNextId } from "../db";
import {
  engagementTaskGroups,
  engagementTasks,
  engagementTaskSubjects,
  engagementStatusHistory,
  stakeholders,
  tasks,
  projectCharter,
} from "../../drizzle/schema";

/** Fetch the Project Manager stakeholder for a project (from the charter). */
async function getProjectManager(projectId: number): Promise<{ id: number; fullName: string } | null> {
  const db = await getDb();
  if (!db) return null;
  const charter = await db
    .select({ projectManagerId: projectCharter.projectManagerId })
    .from(projectCharter)
    .where(eq(projectCharter.projectId, projectId))
    .limit(1)
    .then((r) => r[0]);
  if (!charter?.projectManagerId) return null;
  const pm = await db
    .select({ id: stakeholders.id, fullName: stakeholders.fullName })
    .from(stakeholders)
    .where(eq(stakeholders.id, charter.projectManagerId))
    .limit(1)
    .then((r) => r[0]);
  return pm ?? null;
}

const ENGAGEMENT_STATUSES = ["Resistant", "Unaware", "Neutral", "Supportive", "Leading"] as const;
const FROM_STATUSES = ["Resistant", "Unaware", "Neutral", "Supportive", "Leading", "Any"] as const;

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
      const newItemId = result[0].insertId;
      const rows = await db.select().from(engagementTasks).where(eq(engagementTasks.id, newItemId)).limit(1);
      const newItem = rows[0];

      // Auto-create COMM- tasks for all existing subjects in this group
      try {
        const group = await db
          .select()
          .from(engagementTaskGroups)
          .where(eq(engagementTaskGroups.id, input.taskGroupId))
          .limit(1)
          .then((r) => r[0]);

        const subjects = await db
          .select({
            stakeholderId: engagementTaskSubjects.stakeholderId,
            fullName: stakeholders.fullName,
          })
          .from(engagementTaskSubjects)
          .leftJoin(stakeholders, eq(engagementTaskSubjects.stakeholderId, stakeholders.id))
          .where(eq(engagementTaskSubjects.taskGroupId, input.taskGroupId));

        const periodic = input.periodic;
        const recurringType = periodic === "Daily" ? "daily"
          : periodic === "Weekly" ? "weekly"
          : periodic === "Monthly" ? "monthly"
          : "none";

        for (const subj of subjects) {
          if (!group) continue;
          const taskId = await getNextId("commTask", "COMM", input.projectId);
          await createTask({
            projectId: input.projectId,
            taskId,
            description: `[${group.name}] ${input.title}${subj.fullName ? ` — ${subj.fullName}` : ""}`,
            status: "Open",
            responsible: subj.fullName ?? undefined,
            responsibleId: subj.stakeholderId ?? undefined,
            recurringType: recurringType as any,
            recurringInterval: 1,
            communicationStakeholderId: newItemId,
          } as any);
        }
      } catch (e) {
        console.error("[engagement.createTask] Failed to auto-create COMM tasks:", e);
      }

      return newItem;
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

  // ─── Status Trends (last 2 current logs per stakeholder) ─────────────────────
  getStatusTrends: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {};
      const STATUS_ORDER = ["Resistant", "Unaware", "Neutral", "Supportive", "Leading"];
      // Fetch all "current" history entries for the project, newest first
      const rows = await db
        .select()
        .from(engagementStatusHistory)
        .where(
          and(
            eq(engagementStatusHistory.projectId, input.projectId),
            eq(engagementStatusHistory.statusType, "current")
          )
        )
        .orderBy(desc(engagementStatusHistory.assessmentDate), desc(engagementStatusHistory.id));
      // Group by stakeholderId, keep last 2 entries per stakeholder
      const seen: Record<number, string[]> = {};
      for (const row of rows) {
        const sid = row.stakeholderId;
        if (!seen[sid]) seen[sid] = [];
        if (seen[sid].length < 2) seen[sid].push(row.status);
      }
      const result: Record<number, { trend: "up" | "down" | "same" | "none"; prevStatus: string; currStatus: string }> = {};
      for (const [sidStr, statuses] of Object.entries(seen)) {
        const sid = Number(sidStr);
        if (statuses.length < 2) {
          result[sid] = { trend: "none", prevStatus: statuses[0] ?? "", currStatus: statuses[0] ?? "" };
          continue;
        }
        const [curr, prev] = statuses; // newest first
        const currIdx = STATUS_ORDER.indexOf(curr);
        const prevIdx = STATUS_ORDER.indexOf(prev);
        const trend = currIdx > prevIdx ? "up" : currIdx < prevIdx ? "down" : "same";
        result[sid] = { trend, prevStatus: prev, currStatus: curr };
      }
      return result;
    }),

  // ─── Subjects ─────────────────────────────────────────────────────────────────
  listSubjects: protectedProcedure
    .input(z.object({ taskGroupId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select({
          id: engagementTaskSubjects.id,
          taskGroupId: engagementTaskSubjects.taskGroupId,
          stakeholderId: engagementTaskSubjects.stakeholderId,
          fullName: stakeholders.fullName,
        })
        .from(engagementTaskSubjects)
        .leftJoin(stakeholders, eq(engagementTaskSubjects.stakeholderId, stakeholders.id))
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

      // Auto-create COMM- tasks in the main tasks table for each engagement action item in this group
      try {
        const group = await db
          .select()
          .from(engagementTaskGroups)
          .where(eq(engagementTaskGroups.id, input.taskGroupId))
          .limit(1)
          .then((r) => r[0]);

        const subject = await db
          .select()
          .from(stakeholders)
          .where(eq(stakeholders.id, input.stakeholderId))
          .limit(1)
          .then((r) => r[0]);

        // Get the Project Manager — they are the responsible for all COMM tasks
        const pm = group ? await getProjectManager(group.projectId) : null;

        const actionItems = await db
          .select()
          .from(engagementTasks)
          .where(eq(engagementTasks.taskGroupId, input.taskGroupId));

        for (const item of actionItems) {
          if (!group) continue;
          // Check if a COMM task already exists for this specific subject + action item combo
          const existing = await db
            .select()
            .from(tasks)
            .where(
              and(
                eq(tasks.projectId, group.projectId),
                eq(tasks.communicationStakeholderId, item.id),
                eq(tasks.responsibleId, pm?.id ?? input.stakeholderId)
              )
            )
            .limit(1);

          // Only create if not already linked
          if (existing.length === 0) {
            const taskId = await getNextId("commTask", "COMM", group.projectId);
            const periodic = item.periodic;
            const recurringType = periodic === "Daily" ? "daily"
              : periodic === "Weekly" ? "weekly"
              : periodic === "Monthly" ? "monthly"
              : "none";
            await createTask({
              projectId: group.projectId,
              taskId,
              // Description: [Group] Action Item — with Subject: Name
              description: `[${group.name}] ${item.title}${subject ? ` — with ${subject.fullName}` : ""}`,
              status: "Open",
              // Responsible = Project Manager only; no fallback to subject
              responsible: pm?.fullName ?? undefined,
              responsibleId: pm?.id ?? undefined,
              // Subject = the stakeholder this communication is about
              subject: subject?.fullName ?? undefined,
              recurringType: recurringType as any,
              recurringInterval: 1,
              communicationStakeholderId: item.id,
            } as any);
          }
        }
      } catch (e) {
        // Non-fatal: log but don't fail the subject add
        console.error("[addSubject] Failed to auto-create COMM tasks:", e);
      }

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
      const { assessmentDate, ...rest } = input;
      const result = await db.insert(engagementStatusHistory).values({
        stakeholderId: rest.stakeholderId,
        projectId: rest.projectId,
        statusType: rest.statusType,
        status: rest.status,
        notes: rest.notes,
        assessedBy: rest.assessedBy,
        assessmentDate: assessmentDate as any,
      });
      // Auto-update the stakeholder's current or desired engagement status
      try {
        if (rest.statusType === "current") {
          await db
            .update(stakeholders)
            .set({ currentEngagementStatus: rest.status as any })
            .where(eq(stakeholders.id, rest.stakeholderId));
        } else {
          await db
            .update(stakeholders)
            .set({ desiredEngagementStatus: rest.status as any })
            .where(eq(stakeholders.id, rest.stakeholderId));
        }
      } catch (e) {
        console.error("Failed to sync stakeholder engagement status:", e);
      }
      const rows = await db
        .select()
        .from(engagementStatusHistory)
        .where(eq(engagementStatusHistory.id, result[0].insertId))
        .limit(1);
      return rows[0];
    }),

  updateStatusHistory: protectedProcedure
    .input(z.object({
      id: z.number(),
      statusType: z.enum(["current", "desired"]).optional(),
      status: z.enum(["Unaware", "Resistant", "Neutral", "Supportive", "Leading"]).optional(),
      assessedBy: z.string().optional(),
      assessmentDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, assessmentDate, ...rest } = input;
      // Build update object using explicit Drizzle schema fields to avoid column name mismatch
      const updateData: Record<string, any> = {};
      if (rest.statusType !== undefined) updateData.statusType = rest.statusType;
      if (rest.status !== undefined) updateData.status = rest.status;
      if (rest.assessedBy !== undefined) updateData.assessedBy = rest.assessedBy;
      if (rest.notes !== undefined) updateData.notes = rest.notes;
      if (assessmentDate !== undefined) {
        // Ensure YYYY-MM-DD format — strip any time/timezone suffix
        const isoMatch = assessmentDate.match(/(\d{4}-\d{2}-\d{2})/);
        updateData.assessmentDate = isoMatch ? isoMatch[1] : assessmentDate;
      }
      await db.update(engagementStatusHistory).set(updateData).where(eq(engagementStatusHistory.id, id));
      // If status changed, also update the stakeholder's live status
      if (rest.status) {
        const rows = await db.select().from(engagementStatusHistory).where(eq(engagementStatusHistory.id, id)).limit(1);
        if (rows[0]) {
          const sType = rest.statusType ?? rows[0].statusType;
          try {
            if (sType === "current") {
              await db.update(stakeholders).set({ currentEngagementStatus: rest.status as any }).where(eq(stakeholders.id, rows[0].stakeholderId));
            } else {
              await db.update(stakeholders).set({ desiredEngagementStatus: rest.status as any }).where(eq(stakeholders.id, rows[0].stakeholderId));
            }
          } catch (e) { console.error(e); }
        }
      }
      return { success: true };
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
  // they should automatically be added as subjects and get COMM tasks created.
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

      let addedSubjects = 0;
      let addedCommTasks = 0;

      for (const group of groups) {
        // Fetch action items for this group
        const actionItems = await db
          .select()
          .from(engagementTasks)
          .where(eq(engagementTasks.taskGroupId, group.id));

        // Get the Project Manager for this group's project
        const pm = await getProjectManager(group.projectId);

        for (const s of allStakeholders) {
          if (!s.currentEngagementStatus || !s.desiredEngagementStatus) continue;
          const fromMatch = group.fromStatus === "Any" || group.fromStatus === s.currentEngagementStatus;
          const toMatch = group.toStatus === s.desiredEngagementStatus;
          if (!fromMatch || !toMatch) continue;

          // Insert subject (ignore duplicate)
          try {
            await db.insert(engagementTaskSubjects).values({
              taskGroupId: group.id,
              stakeholderId: s.id,
            });
            addedSubjects++;
          } catch { /* already exists — still create missing COMM tasks */ }

          // Responsible = PM only; if no PM defined, leave blank (null)
          const responsibleId = pm?.id ?? null;
          const responsibleName = pm?.fullName ?? null;

          // Create COMM tasks for each action item (whether subject was new or existing)
          for (const item of actionItems) {
            const existing = await db
              .select()
              .from(tasks)
              .where(
                and(
                  eq(tasks.projectId, group.projectId),
                  eq(tasks.communicationStakeholderId, item.id),
                  eq(tasks.responsibleId, responsibleId)
                )
              )
              .limit(1);

            if (existing.length === 0) {
              try {
                const taskId = await getNextId("commTask", "COMM", group.projectId);
                const periodic = item.periodic;
                const recurringType = periodic === "Daily" ? "daily"
                  : periodic === "Weekly" ? "weekly"
                  : periodic === "Monthly" ? "monthly"
                  : "none";
                await createTask({
                  projectId: group.projectId,
                  taskId,
                  description: `[${group.name}] ${item.title} — with ${s.fullName}`,
                  status: "Open",
                  // Responsible = PM only; if no PM, leave blank
                  responsible: responsibleName ?? undefined,
                  responsibleId: responsibleName ? responsibleId : undefined,
                  // Subject = the stakeholder this communication is about
                  subject: s.fullName ?? undefined,
                  recurringType: recurringType as any,
                  recurringInterval: 1,
                  communicationStakeholderId: item.id,
                } as any);
                addedCommTasks++;
              } catch (e) {
                console.error("[syncSubjects] Failed to create COMM task:", e);
              }
            }
          }
        }
      }

      return { success: true, addedSubjects, addedCommTasks };
    }),
});
