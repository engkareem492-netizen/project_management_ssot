import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Plus, Trash2, GitBranch, BarChart3, AlertTriangle,
  ChevronRight, ChevronDown, Pencil, Diamond, CalendarDays, List,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate as _formatDateUtil } from "@/lib/dateUtils";

// ─── Types ────────────────────────────────────────────────────────────────────
type DepType = "Finish-to-Start" | "Start-to-Start" | "Finish-to-Finish" | "Start-to-Finish";
type ZoomLevel = "days" | "weeks" | "months";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAY_MS = 1000 * 60 * 60 * 24;

const STATUS_COLORS: Record<string, string> = {
  "Completed": "#22c55e",
  "Done": "#22c55e",
  "In Progress": "#3b82f6",
  "Open": "#f59e0b",
  "Pending": "#f59e0b",
  "Overdue": "#ef4444",
  "Blocked": "#ef4444",
  "Not Started": "#94a3b8",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStatusColor(status: string | null | undefined): string {
  if (!status) return "#94a3b8";
  for (const [key, color] of Object.entries(STATUS_COLORS)) {
    if (status.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return "#94a3b8";
}

function parseDate(d: string | null | undefined): Date | null {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return _formatDateUtil(d instanceof Date ? d.toISOString() : (d as string));
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

function offsetDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function pctKey(projectId: number) {
  return `gantt-pct-v2-${projectId}`;
}

// Build WBS numbering from parentTaskId hierarchy
function buildWBSMap(tasks: Array<{ id: number; parentTaskId?: number | null }>): Map<number, string> {
  const childrenMap = new Map<number | null, typeof tasks>();
  tasks.forEach((t) => {
    const key = (t.parentTaskId as number | null | undefined) ?? null;
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key)!.push(t);
  });

  const result = new Map<number, string>();

  function traverse(parentId: number | null, prefix: string) {
    const children = childrenMap.get(parentId) ?? [];
    children.forEach((t, i) => {
      const wbs = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;
      result.set(t.id, wbs);
      traverse(t.id, wbs);
    });
  }

  traverse(null, "");
  return result;
}

// Sort tasks by WBS for display
function sortByWBS(tasks: any[], wbsMap: Map<number, string>): any[] {
  return [...tasks].sort((a, b) => {
    const wa = wbsMap.get(a.id) ?? "999";
    const wb = wbsMap.get(b.id) ?? "999";
    const partsA = wa.split(".").map(Number);
    const partsB = wb.split(".").map(Number);
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function GanttChart() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;

  const [tab, setTab] = useState("gantt");
  const [zoom, setZoom] = useState<ZoomLevel>("weeks");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [showAddDep, setShowAddDep] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editPct, setEditPct] = useState(0);
  const [depForm, setDepForm] = useState({
    predecessorTaskId: "",
    successorTaskId: "",
    dependencyType: "Finish-to-Start" as DepType,
    lagDays: 0,
  });

  // Drag-to-connect state
  const timelineRef = useRef<HTMLDivElement>(null);
  const [connecting, setConnecting] = useState<null | {
    fromTaskId: string;
    fromSide: "start" | "end";
    fromX: number; fromY: number;
    curX: number; curY: number;
  }>(null);

  // Drag-to-move state
  const [dragBar, setDragBar] = useState<null | {
    taskId: string;
    taskDbId: number;
    origAssignDate: string | null;
    origDueDate: string | null;
    startClientX: number;
    deltaX: number;
  }>(null);
  // Resize state (left = change start date, right = change end date)
  const [resizeBar, setResizeBar] = useState<null | {
    taskId: string;
    taskDbId: number;
    side: "left" | "right";
    origAssignDate: string | null;
    origDueDate: string | null;
    startClientX: number;
    deltaX: number;
  }>(null);
  // Baseline overlay toggle
  const [showBaseline, setShowBaseline] = useState(false);

  // % complete stored in localStorage per project
  const [pctMap, setPctMap] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(pctKey(projectId));
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem(pctKey(projectId), JSON.stringify(pctMap));
  }, [pctMap, projectId]);

  const utils = trpc.useUtils();
  const { data: ganttData, isLoading: ganttLoading } = trpc.taskDependencies.ganttData.useQuery(
    { projectId }, { enabled: !!projectId }
  );
  const { data: fullTasks = [], isLoading: tasksLoading } = trpc.tasks.list.useQuery(
    { projectId }, { enabled: !!projectId }
  );
  const { data: dependencies = [] } = trpc.taskDependencies.list.useQuery(
    { projectId }, { enabled: !!projectId }
  );

  const isLoading = ganttLoading || tasksLoading;

  const createDepMutation = trpc.taskDependencies.create.useMutation({
    onSuccess: () => {
      utils.taskDependencies.ganttData.invalidate();
      utils.taskDependencies.list.invalidate();
      setShowAddDep(false);
      setDepForm({ predecessorTaskId: "", successorTaskId: "", dependencyType: "Finish-to-Start", lagDays: 0 });
      toast.success("Dependency added");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteDepMutation = trpc.taskDependencies.delete.useMutation({
    onSuccess: () => {
      utils.taskDependencies.ganttData.invalidate();
      utils.taskDependencies.list.invalidate();
      toast.success("Dependency removed");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.taskDependencies.ganttData.invalidate();
      utils.tasks.list.invalidate();
      toast.success("Task dates updated");
    },
    onError: (e) => toast.error(`Failed to update dates: ${e.message}`),
  });

  // Merge ganttData tasks with fullTasks to get parentTaskId
  const allTasks = useMemo(() => {
    const ganttTasks = ganttData?.tasks ?? [];
    const fullMap = new Map(fullTasks.map((t: any) => [t.taskId, t]));
    return ganttTasks.map((gt) => {
      const full = fullMap.get(gt.taskId) as any;
      return {
        ...gt,
        parentTaskId: full?.parentTaskId ?? null,
        responsible: full?.responsible ?? gt.responsible ?? null,
        priority: full?.priority ?? null,
      };
    });
  }, [ganttData, fullTasks]);

  // Build WBS map
  const wbsMap = useMemo(() => buildWBSMap(allTasks), [allTasks]);

  // Successor set for critical path highlighting
  const successorSet = useMemo(() => {
    const s = new Set<string>();
    dependencies.forEach((d) => s.add(d.predecessorTaskId));
    return s;
  }, [dependencies]);

  // Build sorted + enriched rows
  const ganttRows = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const withDates = allTasks.map((t) => ({
      ...t,
      startParsed: parseDate(t.assignDate),
      endParsed: parseDate(t.dueDate),
      wbs: wbsMap.get(t.id) ?? "",
    }));

    const sorted = sortByWBS(withDates, wbsMap);

    // Date range
    const allDates = sorted.flatMap((t) => [t.startParsed, t.endParsed].filter(Boolean) as Date[]);
    if (allDates.length === 0) {
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      const end = new Date(today);
      end.setDate(today.getDate() + 30);
      return { rows: sorted, minDate: start, maxDate: end, totalDays: 37, todayOffset: 7 };
    }

    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 5);
    const totalDays = Math.max(30, daysBetween(minDate, maxDate));
    const todayOffset = Math.max(0, Math.min(totalDays, daysBetween(minDate, today)));

    const rows = sorted.map((t) => {
      const start = t.startParsed ?? t.endParsed ?? today;
      const end = t.endParsed ?? t.startParsed ?? today;
      const duration = Math.max(0, daysBetween(start, end));
      const isMilestone = duration === 0 && (t.startParsed || t.endParsed);
      const isParent = allTasks.some((other) => (other as any).parentTaskId === t.id);
      const isCritical = successorSet.has(t.taskId) && !["completed", "done"].includes((t.status ?? "").toLowerCase());

      const startOffset = Math.max(0, daysBetween(minDate, start));

      // For parent tasks, span all children
      let barStart = startOffset;
      let barDuration = Math.max(1, duration);
      if (isParent) {
        const children = allTasks.filter((c) => (c as any).parentTaskId === t.id);
        const childDates = children.flatMap((c) => [parseDate(c.assignDate), parseDate(c.dueDate)].filter(Boolean) as Date[]);
        if (childDates.length > 0) {
          const childMin = new Date(Math.min(...childDates.map((d) => d.getTime())));
          const childMax = new Date(Math.max(...childDates.map((d) => d.getTime())));
          barStart = Math.max(0, daysBetween(minDate, childMin));
          barDuration = Math.max(1, daysBetween(childMin, childMax));
        }
      }

      return {
        ...t,
        duration,
        isMilestone,
        isParent,
        isCritical,
        barStart,
        barDuration,
        depth: (t.wbs.match(/\./g) ?? []).length,
      };
    });

    return { rows, minDate, maxDate, totalDays, todayOffset };
  }, [allTasks, wbsMap, successorSet]);

  // Generate timeline headers based on zoom
  const timelineHeaders = useMemo(() => {
    const { minDate, totalDays } = ganttRows;
    const headers: { label: string; offset: number; days: number }[] = [];

    if (zoom === "days") {
      for (let i = 0; i < totalDays; i++) {
        const d = new Date(minDate);
        d.setDate(minDate.getDate() + i);
        headers.push({
          label: d.toLocaleDateString("en", { weekday: "short", day: "numeric" }),
          offset: i,
          days: 1,
        });
      }
    } else if (zoom === "weeks") {
      let offset = 0;
      const cur = new Date(minDate);
      while (offset < totalDays) {
        const days = Math.min(7, totalDays - offset);
        headers.push({
          label: cur.toLocaleDateString("en", { month: "short", day: "numeric" }),
          offset,
          days,
        });
        cur.setDate(cur.getDate() + 7);
        offset += 7;
      }
    } else {
      // months
      let cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      while (cur.getTime() < ganttRows.maxDate.getTime()) {
        const start = cur < minDate ? minDate : cur;
        const nextMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
        const end = nextMonth > ganttRows.maxDate ? ganttRows.maxDate : nextMonth;
        const days = Math.max(1, daysBetween(start, end));
        const offset = Math.max(0, daysBetween(minDate, start));
        headers.push({
          label: cur.toLocaleDateString("en", { month: "long", year: "numeric" }),
          offset,
          days,
        });
        cur = nextMonth;
      }
    }
    return headers;
  }, [ganttRows, zoom]);

  // Pixels per day based on zoom
  const pxPerDay = zoom === "days" ? 40 : zoom === "weeks" ? 24 : 4;
  const totalWidth = ganttRows.totalDays * pxPerDay;

  const filteredRows = ganttRows.rows.filter((t) => {
    if (!search) return true;
    return (
      t.taskId.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.responsible ?? "").toLowerCase().includes(search.toLowerCase())
    );
  });

  const visibleRows = filteredRows.filter((t) => {
    const parentId = (t as any).parentTaskId;
    if (!parentId) return true;
    // Hide if parent is collapsed
    const parent = allTasks.find((p) => p.id === parentId);
    if (!parent) return true;
    return !collapsed.has(parentId);
  });

  const taskMap = useMemo(() => {
    const m: Record<string, string> = {};
    allTasks.forEach((t) => { m[t.taskId] = t.description?.slice(0, 40) ?? t.taskId; });
    return m;
  }, [allTasks]);

  function toggleCollapse(id: number) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openEditPct(task: any) {
    setEditingTask(task);
    setEditPct(pctMap[task.taskId] ?? 0);
    setShowEditTask(true);
  }

  function savePct() {
    if (!editingTask) return;
    setPctMap((prev) => ({ ...prev, [editingTask.taskId]: editPct }));
    toast.success(`% Complete updated for ${editingTask.taskId}`);
    setShowEditTask(false);
  }

  // Drag-to-connect handlers
  const ROW_H = 40;
  const HEADER_H = 40;

  const startConnect = useCallback((e: React.MouseEvent, taskId: string, side: "start" | "end", barX: number, rowIdx: number) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    const fromX = barX;
    const fromY = HEADER_H + rowIdx * ROW_H + ROW_H / 2;
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    setConnecting({ fromTaskId: taskId, fromSide: side, fromX, fromY, curX, curY });
  }, []);

  const startBarDrag = useCallback((e: React.MouseEvent, t: any) => {
    if (connecting) return;
    e.stopPropagation();
    e.preventDefault();
    setDragBar({
      taskId: t.taskId,
      taskDbId: t.id,
      origAssignDate: t.assignDate ?? null,
      origDueDate: t.dueDate ?? null,
      startClientX: e.clientX,
      deltaX: 0,
    });
  }, [connecting]);

  const startBarResize = useCallback((e: React.MouseEvent, t: any, side: "left" | "right") => {
    if (connecting) return;
    e.stopPropagation();
    e.preventDefault();
    setResizeBar({
      taskId: t.taskId,
      taskDbId: t.id,
      side,
      origAssignDate: t.assignDate ?? null,
      origDueDate: t.dueDate ?? null,
      startClientX: e.clientX,
      deltaX: 0,
    });
  }, [connecting]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (connecting) {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;
      setConnecting(c => c ? { ...c, curX: e.clientX - rect.left, curY: e.clientY - rect.top } : null);
    } else if (dragBar) {
      const deltaX = e.clientX - dragBar.startClientX;
      setDragBar(d => d ? { ...d, deltaX } : null);
    } else if (resizeBar) {
      const deltaX = e.clientX - resizeBar.startClientX;
      setResizeBar(r => r ? { ...r, deltaX } : null);
    }
  }, [connecting, dragBar, resizeBar]);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (resizeBar) {
      const deltaDays = Math.round(resizeBar.deltaX / pxPerDay);
      if (deltaDays !== 0) {
        const dataPayload: any = {};
        if (resizeBar.side === "left" && resizeBar.origAssignDate) {
          dataPayload.assignDate = offsetDateStr(resizeBar.origAssignDate, deltaDays);
        } else if (resizeBar.side === "right" && resizeBar.origDueDate) {
          dataPayload.dueDate = offsetDateStr(resizeBar.origDueDate, deltaDays);
        }
        if (Object.keys(dataPayload).length > 0) {
          updateTaskMutation.mutate({ id: resizeBar.taskDbId, taskId: resizeBar.taskId, data: dataPayload });
        }
      }
      setResizeBar(null);
      return;
    }
    if (dragBar) {
      const deltaDays = Math.round(dragBar.deltaX / pxPerDay);
      if (deltaDays !== 0) {
        const newAssignDate = dragBar.origAssignDate ? offsetDateStr(dragBar.origAssignDate, deltaDays) : undefined;
        const newDueDate = dragBar.origDueDate ? offsetDateStr(dragBar.origDueDate, deltaDays) : undefined;
        const dataPayload: any = {};
        if (newAssignDate) dataPayload.assignDate = newAssignDate;
        if (newDueDate) dataPayload.dueDate = newDueDate;
        if (Object.keys(dataPayload).length > 0) {
          updateTaskMutation.mutate({ id: dragBar.taskDbId, taskId: dragBar.taskId, data: dataPayload });
        }
      }
      setDragBar(null);
      return;
    }
    if (!connecting) return;
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) { setConnecting(null); return; }
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // Determine which row was released on
    const rowIdx = Math.floor((my - HEADER_H) / ROW_H);
    const targetRow = visibleRows[rowIdx];
    if (targetRow && targetRow.taskId !== connecting.fromTaskId && (targetRow.startParsed || targetRow.endParsed)) {
      // Determine drop side (left half = start, right half = end)
      const barLeftPx = targetRow.barStart * pxPerDay;
      const barRightPx = barLeftPx + Math.max(8, targetRow.barDuration * pxPerDay);
      const toSide = mx < (barLeftPx + barRightPx) / 2 ? "start" : "end";
      // Map from→to sides to dependency type
      const typeMap: Record<string, Record<string, DepType>> = {
        end:   { start: "Finish-to-Start", end: "Finish-to-Finish" },
        start: { start: "Start-to-Start",  end: "Start-to-Finish"  },
      };
      const depType = typeMap[connecting.fromSide]?.[toSide] ?? "Finish-to-Start";
      createDepMutation.mutate({
        projectId,
        predecessorTaskId: connecting.fromTaskId,
        successorTaskId: targetRow.taskId,
        dependencyType: depType,
        lagDays: 0,
      });
    }
    setConnecting(null);
  }, [connecting, dragBar, visibleRows, pxPerDay, projectId, createDepMutation, updateTaskMutation]);

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => ["completed", "done"].includes((t.status ?? "").toLowerCase())).length;
  const avgPct = totalTasks > 0
    ? Math.round(Object.values(pctMap).reduce((s, v) => s + v, 0) / Math.max(totalTasks, 1))
    : 0;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-gray-500" />
              Gantt Chart
            </h1>
            <p className="text-gray-500 text-sm mt-1">Microsoft Project-style timeline with WBS, % complete, milestones and critical path</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-center">
              <div className="text-xl font-bold">{totalTasks}</div>
              <div className="text-xs text-muted-foreground">Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{completedTasks}</div>
              <div className="text-xs text-muted-foreground">Done</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-violet-600">{dependencies.length}</div>
              <div className="text-xs text-muted-foreground">Links</div>
            </div>
            <div className="min-w-[120px]">
              <div className="text-xs text-muted-foreground mb-1">Overall Progress</div>
              <Progress value={totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0} className="h-2" />
              <div className="text-xs text-muted-foreground mt-0.5">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% of tasks done</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground items-center bg-white border border-gray-200 rounded-lg px-4 py-2">
        <div className="flex items-center gap-1.5"><div className="w-8 h-3 rounded bg-blue-500" />Normal Task</div>
        <div className="flex items-center gap-1.5"><div className="w-8 h-3 rounded bg-gray-700" />Summary (Parent)</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rotate-45 bg-yellow-500 rounded-sm" />Milestone</div>
        <div className="flex items-center gap-1.5"><div className="w-8 h-3 rounded border-2 border-red-500 bg-red-100" />Critical Path</div>
        <div className="flex items-center gap-1.5"><div className="w-0.5 h-4 bg-red-500" />Today</div>
        <div className="flex items-center gap-1.5"><div className="w-8 h-3 rounded border-2 border-dashed border-gray-400 bg-gray-100/50" />Baseline</div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowBaseline(b => !b)}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${showBaseline ? "bg-gray-700 text-white" : "bg-muted hover:bg-muted/80"}`}
          >
            {showBaseline ? "Hide Baseline" : "Show Baseline"}
          </button>
          <span>Zoom:</span>
          {(["days", "weeks", "months"] as ZoomLevel[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${zoom === z ? "bg-violet-600 text-white" : "bg-muted hover:bg-muted/80"}`}
            >
              {z.charAt(0).toUpperCase() + z.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="gantt"><CalendarDays className="w-4 h-4 mr-1" />Gantt View</TabsTrigger>
            <TabsTrigger value="tasks"><List className="w-4 h-4 mr-1" />Task Table</TabsTrigger>
            <TabsTrigger value="dependencies"><GitBranch className="w-4 h-4 mr-1" />Dependencies</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-52 h-8" />
            {tab === "dependencies" && (
              <Button onClick={() => setShowAddDep(true)} size="sm" className="bg-gray-900 hover:bg-gray-800 text-white">
                <Plus className="w-4 h-4 mr-1" /> Add Link
              </Button>
            )}
          </div>
        </div>

        {/* ── GANTT VIEW ── */}
        <TabsContent value="gantt">
          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground">Loading Gantt data…</div>
          ) : allTasks.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No tasks found</p>
              <p className="text-sm mt-1">Add tasks with start and due dates to see the Gantt chart.</p>
            </div>
          ) : (
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="flex">
                {/* ── Left panel: task info ── */}
                <div className="w-[380px] shrink-0 border-r flex flex-col">
                  {/* Column headers */}
                  <div className="flex items-center border-b bg-violet-50 h-10 px-3 gap-2 text-xs font-semibold text-violet-700 shrink-0">
                    <span className="w-10">WBS</span>
                    <span className="w-16">ID</span>
                    <span className="flex-1">Task</span>
                    <span className="w-12 text-right">Days</span>
                    <span className="w-10 text-right">%</span>
                  </div>
                  {/* Task rows */}
                  <div className="overflow-y-auto">
                    {visibleRows.map((t, i) => {
                      const pct = pctMap[t.taskId] ?? 0;
                      const isCollapsible = t.isParent;
                      const isCollapsedNow = collapsed.has(t.id);
                      return (
                        <div
                          key={t.id}
                          className={`flex items-center border-b h-10 px-3 gap-2 hover:bg-violet-50/40 cursor-pointer text-xs ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}
                          onClick={() => openEditPct(t)}
                        >
                          {/* WBS */}
                          <span className="w-10 font-mono text-muted-foreground shrink-0" style={{ paddingLeft: `${t.depth * 8}px` }}>
                            {isCollapsible && (
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleCollapse(t.id); }}
                                className="mr-0.5"
                              >
                                {isCollapsedNow
                                  ? <ChevronRight className="w-3 h-3 inline" />
                                  : <ChevronDown className="w-3 h-3 inline" />
                                }
                              </button>
                            )}
                            {t.wbs || "—"}
                          </span>
                          {/* Task ID */}
                          <span className={`w-16 font-mono font-bold shrink-0 truncate ${t.isCritical ? "text-red-600" : "text-violet-700"}`}>
                            {t.taskId}
                          </span>
                          {/* Description */}
                          <span className={`flex-1 truncate ${t.isParent ? "font-semibold" : ""}`}>
                            {t.isMilestone && <span className="mr-1 text-yellow-500">◆</span>}
                            {t.description?.slice(0, 30) ?? "—"}
                          </span>
                          {/* Duration */}
                          <span className="w-12 text-right text-muted-foreground shrink-0">
                            {t.isMilestone ? "MS" : `${t.duration}d`}
                          </span>
                          {/* % complete */}
                          <span className={`w-10 text-right font-semibold shrink-0 ${pct >= 100 ? "text-green-600" : pct > 0 ? "text-blue-600" : "text-muted-foreground"}`}>
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Right panel: timeline ── */}
                <div className="flex-1 overflow-x-auto">
                  <div
                    ref={timelineRef}
                    style={{ width: `${Math.max(totalWidth, 500)}px`, position: "relative", userSelect: (connecting || dragBar) ? "none" : undefined, cursor: dragBar ? "grabbing" : undefined }}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={() => { setConnecting(null); setDragBar(null); }}
                  >
                    {/* Timeline headers */}
                    <div className="flex border-b bg-violet-50 h-10 relative">
                      {timelineHeaders.map((h, i) => (
                        <div
                          key={i}
                          className="border-r border-violet-200 flex items-center px-2 h-full shrink-0"
                          style={{ width: `${h.days * pxPerDay}px` }}
                        >
                          <span className="text-xs text-violet-600 font-medium truncate">{h.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Today line */}
                    {ganttRows.todayOffset > 0 && ganttRows.todayOffset < ganttRows.totalDays && (
                      <div
                        className="absolute top-0 bottom-0 pointer-events-none z-20"
                        style={{ left: `${ganttRows.todayOffset * pxPerDay}px` }}
                      >
                        <div className="w-0.5 h-10 bg-red-500 opacity-80" />
                        <div className="w-0.5 bg-red-400 opacity-50" style={{ height: `${visibleRows.length * 40}px` }} />
                      </div>
                    )}

                    {/* Grid + task bars */}
                    {visibleRows.map((t, i) => {
                      const isDraggingThis = dragBar?.taskId === t.taskId;
                      const isResizingThis = resizeBar?.taskId === t.taskId;
                      const dragDeltaPx = isDraggingThis ? dragBar!.deltaX : 0;
                      const dragDeltaDays = isDraggingThis ? Math.round(dragBar!.deltaX / pxPerDay) : 0;
                      const resizeDeltaPx = isResizingThis ? resizeBar!.deltaX : 0;
                      const resizeDeltaDays = isResizingThis ? Math.round(resizeBar!.deltaX / pxPerDay) : 0;
                      // Compute bar position accounting for both drag and resize
                      let barLeftPx = t.barStart * pxPerDay + dragDeltaPx;
                      let barWidthPx = Math.max(t.isMilestone ? 16 : 8, t.barDuration * pxPerDay);
                      if (isResizingThis) {
                        if (resizeBar!.side === "left") {
                          barLeftPx += resizeDeltaPx;
                          barWidthPx = Math.max(8, barWidthPx - resizeDeltaPx);
                        } else {
                          barWidthPx = Math.max(8, barWidthPx + resizeDeltaPx);
                        }
                      }
                      const pct = pctMap[t.taskId] ?? 0;
                      const color = t.isParent ? "#374151" : getStatusColor(t.status);

                      return (
                        <div
                          key={t.id}
                          className={`relative border-b h-10 flex items-center ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}
                        >
                          {/* Vertical grid lines */}
                          {timelineHeaders.map((h, hi) => (
                            <div
                              key={hi}
                              className="absolute top-0 bottom-0 border-r border-gray-100 pointer-events-none"
                              style={{ left: `${h.offset * pxPerDay}px` }}
                            />
                          ))}

                          {/* Baseline ghost bar (shown when showBaseline is on) */}
                          {showBaseline && (t.startParsed || t.endParsed) && !t.isMilestone && (() => {
                            const baseLeft = t.barStart * pxPerDay;
                            const baseWidth = Math.max(8, t.barDuration * pxPerDay);
                            return (
                              <div
                                className="absolute top-3 bottom-3 rounded border-2 border-dashed border-gray-400 bg-gray-100/40 pointer-events-none z-5"
                                style={{ left: `${baseLeft}px`, width: `${baseWidth}px` }}
                                title={`Baseline: ${fmtDate(t.assignDate)} → ${fmtDate(t.dueDate)}`}
                              />
                            );
                          })()}

                          {/* Bar or milestone */}
                          {(t.startParsed || t.endParsed) && (
                            t.isMilestone ? (
                              /* Milestone diamond */
                              <div
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-yellow-400 border-2 border-yellow-600 cursor-grab hover:scale-125 transition-transform z-10"
                                style={{ left: `${barLeftPx}px` }}
                                title={`${t.taskId}: ${t.description} — Milestone`}
                                onMouseDown={(e) => startBarDrag(e, t)}
                              />
                            ) : (
                              /* Task bar — rectangular with prominent handles */
                              <div
                                className={`absolute group select-none overflow-visible
                                  ${t.isCritical ? "ring-2 ring-red-500 ring-offset-0" : ""}
                                  ${isDraggingThis ? "opacity-75 cursor-grabbing z-50" : isResizingThis ? "opacity-75 z-50" : "cursor-grab z-10"}`}
                                style={{
                                  left: `${barLeftPx}px`,
                                  width: `${barWidthPx}px`,
                                  top: '4px',
                                  bottom: '4px',
                                  borderRadius: '3px',
                                  backgroundColor: color,
                                  boxShadow: isDraggingThis
                                    ? '0 8px 24px rgba(0,0,0,0.25), 0 0 0 2px #7c3aed'
                                    : isResizingThis
                                    ? '0 4px 12px rgba(0,0,0,0.2), 0 0 0 2px #3b82f6'
                                    : '0 1px 3px rgba(0,0,0,0.2)',
                                  transition: isDraggingThis || isResizingThis ? 'none' : 'box-shadow 0.15s',
                                  overflow: 'hidden',
                                }}
                                title={`${t.taskId}: ${t.description}\n${fmtDate(t.assignDate)} → ${fmtDate(t.dueDate)}\nStatus: ${t.status ?? "—"}\n% Complete: ${pct}%${isDraggingThis && dragDeltaDays !== 0 ? `\nMoving: ${dragDeltaDays > 0 ? "+" : ""}${dragDeltaDays} days` : ""}${isResizingThis && resizeDeltaDays !== 0 ? `\nResizing: ${resizeDeltaDays > 0 ? "+" : ""}${resizeDeltaDays} days` : ""}`}
                                onMouseDown={(e) => startBarDrag(e, t)}
                                onClick={() => !connecting && !dragBar && !resizeBar && openEditPct(t)}
                              >
                                {/* % complete fill — lighter stripe */}
                                {pct > 0 && (
                                  <div className="absolute inset-0 bg-black/20" style={{ width: `${pct}%`, borderRadius: '3px 0 0 3px' }} />
                                )}
                                {/* Label */}
                                <span className="relative z-10 text-white text-[10px] font-semibold px-2 truncate pointer-events-none"
                                  style={{ lineHeight: '100%', position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 0, right: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {isDraggingThis && dragDeltaDays !== 0
                                    ? `${t.taskId} (${dragDeltaDays > 0 ? "+" : ""}${dragDeltaDays}d)`
                                    : isResizingThis && resizeDeltaDays !== 0
                                    ? `${t.taskId} (${resizeDeltaDays > 0 ? "+" : ""}${resizeDeltaDays}d)`
                                    : barWidthPx > 60 ? `${t.taskId}${pct > 0 ? ` · ${pct}%` : ""}` : barWidthPx > 24 ? t.taskId : ""}
                                </span>
                                {/* ── Left resize grip ── always visible, prominent */}
                                {!isDraggingThis && !connecting && (
                                  <div
                                    className="absolute left-0 top-0 bottom-0 flex items-center justify-center cursor-ew-resize z-30"
                                    style={{ width: '10px', background: 'rgba(0,0,0,0.25)', borderRadius: '3px 0 0 3px' }}
                                    title="Drag to change start date"
                                    onMouseDown={(e) => { e.stopPropagation(); startBarResize(e, t, "left"); }}
                                  >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      <div style={{ width: '2px', height: '6px', background: 'rgba(255,255,255,0.8)', borderRadius: '1px' }} />
                                      <div style={{ width: '2px', height: '6px', background: 'rgba(255,255,255,0.8)', borderRadius: '1px' }} />
                                    </div>
                                  </div>
                                )}
                                {/* ── Right resize grip ── always visible, prominent */}
                                {!isDraggingThis && !connecting && (
                                  <div
                                    className="absolute right-0 top-0 bottom-0 flex items-center justify-center cursor-ew-resize z-30"
                                    style={{ width: '10px', background: 'rgba(0,0,0,0.25)', borderRadius: '0 3px 3px 0' }}
                                    title="Drag to change end date"
                                    onMouseDown={(e) => { e.stopPropagation(); startBarResize(e, t, "right"); }}
                                  >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      <div style={{ width: '2px', height: '6px', background: 'rgba(255,255,255,0.8)', borderRadius: '1px' }} />
                                      <div style={{ width: '2px', height: '6px', background: 'rgba(255,255,255,0.8)', borderRadius: '1px' }} />
                                    </div>
                                  </div>
                                )}
                                {/* ── Connection handle — left (start) ── */}
                                {!isDraggingThis && !isResizingThis && (
                                  <div
                                    className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:!opacity-100 z-40 cursor-crosshair transition-all hover:scale-125"
                                    style={{ left: '-7px', width: '14px', height: '14px', borderRadius: '50%', background: 'white', border: '2.5px solid #7c3aed', boxShadow: '0 0 0 2px rgba(124,58,237,0.3)' }}
                                    title="Drag to create dependency (from Start)"
                                    onMouseDown={(e) => { e.stopPropagation(); startConnect(e, t.taskId, "start", barLeftPx, i); }}
                                  />
                                )}
                                {/* ── Connection handle — right (end) ── */}
                                {!isDraggingThis && !isResizingThis && (
                                  <div
                                    className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:!opacity-100 z-40 cursor-crosshair transition-all hover:scale-125"
                                    style={{ right: '-7px', width: '14px', height: '14px', borderRadius: '50%', background: 'white', border: '2.5px solid #7c3aed', boxShadow: '0 0 0 2px rgba(124,58,237,0.3)' }}
                                    title="Drag to create dependency (from End)"
                                    onMouseDown={(e) => { e.stopPropagation(); startConnect(e, t.taskId, "end", barLeftPx + barWidthPx, i); }}
                                  />
                                )}
                              </div>
                            )
                          )}
                        </div>
                      );
                    })}

                    {/* SVG overlay: dependency arrows + rubber-band */}
                    {(() => {
                      const svgH = HEADER_H + visibleRows.length * ROW_H;
                      const svgW = Math.max(totalWidth, 500);
                      const rowIdxMap: Record<string, number> = {};
                      visibleRows.forEach((r, i) => { rowIdxMap[r.taskId] = i; });
                      return (
                        <svg
                          className="absolute top-0 left-0 pointer-events-none z-30"
                          width={svgW} height={svgH}
                          style={{ overflow: "visible" }}
                        >
                          <defs>
                            <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                              <path d="M1,1 L7,4 L1,7 Z" fill="#7c3aed" />
                            </marker>
                            <marker id="arrowhead-red" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                              <path d="M1,1 L7,4 L1,7 Z" fill="#ef4444" />
                            </marker>
                          </defs>
                          {/* Existing dependency arrows — orthogonal MS-Project style */}
                          {dependencies.map(d => {
                            const predRow = rowIdxMap[d.predecessorTaskId];
                            const succRow = rowIdxMap[d.successorTaskId];
                            const predTask = visibleRows[predRow];
                            const succTask = visibleRows[succRow];
                            if (predRow === undefined || succRow === undefined || !predTask || !succTask) return null;
                            const depType = d.dependencyType ?? "Finish-to-Start";
                            const predBarEnd = (predTask.barStart + predTask.barDuration) * pxPerDay;
                            const predBarStart = predTask.barStart * pxPerDay;
                            const succBarStart = succTask.barStart * pxPerDay;
                            const succBarEnd = (succTask.barStart + succTask.barDuration) * pxPerDay;
                            const x1 = depType.startsWith("Finish") ? predBarEnd : predBarStart;
                            const x2 = depType.endsWith("Start") ? succBarStart : succBarEnd;
                            const y1 = HEADER_H + predRow * ROW_H + ROW_H / 2;
                            const y2 = HEADER_H + succRow * ROW_H + ROW_H / 2;
                            // Orthogonal routing: horizontal segment → vertical segment → horizontal to target
                            const gap = 8; // gap before turning
                            const isCriticalDep = predTask.isCritical && succTask.isCritical;
                            const stroke = isCriticalDep ? "#ef4444" : "#7c3aed";
                            const marker = isCriticalDep ? "url(#arrowhead-red)" : "url(#arrowhead)";
                            let pathD: string;
                            if (Math.abs(y1 - y2) < 2) {
                              // Same row — straight horizontal
                              pathD = `M${x1},${y1} L${x2},${y2}`;
                            } else {
                              // Elbow: go right gap, drop/rise, go to target
                              const midX = x1 + gap;
                              pathD = `M${x1},${y1} L${midX},${y1} L${midX},${y2} L${x2},${y2}`;
                            }
                            return (
                              <g key={d.id}>
                                {/* Shadow for readability */}
                                <path d={pathD} fill="none" stroke="white" strokeWidth="3" opacity="0.5" />
                                <path d={pathD}
                                  fill="none" stroke={stroke} strokeWidth="1.5"
                                  markerEnd={marker} opacity="0.85"
                                />
                              </g>
                            );
                          })}
                          {/* Rubber-band line while dragging */}
                          {connecting && (
                            <line
                              x1={connecting.fromX} y1={connecting.fromY}
                              x2={connecting.curX} y2={connecting.curY}
                              stroke="#7c3aed" strokeWidth="2" strokeDasharray="5 3"
                              markerEnd="url(#arrowhead)"
                            />
                          )}
                        </svg>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Legend row */}
              {connecting && (
                <div className="px-4 py-1 bg-violet-50 border-t text-xs text-violet-700 font-medium">
                  Linking: drag to another bar's ● handle to create a dependency. Release on empty space to cancel.
                  <span className="ml-2 text-muted-foreground">end→start = FS • start→start = SS • end→end = FF • start→end = SF</span>
                </div>
              )}
              {dragBar && (
                <div className="px-4 py-1 bg-amber-50 border-t text-xs text-amber-700 font-medium">
                  Moving <strong>{dragBar.taskId}</strong>: drag left/right to shift dates, release to save.
                  {Math.round(dragBar.deltaX / pxPerDay) !== 0 && (
                    <span className="ml-2 font-bold">
                      {Math.round(dragBar.deltaX / pxPerDay) > 0 ? "+" : ""}{Math.round(dragBar.deltaX / pxPerDay)} days
                    </span>
                  )}
                </div>
              )}
              <div className="p-3 border-t bg-gray-50 flex flex-wrap gap-3 items-center">
                {Object.entries(STATUS_COLORS).slice(0, 6).map(([s, c]) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: c }} />
                    <span className="text-xs text-muted-foreground">{s}</span>
                  </div>
                ))}
                <span className="ml-auto text-xs text-muted-foreground">
                  Drag bar to move (changes dates) · Hover for ● handles to link tasks · Click to edit %
                </span>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── TASK TABLE ── */}
        <TabsContent value="tasks">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-violet-50">
                  <TableHead className="font-semibold w-16">WBS</TableHead>
                  <TableHead className="font-semibold w-24">Task ID</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold w-28">Responsible</TableHead>
                  <TableHead className="font-semibold w-24">Start</TableHead>
                  <TableHead className="font-semibold w-24">Finish</TableHead>
                  <TableHead className="font-semibold w-16">Days</TableHead>
                  <TableHead className="font-semibold w-28">% Complete</TableHead>
                  <TableHead className="font-semibold w-28">Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ganttRows.rows.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No tasks found.</TableCell></TableRow>
                ) : ganttRows.rows.map((t) => {
                  const pct = pctMap[t.taskId] ?? 0;
                  return (
                    <TableRow key={t.id} className="hover:bg-violet-50/30">
                      <TableCell className="font-mono text-xs text-muted-foreground">{t.wbs || "—"}</TableCell>
                      <TableCell className={`font-mono text-sm font-bold ${t.isCritical ? "text-red-600" : "text-violet-700"}`}>
                        {t.isMilestone && <span className="mr-1 text-yellow-500">◆</span>}
                        {t.taskId}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <span className={t.isParent ? "font-semibold" : ""}>{t.description?.slice(0, 60)}</span>
                        {t.isParent && <Badge className="ml-2 text-[10px] bg-gray-100 text-gray-600">Summary</Badge>}
                        {t.isCritical && <Badge className="ml-1 text-[10px] bg-red-100 text-red-700">Critical</Badge>}
                      </TableCell>
                      <TableCell className="text-sm">{(t as any).responsible || "—"}</TableCell>
                      <TableCell className="text-sm">{fmtDate(t.assignDate)}</TableCell>
                      <TableCell className="text-sm">{fmtDate(t.dueDate)}</TableCell>
                      <TableCell className="text-sm text-center">{t.isMilestone ? "—" : `${t.duration}d`}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-1.5 flex-1" />
                          <span className="text-xs font-semibold w-8 text-right">{pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="text-xs" style={{ backgroundColor: getStatusColor(t.status) + "20", color: getStatusColor(t.status) }}>
                          {t.status ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => openEditPct(t)} title="Edit % complete">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── DEPENDENCIES ── */}
        <TabsContent value="dependencies">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-violet-50">
                  <TableHead className="font-semibold">Predecessor</TableHead>
                  <TableHead className="w-44 font-semibold">Link Type</TableHead>
                  <TableHead className="font-semibold">Successor</TableHead>
                  <TableHead className="w-20 font-semibold">Lag</TableHead>
                  <TableHead className="w-16 text-right font-semibold">Remove</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dependencies.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No dependencies defined. Use "Add Link" to create task dependencies.</TableCell></TableRow>
                ) : dependencies.map((d) => (
                  <TableRow key={d.id} className="hover:bg-violet-50/30">
                    <TableCell>
                      <div className="font-mono text-sm font-bold text-violet-700">{d.predecessorTaskId}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">{taskMap[d.predecessorTaskId]}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{d.dependencyType ?? "Finish-to-Start"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm font-bold text-violet-700">{d.successorTaskId}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">{taskMap[d.successorTaskId]}</div>
                    </TableCell>
                    <TableCell className="text-sm">{d.lagDays ?? 0}d</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700"
                        onClick={() => { if (confirm("Remove this dependency?")) deleteDepMutation.mutate({ id: d.id }); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Scheduling conflicts */}
          {dependencies.filter((d) => {
            const pred = allTasks.find((t) => t.taskId === d.predecessorTaskId);
            const succ = allTasks.find((t) => t.taskId === d.successorTaskId);
            if (!pred || !succ) return false;
            const predEnd = parseDate(pred.dueDate);
            const succStart = parseDate(succ.assignDate);
            return predEnd && succStart && succStart < predEnd;
          }).map((d) => (
            <div key={d.id} className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mt-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span><strong>{d.successorTaskId}</strong> starts before predecessor <strong>{d.predecessorTaskId}</strong> finishes — scheduling conflict.</span>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Edit Task Dialog — progress + dependencies */}
      <Dialog open={showEditTask} onOpenChange={setShowEditTask}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4 py-2">
              <div>
                <div className="font-mono font-bold text-violet-700">{editingTask.taskId}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{editingTask.description}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Start:</span> {fmtDate(editingTask.assignDate)}</div>
                <div><span className="text-muted-foreground">Finish:</span> {fmtDate(editingTask.dueDate)}</div>
                <div><span className="text-muted-foreground">Duration:</span> {editingTask.isMilestone ? "Milestone" : `${editingTask.duration} days`}</div>
                <div><span className="text-muted-foreground">Status:</span> {editingTask.status ?? "—"}</div>
              </div>
              <div className="space-y-2">
                <Label>% Complete: <span className="font-bold text-violet-700">{editPct}%</span></Label>
                <input type="range" min={0} max={100} step={5} value={editPct}
                  onChange={(e) => setEditPct(Number(e.target.value))} className="w-full accent-violet-600" />
                <Progress value={editPct} className="h-2" />
              </div>

              {/* Dependencies inline */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" /> Dependencies</Label>
                </div>
                {/* Predecessors */}
                {(() => {
                  const preds = dependencies.filter(d => d.successorTaskId === editingTask.taskId);
                  const succs = dependencies.filter(d => d.predecessorTaskId === editingTask.taskId);
                  return (
                    <div className="space-y-2 text-xs">
                      {preds.length > 0 && (
                        <div>
                          <div className="text-muted-foreground font-medium mb-1">Predecessors</div>
                          {preds.map(d => (
                            <div key={d.id} className="flex items-center justify-between bg-violet-50 rounded px-2 py-1 mb-1">
                              <span><span className="font-mono font-bold text-violet-700">{d.predecessorTaskId}</span> <span className="text-muted-foreground">({d.dependencyType ?? "FS"})</span></span>
                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                                onClick={() => { if (confirm("Remove?")) deleteDepMutation.mutate({ id: d.id }); }}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {succs.length > 0 && (
                        <div>
                          <div className="text-muted-foreground font-medium mb-1">Successors</div>
                          {succs.map(d => (
                            <div key={d.id} className="flex items-center justify-between bg-blue-50 rounded px-2 py-1 mb-1">
                              <span><span className="font-mono font-bold text-blue-700">{d.successorTaskId}</span> <span className="text-muted-foreground">({d.dependencyType ?? "FS"})</span></span>
                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                                onClick={() => { if (confirm("Remove?")) deleteDepMutation.mutate({ id: d.id }); }}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Add dependency inline */}
                      <div className="rounded border p-2 space-y-2 bg-gray-50">
                        <div className="font-medium text-muted-foreground">Add Link</div>
                        <div className="grid grid-cols-3 gap-1">
                          <Select value={depForm.predecessorTaskId || "__none__"}
                            onValueChange={(v) => setDepForm({ ...depForm, predecessorTaskId: v === "__none__" ? "" : v, successorTaskId: v === "__none__" ? "" : editingTask.taskId })}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Predecessor…" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">— predecessor</SelectItem>
                              {allTasks.filter(t => t.taskId !== editingTask.taskId).map(t =>
                                <SelectItem key={t.taskId} value={t.taskId}>{t.taskId}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={depForm.dependencyType}
                            onValueChange={(v) => setDepForm({ ...depForm, dependencyType: v as DepType })}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(["Finish-to-Start","Start-to-Start","Finish-to-Finish","Start-to-Finish"] as DepType[]).map(t =>
                                <SelectItem key={t} value={t}>{t.replace("Finish","F").replace("Start","S").replace("-to-","→")}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Button size="sm" className="h-7 bg-violet-600 hover:bg-violet-700 text-white text-xs"
                            disabled={!depForm.predecessorTaskId || createDepMutation.isPending}
                            onClick={() => createDepMutation.mutate({ projectId, predecessorTaskId: depForm.predecessorTaskId, successorTaskId: editingTask.taskId, dependencyType: depForm.dependencyType, lagDays: depForm.lagDays })}>
                            + Link
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditTask(false)}>Close</Button>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={savePct}>Save Progress</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dependency Dialog */}
      <Dialog open={showAddDep} onOpenChange={setShowAddDep}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Task Dependency (Link)</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Predecessor Task (finishes/starts first)</Label>
              <Select value={depForm.predecessorTaskId || "__none__"} onValueChange={(v) => setDepForm({ ...depForm, predecessorTaskId: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select predecessor…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select…</SelectItem>
                  {allTasks.map((t) => <SelectItem key={t.id} value={t.taskId}>{t.taskId} — {t.description?.slice(0, 40)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Link Type</Label>
              <Select value={depForm.dependencyType} onValueChange={(v) => setDepForm({ ...depForm, dependencyType: v as DepType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Finish-to-Start", "Start-to-Start", "Finish-to-Finish", "Start-to-Finish"] as DepType[]).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Successor Task (depends on predecessor)</Label>
              <Select value={depForm.successorTaskId || "__none__"} onValueChange={(v) => setDepForm({ ...depForm, successorTaskId: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select successor…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select…</SelectItem>
                  {allTasks.filter((t) => t.taskId !== depForm.predecessorTaskId).map((t) => (
                    <SelectItem key={t.id} value={t.taskId}>{t.taskId} — {t.description?.slice(0, 40)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Lag Days (0 = no lag)</Label>
              <Input type="number" min={0} value={depForm.lagDays}
                onChange={(e) => setDepForm({ ...depForm, lagDays: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDep(false)}>Cancel</Button>
            <Button
              className="bg-gray-900 hover:bg-gray-800 text-white"
              onClick={() => createDepMutation.mutate({ projectId, ...depForm })}
              disabled={!depForm.predecessorTaskId || !depForm.successorTaskId || createDepMutation.isPending}
            >
              {createDepMutation.isPending ? "Adding…" : "Add Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
