import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import {
  teamCharter, stakeholderSkills, stakeholderSuccession,
  resourceCalendar, resourceBreakdownStructure, resourceManagementPlan
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const teamCharterRouter = router({
  // ── Team Charter ───────────────────────────────────────────────────────────
  get: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [tc] = await db.select().from(teamCharter).where(eq(teamCharter.projectId, input.projectId));
      return tc ?? null;
    }),

  upsert: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      coreValues: z.array(z.string()).optional(),
      communicationProtocol: z.string().optional(),
      meetingCadence: z.string().optional(),
      decisionMakingAuthority: z.string().optional(),
      groundRules: z.array(z.string()).optional(),
      violations: z.array(z.object({ violation: z.string(), consequence: z.string() })).optional(),
      responsibilityMatrix: z.string().optional(),
      conflictResolution: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const { projectId, ...rest } = input;
      const [existing] = await db.select({ id: teamCharter.id }).from(teamCharter).where(eq(teamCharter.projectId, projectId));
      if (existing) {
        await db.update(teamCharter).set(rest as any).where(eq(teamCharter.projectId, projectId));
      } else {
        await db.insert(teamCharter).values({ projectId, ...rest } as any);
      }
      const [updated] = await db.select().from(teamCharter).where(eq(teamCharter.projectId, projectId));
      return updated;
    }),

  // ── Stakeholder Skills ─────────────────────────────────────────────────────
  listSkills: protectedProcedure
    .input(z.object({ projectId: z.number(), stakeholderId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      if (input.stakeholderId) {
        return db.select().from(stakeholderSkills)
          .where(and(eq(stakeholderSkills.projectId, input.projectId), eq(stakeholderSkills.stakeholderId, input.stakeholderId)));
      }
      return db.select().from(stakeholderSkills).where(eq(stakeholderSkills.projectId, input.projectId));
    }),

  addSkill: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      stakeholderId: z.number(),
      skillName: z.string(),
      category: z.string().optional(),
      proficiencyLevel: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]).optional(),
      developmentPlanNote: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      await db.insert(stakeholderSkills).values(input as any);
      return { success: true };
    }),

  updateSkill: protectedProcedure
    .input(z.object({
      id: z.number(),
      skillName: z.string().optional(),
      category: z.string().optional(),
      proficiencyLevel: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]).optional(),
      developmentPlanNote: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const { id, ...rest } = input;
      await db.update(stakeholderSkills).set(rest as any).where(eq(stakeholderSkills.id, id));
      return { success: true };
    }),

  deleteSkill: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      await db.delete(stakeholderSkills).where(eq(stakeholderSkills.id, input.id));
      return { success: true };
    }),

  // ── Succession / Delegation ────────────────────────────────────────────────
  getSuccession: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(stakeholderSuccession).where(eq(stakeholderSuccession.projectId, input.projectId));
    }),

  upsertSuccession: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      stakeholderId: z.number(),
      requiresSuccessionPlan: z.boolean().optional(),
      requiresDelegation: z.boolean().optional(),
      successorId: z.number().optional(),
      successorName: z.string().optional(),
      delegateName: z.string().optional(),
      delegateId: z.number().optional(),
      successionNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const { stakeholderId, projectId, ...rest } = input;
      const [existing] = await db.select({ id: stakeholderSuccession.id }).from(stakeholderSuccession)
        .where(eq(stakeholderSuccession.stakeholderId, stakeholderId));
      if (existing) {
        await db.update(stakeholderSuccession).set(rest as any).where(eq(stakeholderSuccession.stakeholderId, stakeholderId));
      } else {
        await db.insert(stakeholderSuccession).values({ stakeholderId, projectId, ...rest } as any);
      }
      return { success: true };
    }),

  // ── Resource Calendar ──────────────────────────────────────────────────────
  listCalendar: protectedProcedure
    .input(z.object({ projectId: z.number(), stakeholderId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      if (input.stakeholderId) {
        return db.select().from(resourceCalendar)
          .where(and(eq(resourceCalendar.projectId, input.projectId), eq(resourceCalendar.stakeholderId, input.stakeholderId)));
      }
      return db.select().from(resourceCalendar).where(eq(resourceCalendar.projectId, input.projectId));
    }),

  addCalendarEntry: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      stakeholderId: z.number(),
      entryDate: z.string(),
      availabilityPct: z.number().optional(),
      type: z.enum(["Working", "Leave", "Holiday", "Training", "Partial"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const { entryDate, ...rest } = input;
      await db.insert(resourceCalendar).values({ ...rest, entryDate: new Date(entryDate) } as any);
      return { success: true };
    }),

  deleteCalendarEntry: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      await db.delete(resourceCalendar).where(eq(resourceCalendar.id, input.id));
      return { success: true };
    }),

  // ── Resource Breakdown Structure ───────────────────────────────────────────
  listRBS: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(resourceBreakdownStructure)
        .where(eq(resourceBreakdownStructure.projectId, input.projectId))
        .orderBy(resourceBreakdownStructure.sortOrder);
    }),

  createRBSItem: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      parentId: z.number().optional(),
      code: z.string().optional(),
      name: z.string(),
      type: z.enum(["Human", "Material", "Equipment", "Financial", "Other"]).optional(),
      description: z.string().optional(),
      unit: z.string().optional(),
      estimatedQuantity: z.string().optional(),
      unitCost: z.string().optional(),
      level: z.number().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      await db.insert(resourceBreakdownStructure).values(input as any);
      return { success: true };
    }),

  updateRBSItem: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      type: z.enum(["Human", "Material", "Equipment", "Financial", "Other"]).optional(),
      description: z.string().optional(),
      unit: z.string().optional(),
      estimatedQuantity: z.string().optional(),
      unitCost: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const { id, ...rest } = input;
      await db.update(resourceBreakdownStructure).set(rest as any).where(eq(resourceBreakdownStructure.id, id));
      return { success: true };
    }),

  deleteRBSItem: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      await db.delete(resourceBreakdownStructure).where(eq(resourceBreakdownStructure.id, input.id));
      return { success: true };
    }),

  // ── Resource Management Plan ───────────────────────────────────────────────
  getResourcePlan: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [plan] = await db.select().from(resourceManagementPlan).where(eq(resourceManagementPlan.projectId, input.projectId));
      return plan ?? null;
    }),

  upsertResourcePlan: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      acquisitionStrategy: z.string().optional(),
      releaseStrategy: z.string().optional(),
      trainingNeeds: z.string().optional(),
      recognitionRewards: z.string().optional(),
      complianceRequirements: z.string().optional(),
      safetyConsiderations: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const { projectId, ...rest } = input;
      const [existing] = await db.select({ id: resourceManagementPlan.id }).from(resourceManagementPlan)
        .where(eq(resourceManagementPlan.projectId, projectId));
      if (existing) {
        await db.update(resourceManagementPlan).set(rest as any).where(eq(resourceManagementPlan.projectId, projectId));
      } else {
        await db.insert(resourceManagementPlan).values({ projectId, ...rest } as any);
      }
      return { success: true };
    }),
});
