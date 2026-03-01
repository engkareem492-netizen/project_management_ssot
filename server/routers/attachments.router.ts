import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { storagePut } from "../storage";

export const attachmentsRouter = router({
  list: protectedProcedure
    .input(z.object({
      entityType: z.string(),
      entityId: z.number(),
      projectId: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.getAttachmentsByEntity(input.entityType, input.entityId, input.projectId);
    }),

  upload: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      entityType: z.string(),
      entityId: z.number(),
      fileName: z.string(),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
      base64Data: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const storageKey = `attachments/project-${input.projectId}/${input.entityType}-${input.entityId}/${Date.now()}-${input.fileName}`;

      let storageUrl: string | undefined;
      try {
        const buffer = Buffer.from(input.base64Data, 'base64');
        const result = await storagePut(storageKey, buffer, input.mimeType || 'application/octet-stream');
        storageUrl = result?.url;
      } catch (e) {
        // Storage may not be configured, store key only
      }

      await db.createAttachment({
        projectId: input.projectId,
        entityType: input.entityType,
        entityId: input.entityId,
        fileName: input.fileName,
        fileSize: input.fileSize ?? null,
        mimeType: input.mimeType ?? null,
        storageKey,
        storageUrl: storageUrl ?? null,
        uploadedBy: ctx.user.id,
      });

      return { success: true, storageKey };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const deleted = await db.deleteAttachment(input.id);
      return { success: true, storageKey: deleted?.storageKey };
    }),
});
