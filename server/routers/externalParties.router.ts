import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { externalParties } from "../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const externalPartiesRouter = router({
  // List all external parties for a project
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db
        .select()
        .from(externalParties)
        .where(eq(externalParties.projectId, input.projectId))
        .orderBy(asc(externalParties.name));
    }),

  // Create a new external party
  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string().min(1).max(200),
      description: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await db.insert(externalParties).values({
        projectId: input.projectId,
        name: input.name.trim(),
        description: input.description ?? null,
      });
      const insertId = (result as any)[0]?.insertId;
      const [created] = await db
        .select()
        .from(externalParties)
        .where(eq(externalParties.id, insertId));
      return created;
    }),

  // Update an existing external party
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      projectId: z.number(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, projectId, ...updates } = input;
      const data: Record<string, any> = {};
      if (updates.name !== undefined) data.name = updates.name.trim();
      if (updates.description !== undefined) data.description = updates.description;
      if (Object.keys(data).length > 0) {
        await db
          .update(externalParties)
          .set(data)
          .where(and(eq(externalParties.id, id), eq(externalParties.projectId, projectId)));
      }
      const [updated] = await db
        .select()
        .from(externalParties)
        .where(eq(externalParties.id, id));
      return updated;
    }),

  // Delete an external party
  delete: protectedProcedure
    .input(z.object({ id: z.number(), projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .delete(externalParties)
        .where(and(eq(externalParties.id, input.id), eq(externalParties.projectId, input.projectId)));
      return { success: true };
    }),
});
