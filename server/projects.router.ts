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
    return await db.getAllProjects();
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to create a project',
        });
      }

      const hashedPassword = hashPassword(input.password);
      
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

      const hashedPassword = hashPassword(input.password);
      const valid = project.password === hashedPassword;

      return { valid };
    }),
});
