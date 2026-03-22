import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import {
  stakeholderSkills,
  stakeholderSwot,
  developmentPlans,
  resourceCalendar,
} from "../../drizzle/schema";

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;
const SWOT_QUADRANTS = ["Strength", "Weakness", "Opportunity", "Threat"] as const;
const DEV_PLAN_STATUSES = ["Not Started", "In Progress", "Completed", "On Hold"] as const;

export const teamSkillsRouter = router({
  // ─── Skills ──────────────────────────────────────────────────────────────────
  listSkills: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(stakeholderSkills)
        .where(eq(stakeholderSkills.stakeholderId, input.stakeholderId))
        .orderBy(stakeholderSkills.name);
    }),

  addSkill: protectedProcedure
    .input(z.object({
      stakeholderId: z.number(),
      name: z.string(),
      level: z.enum(SKILL_LEVELS).optional(),
      linkedKpiId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(stakeholderSkills).values(input);
      const rows = await db
        .select()
        .from(stakeholderSkills)
        .where(eq(stakeholderSkills.id, result[0].insertId))
        .limit(1);
      return rows[0];
    }),

  updateSkill: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(),
        level: z.enum(SKILL_LEVELS).optional(),
        linkedKpiId: z.number().nullable().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(stakeholderSkills).set(input.data as any).where(eq(stakeholderSkills.id, input.id));
      const rows = await db.select().from(stakeholderSkills).where(eq(stakeholderSkills.id, input.id)).limit(1);
      return rows[0];
    }),

  deleteSkill: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(stakeholderSkills).where(eq(stakeholderSkills.id, input.id));
      return { success: true };
    }),

  // ─── SWOT ─────────────────────────────────────────────────────────────────────
  listSwot: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(stakeholderSwot)
        .where(eq(stakeholderSwot.stakeholderId, input.stakeholderId))
        .orderBy(stakeholderSwot.quadrant);
    }),

  addSwot: protectedProcedure
    .input(z.object({
      stakeholderId: z.number(),
      quadrant: z.enum(SWOT_QUADRANTS),
      description: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(stakeholderSwot).values(input);
      const rows = await db
        .select()
        .from(stakeholderSwot)
        .where(eq(stakeholderSwot.id, result[0].insertId))
        .limit(1);
      return rows[0];
    }),

  deleteSwot: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(stakeholderSwot).where(eq(stakeholderSwot.id, input.id));
      return { success: true };
    }),

  // ─── Development Plans ────────────────────────────────────────────────────────
  listDevPlans: protectedProcedure
    .input(z.object({ stakeholderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(developmentPlans)
        .where(eq(developmentPlans.stakeholderId, input.stakeholderId))
        .orderBy(developmentPlans.createdAt);
    }),

  createDevPlan: protectedProcedure
    .input(z.object({
      stakeholderId: z.number(),
      projectId: z.number(),
      title: z.string(),
      description: z.string().optional(),
      goals: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      status: z.enum(DEV_PLAN_STATUSES).optional(),
      linkedTaskGroupId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(developmentPlans).values(input);
      const rows = await db
        .select()
        .from(developmentPlans)
        .where(eq(developmentPlans.id, result[0].insertId))
        .limit(1);
      return rows[0];
    }),

  updateDevPlan: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        goals: z.string().optional(),
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
        status: z.enum(DEV_PLAN_STATUSES).optional(),
        linkedTaskGroupId: z.number().nullable().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(developmentPlans).set(input.data as any).where(eq(developmentPlans.id, input.id));
      const rows = await db.select().from(developmentPlans).where(eq(developmentPlans.id, input.id)).limit(1);
      return rows[0];
    }),

  deleteDevPlan: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(developmentPlans).where(eq(developmentPlans.id, input.id));
      return { success: true };
    }),

  // ─── Resource Calendar ────────────────────────────────────────────────────────
  listCalendar: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      stakeholderId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const { and, eq, gte, lte } = await import("drizzle-orm");
      const conditions = [eq(resourceCalendar.projectId, input.projectId)];
      if (input.stakeholderId) conditions.push(eq(resourceCalendar.stakeholderId, input.stakeholderId));
      if (input.startDate) conditions.push(gte(resourceCalendar.date, input.startDate));
      if (input.endDate) conditions.push(lte(resourceCalendar.date, input.endDate));
      return await db.select().from(resourceCalendar).where(and(...conditions)).orderBy(resourceCalendar.date);
    }),

  upsertCalendarEntry: protectedProcedure
    .input(z.object({
      stakeholderId: z.number(),
      projectId: z.number(),
      date: z.string(),
      type: z.enum(["Working", "Leave", "Holiday", "Training", "PartTime"]),
      availableHours: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { eq, and } = await import("drizzle-orm");
      const existing = await db.select().from(resourceCalendar).where(
        and(
          eq(resourceCalendar.stakeholderId, input.stakeholderId),
          eq(resourceCalendar.date, input.date),
        )
      ).limit(1);

      if (existing.length > 0) {
        await db.update(resourceCalendar).set({
          type: input.type,
          availableHours: input.availableHours,
          notes: input.notes,
        }).where(eq(resourceCalendar.id, existing[0].id));
        const rows = await db.select().from(resourceCalendar).where(eq(resourceCalendar.id, existing[0].id)).limit(1);
        return rows[0];
      } else {
        const result = await db.insert(resourceCalendar).values(input);
        const rows = await db.select().from(resourceCalendar).where(eq(resourceCalendar.id, result[0].insertId)).limit(1);
        return rows[0];
      }
    }),

  // Upsert a range of dates at once (e.g. a week of leave)
  upsertCalendarRange: protectedProcedure
    .input(z.object({
      stakeholderId: z.number(),
      projectId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
      type: z.enum(["Working", "Leave", "Holiday", "Training", "PartTime"]),
      availableHours: z.string().optional(),
      notes: z.string().optional(),
      skipWeekends: z.boolean().optional().default(true),
      skipDays: z.array(z.number().min(0).max(6)).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { eq, and } = await import("drizzle-orm");

      // Determine which days to skip: explicit skipDays array takes priority over boolean skipWeekends
      const daysToSkip: number[] = input.skipDays !== undefined
        ? input.skipDays
        : (input.skipWeekends ? [0, 6] : []);

      // Build list of dates in range
      const dates: string[] = [];
      const current = new Date(input.startDate + "T00:00:00");
      const end = new Date(input.endDate + "T00:00:00");
      while (current <= end) {
        const dow = current.getDay();
        if (!daysToSkip.includes(dow)) {
          dates.push(current.toISOString().split("T")[0]);
        }
        current.setDate(current.getDate() + 1);
      }

      const results = [];
      for (const date of dates) {
        const existing = await db.select().from(resourceCalendar).where(
          and(
            eq(resourceCalendar.stakeholderId, input.stakeholderId),
            eq(resourceCalendar.date, date),
          )
        ).limit(1);

        if (existing.length > 0) {
          await db.update(resourceCalendar).set({
            type: input.type,
            availableHours: input.availableHours,
            notes: input.notes,
          }).where(eq(resourceCalendar.id, existing[0].id));
          const rows = await db.select().from(resourceCalendar).where(eq(resourceCalendar.id, existing[0].id)).limit(1);
          results.push(rows[0]);
        } else {
          const result = await db.insert(resourceCalendar).values({
            stakeholderId: input.stakeholderId,
            projectId: input.projectId,
            date,
            type: input.type,
            availableHours: input.availableHours,
            notes: input.notes,
          });
          const rows = await db.select().from(resourceCalendar).where(eq(resourceCalendar.id, result[0].insertId)).limit(1);
          results.push(rows[0]);
        }
      }
      return { count: results.length, dates };
    }),

  deleteCalendarEntry: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(resourceCalendar).where(eq(resourceCalendar.id, input.id));
      return { success: true };
    }),

  // Mass-fill working days: fill empty days as Working (full-time) and optionally create Holiday for weekends
  massUpsertWorking: protectedProcedure
    .input(z.object({
      stakeholderIds: z.array(z.number()),
      projectId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
      fullTimeHours: z.string().default("8"),
      skipSaturday: z.boolean().default(true).optional(),
      skipSunday: z.boolean().default(true).optional(),
      skipDays: z.array(z.number().min(0).max(6)).optional(),
      createWeekendHolidays: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { eq, and } = await import("drizzle-orm");

      // Determine which days count as "weekend" (to skip/create holiday for)
      // skipDays array takes priority over legacy skipSaturday/skipSunday booleans
      const daysToSkip: number[] = input.skipDays !== undefined
        ? input.skipDays
        : [
            ...(input.skipSunday !== false ? [0] : []),
            ...(input.skipSaturday !== false ? [6] : []),
          ];

      const allDates: { date: string; isWeekend: boolean }[] = [];
      const cur = new Date(input.startDate + "T00:00:00");
      const end = new Date(input.endDate + "T00:00:00");
      while (cur <= end) {
        const dow = cur.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const isWeekend = daysToSkip.includes(dow);
        allDates.push({ date: cur.toISOString().split("T")[0], isWeekend });
        cur.setDate(cur.getDate() + 1);
      }

      let filledWorking = 0;
      let filledHoliday = 0;

      for (const sid of input.stakeholderIds) {
        for (const { date, isWeekend } of allDates) {
          // Check if an entry already exists
          const existing = await db
            .select()
            .from(resourceCalendar)
            .where(
              and(
                eq(resourceCalendar.stakeholderId, sid),
                eq(resourceCalendar.date, date),
              )
            )
            .limit(1);

          if (existing.length > 0) continue; // Never overwrite existing entries

          if (isWeekend) {
            if (input.createWeekendHolidays) {
              await db.insert(resourceCalendar).values({
                stakeholderId: sid,
                projectId: input.projectId,
                date,
                type: "Holiday",
                availableHours: "0",
                notes: "Weekend",
              });
              filledHoliday++;
            }
          } else {
            await db.insert(resourceCalendar).values({
              stakeholderId: sid,
              projectId: input.projectId,
              date,
              type: "Working",
              availableHours: input.fullTimeHours,
              notes: "",
            });
            filledWorking++;
          }
        }
      }

      return { filledWorking, filledHoliday, total: filledWorking + filledHoliday };
    }),

  // ─── Resource Availability Check ──────────────────────────────────────────
  // Returns calendar entries for one or more stakeholders within a date range.
  // Used by the Tasks page to validate resource availability before saving.
  checkAvailability: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      stakeholderIds: z.array(z.number()),
      startDate: z.string(), // YYYY-MM-DD
      endDate: z.string(),   // YYYY-MM-DD
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const { and, eq, gte, lte, inArray } = await import("drizzle-orm");
      if (input.stakeholderIds.length === 0) return [];
      return await db.select().from(resourceCalendar).where(
        and(
          eq(resourceCalendar.projectId, input.projectId),
          inArray(resourceCalendar.stakeholderId, input.stakeholderIds),
          gte(resourceCalendar.date, input.startDate),
          lte(resourceCalendar.date, input.endDate),
        )
      ).orderBy(resourceCalendar.date);
    }),
});
