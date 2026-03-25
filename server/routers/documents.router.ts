import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  documents,
  documentCategories,
  documentIssueLinks,
  documentRequirementLinks,
  issues,
  requirements,
} from "../../drizzle/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

async function getNextDocumentId(projectId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const existing = await db
    .select({ documentId: documents.documentId })
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
  // ─── Document CRUD ─────────────────────────────────────────────────────────
  list: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        categoryId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(documents.projectId, input.projectId)];
      if (input.entityType)
        conditions.push(eq(documents.entityType, input.entityType));
      if (input.entityId)
        conditions.push(eq(documents.entityId, input.entityId));
      if (input.categoryId)
        conditions.push(eq(documents.categoryId, input.categoryId));
      return db
        .select()
        .from(documents)
        .where(and(...conditions))
        .orderBy(desc(documents.createdAt));
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        fileName: z.string().min(1),
        originalName: z.string().min(1),
        fileUrl: z.string().min(1),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
        description: z.string().optional(),
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        categoryId: z.number().optional(),
        uploadedBy: z.string().optional(),
        uploadedById: z.number().optional(),
        tags: z.array(z.string()).optional(),
        issueIds: z.array(z.number()).optional(),
        requirementIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const documentId = await getNextDocumentId(input.projectId);
      const { issueIds, requirementIds, ...docFields } = input;
      await db.insert(documents).values({
        ...docFields,
        documentId,
        tags: docFields.tags ?? [],
      });
      const [created] = await db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.projectId, input.projectId),
            eq(documents.documentId, documentId)
          )
        );
      if (issueIds && issueIds.length > 0) {
        await db.insert(documentIssueLinks).values(
          issueIds.map((issueId) => ({ documentId: created.id, issueId }))
        );
      }
      if (requirementIds && requirementIds.length > 0) {
        await db.insert(documentRequirementLinks).values(
          requirementIds.map((requirementId) => ({
            documentId: created.id,
            requirementId,
          }))
        );
      }
      return created;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        originalName: z.string().optional(),
        fileName: z.string().optional(),
        fileUrl: z.string().optional(),
        uploadedBy: z.string().optional(),
        mimeType: z.string().optional(),
        fileSize: z.number().optional(),
        description: z.string().optional(),
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        categoryId: z.number().nullable().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...rest } = input;
      await db.update(documents).set(rest).where(eq(documents.id, id));
      const [updated] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, id));
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .delete(documentIssueLinks)
        .where(eq(documentIssueLinks.documentId, input.id));
      await db
        .delete(documentRequirementLinks)
        .where(eq(documentRequirementLinks.documentId, input.id));
      await db.delete(documents).where(eq(documents.id, input.id));
      return { success: true };
    }),

  // ─── Issue Links ────────────────────────────────────────────────────────────
  getIssueLinks: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const links = await db
        .select()
        .from(documentIssueLinks)
        .where(eq(documentIssueLinks.documentId, input.documentId));
      if (links.length === 0) return [];
      const issueIds = links.map((l) => l.issueId);
      return db.select().from(issues).where(inArray(issues.id, issueIds));
    }),

  setIssueLinks: protectedProcedure
    .input(
      z.object({
        documentId: z.number(),
        issueIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .delete(documentIssueLinks)
        .where(eq(documentIssueLinks.documentId, input.documentId));
      if (input.issueIds.length > 0) {
        await db.insert(documentIssueLinks).values(
          input.issueIds.map((issueId) => ({
            documentId: input.documentId,
            issueId,
          }))
        );
      }
      return { success: true };
    }),

  // ─── Requirement Links ──────────────────────────────────────────────────────
  getRequirementLinks: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const links = await db
        .select()
        .from(documentRequirementLinks)
        .where(eq(documentRequirementLinks.documentId, input.documentId));
      if (links.length === 0) return [];
      const reqIds = links.map((l) => l.requirementId);
      return db
        .select()
        .from(requirements)
        .where(inArray(requirements.id, reqIds));
    }),

  setRequirementLinks: protectedProcedure
    .input(
      z.object({
        documentId: z.number(),
        requirementIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .delete(documentRequirementLinks)
        .where(eq(documentRequirementLinks.documentId, input.documentId));
      if (input.requirementIds.length > 0) {
        await db.insert(documentRequirementLinks).values(
          input.requirementIds.map((requirementId) => ({
            documentId: input.documentId,
            requirementId,
          }))
        );
      }
      return { success: true };
    }),

  // ─── Document Categories ────────────────────────────────────────────────────
  listCategories: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(documentCategories)
        .where(eq(documentCategories.projectId, input.projectId))
        .orderBy(documentCategories.sortOrder, documentCategories.name);
    }),

  createCategory: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        name: z.string().min(1).max(100),
        color: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(documentCategories).values({
        projectId: input.projectId,
        name: input.name,
        color: input.color ?? "gray",
        sortOrder: input.sortOrder ?? 0,
      });
      const [created] = await db
        .select()
        .from(documentCategories)
        .where(eq(documentCategories.projectId, input.projectId))
        .orderBy(desc(documentCategories.id))
        .limit(1);
      return created;
    }),

  updateCategory: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        color: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...rest } = input;
      await db
        .update(documentCategories)
        .set(rest)
        .where(eq(documentCategories.id, id));
      const [updated] = await db
        .select()
        .from(documentCategories)
        .where(eq(documentCategories.id, id));
      return updated;
    }),

  deleteCategory: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(documents)
        .set({ categoryId: null })
        .where(eq(documents.categoryId, input.id));
      await db
        .delete(documentCategories)
        .where(eq(documentCategories.id, input.id));
      return { success: true };
    }),
});
