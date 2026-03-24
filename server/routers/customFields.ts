import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { customFieldDefs, customFieldValues } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const ENTITY_TYPES = [
  "task", "issue", "risk", "requirement", "stakeholder",
  "deliverable", "milestone", "action_item", "change_request",
] as const;

const FIELD_TYPES = [
  "text", "number", "date", "select", "multi_select",
  "checkbox", "url", "email", "textarea", "rating",
] as const;

export const customFieldsRouter = router({
  // ── Field Definitions ──────────────────────────────────────────────────────

  listDefs: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      entityType: z.enum(ENTITY_TYPES).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(customFieldDefs)
        .where(
          input.entityType
            ? and(
                eq(customFieldDefs.projectId, input.projectId),
                eq(customFieldDefs.entityType, input.entityType)
              )
            : eq(customFieldDefs.projectId, input.projectId)
        )
        .orderBy(customFieldDefs.entityType, customFieldDefs.sortOrder);
      return rows;
    }),

  createDef: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      entityType: z.enum(ENTITY_TYPES),
      fieldKey: z.string().min(1).max(100),
      label: z.string().min(1).max(150),
      fieldType: z.enum(FIELD_TYPES).default("text"),
      options: z.array(z.string()).optional(),
      required: z.boolean().optional().default(false),
      sortOrder: z.number().optional().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(customFieldDefs).values({
        projectId: input.projectId,
        entityType: input.entityType,
        fieldKey: input.fieldKey,
        label: input.label,
        fieldType: input.fieldType,
        options: input.options ?? null,
        required: input.required,
        sortOrder: input.sortOrder,
      });
      return { id: (result as any).insertId };
    }),

  updateDef: protectedProcedure
    .input(z.object({
      id: z.number(),
      label: z.string().min(1).max(150).optional(),
      fieldType: z.enum(FIELD_TYPES).optional(),
      options: z.array(z.string()).optional(),
      required: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      await db.update(customFieldDefs).set(data).where(eq(customFieldDefs.id, id));
      return { success: true };
    }),

  deleteDef: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(customFieldValues).where(eq(customFieldValues.fieldDefId, input.id));
      await db.delete(customFieldDefs).where(eq(customFieldDefs.id, input.id));
      return { success: true };
    }),

  // ── Field Values ───────────────────────────────────────────────────────────

  getValues: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      entityType: z.string(),
      entityId: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(customFieldValues)
        .where(
          and(
            eq(customFieldValues.projectId, input.projectId),
            eq(customFieldValues.entityType, input.entityType),
            eq(customFieldValues.entityId, input.entityId)
          )
        );
      return rows;
    }),

  upsertValue: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      fieldDefId: z.number(),
      entityType: z.string(),
      entityId: z.string(),
      value: z.string().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const existing = await db
        .select()
        .from(customFieldValues)
        .where(
          and(
            eq(customFieldValues.projectId, input.projectId),
            eq(customFieldValues.fieldDefId, input.fieldDefId),
            eq(customFieldValues.entityType, input.entityType),
            eq(customFieldValues.entityId, input.entityId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(customFieldValues)
          .set({ value: input.value })
          .where(eq(customFieldValues.id, existing[0].id));
        return { id: existing[0].id };
      } else {
        const [result] = await db.insert(customFieldValues).values({
          projectId: input.projectId,
          fieldDefId: input.fieldDefId,
          entityType: input.entityType,
          entityId: input.entityId,
          value: input.value,
        });
        return { id: (result as any).insertId };
      }
    }),

  bulkGetValues: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      entityType: z.string(),
      entityIds: z.array(z.string()),
    }))
    .query(async ({ input }) => {
      if (input.entityIds.length === 0) return [];
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(customFieldValues)
        .where(
          and(
            eq(customFieldValues.projectId, input.projectId),
            eq(customFieldValues.entityType, input.entityType)
          )
        );
      return rows.filter((r: typeof customFieldValues.$inferSelect) => input.entityIds.includes(r.entityId));
    }),
});
