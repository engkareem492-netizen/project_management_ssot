import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { ticketTypes } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const ticketTypesRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(ticketTypes)
        .where(eq(ticketTypes.projectId, input.projectId))
        .orderBy(desc(ticketTypes.createdAt));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [item] = await db.select().from(ticketTypes).where(eq(ticketTypes.id, input.id));
      return item ?? null;
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      responseTimeHours: z.number().min(0),
      resolutionTimeHours: z.number().min(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(ticketTypes).values({
        projectId: input.projectId,
        name: input.name,
        description: input.description ?? null,
        responseTimeHours: input.responseTimeHours,
        resolutionTimeHours: input.resolutionTimeHours,
      });
      const [created] = await db.select().from(ticketTypes)
        .where(eq(ticketTypes.projectId, input.projectId))
        .orderBy(desc(ticketTypes.id))
        .limit(1);
      return created;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        responseTimeHours: z.number().min(0).optional(),
        resolutionTimeHours: z.number().min(0).optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(ticketTypes).set(input.data).where(eq(ticketTypes.id, input.id));
      const [updated] = await db.select().from(ticketTypes).where(eq(ticketTypes.id, input.id));
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(ticketTypes).where(eq(ticketTypes.id, input.id));
      return { success: true };
    }),
});
