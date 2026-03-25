import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import {
  commPlanRoleOptions,
  commPlanJobOptions,
  commPlanItems,
  stakeholderPositionOptions,
  commPlanMethodOptions,
  commPlanInputItems,
} from "../../drizzle/schema";

// ─── Role Options ─────────────────────────────────────────────────────────────
const roleOptionsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(commPlanRoleOptions)
        .where(eq(commPlanRoleOptions.projectId, input.projectId))
        .orderBy(commPlanRoleOptions.label);
    }),

  create: protectedProcedure
    .input(z.object({ projectId: z.number(), label: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(commPlanRoleOptions).values(input);
      const rows = await db
        .select()
        .from(commPlanRoleOptions)
        .where(eq(commPlanRoleOptions.id, (result as any)[0]?.insertId))
        .limit(1);
      return rows[0];
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), label: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(commPlanRoleOptions)
        .set({ label: input.label })
        .where(eq(commPlanRoleOptions.id, input.id));
      const rows = await db
        .select()
        .from(commPlanRoleOptions)
        .where(eq(commPlanRoleOptions.id, input.id))
        .limit(1);
      return rows[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .delete(commPlanRoleOptions)
        .where(eq(commPlanRoleOptions.id, input.id));
      return { success: true };
    }),
});

// ─── Job Options ──────────────────────────────────────────────────────────────
const jobOptionsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(commPlanJobOptions)
        .where(eq(commPlanJobOptions.projectId, input.projectId))
        .orderBy(commPlanJobOptions.label);
    }),

  create: protectedProcedure
    .input(z.object({ projectId: z.number(), label: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(commPlanJobOptions).values(input);
      const rows = await db
        .select()
        .from(commPlanJobOptions)
        .where(eq(commPlanJobOptions.id, (result as any)[0]?.insertId))
        .limit(1);
      return rows[0];
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), label: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(commPlanJobOptions)
        .set({ label: input.label })
        .where(eq(commPlanJobOptions.id, input.id));
      const rows = await db
        .select()
        .from(commPlanJobOptions)
        .where(eq(commPlanJobOptions.id, input.id))
        .limit(1);
      return rows[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .delete(commPlanJobOptions)
        .where(eq(commPlanJobOptions.id, input.id));
      return { success: true };
    }),
});

