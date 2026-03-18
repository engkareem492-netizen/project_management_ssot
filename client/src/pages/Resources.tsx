import React, { useState, useMemo } from "react";
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
  LayoutGrid, ChevronRight, ChevronDown, ChevronLeft, CalendarDays, FileText,
  TreeDeciduous, DollarSign, Clock, TrendingUp, Plus, Pencil, Trash2,
  ArrowUp, ArrowDown, Check, X, FolderTree, Cpu, Wrench, Package, Server, Banknote,
  Building2, HardHat, Truck, FlaskConical, Wifi, UserPlus, Import, Download, Zap,
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
  const [showRbsTypeDialog, setShowRbsTypeDialog] = useState(false);
  const [rbsTypeEditing, setRbsTypeEditing] = useState<any | null>(null);
  const [rbsTypeForm, setRbsTypeForm] = useState({ name: "", color: "#6366f1", description: "" });
  // RBS Nodes state
  const emptyRbsForm = () => ({ code: '', name: '', resourceType: 'Human', parentId: '__root__', description: '', unit: 'Person', quantity: '1', costRate: '', availability: '100%', stakeholderId: '', isLeaf: '0' });
  const [rbsNodeForm, setRbsNodeForm] = useState(emptyRbsForm());
  const [rbsNodeExpanded, setRbsNodeExpanded] = useState<Record<number, boolean>>({});
  const [rbsEditingNodeId, setRbsEditingNodeId] = useState<number | null>(null);
  const [rbsEditForm, setRbsEditForm] = useState({ code: '', name: '', resourceType: 'Human', description: '', unit: '', quantity: '', costRate: '', availability: '', stakeholderId: '', isLeaf: '0' });
  const [rbsAddChildParentId, setRbsAddChildParentId] = useState<number | null>(null);
  const [rbsAddChildForm, setRbsAddChildForm] = useState({ code: '', name: '', resourceType: 'Human', description: '', unit: 'Person', quantity: '1', costRate: '', availability: '100%', stakeholderId: '', isLeaf: '1' });
  const [showImportStakeholders, setShowImportStakeholders] = useState(false);
  const [importParentId, setImportParentId] = useState<number | null>(null);
  const [selectedImportStakeholders, setSelectedImportStakeholders] = useState<number[]>([]);

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
  const [calCategoryFilter, setCalCategoryFilter] = useState<string>("all");
  const [calEditDate, setCalEditDate] = useState<string | null>(null);
  const [calEditEndDate, setCalEditEndDate] = useState<string | null>(null);
  const [calEntryMode, setCalEntryMode] = useState<"single" | "range">("single");
  const [calEditStakeholder, setCalEditStakeholder] = useState<number | null>(null);
  const [calEditStakeholderName, setCalEditStakeholderName] = useState<string>("");
  const [calEditType, setCalEditType] = useState<"Working" | "Leave" | "Holiday" | "Training">("Leave");
  const [calEditHours, setCalEditHours] = useState("0");
  // Holiday stakeholder assignment
  const [calHolidayScope, setCalHolidayScope] = useState<"all" | "selected">("all");
  const [calHolidayStakeholderIds, setCalHolidayStakeholderIds] = useState<number[]>([]);
  // Stakeholder task summary popup
  const [taskSummaryStakeholder, setTaskSummaryStakeholder] = useState<any | null>(null);
  const [calEditNotes, setCalEditNotes] = useState("");
  const [calSkipWeekends, setCalSkipWeekends] = useState(true);
  const [showCalDialog, setShowCalDialog] = useState(false);

  // Resource Plan state
  const [planViewMode, setPlanViewMode] = useState<"weekly" | "monthly">("weekly");
  const [planCategoryFilter, setPlanCategoryFilter] = useState<string>("all");

  // Heatmap filter state
  const [heatmapTypeFilter, setHeatmapTypeFilter] = useState<"all" | "TeamMember" | "External" | "Stakeholder">("all");
  const [heatmapRoleFilter, setHeatmapRoleFilter] = useState<string>("all");

  // Workload sort state
  const [workloadSort, setWorkloadSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "totalAssigned", dir: "desc" });
  const [workloadFilter, setWorkloadFilter] = useState<"all" | "TeamMember" | "External" | "Stakeholder">("all");

  // ─── RBS Wizard state ──────────────────────────────────────────────────────
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [wizardCategoryId, setWizardCategoryId] = useState<number | null>(null);
  const [wizardSelectedWbsId, setWizardSelectedWbsId] = useState<number | null>(null);
  const [wizardAssignForm, setWizardAssignForm] = useState({ rbsNodeId: "", allocationPct: "100", notes: "" });
  const [wizardAddResourceForm, setWizardAddResourceForm] = useState({ code: "", name: "", unit: "Person", quantity: "1", costRate: "", availability: "100%", stakeholderId: "" });
  const [wizardAddingResource, setWizardAddingResource] = useState(false);
  const [wizardEditTypeId, setWizardEditTypeId] = useState<number | null>(null);
  const [wizardTypeForm, setWizardTypeForm] = useState({ name: "", color: "#6366f1", description: "" });
  const [wizardAddingType, setWizardAddingType] = useState(false);
  const [wizardExpandedWbs, setWizardExpandedWbs] = useState<Record<number, boolean>>({});

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: stakeholders = [], isLoading: stLoading } = trpc.stakeholders.list.useQuery({ projectId }, { enabled });
  const { data: tasks = [], isLoading: tasksLoading } = trpc.tasks.list.useQuery({ projectId }, { enabled });
  const { data: rbsTypes = [], refetch: refetchRbsTypes } = trpc.rbsResourceTypes.list.useQuery({ projectId }, { enabled });

  const createRbsType = trpc.rbsResourceTypes.create.useMutation({
    onSuccess: () => { refetchRbsTypes(); setShowRbsTypeDialog(false); toast.success("Resource type created"); },
  });
  const updateRbsType = trpc.rbsResourceTypes.update.useMutation({
    onSuccess: () => { refetchRbsTypes(); setShowRbsTypeDialog(false); toast.success("Resource type updated"); },
  });
  const deleteRbsType = trpc.rbsResourceTypes.delete.useMutation({
    onSuccess: () => { refetchRbsTypes(); toast.success("Resource type deleted"); },
  });
  const seedRbsTypes = trpc.rbsResourceTypes.seedBuiltIn.useMutation({
    onSuccess: () => refetchRbsTypes(),
  });
  const { data: rbsNodes = [], refetch: refetchRbsNodes } = trpc.rbsNodes.list.useQuery({ projectId }, { enabled });
  const createRbsNode = trpc.rbsNodes.create.useMutation({
    onSuccess: () => { refetchRbsNodes(); setRbsNodeForm(emptyRbsForm()); toast.success('Node added'); },
    onError: (e) => toast.error(e.message),
  });
  const deleteRbsNode = trpc.rbsNodes.delete.useMutation({
    onSuccess: () => { refetchRbsNodes(); toast.success('Node deleted'); },
  });
  const updateRbsNode = trpc.rbsNodes.update.useMutation({
    onSuccess: () => { refetchRbsNodes(); setRbsEditingNodeId(null); toast.success('Node updated'); },
    onError: (e) => toast.error(e.message),
  });

  const { data: calendarEntries = [], refetch: refetchCal } = trpc.teamSkills.listCalendar.useQuery(
    { projectId, stakeholderId: calStakeholderId ?? undefined, startDate: calStart, endDate: calEnd },
    { enabled }
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
    onSuccess: () => {
      refetchCal();
      setShowCalDialog(false);
      toast.success("Calendar entry saved");
    },
  });

  const upsertCalRange = trpc.teamSkills.upsertCalendarRange.useMutation({
    onSuccess: (data) => {
      refetchCal();
      setShowCalDialog(false);
      toast.success(`Calendar entries saved for ${data.count} day(s)`);
    },
  });

  // ─── Workload Data ────────────────────────────────────────────────────────
  const workloadData = useMemo(() => {
    return stakeholders.map((s: any) => {
      const name = s.fullName ?? s.name ?? `Stakeholder ${s.id}`;
      const assigned = tasks.filter((t: any) => t.responsible === name || t.responsible === s.fullName || t.responsible === s.name);
      const nonCommAssigned = assigned.filter((t: any) => !t.communicationStakeholderId).length;
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
        nonCommAssigned,
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

  function openCalDialog(stakeholderId: number | null, stakeholderName: string, date: string, existing?: any, mode: "single" | "range" = "single") {
    setCalEditStakeholder(stakeholderId);
    setCalEditStakeholderName(stakeholderName);
    setCalEditDate(date);
    setCalEditEndDate(date);
    setCalEntryMode(mode);
    // When opening at general level (null stakeholder) default to Holiday; otherwise Leave
    const defaultType = stakeholderId === null ? "Holiday" : "Leave";
    const entryType = existing?.type ?? defaultType;
    setCalEditType(entryType);
    setCalEditHours(existing?.availableHours ?? (entryType === "Working" || entryType === "Training" ? "8" : "0"));
    setCalHolidayScope("all");
    setCalHolidayStakeholderIds([]);
    setCalEditNotes(existing?.notes ?? "");
    setCalSkipWeekends(true);
    setShowCalDialog(true);
  }

  function openCalDialogForResource(stakeholderId: number, stakeholderName: string) {
    const today = new Date().toISOString().split("T")[0];
    openCalDialog(stakeholderId, stakeholderName, today, undefined, "range");
  }

  function saveCalEntry() {
    if (!calEditDate) return;

    // Determine which stakeholders to apply the entry to
    // Holiday at general level (calEditStakeholder === null) → apply to all / selected
    // Holiday at stakeholder level (calEditStakeholder !== null) → treat as personal Leave
    let targetIds: number[] = [];
    let effectiveType = calEditType;

    if (calEditType === "Holiday" && calEditStakeholder === null) {
      // General holiday — applies to all or selected
      if (calHolidayScope === "all") {
        targetIds = (stakeholders as any[]).map((s: any) => s.id);
      } else {
        targetIds = calHolidayStakeholderIds;
      }
      if (targetIds.length === 0) { toast.error("Select at least one stakeholder for this holiday"); return; }
    } else {
      // Stakeholder-level entry: Holiday becomes Leave (personal)
      if (calEditType === "Holiday") effectiveType = "Leave";
      if (!calEditStakeholder) return;
      targetIds = [calEditStakeholder];
    }

    const savePromises = targetIds.map(sid => {
      if (calEntryMode === "range" && calEditEndDate && calEditEndDate !== calEditDate) {
        return upsertCalRange.mutateAsync({
          stakeholderId: sid,
          projectId,
          startDate: calEditDate!,
          endDate: calEditEndDate,
          type: effectiveType,
          availableHours: calEditHours,
          notes: calEditNotes,
          skipWeekends: calSkipWeekends,
        });
      } else {
        return upsertCalEntry.mutateAsync({
          stakeholderId: sid,
          projectId,
          date: calEditDate!,
          type: effectiveType,
          availableHours: calEditHours,
          notes: calEditNotes,
        });
      }
    });

    Promise.all(savePromises).then(() => {
      refetchCal();
      setShowCalDialog(false);
      toast.success(calEditType === "Holiday" && targetIds.length > 1
        ? `Holiday applied to ${targetIds.length} stakeholders`
        : "Calendar entry saved");
    }).catch(e => toast.error(e.message ?? "Failed to save"));
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

          {/* Classification filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Filter:</span>
            {(["all", "TeamMember", "External", "Stakeholder"] as const).map(t => (
              <button
                key={t}
                onClick={() => setWorkloadFilter(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  workloadFilter === t
                    ? t === "TeamMember" ? "bg-blue-100 text-blue-700 border-blue-300"
                      : t === "External" ? "bg-orange-100 text-orange-700 border-orange-300"
                      : t === "Stakeholder" ? "bg-purple-100 text-purple-700 border-purple-300"
                      : "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                }`}
              >
                {t === "all" ? "All" : t === "TeamMember" ? "Team Members" : t}
              </button>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              {/* Sortable column headers */}
              {(() => {
                const cols = [
                  { key: "name", label: "Name", span: "col-span-2" },
                  { key: "role", label: "Role", span: "col-span-1" },
                  { key: "totalAssigned", label: "Assigned", span: "col-span-1 text-center" },
                  { key: "thisWeek", label: "This Week", span: "col-span-1 text-center" },
                  { key: "capacity", label: "Capacity", span: "col-span-1 text-center" },
                  { key: "hourlyRate", label: "Cost Rate", span: "col-span-1 text-right" },
                  { key: "weeklyCost", label: "Weekly Cost", span: "col-span-1 text-right" },
                  { key: "perfScore", label: "Perf Score", span: "col-span-1 text-center" },
                  { key: "load", label: "Load", span: "col-span-2" },
                  { key: "_actions", label: "", span: "col-span-1 text-right" },
                ];
                return (
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase">
                    {cols.map(c => (
                      <div
                        key={c.key}
                        className={`${c.span} ${c.key !== "_actions" && c.key !== "load" ? "cursor-pointer hover:text-foreground select-none flex items-center gap-1" : ""}`}
                        onClick={() => {
                          if (c.key === "_actions" || c.key === "load") return;
                          setWorkloadSort(prev => prev.col === c.key ? { col: c.key, dir: prev.dir === "asc" ? "desc" : "asc" } : { col: c.key, dir: "desc" });
                        }}
                      >
                        {c.label}
                        {workloadSort.col === c.key && (workloadSort.dir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : workloadData.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">No stakeholders found. Add stakeholders to see workload.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {[...workloadData]
                  .filter(w => workloadFilter === "all" || w.classification === workloadFilter)
                  .sort((a, b) => {
                    const dir = workloadSort.dir === "asc" ? 1 : -1;
                    const col = workloadSort.col;
                    if (col === "name" || col === "role") {
                      return dir * ((a as any)[col] ?? "").localeCompare((b as any)[col] ?? "");
                    }
                    if (col === "weeklyCost") {
                      const aCost = a.hourlyRate * a.hoursPerDay * (a.thisWeek / Math.max(a.capacity, 1));
                      const bCost = b.hourlyRate * b.hoursPerDay * (b.thisWeek / Math.max(b.capacity, 1));
                      return dir * (aCost - bCost);
                    }
                    if (col === "perfScore") {
                      const aScore = latestScoreMap[a.id] ?? -1;
                      const bScore = latestScoreMap[b.id] ?? -1;
                      return dir * (aScore - bScore);
                    }
                    return dir * (((a as any)[col] ?? 0) - ((b as any)[col] ?? 0));
                  })
                  .map((w) => {
                    const { label, className } = getLoadLabel(w.thisWeek, w.capacity);
                    const weeklyCost = w.hourlyRate * w.hoursPerDay * (w.thisWeek / Math.max(w.capacity, 1));
                    const perfScore = latestScoreMap[w.id];
                    const perfBadgeCls = perfScore == null ? "bg-gray-100 text-gray-500"
                      : perfScore >= 80 ? "bg-green-100 text-green-700"
                      : perfScore >= 60 ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700";
                    return (
                      <div key={w.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-2">
                            <div className="font-medium text-sm">{w.name}</div>
                            {w.email && <div className="text-xs text-muted-foreground">{w.email}</div>}
                          </div>
                          <div className="col-span-1 text-xs text-muted-foreground truncate">{w.role || "—"}</div>
                          <div className="col-span-1 text-center"><div className="text-lg font-bold">{w.totalAssigned}</div></div>
                          <div className="col-span-1 text-center"><div className="text-lg font-bold">{w.thisWeek}</div><div className="text-xs text-muted-foreground">tasks</div></div>
                          <div className="col-span-1 text-center text-sm text-muted-foreground">{w.capacity}</div>
                          <div className="col-span-1 text-right text-xs text-muted-foreground">{w.hourlyRate > 0 ? `$${w.hourlyRate.toFixed(0)}/hr` : "—"}</div>
                          <div className="col-span-1 text-right text-xs font-medium">{weeklyCost > 0 ? formatCurrency(weeklyCost) : "—"}</div>
                          <div className="col-span-1 text-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${perfBadgeCls}`}>
                              {perfScore != null ? perfScore : "—"}
                            </span>
                          </div>
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
            {/* Type filter */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Show:</span>
              {(["all", "TeamMember", "External", "Stakeholder"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setHeatmapTypeFilter(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    heatmapTypeFilter === t
                      ? t === "TeamMember" ? "bg-blue-100 text-blue-700 border-blue-300"
                        : t === "External" ? "bg-orange-100 text-orange-700 border-orange-300"
                        : t === "Stakeholder" ? "bg-purple-100 text-purple-700 border-purple-300"
                        : "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                  }`}
                >
                  {t === "all" ? "All" : t === "TeamMember" ? "Team Members" : t}
                </button>
              ))}
            </div>

            {/* Department/role filter pills */}
            {(() => {
              const roles = Array.from(new Set(workloadData.map(w => w.role).filter(Boolean)));
              if (roles.length === 0) return null;
              return (
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="text-xs text-muted-foreground font-medium">Role:</span>
                  <button
                    onClick={() => setHeatmapRoleFilter("all")}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${heatmapRoleFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-muted-foreground"}`}
                  >
                    All Roles
                  </button>
                  {roles.map(role => (
                    <button
                      key={role}
                      onClick={() => setHeatmapRoleFilter(role)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${heatmapRoleFilter === role ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-muted-foreground"}`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              );
            })()}

            <WorkloadHeatmap
              resources={workloadData
                .filter(w => (heatmapTypeFilter === "all" || w.classification === heatmapTypeFilter) && (heatmapRoleFilter === "all" || w.role === heatmapRoleFilter))
                .map((w) => {
                const workerId = w.id;
                const workerDaysPerWeek = w.daysPerWeek ?? 5;
                const workerHoursPerDay = w.hoursPerDay ?? 8;
                const AVG_TASK_HOURS = 8;
                const weeklyData = [0,1,2,3,4,5,6,7,8,9,10,11].map((weekOffset) => {
                  const start = new Date();
                  start.setHours(0,0,0,0);
                  const day = start.getDay();
                  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7);
                  const weekStartDate = start.toISOString().split("T")[0];
                  const weekEnd = new Date(start);
                  weekEnd.setDate(start.getDate() + 6);
                  const weekEndDate = weekEnd.toISOString().split("T")[0];
                  // Count leave/holiday days for this worker this week
                  const leaveDaysThisWeek = (calendarEntries as any[]).filter((e: any) => {
                    if (e.stakeholderId !== workerId) return false;
                    if (e.type !== "Leave" && e.type !== "Holiday") return false;
                    const dateKey = e.date instanceof Date ? e.date.toISOString().split("T")[0] : String(e.date).split("T")[0];
                    return dateKey >= weekStartDate && dateKey <= weekEndDate;
                  }).length;
                  const availableDays = Math.max(0, workerDaysPerWeek - leaveDaysThisWeek);
                  const availableHours = availableDays * workerHoursPerDay;
                  const tasksInWeek = weekOffset === 0 ? w.thisWeek : weekOffset === 1 ? w.nextWeek : weekOffset === 2 ? w.next2 : weekOffset === 3 ? w.next3 : weekOffset === 4 ? w.next4 : 0;
                  const utilization = availableHours > 0 ? Math.min(100, Math.round((tasksInWeek * AVG_TASK_HOURS) / availableHours * 100)) : 0;
                  return { weekStart: weekStartDate, utilization };
                });
                return { id: w.id, name: w.name, weeklyData };
              })}
            />
            {workloadData.filter(w => (heatmapTypeFilter === "all" || w.classification === heatmapTypeFilter) && (heatmapRoleFilter === "all" || w.role === heatmapRoleFilter)).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No resources match the selected filter.</p>
            )}
            <p className="text-xs text-muted-foreground mt-3 italic">Utilization adjusted for calendar leave/holidays.</p>
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
                const wl = workloadData.find(w => w.name === name);
                const assignedCount = wl?.totalAssigned ?? 0;
                const cls = s.classification ?? (s.isInternalTeam ? "TeamMember" : "Stakeholder");
                return (
                  <div
                    key={s.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setTaskSummaryStakeholder({ s, wl, name })}
                  >
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
                      <div className="text-right shrink-0">
                        <div className="text-xl font-bold">{assignedCount}</div>
                        <div className="text-[10px] text-muted-foreground">tasks</div>
                      </div>
                    </div>
                    {s.engagementStrategy && <div className="mt-2"><Badge variant="outline" className="text-[10px]">{s.engagementStrategy}</Badge></div>}
                    {assignedCount > 0 && (
                      <div className="mt-2 flex gap-2 text-[10px] text-muted-foreground">
                        {wl && wl.thisWeek > 0 && <span className="bg-blue-50 text-blue-600 rounded px-1.5 py-0.5">{wl.thisWeek} this week</span>}
                        {wl && wl.nextWeek > 0 && <span className="bg-muted rounded px-1.5 py-0.5">{wl.nextWeek} next week</span>}
                      </div>
                    )}
                    {/* Skills indicator badge for TeamMembers */}
                    {cls === "TeamMember" && (
                      <div className="mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                          Skills: Expand to view
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* KPI Performance Summary Section */}
          {(kpiSummary as any[]).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                KPI Performance Summary
              </h3>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Name</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Role</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">KPI Score</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {stakeholders
                      .filter((s: any) => s.classification === "TeamMember" || s.isInternalTeam)
                      .map((s: any) => {
                        const name = s.fullName ?? s.name ?? `Stakeholder ${s.id}`;
                        const score = latestScoreMap[s.id];
                        const scoreBadge = score == null ? "bg-gray-100 text-gray-500"
                          : score >= 80 ? "bg-green-100 text-green-700"
                          : score >= 60 ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700";
                        return (
                          <tr key={s.id} className="hover:bg-muted/20">
                            <td className="py-2 px-3 font-medium">{name}</td>
                            <td className="py-2 px-3 text-muted-foreground text-xs">{s.role || "—"}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreBadge}`}>
                                {score != null ? score : "—"}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center text-muted-foreground text-xs">
                              {score != null ? (score >= 70 ? <TrendingUp className="w-3.5 h-3.5 text-green-500 inline" /> : <ArrowDown className="w-3.5 h-3.5 text-red-400 inline" />) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── RBS Wizard Tab ───────────────────────────────────────────── */}
        <TabsContent value="rbs" className="mt-0">
          {(() => {
            // ── Type metadata ──────────────────────────────────────────────
            const RBS_TYPE_META: Record<string, { icon: React.ReactNode; bg: string; text: string; border: string }> = {
              Human:          { icon: <Users className="w-4 h-4" />,        bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
              Equipment:      { icon: <Wrench className="w-4 h-4" />,       bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
              Material:       { icon: <Package className="w-4 h-4" />,      bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
              Infrastructure: { icon: <Server className="w-4 h-4" />,       bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
              Software:       { icon: <Cpu className="w-4 h-4" />,          bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' },
              Financial:      { icon: <Banknote className="w-4 h-4" />,     bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
              Subcontractor:  { icon: <HardHat className="w-4 h-4" />,      bg: '#fefce8', text: '#854d0e', border: '#fef08a' },
              Facility:       { icon: <Building2 className="w-4 h-4" />,    bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' },
              Vehicle:        { icon: <Truck className="w-4 h-4" />,        bg: '#fdf4ff', text: '#7c3aed', border: '#e9d5ff' },
            };
            const getMeta = (type: string) => RBS_TYPE_META[type] ?? { icon: <FolderTree className="w-4 h-4" />, bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };

            // ── WBS tree helpers ───────────────────────────────────────────
            const wbsNodeMap: Record<number, any> = {};
            (wbsNodes as any[]).forEach(n => { wbsNodeMap[n.id] = { ...n, children: [] }; });
            const wbsRoots: any[] = [];
            (wbsNodes as any[]).forEach(n => {
              if (n.parentId && wbsNodeMap[n.parentId]) wbsNodeMap[n.parentId].children.push(wbsNodeMap[n.id]);
              else wbsRoots.push(wbsNodeMap[n.id]);
            });

            // ── Leaf nodes (actual resources) ─────────────────────────────
            const leafNodes = (rbsNodes as any[]).filter(n => n.isLeaf === 1);

            // ── Cost rollup helpers ────────────────────────────────────────
            function calcNodeCost(rbsNodeId: number): number {
              const node = (rbsNodes as any[]).find(n => n.id === rbsNodeId);
              if (!node) return 0;
              const qty = parseFloat(node.quantity ?? "1") || 1;
              const rate = parseFloat(node.costRate ?? "0") || 0;
              return qty * rate;
            }
            function calcWbsCost(wbsNodeId: number): number {
              const assignments = (wbsAssignments as any[]).filter(a => a.wbsNodeId === wbsNodeId);
              return assignments.reduce((sum, a) => {
                const base = calcNodeCost(a.rbsNodeId);
                const pct = parseFloat(a.allocationPct ?? "100") / 100;
                return sum + base * pct;
              }, 0);
            }
            function calcSubtreeCost(node: any): number {
              let total = calcWbsCost(node.id);
              (node.children ?? []).forEach((c: any) => { total += calcSubtreeCost(c); });
              return total;
            }

            // ── Wizard step indicators ─────────────────────────────────────
            const STEPS = [
              { n: 1 as const, label: "Categories", desc: "Define resource types" },
              { n: 2 as const, label: "Resources", desc: "Add resources per type" },
              { n: 3 as const, label: "WBS Assignment", desc: "Assign to WBS elements" },
              { n: 4 as const, label: "Cost Rollup", desc: "View aggregated costs" },
            ];

            return (
              <div className="space-y-4">
                {/* Step indicator */}
                <div className="flex items-center gap-0 border border-border rounded-xl overflow-hidden bg-muted/30">
                  {STEPS.map((step, i) => (
                    <button
                      key={step.n}
                      onClick={() => setWizardStep(step.n)}
                      className={`flex-1 flex flex-col items-center py-3 px-2 transition-all text-center border-r last:border-r-0 border-border ${
                        wizardStep === step.n
                          ? "bg-primary text-primary-foreground"
                          : wizardStep > step.n
                          ? "bg-primary/10 text-primary hover:bg-primary/15"
                          : "hover:bg-accent text-muted-foreground"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                        wizardStep === step.n ? "bg-white/20" : wizardStep > step.n ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"
                      }`}>
                        {wizardStep > step.n ? <Check className="w-3 h-3" /> : step.n}
                      </div>
                      <span className="text-xs font-semibold">{step.label}</span>
                      <span className="text-[10px] opacity-70 hidden sm:block">{step.desc}</span>
                    </button>
                  ))}
                </div>

                {/* ── STEP 1: Resource Categories ─────────────────────────── */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-base">Resource Categories</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Define the types of resources used in this project</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                          onClick={() => seedRbsTypes.mutate({ projectId })}
                          disabled={seedRbsTypes.isPending}
                        >
                          {seedRbsTypes.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          Seed Defaults
                        </Button>
                        <Button size="sm" className="h-8 text-xs gap-1" onClick={() => { setWizardAddingType(true); setWizardTypeForm({ name: "", color: "#6366f1", description: "" }); }}>
                          <Plus className="w-3 h-3" /> Add Category
                        </Button>
                      </div>
                    </div>

                    {/* Add category form */}
                    {wizardAddingType && (
                      <Card className="border-primary/30 bg-primary/5">
                        <CardContent className="pt-4 space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                              <Label className="text-xs">Category Name</Label>
                              <Input className="h-8 text-sm mt-1" placeholder="e.g. Cloud Infrastructure" value={wizardTypeForm.name} onChange={e => setWizardTypeForm(p => ({ ...p, name: e.target.value }))} autoFocus />
                            </div>
                            <div>
                              <Label className="text-xs">Color</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <input type="color" className="h-8 w-12 rounded border border-input cursor-pointer" value={wizardTypeForm.color} onChange={e => setWizardTypeForm(p => ({ ...p, color: e.target.value }))} />
                                <Input className="h-8 text-xs flex-1" value={wizardTypeForm.color} onChange={e => setWizardTypeForm(p => ({ ...p, color: e.target.value }))} />
                              </div>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Description (optional)</Label>
                            <Input className="h-8 text-sm mt-1" placeholder="Brief description" value={wizardTypeForm.description} onChange={e => setWizardTypeForm(p => ({ ...p, description: e.target.value }))} />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="h-8 text-xs" disabled={!wizardTypeForm.name.trim() || createRbsType.isPending}
                              onClick={() => createRbsType.mutate({ projectId, name: wizardTypeForm.name.trim(), color: wizardTypeForm.color, description: wizardTypeForm.description }, { onSuccess: () => setWizardAddingType(false) })}>
                              {createRbsType.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />} Save
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setWizardAddingType(false)}>Cancel</Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Category cards grid */}
                    {(rbsTypes as any[]).length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                        <FolderTree className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No categories yet</p>
                        <p className="text-xs mt-1">Click "Seed Defaults" to add built-in resource types, or create your own</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {(rbsTypes as any[]).map((type: any) => {
                          const resourceCount = (rbsNodes as any[]).filter(n => n.resourceType === type.name && n.isLeaf === 1).length;
                          const meta = getMeta(type.name);
                          const isEditing = wizardEditTypeId === type.id;
                          return (
                            <Card key={type.id} className={`group border transition-all hover:shadow-sm cursor-pointer ${isEditing ? "border-primary ring-1 ring-primary" : ""}`}
                              onClick={() => { if (!isEditing) { setWizardCategoryId(type.id); setWizardStep(2); } }}>
                              <CardContent className="p-4">
                                {isEditing ? (
                                  <div className="space-y-2" onClick={e => e.stopPropagation()}>
                                    <Input className="h-7 text-xs" value={wizardTypeForm.name} onChange={e => setWizardTypeForm(p => ({ ...p, name: e.target.value }))} autoFocus />
                                    <div className="flex items-center gap-2">
                                      <input type="color" className="h-7 w-10 rounded border border-input cursor-pointer" value={wizardTypeForm.color} onChange={e => setWizardTypeForm(p => ({ ...p, color: e.target.value }))} />
                                      <Input className="h-7 text-xs flex-1" value={wizardTypeForm.color} onChange={e => setWizardTypeForm(p => ({ ...p, color: e.target.value }))} />
                                    </div>
                                    <div className="flex gap-1">
                                      <Button size="sm" className="h-6 text-[10px] px-2 flex-1"
                                        disabled={!wizardTypeForm.name.trim() || updateRbsType.isPending}
                                        onClick={() => updateRbsType.mutate({ id: type.id, name: wizardTypeForm.name, color: wizardTypeForm.color, description: wizardTypeForm.description }, { onSuccess: () => setWizardEditTypeId(null) })}>
                                        Save
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setWizardEditTypeId(null)}>✕</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: type.color ? `${type.color}20` : meta.bg, color: type.color ?? meta.text }}>
                                        {meta.icon}
                                      </div>
                                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                        <>
                                          <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground transition-colors"
                                            onClick={() => { setWizardEditTypeId(type.id); setWizardTypeForm({ name: type.name, color: type.color ?? "#6366f1", description: type.description ?? "" }); }}>
                                            <Pencil className="w-3 h-3" />
                                          </button>
                                          <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                                            onClick={() => {
                                              const resourceCount = (rbsNodes as any[]).filter(n => n.resourceType === type.name && n.isLeaf === 1).length;
                                              const msg = resourceCount > 0
                                                ? `Delete "${type.name}"? This will also remove ${resourceCount} resource${resourceCount !== 1 ? "s" : ""} under this category. This cannot be undone.`
                                                : `Delete "${type.name}"? This cannot be undone.`;
                                              if (confirm(msg)) deleteRbsType.mutate({ id: type.id });
                                            }}>
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </>
                                      </div>
                                    </div>
                                    <p className="font-semibold text-sm">{type.name}</p>
                                    {type.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{type.description}</p>}
                                    <div className="mt-2 flex items-center gap-1">
                                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: type.color ? `${type.color}20` : meta.bg, color: type.color ?? meta.text }}>
                                        {resourceCount} resource{resourceCount !== 1 ? "s" : ""}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button className="gap-1" onClick={() => setWizardStep(2)}>
                        Next: Resources <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Resource Register ────────────────────────────── */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-base">Resource Register</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Add resources to each category</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setWizardStep(1)}>← Back</Button>
                        <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setWizardAddingResource(true)}>
                          <Plus className="w-3 h-3" /> Add Resource
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {/* Category sidebar */}
                      <div className="w-44 shrink-0 space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-2 mb-2">Filter by Type</p>
                        <button
                          onClick={() => setWizardCategoryId(null)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${wizardCategoryId === null ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                        >
                          <span>All Resources</span>
                          <span className="text-[10px] opacity-70">{leafNodes.length}</span>
                        </button>
                        {(rbsTypes as any[]).map((type: any) => {
                          const count = leafNodes.filter(n => n.resourceType === type.name).length;
                          const meta = getMeta(type.name);
                          return (
                            <button key={type.id}
                              onClick={() => setWizardCategoryId(type.id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${wizardCategoryId === type.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                            >
                              <span className="shrink-0" style={{ color: wizardCategoryId === type.id ? "inherit" : type.color ?? meta.text }}>{meta.icon}</span>
                              <span className="flex-1 truncate">{type.name}</span>
                              <span className="text-[10px] opacity-70">{count}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Resource list */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Add resource form */}
                        {wizardAddingResource && (() => {
                          const selectedType = wizardCategoryId ? (rbsTypes as any[]).find(t => t.id === wizardCategoryId) : null;
                          return (
                            <Card className="border-primary/30 bg-primary/5 mb-3">
                              <CardContent className="pt-4 space-y-3">
                                <p className="text-xs font-semibold text-primary flex items-center gap-1"><Plus className="w-3 h-3" /> New Resource {selectedType ? `— ${selectedType.name}` : ""}</p>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Code</Label>
                                    <Input className="h-7 text-xs mt-1" placeholder="R1.1" value={wizardAddResourceForm.code} onChange={e => setWizardAddResourceForm(p => ({ ...p, code: e.target.value }))} />
                                  </div>
                                  <div className="col-span-2">
                                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Name</Label>
                                    <Input className="h-7 text-xs mt-1" placeholder="Resource name" value={wizardAddResourceForm.name} onChange={e => setWizardAddResourceForm(p => ({ ...p, name: e.target.value }))} autoFocus />
                                  </div>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  <div>
                                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Unit</Label>
                                    <Input className="h-7 text-xs mt-1" placeholder="Person" value={wizardAddResourceForm.unit} onChange={e => setWizardAddResourceForm(p => ({ ...p, unit: e.target.value }))} />
                                  </div>
                                  <div>
                                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Qty</Label>
                                    <Input className="h-7 text-xs mt-1" placeholder="1" value={wizardAddResourceForm.quantity} onChange={e => setWizardAddResourceForm(p => ({ ...p, quantity: e.target.value }))} />
                                  </div>
                                  <div>
                                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Cost/Unit</Label>
                                    <Input className="h-7 text-xs mt-1" placeholder="0.00" value={wizardAddResourceForm.costRate} onChange={e => setWizardAddResourceForm(p => ({ ...p, costRate: e.target.value }))} />
                                  </div>
                                  <div>
                                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Avail.</Label>
                                    <Input className="h-7 text-xs mt-1" placeholder="100%" value={wizardAddResourceForm.availability} onChange={e => setWizardAddResourceForm(p => ({ ...p, availability: e.target.value }))} />
                                  </div>
                                </div>
                                {selectedType?.name === "Human" && (
                                  <div>
                                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Linked Stakeholder (optional)</Label>
                                    <Select value={wizardAddResourceForm.stakeholderId || "__none__"} onValueChange={v => setWizardAddResourceForm(p => ({ ...p, stakeholderId: v === "__none__" ? "" : v }))}>
                                      <SelectTrigger className="h-7 text-xs mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="__none__">None</SelectItem>
                                        {stakeholders.filter((s: any) => !leafNodes.some(n => n.stakeholderId === s.id)).map((s: any) => (
                                          <SelectItem key={s.id} value={String(s.id)}>{s.fullName ?? s.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <Button size="sm" className="h-7 text-xs" disabled={!wizardAddResourceForm.code.trim() || !wizardAddResourceForm.name.trim() || createRbsNode.isPending}
                                    onClick={() => createRbsNode.mutate({
                                      projectId,
                                      code: wizardAddResourceForm.code.trim(),
                                      name: wizardAddResourceForm.name.trim(),
                                      resourceType: selectedType?.name ?? "Human",
                                      unit: wizardAddResourceForm.unit || undefined,
                                      quantity: wizardAddResourceForm.quantity || undefined,
                                      costRate: wizardAddResourceForm.costRate || undefined,
                                      availability: wizardAddResourceForm.availability || undefined,
                                      stakeholderId: wizardAddResourceForm.stakeholderId ? parseInt(wizardAddResourceForm.stakeholderId) : undefined,
                                      isLeaf: 1,
                                    }, { onSuccess: () => { setWizardAddingResource(false); setWizardAddResourceForm({ code: "", name: "", unit: "Person", quantity: "1", costRate: "", availability: "100%", stakeholderId: "" }); }})}>
                                    {createRbsNode.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />} Add Resource
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setWizardAddingResource(false)}>Cancel</Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })()}

                        {/* Resource cards */}
                        {(() => {
                          const filtered = wizardCategoryId
                            ? leafNodes.filter(n => n.resourceType === (rbsTypes as any[]).find(t => t.id === wizardCategoryId)?.name)
                            : leafNodes;
                          if (filtered.length === 0) return (
                            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl">
                              <Package className="w-7 h-7 mx-auto mb-2 opacity-30" />
                              <p className="text-sm font-medium">No resources yet</p>
                              <p className="text-xs mt-1">Click "Add Resource" to define resources for this category</p>
                            </div>
                          );
                          return filtered.map((node: any) => {
                            const meta = getMeta(node.resourceType);
                            const linkedSh = node.stakeholderId ? stakeholders.find((s: any) => s.id === node.stakeholderId) : null;
                            const totalCost = (parseFloat(node.quantity ?? "1") || 1) * (parseFloat(node.costRate ?? "0") || 0);
                            return (
                              <div key={node.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-border/80 hover:shadow-sm transition-all">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.bg, color: meta.text }}>
                                  {meta.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] text-muted-foreground">{node.code}</span>
                                    <span className="font-semibold text-sm truncate">{node.name}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium" style={{ background: meta.bg, color: meta.text, borderColor: meta.border }}>
                                      {node.resourceType}
                                    </span>
                                    {linkedSh && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                                        <Users className="w-2.5 h-2.5" />{linkedSh.fullName ?? linkedSh.name}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                                    {node.unit && <span>{node.quantity ?? 1} × {node.unit}</span>}
                                    {node.costRate && <span>{formatCurrency(parseFloat(node.costRate))}/unit</span>}
                                    {totalCost > 0 && <span className="text-emerald-600 font-medium">Total: {formatCurrency(totalCost)}</span>}
                                    {node.availability && <span>{node.availability} avail.</span>}
                                  </div>
                                </div>
                                <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-600 text-muted-foreground/40 transition-colors"
                                  onClick={() => { if (confirm(`Delete "${node.name}"?`)) deleteRbsNode.mutate({ id: node.id }); }}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" className="gap-1" onClick={() => setWizardStep(1)}><ChevronLeft className="w-4 h-4" /> Back</Button>
                      <Button className="gap-1" onClick={() => setWizardStep(3)}>Next: WBS Assignment <ChevronRight className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: WBS Assignment ───────────────────────────────── */}
                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-base">WBS Assignment</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Assign resources to WBS elements and set allocation percentages</p>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setWizardStep(2)}>← Back</Button>
                    </div>

                    {wbsRoots.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                        <FolderTree className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No WBS nodes defined</p>
                        <p className="text-xs mt-1">Go to the WBS page to build your Work Breakdown Structure first</p>
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        {/* WBS tree */}
                        <div className="w-64 shrink-0">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-2 mb-2">WBS Tree</p>
                          <div className="border rounded-xl overflow-hidden">
                            {(() => {
                              const renderWbsNode = (node: any, depth: number): React.ReactNode => {
                                const hasChildren = node.children.length > 0;
                                const isExp = wizardExpandedWbs[node.id] !== false;
                                const isSelected = wizardSelectedWbsId === node.id;
                                const assignCount = (wbsAssignments as any[]).filter(a => a.wbsNodeId === node.id).length;
                                return (
                                  <div key={node.id}>
                                    <button
                                      onClick={() => {
                                        setWizardSelectedWbsId(node.id);
                                        if (hasChildren) setWizardExpandedWbs(p => ({ ...p, [node.id]: !isExp }));
                                      }}
                                      className={`w-full flex items-center gap-1.5 px-3 py-2 text-left text-sm transition-colors border-b border-border/30 ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                                      style={{ paddingLeft: `${12 + depth * 16}px` }}
                                    >
                                      {hasChildren ? (
                                        isExp ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />
                                      ) : <span className="w-3 shrink-0" />}
                                      <span className="font-mono text-[10px] opacity-60 shrink-0">{node.code}</span>
                                      <span className="flex-1 truncate text-xs">{node.name}</span>
                                      {assignCount > 0 && (
                                        <span className={`text-[9px] px-1 rounded-full font-semibold ${isSelected ? "bg-white/20" : "bg-primary/10 text-primary"}`}>
                                          {assignCount}
                                        </span>
                                      )}
                                    </button>
                                    {isExp && hasChildren && node.children.map((c: any) => renderWbsNode(c, depth + 1))}
                                  </div>
                                );
                              };
                              return wbsRoots.map(r => renderWbsNode(r, 0));
                            })()}
                          </div>
                        </div>

                        {/* Assignment panel */}
                        <div className="flex-1 min-w-0">
                          {!wizardSelectedWbsId ? (
                            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                              <p className="text-sm">Select a WBS element to assign resources</p>
                            </div>
                          ) : (() => {
                            const wbs = wbsNodeMap[wizardSelectedWbsId];
                            const assigned = (wbsAssignments as any[]).filter(a => a.wbsNodeId === wizardSelectedWbsId);
                            const availableLeaves = leafNodes.filter(n => !assigned.some(a => a.rbsNodeId === n.id));
                            return (
                              <div className="space-y-3">
                                <div className="p-3 rounded-xl border bg-muted/30">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-muted-foreground">{wbs?.code}</span>
                                    <span className="font-semibold">{wbs?.name}</span>
                                  </div>
                                  {wbs?.responsible && <p className="text-xs text-muted-foreground mt-1">Responsible: {wbs.responsible}</p>}
                                </div>

                                {/* Assigned resources */}
                                {assigned.length > 0 && (
                                  <div className="space-y-1.5">
                                    <p className="text-xs font-semibold text-muted-foreground">Assigned Resources</p>
                                    {assigned.map((a: any) => {
                                      const rNode = (rbsNodes as any[]).find(n => n.id === a.rbsNodeId);
                                      if (!rNode) return null;
                                      const meta = getMeta(rNode.resourceType);
                                      const cost = (parseFloat(rNode.quantity ?? "1") || 1) * (parseFloat(rNode.costRate ?? "0") || 0) * (parseFloat(a.allocationPct ?? "100") / 100);
                                      return (
                                        <div key={a.id} className="flex items-center gap-2 p-2.5 rounded-lg border bg-card">
                                          <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: meta.bg, color: meta.text }}>
                                            {meta.icon}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{rNode.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{a.allocationPct ?? 100}% allocation{cost > 0 ? ` · ${formatCurrency(cost)}` : ""}</p>
                                          </div>
                                          <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 hover:text-red-600 text-muted-foreground/40 transition-colors"
                                            onClick={() => deleteAssignment.mutate({ id: a.id })}>
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Add assignment */}
                                {availableLeaves.length > 0 && (
                                  <div className="space-y-2 p-3 rounded-xl border border-dashed border-primary/30 bg-primary/5">
                                    <p className="text-xs font-semibold text-primary">Add Resource</p>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="col-span-2">
                                        <Select value={wizardAssignForm.rbsNodeId} onValueChange={v => setWizardAssignForm(p => ({ ...p, rbsNodeId: v }))}>
                                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select resource..." /></SelectTrigger>
                                          <SelectContent>
                                            {availableLeaves.map((n: any) => (
                                              <SelectItem key={n.id} value={String(n.id)}>{n.name} ({n.resourceType})</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Input className="h-8 text-xs w-16" placeholder="100" value={wizardAssignForm.allocationPct} onChange={e => setWizardAssignForm(p => ({ ...p, allocationPct: e.target.value }))} />
                                        <span className="text-xs text-muted-foreground">%</span>
                                      </div>
                                    </div>
                                    <Button size="sm" className="h-7 text-xs" disabled={!wizardAssignForm.rbsNodeId || upsertAssignment.isPending}
                                      onClick={() => upsertAssignment.mutate({ projectId, wbsNodeId: wizardSelectedWbsId, rbsNodeId: parseInt(wizardAssignForm.rbsNodeId), allocationPct: wizardAssignForm.allocationPct })}>
                                      {upsertAssignment.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />} Assign
                                    </Button>
                                  </div>
                                )}

                                {assigned.length === 0 && availableLeaves.length === 0 && (
                                  <div className="text-center py-6 text-muted-foreground text-sm">No resources available — add resources in Step 2 first</div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <Button variant="outline" className="gap-1" onClick={() => setWizardStep(2)}><ChevronLeft className="w-4 h-4" /> Back</Button>
                      <Button className="gap-1" onClick={() => setWizardStep(4)}>Next: Cost Rollup <ChevronRight className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}

                {/* ── STEP 4: Cost Rollup ──────────────────────────────────── */}
                {wizardStep === 4 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-base">Cost Rollup</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Aggregated resource costs per WBS element</p>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setWizardStep(3)}>← Back</Button>
                    </div>

                    {(() => {
                      const grandTotal = wbsRoots.reduce((sum, r) => sum + calcSubtreeCost(r), 0);
                      const renderCostRow = (node: any, depth: number): React.ReactNode => {
                        const directCost = calcWbsCost(node.id);
                        const subtreeCost = calcSubtreeCost(node);
                        const assignments = (wbsAssignments as any[]).filter(a => a.wbsNodeId === node.id);
                        const hasChildren = node.children.length > 0;
                        const isExp = wizardExpandedWbs[node.id] !== false;
                        return (
                          <React.Fragment key={node.id}>
                            <tr className={`border-b border-border/30 hover:bg-muted/30 transition-colors ${depth === 0 ? "bg-muted/20" : ""}`}>
                              <td className="py-2 px-3" style={{ paddingLeft: `${12 + depth * 20}px` }}>
                                <div className="flex items-center gap-1.5">
                                  {hasChildren ? (
                                    <button onClick={() => setWizardExpandedWbs(p => ({ ...p, [node.id]: !isExp }))} className="text-muted-foreground hover:text-foreground">
                                      {isExp ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    </button>
                                  ) : <span className="w-3" />}
                                  <span className="font-mono text-[10px] text-muted-foreground">{node.code}</span>
                                  <span className={`text-sm ${depth === 0 ? "font-semibold" : ""}`}>{node.name}</span>
                                </div>
                              </td>
                              <td className="py-2 px-3 text-xs text-muted-foreground">
                                {assignments.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {assignments.map((a: any) => {
                                      const n = (rbsNodes as any[]).find(r => r.id === a.rbsNodeId);
                                      return n ? <span key={a.id} className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px]">{n.name} ({a.allocationPct ?? 100}%)</span> : null;
                                    })}
                                  </div>
                                ) : <span className="text-muted-foreground/50">—</span>}
                              </td>
                              <td className="py-2 px-3 text-right text-sm text-muted-foreground">
                                {directCost > 0 ? formatCurrency(directCost) : "—"}
                              </td>
                              <td className="py-2 px-3 text-right text-sm font-semibold">
                                {subtreeCost > 0 ? formatCurrency(subtreeCost) : "—"}
                              </td>
                            </tr>
                            {isExp && node.children.map((c: any) => renderCostRow(c, depth + 1))}
                          </React.Fragment>
                        );
                      };

                      return (
                        <div className="border rounded-xl overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                              <tr>
                                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">WBS Element</th>
                                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Resources Assigned</th>
                                <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Direct Cost</th>
                                <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Subtree Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {wbsRoots.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">No WBS nodes — build your WBS first</td></tr>
                              ) : wbsRoots.map(r => renderCostRow(r, 0))}
                            </tbody>
                            {grandTotal > 0 && (
                              <tfoot className="border-t-2 border-border bg-primary/5">
                                <tr>
                                  <td className="py-3 px-3 text-sm font-bold text-primary" colSpan={2}>Grand Total</td>
                                  <td className="py-3 px-3" />
                                  <td className="py-3 px-3 text-right text-base font-bold text-primary">{formatCurrency(grandTotal)}</td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
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
                            // Build a task-count-by-date map for this resource
                            const resourceName = r.name;
                            return (
                              <tr key={r.id} className="hover:bg-gray-50/50">
                                <td className="p-2 border border-gray-200 font-medium whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm truncate">{r.name}</div>
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
                                  const cellCls = entry
                                    ? CAL_TYPE_COLORS[entry.type] ?? "bg-gray-100 text-gray-600 border-gray-200"
                                    : isToday ? "bg-red-50 border-red-200"
                                    : isWeekend ? "bg-gray-100 text-gray-300" : "";
                                  // Task count for this resource on this date
                                  const taskCount = (tasks as any[]).filter((t: any) => {
                                    if (!t.dueDate) return false;
                                    const dueStr = t.dueDate instanceof Date ? t.dueDate.toISOString().split("T")[0] : String(t.dueDate).split("T")[0];
                                    return dueStr === date && (t.responsible === resourceName);
                                  }).length;
                                  return (
                                    <td
                                      key={date}
                                      className={`p-1 border border-gray-200 text-center cursor-pointer hover:opacity-80 transition-opacity relative ${cellCls} ${isToday ? "border-red-300" : ""}`}
                                      onClick={() => openCalDialog(r.id, r.name, date, entry, "single")}
                                      title={entry
                                        ? `${entry.type}${entry.availableHours ? " · " + entry.availableHours + "h" : ""}${entry.notes ? " — " + entry.notes : ""}`
                                        : "Click to mark"}
                                    >
                                      {entry ? (
                                        <div>
                                          <div className="font-medium text-[10px]">{entry.type.slice(0, 3)}</div>
                                          {entry.availableHours !== undefined && entry.availableHours !== "8.0" && (
                                            <div className="text-[9px]">{entry.availableHours}h</div>
                                          )}
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
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Resource Management Plan
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Cost, availability, utilization, and task assignment per resource</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">RBS Category:</span>
                    <Select value={planCategoryFilter} onValueChange={setPlanCategoryFilter}>
                      <SelectTrigger className="w-36 h-7 text-xs"><SelectValue placeholder="All Categories" /></SelectTrigger>
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
                  <div className="flex gap-2">
                    <Button size="sm" variant={planViewMode === "weekly" ? "default" : "outline"} onClick={() => setPlanViewMode("weekly")} className="text-xs h-7">Weekly</Button>
                    <Button size="sm" variant={planViewMode === "monthly" ? "default" : "outline"} onClick={() => setPlanViewMode("monthly")} className="text-xs h-7">Monthly</Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : resourcePlan.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No resources found. Add stakeholders first.</div>
              ) : (() => {
                const filteredPlan = planCategoryFilter === "all"
                  ? resourcePlan
                  : resourcePlan.filter(r => {
                      const node = (rbsNodes as any[]).find(n => n.stakeholderId === r.id && n.isLeaf === 1);
                      const typeName = node?.resourceType ?? (r as any).classification;
                      return typeName === planCategoryFilter;
                    });
                return (
                <>
                  {/* Summary bar */}
                  <div className="px-5 py-3 bg-muted/30 border-b grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground">Total Resources</div>
                      <div className="font-bold text-lg">{filteredPlan.length}{planCategoryFilter !== "all" && <span className="text-xs font-normal text-muted-foreground ml-1">/ {resourcePlan.length}</span>}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total Capacity (hrs/{planViewMode === "weekly" ? "wk" : "mo"})</div>
                      <div className="font-bold text-lg">{filteredPlan.reduce((s, r) => s + (planViewMode === "weekly" ? r.weeklyCapacityHours : r.weeklyCapacityHours * 4), 0).toFixed(0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total Tasks Assigned</div>
                      <div className="font-bold text-lg">{filteredPlan.reduce((s, r) => s + r.totalAssigned, 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Estimated Cost (this wk)</div>
                      <div className="font-bold text-lg">{formatCurrency(filteredPlan.reduce((s, r) => s + r.costThisWeek, 0))}</div>
                    </div>
                  </div>

                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-44">Resource</TableHead>
                          <TableHead>Classification</TableHead>
                          <TableHead className="text-right">Rate ($/hr)</TableHead>
                          <TableHead className="text-right">RBS Cost Rate</TableHead>
                          <TableHead className="text-right">Capacity (hrs/{planViewMode === "weekly" ? "wk" : "mo"})</TableHead>
                          <TableHead className="text-right">Tasks (total)</TableHead>
                          <TableHead className="text-right">Non-COMM Tasks</TableHead>
                          <TableHead className="text-right">Est. Hours Used</TableHead>
                          <TableHead className="text-right">Utilization</TableHead>
                          <TableHead className="text-right">Unused Hours</TableHead>
                          <TableHead className="text-right">Planned Wkly Cost</TableHead>
                          <TableHead className="text-right">Est. Cost (total)</TableHead>
                          <TableHead className="text-center">KPI Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPlan.map((r) => {
                          const capacityHrs = planViewMode === "weekly" ? r.weeklyCapacityHours : r.weeklyCapacityHours * 4;
                          const estUsed = planViewMode === "weekly" ? r.estimatedHoursUsed : r.totalAssigned * 8;
                          const unused = Math.max(capacityHrs - estUsed, 0);
                          const util = capacityHrs > 0 ? Math.min(Math.round((estUsed / capacityHrs) * 100), 999) : 0;
                          const costTotal = r.totalAssigned * 8 * r.hourlyRate;
                          const utilColor = util > 100 ? "text-red-600 font-bold" : util >= 80 ? "text-yellow-600" : "text-green-600";
                          // RBS cost rate: look up linked RBS leaf node for this stakeholder
                          const linkedRbsNode = (rbsNodes as any[]).find(n => n.stakeholderId === r.id && n.isLeaf === 1);
                          const rbsCostRate = linkedRbsNode ? parseFloat(linkedRbsNode.costRate ?? "0") || 0 : null;
                          const effectiveCostRate = rbsCostRate != null && rbsCostRate > 0 ? rbsCostRate : r.hourlyRate;
                          // Planned weekly cost
                          const plannedHoursThisWeek = (r.thisWeek * r.hoursPerDay) / Math.max(DEFAULT_CAPACITY, 1);
                          const plannedWeeklyCost = effectiveCostRate * plannedHoursThisWeek;
                          // KPI score
                          const kpiScore = latestScoreMap[r.id];
                          const kpiBadgeCls = kpiScore == null ? "bg-gray-100 text-gray-500"
                            : kpiScore >= 80 ? "bg-green-100 text-green-700"
                            : kpiScore >= 60 ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700";
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
                              <TableCell className="text-right">
                                {rbsCostRate != null && rbsCostRate > 0
                                  ? <span className="text-emerald-700 font-medium">{formatCurrency(rbsCostRate)}</span>
                                  : <span className="text-muted-foreground text-xs">fallback</span>}
                              </TableCell>
                              <TableCell className="text-right font-medium">{capacityHrs.toFixed(0)}h</TableCell>
                              <TableCell className="text-right">{r.totalAssigned}</TableCell>
                              <TableCell className="text-right">{(r as any).nonCommAssigned ?? 0}</TableCell>
                              <TableCell className="text-right">{estUsed.toFixed(0)}h</TableCell>
                              <TableCell className={`text-right font-semibold ${utilColor}`}>{util}%</TableCell>
                              <TableCell className="text-right text-muted-foreground">{unused.toFixed(0)}h</TableCell>
                              <TableCell className="text-right">{plannedWeeklyCost > 0 ? formatCurrency(plannedWeeklyCost) : "—"}</TableCell>
                              <TableCell className="text-right">{costTotal > 0 ? formatCurrency(costTotal) : "—"}</TableCell>
                              <TableCell className="text-center">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${kpiBadgeCls}`}>
                                  {kpiScore != null ? kpiScore : "—"}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
                );
              })()}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              {calEditStakeholder === null
                ? "Add General Holiday"
                : calEntryMode === "range" ? "Add Calendar Entry" : `Mark Day — ${calEditDate}`}
            </DialogTitle>
            {calEditStakeholder === null ? (
              <p className="text-sm text-muted-foreground mt-0.5">
                This holiday will be applied to <strong>all resources</strong> (or selected ones below).
              </p>
            ) : calEditStakeholderName ? (
              <p className="text-sm text-muted-foreground mt-0.5">
                Resource: <span className="font-medium text-foreground">{calEditStakeholderName}</span>
              </p>
            ) : null}
          </DialogHeader>
          <div className="space-y-4 py-2">

            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCalEntryMode("single")}
                className={`flex-1 py-1.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  calEntryMode === "single" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"
                }`}
              >
                Single Day
              </button>
              <button
                type="button"
                onClick={() => setCalEntryMode("range")}
                className={`flex-1 py-1.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  calEntryMode === "range" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"
                }`}
              >
                Date Range
              </button>
            </div>

            {/* Date(s) */}
            {calEntryMode === "single" ? (
              <div className="space-y-1">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={calEditDate ?? ""}
                  onChange={e => { setCalEditDate(e.target.value); setCalEditEndDate(e.target.value); }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Start Date</Label>
                  <Input type="date" value={calEditDate ?? ""} onChange={e => setCalEditDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>End Date</Label>
                  <Input type="date" value={calEditEndDate ?? ""} onChange={e => setCalEditEndDate(e.target.value)} />
                </div>
              </div>
            )}

            {/* Skip weekends toggle (range only) */}
            {calEntryMode === "range" && (
              <label className="flex items-center gap-2 cursor-pointer text-sm select-none">
                <input
                  type="checkbox"
                  checked={calSkipWeekends}
                  onChange={e => setCalSkipWeekends(e.target.checked)}
                  className="rounded"
                />
                Skip weekends
              </label>
            )}

            {/* Type */}
            <div className="space-y-1">
              <Label>Entry Type</Label>
              {/* Holiday is only available at general level (no specific stakeholder) */}
              {calEditStakeholder !== null && calEditType === "Holiday" && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  Holiday entered for a specific resource will be saved as <strong>Leave</strong>.
                </p>
              )}
              <Select value={calEditType} onValueChange={v => {
                const t = v as "Working" | "Leave" | "Holiday" | "Training";
                setCalEditType(t);
                // Auto-set sensible default hours when type changes
                if (t === "Leave" || t === "Holiday") setCalEditHours("0");
                else if (t === "Working" || t === "Training") setCalEditHours("8");
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Working">Working</SelectItem>
                  <SelectItem value="Leave">Leave</SelectItem>
                  {/* Holiday only makes sense at general level */}
                  {calEditStakeholder === null && (
                    <SelectItem value="Holiday">Holiday (applies to all)</SelectItem>
                  )}
                  <SelectItem value="Training">Training</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Holiday stakeholder assignment */}
            {calEditType === "Holiday" && (
              <div className="space-y-2">
                <Label>Apply Holiday To</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setCalHolidayScope("all"); setCalHolidayStakeholderIds([]); }}
                    className={`flex-1 py-1.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      calHolidayScope === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"
                    }`}
                  >
                    All Stakeholders
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalHolidayScope("selected")}
                    className={`flex-1 py-1.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      calHolidayScope === "selected" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"
                    }`}
                  >
                    Select Specific
                  </button>
                </div>
                {calHolidayScope === "selected" && (
                  <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                    {(stakeholders as any[]).map((s: any) => (
                      <label key={s.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 text-sm">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={calHolidayStakeholderIds.includes(s.id)}
                          onChange={() => setCalHolidayStakeholderIds(prev =>
                            prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id]
                          )}
                        />
                        <span className="font-medium">{s.fullName ?? s.name}</span>
                        {s.role && <span className="text-xs text-muted-foreground ml-1">{s.role}</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Available Hours */}
            <div className="space-y-1">
              <Label>Available Hours {calEntryMode === "range" ? "(per day)" : ""}</Label>
              <Input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={calEditHours}
                onChange={e => setCalEditHours(e.target.value)}
                placeholder="e.g. 8"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input value={calEditNotes} onChange={e => setCalEditNotes(e.target.value)} placeholder="Optional note (e.g. Annual leave, Public holiday)" />
            </div>

            {/* Preview count for range */}
            {calEntryMode === "range" && calEditDate && calEditEndDate && calEditDate <= calEditEndDate && (() => {
              const start = new Date(calEditDate + "T00:00:00");
              const end = new Date(calEditEndDate + "T00:00:00");
              let count = 0;
              const cur = new Date(start);
              while (cur <= end) {
                const dow = cur.getDay();
                if (!calSkipWeekends || (dow !== 0 && dow !== 6)) count++;
                cur.setDate(cur.getDate() + 1);
              }
              return (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded px-3 py-2">
                  This will create/update <span className="font-semibold text-foreground">{count}</span> calendar entr{count === 1 ? "y" : "ies"}.
                </p>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalDialog(false)}>Cancel</Button>
            <Button onClick={saveCalEntry} disabled={upsertCalEntry.isPending || upsertCalRange.isPending}>
              {(upsertCalEntry.isPending || upsertCalRange.isPending) ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── RBS Type Dialog ──────────────────────────────────────────────── */}
      <Dialog open={showRbsTypeDialog} onOpenChange={setShowRbsTypeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{rbsTypeEditing ? "Edit Resource Type" : "Add Resource Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Type Name <span className="text-red-500">*</span></Label>
              <Input
                value={rbsTypeForm.name}
                onChange={e => setRbsTypeForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Vendor, Consultant, System"
              />
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={rbsTypeForm.color}
                  onChange={e => setRbsTypeForm(f => ({ ...f, color: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer border border-border"
                />
                <Input
                  value={rbsTypeForm.color}
                  onChange={e => setRbsTypeForm(f => ({ ...f, color: e.target.value }))}
                  placeholder="#6366f1"
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={rbsTypeForm.description}
                onChange={e => setRbsTypeForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRbsTypeDialog(false)}>Cancel</Button>
            <Button
              onClick={saveRbsType}
              disabled={!rbsTypeForm.name.trim() || createRbsType.isPending || updateRbsType.isPending}
            >
              {(createRbsType.isPending || updateRbsType.isPending) ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              {rbsTypeEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Task Summary Popup ──────────────────────────────────────────── */}
      {taskSummaryStakeholder && (() => {
        const { s, wl, name } = taskSummaryStakeholder;
        const stTasks = (tasks as any[]).filter((t: any) => t.responsible === name || t.responsible === s.fullName || t.responsible === s.name);
        const byStatus: Record<string, any[]> = {};
        stTasks.forEach((t: any) => {
          const st = t.status ?? "Unknown";
          if (!byStatus[st]) byStatus[st] = [];
          byStatus[st].push(t);
        });
        const statusColors: Record<string, string> = {
          "Completed": "bg-green-100 text-green-700",
          "In Progress": "bg-blue-100 text-blue-700",
          "Not Started": "bg-gray-100 text-gray-600",
          "On Hold": "bg-yellow-100 text-yellow-700",
          "Cancelled": "bg-red-100 text-red-600",
        };
        const cls = s.classification ?? (s.isInternalTeam ? "TeamMember" : "Stakeholder");
        return (
          <Dialog open={!!taskSummaryStakeholder} onOpenChange={() => setTaskSummaryStakeholder(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {name} — Task Summary
                </DialogTitle>
                <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground mt-1">
                  {s.role && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{s.role}</span>}
                  <Badge className={`text-[10px] px-1 py-0 ${classificationBadge(cls)}`}>{cls}</Badge>
                  {s.department && <span>{s.department}</span>}
                </div>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-muted/40 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">{stTasks.length}</div>
                    <div className="text-[10px] text-muted-foreground">Total</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">{wl?.thisWeek ?? 0}</div>
                    <div className="text-[10px] text-muted-foreground">This Week</div>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">{wl?.nextWeek ?? 0}</div>
                    <div className="text-[10px] text-muted-foreground">Next Week</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">{byStatus["Completed"]?.length ?? 0}</div>
                    <div className="text-[10px] text-muted-foreground">Completed</div>
                  </div>
                </div>
                {stTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No tasks assigned to this stakeholder.</p>
                ) : (
                  Object.entries(byStatus).map(([status, statusTasks]) => (
                    <div key={status}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[status] ?? "bg-muted text-muted-foreground"}`}>{status}</span>
                        <span className="text-xs text-muted-foreground">{statusTasks.length} task{statusTasks.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="space-y-1.5">
                        {statusTasks.map((t: any) => (
                          <div key={t.id ?? t.taskId} className="flex items-start justify-between gap-3 bg-muted/30 rounded-lg px-3 py-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{t.description ?? t.taskId}</div>
                              {t.taskId && <div className="text-[10px] text-muted-foreground">{t.taskId}</div>}
                            </div>
                            <div className="shrink-0 text-right">
                              {t.dueDate && <div className="text-[10px] text-muted-foreground">{new Date(t.dueDate).toLocaleDateString()}</div>}
                              {t.priority && <Badge variant="outline" className="text-[10px] px-1 py-0 mt-0.5">{t.priority}</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
