import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, ClipboardList, Calendar, User } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-500/20 text-gray-400",
  Active: "bg-blue-500/20 text-blue-400",
  Completed: "bg-green-500/20 text-green-400",
  Archived: "bg-orange-500/20 text-orange-400",
};

const EMPTY_FORM = { title: "", description: "", status: "Draft", startDate: "", endDate: "", owner: "", notes: "" };

export default function TestPlansPage() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;
  const utils = trpc.useUtils();

  const { data: plans = [], isLoading } = trpc.testPlans.list.useQuery(
    { projectId }, { enabled: projectId > 0 }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data: detail } = trpc.testPlans.getById.useQuery(
    { id: detailId! }, { enabled: detailId !== null }
  );

  const createMut = trpc.testPlans.create.useMutation({
    onSuccess: () => { utils.testPlans.list.invalidate({ projectId }); toast.success("Test plan created"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.testPlans.update.useMutation({
    onSuccess: () => { utils.testPlans.list.invalidate({ projectId }); toast.success("Test plan updated"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.testPlans.delete.useMutation({
    onSuccess: () => { utils.testPlans.list.invalidate({ projectId }); toast.success("Test plan deleted"); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() { setEditId(null); setForm(EMPTY_FORM); setDialogOpen(true); }
  function openEdit(p: typeof plans[0]) {
    setEditId(p.id);
<<<<<<< HEAD
    const toDateStr = (d: Date | string | null | undefined) => d instanceof Date ? d.toISOString().split('T')[0] : (d ?? '');
    setForm({ title: p.title, description: p.description ?? "", status: p.status ?? "Draft", startDate: toDateStr(p.startDate), endDate: toDateStr(p.endDate), owner: p.owner ?? "", notes: p.notes ?? "" });
=======
    setForm({ title: p.title, description: p.description ?? "", status: p.status ?? "Draft", startDate: p.startDate ?? "", endDate: p.endDate ?? "", owner: p.owner ?? "", notes: p.notes ?? "" });
>>>>>>> github/MANUS
    setDialogOpen(true);
  }
  function handleSave() {
    if (!form.title.trim()) return toast.error("Title is required");
    if (editId) updateMut.mutate({ id: editId, ...form });
    else createMut.mutate({ projectId, ...form });
  }

  if (!projectId) return <div className="p-8 text-muted-foreground">Select a project to view Test Plans.</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="w-6 h-6 text-yellow-400" /> Test Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">Organise Test Cases into scheduled test campaigns — link n:m to Test Cases</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> New Test Plan</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {["Draft","Active","Completed","Archived"].map(s => (
          <Card key={s} className="p-3">
            <div className="text-xs text-muted-foreground">{s}</div>
            <div className="text-2xl font-bold">{plans.filter(p => p.status === s).length}</div>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading test plans...</div>
      ) : plans.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No test plans yet. Click <strong>New Test Plan</strong> to create one.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map(p => (
            <Card key={p.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setDetailId(p.id)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground font-mono">{p.planCode}</span>
                    <CardTitle className="text-base mt-0.5">{p.title}</CardTitle>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Delete this test plan?")) deleteMut.mutate({ id: p.id }); }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={STATUS_COLORS[p.status ?? "Draft"]}>{p.status}</Badge>
                  {p.owner && <Badge variant="outline" className="text-xs flex items-center gap-1"><User className="w-3 h-3" />{p.owner}</Badge>}
                </div>
                {(p.startDate || p.endDate) && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
<<<<<<< HEAD
                    {p.startDate instanceof Date ? p.startDate.toLocaleDateString() : p.startDate}{p.endDate ? ` → ${p.endDate instanceof Date ? p.endDate.toLocaleDateString() : p.endDate}` : ""}
=======
                    {p.startDate} {p.endDate ? `→ ${p.endDate}` : ""}
>>>>>>> github/MANUS
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit Test Plan" : "New Test Plan"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Sprint 3 Regression" /></div>
            <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Draft","Active","Completed","Archived"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Owner</Label><Input value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} /></div>
              <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} /></div>
            </div>
            <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editId ? "Save Changes" : "Create Plan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailId !== null} onOpenChange={open => { if (!open) setDetailId(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-yellow-400" />
              {detail?.planCode} — {detail?.title}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={STATUS_COLORS[detail.status ?? "Draft"]}>{detail.status}</Badge>
                {detail.owner && <Badge variant="outline">{detail.owner}</Badge>}
              </div>
              {detail.description && <p className="text-sm text-muted-foreground">{detail.description}</p>}
              {(detail.startDate || detail.endDate) && (
<<<<<<< HEAD
                <div className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> {detail.startDate instanceof Date ? detail.startDate.toLocaleDateString() : detail.startDate} → {detail.endDate instanceof Date ? detail.endDate.toLocaleDateString() : detail.endDate}</div>
=======
                <div className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> {detail.startDate} → {detail.endDate}</div>
>>>>>>> github/MANUS
              )}
              <div>
                <h3 className="text-sm font-semibold mb-2">Linked Test Cases ({detail.linkedTestCaseIds?.length ?? 0})</h3>
                {detail.linkedTestCaseIds?.length === 0
                  ? <p className="text-xs text-muted-foreground">No test cases linked. Go to Test Cases and assign them to this plan.</p>
                  : <div className="flex flex-wrap gap-1">{detail.linkedTestCaseIds?.map(id => <Badge key={id} variant="outline" className="font-mono text-xs">TC-{id}</Badge>)}</div>
                }
              </div>
              {detail.notes && <div className="bg-muted/30 rounded p-3 text-sm">{detail.notes}</div>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
