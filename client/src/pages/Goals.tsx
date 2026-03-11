import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import {
  Plus, Target, Trash2, Settings, ChevronDown, ChevronRight,
  Loader2, TrendingUp, CheckCircle2, AlertTriangle, Circle,
  Minus,
} from "lucide-react";

const GOAL_STATUS_STYLES: Record<string, { badge: string; icon: any; color: string }> = {
  "Not Started": { badge: "bg-gray-100 text-gray-700", icon: Circle, color: "text-gray-500" },
  "In Progress": { badge: "bg-blue-100 text-blue-700", icon: TrendingUp, color: "text-blue-600" },
  "At Risk":     { badge: "bg-red-100 text-red-700",  icon: AlertTriangle, color: "text-red-600" },
  "Achieved":    { badge: "bg-green-100 text-green-700", icon: CheckCircle2, color: "text-green-600" },
  "Cancelled":   { badge: "bg-gray-100 text-gray-500", icon: Minus, color: "text-gray-400" },
};
const KR_STATUS_STYLES: Record<string, string> = {
  "Not Started": "bg-gray-100 text-gray-600",
  "In Progress": "bg-blue-100 text-blue-700",
  "At Risk":     "bg-red-100 text-red-700",
  "Achieved":    "bg-green-100 text-green-700",
};

