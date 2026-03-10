import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { changeRequests } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

async function getNextCrId(projectId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const existing = await db.select({ crId: changeRequests.crId })
    .from(changeRequests)
    .where(eq(changeRequests.projectId, projectId))
    .orderBy(desc(changeRequests.id));
  let maxNum = 0;
  for (const row of existing) {
    const match = row.crId.match(/(\d+)$/);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
  }
  return `CR-${String(maxNum + 1).padStart(4, "0")}`;
}

export const changeRequestsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(changeRequests)
        .where(eq(changeRequests.projectId, input.projectId))
        .orderBy(desc(changeRequests.createdAt));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [cr] = await db.select().from(changeRequests).where(eq(changeRequests.id, input.id));
      return cr ?? null;
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      requestedBy: z.string().optional(),
      requestedById: z.number().optional(),
      assignedTo: z.string().optional(),
      assignedToId: z.number().optional(),
      priority: z.string().optional(),
      impactAssessment: z.string().optional(),
      requirementId: z.string().optional(),
      taskId: z.string().optional(),
      issueId: z.string().optional(),
      estimatedEffort: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const crId = await getNextCrId(input.projectId);
      await db.insert(changeRequests).values({ ...input, crId, status: "Draft" });
      const [created] = await db.select().from(changeRequests)
        .where(and(eq(changeRequests.projectId, input.projectId), eq(changeRequests.crId, crId)));
      return created;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      requestedBy: z.string().optional(),
      assignedTo: z.string().optional(),
      priority: z.string().optional(),
      impactAssessment: z.string().optional(),
      requirementId: z.string().optional(),
      taskId: z.string().optional(),
      issueId: z.string().optional(),
      estimatedEffort: z.string().optional(),
      actualEffort: z.string().optional(),
      scopeItemId: z.number().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...data } = input;
      await db.update(changeRequests).set(data).where(eq(changeRequests.id, id));
      const [updated] = await db.select().from(changeRequests).where(eq(changeRequests.id, id));
      return updated;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["Draft", "Submitted", "Under Review", "Approved", "Rejected", "Implemented", "Closed"]),
      reviewedBy: z.string().optional(),
      approvedBy: z.string().optional(),
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const now = new Date();
      const updateData: Partial<typeof changeRequests.$inferInsert> = { status: input.status };
      if (input.status === "Submitted") updateData.submittedAt = now;
      if (input.status === "Under Review") { updateData.reviewedAt = now; updateData.reviewedBy = input.reviewedBy; }
      if (input.status === "Approved") { updateData.approvedAt = now; updateData.approvedBy = input.approvedBy; }
      if (input.status === "Rejected") updateData.rejectionReason = input.rejectionReason;
      if (input.status === "Implemented") updateData.implementedAt = now;
      await db.update(changeRequests).set(updateData).where(eq(changeRequests.id, input.id));
      const [updated] = await db.select().from(changeRequests).where(eq(changeRequests.id, input.id));
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(changeRequests).where(eq(changeRequests.id, input.id));
      return { success: true };
    }),
});
