import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Loader2, Settings, BarChart2, Mail, Briefcase, UserCheck, UserX } from "lucide-react";
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
        <TabsList className="mb-2">
          <TabsTrigger value="workload"><BarChart2 className="w-3.5 h-3.5 mr-1.5" />Workload</TabsTrigger>
          <TabsTrigger value="team"><Users className="w-3.5 h-3.5 mr-1.5" />Team Overview</TabsTrigger>
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
