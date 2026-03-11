import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { comments } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const commentsRouter = router({
  list: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      entityType: z.string(),
      entityId: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(comments)
        .where(and(
          eq(comments.projectId, input.projectId),
          eq(comments.entityType, input.entityType),
          eq(comments.entityId, input.entityId),
        ))
        .orderBy(desc(comments.createdAt));
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      entityType: z.string(),
      entityId: z.string(),
      authorName: z.string().optional(),
      content: z.string().min(1),
      parentId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const authorName = input.authorName || (ctx as any).user?.name || "Anonymous";
      await db.insert(comments).values({
        ...input,
        authorName,
        parentId: input.parentId ?? null,
      });
      const [created] = await db.select().from(comments)
        .where(and(
          eq(comments.projectId, input.projectId),
          eq(comments.entityType, input.entityType),
          eq(comments.entityId, input.entityId),
        ))
        .orderBy(desc(comments.id))
        .limit(1);
      return created;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), content: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(comments).set({ content: input.content }).where(eq(comments.id, input.id));
      const [updated] = await db.select().from(comments).where(eq(comments.id, input.id));
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(comments).where(eq(comments.id, input.id));
      return { success: true };
    }),
});
