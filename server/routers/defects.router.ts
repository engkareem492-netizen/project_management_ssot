import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { defects, defectTestCases, testCases } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const defectsRouter = router({
  // ── List all defects for a project ────────────────────────────────────────
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.select().from(defects)
        .where(eq(defects.projectId, input.projectId))
        .orderBy(desc(defects.createdAt));
    }),

  // ── Get single defect with linked test case IDs ───────────────────────────
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const [defect] = await db.select().from(defects).where(eq(defects.id, input.id)).limit(1);
      if (!defect) return null;
      const linked = await db.select().from(defectTestCases)
        .where(eq(defectTestCases.defectId, input.id));
      // Fetch full test case details for linked TCs
      const linkedTCDetails = linked.length > 0
        ? await Promise.all(linked.map(async l => {
            const [tc] = await db.select().from(testCases).where(eq(testCases.id, l.testCaseId)).limit(1);
            return tc ? { id: tc.id, testId: tc.testId, title: tc.title, status: tc.status } : null;
          }))
        : [];
      return {
        ...defect,
        linkedTestCaseIds: linked.map(t => t.testCaseId),
        linkedTestCases: linkedTCDetails.filter(Boolean),
      };
    }),

  // ── Create defect ─────────────────────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      severity: z.string().optional(),
      priority: z.string().optional(),
      status: z.string().optional(),
      reportedBy: z.string().optional(),
      assignedTo: z.string().optional(),
      stepsToReproduce: z.string().optional(),
      expectedResult: z.string().optional(),
      actualResult: z.string().optional(),
      resolution: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const existing = await db.select().from(defects).where(eq(defects.projectId, input.projectId));
      const nextNum = (existing.length + 1).toString().padStart(4, "0");
      const defectCode = `DF-${nextNum}`;
      const [result] = await db.insert(defects).values({ ...input, defectCode });
      return { id: (result as { insertId: number }).insertId, defectCode };
    }),

  // ── Update defect ─────────────────────────────────────────────────────────
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      severity: z.string().optional(),
      priority: z.string().optional(),
      status: z.string().optional(),
      reportedBy: z.string().optional(),
      assignedTo: z.string().optional(),
      stepsToReproduce: z.string().optional(),
      expectedResult: z.string().optional(),
      actualResult: z.string().optional(),
      resolution: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const { id, ...data } = input;
      return db.update(defects).set(data).where(eq(defects.id, id));
    }),

  // ── Delete defect ─────────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.delete(defectTestCases).where(eq(defectTestCases.defectId, input.id));
      return db.delete(defects).where(eq(defects.id, input.id));
    }),

  // ── Link / unlink test case to defect ─────────────────────────────────────
  linkTestCase: protectedProcedure
    .input(z.object({ defectId: z.number(), testCaseId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const existing = await db.select().from(defectTestCases)
        .where(and(eq(defectTestCases.defectId, input.defectId), eq(defectTestCases.testCaseId, input.testCaseId)));
      if (existing.length > 0) return { already: true };
      return db.insert(defectTestCases).values(input);
    }),

  unlinkTestCase: protectedProcedure
    .input(z.object({ defectId: z.number(), testCaseId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.delete(defectTestCases)
        .where(and(eq(defectTestCases.defectId, input.defectId), eq(defectTestCases.testCaseId, input.testCaseId)));
    }),

  // ── Defect Density per Test Case ──────────────────────────────────────────
  defectDensity: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      // Get all test cases for the project
      const allTCs = await db.select().from(testCases)
        .where(eq(testCases.projectId, input.projectId));
      // Get all defects for the project
      const projectDefects = await db.select().from(defects)
        .where(eq(defects.projectId, input.projectId));
      const defectIds = projectDefects.map(d => d.id);
      // Get all junction rows for these defects
      let links: { defectId: number; testCaseId: number }[] = [];
      if (defectIds.length > 0) {
        const allLinks = await db.select().from(defectTestCases);
        links = allLinks.filter(l => defectIds.includes(l.defectId));
      }
      // Build density map: testCaseId → defect count + defect details
      const densityMap = new Map<number, {
        count: number;
        defects: { id: number; defectCode: string | null; title: string; severity: string | null; status: string | null }[];
      }>();
      for (const tc of allTCs) {
        densityMap.set(tc.id, { count: 0, defects: [] });
      }
      for (const link of links) {
        const entry = densityMap.get(link.testCaseId);
        if (entry) {
          const defect = projectDefects.find(d => d.id === link.defectId);
          if (defect) {
            entry.count++;
            entry.defects.push({
              id: defect.id,
              defectCode: defect.defectCode,
              title: defect.title,
              severity: defect.severity,
              status: defect.status,
            });
          }
        }
      }
      // Return sorted by defect count descending
      const rows = allTCs.map(tc => ({
        testCaseId: tc.id,
        testId: tc.testId,
        title: tc.title,
        status: tc.status,
        defectCount: densityMap.get(tc.id)?.count ?? 0,
        linkedDefects: densityMap.get(tc.id)?.defects ?? [],
      })).sort((a, b) => b.defectCount - a.defectCount);
      return {
        rows,
        totalTestCases: allTCs.length,
        totalDefects: projectDefects.length,
        totalLinks: links.length,
        testCasesWithDefects: rows.filter(r => r.defectCount > 0).length,
      };
    }),

  // ── Summary counts by status ──────────────────────────────────────────────
  summary: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const all = await db.select().from(defects).where(eq(defects.projectId, input.projectId));
      const counts: Record<string, number> = {};
      for (const d of all) {
        const s = d.status ?? "Open";
        counts[s] = (counts[s] ?? 0) + 1;
      }
      return { total: all.length, byStatus: counts };
    }),
});
