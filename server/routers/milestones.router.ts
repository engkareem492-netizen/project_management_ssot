import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { milestones } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

async function getNextMilestoneId(projectId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const existing = await db.select({ milestoneId: milestones.milestoneId })
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
    .orderBy(desc(milestones.id));
  let maxNum = 0;
  for (const row of existing) {
    const match = row.milestoneId.match(/(\d+)$/);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
  }
  return `MS-${String(maxNum + 1).padStart(4, "0")}`;
}

export const milestonesRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(milestones)
        .where(eq(milestones.projectId, input.projectId))
        .orderBy(milestones.dueDate);
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      dueDate: z.string().optional(),
      phase: z.string().optional(),
      owner: z.string().optional(),
      ownerId: z.number().optional(),
      ragStatus: z.enum(["Green", "Amber", "Red"]).optional(),
      status: z.enum(["Upcoming", "In Progress", "Achieved", "Missed", "Deferred"]).optional(),
      linkedDeliverableIds: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const milestoneId = await getNextMilestoneId(input.projectId);
      const { dueDate, ...rest } = input;
      await db.insert(milestones).values({
        ...rest,
        milestoneId,
        dueDate: dueDate ? new Date(dueDate) : null,
        linkedDeliverableIds: rest.linkedDeliverableIds ?? [],
      });
      const [created] = await db.select().from(milestones)
        .where(and(eq(milestones.projectId, input.projectId), eq(milestones.milestoneId, milestoneId)));
      return created;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      dueDate: z.string().optional().nullable(),
      completedDate: z.string().optional().nullable(),
      phase: z.string().optional(),
      owner: z.string().optional(),
      ownerId: z.number().optional().nullable(),
      ragStatus: z.enum(["Green", "Amber", "Red"]).optional(),
      status: z.enum(["Upcoming", "In Progress", "Achieved", "Missed", "Deferred"]).optional(),
      linkedDeliverableIds: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, dueDate, completedDate, ...rest } = input;
      await db.update(milestones).set({
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : null,
        completedDate: completedDate ? new Date(completedDate) : null,
      }).where(eq(milestones.id, id));
      const [updated] = await db.select().from(milestones).where(eq(milestones.id, id));
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(milestones).where(eq(milestones.id, input.id));
      return { success: true };
    }),
});
