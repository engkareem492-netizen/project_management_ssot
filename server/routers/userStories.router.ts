import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  userStories, requirementUserStories, userStoryTestCases,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const userStoriesRouter = router({
  // ── List all user stories for a project ───────────────────────────────────
  list: protectedProcedure
    .input(z.object({ projectId: z.number(), featureId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const rows = await db.select().from(userStories)
        .where(eq(userStories.projectId, input.projectId))
        .orderBy(desc(userStories.createdAt));
      if (input.featureId !== undefined) {
        return rows.filter(r => r.featureId === input.featureId);
      }
      return rows;
    }),

  // ── Get single story with linked requirements and test cases ──────────────
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const [story] = await db.select().from(userStories).where(eq(userStories.id, input.id)).limit(1);
      if (!story) return null;
      const linkedReqs = await db.select().from(requirementUserStories)
        .where(eq(requirementUserStories.userStoryId, input.id));
      const linkedTCs = await db.select().from(userStoryTestCases)
        .where(eq(userStoryTestCases.userStoryId, input.id));
      return {
        ...story,
        linkedRequirementIds: linkedReqs.map(r => r.requirementId),
        linkedTestCaseIds: linkedTCs.map(t => t.testCaseId),
      };
    }),

  // ── Create user story ─────────────────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      featureId: z.number().optional(),
      title: z.string().min(1),
      asA: z.string().optional(),
      iWant: z.string().optional(),
      soThat: z.string().optional(),
      acceptanceCriteria: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      storyPoints: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const existing = await db.select().from(userStories).where(eq(userStories.projectId, input.projectId));
      const nextNum = (existing.length + 1).toString().padStart(4, "0");
      const storyCode = `US-${nextNum}`;
      const [result] = await db.insert(userStories).values({ ...input, storyCode });
      return { id: (result as { insertId: number }).insertId, storyCode };
    }),

  // ── Update user story ─────────────────────────────────────────────────────
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      featureId: z.number().nullable().optional(),
      title: z.string().optional(),
      asA: z.string().optional(),
      iWant: z.string().optional(),
      soThat: z.string().optional(),
      acceptanceCriteria: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      storyPoints: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const { id, ...data } = input;
      return db.update(userStories).set(data).where(eq(userStories.id, id));
    }),

  // ── Delete user story ─────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.delete(requirementUserStories).where(eq(requirementUserStories.userStoryId, input.id));
      await db.delete(userStoryTestCases).where(eq(userStoryTestCases.userStoryId, input.id));
      return db.delete(userStories).where(eq(userStories.id, input.id));
    }),

  // ── Link / unlink requirement to user story ───────────────────────────────
  linkRequirement: protectedProcedure
    .input(z.object({ userStoryId: z.number(), requirementId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const existing = await db.select().from(requirementUserStories)
        .where(and(eq(requirementUserStories.userStoryId, input.userStoryId), eq(requirementUserStories.requirementId, input.requirementId)));
      if (existing.length > 0) return { already: true };
      return db.insert(requirementUserStories).values(input);
    }),

  unlinkRequirement: protectedProcedure
    .input(z.object({ userStoryId: z.number(), requirementId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.delete(requirementUserStories)
        .where(and(eq(requirementUserStories.userStoryId, input.userStoryId), eq(requirementUserStories.requirementId, input.requirementId)));
    }),

  // ── Link / unlink test case to user story ─────────────────────────────────
  linkTestCase: protectedProcedure
    .input(z.object({ userStoryId: z.number(), testCaseId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const existing = await db.select().from(userStoryTestCases)
        .where(and(eq(userStoryTestCases.userStoryId, input.userStoryId), eq(userStoryTestCases.testCaseId, input.testCaseId)));
      if (existing.length > 0) return { already: true };
      return db.insert(userStoryTestCases).values(input);
    }),

  unlinkTestCase: protectedProcedure
    .input(z.object({ userStoryId: z.number(), testCaseId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.delete(userStoryTestCases)
        .where(and(eq(userStoryTestCases.userStoryId, input.userStoryId), eq(userStoryTestCases.testCaseId, input.testCaseId)));
    }),

  // ── Get linked requirements for a story ──────────────────────────────────
  getLinkedRequirements: protectedProcedure
    .input(z.object({ userStoryId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.select().from(requirementUserStories)
        .where(eq(requirementUserStories.userStoryId, input.userStoryId));
    }),
});
