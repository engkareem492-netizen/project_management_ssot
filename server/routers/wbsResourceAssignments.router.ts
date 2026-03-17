import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { wbsResourceAssignments } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const wbsResourceAssignmentsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(wbsResourceAssignments)
        .where(eq(wbsResourceAssignments.projectId, input.projectId));
    }),

  upsert: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      wbsNodeId: z.number(),
      rbsNodeId: z.number(),
      allocationPct: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const existing = await db.select().from(wbsResourceAssignments)
        .where(and(
          eq(wbsResourceAssignments.projectId, input.projectId),
          eq(wbsResourceAssignments.wbsNodeId, input.wbsNodeId),
          eq(wbsResourceAssignments.rbsNodeId, input.rbsNodeId),
        ));
      if (existing.length > 0) {
        await db.update(wbsResourceAssignments)
          .set({
            allocationPct: input.allocationPct ?? "100.00",
            notes: input.notes ?? null,
          })
          .where(eq(wbsResourceAssignments.id, existing[0].id));
      } else {
        await db.insert(wbsResourceAssignments).values({
          projectId: input.projectId,
          wbsNodeId: input.wbsNodeId,
          rbsNodeId: input.rbsNodeId,
          allocationPct: input.allocationPct ?? "100.00",
          notes: input.notes ?? null,
        });
      }
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(wbsResourceAssignments).where(eq(wbsResourceAssignments.id, input.id));
      return { success: true };
    }),
});
