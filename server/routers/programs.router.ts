import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { programs, projects } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const programsRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return await db.select().from(programs).orderBy(programs.name);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(programs).where(eq(programs.id, input.id)).limit(1);
      return rows[0] ?? null;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional().nullable(),
      portfolioId: z.number().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(programs).values({
        name: input.name,
        description: input.description ?? null,
        portfolioId: input.portfolioId ?? null,
        createdBy: ctx.user.id,
      });
      const rows = await db.select().from(programs).where(eq(programs.id, result[0].insertId)).limit(1);
      return rows[0];
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      portfolioId: z.number().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      await db.update(programs).set(data).where(eq(programs.id, id));
      const rows = await db.select().from(programs).where(eq(programs.id, id)).limit(1);
      return rows[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      // Unlink projects first
      await db.update(projects)
        .set({ programId: null })
        .where(eq(projects.programId, input.id));
      await db.delete(programs).where(eq(programs.id, input.id));
      return { success: true };
    }),

  /** Returns all projects in this program */
  getProjects: protectedProcedure
    .input(z.object({ programId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(projects)
        .where(eq(projects.programId, input.programId))
        .orderBy(projects.name);
    }),

  /** Link a project to a program (sets projects.programId) */
  linkProject: protectedProcedure
    .input(z.object({ programId: z.number(), projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(projects)
        .set({ programId: input.programId })
        .where(eq(projects.id, input.projectId));
      return { success: true };
    }),

  /**
   * Returns pooled (isPooledResource=true) stakeholders across all projects
   * in this program. Used to show cross-project resource impact.
   */
  getPooledStakeholders: protectedProcedure
    .input(z.object({ programId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const { stakeholders } = await import("../../drizzle/schema");
      const { eq: eqOp, and } = await import("drizzle-orm");

      const programProjects = await db.select({ id: projects.id })
        .from(projects)
        .where(eqOp(projects.programId, input.programId));

      if (programProjects.length === 0) return [];
      const projectIds = programProjects.map((p) => p.id);

      const { inArray } = await import("drizzle-orm");
      return await db.select().from(stakeholders).where(
        and(
          inArray(stakeholders.projectId, projectIds),
          eqOp(stakeholders.isPooledResource, true),
        )
      ).orderBy(stakeholders.fullName);
    }),
});
