import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import {
  createKnowledgeBaseEntry,
  updateKnowledgeBaseEntry,
  deleteKnowledgeBaseEntry,
  getKnowledgeBaseEntries,
  getKnowledgeBaseEntry,
  createKnowledgeBaseType,
  updateKnowledgeBaseType,
  deleteKnowledgeBaseType,
  getKnowledgeBaseTypes,
  createKnowledgeBaseComponent,
  updateKnowledgeBaseComponent,
  deleteKnowledgeBaseComponent,
  getKnowledgeBaseComponents,
  getKnowledgeBaseCodeConfig,
  updateKnowledgeBaseCodeConfig,
  generateKnowledgeBaseCode,
} from "./db";

export const knowledgeBaseRouter = router({
  // Knowledge Base Entries
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return await getKnowledgeBaseEntries(input.projectId);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await getKnowledgeBaseEntry(input.id);
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        typeId: z.number().optional(),
        componentId: z.number().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        attachmentUrl: z.string().optional(),
        linkedDocumentId: z.number().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      // Generate code with prefix
      const code = await generateKnowledgeBaseCode(input.projectId);
      return await createKnowledgeBaseEntry({
        ...input,
        code,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        typeId: z.number().optional(),
        componentId: z.number().optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        attachmentUrl: z.string().optional(),
        linkedDocumentId: z.number().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      return await updateKnowledgeBaseEntry(input.id, input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteKnowledgeBaseEntry(input.id);
    }),

  uploadFile: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // base64 encoded file data
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Decode base64 to buffer
      const buffer = Buffer.from(input.fileData, 'base64');
      
      // Generate unique file key with timestamp to prevent collisions
      const timestamp = Date.now();
      const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileKey = `kb-attachments/project-${input.projectId}/${timestamp}-${sanitizedFileName}`;
      
      // Upload to S3
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      
      return { url };
    }),

  // Types Management
  types: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await getKnowledgeBaseTypes(input.projectId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          name: z.string().min(1),
          parentTypeId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createKnowledgeBaseType(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          parentTypeId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await updateKnowledgeBaseType(input.id, input);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteKnowledgeBaseType(input.id);
      }),
  }),

  // Components Management
  components: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await getKnowledgeBaseComponents(input.projectId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          name: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        return await createKnowledgeBaseComponent(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        return await updateKnowledgeBaseComponent(input.id, input);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteKnowledgeBaseComponent(input.id);
      }),
  }),

  // Code Configuration
  codeConfig: router({
    get: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await getKnowledgeBaseCodeConfig(input.projectId);
      }),

    update: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          prefix: z.string().min(1).max(10),
        })
      )
      .mutation(async ({ input }) => {
        return await updateKnowledgeBaseCodeConfig(input.projectId, input.prefix);
      }),
  }),
});
