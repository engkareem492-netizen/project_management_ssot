import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Loader2, Settings, BarChart2, Mail, Briefcase, UserCheck, UserX,
  Star, Target, CalendarDays, Network, BookOpen, Plus, Trash2, Save, CheckSquare2,
  Shield, GraduationCap, ChevronDown, ChevronUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState as useLocalState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const DEFAULT_CAPACITY = 5; // tasks/week

function getWeekBounds(weeksFromNow: number): { start: Date; end: Date } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek + weeksFromNow * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function isInWeek(dateStr: string | null | undefined, weeksFromNow: number): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const { start, end } = getWeekBounds(weeksFromNow);
  return d >= start && d <= end;
}

function WorkloadBar({ assigned, capacity }: { assigned: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min((assigned / capacity) * 100, 100) : 0;
  const color =
    assigned > capacity
      ? "bg-red-500"
      : assigned / capacity >= 0.8
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-16 shrink-0">
        {assigned}/{capacity} tasks
      </span>
    </div>
  );
}

function getLoadLabel(assigned: number, capacity: number): { label: string; className: string } {
  if (assigned > capacity) return { label: "Overloaded", className: "bg-red-100 text-red-700" };
  if (assigned / capacity >= 0.8) return { label: "Near Capacity", className: "bg-yellow-100 text-yellow-700" };
  return { label: "Available", className: "bg-green-100 text-green-700" };
}

