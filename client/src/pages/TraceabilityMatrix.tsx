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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Network, ChevronDown, ChevronRight, Search, CheckCircle2, XCircle, AlertCircle,
  Clock, FileText, Bug, FlaskConical, GitPullRequest, BookOpen, Plus, Link2, Trash2
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

interface TestStep { step: string; expectedResult: string; }

const emptyTaskForm = {
  taskGroup: "", description: "", responsibleId: undefined as number | undefined,
  accountableId: undefined as number | undefined, consultedId: undefined as number | undefined,
  informedId: undefined as number | undefined, ownerId: undefined as number | undefined,
  status: "Not Started", priority: "Medium", issueId: "", dueDate: "",
  assignDate: new Date().toISOString().split("T")[0], deliverableId: undefined as number | undefined,
};

const emptyIssueForm = {
  issueGroup: "", description: "", source: "", owner: "", status: "Open", priority: "Medium",
  type: "", class: "", deliverableId: undefined as number | undefined, taskId: "",
  openDate: new Date().toISOString().split("T")[0], knowledgeBaseCode: "", resolutionDate: "",
};

const emptyTestCaseForm = {
  title: "", description: "", preconditions: "",
  testSteps: [{ step: "", expectedResult: "" }] as TestStep[],
  expectedResult: "", tester: "", priority: "Medium", status: "Not Executed",
  testType: "Functional", executionDate: "", defectId: "", notes: "",
};

