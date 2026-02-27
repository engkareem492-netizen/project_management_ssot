import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { requirements, tasks, issues, testCases, changeRequests, decisions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const traceabilityRouter = router({
  // Full traceability matrix: for each requirement, show linked tasks, issues, test cases, CRs, decisions
  matrix: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const [allReqs, allTasks, allIssues, allTests, allCRs, allDecisions] = await Promise.all([
        db.select().from(requirements).where(eq(requirements.projectId, input.projectId)),
        db.select().from(tasks).where(eq(tasks.projectId, input.projectId)),
        db.select().from(issues).where(eq(issues.projectId, input.projectId)),
        db.select().from(testCases).where(eq(testCases.projectId, input.projectId)),
        db.select().from(changeRequests).where(eq(changeRequests.projectId, input.projectId)),
        db.select().from(decisions).where(eq(decisions.projectId, input.projectId)),
      ]);

      return allReqs.map((req) => {
        const linkedTasks = allTasks.filter((t) => t.requirementId === req.idCode);
        const linkedIssues = allIssues.filter((i) => i.requirementId === req.idCode);
        const linkedTests = allTests.filter((tc) => tc.requirementId === req.idCode);
        const linkedCRs = allCRs.filter((cr) => cr.requirementId === req.idCode);
        const linkedDecisions = allDecisions.filter((d) => d.requirementId === req.idCode);

        const testPassed = linkedTests.filter((t) => t.status === "Passed").length;
        const testFailed = linkedTests.filter((t) => t.status === "Failed").length;
        const testTotal = linkedTests.length;
        const testCoverage = testTotal > 0 ? Math.round((testPassed / testTotal) * 100) : 0;

        const openIssues = linkedIssues.filter((i) => i.status?.toLowerCase() !== "closed").length;
        const openTasks = linkedTasks.filter((t) => t.status?.toLowerCase() !== "done" && t.status?.toLowerCase() !== "completed").length;

        return {
          requirement: req,
          tasks: linkedTasks.map((t) => ({ taskId: t.taskId, description: t.description, status: t.status, priority: t.priority })),
          issues: linkedIssues.map((i) => ({ issueId: i.issueId, description: i.description, status: i.status, priority: i.priority })),
          testCases: linkedTests.map((tc) => ({ testId: tc.testId, title: tc.title, status: tc.status, priority: tc.priority })),
          changeRequests: linkedCRs.map((cr) => ({ crId: cr.crId, title: cr.title, status: cr.status, priority: cr.priority })),
          decisions: linkedDecisions.map((d) => ({ decisionId: d.decisionId, title: d.title, status: d.status })),
          summary: {
            taskCount: linkedTasks.length,
            openTasks,
            issueCount: linkedIssues.length,
            openIssues,
            testTotal,
            testPassed,
            testFailed,
            testCoverage,
            crCount: linkedCRs.length,
            decisionCount: linkedDecisions.length,
          },
        };
      });
    }),

  // Weekly report data - aggregates all key metrics for the project
  weeklyReportData: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [allReqs, allTasks, allIssues, allTests, allCRs, allDecisions] = await Promise.all([
        db.select().from(requirements).where(eq(requirements.projectId, input.projectId)),
        db.select().from(tasks).where(eq(tasks.projectId, input.projectId)),
        db.select().from(issues).where(eq(issues.projectId, input.projectId)),
        db.select().from(testCases).where(eq(testCases.projectId, input.projectId)),
        db.select().from(changeRequests).where(eq(changeRequests.projectId, input.projectId)),
        db.select().from(decisions).where(eq(decisions.projectId, input.projectId)),
      ]);

      // Task stats
      const tasksByStatus: Record<string, number> = {};
      for (const t of allTasks) {
        const s = t.status ?? "Unknown";
        tasksByStatus[s] = (tasksByStatus[s] ?? 0) + 1;
      }

      // Issue stats
      const issuesByStatus: Record<string, number> = {};
      const issuesByPriority: Record<string, number> = {};
      for (const i of allIssues) {
        const s = i.status ?? "Unknown";
        issuesByStatus[s] = (issuesByStatus[s] ?? 0) + 1;
        const p = i.priority ?? "Unknown";
        issuesByPriority[p] = (issuesByPriority[p] ?? 0) + 1;
      }

      // Requirement stats
      const reqsByStatus: Record<string, number> = {};
      for (const r of allReqs) {
        const s = r.status ?? "Unknown";
        reqsByStatus[s] = (reqsByStatus[s] ?? 0) + 1;
      }

      // Test stats
      const testsByStatus: Record<string, number> = {};
      for (const t of allTests) {
        const s = t.status ?? "Unknown";
        testsByStatus[s] = (testsByStatus[s] ?? 0) + 1;
      }

      // CR stats
      const crsByStatus: Record<string, number> = {};
      for (const cr of allCRs) {
        const s = cr.status ?? "Unknown";
        crsByStatus[s] = (crsByStatus[s] ?? 0) + 1;
      }

      // Overdue tasks (dueDate in past, status not done)
      const today = new Date().toISOString().split("T")[0];
      const overdueTasks = allTasks.filter((t) => {
        if (!t.dueDate) return false;
        const done = t.status?.toLowerCase() === "done" || t.status?.toLowerCase() === "completed";
        return !done && t.dueDate < today;
      });

      // Open high priority issues
      const highPriorityOpenIssues = allIssues.filter((i) =>
        (i.priority?.toLowerCase() === "high" || i.priority?.toLowerCase() === "critical") &&
        i.status?.toLowerCase() !== "closed"
      );

      return {
        summary: {
          totalRequirements: allReqs.length,
          totalTasks: allTasks.length,
          totalIssues: allIssues.length,
          totalTestCases: allTests.length,
          totalCRs: allCRs.length,
          totalDecisions: allDecisions.length,
          overdueTasks: overdueTasks.length,
          highPriorityOpenIssues: highPriorityOpenIssues.length,
          testPassRate: allTests.length > 0
            ? Math.round((allTests.filter((t) => t.status === "Passed").length / allTests.length) * 100)
            : 0,
        },
        tasksByStatus,
        issuesByStatus,
        issuesByPriority,
        reqsByStatus,
        testsByStatus,
        crsByStatus,
        overdueTasks: overdueTasks.slice(0, 10).map((t) => ({
          taskId: t.taskId,
          description: t.description,
          dueDate: t.dueDate,
          status: t.status,
          responsible: t.responsible,
        })),
        highPriorityOpenIssues: highPriorityOpenIssues.slice(0, 10).map((i) => ({
          issueId: i.issueId,
          description: i.description,
          priority: i.priority,
          status: i.status,
          owner: i.owner,
        })),
        recentDecisions: allDecisions.slice(0, 5).map((d) => ({
          decisionId: d.decisionId,
          title: d.title,
          decisionDate: d.decisionDate,
          status: d.status,
          decidedBy: d.decidedBy,
        })),
        pendingCRs: allCRs
          .filter((cr) => cr.status === "Submitted" || cr.status === "Under Review")
          .slice(0, 5)
          .map((cr) => ({
            crId: cr.crId,
            title: cr.title,
            status: cr.status,
            priority: cr.priority,
            requestedBy: cr.requestedBy,
          })),
      };
    }),
});
