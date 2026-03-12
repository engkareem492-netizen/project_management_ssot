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
import { Plus, Pencil, Trash2, Link2, BookOpen, Layers } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  Active: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Released: "bg-green-500/20 text-green-400 border-green-500/30",
  Deprecated: "bg-red-500/20 text-red-400 border-red-500/30",
};
const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-gray-500/20 text-gray-400",
  Medium: "bg-yellow-500/20 text-yellow-400",
  High: "bg-orange-500/20 text-orange-400",
  Critical: "bg-red-500/20 text-red-400",
};

const EMPTY_FORM = { title: "", description: "", status: "Draft", priority: "Medium", owner: "", notes: "" };

export default function FeaturesPage() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;
  const utils = trpc.useUtils();

  const { data: featuresList = [], isLoading } = trpc.features.list.useQuery(
    { projectId }, { enabled: projectId > 0 }
  );
  const { data: requirements = [] } = trpc.collaboration.getRequirements
    ? trpc.collaboration.getRequirements.useQuery({ projectId }, { enabled: projectId > 0 })
    : { data: [] };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data: detail } = trpc.features.getById.useQuery(
    { id: detailId! }, { enabled: detailId !== null }
  );

  const createMut = trpc.features.create.useMutation({
    onSuccess: () => { utils.features.list.invalidate({ projectId }); toast.success("Feature created"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.features.update.useMutation({
    onSuccess: () => { utils.features.list.invalidate({ projectId }); toast.success("Feature updated"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.features.delete.useMutation({
    onSuccess: () => { utils.features.list.invalidate({ projectId }); toast.success("Feature deleted"); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() { setEditId(null); setForm(EMPTY_FORM); setDialogOpen(true); }
  function openEdit(f: typeof featuresList[0]) {
    setEditId(f.id);
    setForm({ title: f.title, description: f.description ?? "", status: f.status ?? "Draft", priority: f.priority ?? "Medium", owner: f.owner ?? "", notes: f.notes ?? "" });
    setDialogOpen(true);
  }
  function handleSave() {
    if (!form.title.trim()) return toast.error("Title is required");
    if (editId) updateMut.mutate({ id: editId, ...form });
    else createMut.mutate({ projectId, ...form });
  }

  if (!projectId) return <div className="p-8 text-muted-foreground">Select a project to view Features.</div>;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Layers className="w-6 h-6 text-blue-400" /> Features</h1>
          <p className="text-sm text-muted-foreground mt-1">High-level product capabilities — group Requirements and User Stories under a Feature</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> New Feature</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {["Draft", "Active", "Released", "Deprecated"].map(s => (
          <Card key={s} className="p-3">
            <div className="text-xs text-muted-foreground">{s}</div>
            <div className="text-2xl font-bold">{featuresList.filter(f => f.status === s).length}</div>
          </Card>
        ))}
      </div>

      {/* Feature Cards */}
      {isLoading ? (
        <div className="text-muted-foreground">Loading features...</div>
      ) : featuresList.length === 0 ? (
        <Card className="p-12 text-center">
          <Layers className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No features yet. Click <strong>New Feature</strong> to create the first one.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {featuresList.map(f => (
            <Card key={f.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setDetailId(f.id)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground font-mono">{f.featureCode}</span>
                    <CardTitle className="text-base mt-0.5">{f.title}</CardTitle>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(f)}><Pencil className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Delete this feature?")) deleteMut.mutate({ id: f.id }); }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {f.description && <p className="text-sm text-muted-foreground line-clamp-2">{f.description}</p>}
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={STATUS_COLORS[f.status ?? "Draft"]}>{f.status}</Badge>
                  <Badge variant="outline" className={PRIORITY_COLORS[f.priority ?? "Medium"]}>{f.priority}</Badge>
                  {f.owner && <Badge variant="outline" className="text-xs">{f.owner}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Feature" : "New Feature"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. User Authentication" /></div>
            <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Draft","Active","Released","Deprecated"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Low","Medium","High","Critical"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Owner</Label><Input value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} placeholder="Feature owner name" /></div>
            <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editId ? "Save Changes" : "Create Feature"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailId !== null} onOpenChange={open => { if (!open) setDetailId(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              {detail?.featureCode} — {detail?.title}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="outline" className={STATUS_COLORS[detail.status ?? "Draft"]}>{detail.status}</Badge>
                <Badge variant="outline" className={PRIORITY_COLORS[detail.priority ?? "Medium"]}>{detail.priority}</Badge>
                {detail.owner && <Badge variant="outline">{detail.owner}</Badge>}
              </div>
              {detail.description && <p className="text-sm text-muted-foreground">{detail.description}</p>}
              {detail.notes && <div className="bg-muted/30 rounded p-3 text-sm">{detail.notes}</div>}

              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1"><BookOpen className="w-4 h-4" /> Linked Requirements ({detail.linkedRequirementIds?.length ?? 0})</h3>
                {detail.linkedRequirementIds?.length === 0
                  ? <p className="text-xs text-muted-foreground">No requirements linked. Go to Requirements page and link this feature.</p>
                  : <div className="flex flex-wrap gap-1">{detail.linkedRequirementIds?.map(id => <Badge key={id} variant="outline" className="font-mono text-xs">REQ-{id}</Badge>)}</div>
                }
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1"><Link2 className="w-4 h-4" /> User Stories ({detail.userStories?.length ?? 0})</h3>
                {detail.userStories?.length === 0
                  ? <p className="text-xs text-muted-foreground">No user stories assigned to this feature yet.</p>
                  : <div className="space-y-1">{detail.userStories?.map(us => (
                    <div key={us.id} className="flex items-center gap-2 text-sm bg-muted/20 rounded px-2 py-1">
                      <span className="font-mono text-xs text-muted-foreground">{us.storyCode}</span>
                      <span>{us.title}</span>
                      <Badge variant="outline" className="ml-auto text-xs">{us.status}</Badge>
                    </div>
                  ))}</div>
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
