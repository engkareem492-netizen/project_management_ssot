import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { features, featureRequirements, userStories, requirementUserStories } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const featuresRouter = router({
  // ── List all features for a project ──────────────────────────────────────
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.select().from(features)
        .where(eq(features.projectId, input.projectId))
        .orderBy(desc(features.createdAt));
    }),

  // ── Get single feature with linked requirements and user stories ──────────
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const [feature] = await db.select().from(features).where(eq(features.id, input.id)).limit(1);
      if (!feature) return null;
      const linkedReqs = await db.select().from(featureRequirements)
        .where(eq(featureRequirements.featureId, input.id));
      const linkedStories = await db.select().from(userStories)
        .where(eq(userStories.featureId, input.id));
      return { ...feature, linkedRequirementIds: linkedReqs.map(r => r.requirementId), userStories: linkedStories };
    }),

  // ── Create feature ────────────────────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      owner: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      // Auto-generate feature code
      const existing = await db.select().from(features).where(eq(features.projectId, input.projectId));
      const nextNum = (existing.length + 1).toString().padStart(4, "0");
      const featureCode = `FT-${nextNum}`;
      const [result] = await db.insert(features).values({ ...input, featureCode });
      return { id: (result as { insertId: number }).insertId, featureCode };
    }),

  // ── Update feature ────────────────────────────────────────────────────────
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      owner: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const { id, ...data } = input;
      return db.update(features).set(data).where(eq(features.id, id));
    }),

  // ── Delete feature ────────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.delete(featureRequirements).where(eq(featureRequirements.featureId, input.id));
      return db.delete(features).where(eq(features.id, input.id));
    }),

  // ── Link / unlink requirements to a feature ───────────────────────────────
  linkRequirement: protectedProcedure
    .input(z.object({ featureId: z.number(), requirementId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const existing = await db.select().from(featureRequirements)
        .where(and(eq(featureRequirements.featureId, input.featureId), eq(featureRequirements.requirementId, input.requirementId)));
      if (existing.length > 0) return { already: true };
      return db.insert(featureRequirements).values(input);
    }),

  unlinkRequirement: protectedProcedure
    .input(z.object({ featureId: z.number(), requirementId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.delete(featureRequirements)
        .where(and(eq(featureRequirements.featureId, input.featureId), eq(featureRequirements.requirementId, input.requirementId)));
    }),

  // ── Get requirements linked to a feature ─────────────────────────────────
  getLinkedRequirements: protectedProcedure
    .input(z.object({ featureId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      return db.select().from(featureRequirements)
        .where(eq(featureRequirements.featureId, input.featureId));
    }),
});
