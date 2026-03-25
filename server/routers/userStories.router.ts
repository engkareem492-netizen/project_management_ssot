/**
 * User Stories Router
 * SAP Cloud ALM-inspired user stories linked to scope items and requirements.
 *
 * Hierarchy: Scope Item → User Story ↔ Requirement
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { getNextId } from "../db";
import {
  userStories,
  userStoryRequirements,
  userStoryTasks,
  requirements,
  scopeItems,
  stakeholders,
  tasks,
} from "../../drizzle/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ─── Story Zod shapes ────────────────────────────────────────────────────────

const storyFields = z.object({
  title: z.string(),
  description: z.string().optional().nullable(),
  acceptanceCriteria: z.string().optional().nullable(),
  priority: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  storyPoints: z.number().optional().nullable(),
  effortDays: z.number().optional().nullable(),
  scopeItemId: z.number().optional().nullable(),
  sprintId: z.number().optional().nullable(),
  assignedToId: z.number().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  processStep: z.string().optional().nullable(),
  businessRole: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const userStoriesRouter = router({
  // ── List all user stories for a project ──────────────────────────────────
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const rows = await db
        .select({
          id: userStories.id,
          projectId: userStories.projectId,
          storyId: userStories.storyId,
          title: userStories.title,
          description: userStories.description,
          acceptanceCriteria: userStories.acceptanceCriteria,
          priority: userStories.priority,
          status: userStories.status,
          storyPoints: userStories.storyPoints,
          effortDays: userStories.effortDays,
          scopeItemId: userStories.scopeItemId,
          sprintId: userStories.sprintId,
          assignedToId: userStories.assignedToId,
          assignedTo: userStories.assignedTo,
          processStep: userStories.processStep,
          businessRole: userStories.businessRole,
          notes: userStories.notes,
          createdAt: userStories.createdAt,
          updatedAt: userStories.updatedAt,
          // Scope item name via join
          scopeItemName: scopeItems.name,
          scopeItemCode: scopeItems.idCode,
          // Assignee display name from stakeholders
          assigneeName: stakeholders.fullName,
        })
        .from(userStories)
        .leftJoin(scopeItems, eq(userStories.scopeItemId, scopeItems.id))
        .leftJoin(stakeholders, eq(userStories.assignedToId, stakeholders.id))
        .where(eq(userStories.projectId, input.projectId))
        .orderBy(userStories.storyId);

      // Attach requirement IDs for each story
      const storyIds = rows.map((r) => r.id);
      const junctionRows =
        storyIds.length > 0
          ? await db
              .select({
                userStoryId: userStoryRequirements.userStoryId,
                requirementId: userStoryRequirements.requirementId,
                reqIdCode: requirements.idCode,
              })
              .from(userStoryRequirements)
              .leftJoin(
                requirements,
                eq(userStoryRequirements.requirementId, requirements.id)
              )
              .where(inArray(userStoryRequirements.userStoryId, storyIds))
          : [];

      const reqMap = new Map<number, { id: number; idCode: string }[]>();
      for (const j of junctionRows) {
        if (!reqMap.has(j.userStoryId)) reqMap.set(j.userStoryId, []);
        reqMap.get(j.userStoryId)!.push({
          id: j.requirementId,
          idCode: j.reqIdCode ?? "",
        });
      }

      // Attach linked task IDs for each story
      const taskLinks =
        storyIds.length > 0
          ? await db
              .select({
                userStoryId: userStoryTasks.userStoryId,
                taskId: userStoryTasks.taskId,
                taskCode: tasks.taskId,
                taskDescription: tasks.description,
                taskStatus: tasks.status,
              })
              .from(userStoryTasks)
              .leftJoin(tasks, eq(userStoryTasks.taskId, tasks.id))
              .where(inArray(userStoryTasks.userStoryId, storyIds))
          : [];

      const taskMap = new Map<number, { id: number; taskId: string; description: string | null; status: string | null }[]>();
      for (const t of taskLinks) {
        if (!taskMap.has(t.userStoryId)) taskMap.set(t.userStoryId, []);
        taskMap.get(t.userStoryId)!.push({
          id: t.taskId,
          taskId: t.taskCode ?? "",
          description: t.taskDescription ?? null,
          status: t.taskStatus ?? null,
        });
      }

      return rows.map((r) => ({
        ...r,
        requirements: reqMap.get(r.id) ?? [],
        linkedTasks: taskMap.get(r.id) ?? [],
      }));
    }),

  // ── Get single story ──────────────────────────────────────────────────────
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [row] = await db
        .select()
        .from(userStories)
        .where(eq(userStories.id, input.id))
        .limit(1);
      if (!row) return null;

      const junctionRows = await db
        .select({
          userStoryId: userStoryRequirements.userStoryId,
          requirementId: userStoryRequirements.requirementId,
          reqIdCode: requirements.idCode,
          reqDescription: requirements.description,
        })
        .from(userStoryRequirements)
        .leftJoin(
          requirements,
          eq(userStoryRequirements.requirementId, requirements.id)
        )
        .where(eq(userStoryRequirements.userStoryId, input.id));

      return {
        ...row,
        requirements: junctionRows.map((j) => ({
          id: j.requirementId,
          idCode: j.reqIdCode ?? "",
          description: j.reqDescription ?? "",
        })),
      };
    }),

  // ── Create ────────────────────────────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({ projectId: z.number() }).merge(storyFields))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const storyId = await getNextId("User Story", "US", input.projectId);
      const { ...data } = input;
      await db.insert(userStories).values({ ...data, storyId } as any);

      // Return newly created story
      const [created] = await db
        .select()
        .from(userStories)
        .where(
          and(
            eq(userStories.projectId, input.projectId),
            eq(userStories.storyId, storyId)
          )
        )
        .limit(1);
      return created;
    }),

  // ── Update ────────────────────────────────────────────────────────────────
  update: protectedProcedure
    .input(z.object({ id: z.number(), data: storyFields.partial() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db.update(userStories).set(input.data as any).where(eq(userStories.id, input.id));
      return { success: true };
    }),

  // ── Delete ────────────────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Remove junction rows first
      await db
        .delete(userStoryRequirements)
        .where(eq(userStoryRequirements.userStoryId, input.id));
      await db
        .delete(userStoryTasks)
        .where(eq(userStoryTasks.userStoryId, input.id));
      await db.delete(userStories).where(eq(userStories.id, input.id));
      return { success: true };
    }),

  // ── Link / Unlink a requirement to a user story ───────────────────────────
  linkRequirement: protectedProcedure
    .input(
      z.object({
        userStoryId: z.number(),
        requirementId: z.number(),
        projectId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      try {
        await db.insert(userStoryRequirements).values(input);
      } catch (e: any) {
        // Ignore duplicate key — already linked
        if (e.code !== "ER_DUP_ENTRY" && !e.message?.includes("uq_us_req")) throw e;
      }
      return { success: true };
    }),

  unlinkRequirement: protectedProcedure
    .input(
      z.object({ userStoryId: z.number(), requirementId: z.number() })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db
        .delete(userStoryRequirements)
        .where(
          and(
            eq(userStoryRequirements.userStoryId, input.userStoryId),
            eq(userStoryRequirements.requirementId, input.requirementId)
          )
        );
      return { success: true };
    }),

  // ── Link / Unlink a task to a user story ─────────────────────────────────
  linkTask: protectedProcedure
    .input(
      z.object({
        userStoryId: z.number(),
        taskId: z.number(),
        projectId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      try {
        await db.insert(userStoryTasks).values(input);
      } catch (e: any) {
        if (e.code !== "ER_DUP_ENTRY") throw e;
      }
      return { success: true };
    }),

  unlinkTask: protectedProcedure
    .input(z.object({ userStoryId: z.number(), taskId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db
        .delete(userStoryTasks)
        .where(
          and(
            eq(userStoryTasks.userStoryId, input.userStoryId),
            eq(userStoryTasks.taskId, input.taskId)
          )
        );
      return { success: true };
    }),

  // ── Get all stories linked to a scope item ────────────────────────────────
  listByScopeItem: protectedProcedure
    .input(z.object({ scopeItemId: z.number(), projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(userStories)
        .where(
          and(
            eq(userStories.scopeItemId, input.scopeItemId),
            eq(userStories.projectId, input.projectId)
          )
        )
        .orderBy(userStories.storyId);
    }),

  // ── Scope Coverage overview ───────────────────────────────────────────────
  // For each scope item: counts of linked requirements, user stories, issues
  scopeCoverage: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const { projectId } = input;

      const scopes = await db
        .select()
        .from(scopeItems)
        .where(eq(scopeItems.projectId, projectId))
        .orderBy(scopeItems.idCode);

      if (scopes.length === 0) return [];

      // Requirements per scope item
      const reqCounts = await db
        .select({
          scopeItemId: requirements.scopeItemId,
          total: sql<number>`COUNT(*)`,
        })
        .from(requirements)
        .where(eq(requirements.projectId, projectId))
        .groupBy(requirements.scopeItemId);

      // User stories per scope item
      const storyCounts = await db
        .select({
          scopeItemId: userStories.scopeItemId,
          total: sql<number>`COUNT(*)`,
          doneCount: sql<number>`SUM(CASE WHEN \`status\` IN ('Done','Accepted','Closed') THEN 1 ELSE 0 END)`,
        })
        .from(userStories)
        .where(eq(userStories.projectId, projectId))
        .groupBy(userStories.scopeItemId);

      // Issues per scope item (raw query to handle nullable scopeItemId group by)
      const [issueRaw] = await db.execute(
        sql`SELECT scopeItemId, COUNT(*) as total,
            SUM(CASE WHEN status NOT IN ('Closed','Resolved','Done','Completed','Cancelled') THEN 1 ELSE 0 END) as openCount
            FROM issues WHERE projectId = ${projectId} AND scopeItemId IS NOT NULL GROUP BY scopeItemId`
      );
      const issueRows = (issueRaw as unknown as any[]) as { scopeItemId: number; total: number; openCount: number }[];

      // Task completion per scope item (via user stories → userStoryTasks → tasks)
      const [taskRaw] = await db.execute(
        sql`SELECT si.id as scopeItemId,
            COUNT(DISTINCT ust.taskId) as taskTotal,
            SUM(CASE WHEN t.status IN ('Done','Completed','Closed','Cancelled') THEN 1 ELSE 0 END) as taskDone
            FROM scopeItems si
            JOIN userStories us ON us.scopeItemId = si.id AND us.projectId = ${projectId}
            JOIN userStoryTasks ust ON ust.userStoryId = us.id
            JOIN tasks t ON t.id = ust.taskId
            WHERE si.projectId = ${projectId}
            GROUP BY si.id`
      );
      const taskRows = (taskRaw as unknown as any[]) as { scopeItemId: number; taskTotal: number; taskDone: number }[];

      const reqMap = new Map<number, number>();
      for (const r of reqCounts) if (r.scopeItemId != null) reqMap.set(r.scopeItemId, Number(r.total));

      const storyMap = new Map<number, { total: number; done: number }>();
      for (const s of storyCounts) if (s.scopeItemId != null) storyMap.set(s.scopeItemId, { total: Number(s.total), done: Number(s.doneCount ?? 0) });

      const issueMap = new Map<number, { total: number; open: number }>();
      for (const i of issueRows) issueMap.set(Number(i.scopeItemId), { total: Number(i.total), open: Number(i.openCount) });

      const taskMap = new Map<number, { total: number; done: number }>();
      for (const t of taskRows) taskMap.set(Number(t.scopeItemId), { total: Number(t.taskTotal), done: Number(t.taskDone ?? 0) });

      return scopes.map((sc) => {
        const reqCount = reqMap.get(sc.id) ?? 0;
        const story = storyMap.get(sc.id) ?? { total: 0, done: 0 };
        const issue = issueMap.get(sc.id) ?? { total: 0, open: 0 };
        const task = taskMap.get(sc.id) ?? { total: 0, done: 0 };
        const health = reqCount === 0 ? "red" : story.total === 0 ? "yellow" : "green";
        return { scopeItem: sc, requirementCount: reqCount, userStoryCount: story.total, userStoryDoneCount: story.done, issueCount: issue.total, openIssueCount: issue.open, taskCount: task.total, taskDoneCount: task.done, health };
      });
    }),
});
