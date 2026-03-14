import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { communicationPlanEntries } from "../../drizzle/schema";

export const communicationPlanRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(communicationPlanEntries)
        .where(eq(communicationPlanEntries.projectId, input.projectId))
        .orderBy(communicationPlanEntries.createdAt);
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      stakeholderId: z.number().optional(),
      role: z.string().optional(),
      informationNeeded: z.string().optional(),
      preferredMethods: z.array(z.string()).optional(),
      frequency: z.string().optional(),
      textNote: z.string().optional(),
      escalationProcedures: z.string().optional(),
      responsible: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(communicationPlanEntries).values(input);
      const rows = await db
        .select()
        .from(communicationPlanEntries)
        .where(eq(communicationPlanEntries.id, result[0].insertId))
        .limit(1);
      return rows[0];
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        stakeholderId: z.number().nullable().optional(),
        role: z.string().optional(),
        informationNeeded: z.string().optional(),
        preferredMethods: z.array(z.string()).optional(),
        frequency: z.string().optional(),
        textNote: z.string().optional(),
        escalationProcedures: z.string().optional(),
        responsible: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(communicationPlanEntries).set(input.data as any).where(eq(communicationPlanEntries.id, input.id));
      const rows = await db
        .select()
        .from(communicationPlanEntries)
        .where(eq(communicationPlanEntries.id, input.id))
        .limit(1);
      return rows[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(communicationPlanEntries).where(eq(communicationPlanEntries.id, input.id));
      return { success: true };
    }),

  // Bulk import from stakeholder communication fields
  importFromStakeholders: protectedProcedure
    .input(z.object({ projectId: z.number(), stakeholderIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { stakeholders } = await import("../../drizzle/schema");
      const { inArray } = await import("drizzle-orm");
      const rows = await db.select().from(stakeholders).where(
        inArray(stakeholders.id, input.stakeholderIds)
      );
      for (const s of rows) {
        await db.insert(communicationPlanEntries).values({
          projectId: input.projectId,
          stakeholderId: s.id,
          role: s.role ?? undefined,
          preferredMethods: s.communicationChannel ? [s.communicationChannel] : [],
          frequency: s.communicationFrequency ?? undefined,
          textNote: s.communicationMessage ?? undefined,
          responsible: s.communicationResponsible ?? undefined,
        });
      }
      return { imported: rows.length };
    }),
});
