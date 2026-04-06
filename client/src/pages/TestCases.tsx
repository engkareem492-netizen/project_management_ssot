import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RegistrySelect } from "@/components/RegistrySelect";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Plus, Eye, Pencil, Trash2, FlaskConical, CheckCircle, XCircle, AlertCircle, Clock, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { StakeholderSelect } from "@/components/StakeholderSelect";
import { formatDate as _formatDate } from "@/lib/dateUtils";

type TestStatus = "Not Executed" | "In Progress" | "Passed" | "Failed" | "Blocked" | "Skipped";

const STATUS_COLORS: Record<TestStatus, string> = {
  "Not Executed": "bg-gray-100 text-gray-600",
  "In Progress": "bg-blue-100 text-blue-700",
  "Passed": "bg-green-100 text-green-700",
  "Failed": "bg-red-100 text-red-600",
  "Blocked": "bg-orange-100 text-orange-700",
  "Skipped": "bg-yellow-100 text-yellow-700",
};

const STATUS_ICONS: Record<TestStatus, React.ReactNode> = {
  "Not Executed": <Clock className="w-3 h-3" />,
  "In Progress": <Clock className="w-3 h-3" />,
  "Passed": <CheckCircle className="w-3 h-3" />,
  "Failed": <XCircle className="w-3 h-3" />,
  "Blocked": <AlertCircle className="w-3 h-3" />,
  "Skipped": <AlertCircle className="w-3 h-3" />,
};

interface TestStep {
  step: string;
  expectedResult: string;
}

interface TestForm {
  title: string;
  requirementId: string;
  description: string;
  preconditions: string;
  testSteps: TestStep[];
  expectedResult: string;
  tester: string;
  priority: string;
  status: TestStatus;
  testType: string;
  executionDate: string;
  defectId: string;
  notes: string;
}

const emptyForm: TestForm = {
  title: "", requirementId: "", description: "", preconditions: "",
  testSteps: [{ step: "", expectedResult: "" }],
  expectedResult: "", tester: "", priority: "Medium",
  status: "Not Executed", testType: "Functional", executionDate: "",
  defectId: "", notes: "",
};

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return _formatDate(d as string);
}

