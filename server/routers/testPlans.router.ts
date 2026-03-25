import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { testPlans, testPlanTestCases } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const testPlansRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.select().from(testPlans).where(eq(testPlans.projectId, input.projectId)).orderBy(desc(testPlans.createdAt));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const [plan] = await db.select().from(testPlans).where(eq(testPlans.id, input.id)).limit(1);
      if (!plan) return null;
      const linked = await db.select().from(testPlanTestCases).where(eq(testPlanTestCases.testPlanId, input.id));
      return { ...plan, linkedTestCaseIds: linked.map(t => t.testCaseId) };
    }),

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
      const [result] = await db.insert(testPlans).values(input);
      return { id: (result as { insertId: number }).insertId };
    }),

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
      return db.update(testPlans).set(data).where(eq(testPlans.id, id));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.delete(testPlanTestCases).where(eq(testPlanTestCases.testPlanId, input.id));
      return db.delete(testPlans).where(eq(testPlans.id, input.id));
    }),

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
});
