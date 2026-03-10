import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { documents } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

async function getNextDocumentId(projectId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const existing = await db.select({ documentId: documents.documentId })
    .from(documents)
    .where(eq(documents.projectId, projectId))
    .orderBy(desc(documents.id));
  let maxNum = 0;
  for (const row of existing) {
    const match = row.documentId.match(/(\d+)$/);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
  }
  return `DOC-${String(maxNum + 1).padStart(4, "0")}`;
}

export const documentsRouter = router({
  list: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      entityType: z.string().optional(),
      entityId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(documents.projectId, input.projectId)];
      if (input.entityType) conditions.push(eq(documents.entityType, input.entityType));
      if (input.entityId) conditions.push(eq(documents.entityId, input.entityId));
      return db.select().from(documents)
        .where(and(...conditions))
        .orderBy(desc(documents.createdAt));
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      fileName: z.string().min(1),
      originalName: z.string().min(1),
      fileUrl: z.string().min(1),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
      description: z.string().optional(),
      entityType: z.string().optional(),
      entityId: z.string().optional(),
      uploadedBy: z.string().optional(),
      uploadedById: z.number().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const documentId = await getNextDocumentId(input.projectId);
      await db.insert(documents).values({
        ...input,
        documentId,
        tags: input.tags ?? [],
      });
      const [created] = await db.select().from(documents)
        .where(and(eq(documents.projectId, input.projectId), eq(documents.documentId, documentId)));
      return created;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      description: z.string().optional(),
      entityType: z.string().optional(),
      entityId: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...rest } = input;
      await db.update(documents).set(rest).where(eq(documents.id, id));
      const [updated] = await db.select().from(documents).where(eq(documents.id, id));
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(documents).where(eq(documents.id, input.id));
      return { success: true };
    }),
});
