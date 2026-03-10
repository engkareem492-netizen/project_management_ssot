import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { testRuns } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

async function getNextRunId(projectId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const existing = await db.select({ runId: testRuns.runId })
    .from(testRuns)
    .where(eq(testRuns.projectId, projectId))
    .orderBy(desc(testRuns.id));
  let maxNum = 0;
  for (const row of existing) {
    const match = row.runId.match(/(\d+)$/);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
  }
  return `TR-${String(maxNum + 1).padStart(4, "0")}`;
}

const stepResultSchema = z.object({
  step: z.string(),
  result: z.string(),
  status: z.string(),
});

export const testRunsRouter = router({
  listByTestCase: protectedProcedure
    .input(z.object({ projectId: z.number(), testCaseId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(testRuns)
        .where(and(eq(testRuns.projectId, input.projectId), eq(testRuns.testCaseId, input.testCaseId)))
        .orderBy(desc(testRuns.createdAt));
    }),

  listByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(testRuns)
        .where(eq(testRuns.projectId, input.projectId))
        .orderBy(desc(testRuns.createdAt));
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      testCaseId: z.number(),
      executedBy: z.string().optional(),
      executedById: z.number().optional(),
      executionDate: z.string().optional(),
      status: z.enum(["Not Executed", "Passed", "Failed", "Blocked", "Skipped"]).optional(),
      environment: z.string().optional(),
      actualResult: z.string().optional(),
      defectIds: z.array(z.string()).optional(),
      stepResults: z.array(stepResultSchema).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const runId = await getNextRunId(input.projectId);
      const { executionDate, ...rest } = input;
      await db.insert(testRuns).values({
        ...rest,
        runId,
        executionDate: executionDate ? new Date(executionDate) : null,
        defectIds: rest.defectIds ?? [],
        stepResults: rest.stepResults ?? [],
        status: rest.status ?? "Not Executed",
      });
      const [created] = await db.select().from(testRuns)
        .where(and(eq(testRuns.projectId, input.projectId), eq(testRuns.runId, runId)));
      return created;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      executedBy: z.string().optional(),
      executedById: z.number().optional().nullable(),
      executionDate: z.string().optional().nullable(),
      status: z.enum(["Not Executed", "Passed", "Failed", "Blocked", "Skipped"]).optional(),
      environment: z.string().optional(),
      actualResult: z.string().optional(),
      defectIds: z.array(z.string()).optional(),
      stepResults: z.array(stepResultSchema).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, executionDate, ...rest } = input;
      await db.update(testRuns).set({
        ...rest,
        executionDate: executionDate ? new Date(executionDate) : null,
      }).where(eq(testRuns.id, id));
      const [updated] = await db.select().from(testRuns).where(eq(testRuns.id, id));
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(testRuns).where(eq(testRuns.id, input.id));
      return { success: true };
    }),
});
