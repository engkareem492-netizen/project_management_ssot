import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getDb, createTask, getNextId } from "../db";
import { communicationPlanEntries, tasks, stakeholders } from "../../drizzle/schema";

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
