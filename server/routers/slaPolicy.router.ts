import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { slaPolicies } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const PRIORITY_DEFAULTS: Record<string, { responseTimeHours: number; resolutionTimeHours: number }> = {
  Critical: { responseTimeHours: 1, resolutionTimeHours: 4 },
  High: { responseTimeHours: 4, resolutionTimeHours: 24 },
  Medium: { responseTimeHours: 8, resolutionTimeHours: 72 },
  Low: { responseTimeHours: 24, resolutionTimeHours: 168 },
};

export const slaPolicyRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(slaPolicies)
        .where(eq(slaPolicies.projectId, input.projectId));

      // Return all 4 priorities, filling in defaults for any that don't exist yet
      const priorities = ["Critical", "High", "Medium", "Low"] as const;
      return priorities.map((priority) => {
        const existing = rows.find((r) => r.priority === priority);
        if (existing) return existing;
        return {
          id: null,
          projectId: input.projectId,
          priority,
          ...PRIORITY_DEFAULTS[priority],
          createdAt: null,
          updatedAt: null,
        };
      });
    }),

  upsert: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      priority: z.enum(["Critical", "High", "Medium", "Low"]),
      responseTimeHours: z.number().min(0),
      resolutionTimeHours: z.number().min(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [existing] = await db.select().from(slaPolicies)
        .where(and(
          eq(slaPolicies.projectId, input.projectId),
          eq(slaPolicies.priority, input.priority),
        ));

      if (existing) {
        await db.update(slaPolicies)
          .set({ responseTimeHours: input.responseTimeHours, resolutionTimeHours: input.resolutionTimeHours })
          .where(eq(slaPolicies.id, existing.id));
        const [updated] = await db.select().from(slaPolicies).where(eq(slaPolicies.id, existing.id));
        return updated;
      } else {
        await db.insert(slaPolicies).values({
          projectId: input.projectId,
          priority: input.priority,
          responseTimeHours: input.responseTimeHours,
          resolutionTimeHours: input.resolutionTimeHours,
        });
        const [created] = await db.select().from(slaPolicies)
          .where(and(
            eq(slaPolicies.projectId, input.projectId),
            eq(slaPolicies.priority, input.priority),
          ));
        return created;
      }
    }),
});
