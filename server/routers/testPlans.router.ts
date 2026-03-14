import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { testPlans, testPlanTestCases } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const testPlansRouter = router({
  // ── List all test plans for a project ─────────────────────────────────────
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.select().from(testPlans)
        .where(eq(testPlans.projectId, input.projectId))
        .orderBy(desc(testPlans.createdAt));
    }),

  // ── Get single test plan with linked test case IDs ────────────────────────
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const [plan] = await db.select().from(testPlans).where(eq(testPlans.id, input.id)).limit(1);
      if (!plan) return null;
      const linked = await db.select().from(testPlanTestCases)
        .where(eq(testPlanTestCases.testPlanId, input.id));
      return { ...plan, linkedTestCaseIds: linked.map(t => t.testCaseId) };
    }),

  // ── Create test plan ──────────────────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      status: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      owner: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const existing = await db.select().from(testPlans).where(eq(testPlans.projectId, input.projectId));
      const nextNum = (existing.length + 1).toString().padStart(4, "0");
      const planCode = `TP-${nextNum}`;
      const insertData: Record<string, unknown> = {
        projectId: input.projectId,
        title: input.title,
        planCode,
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
        ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
        ...(input.owner !== undefined ? { owner: input.owner } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      };
      const [result] = await db.insert(testPlans).values(insertData as any);
      return { id: (result as { insertId: number }).insertId, planCode };
    }),

  // ── Update test plan ──────────────────────────────────────────────────────
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      owner: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.startDate !== undefined) updateData.startDate = data.startDate;
      if (data.endDate !== undefined) updateData.endDate = data.endDate;
      if (data.owner !== undefined) updateData.owner = data.owner;
      if (data.notes !== undefined) updateData.notes = data.notes;
      return db.update(testPlans).set(updateData as any).where(eq(testPlans.id, id));
    }),

  // ── Delete test plan ──────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.delete(testPlanTestCases).where(eq(testPlanTestCases.testPlanId, input.id));
      return db.delete(testPlans).where(eq(testPlans.id, input.id));
    }),

  // ── Link / unlink test case to test plan ──────────────────────────────────
  linkTestCase: protectedProcedure
    .input(z.object({ testPlanId: z.number(), testCaseId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const existing = await db.select().from(testPlanTestCases)
        .where(and(eq(testPlanTestCases.testPlanId, input.testPlanId), eq(testPlanTestCases.testCaseId, input.testCaseId)));
      if (existing.length > 0) return { already: true };
      return db.insert(testPlanTestCases).values(input);
    }),

  unlinkTestCase: protectedProcedure
    .input(z.object({ testPlanId: z.number(), testCaseId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.delete(testPlanTestCases)
        .where(and(eq(testPlanTestCases.testPlanId, input.testPlanId), eq(testPlanTestCases.testCaseId, input.testCaseId)));
    }),

  // ── Get test cases linked to a plan ──────────────────────────────────────
  getLinkedTestCases: protectedProcedure
    .input(z.object({ testPlanId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.select().from(testPlanTestCases)
        .where(eq(testPlanTestCases.testPlanId, input.testPlanId));
    }),
});
