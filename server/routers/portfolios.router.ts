import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { portfolios, programs, projects } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const portfoliosRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return await db.select().from(portfolios).orderBy(portfolios.name);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(portfolios).where(eq(portfolios.id, input.id)).limit(1);
      return rows[0] ?? null;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(portfolios).values({
        name: input.name,
        description: input.description ?? null,
        createdBy: ctx.user.id,
      });
      const rows = await db.select().from(portfolios).where(eq(portfolios.id, result[0].insertId)).limit(1);
      return rows[0];
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      await db.update(portfolios).set(data).where(eq(portfolios.id, id));
      const rows = await db.select().from(portfolios).where(eq(portfolios.id, id)).limit(1);
      return rows[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      // Unlink projects first
      await db.update(projects)
        .set({ portfolioId: null })
        .where(eq(projects.portfolioId, input.id));
      // Unlink programs
      await db.update(programs)
        .set({ portfolioId: null })
        .where(eq(programs.portfolioId, input.id));
      await db.delete(portfolios).where(eq(portfolios.id, input.id));
      return { success: true };
    }),

  /** Returns all projects whose portfolioId matches */
  getProjects: protectedProcedure
    .input(z.object({ portfolioId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(projects)
        .where(eq(projects.portfolioId, input.portfolioId))
        .orderBy(projects.name);
    }),

  /** Returns all programs under this portfolio */
  getPrograms: protectedProcedure
    .input(z.object({ portfolioId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(programs)
        .where(eq(programs.portfolioId, input.portfolioId))
        .orderBy(programs.name);
    }),

  /** Link a program to a portfolio (sets programs.portfolioId) */
  linkProgram: protectedProcedure
    .input(z.object({ portfolioId: z.number(), programId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(programs)
        .set({ portfolioId: input.portfolioId })
        .where(eq(programs.id, input.programId));
      return { success: true };
    }),

  /** Link a project directly to a portfolio (sets projects.portfolioId) */
  linkProject: protectedProcedure
    .input(z.object({ portfolioId: z.number(), projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(projects)
        .set({ portfolioId: input.portfolioId })
        .where(eq(projects.id, input.projectId));
      return { success: true };
    }),

  /**
   * Returns a full summary: portfolio + programs + projects (grouped),
   * plus unassigned projects that have no programId but belong to this portfolio.
   */
  getSummary: protectedProcedure
    .input(z.object({ portfolioId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [portfolio] = await db.select().from(portfolios)
        .where(eq(portfolios.id, input.portfolioId)).limit(1);
      if (!portfolio) return null;

      const portfolioPrograms = await db.select().from(programs)
        .where(eq(programs.portfolioId, input.portfolioId))
        .orderBy(programs.name);

      const portfolioProjects = await db.select().from(projects)
        .where(eq(projects.portfolioId, input.portfolioId))
        .orderBy(projects.name);

      // Group projects under their program
      const programMap = portfolioPrograms.map((prog) => ({
        ...prog,
        projects: portfolioProjects.filter((p) => p.programId === prog.id),
      }));

      const unassignedProjects = portfolioProjects.filter((p) => !p.programId);

      return { portfolio, programs: programMap, unassignedProjects };
    }),
});
