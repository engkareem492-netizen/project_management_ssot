import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, AlertTriangle, CheckCircle, Clock, Flame, Shield, Zap, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const LEVEL_LABELS: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
  1: { label: "Level 1 — Team", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <Shield className="h-3 w-3" /> },
  2: { label: "Level 2 — Management", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: <Zap className="h-3 w-3" /> },
  3: { label: "Level 3 — Executive", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <Flame className="h-3 w-3" /> },
};

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-red-500/20 text-red-400 border-red-500/30",
  "In Progress": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  Closed: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  level: 1,
  status: "Open",
  raisedBy: "",
  raisedAt: new Date().toISOString().slice(0, 10),
  dueDate: "",
  slaHours: undefined as number | undefined,
  notes: "",
};

export default function Escalations() {
  const { currentProjectId } = useProject();
  const utils = trpc.useUtils();
  const { data: escalations = [], isLoading } = trpc.escalations.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );
  const { data: stats } = trpc.escalations.stats.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const createMut = trpc.escalations.create.useMutation({
    onSuccess: () => { utils.escalations.list.invalidate(); utils.escalations.stats.invalidate(); setShowCreate(false); toast.success("Escalation created"); },
  });
  const updateMut = trpc.escalations.update.useMutation({
    onSuccess: () => { utils.escalations.list.invalidate(); utils.escalations.stats.invalidate(); setEditItem(null); toast.success("Escalation updated"); },
  });
  const deleteMut = trpc.escalations.delete.useMutation({
    onSuccess: () => { utils.escalations.list.invalidate(); utils.escalations.stats.invalidate(); toast.success("Escalation deleted"); },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");

  function openCreate() { setForm({ ...EMPTY_FORM }); setShowCreate(true); }
  function openEdit(item: any) {
    setForm({
      title: item.title ?? "",
      description: item.description ?? "",
      level: item.level ?? 1,
      status: item.status ?? "Open",
      raisedBy: item.raisedBy ?? "",
      raisedAt: item.raisedAt ?? new Date().toISOString().slice(0, 10),
      dueDate: item.dueDate ?? "",
      slaHours: item.slaHours ?? undefined,
      notes: item.notes ?? "",
    });
    setEditItem(item);
  }

  function handleSave() {
    if (!currentProjectId) return;
    if (editItem) {
      updateMut.mutate({ id: editItem.id, ...form });
    } else {
      createMut.mutate({ projectId: currentProjectId, ...form });
    }
  }

  const filtered = escalations.filter((e: any) => {
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    if (filterLevel !== "all" && String(e.level) !== filterLevel) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Escalations</h1>
            <p className="text-sm text-muted-foreground mt-1">Track and manage project escalations by level and SLA</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> New Escalation
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Escalations</div>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-400">{stats.open}</div>
                <div className="text-xs text-muted-foreground mt-1">Open</div>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-400">{stats.resolved}</div>
                <div className="text-xs text-muted-foreground mt-1">Resolved</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-400">{stats.slaCompliance}%</div>
                <div className="text-xs text-muted-foreground mt-1">SLA Compliance</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Level breakdown */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((lvl) => (
              <Card key={lvl} className="bg-card/50 border-border/50">
                <CardContent className="pt-4 flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${LEVEL_LABELS[lvl].color}`}>
                    {LEVEL_LABELS[lvl].icon} {LEVEL_LABELS[lvl].label}
                  </span>
                  <span className="text-xl font-bold ml-auto">{(stats.byLevel as any)[lvl] ?? 0}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="1">Level 1 — Team</SelectItem>
              <SelectItem value="2">Level 2 — Management</SelectItem>
              <SelectItem value="3">Level 3 — Executive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="bg-card/50 border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-40">Level</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-32">Raised By</TableHead>
                <TableHead className="w-28">Due Date</TableHead>
                <TableHead className="w-24">SLA (h)</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No escalations found
                </TableCell></TableRow>
              ) : filtered.map((e: any) => (
                <TableRow key={e.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs text-muted-foreground">{e.code}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{e.title}</div>
                    {e.description && <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{e.description}</div>}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${LEVEL_LABELS[e.level ?? 1]?.color}`}>
                      {LEVEL_LABELS[e.level ?? 1]?.icon}
                      {LEVEL_LABELS[e.level ?? 1]?.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[e.status] ?? ""}`}>{e.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.raisedBy || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.dueDate || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.slaHours ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(e)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMut.mutate({ id: e.id })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Floating Add Button */}
        <button
          onClick={openCreate}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
          title="New Escalation"
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* Create / Edit Dialog */}
        <Dialog open={showCreate || !!editItem} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditItem(null); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editItem ? `Edit ${editItem.code}` : "New Escalation"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Escalation title" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Level</Label>
                  <Select value={String(form.level)} onValueChange={(v) => setForm(f => ({ ...f, level: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Level 1 — Team</SelectItem>
                      <SelectItem value="2">Level 2 — Management</SelectItem>
                      <SelectItem value="3">Level 3 — Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Raised By</Label>
                  <Input value={form.raisedBy} onChange={(e) => setForm(f => ({ ...f, raisedBy: e.target.value }))} />
                </div>
                <div>
                  <Label>Raised Date</Label>
                  <Input type="date" value={form.raisedAt} onChange={(e) => setForm(f => ({ ...f, raisedAt: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div>
                  <Label>SLA Hours</Label>
                  <Input type="number" value={form.slaHours ?? ""} onChange={(e) => setForm(f => ({ ...f, slaHours: e.target.value ? Number(e.target.value) : undefined }))} placeholder="e.g. 48" />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreate(false); setEditItem(null); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.title || createMut.isPending || updateMut.isPending}>
                {editItem ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
