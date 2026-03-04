import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { testCases } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

async function getNextTestId(projectId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const existing = await db.select({ testId: testCases.testId })
    .from(testCases)
    .where(eq(testCases.projectId, projectId))
    .orderBy(desc(testCases.id));
  let maxNum = 0;
  for (const row of existing) {
    const match = row.testId.match(/(\d+)$/);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
  }
  return `TC-${String(maxNum + 1).padStart(4, "0")}`;
}

const testStepSchema = z.object({
  step: z.string(),
  expectedResult: z.string().optional(),
});

export const testCasesRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number(), requirementId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(testCases.projectId, input.projectId)];
      if (input.requirementId) conditions.push(eq(testCases.requirementId, input.requirementId));
      return db.select().from(testCases)
        .where(and(...conditions))
        .orderBy(desc(testCases.createdAt));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [tc] = await db.select().from(testCases).where(eq(testCases.id, input.id));
      return tc ?? null;
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      requirementId: z.string().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      preconditions: z.string().optional(),
      testSteps: z.array(testStepSchema).optional(),
      expectedResult: z.string().optional(),
      tester: z.string().optional(),
      testerId: z.number().optional(),
      priority: z.string().optional(),
      status: z.enum(["Not Executed", "In Progress", "Passed", "Failed", "Blocked", "Skipped"]).optional(),
      testType: z.string().optional(),
      executionDate: z.string().optional(),
      defectId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const testId = await getNextTestId(input.projectId);
      const { executionDate, testSteps, ...rest } = input;
      await db.insert(testCases).values({
        ...rest,
        testId,
        testSteps: testSteps ?? [],
        executionDate: executionDate ? new Date(executionDate) : null,
        status: rest.status ?? "Not Executed",
      });
      const [created] = await db.select().from(testCases)
        .where(and(eq(testCases.projectId, input.projectId), eq(testCases.testId, testId)));
      return created;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      requirementId: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      preconditions: z.string().optional(),
      testSteps: z.array(testStepSchema).optional(),
      expectedResult: z.string().optional(),
      actualResult: z.string().optional(),
      tester: z.string().optional(),
      priority: z.string().optional(),
      status: z.enum(["Not Executed", "In Progress", "Passed", "Failed", "Blocked", "Skipped"]).optional(),
      testType: z.string().optional(),
      executionDate: z.string().optional(),
      defectId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, executionDate, ...rest } = input;
      const updateData: Partial<typeof testCases.$inferInsert> = { ...rest };
      if (executionDate) updateData.executionDate = new Date(executionDate);
      await db.update(testCases).set(updateData).where(eq(testCases.id, id));
      const [updated] = await db.select().from(testCases).where(eq(testCases.id, id));
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(testCases).where(eq(testCases.id, input.id));
      return { success: true };
    }),

  // Link an existing test case to a requirement
  linkToRequirement: protectedProcedure
    .input(z.object({ id: z.number(), requirementId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(testCases).set({ requirementId: input.requirementId }).where(eq(testCases.id, input.id));
      return { success: true };
    }),

  // Unlink a test case from a requirement
  unlinkFromRequirement: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(testCases).set({ requirementId: null }).where(eq(testCases.id, input.id));
      return { success: true };
    }),

  // Summary stats for traceability
  statsByRequirement: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const all = await db.select().from(testCases).where(eq(testCases.projectId, input.projectId));
      const map: Record<string, { total: number; passed: number; failed: number; notExecuted: number }> = {};
      for (const tc of all) {
        const key = tc.requirementId ?? "__none__";
        if (!map[key]) map[key] = { total: 0, passed: 0, failed: 0, notExecuted: 0 };
        map[key].total++;
        if (tc.status === "Passed") map[key].passed++;
        else if (tc.status === "Failed") map[key].failed++;
        else map[key].notExecuted++;
      }
      return Object.entries(map).map(([requirementId, stats]) => ({ requirementId, ...stats }));
    }),
});
