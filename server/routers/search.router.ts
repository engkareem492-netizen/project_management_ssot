/**
 * Global Search Router
 * Searches across requirements, tasks, issues, dependencies, assumptions,
 * stakeholders, deliverables, knowledge base, and risks for a given project.
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  requirements,
  tasks,
  issues,
  dependencies,
  assumptions,
  stakeholders,
  deliverables,
  knowledgeBase,
  risks,
} from "../../drizzle/schema";
import { eq, and, or, like } from "drizzle-orm";

interface SearchResult {
  id: number;
  module: string;
  code: string;
  title: string;
  status?: string;
  path: string;
}

export const searchRouter = router({
  global: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        query: z.string().min(2).max(100),
      })
    )
    .query(async ({ input }): Promise<SearchResult[]> => {
      const { projectId, query } = input;
      const dbConn = await getDb();
      if (!dbConn) return [];

      const q = `%${query}%`;
      const results: SearchResult[] = [];

      // Requirements
      const reqs = await dbConn
        .select()
        .from(requirements)
        .where(
          and(
            eq(requirements.projectId, projectId),
            or(
              like(requirements.idCode, q),
              like(requirements.description, q),
              like(requirements.category, q),
              like(requirements.owner, q)
            )
          )
        )
        .limit(10);
      for (const r of reqs) {
        results.push({
          id: r.id,
          module: "requirements",
          code: r.idCode || "",
          title: r.description || r.idCode || "",
          status: r.status ?? undefined,
          path: "/requirements",
        });
      }

      // Tasks
      const taskRows = await dbConn
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.projectId, projectId),
            or(
              like(tasks.taskId, q),
              like(tasks.description, q),
              like(tasks.responsible, q)
            )
          )
        )
        .limit(10);
      for (const t of taskRows) {
        results.push({
          id: t.id,
          module: "tasks",
          code: t.taskId || "",
          title: t.description || t.taskId || "",
          status: t.currentStatus ?? undefined,
          path: "/tasks",
        });
      }

      // Issues
      const issueRows = await dbConn
        .select()
        .from(issues)
        .where(
          and(
            eq(issues.projectId, projectId),
            or(
              like(issues.issueId, q),
              like(issues.description, q),
              like(issues.owner, q)
            )
          )
        )
        .limit(10);
      for (const i of issueRows) {
        results.push({
          id: i.id,
          module: "issues",
          code: i.issueId || "",
          title: i.description || i.issueId || "",
          status: i.status ?? undefined,
          path: "/issues",
        });
      }

      // Dependencies
      const depRows = await dbConn
        .select()
        .from(dependencies)
        .where(
          and(
            eq(dependencies.projectId, projectId),
            or(
              like(dependencies.dependencyId, q),
              like(dependencies.description, q),
              like(dependencies.responsible, q)
            )
          )
        )
        .limit(5);
      for (const d of depRows) {
        results.push({
          id: d.id,
          module: "dependencies",
          code: d.dependencyId || "",
          title: d.description || d.dependencyId || "",
          status: d.currentStatus ?? undefined,
          path: "/dependencies",
        });
      }

      // Assumptions
      const asmRows = await dbConn
        .select()
        .from(assumptions)
        .where(
          and(
            eq(assumptions.projectId, projectId),
            or(
              like(assumptions.assumptionId, q),
              like(assumptions.description, q),
              like(assumptions.owner, q)
            )
          )
        )
        .limit(5);
      for (const a of asmRows) {
        results.push({
          id: a.id,
          module: "assumptions",
          code: a.assumptionId || "",
          title: a.description || a.assumptionId || "",
          status: a.status ?? undefined,
          path: "/assumptions",
        });
      }

      // Stakeholders
      const stakeRows = await dbConn
        .select()
        .from(stakeholders)
        .where(
          and(
            eq(stakeholders.projectId, projectId),
            or(
              like(stakeholders.fullName, q),
              like(stakeholders.email, q),
              like(stakeholders.position, q),
              like(stakeholders.role, q)
            )
          )
        )
        .limit(5);
      for (const s of stakeRows) {
        results.push({
          id: s.id,
          module: "stakeholders",
          code: s.email || "",
          title: s.fullName || "",
          status: s.role ?? undefined,
          path: "/stakeholders",
        });
      }

      // Deliverables
      const delivRows = await dbConn
        .select()
        .from(deliverables)
        .where(
          and(
            eq(deliverables.projectId, projectId),
            or(
              like(deliverables.deliverableId, q),
              like(deliverables.description, q)
            )
          )
        )
        .limit(5);
      for (const d of delivRows) {
        results.push({
          id: d.id,
          module: "deliverables",
          code: d.deliverableId || "",
          title: d.description || d.deliverableId || "",
          status: d.status ?? undefined,
          path: "/deliverables",
        });
      }

      // Knowledge Base
      const kbRows = await dbConn
        .select()
        .from(knowledgeBase)
        .where(
          and(
            eq(knowledgeBase.projectId, projectId),
            or(
              like(knowledgeBase.title, q),
              like(knowledgeBase.description, q)
            )
          )
        )
        .limit(5);
      for (const k of kbRows) {
        results.push({
          id: k.id,
          module: "knowledgeBase",
          code: String(k.id),
          title: k.title || "",
          status: undefined,
          path: "/knowledge-base",
        });
      }

      // Risks
      const riskRows = await dbConn
        .select()
        .from(risks)
        .where(
          and(
            eq(risks.projectId, projectId),
            or(
              like(risks.riskId, q),
              like(risks.title, q)
            )
          )
        )
        .limit(5);
      for (const r of riskRows) {
        results.push({
          id: r.id,
          module: "risks",
          code: r.riskId || "",
          title: r.title || "",
          status: undefined,
          path: "/risk-register",
        });
      }

      return results;
    }),
});
