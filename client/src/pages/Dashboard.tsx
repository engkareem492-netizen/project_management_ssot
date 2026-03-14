import React, { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Loader2, AlertTriangle, CheckCircle2, Clock, FileText, BarChart2,
  Activity, Flag, DollarSign, TrendingUp, TrendingDown, Minus,
  ShieldAlert, Target, Users, Package, CheckSquare, Link2,
  FileCheck, Zap, ChevronRight, AlertCircle, Calendar,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, AreaChart, Area,
} from "recharts";

/* ─── Color tokens ─────────────────────────────────────────────────────── */
const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#64748b", "#06b6d4"];

const RAG_DOT: Record<string, string> = {
  Green: "bg-green-500", Amber: "bg-yellow-500", Red: "bg-red-500",
};
const RAG_TEXT: Record<string, string> = {
  Green: "text-green-700", Amber: "text-yellow-700", Red: "text-red-700",
};
const RAG_BG: Record<string, string> = {
  Green: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
  Amber: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
  Red: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
};

/* ─── Reusable sub-components ──────────────────────────────────────────── */
function KpiCard({
  label, value, subtitle, trend, color, icon: Icon, href, onClick,
}: {
  label: string; value: string | number; subtitle?: string;
  trend?: "up" | "down" | "neutral"; color?: string;
  icon?: React.ElementType; href?: string; onClick?: () => void;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground";
  return (
    <Card
      className={`p-4 flex flex-col gap-1 ${href || onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground/60" />}
      </div>
      <div className={`text-3xl font-bold leading-none ${color ?? ""}`}>{value}</div>
      {subtitle && (
        <div className="flex items-center gap-1 mt-1">
          {trend && <TrendIcon className={`w-3 h-3 ${trendColor}`} />}
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>
      )}
    </Card>
  );
}

function ProgressRing({ pct, color, size = 96 }: { pct: number; color: string; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
        strokeWidth={10} className="text-muted/30" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={10} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

function SectionTitle({ icon: Icon, title, action, onAction }: {
  icon: React.ElementType; title: string; action?: string; onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-base font-semibold flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" /> {title}
      </h3>
      {action && onAction && (
        <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={onAction}>
          {action} <ChevronRight className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

/* ─── Constraints Widget ────────────────────────────────────────────────── */
function ConstraintsWidget({ charter, budgetUtil, tasks, changeRequests, testCases, navigate }: {
  charter: any; budgetUtil: any; tasks: any[]; changeRequests: any[]; testCases: any[]; navigate: (path: string) => void;
}) {
  const now = new Date();
  // TIME: based on charter start/end dates
  const startDate = charter?.projectStartDate ? new Date(charter.projectStartDate) : null;
  const endDate = charter?.projectEndDate ? new Date(charter.projectEndDate) : null;
  let timeStatus = "Unknown";
  let timePct = 0;
  if (startDate && endDate) {
    const total = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    timePct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    const doneTasks = tasks.filter((t: any) => t.status === "Done" || t.status === "Completed").length;
    const taskPct = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
    if (now > endDate) timeStatus = "Overdue";
    else if (taskPct >= timePct - 10) timeStatus = "On Track";
    else if (taskPct >= timePct - 25) timeStatus = "At Risk";
    else timeStatus = "Behind";
  }
  // BUDGET: based on budgetUtil
  let budgetStatus = "Unknown";
  let budgetPct = 0;
  if (budgetUtil) {
    budgetPct = budgetUtil.pct;
    if (budgetPct > 100) budgetStatus = "Over Budget";
    else if (budgetPct >= 90) budgetStatus = "At Risk";
    else if (budgetPct >= 70) budgetStatus = "Caution";
    else budgetStatus = "On Track";
  }
  // SCOPE: based on pending change requests
  const pendingCRs = changeRequests.filter((c: any) => c.status === "Submitted" || c.status === "Under Review" || c.status === "Pending").length;
  const scopeStatus = pendingCRs > 3 ? "At Risk" : pendingCRs > 1 ? "Caution" : "On Track";
  // QUALITY: based on test pass rate
  const passedTests = testCases.filter((t: any) => t.status === "Passed").length;
  const testPassRate = testCases.length > 0 ? Math.round((passedTests / testCases.length) * 100) : 100;
  const qualityStatus = testCases.length === 0 ? "Unknown" : testPassRate < 60 ? "At Risk" : testPassRate < 80 ? "Caution" : "On Track";

  const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
    "On Track":   { bg: "bg-green-50 dark:bg-green-950/30 border-green-200",  text: "text-green-700 dark:text-green-400",  dot: "bg-green-500" },
    "Caution":    { bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200", text: "text-yellow-700 dark:text-yellow-400", dot: "bg-yellow-500" },
    "At Risk":    { bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
    "Behind":     { bg: "bg-red-50 dark:bg-red-950/30 border-red-200",         text: "text-red-700 dark:text-red-400",       dot: "bg-red-500" },
    "Overdue":    { bg: "bg-red-50 dark:bg-red-950/30 border-red-200",         text: "text-red-700 dark:text-red-400",       dot: "bg-red-500" },
    "Over Budget":{ bg: "bg-red-50 dark:bg-red-950/30 border-red-200",         text: "text-red-700 dark:text-red-400",       dot: "bg-red-500" },
    "Unknown":    { bg: "bg-muted/30 border-muted",                             text: "text-muted-foreground",                dot: "bg-muted-foreground" },
  };

  const constraints = [
    {
      label: "Time",
      icon: Clock,
      status: timeStatus,
      detail: startDate && endDate
        ? `${timePct}% elapsed · ${endDate > now ? Math.ceil((endDate.getTime() - now.getTime()) / 86400000) + " days left" : "Past due date"}`
        : "No dates set",
      href: "/gantt",
    },
    {
      label: "Budget",
      icon: DollarSign,
      status: budgetStatus,
      detail: budgetUtil
        ? `${budgetPct}% committed · ${budgetUtil.currency} ${budgetUtil.spent.toLocaleString()} spent`
        : "No budget configured",
      href: "/budget",
    },
    {
      label: "Scope",
      icon: Target,
      status: scopeStatus,
      detail: changeRequests.length > 0 ? `${pendingCRs} pending CR(s) of ${changeRequests.length} total` : "No change requests",
      href: "/change-requests",
    },
    {
      label: "Quality",
      icon: CheckCircle2,
      status: qualityStatus,
      detail: testCases.length > 0 ? `${testPassRate}% pass rate (${passedTests}/${testCases.length})` : "No test cases defined",
      href: "/test-cases",
    },
  ];

  return (
    <Card className="p-6">
      <SectionTitle icon={Flag} title="Main Constraints" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {constraints.map(({ label, icon: Icon, status, detail, href }) => {
          const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["Unknown"];
          return (
            <div
              key={label}
              className={`border rounded-xl p-4 cursor-pointer hover:shadow-sm transition-shadow ${cfg.bg}`}
              onClick={() => navigate(href)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${cfg.text}`} />
                  <span className={`text-sm font-semibold ${cfg.text}`}>{label}</span>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              </div>
              <div className={`text-base font-bold ${cfg.text}`}>{status}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-snug">{detail}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ENTITY_ICON: Record<string, React.ElementType> = {
  task: CheckSquare, issue: AlertCircle, requirement: FileText,
  risk: ShieldAlert, milestone: Flag, deliverable: Package,
  stakeholder: Users, dependency: Link2, assumption: FileCheck,
};
const ENTITY_COLOR: Record<string, string> = {
  task: "bg-blue-100 text-blue-700", issue: "bg-red-100 text-red-700",
  requirement: "bg-purple-100 text-purple-700", risk: "bg-orange-100 text-orange-700",
  milestone: "bg-yellow-100 text-yellow-700", deliverable: "bg-green-100 text-green-700",
  stakeholder: "bg-teal-100 text-teal-700", dependency: "bg-indigo-100 text-indigo-700",
  assumption: "bg-pink-100 text-pink-700",
};

/* ─── Main Dashboard ───────────────────────────────────────────────────── */
/* ─── Cumulative Flow Diagram Component ─────────────────────────────── */
function CumulativeFlowChart({ projectId }: { projectId: number }) {
  const { data: cfdData, isLoading } = trpc.cfd.getData.useQuery(
    { projectId, days: 30 },
    { enabled: projectId > 0 }
  );
  const saveMut = trpc.cfd.saveSnapshot.useMutation();
  const utils = trpc.useUtils();

  const series = cfdData?.series ?? [];
  const hasData = series.length > 0;

  // Format date labels for X axis
  function fmtDate(d: string) {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle icon={Activity} title="Cumulative Flow of Tasks" />
        <button
          onClick={() => { saveMut.mutate({ projectId }); setTimeout(() => utils.cfd.getData.invalidate({ projectId }), 500); }}
          className="text-xs text-muted-foreground hover:text-foreground border rounded px-2 py-1 transition-colors"
          title="Save today's snapshot"
        >
          Save Snapshot
        </button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
          <Activity className="w-10 h-10 opacity-30" />
          <p className="text-sm">No task history yet. Click <strong>Save Snapshot</strong> to record today's counts.</p>
          <p className="text-xs opacity-60">The chart will show Open / In Progress / Blocked / Done distribution over time.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={series} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorDone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.85} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.85} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.85} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(value: any, name: string, props: any) => {
                const raw = props.payload;
                const keyMap: Record<string, string> = { done: "rawDone", blocked: "rawBlocked", inProgress: "rawInProgress", open: "rawOpen" };
                const rawKey = keyMap[name];
                const rawVal = rawKey ? raw[rawKey] : undefined;
                return [`${value}%${rawVal !== undefined ? ` (${rawVal} tasks)` : ""}`, name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, " $1")];
              }}
              labelFormatter={fmtDate}
            />
            <Legend iconType="circle" iconSize={8}
              formatter={(v) => v === "inProgress" ? "In Progress" : v.charAt(0).toUpperCase() + v.slice(1)}
            />
            {/* Stack order: Done (bottom) → Blocked → In Progress → Open (top) */}
            <Area type="monotone" dataKey="done" stackId="1" stroke="#22c55e" fill="url(#colorDone)" strokeWidth={1.5} dot={{ r: 3, fill: "#22c55e" }} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="blocked" stackId="1" stroke="#ef4444" fill="url(#colorBlocked)" strokeWidth={1.5} dot={{ r: 3, fill: "#ef4444" }} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="inProgress" stackId="1" stroke="#3b82f6" fill="url(#colorInProgress)" strokeWidth={1.5} dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="open" stackId="1" stroke="#94a3b8" fill="url(#colorOpen)" strokeWidth={1.5} dot={{ r: 3, fill: "#94a3b8" }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
      {hasData && (
        <div className="flex gap-4 mt-3 justify-end text-xs text-muted-foreground">
          <span>Total tasks today: <strong className="text-foreground">{cfdData?.latestCounts ? Object.values(cfdData.latestCounts).reduce((a, b) => a + b, 0) : 0}</strong></span>
          <span>Snapshots: <strong className="text-foreground">{cfdData?.snapshotCount ?? 0}</strong></span>
        </div>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { currentProjectId } = useProject();
  const [, navigate] = useLocation();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;
  const [activeRaidTab, setActiveRaidTab] = useState<"risks" | "issues" | "assumptions" | "dependencies">("risks");

  /* Data queries */
  const { data: projects } = trpc.projects.list.useQuery(undefined, { enabled });
  const currentProject = projects?.find((p: any) => p.id === currentProjectId);
  const { data: charter } = trpc.charter.get.useQuery({ projectId }, { enabled });
  const { data: milestones = [] } = trpc.milestones.list.useQuery({ projectId }, { enabled });
  const { data: requirements = [], isLoading: reqLoading } = trpc.requirements.list.useQuery({ projectId }, { enabled });
  const { data: issues = [], isLoading: issuesLoading } = trpc.issues.list.useQuery({ projectId }, { enabled });
  const { data: tasks = [], isLoading: tasksLoading } = trpc.tasks.list.useQuery({ projectId }, { enabled });
  const { data: changeRequests = [], isLoading: crLoading } = trpc.changeRequests.list.useQuery({ projectId }, { enabled });
  const { data: risks = [], isLoading: risksLoading } = trpc.risks.list.useQuery({ projectId }, { enabled });
  const { data: testCases = [], isLoading: testLoading } = trpc.testCases.list.useQuery({ projectId }, { enabled });
  const { data: actionLogs = [], isLoading: logsLoading } = trpc.actionLogs.list.useQuery(undefined, { enabled });
  const { data: deliverables = [] } = trpc.deliverables.list.useQuery({ projectId }, { enabled });
  const { data: budgetSummary } = trpc.budget.getSummary.useQuery({ projectId }, { enabled });
  const { data: stakeholders = [] } = trpc.stakeholders.list.useQuery({ projectId }, { enabled });
  const { data: assumptions = [] } = trpc.assumptions.list.useQuery({ projectId }, { enabled });
  const { data: dependencies = [] } = trpc.dependencies.list.useQuery({ projectId }, { enabled });
  const { data: riskStatuses = [] } = trpc.risks.status.list.useQuery({ projectId }, { enabled });

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const nextWeek = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + 7); return d; }, [today]);

  /* KPIs */
  const kpis = useMemo(() => {
    const closedStatusIds = new Set(riskStatuses.filter((s: any) => /closed|mitigated|resolved/i.test(s.name)).map((s: any) => s.id));
    const openIssues = issues.filter((i: any) => i.status !== "Closed" && i.status !== "Resolved").length;
    const overdueTasks = tasks.filter((t: any) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate); due.setHours(0, 0, 0, 0);
      return due < today && t.status !== "Done" && t.status !== "Completed" && t.status !== "Closed";
    }).length;
    const pendingCRs = changeRequests.filter((c: any) => c.status === "Submitted" || c.status === "Under Review").length;
    const activeRisks = risks.filter((r: any) => !closedStatusIds.has(r.riskStatusId)).length;
    const passedTests = testCases.filter((t: any) => t.status === "Passed").length;
    const testPassRate = testCases.length > 0 ? Math.round((passedTests / testCases.length) * 100) : 0;
    const doneTasks = tasks.filter((t: any) => t.status === "Done" || t.status === "Completed" || t.status === "Closed").length;
    const taskCompletion = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
    const openAssumptions = assumptions.filter((a: any) => a.status !== "Closed" && a.status !== "Rejected").length;
    const blockedDeps = dependencies.filter((d: any) => /blocked|at risk/i.test(d.currentStatus ?? "")).length;
    const actionItemTasks = tasks.filter((t: any) => t.isActionItem && t.status !== "Done" && t.status !== "Completed").length;
    return { openIssues, overdueTasks, pendingCRs, activeRisks, testPassRate, taskCompletion, openAssumptions, blockedDeps, actionItemTasks, closedStatusIds };
  }, [issues, tasks, changeRequests, risks, testCases, assumptions, dependencies, riskStatuses, today]);

  /* Health score */
  const healthScore = useMemo(() => {
    let score = 100;
    const criticalRisks = risks.filter((r: any) => r.impact >= 4 && !kpis.closedStatusIds.has(r.riskStatusId)).length;
    score -= criticalRisks * 10;
    score -= Math.min(kpis.overdueTasks * 5, 30);
    const crPendingRate = changeRequests.length > 0 ? kpis.pendingCRs / changeRequests.length : 0;
    if (crPendingRate > 0.2) score -= 10;
    if (milestones.some((m: any) => m.ragStatus === "Red")) score -= 10;
    if (kpis.blockedDeps > 0) score -= Math.min(kpis.blockedDeps * 5, 15);
    return Math.max(0, score);
  }, [risks, kpis, changeRequests, milestones]);

  /* Tasks by status donut */
  const tasksByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t: any) => { const s = t.status || "Unknown"; map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  /* Tasks by person bar */
  const tasksByPerson = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t: any) => { const p = t.responsible || "Unassigned"; map[p] = (map[p] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
  }, [tasks]);

  /* Radar chart: project dimensions */
  const radarData = useMemo(() => {
    const reqApproved = requirements.length > 0
      ? Math.round((requirements.filter((r: any) => r.status === "Approved").length / requirements.length) * 100) : 0;
    const delDone = deliverables.length > 0
      ? Math.round((deliverables.filter((d: any) => d.status === "Completed" || d.status === "Accepted").length / deliverables.length) * 100) : 0;
    const milDone = milestones.length > 0
      ? Math.round((milestones.filter((m: any) => m.status === "Achieved").length / milestones.length) * 100) : 0;
    return [
      { subject: "Tasks", A: kpis.taskCompletion },
      { subject: "Requirements", A: reqApproved },
      { subject: "Deliverables", A: delDone },
      { subject: "Milestones", A: milDone },
      { subject: "Test Pass", A: kpis.testPassRate },
    ];
  }, [requirements, deliverables, milestones, kpis]);

  /* Due this week */
  const dueThisWeek = useMemo(() => {
    const isThisWeek = (ds: string | null | undefined) => {
      if (!ds) return false;
      const d = new Date(ds); d.setHours(0, 0, 0, 0);
      return d >= today && d <= nextWeek;
    };
    return {
      tasks: tasks.filter((t: any) => isThisWeek(t.dueDate)).length,
      milestones: milestones.filter((m: any) => isThisWeek(m.dueDate) && m.status !== "Achieved").length,
      deliverables: deliverables.filter((d: any) => isThisWeek(d.dueDate)).length,
      issues: issues.filter((i: any) => isThisWeek(i.updateDate)).length,
    };
  }, [tasks, milestones, deliverables, issues, today, nextWeek]);

  /* Budget */
  const budgetUtil = useMemo(() => {
    if (!budgetSummary) return null;
    const total = parseFloat((budgetSummary as any).totalBudget ?? "0");
    const spent = parseFloat((budgetSummary as any).totalActual ?? "0");
    const committed = parseFloat((budgetSummary as any).totalCommitted ?? "0") + spent;
    const pct = total > 0 ? Math.round((committed / total) * 100) : 0;
    return { total, spent, committed, pct, currency: (budgetSummary as any).currency ?? "USD" };
  }, [budgetSummary]);

  /* Milestone summary */
  const milestoneSummary = useMemo(() => ({
    total: milestones.length,
    achieved: milestones.filter((m: any) => m.status === "Achieved").length,
    overdue: milestones.filter((m: any) => m.dueDate && m.status !== "Achieved" && new Date(m.dueDate) < today).length,
    red: milestones.filter((m: any) => m.ragStatus === "Red").length,
    upcoming: milestones.filter((m: any) => m.status === "Upcoming" || m.status === "In Progress").slice(0, 4),
  }), [milestones, today]);

  /* Risk matrix data */
  const riskMatrix = useMemo(() => {
    const matrix: Record<string, number> = {};
    risks.filter((r: any) => !kpis.closedStatusIds.has(r.riskStatusId)).forEach((r: any) => {
      const p = Math.min(5, Math.max(1, r.probability ?? 1));
      const i = Math.min(5, Math.max(1, r.impact ?? 1));
      const key = `${p}-${i}`;
      matrix[key] = (matrix[key] || 0) + 1;
    });
    return matrix;
  }, [risks]);

  const recentLogs = useMemo(() => [...actionLogs].slice(0, 10), [actionLogs]);

  const isLoading = reqLoading || issuesLoading || tasksLoading || crLoading || risksLoading || testLoading;

  if (!currentProjectId) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-muted-foreground">
        Select a project to view the dashboard.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const ragStatus = (charter as any)?.ragStatus ?? "Green";
  const healthColor = healthScore >= 80 ? "#22c55e" : healthScore >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={`border rounded-xl p-5 ${RAG_BG[ragStatus]}`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <BarChart2 className="w-6 h-6 text-muted-foreground" /> Project Dashboard
            </h1>
            {currentProject && (
              <p className="text-muted-foreground text-sm mt-1 font-medium">{currentProject.name}</p>
            )}
            {(charter as any)?.phase && (
              <p className="text-xs text-muted-foreground mt-0.5">Phase: {(charter as any).phase}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {charter && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-background/80 text-sm font-medium cursor-pointer hover:opacity-80"
                onClick={() => navigate("/charter")}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${RAG_DOT[ragStatus]}`} />
                <span className={RAG_TEXT[ragStatus]}>RAG: {ragStatus}</span>
              </div>
            )}
            {(charter as any)?.projectSponsor && (
              <Badge variant="outline" className="text-xs">Sponsor: {(charter as any).projectSponsor}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Task Completion" value={`${kpis.taskCompletion}%`} subtitle={`${tasks.filter((t:any)=>t.status==="Done"||t.status==="Completed").length}/${tasks.length} done`}
          icon={CheckSquare} color={kpis.taskCompletion >= 75 ? "text-green-600" : kpis.taskCompletion >= 50 ? "text-yellow-600" : "text-red-600"}
          onClick={() => navigate("/tasks")} />
        <KpiCard label="Open Issues" value={`${kpis.openIssues}`} subtitle={`of ${issues.length} total`}
          icon={AlertCircle} color={kpis.openIssues > 5 ? "text-red-600" : "text-foreground"}
          onClick={() => navigate("/issues")} />
        <KpiCard label="Active Risks" value={kpis.activeRisks} subtitle="not closed/mitigated"
          icon={ShieldAlert} color={kpis.activeRisks > 5 ? "text-red-600" : "text-foreground"}
          onClick={() => navigate("/risk-register")} />
        <KpiCard label="Overdue Tasks" value={kpis.overdueTasks} subtitle="past due date"
          icon={Clock} color={kpis.overdueTasks > 0 ? "text-red-600" : "text-green-600"}
          trend={kpis.overdueTasks > 0 ? "down" : "up"} onClick={() => navigate("/tasks")} />
        <KpiCard label="Pending CRs" value={kpis.pendingCRs} subtitle="submitted or in review"
          icon={AlertTriangle} color={kpis.pendingCRs > 3 ? "text-yellow-600" : "text-foreground"}
          onClick={() => navigate("/change-requests")} />
        <KpiCard label="Test Pass Rate" value={`${kpis.testPassRate}%`}
          subtitle={`${testCases.filter((t:any)=>t.status==="Passed").length}/${testCases.length} passed`}
          icon={CheckCircle2} color={kpis.testPassRate >= 80 ? "text-green-600" : "text-yellow-600"}
          onClick={() => navigate("/test-cases")} />
      </div>

      {/* ── Health + Budget + Due This Week ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Project Health */}
        <Card className="p-6">
          <SectionTitle icon={Activity} title="Project Health" />
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <ProgressRing pct={healthScore} color={healthColor} size={96} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold" style={{ color: healthColor }}>{healthScore}</span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="text-sm font-semibold">
                {healthScore >= 80 ? "On Track" : healthScore >= 60 ? "Needs Attention" : "Action Required"}
              </div>
              {risks.filter((r: any) => r.impact >= 4 && !kpis.closedStatusIds.has(r.riskStatusId)).length > 0 && (
                <div className="text-xs text-red-600">⚠ {risks.filter((r: any) => r.impact >= 4 && !kpis.closedStatusIds.has(r.riskStatusId)).length} critical risk(s)</div>
              )}
              {kpis.overdueTasks > 0 && (
                <div className="text-xs text-red-600">⚠ {kpis.overdueTasks} overdue task(s)</div>
              )}
              {kpis.blockedDeps > 0 && (
                <div className="text-xs text-orange-600">⚠ {kpis.blockedDeps} blocked dependency(ies)</div>
              )}
              {healthScore >= 80 && (
                <div className="text-xs text-green-600">✓ All indicators healthy</div>
              )}
            </div>
          </div>
        </Card>

        {/* Budget Utilization */}
        <Card className="p-6">
          <SectionTitle icon={DollarSign} title="Budget" action="View" onAction={() => navigate("/budget")} />
          {budgetUtil ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Committed / Total</span>
                <span className="font-semibold">{budgetUtil.pct}%</span>
              </div>
              <div className="w-full bg-muted/40 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${budgetUtil.pct >= 90 ? "bg-red-500" : budgetUtil.pct >= 70 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min(budgetUtil.pct, 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Total: <span className="font-medium text-foreground">{budgetUtil.currency} {budgetUtil.total.toLocaleString()}</span></div>
                <div>Spent: <span className="font-medium text-foreground">{budgetUtil.currency} {budgetUtil.spent.toLocaleString()}</span></div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground flex flex-col items-center gap-2 mt-4">
              <DollarSign className="w-8 h-8 opacity-30" />
              <span>No budget configured</span>
              <Button variant="outline" size="sm" onClick={() => navigate("/budget")}>Set Up Budget</Button>
            </div>
          )}
        </Card>

        {/* Due This Week */}
        <Card className="p-6">
          <SectionTitle icon={Calendar} title="Due This Week" />
          <div className="space-y-2.5">
            {[
              { label: "Tasks", value: dueThisWeek.tasks, color: "bg-blue-100 text-blue-700", href: "/tasks" },
              { label: "Milestones", value: dueThisWeek.milestones, color: "bg-purple-100 text-purple-700", href: "/milestones" },
              { label: "Deliverables", value: dueThisWeek.deliverables, color: "bg-green-100 text-green-700", href: "/deliverables" },
              { label: "Issues", value: dueThisWeek.issues, color: "bg-red-100 text-red-700", href: "/issues" },
            ].map(({ label, value, color, href }) => (
              <div key={label} className="flex items-center justify-between cursor-pointer hover:opacity-80" onClick={() => navigate(href)}>
                <span className="text-sm text-muted-foreground">{label}</span>
                <Badge className={`${color} border-0 font-semibold`}>{value}</Badge>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-2 mt-2">
              <span className="text-sm font-semibold">Total</span>
              <Badge variant="outline" className="font-semibold">
                {dueThisWeek.tasks + dueThisWeek.milestones + dueThisWeek.deliverables + dueThisWeek.issues}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Main Constraints ──────────────────────────────────────────── */}
      <ConstraintsWidget charter={charter} budgetUtil={budgetUtil} tasks={tasks} changeRequests={changeRequests} testCases={testCases} navigate={navigate} />

      {/* ── RAID Summary Panel ──────────────────────────────────────────── */}
      <Card className="p-6">
        <SectionTitle icon={ShieldAlert} title="RAID Summary" />
        {/* Tab strip */}
        <div className="flex gap-1 mb-4 border-b">
          {(["risks", "issues", "assumptions", "dependencies"] as const).map((tab) => {
            const counts = {
              risks: kpis.activeRisks,
              issues: kpis.openIssues,
              assumptions: kpis.openAssumptions,
              dependencies: kpis.blockedDeps,
            };
            const labels = { risks: "Risks", issues: "Issues", assumptions: "Assumptions", dependencies: "Dependencies" };
            const colors = {
              risks: "text-orange-600", issues: "text-red-600",
              assumptions: "text-blue-600", dependencies: "text-indigo-600",
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveRaidTab(tab)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeRaidTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {labels[tab]}
                <span className={`ml-1.5 text-xs font-bold ${colors[tab]}`}>{counts[tab]}</span>
              </button>
            );
          })}
        </div>

        {/* Risk tab */}
        {activeRaidTab === "risks" && (
          <div className="space-y-2">
            {/* 5×5 mini risk matrix */}
            <div className="flex gap-4 flex-wrap">
              <div>
                <div className="text-xs text-muted-foreground mb-2 font-medium">Risk Matrix (Probability × Impact)</div>
                <div className="grid gap-0.5" style={{ gridTemplateColumns: "20px repeat(5,28px)" }}>
                  <div />
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="text-center text-[9px] text-muted-foreground">{i}</div>
                  ))}
                  {[5,4,3,2,1].map(p => (
                    <React.Fragment key={`row-${p}`}>
                      <div className="text-[9px] text-muted-foreground flex items-center justify-end pr-1">{p}</div>
                      {[1,2,3,4,5].map(i => {
                        const count = riskMatrix[`${p}-${i}`] || 0;
                        const score = p * i;
                        const bg = score >= 15 ? "bg-red-500" : score >= 8 ? "bg-yellow-400" : "bg-green-400";
                        return (
                          <div key={`${p}-${i}`}
                            className={`w-7 h-7 rounded-sm flex items-center justify-center text-[10px] font-bold text-white ${count > 0 ? bg : "bg-muted/30"}`}
                            title={`P${p}×I${i}: ${count} risk(s)`}
                          >
                            {count > 0 ? count : ""}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex gap-3 mt-2 text-[9px]">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> High (≥15)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" /> Med (8-14)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-400 inline-block" /> Low (&lt;8)</span>
                </div>
              </div>
              <div className="flex-1 min-w-[200px] space-y-1.5">
                {risks.filter((r: any) => !kpis.closedStatusIds.has(r.riskStatusId) && (r.impact ?? 1) * (r.probability ?? 1) >= 9)
                  .slice(0, 5).map((r: any) => (
                  <div key={r.id} className="flex items-center gap-2 text-sm py-1 border-b last:border-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${(r.impact??1)*(r.probability??1) >= 15 ? "bg-red-500" : "bg-yellow-400"}`} />
                    <span className="flex-1 truncate text-xs">{r.title}</span>
                    <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px]">
                      P{r.probability}×I{r.impact}={((r.probability??1)*(r.impact??1))}
                    </Badge>
                  </div>
                ))}
                {risks.filter((r: any) => !kpis.closedStatusIds.has(r.riskStatusId) && (r.impact ?? 1) * (r.probability ?? 1) >= 9).length === 0 && (
                  <div className="text-xs text-muted-foreground py-4 text-center">No high/medium risks</div>
                )}
                <Button variant="ghost" size="sm" className="w-full text-xs mt-1" onClick={() => navigate("/risk-register")}>
                  View all {risks.length} risks <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Issues tab */}
        {activeRaidTab === "issues" && (
          <div className="space-y-1.5">
            {issues.filter((i: any) => i.status !== "Closed" && i.status !== "Resolved").slice(0, 6).map((issue: any) => (
              <div key={issue.id} className="flex items-center gap-2 py-1.5 border-b last:border-0 text-sm">
                <span className={`w-2 h-2 rounded-full shrink-0 ${issue.priority === "Critical" || issue.priority === "High" ? "bg-red-500" : issue.priority === "Medium" ? "bg-orange-400" : "bg-yellow-400"}`} />
                <span className="flex-1 truncate text-xs">{issue.description ?? issue.issueId ?? "—"}</span>
                <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">{issue.priority ?? "—"}</Badge>
                <Badge variant="outline" className="text-[10px]">{issue.status}</Badge>
              </div>
            ))}
            {kpis.openIssues === 0 && <div className="text-xs text-muted-foreground py-4 text-center">No open issues</div>}
            <Button variant="ghost" size="sm" className="w-full text-xs mt-1" onClick={() => navigate("/issues")}>
              View all {issues.length} issues <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}

        {/* Assumptions tab */}
        {activeRaidTab === "assumptions" && (
          <div className="space-y-1.5">
            {assumptions.filter((a: any) => a.status !== "Closed" && a.status !== "Rejected").slice(0, 6).map((a: any) => (
              <div key={a.id} className="flex items-center gap-2 py-1.5 border-b last:border-0 text-sm">
                <FileCheck className="w-3 h-3 text-blue-500 shrink-0" />
                <span className="flex-1 truncate text-xs">{a.description ?? a.title ?? "—"}</span>
                <Badge variant="outline" className="text-[10px]">{a.status ?? "Open"}</Badge>
              </div>
            ))}
            {kpis.openAssumptions === 0 && <div className="text-xs text-muted-foreground py-4 text-center">No open assumptions</div>}
            <Button variant="ghost" size="sm" className="w-full text-xs mt-1" onClick={() => navigate("/assumptions")}>
              View all {assumptions.length} assumptions <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}

        {/* Dependencies tab */}
        {activeRaidTab === "dependencies" && (
          <div className="space-y-1.5">
            {dependencies.filter((d: any) => /blocked|at risk|pending/i.test(d.currentStatus ?? "")).slice(0, 6).map((d: any) => (
              <div key={d.id} className="flex items-center gap-2 py-1.5 border-b last:border-0 text-sm">
                <span className={`w-2 h-2 rounded-full shrink-0 ${/blocked/i.test(d.currentStatus ?? "") ? "bg-red-500" : /at risk/i.test(d.currentStatus ?? "") ? "bg-orange-400" : "bg-yellow-400"}`} />
                <span className="flex-1 truncate text-xs">{d.description ?? d.dependencyId ?? "—"}</span>
                <Badge className={`border-0 text-[10px] ${/blocked/i.test(d.currentStatus ?? "") ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{d.currentStatus ?? "—"}</Badge>
              </div>
            ))}
            {dependencies.filter((d: any) => /blocked|at risk|pending/i.test(d.currentStatus ?? "")).length === 0 && (
              <div className="text-xs text-muted-foreground py-4 text-center">No blocked or at-risk dependencies</div>
            )}
            <Button variant="ghost" size="sm" className="w-full text-xs mt-1" onClick={() => navigate("/dependencies")}>
              View all {dependencies.length} dependencies <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}
      </Card>

      {/* ── Milestones + Deliverables ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <SectionTitle icon={Flag} title="Milestones" action="View All" onAction={() => navigate("/milestones")} />
          {milestones.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No milestones defined. <Button variant="link" size="sm" onClick={() => navigate("/milestones")}>Add one</Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 text-center mb-3">
                {[
                  { label: "Total", value: milestoneSummary.total },
                  { label: "Achieved", value: milestoneSummary.achieved, color: "text-green-600" },
                  { label: "Overdue", value: milestoneSummary.overdue, color: "text-red-600" },
                  { label: "Red RAG", value: milestoneSummary.red, color: "text-red-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-muted/30 rounded-lg p-2">
                    <div className={`text-xl font-bold ${color ?? ""}`}>{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
              {milestoneSummary.upcoming.map((m: any) => (
                <div key={m.id} className="flex items-center gap-2 text-sm py-1.5 border-b last:border-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${RAG_DOT[m.ragStatus ?? "Green"]}`} />
                  <span className="flex-1 truncate text-xs">{m.title}</span>
                  <span className="text-xs text-muted-foreground">{m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "—"}</span>
                  <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <SectionTitle icon={Package} title="Deliverables" action="View All" onAction={() => navigate("/deliverables")} />
          {deliverables.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No deliverables defined.</div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                {[
                  { label: "Total", value: deliverables.length },
                  { label: "Completed", value: deliverables.filter((d: any) => d.status === "Completed" || d.status === "Accepted").length, color: "text-green-600" },
                  { label: "Overdue", value: deliverables.filter((d: any) => d.dueDate && new Date(d.dueDate) < today && d.status !== "Completed" && d.status !== "Accepted").length, color: "text-red-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-muted/30 rounded-lg p-2">
                    <div className={`text-xl font-bold ${color ?? ""}`}>{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
              {deliverables.slice(0, 4).map((d: any) => (
                <div key={d.id} className="flex items-center gap-2 text-sm py-1.5 border-b last:border-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${d.status === "Completed" || d.status === "Accepted" ? "bg-green-500" : d.status === "In Progress" ? "bg-blue-500" : "bg-gray-300"}`} />
                  <span className="flex-1 truncate text-xs">{d.title}</span>
                  <span className="text-xs text-muted-foreground">{d.dueDate ? new Date(d.dueDate).toLocaleDateString() : "—"}</span>
                  <Badge variant="outline" className="text-[10px]">{d.status ?? "—"}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Team + Action Items ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <SectionTitle icon={Users} title="Team Overview" action="View" onAction={() => navigate("/stakeholders")} />
          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            {[
              { label: "Total", value: stakeholders.length },
              { label: "Manage Closely", value: stakeholders.filter((s: any) => s.engagementStrategy === "Manage Closely").length, color: "text-red-600" },
              { label: "Unassigned", value: stakeholders.filter((s: any) => !s.engagementStrategy).length, color: "text-muted-foreground" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-2">
                <div className={`text-xl font-bold ${color ?? ""}`}>{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            {stakeholders.slice(0, 4).map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 py-1 border-b last:border-0">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                  {s.fullName?.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 truncate text-xs">{s.fullName}</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{s.position ?? ""}</span>
                {s.engagementStrategy && (
                  <Badge className="text-[9px] border-0 bg-muted text-muted-foreground">{s.engagementStrategy}</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle icon={Zap} title="Open Action Items" action="View All" onAction={() => navigate("/tasks?filter=action-items")} />
          {kpis.actionItemTasks === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No open action items.</div>
          ) : (
            <div className="space-y-1.5">
              {tasks.filter((t: any) => t.isActionItem && t.status !== "Done" && t.status !== "Completed").slice(0, 5).map((t: any) => {
                const isOverdue = t.dueDate && new Date(t.dueDate) < today;
                return (
                  <div key={t.id} className="flex items-start gap-2 py-1.5 border-b last:border-0 text-sm">
                    <Badge className={`${t.status === "In Progress" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"} border-0 shrink-0 text-[10px]`}>{t.status}</Badge>
                    <span className="flex-1 truncate text-xs">{t.title}</span>
                    {isOverdue && <span className="text-[10px] text-red-500 shrink-0 font-medium">Overdue</span>}
                  </div>
                );
              })}
              {kpis.actionItemTasks > 5 && (
                <div className="text-xs text-muted-foreground text-center pt-1">+{kpis.actionItemTasks - 5} more</div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tasks by Status donut */}
        <Card className="p-6">
          <SectionTitle icon={CheckSquare} title="Tasks by Status" />
          {tasksByStatus.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={tasksByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                  {tasksByStatus.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Tasks by Person bar */}
        <Card className="p-6">
          <SectionTitle icon={Users} title="Tasks by Person (Top 8)" />
          {tasksByPerson.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tasksByPerson} margin={{ bottom: 40 }}>
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 10 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Radar: project completion dimensions */}
        <Card className="p-6">
          <SectionTitle icon={Target} title="Completion by Dimension" />
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <Radar name="%" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
              <Tooltip formatter={(v: any) => `${v}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Cumulative Flow Diagram ──────────────────────────────────── */}
      <CumulativeFlowChart projectId={projectId} />

      {/* ── Recent Activity ─────────────────────────────────────────────── */}
      <Card className="p-6">
        <SectionTitle icon={Activity} title="Recent Activity" />
        {logsLoading ? (
          <div className="flex items-center justify-center h-24"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : recentLogs.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">No activity recorded yet.</div>
        ) : (
          <div className="space-y-0">
            {recentLogs.map((log: any, idx: number) => {
              const EntityIcon = ENTITY_ICON[log.entityType] ?? Activity;
              const colorClass = ENTITY_COLOR[log.entityType] ?? "bg-gray-100 text-gray-700";
              const fields = Object.keys(log.changedFields as Record<string, any>);
              return (
                <div key={log.id} className={`flex items-start gap-3 py-2.5 ${idx < recentLogs.length - 1 ? "border-b" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                    <EntityIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm capitalize font-medium">{log.entityType}</span>
                    {log.entityId && (
                      <span className="text-xs text-muted-foreground ml-1.5 font-mono">{log.entityId}</span>
                    )}
                    <span className="text-sm text-muted-foreground ml-1">
                      — {fields.length > 0 ? fields.slice(0, 3).join(", ") + (fields.length > 3 ? ` +${fields.length - 3}` : "") + " updated" : "modified"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">{timeAgo(log.changedAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
