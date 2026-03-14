import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { pmPlanSections } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const SECTION_KEYS = [
  "scope_mgmt",
  "schedule_mgmt",
  "cost_mgmt",
  "quality_mgmt",
  "resource_mgmt",
  "comms_mgmt",
  "risk_mgmt",
  "procurement_mgmt",
  "stakeholder_mgmt",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const pmPlanRouter = router({
  // Get all sections for a project (returns map of sectionKey → content)
  getAll: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {};
      const rows = await db
        .select()
        .from(pmPlanSections)
        .where(eq(pmPlanSections.projectId, input.projectId));
      const map: Record<string, Record<string, string>> = {};
      for (const row of rows) {
        map[row.sectionKey] = (row.content as Record<string, string>) ?? {};
      }
      return map;
    }),

  // Upsert a single section
  upsertSection: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        sectionKey: z.string(),
        content: z.record(z.string(), z.string()),
        updatedBy: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const { projectId, sectionKey, content } = input;
      const updatedBy = input.updatedBy ?? ctx.user?.name ?? "unknown";
      const safeContent = content as Record<string, string>;
      const [existing] = await db
        .select({ id: pmPlanSections.id })
        .from(pmPlanSections)
        .where(
          and(
            eq(pmPlanSections.projectId, projectId),
            eq(pmPlanSections.sectionKey, sectionKey)
          )
        );
      if (existing) {
        await db
          .update(pmPlanSections)
          .set({ content: safeContent, lastUpdatedBy: updatedBy })
          .where(eq(pmPlanSections.id, existing.id));
      } else {
        await db.insert(pmPlanSections).values({
          projectId,
          sectionKey,
          content: safeContent,
          lastUpdatedBy: updatedBy,
        });
      }
      const [updated] = await db
        .select()
        .from(pmPlanSections)
        .where(
          and(
            eq(pmPlanSections.projectId, projectId),
            eq(pmPlanSections.sectionKey, sectionKey)
          )
        );
      return updated;
    }),
});
