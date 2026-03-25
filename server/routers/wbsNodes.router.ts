import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { wbsNodes } from "../../drizzle/schema";
import { eq, asc } from "drizzle-orm";

export const wbsNodesRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(wbsNodes)
        .where(eq(wbsNodes.projectId, input.projectId))
        .orderBy(asc(wbsNodes.sequence), asc(wbsNodes.code));
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      code: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      parentId: z.number().optional(),
      sequence: z.number().optional(),
      deliverable: z.string().optional(),
      responsible: z.string().optional(),
      status: z.enum(["Not Started", "In Progress", "Complete", "On Hold"]).optional(),
      linkedTaskId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(wbsNodes).values({
        projectId: input.projectId,
        code: input.code,
        name: input.name,
        description: input.description ?? null,
        parentId: input.parentId ?? null,
        sequence: input.sequence ?? 0,
        deliverable: input.deliverable ?? null,
        responsible: input.responsible ?? null,
        status: input.status ?? "Not Started",
        linkedTaskId: input.linkedTaskId ?? null,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      code: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      parentId: z.number().nullable().optional(),
      sequence: z.number().optional(),
      deliverable: z.string().optional(),
      responsible: z.string().optional(),
      status: z.enum(["Not Started", "In Progress", "Complete", "On Hold"]).optional(),
      linkedTaskId: z.number().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...rest } = input;
      await db.update(wbsNodes).set(rest as any).where(eq(wbsNodes.id, id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(wbsNodes).where(eq(wbsNodes.id, input.id));
      return { success: true };
    }),
});
