/**
 * Sidebar Badges Router
 * Returns counts for sidebar notification badges:
 * - Tasks: overdue (dueDate < today and not done)
 * - Issues: open (not closed/resolved)
 * - Dependencies: overdue (dueDate < today and not done)
 * - Risks: high-score risks (score >= 12)
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { tasks, issues, dependencies, risks } from "../../drizzle/schema";
import { eq, and, lt, ne, gte, isNotNull, sql } from "drizzle-orm";

const DONE_STATUSES = ["Completed", "Closed", "Solved", "Done", "Cancelled", "Approved", "Passed", "Resolved"];

export const sidebarBadgesRouter = router({
  counts: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const { projectId } = input;
      const dbConn = await getDb();
      if (!dbConn) return { tasks: 0, issues: 0, dependencies: 0, risks: 0 };

      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Overdue tasks: dueDate < today and status not in done list
      const taskRows = await dbConn
        .select({ id: tasks.id, dueDate: tasks.dueDate, currentStatus: tasks.currentStatus })
        .from(tasks)
        .where(and(eq(tasks.projectId, projectId), isNotNull(tasks.dueDate)));

      const overdueTasks = taskRows.filter(
        (t) =>
          t.dueDate &&
          t.dueDate < today &&
          !DONE_STATUSES.some((s) => (t.currentStatus || "").toLowerCase() === s.toLowerCase())
      ).length;

      // Open issues: status not in done list
      const issueRows = await dbConn
        .select({ id: issues.id, status: issues.status })
        .from(issues)
        .where(eq(issues.projectId, projectId));

      const openIssues = issueRows.filter(
        (i) => !DONE_STATUSES.some((s) => (i.status || "").toLowerCase() === s.toLowerCase())
      ).length;

      // Overdue dependencies: dueDate < today and status not done
      const depRows = await dbConn
        .select({ id: dependencies.id, dueDate: dependencies.dueDate, currentStatus: dependencies.currentStatus })
        .from(dependencies)
        .where(and(eq(dependencies.projectId, projectId), isNotNull(dependencies.dueDate)));

      const overdueDeps = depRows.filter(
        (d) =>
          d.dueDate &&
          d.dueDate < today &&
          !DONE_STATUSES.some((s) => (d.currentStatus || "").toLowerCase() === s.toLowerCase())
      ).length;

      // High-risk items: score >= 12
      const riskRows = await dbConn
        .select({ id: risks.id, score: risks.score })
        .from(risks)
        .where(eq(risks.projectId, projectId));

      const highRisks = riskRows.filter((r) => (r.score || 0) >= 12).length;

      return {
        tasks: overdueTasks,
        issues: openIssues,
        dependencies: overdueDeps,
        risks: highRisks,
      };
    }),
});
