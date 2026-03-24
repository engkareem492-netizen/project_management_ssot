import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

import { TRPCError } from "@trpc/server";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export const projectsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to view projects',
      });
    }
    // Master user sees all projects
    if (ctx.user.role === 'master') {
      return await db.getAllProjects();
    }
    return await db.getProjectsByUser(ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      password: z.string().optional(), // password is now optional
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to create a project',
        });
      }

      const hashedPassword = input.password ? hashPassword(input.password) : null;
      
      return await db.createProject({
        name: input.name,
        description: input.description || null,
        password: hashedPassword,
        createdBy: ctx.user.id,
      });
    }),

  verify: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const project = await db.getProjectById(input.projectId);
      
      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // If project has no password, any password attempt is invalid
      if (!project.password) {
        return { valid: false };
      }

      const hashedPassword = hashPassword(input.password);
      const valid = project.password === hashedPassword;

      return { valid };
    }),

  // Check if project requires a password
  hasPassword: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const project = await db.getProjectById(input.projectId);
      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }
      return { hasPassword: !!project.password };
    }),

  // Set, change, or remove password (creator only)
  setPassword: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      newPassword: z.string().nullable(), // null = remove password
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' });
      }

      const project = await db.getProjectById(input.projectId);
      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      if (project.createdBy !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the project creator can manage the password',
        });
      }

      const hashedPassword = input.newPassword ? hashPassword(input.newPassword) : null;
      await db.updateProjectPassword(input.projectId, hashedPassword);

      return { success: true, hasPassword: !!hashedPassword };
    }),

  resetPassword: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      newPassword: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to reset password',
        });
      }

      const project = await db.getProjectById(input.projectId);
      
      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Only allow the project creator to reset password
      if (project.createdBy !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the project creator can reset the password',
        });
      }

      const hashedPassword = hashPassword(input.newPassword);
      await db.updateProjectPassword(input.projectId, hashedPassword);

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({
      projectId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to delete a project',
        });
      }

      const project = await db.getProjectById(input.projectId);
      
      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Only allow the project creator to delete
      if (project.createdBy !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the project creator can delete the project',
        });
      }

      await db.deleteProject(input.projectId);

      return { success: true };
    }),

  exportData: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      password: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to export project data',
        });
      }

      const project = await db.getProjectById(input.projectId);
      
      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Only verify password if the project has one
      if (project.password) {
        if (!input.password) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Password required for this project',
          });
        }
        const hashedPassword = hashPassword(input.password);
        if (project.password !== hashedPassword) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Invalid password',
          });
        }
      }

      const data = await db.exportProjectData(input.projectId);
      return data;
    }),

  update: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string().optional(),
      description: z.string().optional().nullable(),
      programName: z.string().optional().nullable(),
      portfolioName: z.string().optional().nullable(),
      programId: z.number().optional().nullable(),
      portfolioId: z.number().optional().nullable(),
      logoUrl: z.string().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' });
      }
      const { projectId, ...data } = input;
      await db.updateProject(projectId, data);
      return { success: true };
    }),

  importData: protectedProcedure
    .input(z.object({
      targetProjectId: z.number(),
      sourceData: z.any(),
      selectedEntities: z.any(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to import project data',
        });
      }

      await db.importProjectData(input.targetProjectId, input.sourceData, input.selectedEntities);
      return { success: true };
    }),
});
