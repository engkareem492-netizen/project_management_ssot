import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const systemConfigRouter = router({
  // ID Configuration procedures
  idConfig: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getIdSequences(input.projectId);
      }),

    get: protectedProcedure
      .input(z.object({ entityType: z.string(), projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getIdSequence(input.entityType, input.projectId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          entityType: z.string(),
          prefix: z.string(),
          minNumber: z.number().default(1),
          maxNumber: z.number().default(9999),
          padLength: z.number().default(4),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createIdSequence(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          entityType: z.string(),
          projectId: z.number(),
          prefix: z.string().optional(),
          minNumber: z.number().optional(),
          maxNumber: z.number().optional(),
          padLength: z.number().optional(),
          startNumber: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { entityType, projectId, ...data } = input;
        return await db.updateIdSequence(entityType, data, projectId);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteIdSequence(input.id);
      }),
  }),

  // Dropdown Categories procedures
  dropdownCategories: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDropdownCategories(input.projectId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          categoryKey: z.string(),
          categoryLabel: z.string(),
          description: z.string().optional(),
          sortOrder: z.number().default(0),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createDropdownCategory(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          categoryLabel: z.string().optional(),
          description: z.string().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.updateDropdownCategory(input.id, input);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteDropdownCategory(input.id);
      }),
  }),
});
