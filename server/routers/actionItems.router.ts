import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { actionItems } from "../../drizzle/schema";
import { eq, and, desc, or } from "drizzle-orm";

async function getNextActionItemId(projectId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const existing = await db.select({ actionItemId: actionItems.actionItemId })
    .from(actionItems)
    .where(eq(actionItems.projectId, projectId))
    .orderBy(desc(actionItems.id));
  let maxNum = 0;
  for (const row of existing) {
    const match = row.actionItemId.match(/(\d+)$/);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
  }
  return `AI-${String(maxNum + 1).padStart(4, "0")}`;
}

export const actionItemsRouter = router({
  list: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      status: z.string().optional(),
      meetingId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(actionItems.projectId, input.projectId)];
      return db.select().from(actionItems)
        .where(and(...conditions))
        .orderBy(desc(actionItems.createdAt));
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      description: z.string().min(1),
      owner: z.string().optional(),
      ownerId: z.number().optional(),
      dueDate: z.string().optional(),
      status: z.enum(["Open", "In Progress", "Done", "Cancelled"]).optional(),
      priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
      sourceType: z.string().optional(),
      sourceId: z.string().optional(),
      meetingId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const actionItemId = await getNextActionItemId(input.projectId);
      const { dueDate, ...rest } = input;
      await db.insert(actionItems).values({
        ...rest,
        actionItemId,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: rest.status ?? "Open",
        priority: rest.priority ?? "Medium",
      });
      const [created] = await db.select().from(actionItems)
        .where(and(eq(actionItems.projectId, input.projectId), eq(actionItems.actionItemId, actionItemId)));
      return created;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      description: z.string().min(1).optional(),
      owner: z.string().optional(),
      ownerId: z.number().optional().nullable(),
      dueDate: z.string().optional().nullable(),
      completedDate: z.string().optional().nullable(),
      status: z.enum(["Open", "In Progress", "Done", "Cancelled"]).optional(),
      priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
      sourceType: z.string().optional(),
      sourceId: z.string().optional(),
      meetingId: z.number().optional().nullable(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, dueDate, completedDate, ...rest } = input;
      await db.update(actionItems).set({
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : null,
        completedDate: completedDate ? new Date(completedDate) : null,
      }).where(eq(actionItems.id, id));
      const [updated] = await db.select().from(actionItems).where(eq(actionItems.id, id));
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(actionItems).where(eq(actionItems.id, input.id));
      return { success: true };
    }),
});
