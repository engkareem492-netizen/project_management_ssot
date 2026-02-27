import { useState, useMemo } from "react";
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
import { Plus, Trash2, GitBranch, BarChart3, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type DepType = "Finish-to-Start" | "Start-to-Start" | "Finish-to-Finish" | "Start-to-Finish";

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

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return String(d); }
}

export default function GanttChart() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;

  const [tab, setTab] = useState("gantt");
  const [showAddDep, setShowAddDep] = useState(false);
  const [depForm, setDepForm] = useState({ predecessorTaskId: "", successorTaskId: "", dependencyType: "Finish-to-Start" as DepType, lagDays: 0 });
  const [search, setSearch] = useState("");

  const utils = trpc.useUtils();
  const { data: ganttData, isLoading } = trpc.taskDependencies.ganttData.useQuery({ projectId }, { enabled: !!projectId });
  const { data: dependencies = [] } = trpc.taskDependencies.list.useQuery({ projectId }, { enabled: !!projectId });

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

  const allTasks = ganttData?.tasks ?? [];

  // Build Gantt rows with date-based bar positioning
  const ganttRows = useMemo(() => {
    const tasksWithDates = allTasks.map((t) => ({
      ...t,
      startParsed: parseDate(t.assignDate),
      endParsed: parseDate(t.dueDate),
    }));

    // Find overall date range
    const allDates = tasksWithDates.flatMap((t) => [t.startParsed, t.endParsed].filter(Boolean) as Date[]);
    if (allDates.length === 0) return { rows: tasksWithDates, minDate: new Date(), maxDate: new Date(), totalDays: 30 };

    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 2);
    const totalDays = Math.max(30, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));

    const rows = tasksWithDates.map((t) => {
      const start = t.startParsed ?? t.endParsed ?? minDate;
      const end = t.endParsed ?? t.startParsed ?? maxDate;
      const startOffset = Math.max(0, (start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      const duration = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return { ...t, startOffset, duration, totalDays };
    });

    return { rows, minDate, maxDate, totalDays };
  }, [allTasks]);

  const filteredTasks = allTasks.filter((t) => !search || t.taskId.toLowerCase().includes(search.toLowerCase()) || (t.description ?? "").toLowerCase().includes(search.toLowerCase()));

  // Build dependency map for display
  const taskMap = useMemo(() => {
    const m: Record<string, string> = {};
    allTasks.forEach((t) => { m[t.taskId] = t.description?.slice(0, 40) ?? t.taskId; });
    return m;
  }, [allTasks]);

  // Generate week headers for Gantt
  const weekHeaders = useMemo(() => {
    const headers: { label: string; offset: number; width: number }[] = [];
    if (!ganttRows.minDate || ganttRows.totalDays === 0) return headers;
    const current = new Date(ganttRows.minDate);
    let offset = 0;
    while (offset < ganttRows.totalDays) {
      const weekStart = new Date(current);
      const daysLeft = Math.min(7, ganttRows.totalDays - offset);
      headers.push({
        label: weekStart.toLocaleDateString("en", { month: "short", day: "numeric" }),
        offset,
        width: (daysLeft / ganttRows.totalDays) * 100,
      });
      current.setDate(current.getDate() + 7);
      offset += 7;
    }
    return headers;
  }, [ganttRows]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-violet-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-violet-600" />
              Gantt Chart & Task Dependencies
            </h1>
            <p className="text-violet-700 text-sm mt-1">Visualize task timelines and manage dependencies between tasks</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-violet-700 border-violet-300">{allTasks.length} Tasks</Badge>
            <Badge variant="outline" className="text-violet-700 border-violet-300">{dependencies.length} Dependencies</Badge>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="gantt"><BarChart3 className="w-4 h-4 mr-1" />Gantt View</TabsTrigger>
            <TabsTrigger value="dependencies"><GitBranch className="w-4 h-4 mr-1" />Dependencies</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-52" />
            {tab === "dependencies" && (
              <Button onClick={() => setShowAddDep(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
                <Plus className="w-4 h-4 mr-1" /> Add Dependency
              </Button>
            )}
          </div>
        </div>

        {/* Gantt Tab */}
        <TabsContent value="gantt">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading Gantt data...</div>
          ) : allTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No tasks found. Import tasks to see the Gantt chart.</p>
            </div>
          ) : (
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              {/* Gantt Chart */}
              <div className="overflow-x-auto">
                <div style={{ minWidth: "900px" }}>
                  {/* Header row */}
                  <div className="flex border-b bg-violet-50">
                    <div className="w-72 shrink-0 px-4 py-2 text-xs font-semibold text-violet-700 border-r">Task</div>
                    <div className="flex-1 relative h-8">
                      {weekHeaders.map((w, i) => (
                        <div key={i} className="absolute top-0 bottom-0 border-r border-violet-200 flex items-center px-1" style={{ left: `${w.offset / ganttRows.totalDays * 100}%`, width: `${w.width}%` }}>
                          <span className="text-xs text-violet-600 truncate">{w.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Task rows */}
                  {ganttRows.rows
                    .filter((t) => !search || t.taskId.toLowerCase().includes(search.toLowerCase()) || (t.description ?? "").toLowerCase().includes(search.toLowerCase()))
                    .map((t, i) => {
                      const startOffset = (t as typeof t & { startOffset: number }).startOffset ?? 0;
                      const duration = (t as typeof t & { duration: number }).duration ?? 1;
                      const barLeft = (startOffset / ganttRows.totalDays) * 100;
                      const barWidth = (duration / ganttRows.totalDays) * 100;
                      const color = getStatusColor(t.status);
                      const hasDep = dependencies.some((d) => d.successorTaskId === t.taskId || d.predecessorTaskId === t.taskId);

                      return (
                        <div key={t.id} className={`flex border-b hover:bg-violet-50/30 ${i % 2 === 0 ? "" : "bg-gray-50/30"}`} style={{ minHeight: "40px" }}>
                          <div className="w-72 shrink-0 px-4 py-2 border-r flex items-center gap-2">
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs font-semibold text-violet-700">{t.taskId}</span>
                                {hasDep && <GitBranch className="w-3 h-3 text-violet-400" />}
                              </div>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">{t.description?.slice(0, 35)}</div>
                            </div>
                          </div>
                          <div className="flex-1 relative py-2 px-1">
                            {/* Week grid lines */}
                            {weekHeaders.map((w, wi) => (
                              <div key={wi} className="absolute top-0 bottom-0 border-r border-gray-100" style={{ left: `${w.offset / ganttRows.totalDays * 100}%` }} />
                            ))}
                            {/* Task bar */}
                            {(t.startParsed || t.endParsed) && (
                              <div
                                className="absolute top-2 bottom-2 rounded flex items-center px-2 text-white text-xs font-medium overflow-hidden"
                                style={{ left: `${barLeft}%`, width: `${Math.max(barWidth, 2)}%`, backgroundColor: color, minWidth: "4px" }}
                                title={`${t.taskId}: ${t.description ?? ""}\n${formatDate(t.assignDate)} → ${formatDate(t.dueDate)}\nStatus: ${t.status ?? "—"}`}
                              >
                                <span className="truncate">{barWidth > 8 ? t.taskId : ""}</span>
                              </div>
                            )}
                            {!t.startParsed && !t.endParsed && (
                              <div className="absolute inset-0 flex items-center px-2">
                                <span className="text-xs text-gray-300 italic">No dates set</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Legend */}
              <div className="p-3 border-t bg-gray-50 flex flex-wrap gap-3">
                {Object.entries(STATUS_COLORS).slice(0, 5).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                    <span className="text-xs text-muted-foreground">{status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Dependencies Tab */}
        <TabsContent value="dependencies">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-violet-50">
                  <TableHead className="font-semibold">Predecessor Task</TableHead>
                  <TableHead className="w-40 font-semibold">Dependency Type</TableHead>
                  <TableHead className="font-semibold">Successor Task</TableHead>
                  <TableHead className="w-20 font-semibold">Lag (days)</TableHead>
                  <TableHead className="w-20 font-semibold text-right">Remove</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dependencies.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No dependencies defined yet. Add dependencies to build the Gantt chart.</TableCell></TableRow>
                ) : dependencies.map((d) => (
                  <TableRow key={d.id} className="hover:bg-violet-50/30">
                    <TableCell>
                      <div className="font-mono text-sm font-semibold text-violet-700">{d.predecessorTaskId}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">{taskMap[d.predecessorTaskId] ?? ""}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{d.dependencyType ?? "Finish-to-Start"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm font-semibold text-violet-700">{d.successorTaskId}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">{taskMap[d.successorTaskId] ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-sm">{d.lagDays ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => { if (confirm("Remove this dependency?")) deleteDepMutation.mutate({ id: d.id }); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Dependency warnings */}
          {dependencies.length > 0 && (
            <div className="mt-4 space-y-2">
              {dependencies.filter((d) => {
                const pred = allTasks.find((t) => t.taskId === d.predecessorTaskId);
                const succ = allTasks.find((t) => t.taskId === d.successorTaskId);
                if (!pred || !succ) return false;
                const predEnd = parseDate(pred.dueDate);
                const succStart = parseDate(succ.assignDate);
                if (!predEnd || !succStart) return false;
                return succStart < predEnd;
              }).map((d) => (
                <div key={d.id} className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span><strong>{d.successorTaskId}</strong> starts before its predecessor <strong>{d.predecessorTaskId}</strong> finishes — scheduling conflict detected.</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Dependency Dialog */}
      <Dialog open={showAddDep} onOpenChange={setShowAddDep}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Task Dependency</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Predecessor Task (must finish/start first)</Label>
              <Select value={depForm.predecessorTaskId || "none"} onValueChange={(v) => setDepForm({ ...depForm, predecessorTaskId: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select predecessor..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select...</SelectItem>
                  {filteredTasks.map((t) => <SelectItem key={t.id} value={t.taskId}>{t.taskId} — {t.description?.slice(0, 40)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Dependency Type</Label>
              <Select value={depForm.dependencyType} onValueChange={(v) => setDepForm({ ...depForm, dependencyType: v as DepType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Finish-to-Start", "Start-to-Start", "Finish-to-Finish", "Start-to-Finish"] as DepType[]).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Successor Task (depends on predecessor)</Label>
              <Select value={depForm.successorTaskId || "none"} onValueChange={(v) => setDepForm({ ...depForm, successorTaskId: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select successor..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select...</SelectItem>
                  {filteredTasks.filter((t) => t.taskId !== depForm.predecessorTaskId).map((t) => <SelectItem key={t.id} value={t.taskId}>{t.taskId} — {t.description?.slice(0, 40)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Lag Days (0 = no lag)</Label>
              <Input type="number" min={0} value={depForm.lagDays} onChange={(e) => setDepForm({ ...depForm, lagDays: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDep(false)}>Cancel</Button>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => createDepMutation.mutate({ projectId, ...depForm })} disabled={!depForm.predecessorTaskId || !depForm.successorTaskId || createDepMutation.isPending}>
              {createDepMutation.isPending ? "Adding..." : "Add Dependency"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
