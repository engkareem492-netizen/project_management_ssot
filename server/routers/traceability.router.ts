import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import {
  requirements, tasks, issues, testCases, testRuns, changeRequests, decisions,
  risks, stakeholders, statusOptions, deliverables, deliverableLinks,
  budgetEntries, projectBudget, milestones,
} from "../../drizzle/schema";
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

  // Comprehensive periodic report data — aggregates all key metrics
  weeklyReportData: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      periodStart: z.string().optional(),
      periodEnd: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [
        allReqs, allTasks, allIssues, allTests, allCRs, allDecisions,
        allRisks, allStakeholders, allDeliverables, allDeliverableLinks,
        allBudgetEntries, allMilestones, allTestRuns, budgetRecord,
      ] = await Promise.all([
        db.select().from(requirements).where(eq(requirements.projectId, input.projectId)),
        db.select().from(tasks).where(eq(tasks.projectId, input.projectId)),
        db.select().from(issues).where(eq(issues.projectId, input.projectId)),
        db.select().from(testCases).where(eq(testCases.projectId, input.projectId)),
        db.select().from(changeRequests).where(eq(changeRequests.projectId, input.projectId)),
        db.select().from(decisions).where(eq(decisions.projectId, input.projectId)),
        db.select().from(risks).where(eq(risks.projectId, input.projectId)),
        db.select().from(stakeholders).where(eq(stakeholders.projectId, input.projectId)),
        db.select().from(deliverables).where(eq(deliverables.projectId, input.projectId)),
        db.select().from(deliverableLinks),
        db.select().from(budgetEntries).where(eq(budgetEntries.projectId, input.projectId)),
        db.select().from(milestones).where(eq(milestones.projectId, input.projectId)),
        db.select().from(testRuns).where(eq(testRuns.projectId, input.projectId)),
        db.select().from(projectBudget).where(eq(projectBudget.projectId, input.projectId)),
      ]);

      // ── Period ──────────────────────────────────────────────────────────────
      const periodStart = input.periodStart ?? new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).toISOString().split("T")[0];
      const periodEnd = input.periodEnd ?? new Date(new Date(periodStart).setDate(new Date(periodStart).getDate() + 6)).toISOString().split("T")[0];

      // ── Status completeness lookup ──────────────────────────────────────────
      const dbStatusOptions = await db.select().from(statusOptions);
      const dbDoneValues = dbStatusOptions.filter(s => s.isComplete).map(s => s.value.toLowerCase());
      const DONE_STATUSES = new Set(dbDoneValues.length > 0
        ? dbDoneValues
        : ["completed", "closed", "solved", "done", "cancelled", "approved", "passed"]);

      // Exclude COMM tasks from task analytics
      const regularTasks = allTasks.filter(
        (t) => !t.communicationStakeholderId && !(t.taskId ?? "").startsWith("COMM-")
      );

      const today = new Date().toISOString().split("T")[0];

      // ── TASKS ───────────────────────────────────────────────────────────────
      const tasksByStatus: Record<string, number> = {};
      for (const t of regularTasks) {
        const s = t.status ?? "Unknown";
        tasksByStatus[s] = (tasksByStatus[s] ?? 0) + 1;
      }

      const tasksByResponsible: Record<string, number> = {};
      const taskStatusByResponsible: Record<string, Record<string, number>> = {};
      for (const t of regularTasks) {
        const resp = t.responsible ?? "Unassigned";
        const st = t.status ?? "Unknown";
        tasksByResponsible[resp] = (tasksByResponsible[resp] ?? 0) + 1;
        if (!taskStatusByResponsible[resp]) taskStatusByResponsible[resp] = {};
        taskStatusByResponsible[resp][st] = (taskStatusByResponsible[resp][st] ?? 0) + 1;
      }

      // Tasks by Accountable (RACI 'A' — not Responsible)
      const tasksByAccountable: Record<string, number> = {};
      const taskStatusByAccountable: Record<string, Record<string, number>> = {};
      for (const t of regularTasks) {
        const acct = t.accountable ?? "Unassigned";
        const st = t.status ?? "Unknown";
        tasksByAccountable[acct] = (tasksByAccountable[acct] ?? 0) + 1;
        if (!taskStatusByAccountable[acct]) taskStatusByAccountable[acct] = {};
        taskStatusByAccountable[acct][st] = (taskStatusByAccountable[acct][st] ?? 0) + 1;
      }

      // Tasks by Subject / Task Group
      const tasksBySubject: Record<string, number> = {};
      const tasksByGroup: Record<string, number> = {};
      for (const t of regularTasks) {
        const subj = t.subject ?? "(No Subject)";
        tasksBySubject[subj] = (tasksBySubject[subj] ?? 0) + 1;
        const grp = t.taskGroup ?? "(No Group)";
        tasksByGroup[grp] = (tasksByGroup[grp] ?? 0) + 1;
      }

      // Tasks by Priority
      const tasksByPriority: Record<string, number> = {};
      for (const t of regularTasks) {
        const p = t.priority ?? "Unknown";
        tasksByPriority[p] = (tasksByPriority[p] ?? 0) + 1;
      }

      // Overdue tasks
      const overdueTasks = regularTasks.filter((t) => {
        if (!t.dueDate) return false;
        const isDone = DONE_STATUSES.has((t.currentStatus || t.status || "").toLowerCase());
        return !isDone && t.dueDate < today;
      });

      // Period tasks
      const tasksInPeriod = regularTasks.filter((t) => {
        if (!t.dueDate) return false;
        return t.dueDate >= periodStart && t.dueDate <= periodEnd;
      });

      // Effort (man-hours) by responsible
      const effortByResponsible: Record<string, number> = {};
      for (const t of regularTasks) {
        if (t.manHours) {
          const resp = t.responsible ?? "Unassigned";
          effortByResponsible[resp] = (effortByResponsible[resp] ?? 0) + parseFloat(String(t.manHours));
        }
      }

      // ── ISSUES ──────────────────────────────────────────────────────────────
      const issuesByStatus: Record<string, number> = {};
      const issuesByPriority: Record<string, number> = {};
      const issuesByOwner: Record<string, number> = {};
      const issuesByType: Record<string, number> = {};
      for (const i of allIssues) {
        issuesByStatus[i.status ?? "Unknown"] = (issuesByStatus[i.status ?? "Unknown"] ?? 0) + 1;
        issuesByPriority[i.priority ?? "Unknown"] = (issuesByPriority[i.priority ?? "Unknown"] ?? 0) + 1;
        issuesByOwner[i.owner ?? "Unassigned"] = (issuesByOwner[i.owner ?? "Unassigned"] ?? 0) + 1;
        issuesByType[(i as any).type ?? "(None)"] = (issuesByType[(i as any).type ?? "(None)"] ?? 0) + 1;
      }

      const highPriorityOpenIssues = allIssues.filter((i) =>
        (i.priority?.toLowerCase() === "high" || i.priority?.toLowerCase() === "critical") &&
        i.status?.toLowerCase() !== "closed"
      );

      const issuesNeedingResolution = allIssues.filter((i) => {
        const rd = (i as any).resolutionDate;
        if (!rd) return false;
        return rd >= periodStart && rd <= periodEnd && i.status?.toLowerCase() !== "closed";
      });

      // ── REQUIREMENTS ────────────────────────────────────────────────────────
      const reqsByStatus: Record<string, number> = {};
      const reqsByPriority: Record<string, number> = {};
      const reqsByCategory: Record<string, number> = {};
      for (const r of allReqs) {
        reqsByStatus[r.status ?? "Unknown"] = (reqsByStatus[r.status ?? "Unknown"] ?? 0) + 1;
        reqsByPriority[r.priority ?? "Unknown"] = (reqsByPriority[r.priority ?? "Unknown"] ?? 0) + 1;
        reqsByCategory[(r as any).category ?? "(None)"] = (reqsByCategory[(r as any).category ?? "(None)"] ?? 0) + 1;
      }

      const requirementsInPeriod = allReqs.filter((r) => {
        const ca = r.createdAt ?? (r as any).importedAt?.toISOString?.()?.split("T")[0];
        if (!ca) return false;
        const caStr = typeof ca === "string" ? ca.split("T")[0] : String(ca);
        return caStr >= periodStart && caStr <= periodEnd;
      });

      // Requirements without tasks (no coverage)
      const reqsWithoutTasks = allReqs.filter((r) =>
        !regularTasks.some((t) => t.requirementId === r.idCode)
      );

      // Requirements without tests (no test coverage)
      const reqsWithoutTests = allReqs.filter((r) =>
        !allTests.some((tc) => tc.requirementId === r.idCode)
      );

      // ── TEST CASES & RUNS ───────────────────────────────────────────────────
      const testsByStatus: Record<string, number> = {};
      const testsByPriority: Record<string, number> = {};
      for (const t of allTests) {
        testsByStatus[t.status ?? "Unknown"] = (testsByStatus[t.status ?? "Unknown"] ?? 0) + 1;
        testsByPriority[(t as any).priority ?? "Unknown"] = (testsByPriority[(t as any).priority ?? "Unknown"] ?? 0) + 1;
      }

      const testRunsByStatus: Record<string, number> = {};
      const testRunsByExecutor: Record<string, number> = {};
      const testRunsByEnvironment: Record<string, number> = {};
      for (const r of allTestRuns) {
        testRunsByStatus[r.status ?? "Unknown"] = (testRunsByStatus[r.status ?? "Unknown"] ?? 0) + 1;
        testRunsByExecutor[r.executedBy ?? "Unknown"] = (testRunsByExecutor[r.executedBy ?? "Unknown"] ?? 0) + 1;
        testRunsByEnvironment[r.environment ?? "Unknown"] = (testRunsByEnvironment[r.environment ?? "Unknown"] ?? 0) + 1;
      }

      const failedTestCases = allTests.filter((t) => t.status === "Failed").slice(0, 20).map((t) => ({
        testId: t.testId,
        title: t.title,
        status: t.status,
        requirementId: t.requirementId,
        priority: (t as any).priority,
      }));

      const latestRunsInPeriod = allTestRuns.filter((r) => {
        const d = r.executionDate?.toString();
        if (!d) return false;
        return d >= periodStart && d <= periodEnd;
      });

      // ── CHANGE REQUESTS ─────────────────────────────────────────────────────
      const crsByStatus: Record<string, number> = {};
      const crsByPriority: Record<string, number> = {};
      for (const cr of allCRs) {
        crsByStatus[cr.status ?? "Unknown"] = (crsByStatus[cr.status ?? "Unknown"] ?? 0) + 1;
        crsByPriority[cr.priority ?? "Unknown"] = (crsByPriority[cr.priority ?? "Unknown"] ?? 0) + 1;
      }

      const pendingCRs = allCRs
        .filter((cr) => cr.status === "Submitted" || cr.status === "Under Review")
        .slice(0, 5)
        .map((cr) => ({ crId: cr.crId, title: cr.title, status: cr.status, priority: cr.priority, requestedBy: cr.requestedBy }));

      const recentDecisions = allDecisions.slice(0, 5).map((d) => ({
        decisionId: d.decisionId, title: d.title, decisionDate: d.decisionDate, status: d.status, decidedBy: d.decidedBy,
      }));

      // ── RISKS ───────────────────────────────────────────────────────────────
      const risksByStatus: Record<string, number> = {};
      const risksByType: Record<string, number> = {};
      const riskScoreBreakdown = { low: 0, medium: 0, high: 0, critical: 0 };
      for (const r of allRisks) {
        const score = r.score ?? 0;
        if (score >= 20) riskScoreBreakdown.critical++;
        else if (score >= 12) riskScoreBreakdown.high++;
        else if (score >= 6) riskScoreBreakdown.medium++;
        else riskScoreBreakdown.low++;
        risksByStatus[(r as any).status ?? "Unknown"] = (risksByStatus[(r as any).status ?? "Unknown"] ?? 0) + 1;
        risksByType[(r as any).type ?? "(None)"] = (risksByType[(r as any).type ?? "(None)"] ?? 0) + 1;
      }

      const topRisks = allRisks
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 10)
        .map((r) => ({
          riskId: (r as any).riskId,
          title: (r as any).title ?? (r as any).description,
          score: r.score,
          probability: (r as any).probability,
          impact: (r as any).impact,
          status: (r as any).status,
          owner: (r as any).owner,
          type: (r as any).type,
        }));

      // ── STAKEHOLDERS ────────────────────────────────────────────────────────
      const stakeholdersByClassification: Record<string, number> = {};
      const stakeholdersByEngagement: Record<string, number> = {};
      const stakeholdersByEngagementGap: { name: string; current: string; desired: string; gap: number }[] = [];

      // Power/Interest grid quadrants
      const powerInterestGrid: Record<string, number> = {
        "Manage Closely (High Power, High Interest)": 0,
        "Keep Satisfied (High Power, Low Interest)": 0,
        "Keep Informed (Low Power, High Interest)": 0,
        "Monitor (Low Power, Low Interest)": 0,
      };

      for (const s of allStakeholders) {
        stakeholdersByClassification[s.classification ?? "Stakeholder"] =
          (stakeholdersByClassification[s.classification ?? "Stakeholder"] ?? 0) + 1;
        stakeholdersByEngagement[s.currentEngagementStatus ?? "Unset"] =
          (stakeholdersByEngagement[s.currentEngagementStatus ?? "Unset"] ?? 0) + 1;

        // Engagement gap (current vs desired)
        if (s.currentEngagementStatus && s.desiredEngagementStatus && s.currentEngagementStatus !== s.desiredEngagementStatus) {
          const levels: Record<string, number> = { Unaware: 0, Resistant: 1, Neutral: 2, Supportive: 3, Leading: 4 };
          const gap = (levels[s.desiredEngagementStatus] ?? 2) - (levels[s.currentEngagementStatus] ?? 2);
          stakeholdersByEngagementGap.push({
            name: s.fullName,
            current: s.currentEngagementStatus,
            desired: s.desiredEngagementStatus,
            gap,
          });
        }

        // Power/Interest grid
        const power = s.powerLevel ?? 3;
        const interest = s.interestLevel ?? 3;
        if (power >= 3 && interest >= 3) powerInterestGrid["Manage Closely (High Power, High Interest)"]++;
        else if (power >= 3 && interest < 3) powerInterestGrid["Keep Satisfied (High Power, Low Interest)"]++;
        else if (power < 3 && interest >= 3) powerInterestGrid["Keep Informed (Low Power, High Interest)"]++;
        else powerInterestGrid["Monitor (Low Power, Low Interest)"]++;
      }

      const teamMembers = allStakeholders.filter((s) => s.classification === "TeamMember");
      const teamTaskLoad = teamMembers.map((m) => {
        const memberTasks = regularTasks.filter((t) => t.responsible === m.fullName || t.responsibleId === m.id);
        const openTasks = memberTasks.filter((t) => !DONE_STATUSES.has((t.status ?? "").toLowerCase())).length;
        const overdue = memberTasks.filter((t) => t.dueDate && t.dueDate < today && !DONE_STATUSES.has((t.status ?? "").toLowerCase())).length;
        return {
          name: m.fullName,
          role: m.role,
          department: m.department,
          totalTasks: memberTasks.length,
          openTasks,
          overdue,
          completedTasks: memberTasks.length - openTasks,
        };
      });

      // ── DELIVERABLES ────────────────────────────────────────────────────────
      const deliverablesByStatus: Record<string, number> = {};
      for (const d of allDeliverables) {
        deliverablesByStatus[d.status ?? "Unknown"] = (deliverablesByStatus[d.status ?? "Unknown"] ?? 0) + 1;
      }

      const overdueDeliverables = allDeliverables.filter((d) => {
        if (!d.dueDate) return false;
        return d.dueDate < today && !DONE_STATUSES.has((d.status ?? "").toLowerCase());
      });

      const deliverablesInPeriod = allDeliverables.filter((d) => {
        if (!d.dueDate) return false;
        return d.dueDate >= periodStart && d.dueDate <= periodEnd;
      });

      // Deliverable coverage — how many deliverables have linked tasks/requirements
      const deliverableIds = new Set(allDeliverables.map((d) => d.id));
      const deliverableLinkMap: Record<number, { tasks: number; requirements: number }> = {};
      for (const dl of allDeliverableLinks) {
        if (!deliverableIds.has(dl.deliverableId)) continue;
        if (!deliverableLinkMap[dl.deliverableId]) deliverableLinkMap[dl.deliverableId] = { tasks: 0, requirements: 0 };
        if (dl.linkedEntityType === "task") deliverableLinkMap[dl.deliverableId].tasks++;
        if (dl.linkedEntityType === "requirement") deliverableLinkMap[dl.deliverableId].requirements++;
      }

      const deliverablesWithCoverage = allDeliverables.map((d) => ({
        deliverableId: d.deliverableId,
        description: d.description,
        status: d.status,
        dueDate: d.dueDate,
        linkedTasks: deliverableLinkMap[d.id]?.tasks ?? 0,
        linkedRequirements: deliverableLinkMap[d.id]?.requirements ?? 0,
      }));

      // ── BUDGET ──────────────────────────────────────────────────────────────
      const totalBudget = parseFloat(String(budgetRecord[0]?.totalBudget ?? "0"));
      const currency = budgetRecord[0]?.currency ?? "USD";

      let totalEstimated = 0;
      let totalActual = 0;
      const budgetByCategory: Record<string, { estimated: number; actual: number }> = {};
      const budgetByStatus: Record<string, { estimated: number; actual: number }> = {};
      const budgetByEntityType: Record<string, number> = {};

      for (const e of allBudgetEntries) {
        const est = parseFloat(String(e.estimatedCost ?? "0"));
        const act = parseFloat(String(e.actualCost ?? "0"));
        totalEstimated += est;
        totalActual += act;

        const cat = e.category ?? "(None)";
        if (!budgetByCategory[cat]) budgetByCategory[cat] = { estimated: 0, actual: 0 };
        budgetByCategory[cat].estimated += est;
        budgetByCategory[cat].actual += act;

        const st = e.status ?? "Unknown";
        if (!budgetByStatus[st]) budgetByStatus[st] = { estimated: 0, actual: 0 };
        budgetByStatus[st].estimated += est;
        budgetByStatus[st].actual += act;

        const et = e.entityType ?? "(None)";
        budgetByEntityType[et] = (budgetByEntityType[et] ?? 0) + 1;
      }

      const budgetVariance = totalBudget - totalActual;
      const budgetUtilization = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;
      const topBudgetEntries = allBudgetEntries
        .sort((a, b) => parseFloat(String(b.estimatedCost ?? "0")) - parseFloat(String(a.estimatedCost ?? "0")))
        .slice(0, 10)
        .map((e) => ({
          category: e.category,
          description: e.description,
          estimatedCost: parseFloat(String(e.estimatedCost ?? "0")),
          actualCost: parseFloat(String(e.actualCost ?? "0")),
          status: e.status,
        }));

      // ── MILESTONES ──────────────────────────────────────────────────────────
      const milestonesByStatus: Record<string, number> = {};
      const milestonesByRag: Record<string, number> = {};
      for (const m of allMilestones) {
        milestonesByStatus[m.status ?? "Unknown"] = (milestonesByStatus[m.status ?? "Unknown"] ?? 0) + 1;
        milestonesByRag[m.ragStatus ?? "Unknown"] = (milestonesByRag[m.ragStatus ?? "Unknown"] ?? 0) + 1;
      }

      const upcomingMilestones = allMilestones
        .filter((m) => m.status !== "Achieved" && m.status !== "Missed")
        .sort((a, b) => String(a.dueDate ?? "").localeCompare(String(b.dueDate ?? "")))
        .slice(0, 10)
        .map((m) => ({
          milestoneId: m.milestoneId,
          title: m.title,
          dueDate: m.dueDate?.toString(),
          ragStatus: m.ragStatus,
          status: m.status,
          owner: m.owner,
        }));

      const overdueMilestones = allMilestones.filter((m) => {
        if (!m.dueDate) return false;
        return m.dueDate.toString() < today && m.status !== "Achieved";
      });

      // ── TRACEABILITY MATRIX SUMMARY ─────────────────────────────────────────
      const traceabilityMatrix = allReqs.map((req) => {
        const linkedTasks = regularTasks.filter((t) => t.requirementId === req.idCode);
        const linkedIssues = allIssues.filter((i) => i.requirementId === req.idCode);
        const linkedTests = allTests.filter((tc) => tc.requirementId === req.idCode);
        const linkedCRs = allCRs.filter((cr) => cr.requirementId === req.idCode);

        const testPassed = linkedTests.filter((t) => t.status === "Passed").length;
        const testTotal = linkedTests.length;
        const testCoverage = testTotal > 0 ? Math.round((testPassed / testTotal) * 100) : 0;

        const openTasks = linkedTasks.filter((t) => !DONE_STATUSES.has((t.status ?? "").toLowerCase())).length;
        const openIssues = linkedIssues.filter((i) => !DONE_STATUSES.has((i.status ?? "").toLowerCase())).length;

        return {
          reqId: req.idCode,
          description: (req.description ?? "").slice(0, 80),
          status: req.status,
          priority: req.priority,
          taskCount: linkedTasks.length,
          openTasks,
          issueCount: linkedIssues.length,
          openIssues,
          testTotal,
          testPassed,
          testCoverage,
          crCount: linkedCRs.length,
          hasCoverage: linkedTasks.length > 0 || linkedTests.length > 0,
        };
      });

      // ── SUMMARY ─────────────────────────────────────────────────────────────
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
          totalDeliverables: allDeliverables.length,
          overdueDeliverables: overdueDeliverables.length,
          totalMilestones: allMilestones.length,
          overdueMilestones: overdueMilestones.length,
          totalStakeholders: allStakeholders.length,
          teamSize: teamMembers.length,
          totalBudget,
          totalEstimated,
          totalActual,
          budgetVariance,
          budgetUtilization,
          currency,
          testPassRate: allTests.length > 0
            ? Math.round((allTests.filter((t) => t.status === "Passed").length / allTests.length) * 100)
            : 0,
          testRunsInPeriod: latestRunsInPeriod.length,
          reqsWithoutTasks: reqsWithoutTasks.length,
          reqsWithoutTests: reqsWithoutTests.length,
          traceabilityCoverage: allReqs.length > 0
            ? Math.round((traceabilityMatrix.filter((r) => r.hasCoverage).length / allReqs.length) * 100)
            : 0,
        },

        // Tasks
        tasksByStatus,
        tasksByResponsible,
        tasksByAccountable,
        tasksBySubject,
        tasksByGroup,
        tasksByPriority,
        taskStatusByResponsible,
        taskStatusByAccountable,
        effortByResponsible,
        teamTaskLoad,
        tasksInPeriod: tasksInPeriod.map((t) => ({
          taskId: t.taskId, description: t.description, dueDate: t.dueDate,
          status: t.status, responsible: t.responsible, accountable: t.accountable,
          priority: t.priority, taskGroup: t.taskGroup,
        })),
        overdueTasks: overdueTasks.slice(0, 20).map((t) => ({
          taskId: t.taskId, description: t.description, dueDate: t.dueDate,
          status: t.status, responsible: t.responsible,
        })),

        // Issues
        issuesByStatus,
        issuesByPriority,
        issuesByOwner,
        issuesByType,
        issuesNeedingResolution: issuesNeedingResolution.map((i) => ({
          issueId: i.issueId, description: i.description, resolutionDate: (i as any).resolutionDate,
          priority: i.priority, status: i.status, owner: i.owner,
        })),
        highPriorityOpenIssues: highPriorityOpenIssues.slice(0, 10).map((i) => ({
          issueId: i.issueId, description: i.description, priority: i.priority, status: i.status, owner: i.owner,
        })),

        // Requirements
        reqsByStatus,
        reqsByPriority,
        reqsByCategory,
        requirementsInPeriod: requirementsInPeriod.map((r) => ({
          idCode: r.idCode, description: r.description, status: r.status, priority: r.priority, owner: r.owner,
        })),
        reqsWithoutTasks: reqsWithoutTasks.slice(0, 15).map((r) => ({
          idCode: r.idCode, description: (r.description ?? "").slice(0, 70), status: r.status, priority: r.priority,
        })),
        reqsWithoutTests: reqsWithoutTests.slice(0, 15).map((r) => ({
          idCode: r.idCode, description: (r.description ?? "").slice(0, 70), status: r.status, priority: r.priority,
        })),

        // Tests
        testsByStatus,
        testsByPriority,
        testRunsByStatus,
        testRunsByExecutor,
        testRunsByEnvironment,
        failedTestCases,
        testRunsInPeriod: latestRunsInPeriod.slice(0, 15).map((r) => ({
          runId: r.runId, executionDate: r.executionDate?.toString(), executedBy: r.executedBy,
          status: r.status, environment: r.environment,
        })),

        // CRs & Decisions
        crsByStatus,
        crsByPriority,
        pendingCRs,
        recentDecisions,

        // Risks
        riskScoreBreakdown,
        risksByStatus,
        risksByType,
        topRisks,

        // Stakeholders
        stakeholdersByClassification,
        stakeholdersByEngagement,
        stakeholdersByEngagementGap: stakeholdersByEngagementGap.slice(0, 15),
        powerInterestGrid,

        // Deliverables
        deliverablesByStatus,
        deliverablesInPeriod: deliverablesInPeriod.map((d) => ({
          deliverableId: d.deliverableId, description: d.description, dueDate: d.dueDate, status: d.status,
        })),
        overdueDeliverables: overdueDeliverables.slice(0, 15).map((d) => ({
          deliverableId: d.deliverableId, description: d.description, dueDate: d.dueDate, status: d.status,
        })),
        deliverablesWithCoverage,

        // Budget
        budgetByCategory,
        budgetByStatus,
        budgetByEntityType,
        topBudgetEntries,

        // Milestones
        milestonesByStatus,
        milestonesByRag,
        upcomingMilestones,
        overdueMilestones: overdueMilestones.slice(0, 10).map((m) => ({
          milestoneId: m.milestoneId, title: m.title, dueDate: m.dueDate?.toString(), ragStatus: m.ragStatus, status: m.status, owner: m.owner,
        })),

        // Traceability
        traceabilityMatrix,
      };
    }),
});
