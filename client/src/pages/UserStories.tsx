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
import { Plus, Pencil, Trash2, BookOpen, CheckSquare, User } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  Backlog: "bg-gray-500/20 text-gray-400",
  Ready: "bg-blue-500/20 text-blue-400",
  "In Progress": "bg-yellow-500/20 text-yellow-400",
  Done: "bg-green-500/20 text-green-400",
  Rejected: "bg-red-500/20 text-red-400",
};

const EMPTY_FORM = {
  featureId: undefined as number | undefined,
  title: "", asA: "", iWant: "", soThat: "", acceptanceCriteria: "",
  status: "Backlog", priority: "Medium", storyPoints: 0, notes: ""
};

export default function UserStoriesPage() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;
  const utils = trpc.useUtils();

  const { data: stories = [], isLoading } = trpc.userStories.list.useQuery(
    { projectId }, { enabled: projectId > 0 }
  );
  const { data: featuresList = [] } = trpc.features.list.useQuery(
    { projectId }, { enabled: projectId > 0 }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterFeature, setFilterFeature] = useState<string>("all");
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data: detail } = trpc.userStories.getById.useQuery(
    { id: detailId! }, { enabled: detailId !== null }
  );

  const createMut = trpc.userStories.create.useMutation({
    onSuccess: () => { utils.userStories.list.invalidate({ projectId }); toast.success("User story created"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.userStories.update.useMutation({
    onSuccess: () => { utils.userStories.list.invalidate({ projectId }); toast.success("User story updated"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.userStories.delete.useMutation({
    onSuccess: () => { utils.userStories.list.invalidate({ projectId }); toast.success("Story deleted"); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() { setEditId(null); setForm(EMPTY_FORM); setDialogOpen(true); }
  function openEdit(s: typeof stories[0]) {
    setEditId(s.id);
    setForm({
      featureId: s.featureId ?? undefined,
      title: s.title, asA: s.asA ?? "", iWant: s.iWant ?? "", soThat: s.soThat ?? "",
      acceptanceCriteria: s.acceptanceCriteria ?? "", status: s.status ?? "Backlog",
      priority: s.priority ?? "Medium", storyPoints: s.storyPoints ?? 0, notes: s.notes ?? ""
    });
    setDialogOpen(true);
  }
  function handleSave() {
    if (!form.title.trim()) return toast.error("Title is required");
    if (editId) updateMut.mutate({ id: editId, ...form, featureId: form.featureId ?? null });
    else createMut.mutate({ projectId, ...form });
  }

  const filtered = filterFeature === "all" ? stories : stories.filter(s => s.featureId === Number(filterFeature));

  if (!projectId) return <div className="p-8 text-muted-foreground">Select a project to view User Stories.</div>;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-green-400" /> User Stories</h1>
          <p className="text-sm text-muted-foreground mt-1">As a [role], I want [goal], so that [benefit] — linked to Requirements and Features</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterFeature} onValueChange={setFilterFeature}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Features" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Features</SelectItem>
              {featuresList.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.featureCode} — {f.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> New Story</Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-5 gap-3">
        {["Backlog","Ready","In Progress","Done","Rejected"].map(s => (
          <Card key={s} className="p-3">
            <div className="text-xs text-muted-foreground">{s}</div>
            <div className="text-2xl font-bold">{stories.filter(st => st.status === s).length}</div>
          </Card>
        ))}
      </div>

      {/* Stories Table */}
      {isLoading ? (
        <div className="text-muted-foreground">Loading stories...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No user stories yet. Click <strong>New Story</strong> to create the first one.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => {
            const feat = featuresList.find(f => f.id === s.featureId);
            return (
              <Card key={s.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setDetailId(s.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{s.storyCode}</span>
                        {feat && <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400">{feat.featureCode}</Badge>}
                      </div>
                      <p className="font-medium text-sm">{s.title}</p>
                      {s.asA && <p className="text-xs text-muted-foreground mt-0.5">As a <em>{s.asA}</em>{s.iWant ? `, I want ${s.iWant}` : ""}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      <Badge variant="outline" className={STATUS_COLORS[s.status ?? "Backlog"]}>{s.status}</Badge>
                      {s.storyPoints ? <Badge variant="outline" className="font-mono">{s.storyPoints} pts</Badge> : null}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Delete this story?")) deleteMut.mutate({ id: s.id }); }}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit User Story" : "New User Story"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Short story title" /></div>
            <div><Label>Feature (optional)</Label>
              <Select value={form.featureId ? String(form.featureId) : "none"} onValueChange={v => setForm(p => ({ ...p, featureId: v === "none" ? undefined : Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="No feature" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No feature</SelectItem>
                  {featuresList.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.featureCode} — {f.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted/20 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Story Format</p>
              <div><Label>As a…</Label><Input value={form.asA} onChange={e => setForm(p => ({ ...p, asA: e.target.value }))} placeholder="role / persona" /></div>
              <div><Label>I want…</Label><Textarea rows={2} value={form.iWant} onChange={e => setForm(p => ({ ...p, iWant: e.target.value }))} placeholder="goal or action" /></div>
              <div><Label>So that…</Label><Textarea rows={2} value={form.soThat} onChange={e => setForm(p => ({ ...p, soThat: e.target.value }))} placeholder="benefit or value" /></div>
            </div>
            <div><Label>Acceptance Criteria</Label><Textarea rows={3} value={form.acceptanceCriteria} onChange={e => setForm(p => ({ ...p, acceptanceCriteria: e.target.value }))} placeholder="Given / When / Then..." /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Backlog","Ready","In Progress","Done","Rejected"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Low","Medium","High","Critical"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Story Points</Label><Input type="number" min={0} value={form.storyPoints} onChange={e => setForm(p => ({ ...p, storyPoints: Number(e.target.value) }))} /></div>
            </div>
            <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editId ? "Save Changes" : "Create Story"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailId !== null} onOpenChange={open => { if (!open) setDetailId(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-400" />
              {detail?.storyCode} — {detail?.title}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={STATUS_COLORS[detail.status ?? "Backlog"]}>{detail.status}</Badge>
                <Badge variant="outline">{detail.priority}</Badge>
                {detail.storyPoints ? <Badge variant="outline" className="font-mono">{detail.storyPoints} pts</Badge> : null}
              </div>
              {(detail.asA || detail.iWant || detail.soThat) && (
                <div className="bg-muted/20 rounded-lg p-4 space-y-2 text-sm">
                  {detail.asA && <p><span className="text-muted-foreground">As a</span> <strong>{detail.asA}</strong></p>}
                  {detail.iWant && <p><span className="text-muted-foreground">I want</span> {detail.iWant}</p>}
                  {detail.soThat && <p><span className="text-muted-foreground">So that</span> {detail.soThat}</p>}
                </div>
              )}
              {detail.acceptanceCriteria && (
                <div>
                  <h3 className="text-sm font-semibold mb-1 flex items-center gap-1"><CheckSquare className="w-4 h-4" /> Acceptance Criteria</h3>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/20 rounded p-3">{detail.acceptanceCriteria}</pre>
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold mb-2">Linked Requirements ({detail.linkedRequirementIds?.length ?? 0})</h3>
                {detail.linkedRequirementIds?.length === 0
                  ? <p className="text-xs text-muted-foreground">No requirements linked yet.</p>
                  : <div className="flex flex-wrap gap-1">{detail.linkedRequirementIds?.map(id => <Badge key={id} variant="outline" className="font-mono text-xs">REQ-{id}</Badge>)}</div>
                }
              </div>
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
            <Button variant="outline" onClick={() => setDetailId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
