import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, Loader2, Settings, BarChart2, Mail, Briefcase, UserCheck, UserX,
  LayoutGrid, ChevronRight, ChevronDown, CalendarDays, FileText,
  TreeDeciduous, DollarSign, Clock, TrendingUp,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import WorkloadHeatmap from "@/components/WorkloadHeatmap";

const DEFAULT_CAPACITY = 5; // tasks/week

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-16 shrink-0">{assigned}/{capacity} tasks</span>
    </div>
  );
}

function getLoadLabel(assigned: number, capacity: number): { label: string; className: string } {
  if (assigned > capacity) return { label: "Overloaded", className: "bg-red-100 text-red-700" };
  if (assigned / capacity >= 0.8) return { label: "Near Capacity", className: "bg-yellow-100 text-yellow-700" };
  return { label: "Available", className: "bg-green-100 text-green-700" };
}

function classificationBadge(c: string | null | undefined) {
  if (c === "TeamMember") return "bg-blue-100 text-blue-700";
  if (c === "External") return "bg-orange-100 text-orange-700";
  return "bg-purple-100 text-purple-700";
}

function getDatesInRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  const current = new Date(startStr);
  const end = new Date(endStr);
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

const CAL_TYPE_COLORS: Record<string, string> = {
  Working: "bg-green-100 text-green-700 border-green-200",
  Leave: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Holiday: "bg-blue-100 text-blue-700 border-blue-200",
  Training: "bg-purple-100 text-purple-700 border-purple-200",
};

