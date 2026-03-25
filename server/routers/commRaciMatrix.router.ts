import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { commRaciMatrix } from "../../drizzle/schema";
import { sql } from "drizzle-orm";

export const commRaciMatrixRouter = router({
  // Returns all matrix cells for the project
  getMatrix: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(commRaciMatrix)
        .where(eq(commRaciMatrix.projectId, input.projectId));
    }),

  // Upsert a single cell (projectId + commItemLabel + stakeholderId uniquely identifies the cell)
  setCell: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      commItemLabel: z.string(),
      stakeholderId: z.number(),
      raciValue: z.string().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Try to find an existing cell
      const existing = await db
        .select()
        .from(commRaciMatrix)
        .where(
          and(
            eq(commRaciMatrix.projectId, input.projectId),
            eq(commRaciMatrix.commItemLabel, input.commItemLabel),
            eq(commRaciMatrix.stakeholderId, input.stakeholderId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(commRaciMatrix)
          .set({ raciValue: input.raciValue })
          .where(eq(commRaciMatrix.id, existing[0].id));
        return { id: existing[0].id };
      } else {
        const result = await db.insert(commRaciMatrix).values({
          projectId: input.projectId,
          commItemLabel: input.commItemLabel,
          stakeholderId: input.stakeholderId,
          raciValue: input.raciValue,
        });
        const insertId: number = (result as any)[0]?.insertId ?? (result as any).insertId;
        return { id: insertId };
      }
    }),

  // Returns distinct comm item labels for the project (the row headers)
  listCommItems: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .selectDistinct({ commItemLabel: commRaciMatrix.commItemLabel })
        .from(commRaciMatrix)
        .where(eq(commRaciMatrix.projectId, input.projectId))
        .orderBy(commRaciMatrix.commItemLabel);
      return rows.map((r) => r.commItemLabel);
    }),

  // Adds a new row (comm item label) by inserting a placeholder cell (no stakeholder needed upfront)
  // We just add a sentinel record to preserve the label even when no cells are set
  addCommItem: protectedProcedure
    .input(z.object({ projectId: z.number(), label: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Check if the label already exists for this project
      const existing = await db
        .select()
        .from(commRaciMatrix)
        .where(
          and(
            eq(commRaciMatrix.projectId, input.projectId),
            eq(commRaciMatrix.commItemLabel, input.label)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error("A row with this label already exists");
      }

      // Insert a sentinel record with stakeholderId = 0 to anchor the row label
      await db.insert(commRaciMatrix).values({
        projectId: input.projectId,
        commItemLabel: input.label,
        stakeholderId: 0,
        raciValue: null,
      });

      return { success: true };
    }),

  // Removes all cells for a given comm item label (deletes the row)
  deleteCommItem: protectedProcedure
    .input(z.object({ projectId: z.number(), label: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      await db
        .delete(commRaciMatrix)
        .where(
          and(
            eq(commRaciMatrix.projectId, input.projectId),
            eq(commRaciMatrix.commItemLabel, input.label)
          )
        );

      return { success: true };
    }),
});
