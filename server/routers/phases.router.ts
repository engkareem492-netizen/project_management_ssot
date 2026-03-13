import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { phases } from "../../drizzle/schema";
import { eq, asc } from "drizzle-orm";

async function getNextPhaseCode(projectId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select({ phaseCode: phases.phaseCode })
    .from(phases)
    .where(eq(phases.projectId, projectId));
  let maxNum = 0;
  for (const row of existing) {
    const match = row.phaseCode?.match(/(\d+)$/);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
  }
  return `PH-${String(maxNum + 1).padStart(4, "0")}`;
}

export const phasesRouter = router({
  // ── List all phases for a project ──────────────────────────────────────────
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(phases)
        .where(eq(phases.projectId, input.projectId))
        .orderBy(asc(phases.order), asc(phases.createdAt));
    }),

  // ── Create phase ────────────────────────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      status: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      order: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const phaseCode = await getNextPhaseCode(input.projectId);
      const { startDate, endDate, ...rest } = input;
      await db.insert(phases).values({
        ...rest,
        phaseCode,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      });
      const [created] = await db.select().from(phases)
        .where(eq(phases.projectId, input.projectId))
        .orderBy(asc(phases.id));
      // Return the last inserted
      const all = await db.select().from(phases).where(eq(phases.projectId, input.projectId));
      return all[all.length - 1];
    }),

  // ── Update phase ────────────────────────────────────────────────────────────
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      startDate: z.string().optional().nullable(),
      endDate: z.string().optional().nullable(),
      order: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const { id, startDate, endDate, ...rest } = input;
      await db.update(phases).set({
        ...rest,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      }).where(eq(phases.id, id));
      const [updated] = await db.select().from(phases).where(eq(phases.id, id));
      return updated;
    }),

  // ── Delete phase ────────────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.delete(phases).where(eq(phases.id, input.id));
      return { success: true };
    }),
});
