import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { rbsNodes } from "../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";

export const rbsNodesRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(rbsNodes)
        .where(eq(rbsNodes.projectId, input.projectId))
        .orderBy(asc(rbsNodes.sequence), asc(rbsNodes.code));
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      code: z.string().min(1),
      name: z.string().min(1),
      resourceType: z.string().optional(),
      parentId: z.number().optional(),
      description: z.string().optional(),
      sequence: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(rbsNodes).values({
        projectId: input.projectId,
        code: input.code,
        name: input.name,
        resourceType: input.resourceType ?? null,
        parentId: input.parentId ?? null,
        description: input.description ?? null,
        sequence: input.sequence ?? 0,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      code: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      resourceType: z.string().optional(),
      parentId: z.number().nullable().optional(),
      description: z.string().optional(),
      sequence: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...rest } = input;
      await db.update(rbsNodes).set(rest as any).where(eq(rbsNodes.id, id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(rbsNodes).where(eq(rbsNodes.id, input.id));
      return { success: true };
    }),
});