export default function Goals() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<any>(null);
  const [expandedGoals, setExpandedGoals] = useState<Set<number>>(new Set());
  const [createKrGoal, setCreateKrGoal] = useState<any>(null);
  const [goalForm, setGoalForm] = useState({ title: "", description: "", owner: "", status: "Not Started", startDate: "", endDate: "", progress: "0" });
  const [krForm, setKrForm] = useState({ title: "", targetValue: "", currentValue: "0", unit: "", status: "Not Started" });

  const { data: goals = [], isLoading, refetch } = trpc.goals.list.useQuery({ projectId }, { enabled });

  const createGoalMut = trpc.goals.create.useMutation({
    onSuccess: () => { toast.success("Goal created"); refetch(); setCreateGoalOpen(false); resetGoalForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateGoalMut = trpc.goals.update.useMutation({
    onSuccess: () => { toast.success("Goal updated"); refetch(); setEditGoal(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteGoalMut = trpc.goals.delete.useMutation({
    onSuccess: () => { toast.success("Goal deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const createKrMut = trpc.goals.keyResults.create.useMutation({
    onSuccess: () => { toast.success("Key result added"); refetch(); setCreateKrGoal(null); resetKrForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateKrMut = trpc.goals.keyResults.update.useMutation({
    onSuccess: () => refetch(),
  });
  const deleteKrMut = trpc.goals.keyResults.delete.useMutation({
    onSuccess: () => { toast.success("Key result deleted"); refetch(); },
  });

  function resetGoalForm() { setGoalForm({ title: "", description: "", owner: "", status: "Not Started", startDate: "", endDate: "", progress: "0" }); }
  function resetKrForm() { setKrForm({ title: "", targetValue: "", currentValue: "0", unit: "", status: "Not Started" }); }
  function openEditGoal(goal: any) {
    setEditGoal(goal);
    setGoalForm({
      title: goal.title || "",
      description: goal.description || "",
      owner: goal.owner || "",
      status: goal.status || "Not Started",
      startDate: goal.startDate ? new Date(goal.startDate).toISOString().split("T")[0] : "",
      endDate: goal.endDate ? new Date(goal.endDate).toISOString().split("T")[0] : "",
      progress: goal.progress?.toString() || "0",
    });
  }
  function toggleExpand(goalId: number) {
    setExpandedGoals(prev => { const n = new Set(prev); n.has(goalId) ? n.delete(goalId) : n.add(goalId); return n; });
  }

  const summary = {
    total: goals.length,
    achieved: goals.filter((g: any) => g.status === "Achieved").length,
    inProgress: goals.filter((g: any) => g.status === "In Progress").length,
    atRisk: goals.filter((g: any) => g.status === "At Risk").length,
  };

  if (!currentProjectId) return <div className="p-6 text-muted-foreground">Select a project first.</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600" /> Goals & OKRs
          </h1>
          <p className="text-gray-500 text-sm mt-1">Define objectives and key results — align work with strategy</p>
        </div>
        <Button onClick={() => { resetGoalForm(); setCreateGoalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />New Goal
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Goals</div><div className="text-3xl font-bold">{summary.total}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Achieved</div><div className="text-3xl font-bold text-green-600">{summary.achieved}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">In Progress</div><div className="text-3xl font-bold text-blue-600">{summary.inProgress}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">At Risk</div><div className="text-3xl font-bold text-red-600">{summary.atRisk}</div></Card>
      </div>

      {/* Goals List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals defined" description="Create goals and key results to track strategic alignment." actionLabel="New Goal" onAction={() => setCreateGoalOpen(true)} />
      ) : (
        <div className="space-y-3">
          {goals.map((goal: any) => {
            const style = GOAL_STATUS_STYLES[goal.status] || GOAL_STATUS_STYLES["Not Started"];
            const StatusIcon = style.icon;
            const isExpanded = expandedGoals.has(goal.id);
            const krs: any[] = goal.keyResults || [];
            const krProgress = krs.length > 0 ? Math.round(krs.filter((kr: any) => kr.status === "Achieved").length / krs.length * 100) : goal.progress || 0;

            return (
              <Card key={goal.id} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleExpand(goal.id)} className="mt-0.5 shrink-0">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusIcon className={`w-4 h-4 shrink-0 ${style.color}`} />
                        <span className="font-semibold">{goal.title}</span>
                        <Badge className={`text-xs border-0 ${style.badge}`}>{goal.status}</Badge>
                        {goal.owner && <span className="text-xs text-muted-foreground">· {goal.owner}</span>}
                      </div>
                      {goal.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{goal.description}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 max-w-xs">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span><span>{krProgress}%</span>
                          </div>
                          <Progress value={krProgress} className="h-1.5" />
                        </div>
                        {goal.endDate && <span className="text-xs text-muted-foreground">{new Date(goal.endDate).toLocaleDateString()}</span>}
                        {krs.length > 0 && <span className="text-xs text-muted-foreground">{krs.length} key results</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setCreateKrGoal(goal)}>
                        <Plus className="w-3.5 h-3.5 mr-1" />KR
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditGoal(goal)}><Settings className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => { if (confirm("Delete this goal and all key results?")) deleteGoalMut.mutate({ id: goal.id }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </div>

                {/* Key Results */}
                {isExpanded && (
                  <div className="border-t bg-gray-50/50 px-4 py-3 space-y-2">
                    {krs.length === 0 ? (
                      <div className="text-center py-3 text-muted-foreground text-sm">
                        No key results yet. <button className="text-primary underline text-sm" onClick={() => setCreateKrGoal(goal)}>Add one</button>
                      </div>
                    ) : (
                      krs.map((kr: any) => (
                        <KeyResultRow
                          key={kr.id}
                          kr={kr}
                          onUpdate={(updates) => updateKrMut.mutate({ id: kr.id, ...updates })}
                          onDelete={() => deleteKrMut.mutate({ id: kr.id })}
                        />
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Goal Dialog */}
      <Dialog open={createGoalOpen || !!editGoal} onOpenChange={(o) => { if (!o) { setCreateGoalOpen(false); setEditGoal(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editGoal ? "Edit Goal" : "Create Goal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Goal Title *</Label>
              <Input value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} placeholder="e.g. Increase customer satisfaction score" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} rows={2} placeholder="Why does this goal matter?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Owner</Label>
                <Input value={goalForm.owner} onChange={(e) => setGoalForm({ ...goalForm, owner: e.target.value })} placeholder="Owner name" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={goalForm.status} onValueChange={(v) => setGoalForm({ ...goalForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Not Started", "In Progress", "At Risk", "Achieved", "Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={goalForm.startDate} onChange={(e) => setGoalForm({ ...goalForm, startDate: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={goalForm.endDate} onChange={(e) => setGoalForm({ ...goalForm, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Progress (0–100%)</Label>
              <Input type="number" min={0} max={100} value={goalForm.progress} onChange={(e) => setGoalForm({ ...goalForm, progress: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateGoalOpen(false); setEditGoal(null); }}>Cancel</Button>
            <Button
              disabled={!goalForm.title || createGoalMut.isPending || updateGoalMut.isPending}
              onClick={() => {
                const payload = { title: goalForm.title, description: goalForm.description || undefined, owner: goalForm.owner || undefined, status: goalForm.status as any, startDate: goalForm.startDate || undefined, endDate: goalForm.endDate || undefined, progress: parseInt(goalForm.progress) || 0 };
                if (editGoal) updateGoalMut.mutate({ id: editGoal.id, ...payload });
                else createGoalMut.mutate({ projectId, ...payload });
              }}
            >
              {editGoal ? "Save Changes" : "Create Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Key Result Dialog */}
      <Dialog open={!!createKrGoal} onOpenChange={(o) => { if (!o) { setCreateKrGoal(null); resetKrForm(); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Key Result</DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground mb-2">Goal: {createKrGoal?.title}</div>
          <div className="space-y-3 py-1">
            <div>
              <Label>Key Result *</Label>
              <Input value={krForm.title} onChange={(e) => setKrForm({ ...krForm, title: e.target.value })} placeholder="e.g. Achieve NPS score of 50" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Target</Label>
                <Input type="number" value={krForm.targetValue} onChange={(e) => setKrForm({ ...krForm, targetValue: e.target.value })} placeholder="100" />
              </div>
              <div>
                <Label>Current</Label>
                <Input type="number" value={krForm.currentValue} onChange={(e) => setKrForm({ ...krForm, currentValue: e.target.value })} placeholder="0" />
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={krForm.unit} onChange={(e) => setKrForm({ ...krForm, unit: e.target.value })} placeholder="%, pts" />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={krForm.status} onValueChange={(v) => setKrForm({ ...krForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Not Started", "In Progress", "At Risk", "Achieved"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateKrGoal(null); resetKrForm(); }}>Cancel</Button>
            <Button
              disabled={!krForm.title || createKrMut.isPending}
              onClick={() => createKrMut.mutate({
                goalId: createKrGoal.id,
                projectId,
                title: krForm.title,
                targetValue: krForm.targetValue ? parseFloat(krForm.targetValue) : undefined,
                currentValue: parseFloat(krForm.currentValue) || 0,
                unit: krForm.unit || undefined,
                status: krForm.status as any,
              })}
            >
              Add Key Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KeyResultRow({ kr, onUpdate, onDelete }: any) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(kr.currentValue?.toString() || "0");
  const target = parseFloat(kr.targetValue || "0");
  const curr = parseFloat(kr.currentValue || "0");
  const pct = target > 0 ? Math.min(Math.round((curr / target) * 100), 100) : (kr.status === "Achieved" ? 100 : 0);
  const krStyle = KR_STATUS_STYLES[kr.status] || "bg-gray-100 text-gray-600";

  return (
    <div className="flex items-center gap-3 bg-white rounded-lg border px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm">{kr.title}</span>
          <Badge className={`text-[10px] border-0 ${krStyle}`}>{kr.status}</Badge>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <Progress value={pct} className="h-1 flex-1 max-w-[160px]" />
          <span className="text-xs text-muted-foreground">
            {editing ? (
              <input
                type="number"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                onBlur={() => { onUpdate({ currentValue: parseFloat(current) || 0 }); setEditing(false); }}
                className="w-16 border rounded px-1 py-0.5 text-xs"
                autoFocus
              />
            ) : (
              <button onClick={() => setEditing(true)} className="hover:text-primary">
                {curr}{kr.unit ? ` ${kr.unit}` : ""} / {kr.targetValue || "?"}{kr.unit ? ` ${kr.unit}` : ""} ({pct}%)
              </button>
            )}
          </span>
        </div>
      </div>
      <Select value={kr.status} onValueChange={(v) => onUpdate({ status: v })}>
        <SelectTrigger className="h-6 text-xs w-28 shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {["Not Started", "In Progress", "At Risk", "Achieved"].map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0" onClick={() => { if (confirm("Delete key result?")) onDelete(); }}><Trash2 className="w-3 h-3" /></Button>
    </div>
  );
}
