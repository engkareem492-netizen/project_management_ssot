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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import {
  Plus, Zap, BarChart2, List, Settings, Trash2, Play, CheckCircle2,
  Calendar, Target, Loader2, ChevronRight, MoreHorizontal, X, MoveRight,
  TrendingUp, Clock,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, ReferenceLine,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  "Planning": "bg-blue-100 text-blue-700",
  "Active": "bg-green-100 text-green-700",
  "Completed": "bg-gray-100 text-gray-700",
  "Cancelled": "bg-red-100 text-red-700",
};

const TASK_STATUS_COLS = ["Not Started", "In Progress", "Done", "Completed"];

function SprintBurndown({ sprint, tasks }: { sprint: any; tasks: any[] }) {
  const sprintTasks = tasks.filter((t: any) => t.sprintId === sprint.id);
  if (!sprint.startDate || !sprint.endDate || sprintTasks.length === 0) {
    return <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No burndown data — assign tasks and set sprint dates.</div>;
  }

  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const ideal: { day: string; ideal: number }[] = [];
  for (let i = 0; i <= totalDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    ideal.push({
      day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ideal: Math.round(sprintTasks.length - (sprintTasks.length / totalDays) * i),
    });
  }
  const doneTasks = sprintTasks.filter((t: any) => t.status === "Done" || t.status === "Completed" || t.status === "Closed").length;
  const remaining = sprintTasks.length - doneTasks;
  if (ideal.length > 0) ideal[ideal.length - 1] = { ...ideal[ideal.length - 1], ...({ actual: remaining } as any) };

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={ideal} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="5 5" dot={false} name="Ideal" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function Sprints() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const [createOpen, setCreateOpen] = useState(false);
  const [editSprint, setEditSprint] = useState<any>(null);
  const [activeSprint, setActiveSprint] = useState<any>(null);
  const [form, setForm] = useState({ name: "", goal: "", status: "Planning", startDate: "", endDate: "", capacity: "" });

  const { data: sprints = [], isLoading: sprintsLoading, refetch: refetchSprints } = trpc.sprints.list.useQuery({ projectId }, { enabled });
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = trpc.tasks.list.useQuery({ projectId }, { enabled });

  const createMutation = trpc.sprints.create.useMutation({
    onSuccess: () => { toast.success("Sprint created"); refetchSprints(); setCreateOpen(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.sprints.update.useMutation({
    onSuccess: () => { toast.success("Sprint updated"); refetchSprints(); setEditSprint(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.sprints.delete.useMutation({
    onSuccess: () => { toast.success("Sprint deleted"); refetchSprints(); },
    onError: (e) => toast.error(e.message),
  });
  const assignTaskMutation = trpc.sprints.assignTask.useMutation({
    onSuccess: () => { refetchTasks(); },
  });
  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => refetchTasks(),
  });

  function resetForm() { setForm({ name: "", goal: "", status: "Planning", startDate: "", endDate: "", capacity: "" }); }
  function openEdit(sprint: any) {
    setEditSprint(sprint);
    setForm({
      name: sprint.name || "",
      goal: sprint.goal || "",
      status: sprint.status || "Planning",
      startDate: sprint.startDate ? new Date(sprint.startDate).toISOString().split("T")[0] : "",
      endDate: sprint.endDate ? new Date(sprint.endDate).toISOString().split("T")[0] : "",
      capacity: sprint.capacity?.toString() || "",
    });
  }

  const activeSprints = sprints.filter((s: any) => s.status === "Active");
  const planningSprints = sprints.filter((s: any) => s.status === "Planning");
  const completedSprints = sprints.filter((s: any) => s.status === "Completed");
  const backlogTasks = tasks.filter((t: any) => !t.sprintId);
  const sprintTasks = activeSprint ? tasks.filter((t: any) => t.sprintId === activeSprint.id) : [];

  const velocityData = useMemo(() => {
    return completedSprints.slice(0, 6).reverse().map((s: any) => {
      const sTasks = tasks.filter((t: any) => t.sprintId === s.id);
      const done = sTasks.filter((t: any) => ["Done", "Completed", "Closed"].includes(t.status)).length;
      return { sprint: s.name.slice(0, 15), total: sTasks.length, done };
    });
  }, [completedSprints, tasks]);

  const isLoading = sprintsLoading || tasksLoading;

  if (!currentProjectId) {
    return <div className="p-6 text-muted-foreground">Select a project first.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" /> Sprint Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Plan, execute and track sprints — Scrum-ready</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{sprints.length} sprints</Badge>
          <Badge className="bg-green-100 text-green-700 border-0">{activeSprints.length} active</Badge>
          <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />New Sprint
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Sprints</div>
          <div className="text-3xl font-bold">{sprints.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Active</div>
          <div className="text-3xl font-bold text-green-600">{activeSprints.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Backlog Items</div>
          <div className="text-3xl font-bold text-blue-600">{backlogTasks.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Completed Sprints</div>
          <div className="text-3xl font-bold text-gray-600">{completedSprints.length}</div>
        </Card>
      </div>

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board"><List className="w-3.5 h-3.5 mr-1.5" />Sprints</TabsTrigger>
          <TabsTrigger value="backlog"><Target className="w-3.5 h-3.5 mr-1.5" />Backlog</TabsTrigger>
          <TabsTrigger value="velocity"><BarChart2 className="w-3.5 h-3.5 mr-1.5" />Velocity</TabsTrigger>
        </TabsList>

        {/* ── Sprints Board ── */}
        <TabsContent value="board" className="mt-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : sprints.length === 0 ? (
            <EmptyState icon={Zap} title="No sprints yet" description="Create your first sprint to start planning." actionLabel="New Sprint" onAction={() => setCreateOpen(true)} />
          ) : (
            <>
              {/* Active Sprints */}
              {activeSprints.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2"><Play className="w-4 h-4" />Active Sprints</h3>
                  <div className="space-y-4">
                    {activeSprints.map((sprint: any) => <SprintCard key={sprint.id} sprint={sprint} tasks={tasks} onEdit={openEdit} onDelete={(id) => deleteMutation.mutate({ id })} onViewBoard={() => setActiveSprint(sprint === activeSprint ? null : sprint)} isExpanded={activeSprint?.id === sprint.id} />)}
                  </div>
                </div>
              )}
              {/* Sprint Board for selected sprint */}
              {activeSprint && (
                <SprintBoard sprint={activeSprint} tasks={sprintTasks} allTasks={tasks} onMoveTask={(taskId, status) => updateTaskMutation.mutate({ id: taskId, status })} onRemoveFromSprint={(taskId) => assignTaskMutation.mutate({ taskId, sprintId: null })} />
              )}
              {/* Planning Sprints */}
              {planningSprints.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" />Planning</h3>
                  <div className="space-y-3">
                    {planningSprints.map((sprint: any) => <SprintCard key={sprint.id} sprint={sprint} tasks={tasks} onEdit={openEdit} onDelete={(id) => deleteMutation.mutate({ id })} onViewBoard={() => {}} isExpanded={false} />)}
                  </div>
                </div>
              )}
              {/* Completed */}
              {completedSprints.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Completed</h3>
                  <div className="space-y-3">
                    {completedSprints.map((sprint: any) => <SprintCard key={sprint.id} sprint={sprint} tasks={tasks} onEdit={openEdit} onDelete={(id) => deleteMutation.mutate({ id })} onViewBoard={() => {}} isExpanded={false} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Backlog ── */}
        <TabsContent value="backlog" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Product Backlog ({backlogTasks.length} items)</CardTitle>
                <p className="text-xs text-muted-foreground">Tasks not assigned to any sprint</p>
              </div>
            </CardHeader>
            <CardContent>
              {backlogTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">All tasks are assigned to sprints.</div>
              ) : (
                <div className="space-y-2">
                  {backlogTasks.map((task: any) => (
                    <BacklogTaskRow
                      key={task.id}
                      task={task}
                      sprints={planningSprints.concat(activeSprints)}
                      onAssign={(sprintId) => assignTaskMutation.mutate({ taskId: task.id, sprintId })}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Velocity ── */}
        <TabsContent value="velocity" className="mt-4 space-y-4">
          {completedSprints.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No completed sprints" description="Complete sprints to see velocity charts." />
          ) : (
            <>
              <Card className="p-5">
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4" />Sprint Velocity (last 6 sprints)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={velocityData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#94a3b8" name="Planned" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="done" fill="#22c55e" name="Completed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {completedSprints.slice(0, 3).map((sprint: any) => {
                  const sTasks = tasks.filter((t: any) => t.sprintId === sprint.id);
                  const done = sTasks.filter((t: any) => ["Done", "Completed", "Closed"].includes(t.status)).length;
                  const pct = sTasks.length > 0 ? Math.round((done / sTasks.length) * 100) : 0;
                  return (
                    <Card key={sprint.id} className="p-4">
                      <div className="font-semibold text-sm mb-2">{sprint.name}</div>
                      <div className="text-2xl font-bold text-green-600">{pct}%</div>
                      <div className="text-xs text-muted-foreground mb-2">{done}/{sTasks.length} tasks completed</div>
                      <Progress value={pct} className="h-2" />
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Sprint Dialog */}
      <Dialog open={createOpen || !!editSprint} onOpenChange={(o) => { if (!o) { setCreateOpen(false); setEditSprint(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editSprint ? "Edit Sprint" : "Create New Sprint"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Sprint Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sprint 1, Q1 Sprint 2, etc." />
            </div>
            <div>
              <Label>Sprint Goal</Label>
              <Textarea value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="What should this sprint achieve?" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Planning", "Active", "Completed", "Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Capacity (story pts)</Label>
                <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 40" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setEditSprint(null); }}>Cancel</Button>
            <Button
              disabled={!form.name || createMutation.isPending || updateMutation.isPending}
              onClick={() => {
                const payload = { name: form.name, goal: form.goal || undefined, status: form.status as any, startDate: form.startDate || undefined, endDate: form.endDate || undefined, capacity: form.capacity ? parseInt(form.capacity) : undefined };
                if (editSprint) { updateMutation.mutate({ id: editSprint.id, ...payload }); }
                else { createMutation.mutate({ projectId, ...payload }); }
              }}
            >
              {editSprint ? "Save Changes" : "Create Sprint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SprintCard({ sprint, tasks, onEdit, onDelete, onViewBoard, isExpanded }: any) {
  const sprintTasks = tasks.filter((t: any) => t.sprintId === sprint.id);
  const done = sprintTasks.filter((t: any) => ["Done", "Completed", "Closed"].includes(t.status)).length;
  const pct = sprintTasks.length > 0 ? Math.round((done / sprintTasks.length) * 100) : 0;
  const statusClass = STATUS_COLORS[sprint.status] || "bg-gray-100 text-gray-700";

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{sprint.name}</span>
              <Badge className={`text-xs border-0 ${statusClass}`}>{sprint.status}</Badge>
            </div>
            {sprint.goal && <p className="text-sm text-muted-foreground mt-0.5 truncate">{sprint.goal}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {sprint.startDate && <span><Calendar className="w-3 h-3 inline mr-1" />{new Date(sprint.startDate).toLocaleDateString()} – {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : "?"}</span>}
              <span>{sprintTasks.length} tasks · {done} done</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {sprint.status === "Active" && (
              <Button size="sm" variant={isExpanded ? "default" : "outline"} onClick={onViewBoard} className="text-xs h-7">
                <List className="w-3.5 h-3.5 mr-1" />{isExpanded ? "Hide Board" : "View Board"}
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onEdit(sprint)}><Settings className="w-3.5 h-3.5" /></Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => { if (confirm("Delete this sprint?")) onDelete(sprint.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
        {sprintTasks.length > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span><span>{pct}%</span>
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>
        )}
      </div>
    </Card>
  );
}

function SprintBoard({ sprint, tasks, allTasks, onMoveTask, onRemoveFromSprint }: any) {
  const cols = ["Not Started", "In Progress", "On Hold", "Done"];
  return (
    <Card className="border-green-200 bg-green-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Play className="w-4 h-4 text-green-600" />{sprint.name} — Board
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {cols.map((col) => {
            const colTasks = tasks.filter((t: any) => (t.status || "Not Started") === col);
            return (
              <div key={col} className="flex-shrink-0 w-52 bg-white rounded-lg border p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600">{col}</span>
                  <span className="text-xs bg-gray-100 rounded-full px-1.5 py-0.5">{colTasks.length}</span>
                </div>
                <div className="space-y-1.5 min-h-[80px]">
                  {colTasks.map((task: any) => (
                    <div key={task.id} className="bg-gray-50 border rounded p-2 text-xs group">
                      <div className="font-mono text-[10px] text-muted-foreground">{task.taskId}</div>
                      <div className="truncate">{task.description}</div>
                      <div className="flex items-center justify-between mt-1.5 gap-1">
                        <Select value={task.status || "Not Started"} onValueChange={(v) => onMoveTask(task.id, v)}>
                          <SelectTrigger className="h-5 text-[10px] px-1.5 border-0 bg-gray-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {cols.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100" title="Remove from sprint" onClick={() => onRemoveFromSprint(task.id)}><X className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function BacklogTaskRow({ task, sprints, onAssign }: any) {
  const priorityColor = task.priority === "High" || task.priority === "Critical" ? "text-red-600" : task.priority === "Medium" ? "text-yellow-600" : "text-green-600";
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50/50 text-sm">
      <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{task.taskId}</span>
      <span className="flex-1 truncate">{task.description}</span>
      {task.priority && <span className={`text-xs font-medium ${priorityColor} shrink-0`}>{task.priority}</span>}
      {task.responsible && <span className="text-xs text-muted-foreground shrink-0 hidden md:block">{task.responsible}</span>}
      <div className="shrink-0">
        {sprints.length > 0 ? (
          <Select onValueChange={(v) => onAssign(parseInt(v))}>
            <SelectTrigger className="h-7 text-xs w-36">
              <SelectValue placeholder="Add to sprint" />
            </SelectTrigger>
            <SelectContent>
              {sprints.map((s: any) => <SelectItem key={s.id} value={s.id.toString()} className="text-xs">{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-xs text-muted-foreground">No sprints</span>
        )}
      </div>
    </div>
  );
}