export default function Resources() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const [capacityMap, setCapacityMap] = useState<Record<string, number>>({});
  const [selectedStakeholder, setSelectedStakeholder] = useState<string | null>(null);
  const [newCapacity, setNewCapacity] = useState(DEFAULT_CAPACITY);
  const [showCapacityDialog, setShowCapacityDialog] = useState(false);

  const { data: stakeholders = [], isLoading: stLoading } = trpc.stakeholders.list.useQuery(
    { projectId },
    { enabled }
  );

  const { data: tasks = [], isLoading: tasksLoading } = trpc.tasks.list.useQuery(
    { projectId },
    { enabled }
  );

  const isLoading = stLoading || tasksLoading;

  // Build workload data per stakeholder
  const workloadData = useMemo(() => {
    return stakeholders.map((s: any) => {
      const name = s.fullName ?? s.name ?? s.stakeholderName ?? `Stakeholder ${s.id}`;
      const assigned = tasks.filter((t: any) => t.responsible === name || t.responsible === s.fullName || t.responsible === s.name);
      const thisWeek = assigned.filter((t: any) => isInWeek(t.dueDate, 0)).length;
      const nextWeek = assigned.filter((t: any) => isInWeek(t.dueDate, 1)).length;
      const next2 = assigned.filter((t: any) => isInWeek(t.dueDate, 2)).length;
      const next3 = assigned.filter((t: any) => isInWeek(t.dueDate, 3)).length;
      const next4 = assigned.filter((t: any) => isInWeek(t.dueDate, 4)).length;
      const cap = capacityMap[name] ?? DEFAULT_CAPACITY;

      return {
        id: s.id,
        name,
        role: s.role ?? s.stakeholderRole ?? "",
        email: s.email ?? "",
        totalAssigned: assigned.length,
        thisWeek,
        nextWeek,
        next2,
        next3,
        next4,
        capacity: cap,
      };
    });
  }, [stakeholders, tasks, capacityMap]);

  const summaryStats = useMemo(() => {
    const totalMembers = workloadData.length;
    const totalTasks = workloadData.reduce((sum, w) => sum + w.totalAssigned, 0);
    const avgLoad = totalMembers > 0 ? Math.round(totalTasks / totalMembers) : 0;
    const overloaded = workloadData.filter((w) => w.thisWeek > w.capacity).length;
    return { totalMembers, totalTasks, avgLoad, overloaded };
  }, [workloadData]);

  function openCapacityDialog(name: string, currentCap: number) {
    setSelectedStakeholder(name);
    setNewCapacity(currentCap);
    setShowCapacityDialog(true);
  }

  function saveCapacity() {
    if (!selectedStakeholder) return;
    setCapacityMap((prev) => ({ ...prev, [selectedStakeholder]: newCapacity }));
    toast.success(`Capacity updated for ${selectedStakeholder}`);
    setShowCapacityDialog(false);
  }

  if (!currentProjectId) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-muted-foreground">
        Select a project to view resources.
      </div>
    );
  }

  // Team overview analytics
  const teamOverview = useMemo(() => {
    const internal = stakeholders.filter((s: any) => s.isInternalTeam).length;
    const external = stakeholders.length - internal;
    const byRole: Record<string, number> = {};
    const byStrategy: Record<string, number> = {};
    stakeholders.forEach((s: any) => {
      const role = s.role || s.stakeholderRole || "Unknown";
      byRole[role] = (byRole[role] || 0) + 1;
      const strategy = s.engagementStrategy || "Not set";
      byStrategy[strategy] = (byStrategy[strategy] || 0) + 1;
    });
    return { internal, external, byRole, byStrategy };
  }, [stakeholders]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-gray-500" />
            Team & Workload
          </h1>
          <p className="text-gray-500 text-sm mt-1">Team composition, capacity and task distribution</p>
        </div>
        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
      </div>

      <Tabs defaultValue="workload">
        <TabsList className="mb-2 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="workload"><BarChart2 className="w-3.5 h-3.5 mr-1.5" />Workload</TabsTrigger>
          <TabsTrigger value="team"><Users className="w-3.5 h-3.5 mr-1.5" />Team Overview</TabsTrigger>
          <TabsTrigger value="skills"><GraduationCap className="w-3.5 h-3.5 mr-1.5" />Skills & KPIs</TabsTrigger>
          <TabsTrigger value="rbs"><Network className="w-3.5 h-3.5 mr-1.5" />RBS</TabsTrigger>
          <TabsTrigger value="rmp"><BookOpen className="w-3.5 h-3.5 mr-1.5" />Resource Mgmt Plan</TabsTrigger>
          <TabsTrigger value="calendar"><CalendarDays className="w-3.5 h-3.5 mr-1.5" />Resource Calendar</TabsTrigger>
          <TabsTrigger value="utilization"><BarChart2 className="w-3.5 h-3.5 mr-1.5" />Utilization</TabsTrigger>
        </TabsList>

        <TabsContent value="workload" className="mt-0 space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Team Members</div>
          <div className="text-3xl font-bold">{summaryStats.totalMembers}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Assigned Tasks</div>
          <div className="text-3xl font-bold">{summaryStats.totalTasks}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg Load / Person</div>
          <div className="text-3xl font-bold">{summaryStats.avgLoad}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Overloaded This Week</div>
          <div className={`text-3xl font-bold ${summaryStats.overloaded > 0 ? "text-red-600" : "text-green-600"}`}>
            {summaryStats.overloaded}
          </div>
        </Card>
      </div>

      {/* Workload table header */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase">
            <div className="col-span-3">Stakeholder</div>
            <div className="col-span-2 text-center">This Week</div>
            <div className="col-span-2 text-center">Next Week</div>
            <div className="col-span-2 text-center">Wk 3 / Wk 4</div>
            <div className="col-span-2">This Week Load</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : workloadData.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            No stakeholders found. Add stakeholders to see workload.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {workloadData.map((w) => {
              const { label, className } = getLoadLabel(w.thisWeek, w.capacity);
              return (
                <div key={w.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    {/* Name + role */}
                    <div className="col-span-3">
                      <div className="font-medium text-sm">{w.name}</div>
                      {w.role && <div className="text-xs text-muted-foreground">{w.role}</div>}
                      {w.email && <div className="text-xs text-muted-foreground">{w.email}</div>}
                    </div>

                    {/* This week */}
                    <div className="col-span-2 text-center">
                      <div className="text-2xl font-bold">{w.thisWeek}</div>
                      <div className="text-xs text-muted-foreground">tasks</div>
                    </div>

                    {/* Next week */}
                    <div className="col-span-2 text-center">
                      <div className="text-2xl font-bold text-muted-foreground">{w.nextWeek}</div>
                      <div className="text-xs text-muted-foreground">tasks</div>
                    </div>

                    {/* Wk 3/4 */}
                    <div className="col-span-2 text-center">
                      <div className="text-sm text-muted-foreground">
                        {w.next2} / {w.next3}
                      </div>
                      <div className="text-xs text-muted-foreground">wk 3 / wk 4</div>
                    </div>

                    {/* Workload bar */}
                    <div className="col-span-2">
                      <WorkloadBar assigned={w.thisWeek} capacity={w.capacity} />
                      <Badge className={`text-xs mt-1 ${className}`}>{label}</Badge>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openCapacityDialog(w.name, w.capacity)}
                        title="Set capacity"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weekly breakdown cards */}
      <div>
        <h2 className="text-base font-semibold mb-3">4-Week Forecast</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((offset) => {
            const { start, end } = getWeekBounds(offset);
            const label = offset === 0 ? "This Week" : offset === 1 ? "Next Week" : `Week +${offset}`;
            const totalForWeek = workloadData.reduce((sum, w) => {
              const field = [w.thisWeek, w.nextWeek, w.next2, w.next3][offset];
              return sum + field;
            }, 0);
            return (
              <Card key={offset} className="p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
                <div className="text-3xl font-bold">{totalForWeek}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {" – "}
                  {end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

        </TabsContent>

        <TabsContent value="team" className="mt-0 space-y-6">
          {/* Internal vs External */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="w-4 h-4 text-blue-500" />
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Internal</div>
              </div>
              <div className="text-3xl font-bold text-blue-600">{teamOverview.internal}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <UserX className="w-4 h-4 text-orange-500" />
                <div className="text-xs text-muted-foreground uppercase tracking-wide">External</div>
              </div>
              <div className="text-3xl font-bold text-orange-600">{teamOverview.external}</div>
            </Card>
            <Card className="p-4 col-span-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Engagement Strategies</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(teamOverview.byStrategy).map(([s, count]) => (
                  <span key={s} className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-1">
                    <span className="font-semibold">{count}</span> {s}
                  </span>
                ))}
                {Object.keys(teamOverview.byStrategy).length === 0 && (
                  <span className="text-xs text-muted-foreground">No strategies set</span>
                )}
              </div>
            </Card>
          </div>

          {/* Role distribution */}
          {Object.keys(teamOverview.byRole).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                Role Distribution
              </h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(teamOverview.byRole).sort((a, b) => b[1] - a[1]).map(([role, count]) => (
                  <div key={role} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
                    <span className="text-2xl font-bold text-primary">{count}</span>
                    <span className="text-sm text-muted-foreground">{role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team member cards */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              All Team Members ({stakeholders.length})
            </h3>
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : stakeholders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No stakeholders found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {stakeholders.map((s: any) => {
                  const name = s.fullName ?? s.name ?? s.stakeholderName ?? `Stakeholder ${s.id}`;
                  const assignedCount = workloadData.find(w => w.name === name)?.totalAssigned ?? 0;
                  return (
                    <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{name}</span>
                            {s.isInternalTeam && (
                              <Badge className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0">Internal</Badge>
                            )}
                          </div>
                          {(s.role || s.stakeholderRole) && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Briefcase className="w-3 h-3" />{s.role || s.stakeholderRole}
                            </div>
                          )}
                          {s.email && (
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />{s.email}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xl font-bold">{assignedCount}</div>
                          <div className="text-[10px] text-muted-foreground">tasks</div>
                        </div>
                      </div>
                      {s.engagementStrategy && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-[10px]">{s.engagementStrategy}</Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Skills & KPIs Tab ── */}
        <TabsContent value="skills" className="mt-0 space-y-4">
          <SkillsKPIsTab stakeholders={stakeholders} projectId={projectId} />
        </TabsContent>

        {/* ── RBS Tab ── */}
        <TabsContent value="rbs" className="mt-0">
          <RBSTab projectId={projectId} />
        </TabsContent>

        {/* ── Resource Management Plan Tab ── */}
        <TabsContent value="rmp" className="mt-0">
          <RMPTab projectId={projectId} />
        </TabsContent>

        {/* ── Resource Calendar Tab ── */}
        <TabsContent value="calendar" className="mt-0">
          <ResourceCalendarTab stakeholders={stakeholders} projectId={projectId} />
        </TabsContent>

        {/* ── Utilization Tab ── */}
        <TabsContent value="utilization" className="mt-0">
          <UtilizationTab stakeholders={stakeholders} tasks={tasks} />
        </TabsContent>
      </Tabs>

      {/* Set Capacity Dialog */}
      <Dialog open={showCapacityDialog} onOpenChange={setShowCapacityDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Weekly Capacity</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {selectedStakeholder && (
              <p className="text-sm text-muted-foreground">
                Setting capacity for <span className="font-medium text-gray-900">{selectedStakeholder}</span>
              </p>
            )}
            <div className="space-y-1">
              <Label>Tasks per week (capacity)</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={newCapacity}
                onChange={(e) => setNewCapacity(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCapacityDialog(false)}>Cancel</Button>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white" onClick={saveCapacity}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Skills & KPIs Tab                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */
function SkillsKPIsTab({ stakeholders, projectId }: { stakeholders: any[]; projectId: number }) {
  const utils = trpc.useUtils();
  const { data: allSkills = [], isLoading } = trpc.resources.listSkills.useQuery({ projectId });
  const { data: allKPIs = [] } = trpc.resources.listKPIs.useQuery({ projectId });
  const upsertSkill = trpc.resources.upsertSkill.useMutation({ onSuccess: () => utils.resources.listSkills.invalidate() });
  const deleteSkill = trpc.resources.deleteSkill.useMutation({ onSuccess: () => utils.resources.listSkills.invalidate() });
  const upsertKPI = trpc.resources.upsertKPI.useMutation({ onSuccess: () => utils.resources.listKPIs.invalidate() });
  const deleteKPI = trpc.resources.deleteKPI.useMutation({ onSuccess: () => utils.resources.listKPIs.invalidate() });
  const updateSuccession = trpc.resources.updateSuccession.useMutation({ onSuccess: () => utils.stakeholders.list.invalidate() });

  const [selectedSH, setSelectedSH] = useState<any>(null);
  const [newSkill, setNewSkill] = useState({ skillName: "", proficiencyLevel: "Intermediate", yearsExp: 0, certifications: "" });
  const [newKPI, setNewKPI] = useState({ name: "", description: "", target: "", unit: "", weight: 1 });

  const shSkills = allSkills.filter((s: any) => s.stakeholderId === selectedSH?.id);
  const shKPIs = allKPIs.filter((k: any) => k.stakeholderId === selectedSH?.id);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stakeholder list */}
        <Card className="p-4 space-y-2 md:col-span-1 h-fit">
          <div className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-muted-foreground" /> Select Team Member
          </div>
          {stakeholders.map((s: any) => {
            const name = s.fullName ?? s.name ?? s.stakeholderName ?? `#${s.id}`;
            return (
              <div
                key={s.id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer border transition-colors ${selectedSH?.id === s.id ? "bg-primary/10 border-primary" : "hover:bg-muted/50 border-transparent"}`}
                onClick={() => setSelectedSH(s)}
              >
                <div>
                  <div className="text-sm font-medium">{name}</div>
                  <div className="text-xs text-muted-foreground">{s.role || s.stakeholderRole || "—"}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {s.needsSuccessionPlan && <Badge className="text-[10px] bg-orange-100 text-orange-700 px-1">Succession</Badge>}
                  {s.hasDelegation && <Badge className="text-[10px] bg-blue-100 text-blue-700 px-1">Delegation</Badge>}
                </div>
              </div>
            );
          })}
        </Card>

        {/* Skills & KPIs detail */}
        <div className="md:col-span-2 space-y-4">
          {!selectedSH ? (
            <Card className="p-8 flex items-center justify-center text-muted-foreground text-sm">
              Select a team member to view and edit their skills & KPIs
            </Card>
          ) : (
            <>
              {/* Succession / Delegation flags */}
              <Card className="p-4">
                <div className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-muted-foreground" /> Succession & Delegation
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={!!selectedSH.needsSuccessionPlan}
                      onCheckedChange={(v) => {
                        updateSuccession.mutate({ id: selectedSH.id, needsSuccessionPlan: !!v, hasDelegation: !!selectedSH.hasDelegation });
                        setSelectedSH({ ...selectedSH, needsSuccessionPlan: !!v });
                      }}
                    />
                    <span className="text-sm">Requires Succession Plan</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={!!selectedSH.hasDelegation}
                      onCheckedChange={(v) => {
                        updateSuccession.mutate({ id: selectedSH.id, needsSuccessionPlan: !!selectedSH.needsSuccessionPlan, hasDelegation: !!v });
                        setSelectedSH({ ...selectedSH, hasDelegation: !!v });
                      }}
                    />
                    <span className="text-sm">Has Delegation Authority</span>
                  </label>
                </div>
              </Card>

              {/* Skills */}
              <Card className="p-4">
                <div className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" /> Skills
                </div>
                <div className="space-y-2 mb-3">
                  {shSkills.length === 0 && <p className="text-xs text-muted-foreground">No skills added yet.</p>}
                  {shSkills.map((sk: any) => (
                    <div key={sk.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-sm font-medium">{sk.skillName}</span>
                        <Badge className="ml-2 text-[10px] bg-blue-100 text-blue-700">{sk.proficiencyLevel}</Badge>
                        {sk.yearsExp > 0 && <span className="text-xs text-muted-foreground ml-2">{sk.yearsExp}y exp</span>}
                        {sk.certifications && <span className="text-xs text-muted-foreground ml-2">· {sk.certifications}</span>}
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                        onClick={() => deleteSkill.mutate({ id: sk.id })}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Skill name" value={newSkill.skillName} onChange={e => setNewSkill(p => ({ ...p, skillName: e.target.value }))} />
                  <Select value={newSkill.proficiencyLevel} onValueChange={v => setNewSkill(p => ({ ...p, proficiencyLevel: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Beginner", "Intermediate", "Advanced", "Expert"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Years of experience" type="number" min={0} value={newSkill.yearsExp}
                    onChange={e => setNewSkill(p => ({ ...p, yearsExp: Number(e.target.value) }))} />
                  <Input placeholder="Certifications (optional)" value={newSkill.certifications}
                    onChange={e => setNewSkill(p => ({ ...p, certifications: e.target.value }))} />
                </div>
                <Button size="sm" className="mt-2" onClick={() => {
                  if (!newSkill.skillName.trim()) return;
                  upsertSkill.mutate({ projectId, stakeholderId: selectedSH.id, ...newSkill });
                  setNewSkill({ skillName: "", proficiencyLevel: "Intermediate", yearsExp: 0, certifications: "" });
                }}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Skill
                </Button>
              </Card>

              {/* KPIs */}
              <Card className="p-4">
                <div className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-muted-foreground" /> KPIs
                </div>
                <div className="space-y-2 mb-3">
                  {shKPIs.length === 0 && <p className="text-xs text-muted-foreground">No KPIs added yet.</p>}
                  {shKPIs.map((kpi: any) => {
                    const pct = null;
                    return (
                      <div key={kpi.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                        <div className="flex-1">
                          <span className="text-sm font-medium">{(kpi as any).name ?? (kpi as any).kpiName}</span>
                          <span className="text-xs text-muted-foreground ml-2">{(kpi as any).description}</span>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs">Target: <b>{kpi.target || "—"} {kpi.unit}</b></span>
                            {pct !== null && (
                              <Badge className={`text-[10px] ${pct >= 100 ? "bg-green-100 text-green-700" : pct >= 70 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                                {pct}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                          onClick={() => deleteKPI.mutate({ id: kpi.id })}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="KPI name" value={newKPI.name} onChange={e => setNewKPI(p => ({ ...p, name: e.target.value }))} />
                  <Input placeholder="Description" value={newKPI.description} onChange={e => setNewKPI(p => ({ ...p, description: e.target.value }))} />
                  <Input placeholder="Target value (e.g. 95%)" value={newKPI.target} onChange={e => setNewKPI(p => ({ ...p, target: e.target.value }))} />
                  <Input placeholder="Unit (e.g. %, hrs)" value={newKPI.unit} onChange={e => setNewKPI(p => ({ ...p, unit: e.target.value }))} />
                </div>
                <Button size="sm" className="mt-2" onClick={() => {
                  if (!newKPI.name.trim()) return;
                  upsertKPI.mutate({ projectId, stakeholderId: selectedSH.id, ...newKPI });
                  setNewKPI({ name: "", description: "", target: "", unit: "", weight: 1 });
                }}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add KPI
                </Button>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* RBS Tab                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */
function RBSTab({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const { data: rbsNodes = [], isLoading } = trpc.resources.listRBS.useQuery({ projectId });
  const upsertRBS = trpc.resources.upsertRBS.useMutation({ onSuccess: () => utils.resources.listRBS.invalidate() });
  const deleteRBS = trpc.resources.deleteRBS.useMutation({ onSuccess: () => utils.resources.listRBS.invalidate() });

  const [form, setForm] = useState({ code: "", name: "", type: "Human", parentId: "" as string | number, description: "" });

  const roots = rbsNodes.filter((n: any) => !n.parentId);
  const children = (parentId: number) => rbsNodes.filter((n: any) => n.parentId === parentId);

  function RBSNode({ node, depth }: { node: any; depth: number }) {
    const kids = children(node.id);
    return (
      <div style={{ marginLeft: depth * 20 }}>
        <div className="flex items-center gap-2 py-1.5 group">
          <Network className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-mono text-muted-foreground">{node.code}</span>
          <span className="text-sm font-medium">{node.name}</span>
          <Badge className="text-[10px] bg-blue-100 text-blue-700 px-1">{node.type}</Badge>
          {node.description && <span className="text-xs text-muted-foreground truncate max-w-48">{node.description}</span>}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 opacity-0 group-hover:opacity-100"
            onClick={() => deleteRBS.mutate({ id: node.id })}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        {kids.map((k: any) => <RBSNode key={k.id} node={k} depth={depth + 1} />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="text-sm font-semibold mb-3 flex items-center gap-1.5">
          <Network className="w-4 h-4 text-muted-foreground" /> Resource Breakdown Structure
        </div>
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
          <div className="border rounded-lg p-3 bg-muted/20 min-h-24">
            {roots.length === 0 ? <p className="text-xs text-muted-foreground">No RBS nodes defined yet.</p> : roots.map((r: any) => <RBSNode key={r.id} node={r} depth={0} />)}
          </div>
        )}
      </Card>
      <Card className="p-4">
        <div className="text-sm font-semibold mb-3">Add RBS Node</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Input placeholder="Code (e.g. R1.1)" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} />
          <Input placeholder="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Human", "Equipment", "Material", "Infrastructure", "Software", "Financial"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(form.parentId)} onValueChange={v => setForm(p => ({ ...p, parentId: v === "none" ? "" : Number(v) }))}>
            <SelectTrigger><SelectValue placeholder="Parent node (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Root level —</SelectItem>
              {rbsNodes.map((n: any) => <SelectItem key={n.id} value={String(n.id)}>{n.code} {n.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Description (optional)" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="md:col-span-2" />
        </div>
        <Button size="sm" className="mt-2" onClick={() => {
          if (!form.code.trim() || !form.name.trim()) return;
          upsertRBS.mutate({ projectId, code: form.code, name: form.name, type: form.type, parentId: form.parentId ? Number(form.parentId) : undefined, description: form.description });
          setForm({ code: "", name: "", type: "Human", parentId: "", description: "" });
        }}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Node
        </Button>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Resource Management Plan Tab                                                */
/* ─────────────────────────────────────────────────────────────────────────── */
function RMPTab({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const { data: rmp, isLoading } = trpc.resources.getRMP.useQuery({ projectId });
  const upsertRMP = trpc.resources.upsertRMP.useMutation({ onSuccess: () => utils.resources.getRMP.invalidate() });

  const [form, setForm] = useState({
    acquisitionStrategy: "", releaseStrategy: "", trainingNeeds: "",
    recognitionRewards: "", complianceRequirements: "",
    safetyConsiderations: "", notes: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (rmp) {
      setForm({
        acquisitionStrategy: (rmp as any).acquisitionStrategy ?? "",
        releaseStrategy: (rmp as any).releaseStrategy ?? "",
        trainingNeeds: (rmp as any).trainingNeeds ?? "",
        recognitionRewards: (rmp as any).recognitionRewards ?? "",
        complianceRequirements: (rmp as any).complianceRequirements ?? "",
        safetyConsiderations: (rmp as any).safetyConsiderations ?? "",
        notes: (rmp as any).notes ?? "",
      });
    }
  }, [rmp]);

  const sections = [
    { key: "acquisitionStrategy", label: "Resource Acquisition Strategy", placeholder: "How will resources be acquired? Internal hiring, outsourcing, contracting..." },
    { key: "releaseStrategy", label: "Resource Release Strategy", placeholder: "When and how will resources be released from the project..." },
    { key: "trainingNeeds", label: "Training & Development Plan", placeholder: "What training is required? Who needs it? Timeline and budget..." },
    { key: "recognitionRewards", label: "Recognition & Rewards", placeholder: "How will team performance be recognized and rewarded..." },
    { key: "safetyConsiderations", label: "Safety Considerations", placeholder: "Health, safety, and regulatory requirements for resources..." },
    { key: "notes", label: "Additional Notes", placeholder: "Any other resource management considerations..." },
    { key: "complianceRequirements", label: "Compliance & Safety Requirements", placeholder: "Regulatory requirements, safety protocols, HR policies..." },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-muted-foreground" /> Resource Management Plan
          </div>
          <Button size="sm" onClick={() => {
            upsertRMP.mutate({ projectId, ...form });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            toast.success("Resource Management Plan saved");
          }}>
            <Save className="w-3.5 h-3.5 mr-1" /> {saved ? "Saved!" : "Save Plan"}
          </Button>
        </div>
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
          <div className="space-y-4">
            {sections.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-sm font-medium">{label}</Label>
                <Textarea
                  placeholder={placeholder}
                  rows={3}
                  value={(form as any)[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Resource Calendar Tab                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */
function ResourceCalendarTab({ stakeholders, projectId }: { stakeholders: any[]; projectId: number }) {
  const utils = trpc.useUtils();
  const { data: calEntries = [] } = trpc.resources.listCalendar.useQuery({ projectId });
  const upsertCal = trpc.resources.upsertCalendar.useMutation({ onSuccess: () => utils.resources.listCalendar.invalidate() });
  const deleteCal = trpc.resources.deleteCalendar.useMutation({ onSuccess: () => utils.resources.listCalendar.invalidate() });

  const [form, setForm] = useState({
    stakeholderId: "" as string | number,
    entryType: "Leave" as string,
    startDate: "",
    endDate: "",
    description: "",
    allDay: true,
  });

  const TYPE_COLORS: Record<string, string> = {
    Leave: "bg-blue-100 text-blue-700",
    Holiday: "bg-green-100 text-green-700",
    Training: "bg-purple-100 text-purple-700",
    Unavailable: "bg-red-100 text-red-700",
    "Part-Time": "bg-yellow-100 text-yellow-700",
  };

  const grouped = stakeholders.map((s: any) => {
    const name = s.fullName ?? s.name ?? s.stakeholderName ?? `#${s.id}`;
    const entries = calEntries.filter((e: any) => e.stakeholderId === s.id);
    return { ...s, name, entries };
  }).filter((s: any) => s.entries.length > 0);

  return (
    <div className="space-y-4">
      {/* Add entry */}
      <Card className="p-4">
        <div className="text-sm font-semibold mb-3 flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-muted-foreground" /> Add Calendar Entry
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Select value={String(form.stakeholderId)} onValueChange={v => setForm(p => ({ ...p, stakeholderId: Number(v) }))}>
            <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
            <SelectContent>
              {stakeholders.map((s: any) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.fullName ?? s.name ?? s.stakeholderName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={form.entryType} onValueChange={v => setForm(p => ({ ...p, entryType: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Leave", "Holiday", "Training", "Unavailable", "Part-Time"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
          <Input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
          <Input placeholder="Description (optional)" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="md:col-span-2" />
        </div>
        <Button size="sm" className="mt-2" onClick={() => {
          if (!form.stakeholderId || !form.startDate) return;
          upsertCal.mutate({ projectId, stakeholderId: Number(form.stakeholderId), entryDate: form.startDate, type: form.entryType as any, notes: form.description });
          setForm({ stakeholderId: "", entryType: "Leave", startDate: "", endDate: "", description: "", allDay: true });
        }}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Entry
        </Button>
      </Card>

      {/* Calendar entries by person */}
      {calEntries.length === 0 ? (
        <Card className="p-8 flex items-center justify-center text-muted-foreground text-sm">
          No calendar entries yet. Add leave, holidays, or training periods above.
        </Card>
      ) : (
        <div className="space-y-3">
          {grouped.map((s: any) => (
            <Card key={s.id} className="p-4">
              <div className="text-sm font-semibold mb-2">{s.name}</div>
              <div className="space-y-1.5">
                {s.entries.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2 group">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] px-1.5 ${TYPE_COLORS[(e as any).type ?? (e as any).entryType] ?? "bg-gray-100 text-gray-700"}`}>{(e as any).type ?? (e as any).entryType}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(e.startDate).toLocaleDateString()} — {new Date(e.endDate).toLocaleDateString()}
                      </span>
                      {e.description && <span className="text-xs text-muted-foreground">· {e.description}</span>}
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 opacity-0 group-hover:opacity-100"
                      onClick={() => deleteCal.mutate({ id: e.id })}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Utilization Tab                                                              */
/* Shows task allocation per resource across a date range with daily/weekly/  */
/* monthly breakdown and colour-coded utilization heat map.                    */
/* ─────────────────────────────────────────────────────────────────────────── */
function UtilizationTab({ stakeholders, tasks }: { stakeholders: any[]; tasks: any[] }) {
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [rangeStart, setRangeStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // start of this week
    return d.toISOString().slice(0, 10);
  });
  const [rangeEnd, setRangeEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 27); // 4 weeks ahead
    return d.toISOString().slice(0, 10);
  });

  const periods = useMemo(() => {
    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);
    const result: { label: string; start: Date; end: Date }[] = [];
    if (viewMode === "daily") {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const day = new Date(d);
        result.push({ label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }), start: new Date(day), end: new Date(day) });
      }
    } else if (viewMode === "weekly") {
      let cur = new Date(start);
      while (cur <= end) {
        const wStart = new Date(cur);
        const wEnd = new Date(cur);
        wEnd.setDate(wEnd.getDate() + 6);
        result.push({ label: `${wStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, start: wStart, end: wEnd > end ? end : wEnd });
        cur.setDate(cur.getDate() + 7);
      }
    } else {
      let cur = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cur <= end) {
        const mStart = new Date(cur);
        const mEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
        result.push({ label: mStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }), start: mStart, end: mEnd > end ? end : mEnd });
        cur.setMonth(cur.getMonth() + 1);
      }
    }
    return result;
  }, [rangeStart, rangeEnd, viewMode]);

  const utilizationData = useMemo(() => {
    return stakeholders.map((s: any) => {
      const name = s.fullName ?? s.name ?? `#${s.id}`;
      const myTasks = tasks.filter((t: any) =>
        t.responsible === name || t.responsible === s.fullName || t.responsible === s.name
      );
      const periodCounts = periods.map((p) => {
        const count = myTasks.filter((t: any) => {
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate);
          return due >= p.start && due <= p.end;
        }).length;
        return count;
      });
      const total = myTasks.length;
      const maxInPeriod = Math.max(...periodCounts, 1);
      return { id: s.id, name, role: s.role ?? "", periodCounts, total, maxInPeriod };
    });
  }, [stakeholders, tasks, periods]);

  const globalMax = Math.max(...utilizationData.map((u) => u.maxInPeriod), 1);

  function heatColor(count: number, max: number) {
    if (count === 0) return "bg-gray-50 text-gray-400";
    const ratio = count / max;
    if (ratio >= 0.8) return "bg-red-500 text-white font-semibold";
    if (ratio >= 0.5) return "bg-orange-400 text-white";
    if (ratio >= 0.25) return "bg-yellow-300 text-yellow-900";
    return "bg-green-100 text-green-800";
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label className="text-xs">View</Label>
            <div className="flex gap-1">
              {(["daily", "weekly", "monthly"] as const).map((m) => (
                <Button key={m} size="sm" variant={viewMode === m ? "default" : "outline"} className="h-7 text-xs capitalize" onClick={() => setViewMode(m)}>{m}</Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="h-7 text-xs w-36" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="h-7 text-xs w-36" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> Low</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-300 inline-block" /> Medium</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400 inline-block" /> High</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Overloaded</span>
          </div>
        </div>
      </Card>

      {/* Heat map table */}
      <Card className="overflow-x-auto">
        <div className="min-w-max">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-3 py-2 font-medium w-40 sticky left-0 bg-muted/50">Resource</th>
                <th className="text-center px-2 py-2 font-medium w-16">Total</th>
                {periods.map((p, i) => (
                  <th key={i} className="text-center px-1 py-2 font-medium min-w-[60px]">{p.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {utilizationData.map((u) => (
                <tr key={u.id} className="border-b hover:bg-muted/20">
                  <td className="px-3 py-2 sticky left-0 bg-background">
                    <div className="font-medium truncate max-w-36">{u.name}</div>
                    {u.role && <div className="text-muted-foreground truncate">{u.role}</div>}
                  </td>
                  <td className="text-center px-2 py-2 font-semibold">{u.total}</td>
                  {u.periodCounts.map((count, i) => (
                    <td key={i} className="px-1 py-1">
                      <div className={`rounded text-center py-1 px-1 ${heatColor(count, globalMax)}`}>
                        {count > 0 ? count : "—"}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              {utilizationData.length === 0 && (
                <tr>
                  <td colSpan={periods.length + 2} className="text-center text-muted-foreground py-10">
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
