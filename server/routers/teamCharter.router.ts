import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { teamCharter } from "../../drizzle/schema";

export const teamCharterRouter = router({
  get: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db
        .select()
        .from(teamCharter)
        .where(eq(teamCharter.projectId, input.projectId))
        .limit(1);
      return rows[0] ?? null;
    }),

  upsert: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      mission: z.string().optional(),
      scopeAndBoundaries: z.string().optional(),
      metricsOfSuccess: z.string().optional(),
      coreValues: z.string().optional(),
      groundRules: z.string().optional(),
      restrictedViolations: z.string().optional(),
      teamActivities: z.string().optional(),
      internalCommunicationPlan: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const existing = await db
        .select()
        .from(teamCharter)
        .where(eq(teamCharter.projectId, input.projectId))
        .limit(1);

      if (existing.length > 0) {
        const { projectId, ...data } = input;
        await db.update(teamCharter).set(data).where(eq(teamCharter.projectId, input.projectId));
      } else {
        await db.insert(teamCharter).values(input);
      }

      const rows = await db
        .select()
        .from(teamCharter)
        .where(eq(teamCharter.projectId, input.projectId))
        .limit(1);
      return rows[0];
    }),
});