// ─── Communication Needed Items ───────────────────────────────────────────────
const commPlanItemsRouter = router({
  listByEntry: protectedProcedure
    .input(z.object({ entryId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(commPlanItems)
        .where(eq(commPlanItems.entryId, input.entryId))
        .orderBy(commPlanItems.sequence, commPlanItems.createdAt);
    }),

  create: protectedProcedure
    .input(
      z.object({
        entryId: z.number(),
        projectId: z.number(),
        description: z.string().min(1),
        commType: z.enum(["Push", "Pull", "Interactive", "Other"]).default("Push"),
        periodic: z.string().optional(),
        sequence: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(commPlanItems).values({
        entryId: input.entryId,
        projectId: input.projectId,
        description: input.description,
        commType: input.commType,
        periodic: input.periodic,
        sequence: input.sequence ?? 0,
      });
      const rows = await db
        .select()
        .from(commPlanItems)
        .where(eq(commPlanItems.id, (result as any)[0]?.insertId))
        .limit(1);
      return rows[0];
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          description: z.string().optional(),
          commType: z.enum(["Push", "Pull", "Interactive", "Other"]).optional(),
          periodic: z.string().nullable().optional(),
          sequence: z.number().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(commPlanItems)
        .set(input.data as any)
        .where(eq(commPlanItems.id, input.id));
      const rows = await db
        .select()
        .from(commPlanItems)
        .where(eq(commPlanItems.id, input.id))
        .limit(1);
      return rows[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(commPlanItems).where(eq(commPlanItems.id, input.id));
      return { success: true };
    }),

  // Fetch all comm-needed items for a project (used by main table)
  listAllByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(commPlanItems)
        .where(eq(commPlanItems.projectId, input.projectId))
        .orderBy(commPlanItems.entryId, commPlanItems.sequence);
    }),

  // Bulk replace all items for an entry (used when saving the form)
  bulkReplace: protectedProcedure
    .input(
      z.object({
        entryId: z.number(),
        projectId: z.number(),
        items: z.array(
          z.object({
            description: z.string(),
            commType: z.enum(["Push", "Pull", "Interactive", "Other"]),
            periodic: z.string().optional(),
            sequence: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      // Delete existing items for this entry
      await db.delete(commPlanItems).where(eq(commPlanItems.entryId, input.entryId));
      // Insert new items
      if (input.items.length > 0) {
        await db.insert(commPlanItems).values(
          input.items.map((item) => ({
            entryId: input.entryId,
            projectId: input.projectId,
            description: item.description,
            commType: item.commType,
            periodic: item.periodic,
            sequence: item.sequence,
          }))
        );
      }
      return await db
        .select()
        .from(commPlanItems)
        .where(eq(commPlanItems.entryId, input.entryId))
        .orderBy(commPlanItems.sequence);
    }),
});

// ─── Position Options (for Stakeholder form) ─────────────────────────────────
const positionOptionsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(stakeholderPositionOptions)
        .where(eq(stakeholderPositionOptions.projectId, input.projectId))
        .orderBy(stakeholderPositionOptions.label);
    }),

  create: protectedProcedure
    .input(z.object({ projectId: z.number(), label: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(stakeholderPositionOptions).values(input);
      const rows = await db
        .select()
        .from(stakeholderPositionOptions)
        .where(eq(stakeholderPositionOptions.id, (result as any)[0]?.insertId))
        .limit(1);
      return rows[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .delete(stakeholderPositionOptions)
        .where(eq(stakeholderPositionOptions.id, input.id));
      return { success: true };
    }),
});

// ─── Method Options ──────────────────────────────────────────────────────────
const DEFAULT_METHODS = ["Email", "Meeting", "Phone", "Slack", "Teams", "Report", "Newsletter", "Video Call"];

const methodOptionsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(commPlanMethodOptions)
        .where(eq(commPlanMethodOptions.projectId, input.projectId))
        .orderBy(commPlanMethodOptions.sequence, commPlanMethodOptions.label);
      // Seed defaults if no rows exist for this project
      if (rows.length === 0) {
        await db.insert(commPlanMethodOptions).values(
          DEFAULT_METHODS.map((label, i) => ({
            projectId: input.projectId,
            label,
            isDefault: true,
            sequence: i,
          }))
        );
        return await db
          .select()
          .from(commPlanMethodOptions)
          .where(eq(commPlanMethodOptions.projectId, input.projectId))
          .orderBy(commPlanMethodOptions.sequence, commPlanMethodOptions.label);
      }
      return rows;
    }),

  create: protectedProcedure
    .input(z.object({ projectId: z.number(), label: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(commPlanMethodOptions).values({
        projectId: input.projectId,
        label: input.label,
        isDefault: false,
        sequence: 99,
      });
      const rows = await db
        .select()
        .from(commPlanMethodOptions)
        .where(eq(commPlanMethodOptions.id, (result as any)[0]?.insertId))
        .limit(1);
      return rows[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .delete(commPlanMethodOptions)
        .where(eq(commPlanMethodOptions.id, input.id));
      return { success: true };
    }),
});

// ─── Input Items (Inputs Needed from Stakeholder) ────────────────────────────
const inputItemsRouter = router({
  listByEntry: protectedProcedure
    .input(z.object({ entryId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(commPlanInputItems)
        .where(eq(commPlanInputItems.entryId, input.entryId))
        .orderBy(commPlanInputItems.sequence, commPlanInputItems.createdAt);
    }),

  bulkReplace: protectedProcedure
    .input(
      z.object({
        entryId: z.number(),
        projectId: z.number(),
        items: z.array(
          z.object({
            description: z.string(),
            sequence: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(commPlanInputItems).where(eq(commPlanInputItems.entryId, input.entryId));
      if (input.items.length > 0) {
        await db.insert(commPlanInputItems).values(
          input.items.map((item) => ({
            entryId: input.entryId,
            projectId: input.projectId,
            description: item.description,
            sequence: item.sequence,
          }))
        );
      }
      return await db
        .select()
        .from(commPlanInputItems)
        .where(eq(commPlanInputItems.entryId, input.entryId))
        .orderBy(commPlanInputItems.sequence);
    }),
});

// ─── Combined export ──────────────────────────────────────────────────────────
export const commPlanOptionsRouter = router({
  roleOptions: roleOptionsRouter,
  jobOptions: jobOptionsRouter,
  items: commPlanItemsRouter,
  positionOptions: positionOptionsRouter,
  methodOptions: methodOptionsRouter,
  inputItems: inputItemsRouter,
});
