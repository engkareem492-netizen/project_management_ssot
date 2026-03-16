import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getDb, createTask, getNextId } from "../db";
import { communicationPlanEntries, tasks, stakeholders, commPlanItems, commPlanInputItems } from "../../drizzle/schema";

// ---------------------------------------------------------------------------
// Frequency → recurring task mapping
// ---------------------------------------------------------------------------
const FREQ_TO_RECURRING: Record<string, "daily" | "weekly" | "monthly"> = {
  Daily: "daily",
  Weekly: "weekly",
  "Bi-weekly": "weekly",
  Monthly: "monthly",
  Quarterly: "monthly",
  "As needed": "monthly",
  "Ad hoc": "monthly",
};

const FREQ_TO_INTERVAL: Record<string, number> = {
  Daily: 1,
  Weekly: 1,
  "Bi-weekly": 2,
  Monthly: 1,
  Quarterly: 3,
  "As needed": 1,
  "Ad hoc": 1,
};

// ---------------------------------------------------------------------------
// Helper: build task description from comm plan entry
// ---------------------------------------------------------------------------
function buildTaskDescription(opts: {
  targetType?: string | null;
  targetValue?: string | null;
  targetName?: string | null;
  frequency?: string | null;
  preferredMethods?: string[];
}): string {
  const { targetType, targetName, targetValue, frequency, preferredMethods } = opts;
  const subject =
    targetName ??
    (targetType === "role" ? `Role: ${targetValue}` :
     targetType === "job"  ? `Job: ${targetValue}`  :
     targetValue ?? "Stakeholder");
  const via = preferredMethods && preferredMethods.length > 0 ? ` via ${preferredMethods.join(", ")}` : "";
  const freq = frequency ? ` (${frequency})` : "";
  return `Communication with ${subject}${via}${freq}`;
}

// ---------------------------------------------------------------------------
// Helper: upsert the linked recurring task for a comm plan entry
// ---------------------------------------------------------------------------
async function upsertLinkedTask(opts: {
  projectId: number;
  commPlanEntryId: number;
  targetType?: string | null;
  targetValue?: string | null;
  targetName?: string | null;
  frequency?: string | null;
  preferredMethods?: string[];
  responsibleStakeholderId?: number | null;
  responsibleName?: string | null;
}) {
  const db = await getDb();
  if (!db) return;

  const {
    projectId,
    commPlanEntryId,
    targetType,
    targetValue,
    targetName,
    frequency,
    preferredMethods,
    responsibleStakeholderId,
    responsibleName,
  } = opts;

  const description = buildTaskDescription({ targetType, targetValue, targetName, frequency, preferredMethods });
  const recurringType = frequency ? (FREQ_TO_RECURRING[frequency] ?? "weekly") : "weekly";
  const recurringInterval = frequency ? (FREQ_TO_INTERVAL[frequency] ?? 1) : 1;

  // Check if a linked task already exists for this comm plan entry
  const existing = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.projectId, projectId),
        eq(tasks.communicationStakeholderId, commPlanEntryId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update the existing task
    await db.update(tasks).set({
      description,
      recurringType,
      recurringInterval,
      responsibleId: responsibleStakeholderId ?? null,
      responsible: responsibleName ?? null,
    } as any).where(eq(tasks.id, existing[0].id));
  } else {
    // Create a new recurring task
    const taskId = await getNextId("task", "T", projectId);
    await createTask({
      projectId,
      taskId,
      description,
      recurringType,
      recurringInterval,
      status: "Open",
      responsibleId: responsibleStakeholderId ?? undefined,
      responsible: responsibleName ?? undefined,
      communicationStakeholderId: commPlanEntryId,
    } as any);
  }
}

// ---------------------------------------------------------------------------
// Helper: resolve stakeholder name from id
// ---------------------------------------------------------------------------
async function resolveStakeholderName(id: number | null | undefined): Promise<string | null> {
  if (!id) return null;
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(stakeholders).where(eq(stakeholders.id, id)).limit(1);
  return rows[0]?.fullName ?? null;
}

