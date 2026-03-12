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
import { Plus, Pencil, Trash2, Bug, AlertTriangle } from "lucide-react";
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState("all");
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data: detail } = trpc.defects.getById.useQuery(
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

  const filtered = filterStatus === "all" ? defectsList : defectsList.filter(d => d.status === filterStatus);

  if (!projectId) return <div className="p-8 text-muted-foreground">Select a project to view Defects.</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bug className="w-6 h-6 text-red-400" /> Defects</h1>
          <p className="text-sm text-muted-foreground mt-1">Track bugs found during testing — linked n:m to Test Cases</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {["Open","In Progress","Fixed","Verified","Closed","Rejected"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Log Defect</Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-6 gap-2">
        {["Open","In Progress","Fixed","Verified","Closed","Rejected"].map(s => (
          <Card key={s} className="p-3 cursor-pointer hover:border-primary/50" onClick={() => setFilterStatus(s === filterStatus ? "all" : s)}>
            <div className="text-xs text-muted-foreground">{s}</div>
            <div className="text-xl font-bold">{defectsList.filter(d => d.status === s).length}</div>
          </Card>
        ))}
      </div>

      {/* Defects List */}
      {isLoading ? (
        <div className="text-muted-foreground">Loading defects...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Bug className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">{filterStatus === "all" ? "No defects logged yet." : `No defects with status "${filterStatus}".`}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => (
            <Card key={d.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setDetailId(d.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{d.defectCode}</span>
                      <Badge variant="outline" className={`text-xs ${SEVERITY_COLORS[d.severity ?? "Medium"]}`}>{d.severity}</Badge>
                    </div>
                    <p className="font-medium text-sm">{d.title}</p>
                    {d.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{d.description}</p>}
                    <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                      {d.reportedBy && <span>By: {d.reportedBy}</span>}
                      {d.assignedTo && <span>→ {d.assignedTo}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <Badge variant="outline" className={STATUS_COLORS[d.status ?? "Open"]}>{d.status}</Badge>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(d)}><Pencil className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Delete this defect?")) deleteMut.mutate({ id: d.id }); }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Defect" : "Log New Defect"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Short defect summary" /></div>
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

      {/* Detail Dialog */}
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
                  {detail.actualResult && <div><h3 className="text-sm font-semibold mb-1">Actual</h3><p className="text-sm text-muted-foreground bg-muted/20 rounded p-2">{detail.actualResult}</p></div>}
                </div>
              )}
              {detail.resolution && (
                <div>
                  <h3 className="text-sm font-semibold mb-1">Resolution</h3>
                  <p className="text-sm text-muted-foreground bg-green-500/10 border border-green-500/20 rounded p-3">{detail.resolution}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold mb-2">Linked Test Cases ({detail.linkedTestCaseIds?.length ?? 0})</h3>
                {detail.linkedTestCaseIds?.length === 0
                  ? <p className="text-xs text-muted-foreground">No test cases linked yet.</p>
                  : <div className="flex flex-wrap gap-1">{detail.linkedTestCaseIds?.map(id => <Badge key={id} variant="outline" className="font-mono text-xs">TC-{id}</Badge>)}</div>
                }
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
