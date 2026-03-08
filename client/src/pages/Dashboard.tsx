import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle2, Clock, FileText, BarChart2, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#64748b"];

function KpiCard({ label, value, subtitle }: { label: string; value: string | number; subtitle?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
      {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
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
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const { data: projects } = trpc.projects.list.useQuery(undefined, { enabled });
  const currentProject = projects?.find((p: any) => p.id === currentProjectId);

  const { data: requirements = [], isLoading: reqLoading } = trpc.requirements.list.useQuery({ projectId }, { enabled });
  const { data: issues = [], isLoading: issuesLoading } = trpc.issues.list.useQuery({ projectId }, { enabled });
  const { data: tasks = [], isLoading: tasksLoading } = trpc.tasks.list.useQuery({ projectId }, { enabled });
  const { data: changeRequests = [], isLoading: crLoading } = trpc.changeRequests.list.useQuery({ projectId }, { enabled });
  const { data: risks = [], isLoading: risksLoading } = trpc.risks.list.useQuery({ projectId }, { enabled });
  const { data: testCases = [], isLoading: testLoading } = trpc.testCases.list.useQuery({ projectId }, { enabled });
  const { data: actionLogs = [], isLoading: logsLoading } = trpc.actionLogs.list.useQuery(undefined, { enabled });
  const { data: deliverables = [] } = trpc.deliverables.list.useQuery({ projectId }, { enabled });

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

    return { openIssues, overdueTasks, pendingCRs, activeRisks, testPassRate };
  }, [issues, tasks, changeRequests, risks, testCases, today]);

  const healthScore = useMemo(() => {
    let score = 100;
    const criticalRisks = risks.filter((r: any) => r.impact >= 4 && (r.status !== "Closed" && r.status !== "Mitigated")).length;
    score -= criticalRisks * 10;
    score -= Math.min(kpis.overdueTasks * 5, 30);
    const crPendingRate = changeRequests.length > 0 ? kpis.pendingCRs / changeRequests.length : 0;
    if (crPendingRate > 0.2) score -= 10;
    return Math.max(0, score);
  }, [risks, kpis, changeRequests]);

  const reqByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    requirements.forEach((r: any) => {
      const s = r.status || "Unknown";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [requirements]);

  const tasksByPerson = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t: any) => {
      const p = t.responsible || "Unassigned";
      map[p] = (map[p] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
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
    return { tasksDue, issuesDue, deliverablesDue, total: tasksDue + issuesDue + deliverablesDue };
  }, [tasks, issues, deliverables, today, nextWeek]);

  const recentLogs = useMemo(() => [...actionLogs].slice(0, 8), [actionLogs]);

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-gray-500" />
          Project Dashboard
        </h1>
        {currentProject && (
          <p className="text-gray-500 text-sm mt-1">{currentProject.name}</p>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Total Requirements" value={requirements.length} subtitle="all statuses" />
        <KpiCard
          label="Open Issues"
          value={`${kpis.openIssues}/${issues.length}`}
          subtitle="not closed or resolved"
        />
        <KpiCard
          label="Overdue Tasks"
          value={kpis.overdueTasks}
          subtitle="past due date"
        />
        <KpiCard
          label="Pending CRs"
          value={kpis.pendingCRs}
          subtitle="submitted or under review"
        />
        <KpiCard
          label="Active Risks"
          value={kpis.activeRisks}
          subtitle="not closed or mitigated"
        />
        <KpiCard
          label="Test Pass Rate"
          value={`${kpis.testPassRate}%`}
          subtitle={`${testCases.filter((t: any) => t.status === "Passed").length}/${testCases.length} passed`}
        />
      </div>

      {/* Health Score + Due This Week */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-6">
            <HealthCircle score={healthScore} />
            <div>
              <div className="text-lg font-semibold">Project Health Score</div>
              <div className="text-sm text-muted-foreground mt-1">
                {healthScore >= 80 ? "Project is on track" :
                 healthScore >= 60 ? "Some issues need attention" :
                 "Immediate action required"}
              </div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div>Critical risks: -{Math.min(risks.filter((r: any) => r.impact >= 4 && r.status !== "Closed" && r.status !== "Mitigated").length * 10, 100)} pts</div>
                <div>Overdue tasks: -{Math.min(kpis.overdueTasks * 5, 30)} pts (cap 30)</div>
                {changeRequests.length > 0 && kpis.pendingCRs / changeRequests.length > 0.2 && (
                  <div>High CR backlog: -10 pts</div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Due This Week
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tasks</span>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{dueThisWeek.tasksDue}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Issues</span>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{dueThisWeek.issuesDue}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Deliverables</span>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{dueThisWeek.deliverablesDue}</Badge>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm font-semibold">Total</span>
              <Badge variant="outline">{dueThisWeek.total}</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Requirements by Status
          </h3>
          {reqByStatus.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={reqByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  labelLine={false}
                >
                  {reqByStatus.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            Tasks by Responsible (Top 8)
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

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          Recent Activity
        </h3>
        {logsLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
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
