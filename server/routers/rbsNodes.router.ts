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

  // Returns only leaf nodes (actual resources) — used by the Resource Calendar
  listLeafResources: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const all = await db
        .select()
        .from(rbsNodes)
        .where(eq(rbsNodes.projectId, input.projectId))
        .orderBy(asc(rbsNodes.sequence), asc(rbsNodes.code));
      // Return nodes marked as leaf OR nodes with no children (dynamic leaf detection)
      const parentIds = new Set(all.filter(n => n.parentId).map(n => n.parentId!));
      return all.filter(n => n.isLeaf === 1 || !parentIds.has(n.id) && n.parentId !== null || (all.filter(c => c.parentId === n.id).length === 0 && n.parentId !== null));
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
      stakeholderId: z.number().optional(),
      unit: z.string().optional(),
      quantity: z.string().optional(),
      costRate: z.string().optional(),
      availability: z.string().optional(),
      isLeaf: z.number().optional(),
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
        stakeholderId: input.stakeholderId ?? null,
        unit: input.unit ?? null,
        quantity: input.quantity ?? null,
        costRate: input.costRate ?? null,
        availability: input.availability ?? null,
        isLeaf: input.isLeaf ?? 0,
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
      stakeholderId: z.number().nullable().optional(),
      unit: z.string().optional(),
      quantity: z.string().optional(),
      costRate: z.string().optional(),
      availability: z.string().optional(),
      isLeaf: z.number().optional(),
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