export default function TraceabilityMatrix() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Dialog state
  const [actionType, setActionType] = useState<ActionType>(null);
  const [targetRequirementId, setTargetRequirementId] = useState<string>("");

  // Full forms
  const [newTaskForm, setNewTaskForm] = useState({ ...emptyTaskForm });
  const [newIssueForm, setNewIssueForm] = useState({ ...emptyIssueForm });
  const [newTestCaseForm, setNewTestCaseForm] = useState({ ...emptyTestCaseForm });
  const [assignId, setAssignId] = useState<string>("");

  const utils = trpc.useUtils();

  // Data queries
  const { data: matrix = [], isLoading } = trpc.traceability.matrix.useQuery({ projectId }, { enabled: !!projectId });
  const { data: allTasks = [] } = trpc.tasks.list.useQuery({ projectId }, { enabled: !!projectId });
  const { data: allIssues = [] } = trpc.issues.list.useQuery({ projectId }, { enabled: !!projectId });
  const { data: allTestCases = [] } = trpc.testCases.list.useQuery({ projectId }, { enabled: !!projectId });
  const { data: stakeholders = [] } = trpc.stakeholders.list.useQuery({ projectId }, { enabled: !!projectId });
  const { data: taskGroups = [] } = trpc.dropdownOptions.taskGroups.getAll.useQuery({ projectId }, { enabled: !!projectId });
  const { data: issueGroups = [] } = trpc.dropdownOptions.issueGroups.getAll.useQuery({ projectId }, { enabled: !!projectId });
  const { data: deliverables = [] } = trpc.deliverables.list.useQuery({ projectId }, { enabled: !!projectId });
  const { data: statusOptions = [] } = trpc.dropdownOptions.status.getAll.useQuery();
  const { data: priorityOptions = [] } = trpc.dropdownOptions.priority.getAll.useQuery();

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
    setNewTaskForm({ ...emptyTaskForm, assignDate: new Date().toISOString().split("T")[0] });
    setNewIssueForm({ ...emptyIssueForm, openDate: new Date().toISOString().split("T")[0] });
    setNewTestCaseForm({ ...emptyTestCaseForm, testSteps: [{ step: "", expectedResult: "" }] });
  };

  const closeDialog = () => { setActionType(null); setTargetRequirementId(""); };

  const handleSubmit = () => {
    if (!targetRequirementId) return;
    if (actionType === "createTask") {
      if (!newTaskForm.description.trim()) { toast.error("Description is required"); return; }
      createTaskMutation.mutate({
        projectId,
        requirementId: targetRequirementId,
        description: newTaskForm.description,
        taskGroup: newTaskForm.taskGroup || undefined,
        responsibleId: newTaskForm.responsibleId,
        accountableId: newTaskForm.accountableId,
        consultedId: newTaskForm.consultedId,
        informedId: newTaskForm.informedId,
        ownerId: newTaskForm.ownerId,
        status: newTaskForm.status,
        priority: newTaskForm.priority,
        dependencyId: newTaskForm.issueId || undefined,
        dueDate: newTaskForm.dueDate || undefined,
        assignDate: newTaskForm.assignDate || undefined,
        deliverableId: newTaskForm.deliverableId,
      });
    } else if (actionType === "assignTask") {
      if (!assignId) { toast.error("Select a task"); return; }
      linkTaskMutation.mutate({ id: parseInt(assignId), requirementId: targetRequirementId });
    } else if (actionType === "createIssue") {
      if (!newIssueForm.description.trim()) { toast.error("Description is required"); return; }
        createIssueMutation.mutate({
        projectId,
        requirementId: targetRequirementId,
        description: newIssueForm.description,
        issueGroup: newIssueForm.issueGroup || undefined,
        owner: newIssueForm.owner || undefined,
        status: newIssueForm.status,
        priority: newIssueForm.priority,
        type: newIssueForm.type || undefined,
        class: newIssueForm.class || undefined,
        deliverableId: newIssueForm.deliverableId,
        taskId: newIssueForm.taskId || undefined,
        openDate: newIssueForm.openDate || undefined,
        resolutionDate: newIssueForm.resolutionDate || undefined,
      });
    } else if (actionType === "assignIssue") {
      if (!assignId) { toast.error("Select an issue"); return; }
      linkIssueMutation.mutate({ id: parseInt(assignId), requirementId: targetRequirementId });
    } else if (actionType === "createTestCase") {
      if (!newTestCaseForm.title.trim()) { toast.error("Title is required"); return; }
      createTestCaseMutation.mutate({
        projectId,
        requirementId: targetRequirementId,
        title: newTestCaseForm.title,
        description: newTestCaseForm.description || undefined,
        preconditions: newTestCaseForm.preconditions || undefined,
        testSteps: newTestCaseForm.testSteps.filter(s => s.step.trim()),
        expectedResult: newTestCaseForm.expectedResult || undefined,
        tester: newTestCaseForm.tester || undefined,
        priority: newTestCaseForm.priority,
        status: newTestCaseForm.status as any,
        testType: newTestCaseForm.testType || undefined,
        executionDate: newTestCaseForm.executionDate || undefined,
        defectId: newTestCaseForm.defectId || undefined,
        notes: newTestCaseForm.notes || undefined,
      });
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

  // Filtered dropdown options (no empty values)
  const validTaskGroups = taskGroups.filter(g => g.name?.trim());
  const validIssueGroups = issueGroups.filter(g => g.name?.trim());
  const validStakeholders = stakeholders.filter(s => s.fullName?.trim());
  const validDeliverables = deliverables.filter(d => d.description?.trim());
  const validStatusOptions = statusOptions.filter(s => s.value?.trim());
  const validPriorityOptions = priorityOptions.filter(p => p.value?.trim());
  const validTasks = allTasks.filter(t => t.taskId?.trim());
  const validIssues = allIssues.filter(i => i.issueId?.trim());

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
            <p className="text-gray-500 text-sm mt-1">End-to-end traceability from Requirements → Tasks → Issues → Test Cases</p>
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

      {/* Search & Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search requirements..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" onClick={expandAll}>Expand All</Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>Collapse All</Button>
      </div>

      {/* Matrix Rows */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading traceability matrix...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No requirements found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row, rowIdx) => {
            const reqKey = row.requirement.idCode ?? String(row.requirement.id ?? rowIdx);
            const isOpen = expanded.has(reqKey);
            const { summary } = row;
            return (
              <Collapsible key={`req-${reqKey}-${rowIdx}`} open={isOpen} onOpenChange={() => toggleExpand(reqKey)}>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                      <span className="mt-0.5 text-gray-400">{isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold text-teal-700">{row.requirement.idCode ?? "—"}</span>
                          <StatusBadge status={row.requirement.status} />
                          {row.requirement.priority && <Badge variant="outline" className="text-xs">{row.requirement.priority}</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{row.requirement.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-4 shrink-0">
                        <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">
                          <Clock className="w-3 h-3" /> {summary.taskCount} tasks ({summary.openTasks} open)
                        </span>
                        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                          <Bug className="w-3 h-3" /> {summary.issueCount} issues ({summary.openIssues} open)
                        </span>
                        <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                          <FlaskConical className="w-3 h-3" /> {summary.testTotal} tests
                        </span>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
                      {/* Tasks Panel */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide flex items-center gap-1">
                            <Clock className="w-3 h-3" /> TASKS ({row.tasks.length})
                          </span>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-purple-600 hover:bg-purple-50"
                              onClick={() => openAction("createTask", row.requirement.idCode ?? "")}>
                              <Plus className="w-3 h-3 mr-1" /> New
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-purple-600 hover:bg-purple-50"
                              onClick={() => openAction("assignTask", row.requirement.idCode ?? "")}>
                              <Link2 className="w-3 h-3 mr-1" /> Assign
                            </Button>
                          </div>
                        </div>
                        {row.tasks.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No linked tasks</p>
                        ) : (
                          <div className="space-y-2">
                            {row.tasks.map((t, tIdx) => (
                              <div key={`task-${reqKey}-${t.taskId ?? tIdx}`} className="flex items-start gap-2 p-2 bg-purple-50 rounded-lg">
                                <span className="font-mono text-xs text-purple-600 shrink-0">{t.taskId}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-700 line-clamp-1">{t.description}</p>
                                  <StatusBadge status={t.status} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Issues Panel */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1">
                            <Bug className="w-3 h-3" /> ISSUES ({row.issues.length})
                          </span>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-amber-600 hover:bg-amber-50"
                              onClick={() => openAction("createIssue", row.requirement.idCode ?? "")}>
                              <Plus className="w-3 h-3 mr-1" /> New
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-amber-600 hover:bg-amber-50"
                              onClick={() => openAction("assignIssue", row.requirement.idCode ?? "")}>
                              <Link2 className="w-3 h-3 mr-1" /> Assign
                            </Button>
                          </div>
                        </div>
                        {row.issues.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No linked issues</p>
                        ) : (
                          <div className="space-y-2">
                            {row.issues.map((i, iIdx) => (
                              <div key={`issue-${reqKey}-${i.issueId ?? iIdx}`} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg">
                                <span className="font-mono text-xs text-amber-600 shrink-0">{i.issueId}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-700 line-clamp-1">{i.description}</p>
                                  <StatusBadge status={i.status} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Test Cases Panel */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1">
                            <FlaskConical className="w-3 h-3" /> TEST CASES ({row.testCases.length})
                          </span>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50"
                              onClick={() => openAction("createTestCase", row.requirement.idCode ?? "")}>
                              <Plus className="w-3 h-3 mr-1" /> New
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50"
                              onClick={() => openAction("assignTestCase", row.requirement.idCode ?? "")}>
                              <Link2 className="w-3 h-3 mr-1" /> Assign
                            </Button>
                          </div>
                        </div>
                        {row.testCases.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No test cases linked</p>
                        ) : (
                          <div className="space-y-2">
                            {row.testCases.map((tc, tcIdx) => (
                              <div key={`tc-${reqKey}-${tc.testId ?? tcIdx}`} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                                <span className="font-mono text-xs text-blue-600 shrink-0">{tc.testId}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-700 line-clamp-1">{tc.title}</p>
                                  <StatusBadge status={tc.status} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{actionType ? dialogTitle[actionType] : ""}</DialogTitle>
            {targetRequirementId && (
              <p className="text-sm text-muted-foreground">Linked to requirement: <span className="font-mono font-semibold text-teal-700">{targetRequirementId}</span></p>
            )}
          </DialogHeader>

          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-5 py-2">

              {/* ─── CREATE TASK ─── */}
              {actionType === "createTask" && (
                <>
                  {/* Task Group */}
                  <div className="space-y-1.5">
                    <Label>Task Group</Label>
                    <Select value={newTaskForm.taskGroup} onValueChange={(v) => setNewTaskForm(f => ({ ...f, taskGroup: v === "__none__" ? "" : v }))}>
                      <SelectTrigger><SelectValue placeholder="Select task group..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— None —</SelectItem>
                        {validTaskGroups.map((g, i) => <SelectItem key={`tg-${g.id ?? i}`} value={g.name!}>{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label>Description <span className="text-red-500">*</span></Label>
                    <Textarea value={newTaskForm.description} onChange={(e) => setNewTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="Task description..." rows={3} />
                  </div>

                  <Separator />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">RACI Assignment</p>

                  <div className="grid grid-cols-2 gap-4">
                    {(["responsibleId", "accountableId", "consultedId", "informedId"] as const).map((field, fi) => {
                      const labels = ["Responsible (R)", "Accountable (A)", "Consulted (C)", "Informed (I)"];
                      return (
                        <div key={field} className="space-y-1.5">
                          <Label>{labels[fi]}</Label>
                          <Select value={newTaskForm[field]?.toString() ?? "__none__"} onValueChange={(v) => setNewTaskForm(f => ({ ...f, [field]: v === "__none__" ? undefined : parseInt(v) }))}>
                            <SelectTrigger><SelectValue placeholder="Select person..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">— None —</SelectItem>
                              {validStakeholders.map((s, si) => <SelectItem key={`s-${field}-${s.id ?? si}`} value={String(s.id)}>{s.fullName}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dates</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Assign Date</Label>
                      <Input type="date" value={newTaskForm.assignDate} onChange={(e) => setNewTaskForm(f => ({ ...f, assignDate: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Due Date (ETD)</Label>
                      <Input type="date" value={newTaskForm.dueDate} onChange={(e) => setNewTaskForm(f => ({ ...f, dueDate: e.target.value }))} />
                    </div>
                  </div>

                  <Separator />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status & Priority</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select value={newTaskForm.status} onValueChange={(v) => setNewTaskForm(f => ({ ...f, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {validStatusOptions.length > 0
                            ? validStatusOptions.map((s, si) => <SelectItem key={`ts-${s.id ?? si}`} value={s.value!}>{s.value}</SelectItem>)
                            : ["Not Started", "In Progress", "Completed", "On Hold"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)
                          }
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Priority</Label>
                      <Select value={newTaskForm.priority} onValueChange={(v) => setNewTaskForm(f => ({ ...f, priority: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {validPriorityOptions.length > 0
                            ? validPriorityOptions.map((p, pi) => <SelectItem key={`tp-${p.id ?? pi}`} value={p.value!}>{p.value}</SelectItem>)
                            : ["Low", "Medium", "High", "Critical"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Links</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Linked Issue</Label>
                      <Select value={newTaskForm.issueId || "__none__"} onValueChange={(v) => setNewTaskForm(f => ({ ...f, issueId: v === "__none__" ? "" : v }))}>
                        <SelectTrigger><SelectValue placeholder="Select issue..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— None —</SelectItem>
                          {validIssues.map((i, ii) => <SelectItem key={`ti-${i.id ?? ii}`} value={i.issueId!}>{i.issueId} — {i.description?.slice(0, 40)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Linked Deliverable</Label>
                      <Select value={newTaskForm.deliverableId?.toString() ?? "__none__"} onValueChange={(v) => setNewTaskForm(f => ({ ...f, deliverableId: v === "__none__" ? undefined : parseInt(v) }))}>
                        <SelectTrigger><SelectValue placeholder="Select deliverable..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— None —</SelectItem>
                          {validDeliverables.map((d, di) => <SelectItem key={`td-${d.id ?? di}`} value={String(d.id)}>{d.description?.slice(0, 50)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* ─── ASSIGN TASK ─── */}
              {actionType === "assignTask" && (
                <div className="space-y-1.5">
                  <Label>Select Task</Label>
                  <Select value={assignId} onValueChange={setAssignId}>
                    <SelectTrigger><SelectValue placeholder="Choose an unlinked task..." /></SelectTrigger>
                    <SelectContent>
                      {unlinkedTasks.length === 0
                        ? <SelectItem value="__none__" disabled>No unlinked tasks available</SelectItem>
                        : unlinkedTasks.map((t, ti) => (
                            <SelectItem key={`task-opt-${t.id ?? ti}`} value={String(t.id)}>
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

              {/* ─── CREATE ISSUE ─── */}
              {actionType === "createIssue" && (
                <>
                  {/* Issue Group */}
                  <div className="space-y-1.5">
                    <Label>Issue Group</Label>
                    <Select value={newIssueForm.issueGroup || "__none__"} onValueChange={(v) => setNewIssueForm(f => ({ ...f, issueGroup: v === "__none__" ? "" : v }))}>
                      <SelectTrigger><SelectValue placeholder="Select issue group..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— None —</SelectItem>
                        {validIssueGroups.map((g, i) => <SelectItem key={`ig-${g.id ?? i}`} value={g.name!}>{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label>Description <span className="text-red-500">*</span></Label>
                    <Textarea value={newIssueForm.description} onChange={(e) => setNewIssueForm(f => ({ ...f, description: e.target.value }))} placeholder="Issue description..." rows={3} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Source</Label>
                      <Input value={newIssueForm.source} onChange={(e) => setNewIssueForm(f => ({ ...f, source: e.target.value }))} placeholder="Source of issue..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Owner</Label>
                      <Input value={newIssueForm.owner} onChange={(e) => setNewIssueForm(f => ({ ...f, owner: e.target.value }))} placeholder="Issue owner..." />
                    </div>
                  </div>

                  <Separator />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Classification</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select value={newIssueForm.status} onValueChange={(v) => setNewIssueForm(f => ({ ...f, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {validStatusOptions.length > 0
                            ? validStatusOptions.map((s, si) => <SelectItem key={`is-${s.id ?? si}`} value={s.value!}>{s.value}</SelectItem>)
                            : ["Open", "In Progress", "Closed", "On Hold"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)
                          }
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Priority</Label>
                      <Select value={newIssueForm.priority} onValueChange={(v) => setNewIssueForm(f => ({ ...f, priority: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {validPriorityOptions.length > 0
                            ? validPriorityOptions.map((p, pi) => <SelectItem key={`ip-${p.id ?? pi}`} value={p.value!}>{p.value}</SelectItem>)
                            : ["Low", "Medium", "High", "Critical"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)
                          }
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Type</Label>
                      <Input value={newIssueForm.type} onChange={(e) => setNewIssueForm(f => ({ ...f, type: e.target.value }))} placeholder="e.g. Bug, Risk, Blocker..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Class</Label>
                      <Input value={newIssueForm.class} onChange={(e) => setNewIssueForm(f => ({ ...f, class: e.target.value }))} placeholder="e.g. Technical, Business..." />
                    </div>
                  </div>

                  <Separator />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dates & Links</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Open Date</Label>
                      <Input type="date" value={newIssueForm.openDate} onChange={(e) => setNewIssueForm(f => ({ ...f, openDate: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Resolution Date</Label>
                      <Input type="date" value={newIssueForm.resolutionDate} onChange={(e) => setNewIssueForm(f => ({ ...f, resolutionDate: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Linked Task</Label>
                      <Select value={newIssueForm.taskId || "__none__"} onValueChange={(v) => setNewIssueForm(f => ({ ...f, taskId: v === "__none__" ? "" : v }))}>
                        <SelectTrigger><SelectValue placeholder="Select task..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— None —</SelectItem>
                          {validTasks.map((t, ti) => <SelectItem key={`it-${t.id ?? ti}`} value={t.taskId!}>{t.taskId} — {t.description?.slice(0, 40)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Linked Deliverable</Label>
                      <Select value={newIssueForm.deliverableId?.toString() ?? "__none__"} onValueChange={(v) => setNewIssueForm(f => ({ ...f, deliverableId: v === "__none__" ? undefined : parseInt(v) }))}>
                        <SelectTrigger><SelectValue placeholder="Select deliverable..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— None —</SelectItem>
                          {validDeliverables.map((d, di) => <SelectItem key={`id-${d.id ?? di}`} value={String(d.id)}>{d.description?.slice(0, 50)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label>Knowledge Base Code</Label>
                      <Input value={newIssueForm.knowledgeBaseCode} onChange={(e) => setNewIssueForm(f => ({ ...f, knowledgeBaseCode: e.target.value }))} placeholder="KB reference code..." />
                    </div>
                  </div>
                </>
              )}

              {/* ─── ASSIGN ISSUE ─── */}
              {actionType === "assignIssue" && (
                <div className="space-y-1.5">
                  <Label>Select Issue</Label>
                  <Select value={assignId} onValueChange={setAssignId}>
                    <SelectTrigger><SelectValue placeholder="Choose an unlinked issue..." /></SelectTrigger>
                    <SelectContent>
                      {unlinkedIssues.length === 0
                        ? <SelectItem value="__none__" disabled>No unlinked issues available</SelectItem>
                        : unlinkedIssues.map((i, idx) => (
                            <SelectItem key={`issue-opt-${i.id ?? idx}`} value={String(i.id)}>
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

              {/* ─── CREATE TEST CASE ─── */}
              {actionType === "createTestCase" && (
                <>
                  <div className="space-y-1.5">
                    <Label>Title <span className="text-red-500">*</span></Label>
                    <Input value={newTestCaseForm.title} onChange={(e) => setNewTestCaseForm(f => ({ ...f, title: e.target.value }))} placeholder="Test case title..." />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea value={newTestCaseForm.description} onChange={(e) => setNewTestCaseForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this test verify?" rows={2} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Preconditions</Label>
                    <Textarea value={newTestCaseForm.preconditions} onChange={(e) => setNewTestCaseForm(f => ({ ...f, preconditions: e.target.value }))} placeholder="Prerequisites before running this test..." rows={2} />
                  </div>

                  <Separator />
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Test Steps</p>
                    <Button type="button" size="sm" variant="outline" className="h-6 text-xs"
                      onClick={() => setNewTestCaseForm(f => ({ ...f, testSteps: [...f.testSteps, { step: "", expectedResult: "" }] }))}>
                      <Plus className="w-3 h-3 mr-1" /> Add Step
                    </Button>
                  </div>

                  {newTestCaseForm.testSteps.map((step, si) => (
                    <div key={si} className="border rounded-lg p-3 space-y-2 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Step {si + 1}</span>
                        {newTestCaseForm.testSteps.length > 1 && (
                          <Button type="button" size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-600"
                            onClick={() => setNewTestCaseForm(f => ({ ...f, testSteps: f.testSteps.filter((_, i) => i !== si) }))}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <Input placeholder="Step action..." value={step.step}
                        onChange={(e) => setNewTestCaseForm(f => ({ ...f, testSteps: f.testSteps.map((s, i) => i === si ? { ...s, step: e.target.value } : s) }))} />
                      <Input placeholder="Expected result..." value={step.expectedResult}
                        onChange={(e) => setNewTestCaseForm(f => ({ ...f, testSteps: f.testSteps.map((s, i) => i === si ? { ...s, expectedResult: e.target.value } : s) }))} />
                    </div>
                  ))}

                  <div className="space-y-1.5">
                    <Label>Overall Expected Result</Label>
                    <Textarea value={newTestCaseForm.expectedResult} onChange={(e) => setNewTestCaseForm(f => ({ ...f, expectedResult: e.target.value }))} placeholder="Overall expected outcome..." rows={2} />
                  </div>

                  <Separator />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Classification</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Tester</Label>
                      <Input value={newTestCaseForm.tester} onChange={(e) => setNewTestCaseForm(f => ({ ...f, tester: e.target.value }))} placeholder="Tester name..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Priority</Label>
                      <Select value={newTestCaseForm.priority} onValueChange={(v) => setNewTestCaseForm(f => ({ ...f, priority: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Low", "Medium", "High", "Critical"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select value={newTestCaseForm.status} onValueChange={(v) => setNewTestCaseForm(f => ({ ...f, status: v as any }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Not Executed", "In Progress", "Passed", "Failed", "Blocked", "Skipped"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Test Type</Label>
                      <Select value={newTestCaseForm.testType} onValueChange={(v) => setNewTestCaseForm(f => ({ ...f, testType: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Functional", "Unit", "Integration", "UAT", "Regression", "Smoke", "Performance", "Security"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Execution Date</Label>
                      <Input type="date" value={newTestCaseForm.executionDate} onChange={(e) => setNewTestCaseForm(f => ({ ...f, executionDate: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Defect ID</Label>
                      <Input value={newTestCaseForm.defectId} onChange={(e) => setNewTestCaseForm(f => ({ ...f, defectId: e.target.value }))} placeholder="Related defect ID..." />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Notes</Label>
                    <Textarea value={newTestCaseForm.notes} onChange={(e) => setNewTestCaseForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." rows={2} />
                  </div>
                </>
              )}

              {/* ─── ASSIGN TEST CASE ─── */}
              {actionType === "assignTestCase" && (
                <div className="space-y-1.5">
                  <Label>Select Test Case</Label>
                  <Select value={assignId} onValueChange={setAssignId}>
                    <SelectTrigger><SelectValue placeholder="Choose an unlinked test case..." /></SelectTrigger>
                    <SelectContent>
                      {unlinkedTestCases.length === 0
                        ? <SelectItem value="__none__" disabled>No unlinked test cases available</SelectItem>
                        : unlinkedTestCases.map((tc, idx) => (
                            <SelectItem key={`tc-opt-${tc.id ?? idx}`} value={String(tc.id)}>
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
          </ScrollArea>

          <DialogFooter className="pt-4 border-t">
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
