import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Loader2, AlertTriangle, CheckCircle2, Clock, FileText, BarChart2,
  Activity, Flag, DollarSign, TrendingUp, TrendingDown, Minus,
  ShieldAlert, Target, LayoutGrid,
} from "lucide-react";
import { WidgetGrid, type Widget } from "@/components/widgets/WidgetGrid";
import { KpiWidget } from "@/components/widgets/KpiWidget";
import { BarChartWidget } from "@/components/widgets/BarChartWidget";
import { StatusRingWidget } from "@/components/widgets/StatusRingWidget";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#64748b"];

const RAG_DOT: Record<string, string> = {
  Green: "bg-green-500",
  Amber: "bg-yellow-500",
  Red: "bg-red-500",
};
const RAG_TEXT: Record<string, string> = {
  Green: "text-green-700",
  Amber: "text-yellow-700",
  Red: "text-red-700",
};

function KpiCard({ label, value, subtitle, trend, color }: {
  label: string; value: string | number; subtitle?: string; trend?: "up" | "down" | "neutral"; color?: string;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground";
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-3xl font-bold ${color ?? ""}`}>{value}</div>
      {subtitle && (
        <div className="flex items-center gap-1 mt-1">
          {trend && <TrendIcon className={`w-3 h-3 ${trendColor}`} />}
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      )}
    </Card>
  );
}

function HealthCircle({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-green-600 border-green-500" :
    score >= 60 ? "text-yellow-600 border-yellow-500" :
    "text-red-600 border-red-500";
  return (
    <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${color}`}>
      <span className="text-2xl font-bold">{score}</span>
    </div>
  );
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const { currentProjectId } = useProject();
  const [, navigate] = useLocation();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

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
  const { data: actionItems = [] } = trpc.actionItems.list.useQuery({ projectId }, { enabled });

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const nextWeek = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + 7); return d; }, [today]);

  const kpis = useMemo(() => {
    const openIssues = issues.filter((i: any) => i.status !== "Closed" && i.status !== "Resolved").length;
    const overdueTasks = tasks.filter((t: any) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate); due.setHours(0, 0, 0, 0);
      return due < today && t.status !== "Done" && t.status !== "Completed" && t.status !== "Closed";
    }).length;
    const pendingCRs = changeRequests.filter((c: any) => c.status === "Submitted" || c.status === "Under Review").length;
    const activeRisks = risks.filter((r: any) => r.status !== "Closed" && r.status !== "Mitigated").length;
    const passedTests = testCases.filter((t: any) => t.status === "Passed").length;
    const testPassRate = testCases.length > 0 ? Math.round((passedTests / testCases.length) * 100) : 0;
    const doneTasks = tasks.filter((t: any) => t.status === "Done" || t.status === "Completed" || t.status === "Closed").length;
    const taskCompletion = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
    const openActionItems = actionItems.filter((a: any) => a.status === "Open" || a.status === "In Progress").length;
    return { openIssues, overdueTasks, pendingCRs, activeRisks, testPassRate, taskCompletion, openActionItems };
  }, [issues, tasks, changeRequests, risks, testCases, actionItems, today]);

  const healthScore = useMemo(() => {
    let score = 100;
    const criticalRisks = risks.filter((r: any) => r.impact >= 4 && (r.status !== "Closed" && r.status !== "Mitigated")).length;
    score -= criticalRisks * 10;
    score -= Math.min(kpis.overdueTasks * 5, 30);
    const crPendingRate = changeRequests.length > 0 ? kpis.pendingCRs / changeRequests.length : 0;
    if (crPendingRate > 0.2) score -= 10;
    if (milestones.some((m: any) => m.ragStatus === "Red")) score -= 10;
    return Math.max(0, score);
  }, [risks, kpis, changeRequests, milestones]);

  const reqByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    requirements.forEach((r: any) => { const s = r.status || "Unknown"; map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [requirements]);

  const tasksByPerson = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t: any) => { const p = t.responsible || "Unassigned"; map[p] = (map[p] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
  }, [tasks]);

  const dueThisWeek = useMemo(() => {
    const isThisWeek = (dateStr: string | null | undefined) => {
      if (!dateStr) return false;
      const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
      return d >= today && d <= nextWeek;
    };
    const tasksDue = tasks.filter((t: any) => isThisWeek(t.dueDate)).length;
    const issuesDue = issues.filter((i: any) => isThisWeek(i.updateDate)).length;
    const deliverablesDue = deliverables.filter((d: any) => isThisWeek(d.dueDate)).length;
    const milestonesDue = milestones.filter((m: any) => isThisWeek(m.dueDate) && m.status !== "Achieved").length;
    return { tasksDue, issuesDue, deliverablesDue, milestonesDue, total: tasksDue + issuesDue + deliverablesDue + milestonesDue };
  }, [tasks, issues, deliverables, milestones, today, nextWeek]);

  // Budget utilization
  const budgetUtil = useMemo(() => {
    if (!budgetSummary) return null;
    const total = parseFloat((budgetSummary as any).totalBudget ?? "0");
    const spent = parseFloat((budgetSummary as any).totalActual ?? "0");
    const committed = parseFloat((budgetSummary as any).totalCommitted ?? "0") + spent;
    const pct = total > 0 ? Math.round((committed / total) * 100) : 0;
    return { total, spent, committed, pct, currency: (budgetSummary as any).currency ?? "USD" };
  }, [budgetSummary]);

  // Milestone summary
  const milestoneSummary = useMemo(() => ({
    total: milestones.length,
    achieved: milestones.filter((m: any) => m.status === "Achieved").length,
    overdue: milestones.filter((m: any) => m.dueDate && m.status !== "Achieved" && new Date(m.dueDate) < today).length,
    red: milestones.filter((m: any) => m.ragStatus === "Red").length,
    upcoming: milestones.filter((m: any) => m.status === "Upcoming" || m.status === "In Progress").slice(0, 3),
  }), [milestones, today]);

  const recentLogs = useMemo(() => [...actionLogs].slice(0, 8), [actionLogs]);

  const isLoading = reqLoading || issuesLoading || tasksLoading || crLoading || risksLoading || testLoading;

  const WIDGET_STORAGE_KEY = "dashboard-widgets";
  const DEFAULT_WIDGETS: Widget[] = [
    { id: "task-completion", type: "kpi", title: "Task Completion", size: "sm" },
    { id: "open-issues", type: "kpi", title: "Open Issues", size: "sm" },
    { id: "active-risks", type: "kpi", title: "Active Risks", size: "sm" },
    { id: "test-pass-rate", type: "kpi", title: "Test Pass Rate", size: "sm" },
    { id: "tasks-by-person", type: "bar", title: "Tasks by Responsible", size: "md" },
    { id: "task-done-ring", type: "ring", title: "Tasks Done", size: "sm" },
  ];
  const [widgets, setWidgets] = useState<Widget[]>(() => {
    try {
      const saved = localStorage.getItem(WIDGET_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_WIDGETS;
  });
  const [widgetEditMode, setWidgetEditMode] = useState(false);

  function saveWidgets(next: Widget[]) {
    setWidgets(next);
    localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(next));
  }

  function renderWidget(widget: Widget) {
    switch (widget.id) {
      case "task-completion":
        return <KpiWidget label="Task Completion" value={`${kpis.taskCompletion}%`} subtitle="of all tasks done" color={kpis.taskCompletion >= 75 ? "text-green-600" : "text-yellow-600"} />;
      case "open-issues":
        return <KpiWidget label="Open Issues" value={`${kpis.openIssues}/${issues.length}`} subtitle="not closed" color={kpis.openIssues > 5 ? "text-red-600" : "text-foreground"} />;
      case "active-risks":
        return <KpiWidget label="Active Risks" value={kpis.activeRisks} subtitle="not mitigated" color={kpis.activeRisks > 5 ? "text-red-600" : "text-foreground"} />;
      case "test-pass-rate":
        return <KpiWidget label="Test Pass Rate" value={`${kpis.testPassRate}%`} subtitle={`${testCases.filter((t: any) => t.status === "Passed").length}/${testCases.length} passed`} color={kpis.testPassRate >= 80 ? "text-green-600" : "text-yellow-600"} />;
      case "tasks-by-person":
        return <BarChartWidget data={tasksByPerson.map((d: any) => ({ name: d.name, value: d.count }))} />;
      case "task-done-ring":
        return <StatusRingWidget label="Tasks Done" value={tasks.filter((t: any) => ["Done","Completed","Closed"].includes(t.status)).length} max={tasks.length} color="#22c55e" />;
      default:
        return <div className="text-sm text-muted-foreground p-4">Unknown widget</div>;
    }
  }

  if (!currentProjectId) {
    return <div className="p-6 flex items-center justify-center h-64 text-muted-foreground">Select a project to view the dashboard.</div>;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const ragStatus = (charter as any)?.ragStatus ?? "Green";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-muted-foreground" /> Project Dashboard
            </h1>
            {currentProject && <p className="text-muted-foreground text-sm mt-1">{currentProject.name}</p>}
          </div>
          <div className="flex items-center gap-3">
            {charter && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium cursor-pointer hover:opacity-80"
                onClick={() => navigate("/charter")}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${RAG_DOT[ragStatus]}`} />
                <span className={RAG_TEXT[ragStatus]}>Project RAG: {ragStatus}</span>
              </div>
            )}
            {(charter as any)?.phase && (
              <Badge variant="outline">{(charter as any).phase}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <KpiCard label="Task Completion" value={`${kpis.taskCompletion}%`} subtitle="of all tasks done" color={kpis.taskCompletion >= 75 ? "text-green-600" : kpis.taskCompletion >= 50 ? "text-yellow-600" : "text-red-600"} />
        <KpiCard label="Requirements" value={requirements.length} subtitle="all statuses" />
        <KpiCard label="Open Issues" value={`${kpis.openIssues}/${issues.length}`} subtitle="not closed" color={kpis.openIssues > 5 ? "text-red-600" : "text-foreground"} />
        <KpiCard label="Overdue Tasks" value={kpis.overdueTasks} subtitle="past due date" color={kpis.overdueTasks > 0 ? "text-red-600" : "text-green-600"} trend={kpis.overdueTasks > 0 ? "down" : "up"} />
        <KpiCard label="Pending CRs" value={kpis.pendingCRs} subtitle="submitted or in review" color={kpis.pendingCRs > 3 ? "text-yellow-600" : "text-foreground"} />
        <KpiCard label="Active Risks" value={kpis.activeRisks} subtitle="not closed or mitigated" color={kpis.activeRisks > 5 ? "text-red-600" : "text-foreground"} />
        <KpiCard label="Test Pass Rate" value={`${kpis.testPassRate}%`} subtitle={`${testCases.filter((t: any) => t.status === "Passed").length}/${testCases.length} passed`} color={kpis.testPassRate >= 80 ? "text-green-600" : "text-yellow-600"} />
      </div>

      {/* Health Score + Charter + Due This Week */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-6">
            <HealthCircle score={healthScore} />
            <div>
              <div className="text-lg font-semibold">Project Health</div>
              <div className="text-sm text-muted-foreground mt-1">
                {healthScore >= 80 ? "On track" : healthScore >= 60 ? "Needs attention" : "Immediate action required"}
              </div>
              <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                {risks.filter((r: any) => r.impact >= 4 && r.status !== "Closed").length > 0 && (
                  <div>⚠ Critical risks: -{Math.min(risks.filter((r: any) => r.impact >= 4 && r.status !== "Closed").length * 10, 100)} pts</div>
                )}
                {kpis.overdueTasks > 0 && <div>⚠ Overdue tasks: -{Math.min(kpis.overdueTasks * 5, 30)} pts</div>}
              </div>
            </div>
          </div>
        </Card>

        {/* Budget Utilization */}
        <Card className="p-6">
          <div className="text-lg font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-muted-foreground" /> Budget Utilization
          </div>
          {budgetUtil ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Committed</span>
                <span className="font-semibold">{budgetUtil.pct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${budgetUtil.pct >= 90 ? "bg-red-500" : budgetUtil.pct >= 70 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min(budgetUtil.pct, 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Total: {budgetUtil.currency} {budgetUtil.total.toLocaleString()}</div>
                <div>Spent: {budgetUtil.currency} {budgetUtil.spent.toLocaleString()}</div>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/budget")}>View Budget</Button>
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
          <div className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" /> Due This Week
          </div>
          <div className="space-y-3">
            {[
              { label: "Tasks", value: dueThisWeek.tasksDue, color: "bg-blue-100 text-blue-700", href: "/tasks" },
              { label: "Milestones", value: dueThisWeek.milestonesDue, color: "bg-purple-100 text-purple-700", href: "/milestones" },
              { label: "Deliverables", value: dueThisWeek.deliverablesDue, color: "bg-green-100 text-green-700", href: "/deliverables" },
              { label: "Issues", value: dueThisWeek.issuesDue, color: "bg-red-100 text-red-700", href: "/issues" },
            ].map(({ label, value, color, href }) => (
              <div key={label} className="flex items-center justify-between cursor-pointer hover:opacity-80" onClick={() => navigate(href)}>
                <span className="text-sm text-muted-foreground">{label}</span>
                <Badge className={`${color} hover:${color} border-0`}>{value}</Badge>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm font-semibold">Total</span>
              <Badge variant="outline">{dueThisWeek.total}</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Milestones + Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Milestone Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold flex items-center gap-2">
              <Flag className="w-5 h-5 text-muted-foreground" /> Milestones
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/milestones")}>View All</Button>
          </div>
          {milestones.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No milestones defined. <Button variant="link" size="sm" onClick={() => navigate("/milestones")}>Add one</Button></div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 text-center mb-3">
                {[
                  { label: "Total", value: milestoneSummary.total },
                  { label: "Achieved", value: milestoneSummary.achieved, color: "text-green-600" },
                  { label: "Overdue", value: milestoneSummary.overdue, color: "text-red-600" },
                  { label: "Red RAG", value: milestoneSummary.red, color: "text-red-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-muted/30 rounded p-2">
                    <div className={`text-xl font-bold ${color ?? ""}`}>{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
              {milestoneSummary.upcoming.map((m: any) => {
                const ragDot = RAG_DOT[m.ragStatus ?? "Green"];
                return (
                  <div key={m.id} className="flex items-center gap-2 text-sm py-1 border-b last:border-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${ragDot}`} />
                    <span className="flex-1 truncate">{m.title}</span>
                    <span className="text-xs text-muted-foreground">{m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "—"}</span>
                    <Badge variant="outline" className="text-xs">{m.status}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Open Action Items */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-muted-foreground" /> Open Action Items
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/action-items")}>View All</Button>
          </div>
          {kpis.openActionItems === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No open action items.</div>
          ) : (
            <div className="space-y-2">
              {actionItems
                .filter((a: any) => a.status === "Open" || a.status === "In Progress")
                .slice(0, 5)
                .map((item: any) => {
                  const isOverdue = item.dueDate && new Date(item.dueDate) < today;
                  return (
                    <div key={item.id} className="flex items-start gap-2 py-1 border-b last:border-0 text-sm">
                      <Badge className={item.status === "In Progress" ? "bg-purple-100 text-purple-700 border-0 shrink-0" : "bg-blue-100 text-blue-700 border-0 shrink-0"}>{item.status}</Badge>
                      <span className="flex-1 truncate">{item.description}</span>
                      {isOverdue && <span className="text-xs text-red-500 shrink-0">Overdue</span>}
                    </div>
                  );
                })}
              {kpis.openActionItems > 5 && (
                <div className="text-xs text-muted-foreground text-center pt-1">+{kpis.openActionItems - 5} more</div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* RAID Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "High Risks", value: risks.filter((r: any) => r.score >= 9 && r.status !== "Closed" && r.status !== "Mitigated").length, icon: ShieldAlert, color: "text-red-600", href: "/risk-register" },
          { label: "Open Issues", value: kpis.openIssues, icon: AlertTriangle, color: "text-orange-600", href: "/issues" },
          { label: "Active Assumptions", value: 0, icon: FileText, color: "text-blue-600", href: "/assumptions" },
          { label: "Open Actions", value: kpis.openActionItems, icon: CheckCircle2, color: "text-purple-600", href: "/action-items" },
        ].map(({ label, value, icon: Icon, color, href }) => (
          <Card key={label} className="p-4 cursor-pointer hover:bg-muted/30" onClick={() => navigate(href)}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" /> Requirements by Status
          </h3>
          {reqByStatus.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={reqByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                  {reqByStatus.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-muted-foreground" /> Tasks by Responsible (Top 8)
          </h3>
          {tasksByPerson.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tasksByPerson} margin={{ bottom: 40 }}>
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Customizable Widget Panel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-muted-foreground" /> Quick Widgets
          </h3>
          <div className="flex items-center gap-2">
            {widgetEditMode && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground"
                onClick={() => saveWidgets(DEFAULT_WIDGETS)}
              >
                Reset
              </Button>
            )}
            <Button
              size="sm"
              variant={widgetEditMode ? "default" : "outline"}
              onClick={() => setWidgetEditMode((v) => !v)}
            >
              {widgetEditMode ? "Done" : "Customize"}
            </Button>
          </div>
        </div>
        <WidgetGrid
          widgets={widgets}
          editMode={widgetEditMode}
          onReorder={saveWidgets}
          onRemove={(id) => saveWidgets(widgets.filter((w) => w.id !== id))}
          onConfigure={() => {}}
          renderWidget={renderWidget}
        />
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" /> Recent Activity
        </h3>
        {logsLoading ? (
          <div className="flex items-center justify-center h-24"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : recentLogs.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">No activity recorded yet.</div>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                <Badge variant="outline" className="shrink-0 capitalize">{log.entityType}</Badge>
                <div className="flex-1 min-w-0">
                  <span className="text-sm">
                    {log.entityId && <span className="font-mono text-xs text-muted-foreground mr-2">{log.entityId}</span>}
                    {Object.keys(log.changedFields as Record<string, any>).join(", ")} changed
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{timeAgo(log.changedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
