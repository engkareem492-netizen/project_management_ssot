import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Bug, Link2, BarChart3, Unlink, FlaskConical } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-red-500/20 text-red-400",
  "In Progress": "bg-yellow-500/20 text-yellow-400",
  Fixed: "bg-blue-500/20 text-blue-400",
  Verified: "bg-purple-500/20 text-purple-400",
  Closed: "bg-green-500/20 text-green-400",
  Rejected: "bg-gray-500/20 text-gray-400",
};
const SEVERITY_COLORS: Record<string, string> = {
  Critical: "bg-red-600/30 text-red-300 border-red-600/40",
  High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const EMPTY_FORM = {
  title: "", description: "", severity: "Medium", priority: "Medium", status: "Open",
  reportedBy: "", assignedTo: "", stepsToReproduce: "", expectedResult: "", actualResult: "", resolution: "", notes: ""
};

export default function DefectsPage() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;
  const utils = trpc.useUtils();

  const { data: defectsList = [], isLoading } = trpc.defects.list.useQuery(
    { projectId }, { enabled: projectId > 0 }
  );
  const { data: testCasesList = [] } = trpc.testCases.list.useQuery(
    { projectId }, { enabled: projectId > 0 }
  );
  const { data: densityData } = trpc.defects.defectDensity.useQuery(
    { projectId }, { enabled: projectId > 0 }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState("all");
  const [detailId, setDetailId] = useState<number | null>(null);
  const [linkTCDialogOpen, setLinkTCDialogOpen] = useState(false);
  const [linkingDefectId, setLinkingDefectId] = useState<number | null>(null);
  const [tcSearchQuery, setTCSearchQuery] = useState("");

  const { data: detail, refetch: refetchDetail } = trpc.defects.getById.useQuery(
    { id: detailId! }, { enabled: detailId !== null }
  );

  const createMut = trpc.defects.create.useMutation({
    onSuccess: () => { utils.defects.list.invalidate({ projectId }); toast.success("Defect logged"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.defects.update.useMutation({
    onSuccess: () => { utils.defects.list.invalidate({ projectId }); toast.success("Defect updated"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.defects.delete.useMutation({
    onSuccess: () => { utils.defects.list.invalidate({ projectId }); toast.success("Defect deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const linkTCMut = trpc.defects.linkTestCase.useMutation({
    onSuccess: () => {
      refetchDetail();
      utils.defects.defectDensity.invalidate({ projectId });
      toast.success("Test case linked");
    },
    onError: (e) => toast.error(e.message),
  });
  const unlinkTCMut = trpc.defects.unlinkTestCase.useMutation({
    onSuccess: () => {
      refetchDetail();
      utils.defects.defectDensity.invalidate({ projectId });
      toast.success("Test case unlinked");
    },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() { setEditId(null); setForm(EMPTY_FORM); setDialogOpen(true); }
  function openEdit(d: typeof defectsList[0]) {
    setEditId(d.id);
    setForm({
      title: d.title, description: d.description ?? "", severity: d.severity ?? "Medium",
      priority: d.priority ?? "Medium", status: d.status ?? "Open",
      reportedBy: d.reportedBy ?? "", assignedTo: d.assignedTo ?? "",
      stepsToReproduce: d.stepsToReproduce ?? "", expectedResult: d.expectedResult ?? "",
      actualResult: d.actualResult ?? "", resolution: d.resolution ?? "", notes: d.notes ?? ""
    });
    setDialogOpen(true);
  }
  function handleSave() {
    if (!form.title.trim()) return toast.error("Title is required");
    if (editId) updateMut.mutate({ id: editId, ...form });
    else createMut.mutate({ projectId, ...form });
  }
  function openLinkTC(defectId: number) {
    setLinkingDefectId(defectId);
    setTCSearchQuery("");
    setLinkTCDialogOpen(true);
  }

  const filtered = filterStatus === "all" ? defectsList : defectsList.filter(d => d.status === filterStatus);
  const filteredTCs = testCasesList.filter(tc =>
    tc.testId.toLowerCase().includes(tcSearchQuery.toLowerCase()) ||
    tc.title.toLowerCase().includes(tcSearchQuery.toLowerCase())
  );

  if (!projectId) return <div className="p-8 text-muted-foreground">Select a project to view Defects.</div>;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bug className="w-6 h-6 text-red-400" /> Defects</h1>
          <p className="text-sm text-muted-foreground mt-1">Track bugs, link them to failing test cases, and analyse defect density</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Log Defect</Button>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list" className="gap-2"><Bug className="w-4 h-4" /> Defect List</TabsTrigger>
          <TabsTrigger value="density" className="gap-2"><BarChart3 className="w-4 h-4" /> Defect Density Report</TabsTrigger>
        </TabsList>

        {/* ── Defect List Tab ── */}
        <TabsContent value="list" className="space-y-4 mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {["all", "Open", "In Progress", "Fixed", "Verified", "Closed"].map(s => (
              <Card
                key={s}
                className={`p-3 cursor-pointer transition-colors ${filterStatus === s ? "border-primary" : "hover:border-primary/50"}`}
                onClick={() => setFilterStatus(s)}
              >
                <div className="text-xs text-muted-foreground capitalize">{s === "all" ? "All" : s}</div>
                <div className="text-2xl font-bold">
                  {s === "all" ? defectsList.length : defectsList.filter(d => d.status === s).length}
                </div>
              </Card>
            ))}
          </div>

          {/* Defect Table */}
          {isLoading ? (
            <div className="text-muted-foreground">Loading defects...</div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <Bug className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No defects found. Click <strong>Log Defect</strong> to record the first one.</p>
            </Card>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">ID</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Title</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Severity</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Priority</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Assigned To</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => (
                    <tr key={d.id} className={`border-t hover:bg-muted/20 cursor-pointer ${i % 2 === 0 ? "" : "bg-muted/5"}`}
                      onClick={() => setDetailId(d.id)}>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{d.defectCode}</td>
                      <td className="px-3 py-2 font-medium max-w-xs truncate">{d.title}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={`text-xs ${SEVERITY_COLORS[d.severity ?? "Medium"]}`}>{d.severity}</Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{d.priority}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[d.status ?? "Open"]}`}>{d.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{d.assignedTo || "—"}</td>
                      <td className="px-3 py-2 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Link Test Case" onClick={() => openLinkTC(d.id)}>
                            <Link2 className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(d)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                            onClick={() => { if (confirm("Delete this defect?")) deleteMut.mutate({ id: d.id }); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── Defect Density Report Tab ── */}
        <TabsContent value="density" className="space-y-4 mt-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Total Test Cases</div>
              <div className="text-2xl font-bold">{densityData?.totalTestCases ?? 0}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Total Defects</div>
              <div className="text-2xl font-bold text-red-400">{densityData?.totalDefects ?? 0}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">TCs with Defects</div>
              <div className="text-2xl font-bold text-orange-400">{densityData?.testCasesWithDefects ?? 0}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Defect-TC Links</div>
              <div className="text-2xl font-bold text-yellow-400">{densityData?.totalLinks ?? 0}</div>
            </Card>
          </div>

          {/* Density Table */}
          {!densityData || densityData.rows.length === 0 ? (
            <Card className="p-12 text-center">
              <FlaskConical className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No test cases found. Add test cases and link defects to generate the density report.</p>
            </Card>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="bg-muted/30 px-4 py-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Defect Density per Test Case</span>
                <span className="text-xs text-muted-foreground ml-auto">Sorted by defect count — highest risk areas first</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/20">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Test Case</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Title</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">TC Status</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">Defect Count</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Density Bar</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Linked Defects</th>
                  </tr>
                </thead>
                <tbody>
                  {densityData.rows.map((row, i) => {
                    const maxCount = densityData.rows[0]?.defectCount ?? 1;
                    const barWidth = maxCount > 0 ? Math.round((row.defectCount / maxCount) * 100) : 0;
                    const riskColor = row.defectCount === 0
                      ? "bg-green-500/30"
                      : row.defectCount >= 3 ? "bg-red-500/60"
                      : row.defectCount >= 2 ? "bg-orange-500/50"
                      : "bg-yellow-500/40";
                    return (
                      <tr key={row.testCaseId} className={`border-t hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/5"}`}>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{row.testId}</td>
                        <td className="px-3 py-2 max-w-xs truncate">{row.title}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs">{row.status}</Badge>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row.defectCount > 0 ? (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${row.defectCount >= 3 ? "bg-red-500/20 text-red-400" : row.defectCount >= 2 ? "bg-orange-500/20 text-orange-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                              {row.defectCount}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40 text-xs">0</span>
                          )}
                        </td>
                        <td className="px-3 py-2 w-32">
                          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${riskColor}`} style={{ width: `${barWidth}%` }} />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {row.linkedDefects.length === 0 ? (
                              <span className="text-xs text-muted-foreground/40">—</span>
                            ) : row.linkedDefects.map(d => (
                              <Badge key={d.id} variant="outline"
                                className={`text-xs font-mono ${SEVERITY_COLORS[d.severity ?? "Medium"]}`}
                                title={`${d.title} [${d.status}]`}>
                                {d.defectCode}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Risk Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="font-medium">Risk Level:</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500/30 inline-block" /> 0 defects — Low risk</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500/40 inline-block" /> 1 defect — Moderate</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500/50 inline-block" /> 2 defects — High</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500/60 inline-block" /> 3+ defects — Critical</span>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-red-400" />
              {editId ? "Edit Defect" : "Log New Defect"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Brief description of the defect" /></div>
            <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Severity</Label>
                <Select value={form.severity} onValueChange={v => setForm(p => ({ ...p, severity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Critical","High","Medium","Low"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Critical","High","Medium","Low"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Open","In Progress","Fixed","Verified","Closed","Rejected"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Reported By</Label><Input value={form.reportedBy} onChange={e => setForm(p => ({ ...p, reportedBy: e.target.value }))} /></div>
              <div><Label>Assigned To</Label><Input value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))} /></div>
            </div>
            <div><Label>Steps to Reproduce</Label><Textarea rows={3} value={form.stepsToReproduce} onChange={e => setForm(p => ({ ...p, stepsToReproduce: e.target.value }))} placeholder="1. Go to...\n2. Click on...\n3. Observe..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Expected Result</Label><Textarea rows={2} value={form.expectedResult} onChange={e => setForm(p => ({ ...p, expectedResult: e.target.value }))} /></div>
              <div><Label>Actual Result</Label><Textarea rows={2} value={form.actualResult} onChange={e => setForm(p => ({ ...p, actualResult: e.target.value }))} /></div>
            </div>
            <div><Label>Resolution</Label><Textarea rows={2} value={form.resolution} onChange={e => setForm(p => ({ ...p, resolution: e.target.value }))} placeholder="How was this fixed?" /></div>
            <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editId ? "Save Changes" : "Log Defect"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Link Test Case Dialog ── */}
      <Dialog open={linkTCDialogOpen} onOpenChange={setLinkTCDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-400" />
              Link Test Case to Defect
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Search by TC ID or title..."
              value={tcSearchQuery}
              onChange={e => setTCSearchQuery(e.target.value)}
            />
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filteredTCs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No test cases found.</p>
              ) : filteredTCs.map(tc => (
                <div key={tc.id} className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/20 border border-transparent hover:border-border">
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground mr-2">{tc.testId}</span>
                    <span className="text-sm truncate">{tc.title}</span>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{tc.status}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-7 text-xs"
                    disabled={linkTCMut.isPending}
                    onClick={() => {
                      if (linkingDefectId) {
                        linkTCMut.mutate({ defectId: linkingDefectId, testCaseId: tc.id });
                      }
                    }}
                  >
                    <Link2 className="w-3 h-3 mr-1" /> Link
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkTCDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog ── */}
      <Dialog open={detailId !== null} onOpenChange={open => { if (!open) setDetailId(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-red-400" />
              {detail?.defectCode} — {detail?.title}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={STATUS_COLORS[detail.status ?? "Open"]}>{detail.status}</Badge>
                <Badge variant="outline" className={SEVERITY_COLORS[detail.severity ?? "Medium"]}>Severity: {detail.severity}</Badge>
                <Badge variant="outline">Priority: {detail.priority}</Badge>
                {detail.reportedBy && <Badge variant="outline" className="text-xs">Reported: {detail.reportedBy}</Badge>}
                {detail.assignedTo && <Badge variant="outline" className="text-xs">Assigned: {detail.assignedTo}</Badge>}
              </div>
              {detail.description && <p className="text-sm text-muted-foreground">{detail.description}</p>}
              {detail.stepsToReproduce && (
                <div>
                  <h3 className="text-sm font-semibold mb-1">Steps to Reproduce</h3>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/20 rounded p-3">{detail.stepsToReproduce}</pre>
                </div>
              )}
              {(detail.expectedResult || detail.actualResult) && (
                <div className="grid grid-cols-2 gap-3">
                  {detail.expectedResult && <div><h3 className="text-sm font-semibold mb-1">Expected</h3><p className="text-sm text-muted-foreground bg-muted/20 rounded p-2">{detail.expectedResult}</p></div>}
                  {detail.actualResult && <div><h3 className="text-sm font-semibold mb-1">Actual</h3><p className="text-sm text-muted-foreground bg-red-500/10 border border-red-500/20 rounded p-2">{detail.actualResult}</p></div>}
                </div>
              )}
              {detail.resolution && (
                <div>
                  <h3 className="text-sm font-semibold mb-1">Resolution</h3>
                  <p className="text-sm text-muted-foreground bg-green-500/10 border border-green-500/20 rounded p-3">{detail.resolution}</p>
                </div>
              )}

              {/* Linked Test Cases with unlink capability */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold flex items-center gap-1">
                    <FlaskConical className="w-4 h-4 text-blue-400" />
                    Linked Test Cases ({(detail as any).linkedTestCases?.length ?? detail.linkedTestCaseIds?.length ?? 0})
                  </h3>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                    onClick={() => { setDetailId(null); openLinkTC(detail.id); }}>
                    <Link2 className="w-3 h-3" /> Link TC
                  </Button>
                </div>
                {((detail as any).linkedTestCases?.length ?? 0) === 0 ? (
                  <p className="text-xs text-muted-foreground bg-muted/10 rounded p-3">
                    No test cases linked yet. Click <strong>Link TC</strong> to associate this defect with the failing test case(s).
                  </p>
                ) : (
                  <div className="space-y-1">
                    {(detail as any).linkedTestCases?.map((tc: { id: number; testId: string; title: string; status: string }) => tc && (
                      <div key={tc.id} className="flex items-center gap-2 text-sm bg-muted/20 rounded px-3 py-2">
                        <span className="font-mono text-xs text-muted-foreground">{tc.testId}</span>
                        <span className="flex-1 truncate">{tc.title}</span>
                        <Badge variant="outline" className="text-xs">{tc.status}</Badge>
                        <Button
                          size="icon" variant="ghost" className="h-6 w-6 text-destructive shrink-0"
                          title="Unlink"
                          onClick={() => unlinkTCMut.mutate({ defectId: detail.id, testCaseId: tc.id })}
                        >
                          <Unlink className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { if (detail) openEdit(detail); setDetailId(null); }}>Edit</Button>
            <Button onClick={() => setDetailId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
