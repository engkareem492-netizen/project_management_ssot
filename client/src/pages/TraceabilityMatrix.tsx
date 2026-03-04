import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Network, ChevronDown, ChevronRight, Search, CheckCircle2, XCircle, AlertCircle,
  Clock, FileText, Bug, FlaskConical, GitPullRequest, BookOpen, Plus, Link2, Unlink
} from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  "Done": "bg-green-100 text-green-800",
  "Completed": "bg-green-100 text-green-800",
  "Passed": "bg-green-100 text-green-800",
  "Approved": "bg-green-100 text-green-800",
  "Closed": "bg-gray-100 text-gray-600",
  "In Progress": "bg-blue-100 text-blue-800",
  "Under Review": "bg-blue-100 text-blue-800",
  "Open": "bg-amber-100 text-amber-800",
  "Submitted": "bg-amber-100 text-amber-800",
  "Failed": "bg-red-100 text-red-800",
  "Rejected": "bg-red-100 text-red-800",
};

function StatusBadge({ status }: { status: string | null | undefined }) {
  const cls = STATUS_BADGE[status ?? ""] ?? "bg-gray-100 text-gray-600";
  return <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{status ?? "—"}</span>;
}

function CountBadge({ count, label, icon, color }: { count: number; label: string; icon: React.ReactNode; color: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm ${color}`}>
      {icon}
      <span className="font-semibold">{count}</span>
      <span className="text-xs opacity-80">{label}</span>
    </div>
  );
}

type ActionType = "createTask" | "assignTask" | "createIssue" | "assignIssue" | "createTestCase" | "assignTestCase" | null;

export default function TraceabilityMatrix() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Dialog state
  const [actionType, setActionType] = useState<ActionType>(null);
  const [targetRequirementId, setTargetRequirementId] = useState<string>("");

  // Create Task form
  const [newTaskForm, setNewTaskForm] = useState({ description: "", responsible: "", priority: "Medium", dueDate: "" });
  // Create Issue form
  const [newIssueForm, setNewIssueForm] = useState({ description: "", owner: "", priority: "Medium", type: "Bug" });
  // Create Test Case form
  const [newTestCaseForm, setNewTestCaseForm] = useState({ title: "", tester: "", priority: "Medium", testType: "UAT" });
  // Assign existing
  const [assignId, setAssignId] = useState<string>("");

  const utils = trpc.useUtils();

  const { data: matrix = [], isLoading } = trpc.traceability.matrix.useQuery({ projectId }, { enabled: !!projectId });
  const { data: allTasks = [] } = trpc.tasks.list.useQuery({ projectId }, { enabled: !!projectId });
  const { data: allIssues = [] } = trpc.issues.list.useQuery({ projectId }, { enabled: !!projectId });
  const { data: allTestCases = [] } = trpc.testCases.list.useQuery({ projectId }, { enabled: !!projectId });

  // Mutations
  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => { utils.traceability.matrix.invalidate(); toast.success("Task created and linked"); closeDialog(); },
    onError: (e) => toast.error(e.message),
  });
  const linkTaskMutation = trpc.tasks.linkToRequirement.useMutation({
    onSuccess: () => { utils.traceability.matrix.invalidate(); toast.success("Task linked to requirement"); closeDialog(); },
    onError: (e) => toast.error(e.message),
  });
  const createIssueMutation = trpc.issues.create.useMutation({
    onSuccess: () => { utils.traceability.matrix.invalidate(); toast.success("Issue created and linked"); closeDialog(); },
    onError: (e) => toast.error(e.message),
  });
  const linkIssueMutation = trpc.issues.linkToRequirement.useMutation({
    onSuccess: () => { utils.traceability.matrix.invalidate(); toast.success("Issue linked to requirement"); closeDialog(); },
    onError: (e) => toast.error(e.message),
  });
  const createTestCaseMutation = trpc.testCases.create.useMutation({
    onSuccess: () => { utils.traceability.matrix.invalidate(); toast.success("Test case created and linked"); closeDialog(); },
    onError: (e) => toast.error(e.message),
  });
  const linkTestCaseMutation = trpc.testCases.linkToRequirement.useMutation({
    onSuccess: () => { utils.traceability.matrix.invalidate(); toast.success("Test case linked to requirement"); closeDialog(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = matrix.filter((row) =>
    !search ||
    row.requirement.idCode?.toLowerCase().includes(search.toLowerCase()) ||
    row.requirement.description?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(filtered.map((r) => r.requirement.idCode ?? "")));
  const collapseAll = () => setExpanded(new Set());

  const openAction = (type: ActionType, reqId: string) => {
    setActionType(type);
    setTargetRequirementId(reqId);
    setAssignId("");
    setNewTaskForm({ description: "", responsible: "", priority: "Medium", dueDate: "" });
    setNewIssueForm({ description: "", owner: "", priority: "Medium", type: "Bug" });
    setNewTestCaseForm({ title: "", tester: "", priority: "Medium", testType: "UAT" });
  };

  const closeDialog = () => { setActionType(null); setTargetRequirementId(""); };

  const handleSubmit = () => {
    if (!targetRequirementId) return;
    if (actionType === "createTask") {
      if (!newTaskForm.description) { toast.error("Description required"); return; }
      createTaskMutation.mutate({ projectId, requirementId: targetRequirementId, ...newTaskForm });
    } else if (actionType === "assignTask") {
      if (!assignId) { toast.error("Select a task"); return; }
      linkTaskMutation.mutate({ id: parseInt(assignId), requirementId: targetRequirementId });
    } else if (actionType === "createIssue") {
      if (!newIssueForm.description) { toast.error("Description required"); return; }
      createIssueMutation.mutate({ projectId, requirementId: targetRequirementId, ...newIssueForm });
    } else if (actionType === "assignIssue") {
      if (!assignId) { toast.error("Select an issue"); return; }
      linkIssueMutation.mutate({ id: parseInt(assignId), requirementId: targetRequirementId });
    } else if (actionType === "createTestCase") {
      if (!newTestCaseForm.title) { toast.error("Title required"); return; }
      createTestCaseMutation.mutate({ projectId, requirementId: targetRequirementId, ...newTestCaseForm });
    } else if (actionType === "assignTestCase") {
      if (!assignId) { toast.error("Select a test case"); return; }
      linkTestCaseMutation.mutate({ id: parseInt(assignId), requirementId: targetRequirementId });
    }
  };

  const isMutating = createTaskMutation.isPending || linkTaskMutation.isPending ||
    createIssueMutation.isPending || linkIssueMutation.isPending ||
    createTestCaseMutation.isPending || linkTestCaseMutation.isPending;

  // Summary stats
  const totalReqs = matrix.length;
  const coveredReqs = matrix.filter((r) => r.summary.testTotal > 0).length;
  const totalTests = matrix.reduce((s, r) => s + r.summary.testTotal, 0);
  const passedTests = matrix.reduce((s, r) => s + r.summary.testPassed, 0);
  const openIssues = matrix.reduce((s, r) => s + r.summary.openIssues, 0);
  const openTasks = matrix.reduce((s, r) => s + r.summary.openTasks, 0);

  // Unlinked items for assign dialogs
  const unlinkedTasks = useMemo(() => allTasks.filter((t) => !t.requirementId), [allTasks]);
  const unlinkedIssues = useMemo(() => allIssues.filter((i) => !i.requirementId), [allIssues]);
  const unlinkedTestCases = useMemo(() => allTestCases.filter((tc) => !tc.requirementId), [allTestCases]);

  const dialogTitle: Record<NonNullable<ActionType>, string> = {
    createTask: "Create New Task",
    assignTask: "Assign Existing Task",
    createIssue: "Create New Issue",
    assignIssue: "Assign Existing Issue",
    createTestCase: "Create New Test Case",
    assignTestCase: "Assign Existing Test Case",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Network className="w-6 h-6 text-gray-500" />
              Traceability Matrix
            </h1>
            <p className="text-gray-500 text-sm mt-1">End-to-end traceability from Requirements → Tasks → Issues → Test Cases → Change Requests → Decisions</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CountBadge count={totalReqs} label="Requirements" icon={<BookOpen className="w-4 h-4" />} color="bg-teal-50 border-teal-200 text-teal-700" />
            <CountBadge count={coveredReqs} label="With Tests" icon={<FlaskConical className="w-4 h-4" />} color="bg-blue-50 border-blue-200 text-blue-700" />
            <CountBadge count={openIssues} label="Open Issues" icon={<Bug className="w-4 h-4" />} color="bg-amber-50 border-amber-200 text-amber-700" />
            <CountBadge count={openTasks} label="Open Tasks" icon={<Clock className="w-4 h-4" />} color="bg-purple-50 border-purple-200 text-purple-700" />
          </div>
        </div>

        {totalTests > 0 && (
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-teal-700 font-medium">Overall Test Coverage:</span>
            <div className="flex-1 max-w-xs">
              <Progress value={totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0} className="h-2" />
            </div>
            <span className="text-sm font-semibold text-teal-800">{totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}% Passed ({passedTests}/{totalTests})</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search requirements..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={expandAll}>Expand All</Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>Collapse All</Button>
      </div>

      {/* Matrix Rows */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading traceability data...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Network className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No requirements found. Add requirements to build the traceability matrix.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const reqId = row.requirement.idCode ?? String(row.requirement.id);
            const isOpen = expanded.has(reqId);
            const { summary } = row;

            return (
              <Collapsible key={reqId} open={isOpen} onOpenChange={() => toggleExpand(reqId)}>
                <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                  {/* Requirement header */}
                  <CollapsibleTrigger asChild>
                    <div className="flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="mt-0.5 text-teal-600">
                        {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-teal-700 text-sm">{reqId}</span>
                          <StatusBadge status={row.requirement.status} />
                          {row.requirement.priority && <Badge variant="outline" className="text-xs">{row.requirement.priority}</Badge>}
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{row.requirement.description ?? "—"}</p>
                      </div>
                      {/* Summary chips */}
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <div className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded">
                          <Clock className="w-3 h-3" />{summary.taskCount} tasks ({summary.openTasks} open)
                        </div>
                        <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                          <Bug className="w-3 h-3" />{summary.issueCount} issues ({summary.openIssues} open)
                        </div>
                        <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                          <FlaskConical className="w-3 h-3" />{summary.testTotal} tests
                          {summary.testTotal > 0 && <span className="ml-1 font-semibold">{summary.testCoverage}%✓</span>}
                        </div>
                        {summary.crCount > 0 && (
                          <div className="flex items-center gap-1 text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
                            <GitPullRequest className="w-3 h-3" />{summary.crCount} CRs
                          </div>
                        )}
                        {summary.decisionCount > 0 && (
                          <div className="flex items-center gap-1 text-xs text-teal-700 bg-teal-50 px-2 py-1 rounded">
                            <FileText className="w-3 h-3" />{summary.decisionCount} decisions
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* Expanded detail */}
                  <CollapsibleContent>
                    <div className="border-t grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x">
                      {/* Tasks */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wide flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Tasks ({row.tasks.length})
                          </h4>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-purple-600 hover:bg-purple-50"
                              onClick={(e) => { e.stopPropagation(); openAction("createTask", reqId); }}>
                              <Plus className="w-3 h-3 mr-1" />New
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-purple-600 hover:bg-purple-50"
                              onClick={(e) => { e.stopPropagation(); openAction("assignTask", reqId); }}>
                              <Link2 className="w-3 h-3 mr-1" />Assign
                            </Button>
                          </div>
                        </div>
                        {row.tasks.length === 0 ? <p className="text-xs text-muted-foreground italic">No linked tasks</p> : (
                          <div className="space-y-2">
                            {row.tasks.map((t, idx) => (
                              <div key={`task-${t.taskId}-${idx}`} className="flex items-start gap-2">
                                <span className="font-mono text-xs text-purple-600 shrink-0">{t.taskId}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-600 truncate">{t.description?.slice(0, 50)}</p>
                                  <StatusBadge status={t.status} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Issues */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
                            <Bug className="w-3.5 h-3.5" /> Issues ({row.issues.length})
                          </h4>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-amber-600 hover:bg-amber-50"
                              onClick={(e) => { e.stopPropagation(); openAction("createIssue", reqId); }}>
                              <Plus className="w-3 h-3 mr-1" />New
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-amber-600 hover:bg-amber-50"
                              onClick={(e) => { e.stopPropagation(); openAction("assignIssue", reqId); }}>
                              <Link2 className="w-3 h-3 mr-1" />Assign
                            </Button>
                          </div>
                        </div>
                        {row.issues.length === 0 ? <p className="text-xs text-muted-foreground italic">No linked issues</p> : (
                          <div className="space-y-2">
                            {row.issues.map((i, idx) => (
                              <div key={`issue-${i.issueId}-${idx}`} className="flex items-start gap-2">
                                <span className="font-mono text-xs text-amber-600 shrink-0">{i.issueId}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-600 truncate">{i.description?.slice(0, 50)}</p>
                                  <StatusBadge status={i.status} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Test Cases */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5" /> Test Cases ({row.testCases.length})
                          </h4>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50"
                              onClick={(e) => { e.stopPropagation(); openAction("createTestCase", reqId); }}>
                              <Plus className="w-3 h-3 mr-1" />New
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50"
                              onClick={(e) => { e.stopPropagation(); openAction("assignTestCase", reqId); }}>
                              <Link2 className="w-3 h-3 mr-1" />Assign
                            </Button>
                          </div>
                        </div>
                        {row.testCases.length === 0 ? <p className="text-xs text-muted-foreground italic">No test cases linked</p> : (
                          <div className="space-y-2">
                            {row.testCases.map((tc, idx) => (
                              <div key={`tc-${tc.testId}-${idx}`} className="flex items-start gap-2">
                                {tc.status === "Passed" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" /> :
                                  tc.status === "Failed" ? <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" /> :
                                  <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />}
                                <div className="flex-1 min-w-0">
                                  <span className="font-mono text-xs text-blue-600">{tc.testId}</span>
                                  <p className="text-xs text-gray-600 truncate">{tc.title?.slice(0, 45)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {row.testCases.length > 0 && (
                          <div className="mt-3">
                            <Progress value={summary.testCoverage} className="h-1.5" />
                            <p className="text-xs text-muted-foreground mt-1">{summary.testCoverage}% pass rate ({summary.testPassed}/{summary.testTotal})</p>
                          </div>
                        )}
                      </div>

                      {/* CRs and Decisions */}
                      {(row.changeRequests.length > 0 || row.decisions.length > 0) && (
                        <div className="p-4 md:col-span-3 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {row.changeRequests.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                  <GitPullRequest className="w-3.5 h-3.5" /> Change Requests ({row.changeRequests.length})
                                </h4>
                                <div className="space-y-1.5">
                                  {row.changeRequests.map((cr, idx) => (
                                    <div key={`cr-${cr.crId}-${idx}`} className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-orange-600">{cr.crId}</span>
                                      <p className="text-xs text-gray-600 truncate flex-1">{cr.title?.slice(0, 50)}</p>
                                      <StatusBadge status={cr.status} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {row.decisions.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5" /> Decisions ({row.decisions.length})
                                </h4>
                                <div className="space-y-1.5">
                                  {row.decisions.map((d, idx) => (
                                    <div key={`dec-${d.decisionId}-${idx}`} className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-teal-600">{d.decisionId}</span>
                                      <p className="text-xs text-gray-600 truncate flex-1">{d.title?.slice(0, 50)}</p>
                                      <StatusBadge status={d.status} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType?.startsWith("create") ? <Plus className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              {actionType ? dialogTitle[actionType] : ""}
            </DialogTitle>
            {targetRequirementId && (
              <p className="text-sm text-muted-foreground">Requirement: <span className="font-mono font-semibold text-teal-700">{targetRequirementId}</span></p>
            )}
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Create Task */}
            {actionType === "createTask" && (
              <>
                <div className="space-y-1">
                  <Label>Description *</Label>
                  <Textarea value={newTaskForm.description} onChange={(e) => setNewTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="Task description..." rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Responsible</Label>
                    <Input value={newTaskForm.responsible} onChange={(e) => setNewTaskForm(f => ({ ...f, responsible: e.target.value }))} placeholder="Name" />
                  </div>
                  <div className="space-y-1">
                    <Label>Priority</Label>
                    <Select value={newTaskForm.priority} onValueChange={(v) => setNewTaskForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Low", "Medium", "High", "Critical"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Due Date</Label>
                  <Input type="date" value={newTaskForm.dueDate} onChange={(e) => setNewTaskForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </>
            )}

            {/* Assign Task */}
            {actionType === "assignTask" && (
              <div className="space-y-1">
                <Label>Select Task</Label>
                <Select value={assignId} onValueChange={setAssignId}>
                  <SelectTrigger><SelectValue placeholder="Choose an unlinked task..." /></SelectTrigger>
                  <SelectContent>
                    {unlinkedTasks.length === 0
                      ? <SelectItem value="__none__" disabled>No unlinked tasks available</SelectItem>
                      : unlinkedTasks.map(t => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            <span className="font-mono text-xs mr-2 text-purple-600">{t.taskId}</span>
                            {t.description?.slice(0, 50)}
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Only tasks not yet linked to any requirement are shown.</p>
              </div>
            )}

            {/* Create Issue */}
            {actionType === "createIssue" && (
              <>
                <div className="space-y-1">
                  <Label>Description *</Label>
                  <Textarea value={newIssueForm.description} onChange={(e) => setNewIssueForm(f => ({ ...f, description: e.target.value }))} placeholder="Issue description..." rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Owner</Label>
                    <Input value={newIssueForm.owner} onChange={(e) => setNewIssueForm(f => ({ ...f, owner: e.target.value }))} placeholder="Name" />
                  </div>
                  <div className="space-y-1">
                    <Label>Priority</Label>
                    <Select value={newIssueForm.priority} onValueChange={(v) => setNewIssueForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Low", "Medium", "High", "Critical"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={newIssueForm.type} onValueChange={(v) => setNewIssueForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Bug", "Risk", "Blocker", "Question", "Enhancement", "Other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Assign Issue */}
            {actionType === "assignIssue" && (
              <div className="space-y-1">
                <Label>Select Issue</Label>
                <Select value={assignId} onValueChange={setAssignId}>
                  <SelectTrigger><SelectValue placeholder="Choose an unlinked issue..." /></SelectTrigger>
                  <SelectContent>
                    {unlinkedIssues.length === 0
                      ? <SelectItem value="__none__" disabled>No unlinked issues available</SelectItem>
                      : unlinkedIssues.map(i => (
                          <SelectItem key={i.id} value={String(i.id)}>
                            <span className="font-mono text-xs mr-2 text-amber-600">{i.issueId}</span>
                            {i.description?.slice(0, 50)}
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Only issues not yet linked to any requirement are shown.</p>
              </div>
            )}

            {/* Create Test Case */}
            {actionType === "createTestCase" && (
              <>
                <div className="space-y-1">
                  <Label>Title *</Label>
                  <Input value={newTestCaseForm.title} onChange={(e) => setNewTestCaseForm(f => ({ ...f, title: e.target.value }))} placeholder="Test case title..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Tester</Label>
                    <Input value={newTestCaseForm.tester} onChange={(e) => setNewTestCaseForm(f => ({ ...f, tester: e.target.value }))} placeholder="Name" />
                  </div>
                  <div className="space-y-1">
                    <Label>Priority</Label>
                    <Select value={newTestCaseForm.priority} onValueChange={(v) => setNewTestCaseForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Low", "Medium", "High", "Critical"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Test Type</Label>
                  <Select value={newTestCaseForm.testType} onValueChange={(v) => setNewTestCaseForm(f => ({ ...f, testType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Unit", "Integration", "UAT", "Regression", "Smoke", "Performance"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Assign Test Case */}
            {actionType === "assignTestCase" && (
              <div className="space-y-1">
                <Label>Select Test Case</Label>
                <Select value={assignId} onValueChange={setAssignId}>
                  <SelectTrigger><SelectValue placeholder="Choose an unlinked test case..." /></SelectTrigger>
                  <SelectContent>
                    {unlinkedTestCases.length === 0
                      ? <SelectItem value="__none__" disabled>No unlinked test cases available</SelectItem>
                      : unlinkedTestCases.map(tc => (
                          <SelectItem key={tc.id} value={String(tc.id)}>
                            <span className="font-mono text-xs mr-2 text-blue-600">{tc.testId}</span>
                            {tc.title?.slice(0, 50)}
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Only test cases not yet linked to any requirement are shown.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isMutating}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isMutating}>
              {isMutating ? "Saving..." : actionType?.startsWith("create") ? "Create & Link" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
