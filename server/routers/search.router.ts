import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const searchRouter = router({
  global: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      query: z.string().min(1).max(200),
      limitPerType: z.number().min(1).max(20).default(5),
    }))
    .query(async ({ input }) => {
      return await db.globalSearch(input.projectId, input.query, input.limitPerType);
    }),
});