export default function TestCases() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterReq, setFilterReq] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<TestForm>(emptyForm);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [runForm, setRunForm] = useState({ executedBy: "", executionDate: "", status: "Not Executed" as const, environment: "", actualResult: "", notes: "" });

  const utils = trpc.useUtils();
  const { data: testCases = [], isLoading } = trpc.testCases.list.useQuery({ projectId }, { enabled: !!projectId });
  const { data: requirements = [] } = trpc.requirements.list.useQuery({ projectId }, { enabled: !!projectId });
  const { data: stakeholders = [] } = trpc.stakeholders.list.useQuery({ projectId }, { enabled: !!projectId });
  const { data: testRuns = [], refetch: refetchRuns } = trpc.testRuns.listByTestCase.useQuery(
    { projectId, testCaseId: selectedId ?? 0 },
    { enabled: !!projectId && !!selectedId && showView }
  );
  const createRunMutation = trpc.testRuns.create.useMutation({
    onSuccess: () => { refetchRuns(); setShowRunDialog(false); toast.success("Test run logged"); },
    onError: (e) => toast.error(e.message),
  });

  const createMutation = trpc.testCases.create.useMutation({
    onSuccess: () => { utils.testCases.list.invalidate(); setShowCreate(false); setForm(emptyForm); toast.success("Test case created"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.testCases.update.useMutation({
    onSuccess: () => { utils.testCases.list.invalidate(); setShowEdit(false); toast.success("Test case updated"); },
    onError: (e) => toast.error(e.message),
  });
  const updateStatusMutation = trpc.testCases.update.useMutation({
    onSuccess: () => { utils.testCases.list.invalidate(); toast.success("Status updated"); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const deleteMutation = trpc.testCases.delete.useMutation({
    onSuccess: () => { utils.testCases.list.invalidate(); toast.success("Test case deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const selectedData = testCases.find((t) => t.id === selectedId);

  const filtered = testCases.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.testId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchReq = !filterReq || t.requirementId === filterReq;
    return matchSearch && matchStatus && matchReq;
  });

  // Stats
  const stats = {
    total: testCases.length,
    passed: testCases.filter((t) => t.status === "Passed").length,
    failed: testCases.filter((t) => t.status === "Failed").length,
    notRun: testCases.filter((t) => t.status === "Not Executed").length,
  };
  const passRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;

  function openEdit(t: typeof testCases[0]) {
    setSelectedId(t.id);
    setForm({
      title: t.title,
      requirementId: t.requirementId ?? "",
      description: t.description ?? "",
      preconditions: t.preconditions ?? "",
      testSteps: Array.isArray(t.testSteps) && t.testSteps.length > 0
        ? (t.testSteps as TestStep[])
        : [{ step: "", expectedResult: "" }],
      expectedResult: t.expectedResult ?? "",
      tester: t.tester ?? "",
      priority: t.priority ?? "Medium",
      status: (t.status as TestStatus) ?? "Not Executed",
      testType: t.testType ?? "Functional",
      executionDate: t.executionDate ? new Date(t.executionDate).toISOString().split("T")[0] : "",
      defectId: t.defectId ?? "",
      notes: t.notes ?? "",
    });
    setShowEdit(true);
  }

  function addStep() { setForm({ ...form, testSteps: [...form.testSteps, { step: "", expectedResult: "" }] }); }
  function removeStep(i: number) { setForm({ ...form, testSteps: form.testSteps.filter((_, idx) => idx !== i) }); }
  function updateStep(i: number, field: keyof TestStep, val: string) {
    const steps = [...form.testSteps];
    steps[i] = { ...steps[i], [field]: val };
    setForm({ ...form, testSteps: steps });
  }

  const TestFormContent = () => (
    <div className="grid grid-cols-2 gap-4 py-2">
      <div className="col-span-2 space-y-1"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div className="space-y-1"><Label>Linked Requirement</Label>
        <Select value={form.requirementId || "none"} onValueChange={(v) => setForm({ ...form, requirementId: v === "none" ? "" : v })}>
          <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {requirements.filter(r => r.idCode).map((r) => <SelectItem key={r.id} value={r.idCode!}>{r.idCode} — {r.description?.slice(0, 40)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1"><Label>Test Type</Label>
        <RegistrySelect projectId={projectId} domain="test_cases" fieldKey="type"
          value={form.testType} onValueChange={(v) => setForm({ ...form, testType: v })} placeholder="Select type" />
      </div>
      <div className="space-y-1"><Label>Priority</Label>
        <RegistrySelect projectId={projectId} domain="test_cases" fieldKey="priority"
          value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })} placeholder="Select priority" />
      </div>
      <div className="space-y-1"><Label>Status</Label>
        <RegistrySelect projectId={projectId} domain="test_cases" fieldKey="status"
          value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TestStatus })} placeholder="Select status" />
      </div>
      <div className="col-span-2 space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
      <div className="col-span-2 space-y-1"><Label>Preconditions</Label><Textarea value={form.preconditions} onChange={(e) => setForm({ ...form, preconditions: e.target.value })} rows={2} /></div>
      <div className="col-span-2 space-y-2">
        <div className="flex items-center justify-between"><Label>Test Steps</Label><Button type="button" size="sm" variant="outline" onClick={addStep}><Plus className="w-3 h-3 mr-1" />Add Step</Button></div>
        {form.testSteps.map((step, i) => (
          <div key={i} className="border rounded-lg p-3 space-y-2 bg-gray-50">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold text-muted-foreground">Step {i + 1}</span>{form.testSteps.length > 1 && <Button type="button" size="sm" variant="ghost" className="text-red-500 h-6 w-6 p-0" onClick={() => removeStep(i)}><Trash2 className="w-3 h-3" /></Button>}</div>
            <Input placeholder="Action / Step" value={step.step} onChange={(e) => updateStep(i, "step", e.target.value)} />
            <Input placeholder="Expected Result" value={step.expectedResult} onChange={(e) => updateStep(i, "expectedResult", e.target.value)} />
          </div>
        ))}
      </div>
      <div className="col-span-2 space-y-1"><Label>Overall Expected Result</Label><Textarea value={form.expectedResult} onChange={(e) => setForm({ ...form, expectedResult: e.target.value })} rows={2} /></div>
      <div className="space-y-1"><Label>Tester</Label><StakeholderSelect stakeholders={stakeholders as any[]} value={form.tester} onValueChange={(v) => setForm({ ...form, tester: v })} projectId={projectId} /></div>
      <div className="space-y-1"><Label>Execution Date</Label><Input type="date" value={form.executionDate} onChange={(e) => setForm({ ...form, executionDate: e.target.value })} /></div>
      <div className="space-y-1"><Label>Defect / Issue ID</Label><Input value={form.defectId} onChange={(e) => setForm({ ...form, defectId: e.target.value })} placeholder="e.g. ISS-0001" /></div>
      <div className="col-span-2 space-y-1"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-gray-500" />
              Test Cases
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage test cases linked to requirements with execution tracking</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-center"><div className="text-2xl font-bold text-emerald-700">{passRate}%</div><div className="text-xs text-muted-foreground">Pass Rate</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-green-600">{stats.passed}</div><div className="text-xs text-muted-foreground">Passed</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-red-600">{stats.failed}</div><div className="text-xs text-muted-foreground">Failed</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-gray-500">{stats.notRun}</div><div className="text-xs text-muted-foreground">Not Run</div></div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search test cases..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-52" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(["Not Executed", "In Progress", "Passed", "Failed", "Blocked", "Skipped"] as TestStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterReq || "all"} onValueChange={(v) => setFilterReq(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Requirements" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requirements</SelectItem>
              {requirements.filter(r => r.idCode).map((r) => <SelectItem key={r.id} value={r.idCode!}>{r.idCode}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowCreate(true); }} className="bg-gray-900 hover:bg-gray-800 text-white">
          <Plus className="w-4 h-4 mr-1" /> New Test Case
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-emerald-50">
              <TableHead className="w-24 font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Title</TableHead>
              <TableHead className="w-28 font-semibold">Req. Linked</TableHead>
              <TableHead className="w-24 font-semibold">Type</TableHead>
              <TableHead className="w-24 font-semibold">Priority</TableHead>
              <TableHead className="w-32 font-semibold">Status</TableHead>
              <TableHead className="w-28 font-semibold">Tester</TableHead>
              <TableHead className="w-28 font-semibold">Exec. Date</TableHead>
              <TableHead className="w-36 font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No test cases found</TableCell></TableRow>
            ) : filtered.map((t) => (
              <TableRow key={t.id} className="hover:bg-emerald-50/30">
                <TableCell className="font-mono text-sm font-semibold text-emerald-700">{t.testId}</TableCell>
                <TableCell className="max-w-xs">
                  <div className="font-medium text-sm truncate">{t.title}</div>
                  {t.defectId && <div className="text-xs text-red-500">Defect: {t.defectId}</div>}
                </TableCell>
                <TableCell className="text-sm">{t.requirementId ? <span className="font-mono text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{t.requirementId}</span> : "—"}</TableCell>
                <TableCell className="text-xs">{t.testType ?? "—"}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{t.priority ?? "—"}</Badge></TableCell>
                <TableCell>
                    <Select value={t.status ?? "Not Executed"} onValueChange={(v: string) => updateStatusMutation.mutate({ id: t.id, status: v as TestStatus })}>
                    <SelectTrigger className={`h-7 text-xs border-0 ${STATUS_COLORS[(t.status as TestStatus) ?? "Not Executed"]}`}>
                      <div className="flex items-center gap-1">{STATUS_ICONS[(t.status as TestStatus) ?? "Not Executed"]}<SelectValue /></div>
                    </SelectTrigger>
                    <SelectContent>
                      {(["Not Executed", "In Progress", "Passed", "Failed", "Blocked", "Skipped"] as TestStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-sm">{t.tester ?? "—"}</TableCell>
                <TableCell className="text-sm">{formatDate(t.executionDate)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedId(t.id); setShowView(true); }}><Eye className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(t)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => { if (confirm("Delete this test case?")) deleteMutation.mutate({ id: t.id }); }}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Test Case</DialogTitle></DialogHeader>
          <TestFormContent />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white" onClick={() => createMutation.mutate({ projectId, ...form, executionDate: form.executionDate || undefined, requirementId: form.requirementId || undefined })} disabled={!form.title || createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Create Test Case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Test Case</DialogTitle></DialogHeader>
          <TestFormContent />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white" onClick={() => selectedId && updateMutation.mutate({ id: selectedId, ...form, executionDate: form.executionDate || undefined, requirementId: form.requirementId || undefined })} disabled={!form.title || updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Test Case Details</DialogTitle></DialogHeader>
          {selectedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono font-bold text-emerald-700">{selectedData.testId}</span>
                <Badge className={STATUS_COLORS[(selectedData.status as TestStatus) ?? "Not Executed"]}>{selectedData.status}</Badge>
                {selectedData.requirementId && <Badge variant="outline" className="text-blue-700">{selectedData.requirementId}</Badge>}
              </div>
              <h2 className="text-xl font-semibold">{selectedData.title}</h2>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="font-medium">Type:</span> {selectedData.testType ?? "—"}</div>
                <div><span className="font-medium">Priority:</span> {selectedData.priority ?? "—"}</div>
                <div><span className="font-medium">Tester:</span> {selectedData.tester ?? "—"}</div>
                <div><span className="font-medium">Exec. Date:</span> {formatDate(selectedData.executionDate)}</div>
                {selectedData.defectId && <div><span className="font-medium">Defect:</span> {selectedData.defectId}</div>}
              </div>
              {selectedData.description && <div><span className="font-medium text-sm">Description:</span><p className="text-sm text-muted-foreground mt-1">{selectedData.description}</p></div>}
              {selectedData.preconditions && <div><span className="font-medium text-sm">Preconditions:</span><p className="text-sm text-muted-foreground mt-1">{selectedData.preconditions}</p></div>}
              {Array.isArray(selectedData.testSteps) && selectedData.testSteps.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Test Steps:</span>
                  <div className="mt-2 space-y-2">
                    {(selectedData.testSteps as TestStep[]).map((s, i) => (
                      <div key={i} className="border rounded p-3 bg-gray-50">
                        <div className="text-xs font-semibold text-muted-foreground mb-1">Step {i + 1}</div>
                        <div className="text-sm">{s.step}</div>
                        {s.expectedResult && <div className="text-xs text-muted-foreground mt-1">Expected: {s.expectedResult}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedData.expectedResult && <div><span className="font-medium text-sm">Expected Result:</span><p className="text-sm text-muted-foreground mt-1">{selectedData.expectedResult}</p></div>}
              {selectedData.notes && <div><span className="font-medium text-sm">Notes:</span><p className="text-sm text-muted-foreground mt-1">{selectedData.notes}</p></div>}
              {/* Test Runs Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-sm flex items-center gap-2"><PlayCircle className="w-4 h-4 text-emerald-600" /> Test Runs ({testRuns.length})</span>
                  <Button size="sm" onClick={() => { setRunForm({ executedBy: "", executionDate: new Date().toISOString().split("T")[0], status: "Not Executed", environment: "", actualResult: "", notes: "" }); setShowRunDialog(true); }}>
                    <Plus className="w-3 h-3 mr-1" /> Log Run
                  </Button>
                </div>
                {testRuns.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No test runs logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {testRuns.map((run: any) => (
                      <div key={run.id} className="border rounded-lg p-3 bg-gray-50 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs text-muted-foreground">{run.runId}</span>
                          <Badge className={STATUS_COLORS[(run.status as TestStatus) ?? "Not Executed"]}>{run.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                          <div>Executed by: {run.executedBy ?? "—"}</div>
                          <div>Date: {run.executionDate ? new Date(run.executionDate).toLocaleDateString() : "—"}</div>
                          <div>Environment: {run.environment ?? "—"}</div>
                        </div>
                        {run.actualResult && <p className="text-xs mt-1 text-gray-700">{run.actualResult}</p>}
                        {run.notes && <p className="text-xs mt-1 text-muted-foreground">{run.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Log Test Run Dialog */}
      <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log Test Run</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Executed By</Label>
                <StakeholderSelect stakeholders={stakeholders as any[]} value={runForm.executedBy} onValueChange={(v) => setRunForm(p => ({ ...p, executedBy: v }))} projectId={projectId} />
              </div>
              <div>
                <Label>Execution Date</Label>
                <Input type="date" value={runForm.executionDate} onChange={e => setRunForm(p => ({ ...p, executionDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={runForm.status} onValueChange={v => setRunForm(p => ({ ...p, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Not Executed", "Passed", "Failed", "Blocked", "Skipped"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Environment</Label>
                <Input value={runForm.environment} onChange={e => setRunForm(p => ({ ...p, environment: e.target.value }))} placeholder="DEV / QA / UAT" />
              </div>
            </div>
            <div>
              <Label>Actual Result</Label>
              <Textarea rows={2} value={runForm.actualResult} onChange={e => setRunForm(p => ({ ...p, actualResult: e.target.value }))} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} value={runForm.notes} onChange={e => setRunForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRunDialog(false)}>Cancel</Button>
            <Button onClick={() => createRunMutation.mutate({ projectId, testCaseId: selectedId!, ...runForm, executionDate: runForm.executionDate || undefined })} disabled={createRunMutation.isPending}>
              {createRunMutation.isPending ? "Saving..." : "Log Run"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Floating Add Button */}
      <button
        onClick={() => { setForm(emptyForm); setShowCreate(true); }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-all hover:scale-110"
        title="Add Test Case"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
