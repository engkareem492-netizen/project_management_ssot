import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { projectTemplates } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import * as db from "../db";

export const projectTemplatesRouter = router({
  list: protectedProcedure
    .query(async () => {
      const dbc = await getDb();
      if (!dbc) return [];
      return dbc.select().from(projectTemplates).orderBy(desc(projectTemplates.createdAt));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) return null;
      const [item] = await dbc.select().from(projectTemplates).where(eq(projectTemplates.id, input.id));
      return item ?? null;
    }),

  // Capture current project structure as a template
  captureFromProject: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const dbc = await getDb();
      if (!dbc) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Gather project structure
      const [
        tasks,
        requirements,
        risks,
        milestones,
        ticketTypeList,
      ] = await Promise.all([
        db.getAllTasksSorted(input.projectId),
        db.getAllRequirementsSorted(input.projectId),
        db.getAllRisks ? db.getAllRisks(input.projectId) : [],
        db.getMilestones ? db.getMilestones(input.projectId) : [],
        db.getTicketTypes ? db.getTicketTypes(input.projectId) : [],
      ]);

      const snapshot = {
        tasks: tasks.map(t => ({
          description: t.description,
          taskGroup: t.taskGroup,
          priority: t.priority,
          status: t.currentStatus ?? t.status,
          manHours: t.manHours,
        })),
        requirements: requirements.map(r => ({
          description: r.description,
          type: r.type,
          category: r.category,
          priority: r.priority,
        })),
        risks: risks.map((r: any) => ({
          description: r.description,
          probability: r.probability,
          impact: r.impact,
          category: r.category,
        })),
        milestones: milestones.map((m: any) => ({
          name: m.name,
          description: m.description,
        })),
        ticketTypes: ticketTypeList.map((t: any) => ({
          name: t.name,
          description: t.description,
          responseTimeHours: t.responseTimeHours,
          resolutionTimeHours: t.resolutionTimeHours,
        })),
      };

      await dbc.insert(projectTemplates).values({
        name: input.name,
        description: input.description ?? null,
        createdBy: ctx.user.id,
        snapshot: JSON.stringify(snapshot),
      });

      const [created] = await dbc.select().from(projectTemplates)
        .orderBy(desc(projectTemplates.id)).limit(1);
      return created;
    }),

  // Stamp out a template into an existing (usually new) project
  applyToProject: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      projectId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [template] = await dbc.select().from(projectTemplates)
        .where(eq(projectTemplates.id, input.templateId));
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });

      const snapshot = JSON.parse(template.snapshot as string);
      const counts = { tasks: 0, requirements: 0, risks: 0, milestones: 0, ticketTypes: 0 };

      for (const t of (snapshot.tasks ?? [])) {
        const taskId = await db.getNextId("task", "T", input.projectId);
        await db.createTask({ ...t, projectId: input.projectId, taskId });
        counts.tasks++;
      }

      for (const r of (snapshot.requirements ?? [])) {
        const idCode = await db.getNextId("requirement", "Q", input.projectId);
        await db.createRequirement({ ...r, projectId: input.projectId, idCode });
        counts.requirements++;
      }

      // ticket types
      for (const tt of (snapshot.ticketTypes ?? [])) {
        if (db.createTaskType) {
          await db.createTaskType({ ...tt, projectId: input.projectId });
          counts.ticketTypes++;
        }
      }

      return { success: true, counts };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await dbc.update(projectTemplates).set(input.data).where(eq(projectTemplates.id, input.id));
      const [updated] = await dbc.select().from(projectTemplates).where(eq(projectTemplates.id, input.id));
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const dbc = await getDb();
      if (!dbc) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await dbc.delete(projectTemplates).where(eq(projectTemplates.id, input.id));
      return { success: true };
    }),
});
