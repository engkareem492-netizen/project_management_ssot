import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  MessageSquare,
  Loader2,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Radio,
  Network,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isCommTask(task: any): boolean {
  return (
    !!task.communicationStakeholderId ||
    (task.taskId || "").startsWith("COMM-")
  );
}

function getStatusColor(status: string | null | undefined): string {
  const s = (status || "").toLowerCase();
  if (s === "done" || s === "completed" || s === "closed") return "bg-green-100 text-green-700";
  if (s === "in progress" || s === "in-progress") return "bg-blue-100 text-blue-700";
  if (s === "blocked" || s === "overdue") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-600";
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return d;
  }
}

// ---------------------------------------------------------------------------
// Stakeholder Card
// ---------------------------------------------------------------------------

function StakeholderCard({
  stakeholder,
  commTasks,
}: {
  stakeholder: any;
  commTasks: any[];
}) {
  const [expanded, setExpanded] = useState(false);

  const stTasks = commTasks.filter((t: any) => {
    // Match by responsible name/id OR subject name matching stakeholder
    const byResponsible =
      t.responsibleId === stakeholder.id ||
      t.responsible === stakeholder.fullName;
    const bySubject = t.subject === stakeholder.fullName;
    return byResponsible || bySubject;
  });

  const done = stTasks.filter((t) =>
    ["done", "completed", "closed"].includes((t.status || "").toLowerCase())
  ).length;
  const inProgress = stTasks.filter((t) =>
    ["in progress", "in-progress"].includes((t.status || "").toLowerCase())
  ).length;
  const open = stTasks.filter((t) =>
    !["done", "completed", "closed", "in progress", "in-progress"].includes(
      (t.status || "").toLowerCase()
    )
  ).length;

  const sourceLabels: Record<string, { label: string; color: string }> = {
    comm: { label: "Comm Plan", color: "bg-blue-100 text-blue-700" },
    engagement: { label: "Engagement", color: "bg-purple-100 text-purple-700" },
    stakeholder: { label: "Stakeholder", color: "bg-orange-100 text-orange-700" },
  };

  return (
    <Card className="border hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold text-sm">
              {(stakeholder.fullName || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{stakeholder.fullName}</div>
              {(stakeholder.position || stakeholder.role) && (
                <div className="text-xs text-muted-foreground truncate">
                  {stakeholder.position || stakeholder.role}
                </div>
              )}
              {stakeholder.email && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Mail className="w-3 h-3" />
                  {stakeholder.email}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold">{stTasks.length}</span>
              <span className="text-xs text-muted-foreground">tasks</span>
            </div>
            <div className="flex gap-1">
              {done > 0 && (
                <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5">
                  <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />{done}
                </Badge>
              )}
              {inProgress > 0 && (
                <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5">
                  <Clock className="w-2.5 h-2.5 mr-0.5" />{inProgress}
                </Badge>
              )}
              {open > 0 && (
                <Badge className="bg-gray-100 text-gray-600 text-[10px] px-1.5">
                  <AlertCircle className="w-2.5 h-2.5 mr-0.5" />{open}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {stTasks.length === 0 ? (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground text-center py-3">No communication tasks assigned to this stakeholder</p>
        </CardContent>
      ) : expanded ? (
        <CardContent className="pt-0">
          <div className="border rounded-md overflow-hidden mt-2">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="py-2 px-3">Task ID</TableHead>
                  <TableHead className="py-2 px-3">Description</TableHead>
                  <TableHead className="py-2 px-3">Role</TableHead>
                  <TableHead className="py-2 px-3">Recurring</TableHead>
                  <TableHead className="py-2 px-3">Due</TableHead>
                  <TableHead className="py-2 px-3">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stTasks.map((task: any) => {
                  const isResponsible = task.responsibleId === stakeholder.id || task.responsible === stakeholder.fullName;
                  return (
                    <TableRow key={task.id} className="hover:bg-muted/20">
                      <TableCell className="py-1.5 px-3">
                        <span className="font-mono bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px]">{task.taskId}</span>
                      </TableCell>
                      <TableCell className="py-1.5 px-3 max-w-[200px] truncate">{task.description}</TableCell>
                      <TableCell className="py-1.5 px-3">
                        <Badge variant="outline" className={`text-[10px] ${isResponsible ? "border-blue-300 text-blue-700" : "border-purple-300 text-purple-700"}`}>
                          {isResponsible ? "Responsible" : "Subject"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5 px-3">
                        {task.recurringType && task.recurringType !== "none" ? (
                          <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300">
                            <RefreshCw className="w-2.5 h-2.5 mr-0.5" />{task.recurringType}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="py-1.5 px-3 text-muted-foreground">{formatDate(task.dueDate)}</TableCell>
                      <TableCell className="py-1.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusColor(task.status)}`}>
                          {task.status || "Open"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <button
            className="w-full text-xs text-muted-foreground py-2 flex items-center justify-center gap-1 hover:text-foreground transition-colors"
            onClick={() => setExpanded(false)}
          >
            <ChevronUp className="w-3 h-3" /> Collapse
          </button>
        </CardContent>
      ) : (
        <CardContent className="pt-0">
          <button
            className="w-full text-xs text-muted-foreground py-2 flex items-center justify-center gap-1 hover:text-foreground transition-colors"
            onClick={() => setExpanded(true)}
          >
            <ChevronDown className="w-3 h-3" /> Show {stTasks.length} task{stTasks.length !== 1 ? "s" : ""}
          </button>
        </CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function StakeholderManagement() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!projectId;

  const { data: allTasks = [], isLoading: tasksLoading } = trpc.tasks.list.useQuery(
    { projectId },
    { enabled }
  );
  const { data: stakeholders = [], isLoading: stLoading } = trpc.stakeholders.list.useQuery(
    { projectId },
    { enabled }
  );

  const isLoading = tasksLoading || stLoading;

  // All communication tasks
  const commTasks = useMemo(
    () => (allTasks as any[]).filter(isCommTask),
    [allTasks]
  );

  // Filters for task list
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [recurringFilter, setRecurringFilter] = useState("all");

  const filteredTasks = useMemo(() => {
    let out = commTasks;
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (t: any) =>
          (t.description || "").toLowerCase().includes(q) ||
          (t.taskId || "").toLowerCase().includes(q) ||
          (t.responsible || "").toLowerCase().includes(q) ||
          (t.subject || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      out = out.filter((t: any) => (t.status || "Open") === statusFilter);
    }
    if (recurringFilter !== "all") {
      if (recurringFilter === "none") {
        out = out.filter((t: any) => !t.recurringType || t.recurringType === "none");
      } else {
        out = out.filter((t: any) => t.recurringType === recurringFilter);
      }
    }
    return out;
  }, [commTasks, search, statusFilter, recurringFilter]);

  // Stakeholder search for cards tab
  const [stSearch, setStSearch] = useState("");
  const filteredStakeholders = useMemo(() => {
    if (!stSearch.trim()) return stakeholders as any[];
    const q = stSearch.toLowerCase();
    return (stakeholders as any[]).filter(
      (s: any) =>
        (s.fullName || "").toLowerCase().includes(q) ||
        (s.position || "").toLowerCase().includes(q) ||
        (s.role || "").toLowerCase().includes(q)
    );
  }, [stakeholders, stSearch]);

  // Summary stats
  const totalComm = commTasks.length;
  const doneComm = commTasks.filter((t: any) =>
    ["done", "completed", "closed"].includes((t.status || "").toLowerCase())
  ).length;
  const recurringComm = commTasks.filter(
    (t: any) => t.recurringType && t.recurringType !== "none"
  ).length;

  // Unique statuses
  const allStatuses = Array.from(
    new Set(commTasks.map((t: any) => t.status || "Open"))
  );

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No project selected
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Stakeholder Management</h1>
          <p className="text-sm text-muted-foreground">
            Communication &amp; engagement tasks generated from plans — excluded from project status and per-responsible reports
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold">{totalComm}</div>
            <div className="text-xs text-muted-foreground mt-1">Total COMM Tasks</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-green-600">{doneComm}</div>
            <div className="text-xs text-muted-foreground mt-1">Completed</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-orange-600">{recurringComm}</div>
            <div className="text-xs text-muted-foreground mt-1">Recurring</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-primary">{(stakeholders as any[]).length}</div>
            <div className="text-xs text-muted-foreground mt-1">Stakeholders</div>
          </CardContent>
        </Card>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks" className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Communication Tasks
            {commTasks.length > 0 && (
              <span className="ml-1 bg-orange-100 text-orange-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                {commTasks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="stakeholders" className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            By Stakeholder
            {(stakeholders as any[]).length > 0 && (
              <span className="ml-1 bg-primary/10 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                {(stakeholders as any[]).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Communication Tasks Tab ─────────────────────────────────── */}
        <TabsContent value="tasks" className="mt-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-orange-600" />
                  Communication Tasks
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks..."
                      className="pl-8 h-7 text-xs w-48"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32 h-7 text-xs">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {allStatuses.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={recurringFilter} onValueChange={setRecurringFilter}>
                    <SelectTrigger className="w-32 h-7 text-xs">
                      <SelectValue placeholder="Recurring" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="none">One-time</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Source legend */}
              <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-blue-600" />
                  <span>From Communication Plan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Network className="w-3 h-3 text-purple-600" />
                  <span>From Engagement Plan</span>
                </div>
                <div className="text-muted-foreground/60 italic">
                  These tasks are excluded from project status reports and per-responsible workload reports.
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">
                    {commTasks.length === 0
                      ? "No communication tasks yet"
                      : "No tasks match the current filters"}
                  </p>
                  <p className="text-sm mt-1 text-muted-foreground/70">
                    {commTasks.length === 0
                      ? "Tasks are generated automatically from the Communication Plan and Engagement Plan"
                      : "Try adjusting your search or filters"}
                  </p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-orange-50/50">
                        <TableHead className="text-orange-700 font-semibold">Task ID</TableHead>
                        <TableHead className="text-orange-700 font-semibold">Description</TableHead>
                        <TableHead className="text-orange-700 font-semibold">Subject</TableHead>
                        <TableHead className="text-orange-700 font-semibold">Responsible</TableHead>
                        <TableHead className="text-orange-700 font-semibold">Recurring</TableHead>
                        <TableHead className="text-orange-700 font-semibold">Due Date</TableHead>
                        <TableHead className="text-orange-700 font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task: any) => (
                        <TableRow key={task.id} className="hover:bg-orange-50/30">
                          <TableCell>
                            <span className="font-mono text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                              {task.taskId}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate text-sm">{task.description}</div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {task.subject || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {task.responsible || "—"}
                          </TableCell>
                          <TableCell>
                            {task.recurringType && task.recurringType !== "none" ? (
                              <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                                <RefreshCw className="w-3 h-3 mr-1" />
                                {task.recurringType}
                                {task.recurringInterval && task.recurringInterval > 1
                                  ? ` ×${task.recurringInterval}`
                                  : ""}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">One-time</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(task.dueDate)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                            >
                              {task.status || "Open"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── By Stakeholder Tab ──────────────────────────────────────── */}
        <TabsContent value="stakeholders" className="mt-0">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search stakeholders..."
                  className="pl-8 h-8 text-sm"
                  value={stSearch}
                  onChange={(e) => setStSearch(e.target.value)}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Click a card to see their communication &amp; engagement tasks
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredStakeholders.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No stakeholders found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStakeholders.map((s: any) => (
                  <StakeholderCard key={s.id} stakeholder={s} commTasks={commTasks} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
