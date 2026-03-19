import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { requirements, tasks, issues, testCases, changeRequests, decisions, risks, riskStatus, stakeholders, statusOptions } from "../../drizzle/schema";
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
    .input(z.object({
      projectId: z.number(),
      periodStart: z.string().optional(), // ISO date string e.g. "2026-03-01"
      periodEnd: z.string().optional(),   // ISO date string e.g. "2026-03-07"
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [allReqs, allTasks, allIssues, allTests, allCRs, allDecisions, allRisks, allStakeholders] = await Promise.all([
        db.select().from(requirements).where(eq(requirements.projectId, input.projectId)),
        db.select().from(tasks).where(eq(tasks.projectId, input.projectId)),
        db.select().from(issues).where(eq(issues.projectId, input.projectId)),
        db.select().from(testCases).where(eq(testCases.projectId, input.projectId)),
        db.select().from(changeRequests).where(eq(changeRequests.projectId, input.projectId)),
        db.select().from(decisions).where(eq(decisions.projectId, input.projectId)),
        db.select().from(risks).where(eq(risks.projectId, input.projectId)),
        db.select().from(stakeholders).where(eq(stakeholders.projectId, input.projectId)),
      ]);

      // Determine period boundaries
      const periodStart = input.periodStart ?? new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).toISOString().split("T")[0];
      const periodEnd = input.periodEnd ?? new Date(new Date(periodStart).setDate(new Date(periodStart).getDate() + 6)).toISOString().split("T")[0];

      // Exclude communication tasks (COMM- prefix or communicationStakeholderId set) from reports
      const regularTasks = allTasks.filter(
        (t) => !t.communicationStakeholderId && !(t.taskId ?? "").startsWith("COMM-")
      );

      // Task stats (excluding COMM tasks)
      const tasksByStatus: Record<string, number> = {};
      for (const t of regularTasks) {
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

      // Overdue tasks (dueDate in past, status not a done/closed state)
      const today = new Date().toISOString().split("T")[0];
      // Fetch isComplete statuses from DB, fallback to hardcoded list
      const dbStatusOptions = await db.select().from(statusOptions);
      const dbDoneValues = dbStatusOptions.filter(s => s.isComplete).map(s => s.value.toLowerCase());
      const DONE_STATUSES = new Set(dbDoneValues.length > 0
        ? dbDoneValues
        : ["completed", "closed", "solved", "done", "cancelled", "approved", "passed"]);
      const overdueTasks = regularTasks.filter((t) => {
        if (!t.dueDate) return false;
        const isDone = DONE_STATUSES.has((t.currentStatus || t.status || "").toLowerCase());
        return !isDone && t.dueDate < today;
      });

      // Open high priority issues
      const highPriorityOpenIssues = allIssues.filter((i) =>
        (i.priority?.toLowerCase() === "high" || i.priority?.toLowerCase() === "critical") &&
        i.status?.toLowerCase() !== "closed"
      );

      // === PERIOD-BASED DATA ===

      // Tasks with due date within period (excluding COMM tasks)
      const tasksInPeriod = regularTasks.filter((t) => {
        if (!t.dueDate) return false;
        return t.dueDate >= periodStart && t.dueDate <= periodEnd;
      });

      // Issues that need resolution in the period (resolutionDate within period)
      const issuesNeedingResolution = allIssues.filter((i) => {
        const rd = (i as any).resolutionDate;
        if (!rd) return false;
        return rd >= periodStart && rd <= periodEnd && i.status?.toLowerCase() !== "closed";
      });

      // Requirements gathered in period (createdAt within period)
      const requirementsInPeriod = allReqs.filter((r) => {
        const ca = r.createdAt ?? (r as any).importedAt?.toISOString?.()?.split("T")[0];
        if (!ca) return false;
        const caStr = typeof ca === "string" ? ca.split("T")[0] : String(ca);
        return caStr >= periodStart && caStr <= periodEnd;
      });

      // Task status breakdown per responsible (excluding COMM tasks)
      const taskStatusByResponsible: Record<string, Record<string, number>> = {};
      for (const t of regularTasks) {
        const responsible = t.responsible ?? "Unassigned";
        const status = t.status ?? "Unknown";
        if (!taskStatusByResponsible[responsible]) taskStatusByResponsible[responsible] = {};
        taskStatusByResponsible[responsible][status] = (taskStatusByResponsible[responsible][status] ?? 0) + 1;
      }

      // Task count per responsible (excluding COMM tasks)
      const tasksByResponsible: Record<string, number> = {};
      for (const t of regularTasks) {
        const responsible = t.responsible ?? "Unassigned";
        tasksByResponsible[responsible] = (tasksByResponsible[responsible] ?? 0) + 1;
      }

      // Issue count per owner
      const issuesByOwner: Record<string, number> = {};
      for (const i of allIssues) {
        const owner = i.owner ?? "Unassigned";
        issuesByOwner[owner] = (issuesByOwner[owner] ?? 0) + 1;
      }

      // Risk status summary
      const risksByStatus: Record<string, number> = {};
      const riskScoreBreakdown = { low: 0, medium: 0, high: 0, critical: 0 };
      for (const r of allRisks) {
        const score = r.score ?? 0;
        if (score >= 20) riskScoreBreakdown.critical++;
        else if (score >= 12) riskScoreBreakdown.high++;
        else if (score >= 6) riskScoreBreakdown.medium++;
        else riskScoreBreakdown.low++;
      }

      return {
        periodStart,
        periodEnd,
        summary: {
          totalRequirements: allReqs.length,
          totalTasks: regularTasks.length,
          totalIssues: allIssues.length,
          totalTestCases: allTests.length,
          totalCRs: allCRs.length,
          totalDecisions: allDecisions.length,
          overdueTasks: overdueTasks.length,
          highPriorityOpenIssues: highPriorityOpenIssues.length,
          totalRisks: allRisks.length,
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
        tasksByResponsible,
        issuesByOwner,
        taskStatusByResponsible,
        riskScoreBreakdown,
        // Period-specific data
        tasksInPeriod: tasksInPeriod.map((t) => ({
          taskId: t.taskId,
          description: t.description,
          dueDate: t.dueDate,
          status: t.status,
          responsible: t.responsible,
          priority: t.priority,
        })),
        issuesNeedingResolution: issuesNeedingResolution.map((i) => ({
          issueId: i.issueId,
          description: i.description,
          resolutionDate: (i as any).resolutionDate,
          priority: i.priority,
          status: i.status,
          owner: i.owner,
        })),
        requirementsInPeriod: requirementsInPeriod.map((r) => ({
          idCode: r.idCode,
          description: r.description,
          status: r.status,
          priority: r.priority,
          owner: r.owner,
        })),
        overdueTasks: overdueTasks.slice(0, 20).map((t) => ({
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
