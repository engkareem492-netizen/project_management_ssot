import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const resourcesRouter = router({
  getWorkload: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const [stakeholders, tasks, capacities] = await Promise.all([
        db.getAllStakeholders(input.projectId),
        db.getAllTasksSorted(input.projectId),
        db.getResourceCapacities(input.projectId),
      ]);
      return { stakeholders, tasks, capacities };
    }),

  upsertCapacity: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      stakeholderId: z.number(),
      weekStart: z.string(),
      availableHours: z.string(),
    }))
    .mutation(async ({ input }) => {
      await db.upsertResourceCapacity(input.projectId, input.stakeholderId, input.weekStart, input.availableHours);
      return { success: true };
    }),
});
