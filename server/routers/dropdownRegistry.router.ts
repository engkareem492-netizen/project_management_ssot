import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { dropdownRegistry } from "../../drizzle/schema";
import { and, eq, asc } from "drizzle-orm";

const SEED_DEFAULTS: Record<string, Record<string, Array<{ value: string; color?: string; sortOrder: number }>>> = {
  tasks: {
    status: [
      { value: "Not Started", color: "#6b7280", sortOrder: 0 },
      { value: "In Progress", color: "#3b82f6", sortOrder: 1 },
      { value: "In Review", color: "#f59e0b", sortOrder: 2 },
      { value: "Completed", color: "#10b981", sortOrder: 3 },
      { value: "On Hold", color: "#8b5cf6", sortOrder: 4 },
      { value: "Cancelled", color: "#ef4444", sortOrder: 5 },
    ],
    priority: [
      { value: "Critical", color: "#dc2626", sortOrder: 0 },
      { value: "High", color: "#f97316", sortOrder: 1 },
      { value: "Medium", color: "#f59e0b", sortOrder: 2 },
      { value: "Low", color: "#10b981", sortOrder: 3 },
    ],
    type: [
      { value: "Feature", color: "#3b82f6", sortOrder: 0 },
      { value: "Bug Fix", color: "#ef4444", sortOrder: 1 },
      { value: "Improvement", color: "#8b5cf6", sortOrder: 2 },
      { value: "Research", color: "#06b6d4", sortOrder: 3 },
      { value: "Documentation", color: "#6b7280", sortOrder: 4 },
    ],
  },
  issues: {
    status: [
      { value: "Open", color: "#3b82f6", sortOrder: 0 },
      { value: "In Progress", color: "#f59e0b", sortOrder: 1 },
      { value: "Resolved", color: "#10b981", sortOrder: 2 },
      { value: "Closed", color: "#6b7280", sortOrder: 3 },
      { value: "Reopened", color: "#ef4444", sortOrder: 4 },
    ],
    priority: [
      { value: "Critical", color: "#dc2626", sortOrder: 0 },
      { value: "High", color: "#f97316", sortOrder: 1 },
      { value: "Medium", color: "#f59e0b", sortOrder: 2 },
      { value: "Low", color: "#10b981", sortOrder: 3 },
    ],
    type: [
      { value: "Bug", color: "#ef4444", sortOrder: 0 },
      { value: "Blocker", color: "#dc2626", sortOrder: 1 },
      { value: "Improvement", color: "#8b5cf6", sortOrder: 2 },
      { value: "Question", color: "#06b6d4", sortOrder: 3 },
    ],
  },
  risks: {
    status: [
      { value: "Identified", color: "#6b7280", sortOrder: 0 },
      { value: "Analyzing", color: "#3b82f6", sortOrder: 1 },
      { value: "Mitigating", color: "#f59e0b", sortOrder: 2 },
      { value: "Monitoring", color: "#8b5cf6", sortOrder: 3 },
      { value: "Closed", color: "#10b981", sortOrder: 4 },
      { value: "Occurred", color: "#ef4444", sortOrder: 5 },
    ],
    probability: [
      { value: "Very Low", color: "#10b981", sortOrder: 0 },
      { value: "Low", color: "#84cc16", sortOrder: 1 },
      { value: "Medium", color: "#f59e0b", sortOrder: 2 },
      { value: "High", color: "#f97316", sortOrder: 3 },
      { value: "Very High", color: "#ef4444", sortOrder: 4 },
    ],
    impact: [
      { value: "Negligible", color: "#10b981", sortOrder: 0 },
      { value: "Minor", color: "#84cc16", sortOrder: 1 },
      { value: "Moderate", color: "#f59e0b", sortOrder: 2 },
      { value: "Major", color: "#f97316", sortOrder: 3 },
      { value: "Catastrophic", color: "#ef4444", sortOrder: 4 },
    ],
    category: [
      { value: "Technical", color: "#3b82f6", sortOrder: 0 },
      { value: "Schedule", color: "#f59e0b", sortOrder: 1 },
      { value: "Cost", color: "#ef4444", sortOrder: 2 },
      { value: "Resource", color: "#8b5cf6", sortOrder: 3 },
      { value: "External", color: "#06b6d4", sortOrder: 4 },
      { value: "Organizational", color: "#10b981", sortOrder: 5 },
      { value: "Quality", color: "#f97316", sortOrder: 6 },
    ],
    response_strategy: [
      { value: "Avoid", color: "#ef4444", sortOrder: 0 },
      { value: "Mitigate", color: "#f97316", sortOrder: 1 },
      { value: "Transfer", color: "#8b5cf6", sortOrder: 2 },
      { value: "Accept", color: "#10b981", sortOrder: 3 },
      { value: "Escalate", color: "#6b7280", sortOrder: 4 },
    ],
  },
  requirements: {
    status: [
      { value: "Draft", color: "#6b7280", sortOrder: 0 },
      { value: "Under Review", color: "#3b82f6", sortOrder: 1 },
      { value: "Approved", color: "#10b981", sortOrder: 2 },
      { value: "In Development", color: "#f59e0b", sortOrder: 3 },
      { value: "Completed", color: "#8b5cf6", sortOrder: 4 },
      { value: "Rejected", color: "#ef4444", sortOrder: 5 },
    ],
    priority: [
      { value: "Must Have", color: "#ef4444", sortOrder: 0 },
      { value: "Should Have", color: "#f97316", sortOrder: 1 },
      { value: "Could Have", color: "#f59e0b", sortOrder: 2 },
      { value: "Won't Have", color: "#6b7280", sortOrder: 3 },
    ],
    type: [
      { value: "Functional", color: "#3b82f6", sortOrder: 0 },
      { value: "Non-Functional", color: "#8b5cf6", sortOrder: 1 },
      { value: "Business", color: "#10b981", sortOrder: 2 },
      { value: "Technical", color: "#06b6d4", sortOrder: 3 },
      { value: "Security", color: "#ef4444", sortOrder: 4 },
      { value: "Compliance", color: "#f97316", sortOrder: 5 },
    ],
  },
  deliverables: {
    status: [
      { value: "Not Started", color: "#6b7280", sortOrder: 0 },
      { value: "In Progress", color: "#3b82f6", sortOrder: 1 },
      { value: "Under Review", color: "#f59e0b", sortOrder: 2 },
      { value: "Accepted", color: "#10b981", sortOrder: 3 },
      { value: "Rejected", color: "#ef4444", sortOrder: 4 },
    ],
    type: [
      { value: "Document", color: "#3b82f6", sortOrder: 0 },
      { value: "Software", color: "#8b5cf6", sortOrder: 1 },
      { value: "Hardware", color: "#06b6d4", sortOrder: 2 },
      { value: "Report", color: "#f59e0b", sortOrder: 3 },
      { value: "Training", color: "#10b981", sortOrder: 4 },
    ],
  },
  change_requests: {
    status: [
      { value: "Draft", color: "#6b7280", sortOrder: 0 },
      { value: "Submitted", color: "#3b82f6", sortOrder: 1 },
      { value: "Under Review", color: "#f59e0b", sortOrder: 2 },
      { value: "Approved", color: "#10b981", sortOrder: 3 },
      { value: "Rejected", color: "#ef4444", sortOrder: 4 },
      { value: "Implemented", color: "#8b5cf6", sortOrder: 5 },
      { value: "Closed", color: "#9ca3af", sortOrder: 6 },
    ],
    impact: [
      { value: "Low", color: "#10b981", sortOrder: 0 },
      { value: "Medium", color: "#f59e0b", sortOrder: 1 },
      { value: "High", color: "#f97316", sortOrder: 2 },
      { value: "Critical", color: "#ef4444", sortOrder: 3 },
    ],
    type: [
      { value: "Scope", color: "#3b82f6", sortOrder: 0 },
      { value: "Schedule", color: "#f59e0b", sortOrder: 1 },
      { value: "Cost", color: "#ef4444", sortOrder: 2 },
      { value: "Quality", color: "#8b5cf6", sortOrder: 3 },
      { value: "Resource", color: "#06b6d4", sortOrder: 4 },
    ],
    priority: [
      { value: "Low", color: "#3b82f6", sortOrder: 0 },
      { value: "Medium", color: "#f59e0b", sortOrder: 1 },
      { value: "High", color: "#f97316", sortOrder: 2 },
      { value: "Critical", color: "#ef4444", sortOrder: 3 },
    ],
  },
  milestones: {
    status: [
      { value: "Planned", color: "#6b7280", sortOrder: 0 },
      { value: "In Progress", color: "#3b82f6", sortOrder: 1 },
      { value: "Achieved", color: "#10b981", sortOrder: 2 },
      { value: "Delayed", color: "#f97316", sortOrder: 3 },
      { value: "At Risk", color: "#ef4444", sortOrder: 4 },
      { value: "Cancelled", color: "#9ca3af", sortOrder: 5 },
    ],
  },
  budget: {
    category: [
      { value: "Labour", color: "#3b82f6", sortOrder: 0 },
      { value: "Materials", color: "#10b981", sortOrder: 1 },
      { value: "Equipment", color: "#f97316", sortOrder: 2 },
      { value: "Services", color: "#8b5cf6", sortOrder: 3 },
      { value: "Travel", color: "#06b6d4", sortOrder: 4 },
      { value: "Contingency", color: "#f59e0b", sortOrder: 5 },
    ],
  },
  stakeholders: {
    engagement_status: [
      { value: "Resistant", color: "#ef4444", sortOrder: 0 },
      { value: "Unaware", color: "#6b7280", sortOrder: 1 },
      { value: "Neutral", color: "#f59e0b", sortOrder: 2 },
      { value: "Supportive", color: "#10b981", sortOrder: 3 },
      { value: "Leading", color: "#3b82f6", sortOrder: 4 },
    ],
    communication_frequency: [
      { value: "Daily", color: "#3b82f6", sortOrder: 0 },
      { value: "Weekly", color: "#10b981", sortOrder: 1 },
      { value: "Bi-Weekly", color: "#8b5cf6", sortOrder: 2 },
      { value: "Monthly", color: "#f59e0b", sortOrder: 3 },
      { value: "Quarterly", color: "#f97316", sortOrder: 4 },
      { value: "As Needed", color: "#6b7280", sortOrder: 5 },
    ],
    communication_channel: [
      { value: "Email", color: "#3b82f6", sortOrder: 0 },
      { value: "Meeting", color: "#8b5cf6", sortOrder: 1 },
      { value: "Phone", color: "#10b981", sortOrder: 2 },
      { value: "Teams", color: "#6366f1", sortOrder: 3 },
      { value: "Slack", color: "#f97316", sortOrder: 4 },
      { value: "Report", color: "#f59e0b", sortOrder: 5 },
    ],
  },
  test_cases: {
    status: [
      { value: "Draft", color: "#6b7280", sortOrder: 0 },
      { value: "Ready", color: "#3b82f6", sortOrder: 1 },
      { value: "Passed", color: "#10b981", sortOrder: 2 },
      { value: "Failed", color: "#ef4444", sortOrder: 3 },
      { value: "Blocked", color: "#f97316", sortOrder: 4 },
    ],
    priority: [
      { value: "Critical", color: "#dc2626", sortOrder: 0 },
      { value: "High", color: "#f97316", sortOrder: 1 },
      { value: "Medium", color: "#f59e0b", sortOrder: 2 },
      { value: "Low", color: "#10b981", sortOrder: 3 },
    ],
  },
  assumptions: {
    status: [
      { value: "Active", color: "#3b82f6", sortOrder: 0 },
      { value: "Validated", color: "#10b981", sortOrder: 1 },
      { value: "Invalidated", color: "#ef4444", sortOrder: 2 },
      { value: "Realized", color: "#8b5cf6", sortOrder: 3 },
    ],
    impact: [
      { value: "Low", color: "#10b981", sortOrder: 0 },
      { value: "Medium", color: "#f59e0b", sortOrder: 1 },
      { value: "High", color: "#ef4444", sortOrder: 2 },
    ],
  },
  scope_items: {
    phase: [
      { value: "Explore", color: "#3b82f6", sortOrder: 0 },
      { value: "Prepare", color: "#8b5cf6", sortOrder: 1 },
      { value: "Realize", color: "#f59e0b", sortOrder: 2 },
      { value: "Deploy", color: "#f97316", sortOrder: 3 },
      { value: "Run", color: "#10b981", sortOrder: 4 },
    ],
    process_area: [
      { value: "Financial Management", color: "#3b82f6", sortOrder: 0 },
      { value: "Supply Chain", color: "#8b5cf6", sortOrder: 1 },
      { value: "Procurement", color: "#06b6d4", sortOrder: 2 },
      { value: "HR", color: "#10b981", sortOrder: 3 },
      { value: "Project Management", color: "#f59e0b", sortOrder: 4 },
      { value: "Sales", color: "#f97316", sortOrder: 5 },
      { value: "Customer Service", color: "#ef4444", sortOrder: 6 },
      { value: "Analytics", color: "#6366f1", sortOrder: 7 },
      { value: "Integration", color: "#ec4899", sortOrder: 8 },
      { value: "Security", color: "#dc2626", sortOrder: 9 },
      { value: "Other", color: "#6b7280", sortOrder: 10 },
    ],
    category: [
      { value: "Configuration", color: "#3b82f6", sortOrder: 0 },
      { value: "Development", color: "#8b5cf6", sortOrder: 1 },
      { value: "Data Migration", color: "#06b6d4", sortOrder: 2 },
      { value: "Integration", color: "#10b981", sortOrder: 3 },
      { value: "Testing", color: "#f59e0b", sortOrder: 4 },
      { value: "Training", color: "#f97316", sortOrder: 5 },
      { value: "Change Management", color: "#ef4444", sortOrder: 6 },
      { value: "Other", color: "#6b7280", sortOrder: 7 },
    ],
    status: [
      { value: "Active", color: "#3b82f6", sortOrder: 0 },
      { value: "In Scope", color: "#10b981", sortOrder: 1 },
      { value: "Out of Scope", color: "#ef4444", sortOrder: 2 },
      { value: "Deferred", color: "#f59e0b", sortOrder: 3 },
      { value: "Completed", color: "#8b5cf6", sortOrder: 4 },
    ],
    priority: [
      { value: "Critical", color: "#dc2626", sortOrder: 0 },
      { value: "High", color: "#f97316", sortOrder: 1 },
      { value: "Medium", color: "#f59e0b", sortOrder: 2 },
      { value: "Low", color: "#10b981", sortOrder: 3 },
    ],
  },
  wbs: {
    status: [
      { value: "Not Started", color: "#6b7280", sortOrder: 0 },
      { value: "In Progress", color: "#3b82f6", sortOrder: 1 },
      { value: "Complete", color: "#10b981", sortOrder: 2 },
      { value: "On Hold", color: "#f59e0b", sortOrder: 3 },
    ],
  },
  test_cases: {
    type: [
      { value: "Functional", color: "#3b82f6", sortOrder: 0 },
      { value: "Integration", color: "#8b5cf6", sortOrder: 1 },
      { value: "Regression", color: "#f59e0b", sortOrder: 2 },
      { value: "UAT", color: "#10b981", sortOrder: 3 },
      { value: "Performance", color: "#f97316", sortOrder: 4 },
      { value: "Security", color: "#ef4444", sortOrder: 5 },
      { value: "Smoke", color: "#06b6d4", sortOrder: 6 },
    ],
  },
  dependencies: {
    status: [
      { value: "Pending", color: "#6b7280", sortOrder: 0 },
      { value: "In Progress", color: "#3b82f6", sortOrder: 1 },
      { value: "Completed", color: "#10b981", sortOrder: 2 },
      { value: "Blocked", color: "#ef4444", sortOrder: 3 },
      { value: "At Risk", color: "#f97316", sortOrder: 4 },
      { value: "Cancelled", color: "#9ca3af", sortOrder: 5 },
    ],
  },
  meetings: {
    status: [
      { value: "Scheduled", color: "#3b82f6", sortOrder: 0 },
      { value: "In Progress", color: "#f59e0b", sortOrder: 1 },
      { value: "Completed", color: "#10b981", sortOrder: 2 },
      { value: "Cancelled", color: "#ef4444", sortOrder: 3 },
    ],
    decision_status: [
      { value: "Open", color: "#3b82f6", sortOrder: 0 },
      { value: "Implemented", color: "#10b981", sortOrder: 1 },
      { value: "Deferred", color: "#f59e0b", sortOrder: 2 },
      { value: "Cancelled", color: "#ef4444", sortOrder: 3 },
    ],
  },
};

