import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { llDropdownOptions } from "../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const FIELD_TYPES = ["category", "impact", "status", "phase"] as const;

export const llDropdownRouter = router({
  // List all options for a project (grouped by fieldType)
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(llDropdownOptions)
        .where(eq(llDropdownOptions.projectId, input.projectId))
        .orderBy(asc(llDropdownOptions.fieldType), asc(llDropdownOptions.sortOrder));
      // Group by fieldType
      const grouped: Record<string, string[]> = {
        category: [],
        impact: [],
        status: [],
        phase: [],
      };
      for (const row of rows) {
        if (grouped[row.fieldType]) {
          grouped[row.fieldType].push(row.value);
        }
      }
      return grouped;
    }),

  // List raw rows for a specific fieldType (for management UI)
  listByType: protectedProcedure
    .input(z.object({ projectId: z.number(), fieldType: z.enum(FIELD_TYPES) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db
        .select()
        .from(llDropdownOptions)
        .where(
          and(
            eq(llDropdownOptions.projectId, input.projectId),
            eq(llDropdownOptions.fieldType, input.fieldType)
          )
        )
        .orderBy(asc(llDropdownOptions.sortOrder));
    }),

  // Add a new option
  add: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      fieldType: z.enum(FIELD_TYPES),
      value: z.string().min(1).max(200),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Get max sortOrder
      const existing = await db
        .select()
        .from(llDropdownOptions)
        .where(
          and(
            eq(llDropdownOptions.projectId, input.projectId),
            eq(llDropdownOptions.fieldType, input.fieldType)
          )
        );
      const maxOrder = existing.reduce((m, r) => Math.max(m, r.sortOrder), 0);
      await db.insert(llDropdownOptions).values({
        projectId: input.projectId,
        fieldType: input.fieldType,
        value: input.value.trim(),
        sortOrder: maxOrder + 1,
      });
      return { success: true };
    }),

  // Update an option's value
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      value: z.string().min(1).max(200),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(llDropdownOptions)
        .set({ value: input.value.trim() })
        .where(eq(llDropdownOptions.id, input.id));
      return { success: true };
    }),

  // Delete an option
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .delete(llDropdownOptions)
        .where(eq(llDropdownOptions.id, input.id));
      return { success: true };
    }),
});
