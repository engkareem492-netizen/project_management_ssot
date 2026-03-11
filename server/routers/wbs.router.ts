import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { wbsElements } from "../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";

export const wbsRouter = router({
  // List all WBS elements for a project (flat list, client builds tree)
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(wbsElements)
        .where(eq(wbsElements.projectId, input.projectId))
        .orderBy(asc(wbsElements.code));
    }),

  // Create a new WBS element
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        parentId: z.number().nullable().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        responsible: z.string().optional(),
        estimatedCost: z.string().optional(),
        status: z
          .enum(["Not Started", "In Progress", "Complete", "On Hold"])
          .optional(),
        deliverableId: z.number().optional(),
        milestoneId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      // Determine parent level and siblings to compute code + level
      const siblings = await db
        .select({ code: wbsElements.code })
        .from(wbsElements)
        .where(
          and(
            eq(wbsElements.projectId, input.projectId),
            input.parentId
              ? eq(wbsElements.parentId, input.parentId)
              : eq(wbsElements.parentId, 0) // root
          )
        );

      let parentCode = "";
      let level = 1;
      if (input.parentId) {
        const [parent] = await db
          .select({ code: wbsElements.code, level: wbsElements.level })
          .from(wbsElements)
          .where(eq(wbsElements.id, input.parentId));
        if (parent) {
          parentCode = parent.code + ".";
          level = parent.level + 1;
        }
      }

      // Find next sibling number
      const siblingNumbers = siblings
        .map((s) => {
          const parts = s.code.split(".");
          return parseInt(parts[parts.length - 1], 10) || 0;
        })
        .filter((n) => !isNaN(n));
      const nextNum =
        siblingNumbers.length > 0 ? Math.max(...siblingNumbers) + 1 : 1;
      const code = `${parentCode}${nextNum}`;

      const [result] = await db
        .insert(wbsElements)
        .values({
          projectId: input.projectId,
          parentId: input.parentId ?? null,
          code,
          title: input.title,
          description: input.description ?? null,
          responsible: input.responsible ?? null,
          estimatedCost: input.estimatedCost ?? null,
          status: input.status ?? "Not Started",
          level,
          deliverableId: input.deliverableId ?? null,
          milestoneId: input.milestoneId ?? null,
          sortOrder: nextNum,
        })
        .$returningId();

      const [created] = await db
        .select()
        .from(wbsElements)
        .where(eq(wbsElements.id, result.id));
      return created;
    }),

  // Update a WBS element
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        responsible: z.string().optional(),
        estimatedCost: z.string().optional(),
        actualCost: z.string().optional(),
        status: z
          .enum(["Not Started", "In Progress", "Complete", "On Hold"])
          .optional(),
        deliverableId: z.number().nullable().optional(),
        milestoneId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const { id, ...rest } = input;
      await db.update(wbsElements).set(rest).where(eq(wbsElements.id, id));
      const [updated] = await db
        .select()
        .from(wbsElements)
        .where(eq(wbsElements.id, id));
      return updated;
    }),

  // Delete a WBS element and all its descendants
  delete: protectedProcedure
    .input(z.object({ id: z.number(), projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      // Get all elements for this project to find descendants
      const all = await db
        .select({ id: wbsElements.id, parentId: wbsElements.parentId })
        .from(wbsElements)
        .where(eq(wbsElements.projectId, input.projectId));

      // BFS to collect all descendant IDs
      const toDelete = new Set<number>([input.id]);
      const queue = [input.id];
      while (queue.length > 0) {
        const current = queue.shift()!;
        for (const el of all) {
          if (el.parentId === current) {
            toDelete.add(el.id);
            queue.push(el.id);
          }
        }
      }

      for (const delId of Array.from(toDelete)) {
        await db.delete(wbsElements).where(eq(wbsElements.id, delId));
      }
      return { deleted: toDelete.size };
    }),
});
