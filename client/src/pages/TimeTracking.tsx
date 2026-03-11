import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import {
  Plus, Clock, Trash2, BarChart2, List, Edit, Loader2,
  Calendar, Users, TrendingUp, Timer,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#64748b", "#14b8a6", "#f97316"];

export default function TimeTracking() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const [createOpen, setCreateOpen] = useState(false);
  const [editLog, setEditLog] = useState<any>(null);
  const [form, setForm] = useState({
    taskId: "",
    taskDescription: "",
    loggedBy: "",
    logDate: new Date().toISOString().split("T")[0],
    hoursLogged: "",
    description: "",
  });

  const { data: logs = [], isLoading, refetch } = trpc.timeLogs.list.useQuery({ projectId }, { enabled });
  const { data: tasks = [] } = trpc.tasks.list.useQuery({ projectId }, { enabled });
  const { data: summary } = trpc.timeLogs.getSummary.useQuery({ projectId }, { enabled });

  const createMut = trpc.timeLogs.create.useMutation({
    onSuccess: () => { toast.success("Time logged"); refetch(); setCreateOpen(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.timeLogs.update.useMutation({
    onSuccess: () => { toast.success("Log updated"); refetch(); setEditLog(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.timeLogs.delete.useMutation({
    onSuccess: () => { toast.success("Log deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() { setForm({ taskId: "", taskDescription: "", loggedBy: "", logDate: new Date().toISOString().split("T")[0], hoursLogged: "", description: "" }); }
  function openEdit(log: any) {
    setEditLog(log);
    setForm({
      taskId: log.taskId?.toString() || "",
      taskDescription: log.taskDescription || "",
      loggedBy: log.loggedBy || "",
      logDate: log.logDate ? new Date(log.logDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      hoursLogged: parseFloat(log.hoursLogged || "0").toString(),
      description: log.description || "",
    });
  }

  // Group by week for chart
  const weeklyData = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach((l: any) => {
      if (!l.logDate) return;
      const d = new Date(l.logDate);
      // Get Monday of that week
      const day = d.getDay();
      const mon = new Date(d);
      mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
      const key = mon.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      map[key] = (map[key] || 0) + parseFloat(l.hoursLogged || "0");
    });
    return Object.entries(map).slice(-8).map(([week, hours]) => ({ week, hours: Math.round(hours * 10) / 10 }));
  }, [logs]);

  // By person for pie
  const byPersonData = useMemo(() => {
    return (summary?.byPerson || []).slice(0, 8).map((p: any) => ({
      name: p.name,
      value: Math.round(p.hours * 10) / 10,
    }));
  }, [summary]);

  // Recent logs grouped by date
  const groupedLogs = useMemo(() => {
    const map: Record<string, any[]> = {};
    logs.forEach((l: any) => {
      const dateKey = l.logDate ? new Date(l.logDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" }) : "Unknown";
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(l);
    });
    return Object.entries(map).slice(0, 14);
  }, [logs]);

  if (!currentProjectId) return <div className="p-6 text-muted-foreground">Select a project first.</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" /> Time Tracking
          </h1>
          <p className="text-gray-500 text-sm mt-1">Log hours, view timesheets and analyse effort distribution</p>
        </div>
        <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />Log Time
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Hours</div>
          <div className="text-3xl font-bold">{summary?.total ?? 0}<span className="text-sm font-normal text-muted-foreground ml-1">h</span></div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">This Week</div>
          <div className="text-3xl font-bold text-blue-600">{summary?.thisWeek ?? 0}<span className="text-sm font-normal text-muted-foreground ml-1">h</span></div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Entries</div>
          <div className="text-3xl font-bold">{logs.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Contributors</div>
          <div className="text-3xl font-bold">{summary?.byPerson?.length ?? 0}</div>
        </Card>
      </div>

      <Tabs defaultValue="log">
        <TabsList>
          <TabsTrigger value="log"><List className="w-3.5 h-3.5 mr-1.5" />Time Log</TabsTrigger>
          <TabsTrigger value="reports"><BarChart2 className="w-3.5 h-3.5 mr-1.5" />Reports</TabsTrigger>
        </TabsList>

        {/* ── Time Log ── */}
        <TabsContent value="log" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : logs.length === 0 ? (
            <EmptyState icon={Clock} title="No time logged yet" description="Start logging time to track effort and resource utilisation." actionLabel="Log Time" onAction={() => setCreateOpen(true)} />
          ) : (
            <div className="space-y-4">
              {groupedLogs.map(([date, dayLogs]) => {
                const dayTotal = dayLogs.reduce((sum, l) => sum + parseFloat(l.hoursLogged || "0"), 0);
                return (
                  <div key={date}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">{date}</span>
                      <div className="flex-1 border-t border-gray-100" />
                      <span className="text-xs font-semibold text-muted-foreground">{Math.round(dayTotal * 10) / 10}h</span>
                    </div>
                    <div className="space-y-1.5">
                      {dayLogs.map((log: any) => (
                        <TimeLogRow key={log.id} log={log} onEdit={openEdit} onDelete={(id) => deleteMut.mutate({ id })} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Reports ── */}
        <TabsContent value="reports" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-muted-foreground" />Weekly Hours</h3>
              {weeklyData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => [`${v}h`, "Hours"]} />
                    <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card className="p-5">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" />Hours by Person</h3>
              {byPersonData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={byPersonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name.slice(0, 10)} ${Math.round(percent * 100)}%`} labelLine={false}>
                      {byPersonData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`${v}h`]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
          {/* Leaderboard */}
          {(summary?.byPerson || []).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Hours by Team Member</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(summary?.byPerson || []).map((p: any, i: number) => {
                    const maxH = summary!.byPerson[0]?.hours ?? 1;
                    const pct = Math.round((p.hours / maxH) * 100);
                    return (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                        <span className="text-sm w-32 shrink-0 truncate">{p.name}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-semibold w-12 text-right shrink-0">{p.hours}h</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={createOpen || !!editLog} onOpenChange={(o) => { if (!o) { setCreateOpen(false); setEditLog(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editLog ? "Edit Time Entry" : "Log Time"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={form.logDate} onChange={(e) => setForm({ ...form, logDate: e.target.value })} />
              </div>
              <div>
                <Label>Hours *</Label>
                <Input type="number" step="0.5" min="0.1" max="24" value={form.hoursLogged} onChange={(e) => setForm({ ...form, hoursLogged: e.target.value })} placeholder="e.g. 2.5" />
              </div>
            </div>
            <div>
              <Label>Logged By</Label>
              <Input value={form.loggedBy} onChange={(e) => setForm({ ...form, loggedBy: e.target.value })} placeholder="Your name" />
            </div>
            <div>
              <Label>Task (optional)</Label>
              <select
                value={form.taskId}
                onChange={(e) => {
                  const task = tasks.find((t: any) => t.id.toString() === e.target.value);
                  setForm({ ...form, taskId: e.target.value, taskDescription: task?.description || "" });
                }}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">— No task —</option>
                {tasks.map((t: any) => <option key={t.id} value={t.id}>{t.taskId} – {(t.description || "").slice(0, 50)}</option>)}
              </select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="What did you work on?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setEditLog(null); }}>Cancel</Button>
            <Button
              disabled={!form.logDate || !form.hoursLogged || createMut.isPending || updateMut.isPending}
              onClick={() => {
                const payload = {
                  taskId: form.taskId ? parseInt(form.taskId) : undefined,
                  taskDescription: form.taskDescription || undefined,
                  loggedBy: form.loggedBy || undefined,
                  logDate: form.logDate,
                  hoursLogged: parseFloat(form.hoursLogged),
                  description: form.description || undefined,
                };
                if (editLog) updateMut.mutate({ id: editLog.id, ...payload });
                else createMut.mutate({ projectId, ...payload });
              }}
            >
              {editLog ? "Save" : "Log Time"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TimeLogRow({ log, onEdit, onDelete }: any) {
  const hours = parseFloat(log.hoursLogged || "0");
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50/50 text-sm group">
      <Timer className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
      <div className="flex-1 min-w-0">
        {log.taskDescription && <span className="text-xs font-mono text-muted-foreground mr-2">{log.taskDescription.slice(0, 40)}</span>}
        {log.description && <span className="text-muted-foreground">{log.description}</span>}
        {!log.description && !log.taskDescription && <span className="text-muted-foreground italic">No description</span>}
      </div>
      {log.loggedBy && <span className="text-xs text-muted-foreground shrink-0 hidden md:block">{log.loggedBy}</span>}
      <Badge variant="outline" className="shrink-0 font-mono">{hours}h</Badge>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onEdit(log)}><Edit className="w-3 h-3" /></Button>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => { if (confirm("Delete this time entry?")) onDelete(log.id); }}><Trash2 className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}
