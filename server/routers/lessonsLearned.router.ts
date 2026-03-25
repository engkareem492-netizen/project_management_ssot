import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { lessonsLearned } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

async function getNextLessonId(projectId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const existing = await db.select({ lessonId: lessonsLearned.lessonId })
    .from(lessonsLearned)
    .where(eq(lessonsLearned.projectId, projectId))
    .orderBy(desc(lessonsLearned.id));
  let maxNum = 0;
  for (const row of existing) {
    const match = row.lessonId.match(/(\d+)$/);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
  }
  return `LL-${String(maxNum + 1).padStart(4, "0")}`;
}

export const lessonsLearnedRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(lessonsLearned)
        .where(eq(lessonsLearned.projectId, input.projectId))
        .orderBy(desc(lessonsLearned.createdAt));
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().min(1),
      category: z.enum(["Technical", "Process", "People", "Commercial", "Risk", "Communication", "Other"]).optional(),
      phase: z.string().optional(),
      whatWentWell: z.string().optional(),
      whatToImprove: z.string().optional(),
      recommendation: z.string().optional(),
      impact: z.enum(["Low", "Medium", "High"]).optional(),
      owner: z.string().optional(),
      ownerId: z.number().optional(),
      dateRecorded: z.string().optional(),
      status: z.enum(["Draft", "Reviewed", "Approved", "Archived"]).optional(),
      tags: z.array(z.string()).optional(),
      linkedDocumentId: z.number().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const lessonId = await getNextLessonId(input.projectId);
      const { dateRecorded, ...rest } = input;
      await db.insert(lessonsLearned).values({
        ...rest,
        lessonId,
        dateRecorded: dateRecorded ? new Date(dateRecorded) : null,
        tags: rest.tags ?? [],
        status: rest.status ?? "Draft",
        category: rest.category ?? "Process",
        impact: rest.impact ?? "Medium",
      });
      const [created] = await db.select().from(lessonsLearned)
        .where(and(eq(lessonsLearned.projectId, input.projectId), eq(lessonsLearned.lessonId, lessonId)));
      return created;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      category: z.enum(["Technical", "Process", "People", "Commercial", "Risk", "Communication", "Other"]).optional(),
      phase: z.string().optional(),
      whatWentWell: z.string().optional(),
      whatToImprove: z.string().optional(),
      recommendation: z.string().optional(),
      impact: z.enum(["Low", "Medium", "High"]).optional(),
      owner: z.string().optional(),
      ownerId: z.number().optional().nullable(),
      dateRecorded: z.string().optional().nullable(),
      status: z.enum(["Draft", "Reviewed", "Approved", "Archived"]).optional(),
      tags: z.array(z.string()).optional(),
      linkedDocumentId: z.number().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, dateRecorded, ...rest } = input;
      await db.update(lessonsLearned).set({
        ...rest,
        dateRecorded: dateRecorded ? new Date(dateRecorded) : null,
      }).where(eq(lessonsLearned.id, id));
      const [updated] = await db.select().from(lessonsLearned).where(eq(lessonsLearned.id, id));
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(lessonsLearned).where(eq(lessonsLearned.id, input.id));
      return { success: true };
    }),
});