// ─── Resource Plan Row ────────────────────────────────────────────────────────
function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Resources() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  // Existing state
  const [capacityMap, setCapacityMap] = useState<Record<string, number>>({});
  const [selectedStakeholderName, setSelectedStakeholderName] = useState<string | null>(null);
  const [newCapacity, setNewCapacity] = useState(DEFAULT_CAPACITY);
  const [showCapacityDialog, setShowCapacityDialog] = useState(false);

  // RBS state
  const [rbsExpanded, setRbsExpanded] = useState<Record<string, boolean>>({ TeamMember: true, External: true, Stakeholder: true });

  // Calendar state
  const [calStart, setCalStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [calEnd, setCalEnd] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 0);
    return d.toISOString().split("T")[0];
  });
  const [calStakeholderId, setCalStakeholderId] = useState<number | null>(null);
  const [calEditDate, setCalEditDate] = useState<string | null>(null);
  const [calEditStakeholder, setCalEditStakeholder] = useState<number | null>(null);
  const [calEditType, setCalEditType] = useState<"Working" | "Leave" | "Holiday" | "Training">("Leave");
  const [calEditHours, setCalEditHours] = useState("0");
  const [calEditNotes, setCalEditNotes] = useState("");
  const [showCalDialog, setShowCalDialog] = useState(false);

  // Resource Plan state
  const [planViewMode, setPlanViewMode] = useState<"weekly" | "monthly">("weekly");

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: stakeholders = [], isLoading: stLoading } = trpc.stakeholders.list.useQuery({ projectId }, { enabled });
  const { data: tasks = [], isLoading: tasksLoading } = trpc.tasks.list.useQuery({ projectId }, { enabled });
  const { data: calendarEntries = [], refetch: refetchCal } = trpc.teamSkills.listCalendar.useQuery(
    { projectId, stakeholderId: calStakeholderId ?? undefined, startDate: calStart, endDate: calEnd },
    { enabled }
  );

  const isLoading = stLoading || tasksLoading;

  const upsertCalEntry = trpc.teamSkills.upsertCalendarEntry.useMutation({
    onSuccess: () => {
      refetchCal();
      setShowCalDialog(false);
      toast.success("Calendar entry saved");
    },
  });

  // ─── Workload Data ────────────────────────────────────────────────────────
  const workloadData = useMemo(() => {
    return stakeholders.map((s: any) => {
      const name = s.fullName ?? s.name ?? `Stakeholder ${s.id}`;
      const assigned = tasks.filter((t: any) => t.responsible === name || t.responsible === s.fullName || t.responsible === s.name);
      const thisWeek = assigned.filter((t: any) => isInWeek(t.dueDate, 0)).length;
      const nextWeek = assigned.filter((t: any) => isInWeek(t.dueDate, 1)).length;
      const next2 = assigned.filter((t: any) => isInWeek(t.dueDate, 2)).length;
      const next3 = assigned.filter((t: any) => isInWeek(t.dueDate, 3)).length;
      const next4 = assigned.filter((t: any) => isInWeek(t.dueDate, 4)).length;
      const cap = capacityMap[name] ?? DEFAULT_CAPACITY;
      const hourlyRate = parseFloat(s.costPerHour ?? "0") || 0;
      const dailyRate = parseFloat(s.costPerDay ?? "0") || (hourlyRate * (parseFloat(s.workingHoursPerDay ?? "8") || 8));
      const hoursPerDay = parseFloat(s.workingHoursPerDay ?? "8") || 8;
      const daysPerWeek = s.workingDaysPerWeek ?? 5;
      return {
        id: s.id,
        name,
        role: s.role ?? s.stakeholderRole ?? "",
        email: s.email ?? "",
        classification: s.classification ?? (s.isInternalTeam ? "TeamMember" : "Stakeholder"),
        department: s.department ?? "",
        totalAssigned: assigned.length,
        thisWeek, nextWeek, next2, next3, next4,
        capacity: cap,
        hourlyRate,
        dailyRate,
        hoursPerDay,
        daysPerWeek,
        isPooled: s.isPooledResource ?? false,
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
  const rbsTree = useMemo(() => {
    const groups: Record<string, { role: string; members: any[] }[]> = {
      TeamMember: [],
      External: [],
      Stakeholder: [],
    };
    const roleMap: Record<string, Record<string, any[]>> = { TeamMember: {}, External: {}, Stakeholder: {} };

    stakeholders.forEach((s: any) => {
      const cls = s.classification ?? (s.isInternalTeam ? "TeamMember" : "Stakeholder");
      const role = s.role || "Unassigned";
      if (!roleMap[cls]) roleMap[cls] = {};
      if (!roleMap[cls][role]) roleMap[cls][role] = [];
      roleMap[cls][role].push(s);
    });

    return { roleMap };
  }, [stakeholders]);

  // ─── Calendar Map ──────────────────────────────────────────────────────────
  const calendarMap = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    calendarEntries.forEach((e: any) => {
      if (!map[e.stakeholderId]) map[e.stakeholderId] = {};
      map[e.stakeholderId][e.date] = e;
    });
    return map;
  }, [calendarEntries]);

  const calDates = useMemo(() => {
    if (!calStart || !calEnd) return [];
    return getDatesInRange(calStart, calEnd).slice(0, 60); // max 60 days
  }, [calStart, calEnd]);

  const calStakeholders = useMemo(() => {
    if (calStakeholderId) return stakeholders.filter((s: any) => s.id === calStakeholderId);
    return stakeholders;
  }, [stakeholders, calStakeholderId]);

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
    setSelectedStakeholderName(name);
    setNewCapacity(currentCap);
    setShowCapacityDialog(true);
  }

  function saveCapacity() {
    if (!selectedStakeholderName) return;
    setCapacityMap((prev) => ({ ...prev, [selectedStakeholderName]: newCapacity }));
    toast.success(`Capacity updated for ${selectedStakeholderName}`);
    setShowCapacityDialog(false);
  }

  function openCalDialog(stakeholderId: number, date: string, existing?: any) {
    setCalEditStakeholder(stakeholderId);
    setCalEditDate(date);
    setCalEditType(existing?.type ?? "Leave");
    setCalEditHours(existing?.availableHours ?? "0");
    setCalEditNotes(existing?.notes ?? "");
    setShowCalDialog(true);
  }

  function saveCalEntry() {
    if (!calEditStakeholder || !calEditDate) return;
    upsertCalEntry.mutate({
      stakeholderId: calEditStakeholder,
      projectId,
      date: calEditDate,
      type: calEditType,
      availableHours: calEditHours,
      notes: calEditNotes,
    });
  }

  if (!currentProjectId) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-muted-foreground">
        Select a project to view resources.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-gray-500" />
            Resource Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Team composition, capacity, workload, and resource planning</p>
        </div>
        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
      </div>

      <Tabs defaultValue="workload">
        <TabsList className="mb-2 flex-wrap h-auto gap-1">
          <TabsTrigger value="workload"><BarChart2 className="w-3.5 h-3.5 mr-1.5" />Workload</TabsTrigger>
          <TabsTrigger value="heatmap"><LayoutGrid className="w-3.5 h-3.5 mr-1.5" />Heatmap</TabsTrigger>
          <TabsTrigger value="team"><Users className="w-3.5 h-3.5 mr-1.5" />Team Overview</TabsTrigger>
          <TabsTrigger value="rbs"><TreeDeciduous className="w-3.5 h-3.5 mr-1.5" />RBS</TabsTrigger>
          <TabsTrigger value="calendar"><CalendarDays className="w-3.5 h-3.5 mr-1.5" />Resource Calendar</TabsTrigger>
          <TabsTrigger value="plan"><FileText className="w-3.5 h-3.5 mr-1.5" />Resource Plan</TabsTrigger>
        </TabsList>

        {/* ─── Workload Tab ─────────────────────────────────────────────── */}
        <TabsContent value="workload" className="mt-0 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Team Members</div><div className="text-3xl font-bold">{summaryStats.totalMembers}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Assigned Tasks</div><div className="text-3xl font-bold">{summaryStats.totalTasks}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg Load / Person</div><div className="text-3xl font-bold">{summaryStats.avgLoad}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Overloaded This Week</div><div className={`text-3xl font-bold ${summaryStats.overloaded > 0 ? "text-red-600" : "text-green-600"}`}>{summaryStats.overloaded}</div></Card>
          </div>

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
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : workloadData.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">No stakeholders found. Add stakeholders to see workload.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {workloadData.map((w) => {
                  const { label, className } = getLoadLabel(w.thisWeek, w.capacity);
                  return (
                    <div key={w.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3">
                          <div className="font-medium text-sm">{w.name}</div>
                          {w.role && <div className="text-xs text-muted-foreground">{w.role}</div>}
                          {w.email && <div className="text-xs text-muted-foreground">{w.email}</div>}
                        </div>
                        <div className="col-span-2 text-center"><div className="text-2xl font-bold">{w.thisWeek}</div><div className="text-xs text-muted-foreground">tasks</div></div>
                        <div className="col-span-2 text-center"><div className="text-2xl font-bold text-muted-foreground">{w.nextWeek}</div><div className="text-xs text-muted-foreground">tasks</div></div>
                        <div className="col-span-2 text-center"><div className="text-sm text-muted-foreground">{w.next2} / {w.next3}</div><div className="text-xs text-muted-foreground">wk 3 / wk 4</div></div>
                        <div className="col-span-2"><WorkloadBar assigned={w.thisWeek} capacity={w.capacity} /><Badge className={`text-xs mt-1 ${className}`}>{label}</Badge></div>
                        <div className="col-span-1 text-right">
                          <Button size="sm" variant="ghost" onClick={() => openCapacityDialog(w.name, w.capacity)} title="Set capacity">
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

          <div>
            <h2 className="text-base font-semibold mb-3">4-Week Forecast</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((offset) => {
                const { start, end } = getWeekBounds(offset);
                const label = offset === 0 ? "This Week" : offset === 1 ? "Next Week" : `Week +${offset}`;
                const totalForWeek = workloadData.reduce((sum, w) => sum + [w.thisWeek, w.nextWeek, w.next2, w.next3][offset], 0);
                return (
                  <Card key={offset} className="p-4">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
                    <div className="text-3xl font-bold">{totalForWeek}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ─── Heatmap Tab ──────────────────────────────────────────────── */}
        <TabsContent value="heatmap" className="mt-0">
          <Card className="p-4">
            <div className="mb-3">
              <h3 className="font-semibold text-sm">Workload Heatmap</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Utilization per team member across the next 12 weeks</p>
            </div>
            <WorkloadHeatmap
              resources={workloadData.map((w) => {
                const weeklyData = [0,1,2,3,4,5,6,7,8,9,10,11].map((weekOffset) => {
                  const start = new Date();
                  start.setHours(0,0,0,0);
                  const day = start.getDay();
                  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7);
                  const weekStart = start.toISOString().split("T")[0];
                  const tasksInWeek = weekOffset === 0 ? w.thisWeek : weekOffset === 1 ? w.nextWeek : weekOffset === 2 ? w.next2 : weekOffset === 3 ? w.next3 : weekOffset === 4 ? w.next4 : 0;
                  const utilization = w.capacity > 0 ? Math.round((tasksInWeek / w.capacity) * 100) : 0;
                  return { weekStart, utilization };
                });
                return { id: w.id, name: w.name, weeklyData };
              })}
            />
          </Card>
        </TabsContent>

        {/* ─── Team Overview Tab ────────────────────────────────────────── */}
        <TabsContent value="team" className="mt-0 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1"><UserCheck className="w-4 h-4 text-blue-500" /><div className="text-xs text-muted-foreground uppercase tracking-wide">Team Members</div></div>
              <div className="text-3xl font-bold text-blue-600">{teamOverview.internal}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1"><UserX className="w-4 h-4 text-orange-500" /><div className="text-xs text-muted-foreground uppercase tracking-wide">External</div></div>
              <div className="text-3xl font-bold text-orange-600">{teamOverview.external}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-purple-500" /><div className="text-xs text-muted-foreground uppercase tracking-wide">Stakeholders</div></div>
              <div className="text-3xl font-bold text-purple-600">{teamOverview.stakeholderOnly}</div>
            </Card>
            <Card className="p-4 col-span-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Engagement Strategies</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(teamOverview.byStrategy).map(([s, count]) => (
                  <span key={s} className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-1">
                    <span className="font-semibold">{count}</span> {s}
                  </span>
                ))}
                {Object.keys(teamOverview.byStrategy).length === 0 && <span className="text-xs text-muted-foreground">No strategies set</span>}
              </div>
            </Card>
          </div>
          {Object.keys(teamOverview.byRole).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-muted-foreground" />Role Distribution</h3>
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
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" />All Resources ({stakeholders.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stakeholders.map((s: any) => {
                const name = s.fullName ?? s.name ?? `Stakeholder ${s.id}`;
                const assignedCount = workloadData.find(w => w.name === name)?.totalAssigned ?? 0;
                const cls = s.classification ?? (s.isInternalTeam ? "TeamMember" : "Stakeholder");
                return (
                  <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{name}</span>
                          <Badge className={`text-[10px] px-1 py-0 ${classificationBadge(cls)}`}>{cls}</Badge>
                        </div>
                        {s.role && <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><Briefcase className="w-3 h-3" />{s.role}</div>}
                        {s.email && <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{s.email}</div>}
                        {s.department && <div className="text-xs text-muted-foreground mt-0.5">{s.department}</div>}
                      </div>
                      <div className="text-right shrink-0"><div className="text-xl font-bold">{assignedCount}</div><div className="text-[10px] text-muted-foreground">tasks</div></div>
                    </div>
                    {s.engagementStrategy && <div className="mt-2"><Badge variant="outline" className="text-[10px]">{s.engagementStrategy}</Badge></div>}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ─── RBS Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="rbs" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TreeDeciduous className="w-4 h-4" />
                Resource Breakdown Structure
              </CardTitle>
              <p className="text-xs text-muted-foreground">Hierarchical view of all resources organized by classification and role</p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-2">
                  {/* Root node */}
                  <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg font-semibold text-sm">
                    <Users className="w-4 h-4 text-gray-600" />
                    Project Resources ({stakeholders.length})
                  </div>
                  {(["TeamMember", "External", "Stakeholder"] as const).map((cls) => {
                    const clsRoles = rbsTree.roleMap[cls] ?? {};
                    const clsCount = Object.values(clsRoles).reduce((sum, arr) => sum + arr.length, 0);
                    if (clsCount === 0) return null;
                    const isExpanded = rbsExpanded[cls];
                    const clsLabel = cls === "TeamMember" ? "Team Members" : cls === "External" ? "External Resources" : "Stakeholders";
                    const clsColor = cls === "TeamMember" ? "text-blue-600" : cls === "External" ? "text-orange-600" : "text-purple-600";
                    const clsBg = cls === "TeamMember" ? "bg-blue-50 border-blue-200" : cls === "External" ? "bg-orange-50 border-orange-200" : "bg-purple-50 border-purple-200";
                    return (
                      <div key={cls} className="ml-4">
                        <button
                          className={`flex items-center gap-2 p-2 w-full text-left rounded-lg border ${clsBg} hover:opacity-80 transition-opacity`}
                          onClick={() => setRbsExpanded(prev => ({ ...prev, [cls]: !prev[cls] }))}
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                          <span className={`font-medium text-sm ${clsColor}`}>{clsLabel}</span>
                          <Badge className={`text-[10px] ml-auto ${classificationBadge(cls)}`}>{clsCount}</Badge>
                        </button>
                        {isExpanded && (
                          <div className="ml-6 mt-1 space-y-1">
                            {Object.entries(clsRoles).map(([role, members]) => {
                              const roleKey = `${cls}__${role}`;
                              const roleExpanded = rbsExpanded[roleKey] ?? true;
                              return (
                                <div key={role}>
                                  <button
                                    className="flex items-center gap-2 p-1.5 w-full text-left rounded hover:bg-muted/40"
                                    onClick={() => setRbsExpanded(prev => ({ ...prev, [roleKey]: !prev[roleKey] }))}
                                  >
                                    {roleExpanded ? <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />}
                                    <Briefcase className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-sm">{role}</span>
                                    <span className="text-xs text-muted-foreground ml-auto">({members.length})</span>
                                  </button>
                                  {roleExpanded && (
                                    <div className="ml-6 space-y-1">
                                      {members.map((m: any) => {
                                        const wl = workloadData.find(w => w.id === m.id);
                                        return (
                                          <div key={m.id} className="flex items-center gap-3 p-2 bg-white border border-gray-100 rounded-lg hover:border-gray-200">
                                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium shrink-0">
                                              {(m.fullName ?? m.name ?? "?")[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-sm font-medium truncate">{m.fullName ?? m.name}</div>
                                              <div className="text-xs text-muted-foreground">{m.department || m.job || m.email || "—"}</div>
                                            </div>
                                            {m.costPerHour && (
                                              <div className="text-xs text-muted-foreground shrink-0">${m.costPerHour}/hr</div>
                                            )}
                                            {wl && (
                                              <Badge className={`text-[10px] shrink-0 ${getLoadLabel(wl.thisWeek, wl.capacity).className}`}>
                                                {wl.thisWeek}/{wl.capacity}
                                              </Badge>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
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
                  <Label className="text-xs">Resource</Label>
                  <Select value={calStakeholderId ? String(calStakeholderId) : "all"} onValueChange={v => setCalStakeholderId(v === "all" ? null : Number(v))}>
                    <SelectTrigger className="w-48 h-8 text-sm"><SelectValue placeholder="All Resources" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Resources</SelectItem>
                      {stakeholders.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.fullName ?? s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 text-xs">
                  {Object.entries(CAL_TYPE_COLORS).map(([type, cls]) => (
                    <span key={type} className={`px-2 py-1 rounded border ${cls}`}>{type}</span>
                  ))}
                </div>
              </div>

              {/* Calendar Grid */}
              {calStakeholders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No resources found.</div>
              ) : (
                <div className="overflow-auto">
                  <table className="text-xs border-collapse w-full min-w-max">
                    <thead>
                      <tr>
                        <th className="text-left p-2 bg-gray-50 border border-gray-200 w-36 font-medium">Resource</th>
                        {calDates.map(date => {
                          const d = new Date(date + "T00:00:00");
                          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                          return (
                            <th key={date} className={`p-1 border border-gray-200 text-center font-medium min-w-[52px] ${isWeekend ? "bg-gray-100 text-gray-400" : "bg-gray-50"}`}>
                              <div>{d.toLocaleDateString("en-US", { weekday: "short" })}</div>
                              <div className="text-[10px] text-muted-foreground">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {calStakeholders.map((s: any) => (
                        <tr key={s.id} className="hover:bg-gray-50/50">
                          <td className="p-2 border border-gray-200 font-medium whitespace-nowrap">
                            <div>{s.fullName ?? s.name}</div>
                            <div className="text-[10px] text-muted-foreground">{s.role || s.classification || ""}</div>
                          </td>
                          {calDates.map(date => {
                            const entry = calendarMap[s.id]?.[date];
                            const d = new Date(date + "T00:00:00");
                            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                            const cellCls = entry
                              ? CAL_TYPE_COLORS[entry.type] ?? "bg-gray-100 text-gray-600 border-gray-200"
                              : isWeekend ? "bg-gray-100 text-gray-300" : "";
                            return (
                              <td
                                key={date}
                                className={`p-1 border border-gray-200 text-center cursor-pointer hover:opacity-80 transition-opacity ${cellCls}`}
                                onClick={() => openCalDialog(s.id, date, entry)}
                                title={entry ? `${entry.type}${entry.notes ? " — " + entry.notes : ""}` : "Click to mark"}
                              >
                                {entry ? (
                                  <div>
                                    <div className="font-medium text-[10px]">{entry.type.slice(0, 3)}</div>
                                    {entry.availableHours !== undefined && entry.availableHours !== "8.0" && (
                                      <div className="text-[9px]">{entry.availableHours}h</div>
                                    )}
                                  </div>
                                ) : isWeekend ? <span>—</span> : null}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Resource Plan Tab ────────────────────────────────────────── */}
        <TabsContent value="plan" className="mt-0 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
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
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : resourcePlan.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No resources found. Add stakeholders first.</div>
              ) : (
                <>
                  {/* Summary bar */}
                  <div className="px-5 py-3 bg-muted/30 border-b grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground">Total Resources</div>
                      <div className="font-bold text-lg">{resourcePlan.length}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total Capacity (hrs/{planViewMode === "weekly" ? "wk" : "mo"})</div>
                      <div className="font-bold text-lg">{resourcePlan.reduce((s, r) => s + (planViewMode === "weekly" ? r.weeklyCapacityHours : r.weeklyCapacityHours * 4), 0).toFixed(0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total Tasks Assigned</div>
                      <div className="font-bold text-lg">{resourcePlan.reduce((s, r) => s + r.totalAssigned, 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Estimated Cost (this wk)</div>
                      <div className="font-bold text-lg">{formatCurrency(resourcePlan.reduce((s, r) => s + r.costThisWeek, 0))}</div>
                    </div>
                  </div>

                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-44">Resource</TableHead>
                          <TableHead>Classification</TableHead>
                          <TableHead className="text-right">Rate ($/hr)</TableHead>
                          <TableHead className="text-right">Capacity (hrs/{planViewMode === "weekly" ? "wk" : "mo"})</TableHead>
                          <TableHead className="text-right">Tasks (total)</TableHead>
                          <TableHead className="text-right">Est. Hours Used</TableHead>
                          <TableHead className="text-right">Utilization</TableHead>
                          <TableHead className="text-right">Unused Hours</TableHead>
                          <TableHead className="text-right">Est. Cost (total)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resourcePlan.map((r) => {
                          const capacityHrs = planViewMode === "weekly" ? r.weeklyCapacityHours : r.weeklyCapacityHours * 4;
                          const estUsed = planViewMode === "weekly" ? r.estimatedHoursUsed : r.totalAssigned * 8;
                          const unused = Math.max(capacityHrs - estUsed, 0);
                          const util = capacityHrs > 0 ? Math.min(Math.round((estUsed / capacityHrs) * 100), 999) : 0;
                          const costTotal = r.totalAssigned * 8 * r.hourlyRate;
                          const utilColor = util > 100 ? "text-red-600 font-bold" : util >= 80 ? "text-yellow-600" : "text-green-600";
                          return (
                            <TableRow key={r.id} className="hover:bg-muted/20">
                              <TableCell>
                                <div className="font-medium text-sm">{r.name}</div>
                                {r.role && <div className="text-xs text-muted-foreground">{r.role}</div>}
                                {r.department && <div className="text-xs text-muted-foreground">{r.department}</div>}
                                {r.isPooled && <Badge className="text-[10px] bg-indigo-100 text-indigo-700 mt-0.5">Pooled</Badge>}
                              </TableCell>
                              <TableCell>
                                <Badge className={`text-xs ${classificationBadge(r.classification)}`}>{r.classification}</Badge>
                              </TableCell>
                              <TableCell className="text-right">{r.hourlyRate > 0 ? `$${r.hourlyRate.toFixed(0)}` : "—"}</TableCell>
                              <TableCell className="text-right font-medium">{capacityHrs.toFixed(0)}h</TableCell>
                              <TableCell className="text-right">{r.totalAssigned}</TableCell>
                              <TableCell className="text-right">{estUsed.toFixed(0)}h</TableCell>
                              <TableCell className={`text-right font-semibold ${utilColor}`}>{util}%</TableCell>
                              <TableCell className="text-right text-muted-foreground">{unused.toFixed(0)}h</TableCell>
                              <TableCell className="text-right">{costTotal > 0 ? formatCurrency(costTotal) : "—"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Capacity Dialog ──────────────────────────────────────────────── */}
      <Dialog open={showCapacityDialog} onOpenChange={setShowCapacityDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Set Weekly Capacity</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {selectedStakeholderName && (
              <p className="text-sm text-muted-foreground">Setting capacity for <span className="font-medium text-gray-900">{selectedStakeholderName}</span></p>
            )}
            <div className="space-y-1">
              <Label>Tasks per week (capacity)</Label>
              <Input type="number" min={1} max={50} value={newCapacity} onChange={(e) => setNewCapacity(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCapacityDialog(false)}>Cancel</Button>
            <Button onClick={saveCapacity}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Calendar Entry Dialog ────────────────────────────────────────── */}
      <Dialog open={showCalDialog} onOpenChange={setShowCalDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Mark Day — {calEditDate}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={calEditType} onValueChange={v => setCalEditType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Working">Working</SelectItem>
                  <SelectItem value="Leave">Leave</SelectItem>
                  <SelectItem value="Holiday">Holiday</SelectItem>
                  <SelectItem value="Training">Training</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Available Hours</Label>
              <Input type="number" min={0} max={24} step={0.5} value={calEditHours} onChange={e => setCalEditHours(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input value={calEditNotes} onChange={e => setCalEditNotes(e.target.value)} placeholder="Optional note" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalDialog(false)}>Cancel</Button>
            <Button onClick={saveCalEntry} disabled={upsertCalEntry.isPending}>
              {upsertCalEntry.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