// ---------------------------------------------------------------------------
// Helper: resolve target display name (for stakeholder targetType)
// ---------------------------------------------------------------------------
async function resolveTargetName(opts: {
  targetType?: string | null;
  targetValue?: string | null;
  stakeholderId?: number | null;
}): Promise<string | null> {
  if (opts.targetType === "stakeholder") {
    const sid = opts.stakeholderId ?? (opts.targetValue ? Number(opts.targetValue) : null);
    return sid ? await resolveStakeholderName(sid) : null;
  }
  return opts.targetValue ?? null;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
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
      targetType: z.enum(["stakeholder", "role", "job"]).optional(),
      targetValue: z.string().optional(),
      stakeholderId: z.number().optional(),
      role: z.string().optional(),
      informationNeeded: z.string().optional(),
      preferredMethods: z.array(z.string()).optional(),
      frequency: z.string().optional(),
      textNote: z.string().optional(),
      escalationProcedures: z.string().optional(),
      responsibleStakeholderId: z.number().optional(),
      responsible: z.string().optional(),
      acknowledgmentNeeded: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const { projectId, ...rest } = input;

      // Insert the comm plan entry
      const result = await db.insert(communicationPlanEntries).values({ projectId, ...rest });
      const entryId: number = (result as any)[0]?.insertId ?? (result as any).insertId;

      const rows = await db
        .select()
        .from(communicationPlanEntries)
        .where(eq(communicationPlanEntries.id, entryId))
        .limit(1);
      const entry = rows[0];

      // Auto-create recurring task if frequency is set
      if (input.frequency && input.frequency !== "As needed" && input.frequency !== "Ad hoc") {
        const targetName = await resolveTargetName({
          targetType: input.targetType,
          targetValue: input.targetValue,
          stakeholderId: input.stakeholderId,
        });
        const responsibleName = input.responsible ?? await resolveStakeholderName(input.responsibleStakeholderId ?? null);
        await upsertLinkedTask({
          projectId,
          commPlanEntryId: entryId,
          targetType: input.targetType,
          targetValue: input.targetValue,
          targetName,
          frequency: input.frequency,
          preferredMethods: input.preferredMethods ?? [],
          responsibleStakeholderId: input.responsibleStakeholderId ?? null,
          responsibleName,
        });
      }

      return entry;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        targetType: z.enum(["stakeholder", "role", "job"]).nullable().optional(),
        targetValue: z.string().nullable().optional(),
        stakeholderId: z.number().nullable().optional(),
        role: z.string().nullable().optional(),
        informationNeeded: z.string().optional(),
        preferredMethods: z.array(z.string()).optional(),
        frequency: z.string().optional(),
        textNote: z.string().optional(),
        escalationProcedures: z.string().optional(),
        responsibleStakeholderId: z.number().nullable().optional(),
        responsible: z.string().nullable().optional(),
        acknowledgmentNeeded: z.boolean().nullable().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      await db
        .update(communicationPlanEntries)
        .set(input.data as any)
        .where(eq(communicationPlanEntries.id, input.id));

      const rows = await db
        .select()
        .from(communicationPlanEntries)
        .where(eq(communicationPlanEntries.id, input.id))
        .limit(1);
      const entry = rows[0];

      // Upsert linked recurring task when frequency is set
      const freq = input.data.frequency ?? entry?.frequency;
      if (freq) {
        const targetType = input.data.targetType ?? entry?.targetType;
        const targetValue = input.data.targetValue ?? entry?.targetValue;
        const stakeholderId = input.data.stakeholderId ?? entry?.stakeholderId;
        const responsibleId = input.data.responsibleStakeholderId ?? entry?.responsibleStakeholderId;
        const responsibleName = input.data.responsible ?? await resolveStakeholderName(responsibleId ?? null);
        const targetName = await resolveTargetName({ targetType, targetValue, stakeholderId });
        const projectId = entry?.projectId;
        if (projectId) {
          await upsertLinkedTask({
            projectId,
            commPlanEntryId: input.id,
            targetType,
            targetValue,
            targetName,
            frequency: freq,
            preferredMethods: input.data.preferredMethods ?? (entry?.preferredMethods as string[] ?? []),
            responsibleStakeholderId: responsibleId ?? null,
            responsibleName,
          });
        }
      }

      return entry;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Also remove the linked recurring task if it exists
      await db
        .delete(tasks)
        .where(eq(tasks.communicationStakeholderId, input.id));

      await db
        .delete(communicationPlanEntries)
        .where(eq(communicationPlanEntries.id, input.id));

      return { success: true };
    }),

  // ─── Sync: merge By Role + By Position plans into each stakeholder entry ───
  syncFromRoleAndPosition: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { inArray } = await import("drizzle-orm");

      // Load all entries for this project
      const allEntries = await db
        .select()
        .from(communicationPlanEntries)
        .where(eq(communicationPlanEntries.projectId, input.projectId));

      let stakeholderEntries = allEntries.filter(e => e.targetType === "stakeholder");
      const roleEntries = allEntries.filter(e => e.targetType === "role");
      const jobEntries = allEntries.filter(e => e.targetType === "job");

      // If there are no role/job plans at all, nothing to sync
      if (roleEntries.length === 0 && jobEntries.length === 0) return { synced: 0, itemsAdded: 0, created: 0 };

      // Load all stakeholders for this project
      const projectStakeholders = await db
        .select()
        .from(stakeholders)
        .where(eq(stakeholders.projectId, input.projectId));

      const stakeholderMap = new Map(projectStakeholders.map(s => [s.id, s]));

      // ── Auto-create missing stakeholder cards ──────────────────────────────
      // Build set of stakeholder IDs that already have a card
      const existingCardSids = new Set(
        stakeholderEntries
          .map(e => e.stakeholderId ?? (e.targetValue ? Number(e.targetValue) : null))
          .filter((id): id is number => !!id)
      );

      let created = 0;
      for (const s of projectStakeholders) {
        if (existingCardSids.has(s.id)) continue;

        // Check if this stakeholder matches any role or job plan
        const hasRoleMatch = roleEntries.some(re =>
          re.targetValue && s.role &&
          re.targetValue.trim().toLowerCase() === s.role.trim().toLowerCase()
        );
        const hasJobMatch = jobEntries.some(je =>
          je.targetValue && s.job &&
          je.targetValue.trim().toLowerCase() === s.job.trim().toLowerCase()
        );

        if (!hasRoleMatch && !hasJobMatch) continue;

        // Create a new stakeholder card seeded from the stakeholder's own comm fields
        const insertResult = await db.insert(communicationPlanEntries).values({
          projectId: input.projectId,
          stakeholderId: s.id,
          targetType: "stakeholder",
          targetValue: String(s.id),
          role: s.role ?? undefined,
          preferredMethods: s.communicationChannel ? [s.communicationChannel] : [],
          frequency: s.communicationFrequency ?? undefined,
          textNote: s.communicationMessage ?? undefined,
          responsible: s.communicationResponsible ?? undefined,
          responsibleStakeholderId: s.communicationResponsibleId ?? undefined,
        });
        const newEntryId: number = (insertResult as any)[0]?.insertId ?? (insertResult as any).insertId;

        // Auto-create recurring task if frequency is set
        if (s.communicationFrequency && s.communicationFrequency !== "As needed" && s.communicationFrequency !== "Ad hoc") {
          const responsibleName = s.communicationResponsible ?? await resolveStakeholderName(s.communicationResponsibleId ?? null);
          await upsertLinkedTask({
            projectId: input.projectId,
            commPlanEntryId: newEntryId,
            targetType: "stakeholder",
            targetValue: String(s.id),
            targetName: s.fullName,
            frequency: s.communicationFrequency,
            preferredMethods: s.communicationChannel ? [s.communicationChannel] : [],
            responsibleStakeholderId: s.communicationResponsibleId ?? null,
            responsibleName,
          });
        }

        existingCardSids.add(s.id);
        created++;
      }

      // Reload stakeholder entries to include the newly created ones
      if (created > 0) {
        const refreshed = await db
          .select()
          .from(communicationPlanEntries)
          .where(eq(communicationPlanEntries.projectId, input.projectId));
        stakeholderEntries = refreshed.filter(e => e.targetType === "stakeholder");
      }

      // Load all commPlanItems and commPlanInputItems for role and job entries
      const roleJobEntryIds = [...roleEntries, ...jobEntries].map(e => e.id);
      const sourceItems = roleJobEntryIds.length > 0
        ? await db.select().from(commPlanItems).where(inArray(commPlanItems.entryId, roleJobEntryIds))
        : [];
      const sourceInputItems = roleJobEntryIds.length > 0
        ? await db.select().from(commPlanInputItems).where(inArray(commPlanInputItems.entryId, roleJobEntryIds))
        : [];

      let synced = 0;
      let itemsAdded = 0;

      for (const entry of stakeholderEntries) {
        const sid = entry.stakeholderId ?? (entry.targetValue ? Number(entry.targetValue) : null);
        if (!sid) continue;
        const stakeholder = stakeholderMap.get(sid);
        if (!stakeholder) continue;

        // Find matching role entries (match stakeholder.role to entry.targetValue)
        const matchingRoleEntries = roleEntries.filter(re =>
          re.targetValue && stakeholder.role &&
          re.targetValue.trim().toLowerCase() === stakeholder.role.trim().toLowerCase()
        );

        // Find matching job/position entries (match stakeholder.job to entry.targetValue)
        const matchingJobEntries = jobEntries.filter(je =>
          je.targetValue && stakeholder.job &&
          je.targetValue.trim().toLowerCase() === stakeholder.job.trim().toLowerCase()
        );

        const matchingEntries = [...matchingRoleEntries, ...matchingJobEntries];
        if (matchingEntries.length === 0) continue;

        // Get existing items for this stakeholder entry to avoid duplicates
        const existingItems = await db
          .select()
          .from(commPlanItems)
          .where(eq(commPlanItems.entryId, entry.id));
        const existingDescriptions = new Set(
          existingItems.map(i => i.description?.trim().toLowerCase()).filter(Boolean)
        );

        const existingInputItems = await db
          .select()
          .from(commPlanInputItems)
          .where(eq(commPlanInputItems.entryId, entry.id));
        const existingInputDescriptions = new Set(
          existingInputItems.map(i => i.description?.trim().toLowerCase()).filter(Boolean)
        );

        for (const matchEntry of matchingEntries) {
          // Copy commPlanItems
          const itemsToCopy = sourceItems.filter(i => i.entryId === matchEntry.id);
          for (const item of itemsToCopy) {
            const desc = item.description?.trim().toLowerCase();
            if (desc && existingDescriptions.has(desc)) continue;
            await db.insert(commPlanItems).values({
              entryId: entry.id,
              projectId: input.projectId,
              description: item.description,
              commType: item.commType,
              periodic: item.periodic ?? undefined,
              sequence: item.sequence,
            });
            if (desc) existingDescriptions.add(desc);
            itemsAdded++;
          }

          // Merge preferredMethods (union)
          const srcMethods: string[] = (matchEntry.preferredMethods as string[]) ?? [];
          const curMethods: string[] = (entry.preferredMethods as string[]) ?? [];
          const merged = Array.from(new Set([...curMethods, ...srcMethods]));
          if (merged.length !== curMethods.length) {
            await db
              .update(communicationPlanEntries)
              .set({ preferredMethods: merged })
              .where(eq(communicationPlanEntries.id, entry.id));
          }

          // Copy commPlanInputItems
          const inputItemsToCopy = sourceInputItems.filter(i => i.entryId === matchEntry.id);
          for (const item of inputItemsToCopy) {
            const desc = item.description?.trim().toLowerCase();
            if (desc && existingInputDescriptions.has(desc)) continue;
            await db.insert(commPlanInputItems).values({
              entryId: entry.id,
              projectId: input.projectId,
              description: item.description,
              sequence: item.sequence,
            });
            if (desc) existingInputDescriptions.add(desc);
          }
        }
        synced++;
      }

      return { synced, itemsAdded, created };
    }),

  // Bulk import from stakeholder communication fields
  importFromStakeholders: protectedProcedure
    .input(z.object({ projectId: z.number(), stakeholderIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { inArray } = await import("drizzle-orm");
      const rows = await db
        .select()
        .from(stakeholders)
        .where(inArray(stakeholders.id, input.stakeholderIds));

      let imported = 0;
      for (const s of rows) {
        const insertResult = await db.insert(communicationPlanEntries).values({
          projectId: input.projectId,
          stakeholderId: s.id,
          targetType: "stakeholder",
          targetValue: String(s.id),
          role: s.role ?? undefined,
          preferredMethods: s.communicationChannel ? [s.communicationChannel] : [],
          frequency: s.communicationFrequency ?? undefined,
          textNote: s.communicationMessage ?? undefined,
          responsible: s.communicationResponsible ?? undefined,
          responsibleStakeholderId: s.communicationResponsibleId ?? undefined,
        });
        const entryId: number = (insertResult as any)[0]?.insertId ?? (insertResult as any).insertId;

        // Auto-create recurring task if frequency is set
        if (s.communicationFrequency && s.communicationFrequency !== "As needed" && s.communicationFrequency !== "Ad hoc") {
          const responsibleName = s.communicationResponsible ?? await resolveStakeholderName(s.communicationResponsibleId ?? null);
          await upsertLinkedTask({
            projectId: input.projectId,
            commPlanEntryId: entryId,
            targetType: "stakeholder",
            targetValue: String(s.id),
            targetName: s.fullName,
            frequency: s.communicationFrequency,
            preferredMethods: s.communicationChannel ? [s.communicationChannel] : [],
            responsibleStakeholderId: s.communicationResponsibleId ?? null,
            responsibleName,
          });
        }
        imported++;
      }
      return { imported };
    }),
});
