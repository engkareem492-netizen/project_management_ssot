import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { rbsResourceTypes } from "../../drizzle/schema";

export const rbsResourceTypesRouter = router({
  // List all resource types for a project (built-in + custom)
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { eq, or, asc } = await import("drizzle-orm");
      const rows = await db
        .select()
        .from(rbsResourceTypes)
        .where(
          or(
            eq(rbsResourceTypes.projectId, input.projectId),
            eq(rbsResourceTypes.isBuiltIn, true),
          )
        )
        .orderBy(asc(rbsResourceTypes.sequence), asc(rbsResourceTypes.name));
      return rows;
    }),

  // Create a new custom resource type
  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string().min(1).max(200),
      color: z.string().optional(),
      description: z.string().optional(),
      sequence: z.number().optional().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(rbsResourceTypes).values({
        projectId: input.projectId,
        name: input.name,
        color: input.color,
        description: input.description,
        isBuiltIn: false,
        sequence: input.sequence ?? 0,
      });
      const { eq } = await import("drizzle-orm");
      const rows = await db
        .select()
        .from(rbsResourceTypes)
        .where(eq(rbsResourceTypes.id, result[0].insertId))
        .limit(1);
      return rows[0];
    }),

  // Update a custom resource type
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(200).optional(),
      color: z.string().optional(),
      description: z.string().optional(),
      sequence: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { eq } = await import("drizzle-orm");
      const { id, ...rest } = input;
      await db.update(rbsResourceTypes).set(rest).where(eq(rbsResourceTypes.id, id));
      const rows = await db.select().from(rbsResourceTypes).where(eq(rbsResourceTypes.id, id)).limit(1);
      return rows[0];
    }),

  // Delete any resource type (including built-in)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { eq } = await import("drizzle-orm");
      await db.delete(rbsResourceTypes).where(eq(rbsResourceTypes.id, input.id));
      return { success: true };
    }),

  // Seed built-in types for a project if not already present
  seedBuiltIn: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { eq } = await import("drizzle-orm");
      const existing = await db
        .select()
        .from(rbsResourceTypes)
        .where(eq(rbsResourceTypes.projectId, input.projectId));

      const builtInNames = existing.filter(r => r.isBuiltIn).map(r => r.name);
      const defaults = [
        { name: "TeamMember", color: "#3b82f6", description: "Internal team members", sequence: 1 },
        { name: "External", color: "#f97316", description: "External resources and contractors", sequence: 2 },
        { name: "Stakeholder", color: "#a855f7", description: "Project stakeholders", sequence: 3 },
      ];

      for (const d of defaults) {
        if (!builtInNames.includes(d.name)) {
          await db.insert(rbsResourceTypes).values({
            projectId: input.projectId,
            name: d.name,
            color: d.color,
            description: d.description,
            isBuiltIn: true,
            sequence: d.sequence,
          });
        }
      }
      return { success: true };
    }),
});
