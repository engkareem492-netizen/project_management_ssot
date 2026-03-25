import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { projectWorkWeek } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

const DEFAULT_SETTINGS = {
  workingDays: "0,1,2,3,4", // Sun-Thu
  workStartHour: 8,
  workEndHour: 17,
  hoursPerDay: "8.0",
  weekEndDay: 4, // Thursday
};

export const projectWorkWeekRouter = router({
  get: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return DEFAULT_SETTINGS;
      const rows = await db
        .select()
        .from(projectWorkWeek)
        .where(eq(projectWorkWeek.projectId, input.projectId))
        .limit(1);
      if (rows.length === 0) return { ...DEFAULT_SETTINGS, projectId: input.projectId };
      return rows[0];
    }),

  upsert: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      workingDays: z.string(),       // comma-separated day numbers e.g. "0,1,2,3,4"
      workStartHour: z.number().min(0).max(23),
      workEndHour: z.number().min(1).max(24),
      hoursPerDay: z.number().min(0.5).max(24),
      weekEndDay: z.number().min(0).max(6),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.execute(
        sql`INSERT INTO projectWorkWeek (projectId, workingDays, workStartHour, workEndHour, hoursPerDay, weekEndDay)
            VALUES (${input.projectId}, ${input.workingDays}, ${input.workStartHour}, ${input.workEndHour}, ${input.hoursPerDay}, ${input.weekEndDay})
            ON DUPLICATE KEY UPDATE
              workingDays = VALUES(workingDays),
              workStartHour = VALUES(workStartHour),
              workEndHour = VALUES(workEndHour),
              hoursPerDay = VALUES(hoursPerDay),
              weekEndDay = VALUES(weekEndDay),
              updatedAt = NOW()`
      );
      return { success: true };
    }),
});
