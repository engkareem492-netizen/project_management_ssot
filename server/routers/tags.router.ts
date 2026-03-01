import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const tagsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return await db.getTagsByProject(input.projectId);
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string().min(1).max(100),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6B7280"),
    }))
    .mutation(async ({ input }) => {
      await db.createTag(input);
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateTag(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteTag(input.id);
      return { success: true };
    }),

  getForEntity: protectedProcedure
    .input(z.object({
      entityType: z.string(),
      entityId: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.getTagsForEntity(input.entityType, input.entityId);
    }),

  addToEntity: protectedProcedure
    .input(z.object({
      tagId: z.number(),
      entityType: z.string(),
      entityId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db.addTagToEntity(input.tagId, input.entityType, input.entityId);
      return { success: true };
    }),

  removeFromEntity: protectedProcedure
    .input(z.object({
      tagId: z.number(),
      entityType: z.string(),
      entityId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db.removeTagFromEntity(input.tagId, input.entityType, input.entityId);
      return { success: true };
    }),
});
