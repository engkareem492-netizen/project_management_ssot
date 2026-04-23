import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  IterationCw, BookOpen, Layers, Zap, TrendingUp, CheckCircle2, AlertCircle, BarChart3
} from "lucide-react";
import { Link } from "wouter";

// ─── Colour helpers ───────────────────────────────────────────────────────────
const PRIORITY_COLOR: Record<string, string> = {
  Critical: "bg-red-500/20 text-red-300 border-red-500/30",
  High:     "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Medium:   "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Low:      "bg-slate-500/20 text-slate-300 border-slate-500/30",
};
const STATUS_COLOR: Record<string, string> = {
  New:              "bg-slate-500/20 text-slate-300 border-slate-500/30",
  "In Analysis":    "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "In Development": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "In Test":        "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Done:             "bg-green-500/20 text-green-300 border-green-500/30",
  Rejected:         "bg-red-500/20 text-red-300 border-red-500/30",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, accent, sub,
}: {
  label: string; value: string | number; icon: React.ElementType; accent: string; sub?: string;
}) {
  return (
    <Card className="bg-card/60 border-border/40">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl font-bold" style={{ color: accent }}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="rounded-lg p-2" style={{ background: accent + "22" }}>
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Velocity bar chart ───────────────────────────────────────────────────────
function VelocityChart({ data }: { data: { name: string; velocity: number }[] }) {
  const max = Math.max(...data.map(d => d.velocity), 1);
  return (
    <div className="flex items-end gap-3 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <div className="flex items-end w-full" style={{ height: 80 }}>
            <div
              className="w-full rounded-t bg-purple-500"
              style={{ height: `${(d.velocity / max) * 76}px`, minHeight: d.velocity > 0 ? 3 : 0 }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground truncate w-full text-center">{d.name}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Agile Dashboard ──────────────────────────────────────────────────────────
function AgileDashboardContent() {
  const { currentProjectId } = useProject();
  const pid = currentProjectId!;

  const { data: backlogStats } = trpc.sprints.backlogStats.useQuery({ projectId: pid }, { enabled: !!pid });
  const { data: velocityHistory = [] } = trpc.sprints.velocityHistory.useQuery({ projectId: pid }, { enabled: !!pid });
  const { data: activeSprint } = trpc.sprints.activeSprint.useQuery({ projectId: pid }, { enabled: !!pid });
  const { data: sprints = [] } = trpc.sprints.list.useQuery({ projectId: pid }, { enabled: !!pid });
  const { data: userStories = [] } = trpc.userStories.list.useQuery({ projectId: pid }, { enabled: !!pid });

  const totalStories   = backlogStats?.total ?? 0;
  const totalPoints    = backlogStats?.totalPoints ?? 0;
  const unestimated    = backlogStats?.unestimated ?? 0;
  const doneStories    = userStories.filter(s => s.status === "Done").length;

  // Active sprint progress
  const sprintStories  = activeSprint ? userStories.filter(s => s.sprintId === activeSprint.id) : [];
  const sprintDone     = sprintStories.filter(s => s.status === "Done").length;
  const sprintPct      = sprintStories.length > 0 ? Math.round((sprintDone / sprintStories.length) * 100) : 0;
  const sprintPoints   = sprintStories.reduce((acc, s) => acc + (s.storyPoints ?? 0), 0);
  const sprintDonePoints = sprintStories.filter(s => s.status === "Done").reduce((acc, s) => acc + (s.storyPoints ?? 0), 0);

  // Days remaining in active sprint
  const daysRemaining = activeSprint?.endDate
    ? Math.max(0, Math.ceil((new Date(activeSprint.endDate).getTime() - Date.now()) / 86400000))
    : null;

  const avgVelocity = velocityHistory.length > 0
    ? Math.round(velocityHistory.reduce((a, v) => a + v.velocity, 0) / velocityHistory.length)
    : 0;

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Backlog Size"    value={totalStories}  icon={BookOpen}    accent="#8b5cf6" sub={`${totalPoints} story points`} />
        <StatCard label="Total Stories"   value={totalStories}  icon={Layers}      accent="#3b82f6" sub={`${doneStories} done`} />
        <StatCard label="Story Points"    value={totalPoints}   icon={Zap}         accent="#f59e0b" sub={`${unestimated} unestimated`} />
        <StatCard label="Avg Velocity"    value={avgVelocity}   icon={TrendingUp}  accent="#22c55e" sub="pts / sprint" />
      </div>

      {/* Active Sprint card */}
      {activeSprint ? (
        <Card className="bg-card/60 border-border/40 border-l-4" style={{ borderLeftColor: "#8b5cf6" }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <IterationCw className="h-4 w-4 text-purple-400" />
                Active Sprint: <span className="text-purple-300">{activeSprint.name}</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                {daysRemaining !== null && (
                  <Badge variant="outline" className="text-xs border-purple-500/40 text-purple-300">
                    {daysRemaining}d remaining
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs border-green-500/40 text-green-300">Active</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeSprint.goal && (
              <p className="text-xs text-muted-foreground italic">Goal: {activeSprint.goal}</p>
            )}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Stories: {sprintDone}/{sprintStories.length}</span>
                <span className="text-muted-foreground">Points: {sprintDonePoints}/{sprintPoints}</span>
                <span className="font-medium text-purple-300">{sprintPct}% complete</span>
              </div>
              <Progress value={sprintPct} className="h-2" />
            </div>

            {/* Sprint story breakdown by status */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
              {["New", "In Analysis", "In Development", "In Test", "Done", "Rejected"].map(st => {
                const count = sprintStories.filter(s => s.status === st).length;
                return (
                  <div key={st} className="text-center">
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">{st}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/60 border-border/40">
          <CardContent className="flex items-center gap-3 py-6 text-muted-foreground">
            <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0" />
            <div>
              <p className="text-sm font-medium">No active sprint</p>
              <p className="text-xs">
                <Link href="/sprints" className="text-purple-400 underline hover:text-purple-300">Create a sprint</Link>
                {" "}to start tracking progress.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Velocity chart */}
      {velocityHistory.length > 0 && (
        <Card className="bg-card/60 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" /> Sprint Velocity
              <span className="text-xs text-muted-foreground font-normal ml-auto">
                <span className="inline-block w-3 h-3 rounded bg-purple-500/30 border border-purple-500/50 mr-1" />committed
                <span className="inline-block w-3 h-3 rounded bg-purple-500 ml-2 mr-1" />completed
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VelocityChart data={velocityHistory} />
          </CardContent>
        </Card>
      )}

      {/* Backlog health */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card/60 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-400" /> Backlog by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["New", "In Analysis", "In Development", "In Test", "Done", "Rejected"].map(st => {
                const count = userStories.filter(s => s.status === st).length;
                const pct = totalStories > 0 ? Math.round((count / totalStories) * 100) : 0;
                return (
                  <div key={st} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-28 shrink-0">{st}</span>
                    <div className="flex-1 bg-border/30 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: st === "Done" ? "#22c55e" : st === "Rejected" ? "#ef4444" : "#8b5cf6",
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" /> Backlog by Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["Critical", "High", "Medium", "Low"].map(p => {
                const count = userStories.filter(s => s.priority === p).length;
                const pct = totalStories > 0 ? Math.round((count / totalStories) * 100) : 0;
                const color = p === "Critical" ? "#ef4444" : p === "High" ? "#f97316" : p === "Medium" ? "#eab308" : "#64748b";
                return (
                  <div key={p} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">{p}</span>
                    <div className="flex-1 bg-border/30 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
            {unestimated > 0 && (
              <p className="text-xs text-yellow-400 mt-3 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {unestimated} stories have no story point estimate
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent stories in backlog */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-400" /> Recent Backlog Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userStories.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              No user stories yet.{" "}
              <Link href="/user-stories" className="text-purple-400 underline hover:text-purple-300">Add stories →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {userStories.slice(0, 8).map(s => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border/30 bg-background/40 px-3 py-2">
                  <span className="font-mono text-xs text-purple-400 w-16 shrink-0">{s.storyId ?? `US-${s.id}`}</span>
                  <span className="text-sm text-foreground flex-1 truncate">{s.title}</span>
                  {s.storyPoints != null && (
                    <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded shrink-0">
                      {s.storyPoints}pt
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium shrink-0 ${PRIORITY_COLOR[s.priority ?? "Medium"] ?? ""}`}>
                    {s.priority ?? "Medium"}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium shrink-0 ${STATUS_COLOR[s.status ?? "New"] ?? ""}`}>
                    {s.status ?? "New"}
                  </span>
                </div>
              ))}
              {userStories.length > 8 && (
                <div className="text-right">
                  <Link href="/user-stories" className="text-xs text-purple-400 hover:text-purple-300 underline">
                    View all {userStories.length} stories →
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Backlog",      href: "/user-stories", icon: BookOpen,    color: "#8b5cf6" },
          { label: "Sprints",      href: "/sprints",      icon: IterationCw, color: "#3b82f6" },
          { label: "Board",        href: "/sprints?tab=board", icon: Layers, color: "#f59e0b" },
          { label: "Velocity",     href: "/sprints?tab=burndown", icon: TrendingUp, color: "#22c55e" },
        ].map(({ label, href, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <div
              className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 px-4 py-3 cursor-pointer hover:bg-card/80 transition-colors"
              style={{ borderLeftColor: color, borderLeftWidth: 3 }}
            >
              <Icon className="h-4 w-4 shrink-0" style={{ color }} />
              <span className="text-sm font-medium">{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AgileDashboard() {
  const { currentProjectId } = useProject();

  if (!currentProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <IterationCw className="h-10 w-10 opacity-30" />
        <p className="text-sm">Select a project to view the Agile Dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg p-2 bg-purple-500/10">
          <IterationCw className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Agile Dashboard</h1>
          <p className="text-xs text-muted-foreground">Scrum · sprints · backlog · velocity · burndown</p>
        </div>
      </div>

      <AgileDashboardContent />
    </div>
  );
}
