import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { taskDependencies, tasks } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const taskDependenciesRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(taskDependencies)
        .where(eq(taskDependencies.projectId, input.projectId))
        .orderBy(desc(taskDependencies.createdAt));
    }),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      predecessorTaskId: z.string().min(1),
      successorTaskId: z.string().min(1),
      dependencyType: z.enum(["Finish-to-Start", "Start-to-Start", "Finish-to-Finish", "Start-to-Finish"]).optional(),
      lagDays: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Prevent self-dependency
      if (input.predecessorTaskId === input.successorTaskId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A task cannot depend on itself" });
      }
      // Check for duplicate
      const existing = await db.select().from(taskDependencies)
        .where(and(
          eq(taskDependencies.projectId, input.projectId),
          eq(taskDependencies.predecessorTaskId, input.predecessorTaskId),
          eq(taskDependencies.successorTaskId, input.successorTaskId),
        ));
      if (existing.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This dependency already exists" });
      }
      await db.insert(taskDependencies).values({
        projectId: input.projectId,
        predecessorTaskId: input.predecessorTaskId,
        successorTaskId: input.successorTaskId,
        dependencyType: input.dependencyType ?? "Finish-to-Start",
        lagDays: input.lagDays ?? 0,
      });
      const [created] = await db.select().from(taskDependencies)
        .where(and(
          eq(taskDependencies.projectId, input.projectId),
          eq(taskDependencies.predecessorTaskId, input.predecessorTaskId),
          eq(taskDependencies.successorTaskId, input.successorTaskId),
        ));
      return created;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(taskDependencies).where(eq(taskDependencies.id, input.id));
      return { success: true };
    }),

  // Get all tasks with their dependencies for Gantt chart rendering
  ganttData: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { tasks: [], dependencies: [] };
      const allTasks = await db.select().from(tasks)
        .where(eq(tasks.projectId, input.projectId))
        .orderBy(tasks.importedAt);
      const allDeps = await db.select().from(taskDependencies)
        .where(eq(taskDependencies.projectId, input.projectId));
      return { tasks: allTasks, dependencies: allDeps };
    }),
});
