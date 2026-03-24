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

  // Cross-project pooled calendar — only fetched when a single pooled resource is selected
  const { data: pooledCalEntries = [] } = trpc.teamSkills.listPooledCalendar.useQuery(
    { stakeholderId: calStakeholderId!, projectId, startDate: calStart, endDate: calEnd },
    { enabled: enabled && calStakeholderId != null }
  );

  const { data: wbsNodes = [] } = trpc.wbsNodes.list.useQuery({ projectId }, { enabled });
  const { data: wbsAssignments = [], refetch: refetchAssignments } = trpc.wbsResourceAssignments.list.useQuery({ projectId }, { enabled });
  const upsertAssignment = trpc.wbsResourceAssignments.upsert.useMutation({
    onSuccess: () => { refetchAssignments(); setWizardAssignForm({ rbsNodeId: "", allocationPct: "100", notes: "" }); toast.success("Resource assigned"); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteAssignment = trpc.wbsResourceAssignments.delete.useMutation({
    onSuccess: () => { refetchAssignments(); toast.success("Assignment removed"); },
  });

  // KPI summary query for performance scores
  const { data: kpiSummary = [] } = (trpc as any).stakeholderEnhancements?.listProjectKpiSummary?.useQuery
    ? (trpc as any).stakeholderEnhancements.listProjectKpiSummary.useQuery({ projectId }, { enabled })
    : { data: [] };

  const latestScoreMap: Record<number, number> = useMemo(() => {
    const map: Record<number, number> = {};
    (kpiSummary as any[]).forEach((item: any) => {
      if (item.stakeholderId != null && item.overallScore != null) {
        map[item.stakeholderId] = item.overallScore;
      }
    });
    return map;
  }, [kpiSummary]);

  const isLoading = stLoading || tasksLoading;

  const upsertCalEntry = trpc.teamSkills.upsertCalendarEntry.useMutation({
    onSuccess: (data: any) => {
      refetchCal();
      setShowCalDialog(false);
      const propagated = data?.propagatedTo ?? 0;
      toast.success(
        propagated > 0
          ? `Calendar entry saved · propagated to ${propagated} sibling project${propagated > 1 ? "s" : ""}`
          : "Calendar entry saved"
      );
    },
  });

  const upsertCalRange = trpc.teamSkills.upsertCalendarRange.useMutation({
    onSuccess: (data: any) => {
      refetchCal();
      setShowCalDialog(false);
      const propagated = data?.propagatedTo ?? 0;
      const propMsg = propagated > 0 ? ` · propagated to ${propagated} sibling project${propagated > 1 ? "s" : ""}` : "";
      toast.success(`Calendar entries saved for ${data.count} day(s)${propMsg}`);
    },
  });
  const massUpsertWorking = trpc.teamSkills.massUpsertWorking.useMutation({
    onSuccess: (data: any) => {
      refetchCal();
      setShowMassDialog(false);
      const propMsg = (data?.propagatedCount ?? 0) > 0 ? ` · ${data.propagatedCount} entries propagated to sibling projects` : "";
      toast.success(`Mass fill done: ${data.filledWorking} working day(s) + ${data.filledHoliday} weekend holiday(s) created${propMsg}`);
    },
    onError: (e) => toast.error(e.message ?? "Mass fill failed"),
  });

  // ─── Workload Data ────────────────────────────────────────────────────────
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

  // ─── Team Overview ─────────────────────────────────────────────────────────
  const teamOverview = useMemo(() => {
    const internal = stakeholders.filter((s: any) => s.isInternalTeam || s.classification === "TeamMember").length;
    const external = stakeholders.filter((s: any) => s.classification === "External").length;
    const stakeholderOnly = stakeholders.length - internal - external;
    const byRole: Record<string, number> = {};
    const byStrategy: Record<string, number> = {};
    stakeholders.forEach((s: any) => {
      const role = s.role || s.stakeholderRole || "Unknown";
      byRole[role] = (byRole[role] || 0) + 1;
      const strategy = s.engagementStrategy || "Not set";
      byStrategy[strategy] = (byStrategy[strategy] || 0) + 1;
    });
    return { internal, external, stakeholderOnly, byRole, byStrategy };
  }, [stakeholders]);

  // ─── RBS Data ──────────────────────────────────────────────────────────────
  // Merge built-in defaults with any DB-stored types
  const allRbsTypeNames = useMemo(() => {
    const fromDb = (rbsTypes as any[]).map((t: any) => t.name);
    const defaults = ["TeamMember", "External", "Stakeholder"];
    const merged = Array.from(new Set([...defaults, ...fromDb]));
    return merged;
  }, [rbsTypes]);

  const rbsTree = useMemo(() => {
    const roleMap: Record<string, Record<string, any[]>> = {};
    allRbsTypeNames.forEach(name => { roleMap[name] = {}; });

    stakeholders.forEach((s: any) => {
      const cls = s.classification ?? (s.isInternalTeam ? "TeamMember" : "Stakeholder");
      const role = s.role || "Unassigned";
      if (!roleMap[cls]) roleMap[cls] = {};
      if (!roleMap[cls][role]) roleMap[cls][role] = [];
      roleMap[cls][role].push(s);
    });

    return { roleMap };
  }, [stakeholders, allRbsTypeNames]);

  function getRbsTypeColor(name: string): { bg: string; text: string; border: string } {
    const found = (rbsTypes as any[]).find((t: any) => t.name === name);
    if (found?.color) {
      return { bg: `${found.color}15`, text: found.color, border: `${found.color}40` };
    }
    if (name === "TeamMember") return { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" };
    if (name === "External") return { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" };
    if (name === "Stakeholder") return { bg: "#faf5ff", text: "#9333ea", border: "#e9d5ff" };
    return { bg: "#f9fafb", text: "#374151", border: "#e5e7eb" };
  }

  function getRbsTypeLabel(name: string): string {
    if (name === "TeamMember") return "Team Members";
    if (name === "External") return "External Resources";
    if (name === "Stakeholder") return "Stakeholders";
    return name;
  }

  function openRbsTypeDialog(existing?: any) {
    setRbsTypeEditing(existing ?? null);
    setRbsTypeForm(existing ? { name: existing.name, color: existing.color ?? "#6366f1", description: existing.description ?? "" } : { name: "", color: "#6366f1", description: "" });
    setShowRbsTypeDialog(true);
  }

  function saveRbsType() {
    if (!rbsTypeForm.name.trim()) return;
    if (rbsTypeEditing) {
      updateRbsType.mutate({ id: rbsTypeEditing.id, name: rbsTypeForm.name, color: rbsTypeForm.color, description: rbsTypeForm.description });
    } else {
      createRbsType.mutate({ projectId, name: rbsTypeForm.name, color: rbsTypeForm.color, description: rbsTypeForm.description });
    }
  }

  // ─── Calendar Map ──────────────────────────────────────────────────────────
  const calendarMap = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    calendarEntries.forEach((e: any) => {
      if (!map[e.stakeholderId]) map[e.stakeholderId] = {};
      // Normalize date: MySQL date field comes back as a JS Date object via superjson
      const dateKey = e.date instanceof Date
        ? e.date.toISOString().split("T")[0]
        : String(e.date).split("T")[0];
      map[e.stakeholderId][dateKey] = e;
    });
    return map;
  }, [calendarEntries]);

  /**
   * For a selected pooled resource: map date → array of cross-project entries
   * (includes entries from other projects that share this pooled resource).
   * Used to render an impact row/banner below the main calendar row.
   */
  const pooledImpactByDate = useMemo(() => {
    if (!calStakeholderId || pooledCalEntries.length === 0) return {} as Record<string, any[]>;
    const map: Record<string, any[]> = {};
    (pooledCalEntries as any[]).forEach((e: any) => {
      if (e.projectId === projectId) return; // skip own project entries
      const dateKey = e.date instanceof Date
        ? e.date.toISOString().split("T")[0]
        : String(e.date).split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(e);
    });
    return map;
  }, [pooledCalEntries, calStakeholderId, projectId]);

  const calDates = useMemo(() => {
    if (!calStart || !calEnd) return [];
    return getDatesInRange(calStart, calEnd).slice(0, 60); // max 60 days
  }, [calStart, calEnd]);

  // Build calendar resource list from RBS leaf nodes.
  // Each entry has: id (used as calendar key), name, subtitle, rbsNodeId.
  // If the RBS node has a stakeholderId, the calendar key = stakeholderId (to match existing entries).
  // Standalone RBS nodes use a synthetic negative key: -(rbsNodeId) to avoid collisions.
  const calResources = useMemo(() => {
    const leafNodes = (rbsNodes as any[]).filter(n => n.isLeaf === 1);
    if (leafNodes.length === 0) {
      // Fallback: show all stakeholders if no RBS leaf nodes defined yet
      const base = stakeholders.map((s: any) => ({
        id: s.id,
        name: s.fullName ?? s.name ?? `Stakeholder ${s.id}`,
        subtitle: s.role || s.classification || '',
        rbsNodeId: null,
        resourceType: s.classification ?? 'Human',
        isPooled: s.isPooledResource ?? false,
        email: s.email ?? '',
      }));
      let filtered = base;
      if (calCategoryFilter !== "all") filtered = filtered.filter(r => r.resourceType === calCategoryFilter);
      if (calStakeholderId) filtered = filtered.filter(r => r.id === calStakeholderId);
      return filtered;
    }
    const base = leafNodes.map((n: any) => {
      const calId = n.stakeholderId ? n.stakeholderId : -(n.id);
      const linkedSh = n.stakeholderId ? stakeholders.find((s: any) => s.id === n.stakeholderId) : null;
      return {
        id: calId,
        name: linkedSh ? (linkedSh.fullName ?? n.name) : n.name,
        subtitle: n.resourceType + (n.unit ? ` · ${n.unit}` : '') + (n.availability ? ` · ${n.availability}` : ''),
        rbsNodeId: n.id,
        resourceType: n.resourceType,
        isPooled: linkedSh?.isPooledResource ?? false,
        email: linkedSh?.email ?? '',
      };
    });
    let filtered = base;
    if (calCategoryFilter !== "all") filtered = filtered.filter(r => r.resourceType === calCategoryFilter);
    if (calStakeholderId) filtered = filtered.filter(r => r.id === calStakeholderId);
    return filtered;
  }, [rbsNodes, stakeholders, calStakeholderId, calCategoryFilter]);

  // ─── Resource Plan ─────────────────────────────────────────────────────────
  const resourcePlan = useMemo(() => {
    return workloadData.map((w) => {
      const weeklyCapacityHours = w.hoursPerDay * w.daysPerWeek;
      const totalCapacityHours = weeklyCapacityHours; // per week view
      const tasksThisWeek = w.thisWeek;
      // Estimate hours from tasks (assume avg 8h per task if no duration data)
      const estimatedHoursUsed = tasksThisWeek * 8;
      const utilPct = totalCapacityHours > 0
        ? Math.min(Math.round((estimatedHoursUsed / totalCapacityHours) * 100), 999)
        : 0;
      const unusedHours = Math.max(totalCapacityHours - estimatedHoursUsed, 0);
      const costAssigned = w.totalAssigned * 8 * w.hourlyRate;
      const costThisWeek = estimatedHoursUsed * w.hourlyRate;
      return { ...w, weeklyCapacityHours, estimatedHoursUsed, utilPct, unusedHours, costAssigned, costThisWeek };
    });
  }, [workloadData]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
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
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })()}
        </TabsContent>

        {/* ─── Resource Calendar Tab ────────────────────────────────────── */}
        <TabsContent value="calendar" className="mt-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Resource Calendar
              </CardTitle>
              <p className="text-xs text-muted-foreground">Track working days, leave, holidays, and training for each resource</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">From</Label>
                  <Input type="date" value={calStart} onChange={e => setCalStart(e.target.value)} className="w-40 h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To</Label>
                  <Input type="date" value={calEnd} onChange={e => setCalEnd(e.target.value)} className="w-40 h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">RBS Category</Label>
                  <Select value={calCategoryFilter} onValueChange={v => { setCalCategoryFilter(v); setCalStakeholderId(null); }}>
                    <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="All Categories" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {(rbsTypes as any[]).map((t: any) => (
                        <SelectItem key={t.id} value={t.name}>
                          <span className="flex items-center gap-1.5">
                            {t.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />}
                            {t.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Resource</Label>
                  <Select value={calStakeholderId ? String(calStakeholderId) : "all"} onValueChange={v => setCalStakeholderId(v === "all" ? null : Number(v))}>
                    <SelectTrigger className="w-48 h-8 text-sm"><SelectValue placeholder="All Resources" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Resources</SelectItem>
                      {calResources.map((r: any) => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 text-xs">
                  {Object.entries(CAL_TYPE_COLORS).map(([type, cls]) => (
                    <span key={type} className={`px-2 py-1 rounded border ${cls}`}>{type}</span>
                  ))}
                </div>
                {/* General holiday button — only at all-resources level */}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-blue-700 border-blue-300 hover:bg-blue-50"
                  onClick={() => openCalDialog(null, "", new Date().toISOString().split("T")[0], undefined, "range")}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Add Holiday
                </Button>
                {/* Mass Fill Working Days button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50"
                  onClick={() => setShowMassDialog(true)}
                  title="Mass fill empty days as Working for the selected resource(s)"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  Mass Fill
                </Button>
                {/* Export CSV button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    const rows: string[] = ["Resource,Date,Type,Hours,Notes"];
                    calResources.forEach((r: any) => {
                      calDates.forEach(date => {
                        const entry = calendarMap[r.id]?.[date];
                        if (entry) {
                          rows.push([
                            JSON.stringify(r.name),
                            date,
                            entry.type,
                            entry.availableHours ?? "",
                            JSON.stringify(entry.notes ?? ""),
                          ].join(","));
                        }
                      });
                    });
                    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `resource-calendar-${calStart}-to-${calEnd}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </Button>
              </div>

              {/* Calendar Grid */}
              {calResources.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <p className="font-medium">No resources defined yet.</p>
                  <p className="text-xs mt-1">Add leaf nodes in the RBS tab to populate the calendar.</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  {(() => {
                    const todayStr = new Date().toISOString().split("T")[0];
                    return (
                      <table className="text-xs border-collapse w-full min-w-max">
                        <thead>
                          <tr>
                            <th className="text-left p-2 bg-gray-50 border border-gray-200 w-44 font-medium">Resource</th>
                            {calDates.map(date => {
                              const d = new Date(date + "T00:00:00");
                              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                              const isToday = date === todayStr;
                              return (
                                <th key={date} className={`p-1 border text-center font-medium min-w-[52px] ${
                                  isToday ? "bg-red-50 border-red-300 text-red-700 font-bold"
                                  : isWeekend ? "bg-gray-100 text-gray-400 border-gray-200"
                                  : "bg-gray-50 border-gray-200"
                                }`}>
                                  <div>{d.toLocaleDateString("en-US", { weekday: "short" })}</div>
                                  <div className={`text-[10px] ${isToday ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                                  {isToday && <div className="text-[9px] font-semibold text-red-600">TODAY</div>}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {calResources.map((r: any) => {
                            const resourceName = r.name;
                            // For pooled resources with a single-resource filter, show cross-project impact row
                            const hasCrossProjectImpact = r.isPooled && Object.keys(pooledImpactByDate).length > 0 && calStakeholderId === r.id;
                            return (
                              <React.Fragment key={r.id}>
                                <tr className="hover:bg-gray-50/50">
                                  <td className="p-2 border border-gray-200 font-medium whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm truncate flex items-center gap-1">
                                          {r.name}
                                          {r.isPooled && (
                                            <span className="inline-flex items-center rounded px-1 py-0 text-[9px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200 ml-1" title="Pooled resource — calendar changes propagate to sibling projects">
                                              ⇄ Pooled
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground truncate">{r.subtitle}</div>
                                      </div>
                                      <button
                                        className="shrink-0 w-5 h-5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors"
                                        title={`Add calendar entry for ${r.name}`}
                                        onClick={() => openCalDialogForResource(r.id, r.name)}
                                      >
                                        <span className="text-xs font-bold leading-none">+</span>
                                      </button>
                                    </div>
                                  </td>
                                  {calDates.map(date => {
                                    const entry = calendarMap[r.id]?.[date];
                                    const d = new Date(date + "T00:00:00");
                                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                    const isToday = date === todayStr;
                                    const isPropagated = typeof entry?.notes === "string" && entry.notes.startsWith("[Propagated");
                                    const cellCls = entry
                                      ? CAL_TYPE_COLORS[entry.type] ?? "bg-gray-100 text-gray-600 border-gray-200"
                                      : isToday ? "bg-red-50 border-red-200"
                                      : isWeekend ? "bg-gray-100 text-gray-300" : "";
                                    const taskCount = (tasks as any[]).filter((t: any) => {
                                      if (!t.dueDate) return false;
                                      const dueStr = t.dueDate instanceof Date ? t.dueDate.toISOString().split("T")[0] : String(t.dueDate).split("T")[0];
                                      return dueStr === date && (t.responsible === resourceName);
                                    }).length;
                                    return (
                                      <td
                                        key={date}
                                        className={`p-1 border border-gray-200 text-center cursor-pointer hover:opacity-80 transition-opacity relative ${cellCls} ${isToday ? "border-red-300" : ""} ${isPropagated ? "ring-1 ring-inset ring-indigo-300" : ""}`}
                                        onClick={() => openCalDialog(r.id, r.name, date, entry, "single")}
                                        title={entry
                                          ? `${entry.type}${entry.availableHours ? " · " + entry.availableHours + "h" : ""}${entry.notes ? " — " + entry.notes : ""}${isPropagated ? " (from sibling project)" : ""}`
                                          : "Click to mark"}
                                      >
                                        {entry ? (
                                          <div>
                                            <div className="font-medium text-[10px]">{entry.type.slice(0, 3)}</div>
                                            {entry.availableHours !== undefined && entry.availableHours !== "8.0" && (
                                              <div className="text-[9px]">{entry.availableHours}h</div>
                                            )}
                                            {isPropagated && <div className="text-[8px] text-indigo-600">⇄</div>}
                                          </div>
                                        ) : isWeekend ? <span>—</span> : null}
                                        {taskCount > 0 && (
                                          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-blue-500 text-white text-[9px] font-bold rounded-bl flex items-center justify-center leading-none">
                                            {taskCount}
                                          </span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                                {/* Cross-project impact row for pooled resources */}
                                {hasCrossProjectImpact && (
                                  <tr className="bg-indigo-50/60 dark:bg-indigo-950/20">
                                    <td className="p-1.5 border border-indigo-100 text-[10px] text-indigo-700 font-medium whitespace-nowrap">
                                      <span title="Calendar entries from other projects sharing this pooled resource">⇄ Other projects</span>
                                    </td>
                                    {calDates.map(date => {
                                      const crossEntries: any[] = pooledImpactByDate[date] ?? [];
                                      if (crossEntries.length === 0) {
                                        return <td key={date} className="border border-indigo-100 p-0.5" />;
                                      }
                                      const types = crossEntries.map((e: any) => e.type);
                                      const hasConflict = types.some((t: string) => t === "Leave" || t === "Holiday" || t === "Training");
                                      return (
                                        <td
                                          key={date}
                                          className={`p-0.5 border border-indigo-100 text-center text-[9px] ${hasConflict ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"}`}
                                          title={crossEntries.map((e: any) => `${e.projectName ?? "?"}: ${e.type}${e.availableHours ? " " + e.availableHours + "h" : ""}`).join("\n")}
                                        >
                                          {crossEntries.map((e: any) => (
                                            <div key={e.id} className="leading-tight truncate">{(e.projectName ?? "?").slice(0, 6)} {e.type.slice(0, 3)}</div>
                                          ))}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Resource Plan Tab ────────────────────────────────────────── */}
        <TabsContent value="plan" className="mt-0 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Resource Management Plan
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Cost, availability, utilization, and task assignment per resource</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant={planViewMode === "weekly" ? "default" : "outline"} onClick={() => setPlanViewMode("weekly")} className="text-xs h-7">Weekly</Button>
                  <Button size="sm" variant={planViewMode === "monthly" ? "default" : "outline"} onClick={() => setPlanViewMode("monthly")} className="text-xs h-7">Monthly</Button>
                </div>
              </div>
              {/* Dropdown filters */}
              <div className="flex flex-wrap gap-3 items-end pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">Search</Label>
                  <div className="relative">
                    <Input
                      placeholder="Search resource..."
                      value={planSearch}
                      onChange={e => { setPlanSearch(e.target.value); setPlanResourceFilter(null); }}
                      className="w-44 h-8 text-sm pl-8"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">RBS Category</Label>
                  <Select value={planCategoryFilter} onValueChange={v => { setPlanCategoryFilter(v); setPlanResourceFilter(null); }}>
                    <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="All Categories" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {(rbsTypes as any[]).map((t: any) => (
                        <SelectItem key={t.id} value={t.name}>
                          <span className="flex items-center gap-1.5">
                            {t.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />}
                            {t.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Resource</Label>
                  <Select value={planResourceFilter ? String(planResourceFilter) : "all"} onValueChange={v => { setPlanResourceFilter(v === "all" ? null : Number(v)); setPlanSearch(""); }}>
                    <SelectTrigger className="w-48 h-8 text-sm"><SelectValue placeholder="All Resources" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Resources</SelectItem>
                      {resourcePlan.map((r: any) => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : resourcePlan.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No resources found. Add stakeholders first.</div>
              ) : (() => {
                const filteredPlan = resourcePlan.filter(r => {
                      if (planResourceFilter && r.id !== planResourceFilter) return false;
                      if (planSearch && !r.name.toLowerCase().includes(planSearch.toLowerCase())) return false;
                      if (planCategoryFilter !== "all") {
                        const node = (rbsNodes as any[]).find(n => n.stakeholderId === r.id && n.isLeaf === 1);
                        const typeName = node?.resourceType ?? (r as any).classification;
                        if (typeName !== planCategoryFilter) return false;
                      }
                      return true;
                    });
                return (
                <>
                  {/* Summary bar */}
                  <div className="px-5 py-3 bg-muted/30 border-b grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground">Total Resources</div>
                      <div className="font-bold text-lg">{filteredPlan.length}{planCategoryFilter !== "all" && <span className="text-xs font-normal text-muted-foreground ml-1">/ {resourcePlan.length}</span>}</div>
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