export const dropdownRegistryRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number(), domain: z.string(), fieldKey: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const existing = await db
        .select()
        .from(dropdownRegistry)
        .where(
          and(
            eq(dropdownRegistry.projectId, input.projectId),
            eq(dropdownRegistry.domain, input.domain),
            eq(dropdownRegistry.fieldKey, input.fieldKey),
          )
        )
        .orderBy(asc(dropdownRegistry.sortOrder));

      if (existing.length === 0) {
        const seeds = SEED_DEFAULTS[input.domain]?.[input.fieldKey] ?? [];
        if (seeds.length > 0) {
          await db.insert(dropdownRegistry).values(
            seeds.map((s) => ({
              projectId: input.projectId,
              domain: input.domain,
              fieldKey: input.fieldKey,
              value: s.value,
              color: s.color ?? null,
              sortOrder: s.sortOrder,
              isDefault: true,
              isActive: true,
            }))
          );
          return db
            .select()
            .from(dropdownRegistry)
            .where(
              and(
                eq(dropdownRegistry.projectId, input.projectId),
                eq(dropdownRegistry.domain, input.domain),
                eq(dropdownRegistry.fieldKey, input.fieldKey),
              )
            )
            .orderBy(asc(dropdownRegistry.sortOrder));
        }
        return [];
      }
      return existing.filter((r) => r.isActive);
    }),

  listAll: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(dropdownRegistry)
        .where(eq(dropdownRegistry.projectId, input.projectId))
        .orderBy(
          asc(dropdownRegistry.domain),
          asc(dropdownRegistry.fieldKey),
          asc(dropdownRegistry.sortOrder)
        );
    }),

  add: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        domain: z.string(),
        fieldKey: z.string(),
        value: z.string().min(1),
        color: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [row] = await db
        .insert(dropdownRegistry)
        .values({
          projectId: input.projectId,
          domain: input.domain,
          fieldKey: input.fieldKey,
          value: input.value,
          color: input.color ?? null,
          sortOrder: input.sortOrder ?? 999,
          isDefault: false,
          isActive: true,
        })
        .$returningId();
      return row;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        value: z.string().min(1).optional(),
        color: z.string().nullable().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { id, ...updates } = input;
      const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
      if (Object.keys(filtered).length > 0) {
        await db.update(dropdownRegistry).set(filtered).where(eq(dropdownRegistry.id, id));
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(dropdownRegistry).where(eq(dropdownRegistry.id, input.id));
    }),

  reorder: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await Promise.all(
        input.ids.map((id, idx) =>
          db!.update(dropdownRegistry).set({ sortOrder: idx }).where(eq(dropdownRegistry.id, id))
        )
      );
    }),
});
