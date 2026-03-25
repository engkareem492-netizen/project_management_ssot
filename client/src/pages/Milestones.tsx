import { useState, useMemo } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Flag, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { StakeholderSelect } from "@/components/StakeholderSelect";
import { RegistrySelect } from "@/components/RegistrySelect";

const RAG_COLORS: Record<string, string> = {
  Green: "bg-green-100 text-green-800",
  Amber: "bg-yellow-100 text-yellow-800",
  Red: "bg-red-100 text-red-800",
};

const STATUS_COLORS: Record<string, string> = {
  "Upcoming": "bg-blue-100 text-blue-800",
  "In Progress": "bg-purple-100 text-purple-800",
  "Achieved": "bg-green-100 text-green-800",
  "Missed": "bg-red-100 text-red-800",
  "Deferred": "bg-gray-100 text-gray-700",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  "Upcoming": Clock,
  "In Progress": Flag,
  "Achieved": CheckCircle2,
  "Missed": AlertTriangle,
  "Deferred": Clock,
};

const EMPTY_FORM = {
  title: "", description: "", dueDate: "", completedDate: "",
  phase: "", owner: "", ragStatus: "Green" as "Green" | "Amber" | "Red",
  status: "Upcoming" as "Upcoming" | "In Progress" | "Achieved" | "Missed" | "Deferred",
  notes: "", linkedTaskId: "" as string,
};

export default function Milestones() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const { data: milestones = [], isLoading, refetch } = trpc.milestones.list.useQuery({ projectId }, { enabled });
  const { data: stakeholders = [] } = trpc.stakeholders.list.useQuery({ projectId }, { enabled });
  const { data: tasks = [] } = trpc.tasks.list.useQuery({ projectId }, { enabled });

  const create = trpc.milestones.create.useMutation({ onSuccess: () => { toast.success("Milestone created"); refetch(); setOpen(false); } });
  const update = trpc.milestones.update.useMutation({ onSuccess: () => { toast.success("Milestone updated"); refetch(); setOpen(false); } });
  const del = trpc.milestones.delete.useMutation({ onSuccess: () => { toast.success("Milestone deleted"); refetch(); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });

  const openNew = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setOpen(true); };
  const openEdit = (m: any) => {
    setEditing(m);
    setForm({
      title: m.title ?? "", description: m.description ?? "",
      dueDate: m.dueDate ? m.dueDate.substring(0, 10) : "",
      completedDate: m.completedDate ? m.completedDate.substring(0, 10) : "",
      phase: m.phase ?? "", owner: m.owner ?? "",
      ragStatus: m.ragStatus ?? "Green", status: m.status ?? "Upcoming", notes: m.notes ?? "",
      linkedTaskId: m.linkedTaskId ? String(m.linkedTaskId) : "",
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return toast.error("Title is required");
    const linkedTaskId = form.linkedTaskId ? parseInt(form.linkedTaskId) : undefined;
    if (editing) {
      update.mutate({ id: editing.id, ...form, dueDate: form.dueDate || undefined, completedDate: form.completedDate || undefined });
    } else {
      create.mutate({ projectId, ...form, dueDate: form.dueDate || undefined, linkedDeliverableIds: linkedTaskId ? [String(linkedTaskId)] : [] });
    }
  };

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const summary = useMemo(() => {
    const total = milestones.length;
    const achieved = milestones.filter((m: any) => m.status === "Achieved").length;
    const overdue = milestones.filter((m: any) => {
      if (!m.dueDate || m.status === "Achieved") return false;
      return new Date(m.dueDate) < new Date();
    }).length;
    const red = milestones.filter((m: any) => m.ragStatus === "Red").length;
    return { total, achieved, overdue, red };
  }, [milestones]);

  if (!currentProjectId) return <div className="p-6 text-muted-foreground">Select a project to view milestones.</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Flag className="w-6 h-6" /> Milestone Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">Formal project milestones with RAG status</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Milestone</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: summary.total, color: "text-foreground" },
          { label: "Achieved", value: summary.achieved, color: "text-green-600" },
          { label: "Overdue", value: summary.overdue, color: "text-red-600" },
          { label: "Red RAG", value: summary.red, color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
            <div className={`text-3xl font-bold mt-1 ${color}`}>{value}</div>
          </Card>
        ))}
      </div>

      {/* Timeline / Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : milestones.length === 0 ? (
        <Card className="p-12 text-center">
          <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No milestones yet. Add your first milestone.</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Linked Task</TableHead>
                <TableHead>RAG</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestones.map((m: any) => {
                const StatusIcon = STATUS_ICONS[m.status] ?? Clock;
                const isOverdue = m.dueDate && m.status !== "Achieved" && new Date(m.dueDate) < new Date();
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.milestoneId}</TableCell>
                    <TableCell className="font-medium">{m.title}</TableCell>
                    <TableCell>{m.phase ? <Badge variant="outline">{m.phase}</Badge> : "—"}</TableCell>
                    <TableCell className={isOverdue ? "text-red-600 font-semibold" : ""}>
                      {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "—"}
                      {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
                    </TableCell>
                    <TableCell>{m.owner || "—"}</TableCell>
                    <TableCell>
                      {m.linkedDeliverableIds && m.linkedDeliverableIds.length > 0 ? (
                        <Badge variant="outline" className="text-[10px] text-blue-700 border-blue-200 bg-blue-50">
                          {(tasks as any[]).find((t: any) => String(t.id) === m.linkedDeliverableIds[0])?.taskId ?? m.linkedDeliverableIds[0]}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={RAG_COLORS[m.ragStatus ?? "Green"] + " border-0"}>{m.ragStatus ?? "Green"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[m.status ?? "Upcoming"] + " flex items-center gap-1 w-fit"}>
                        <StatusIcon className="w-3 h-3" />{m.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(m)}><Pencil className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => del.mutate({ id: m.id })} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Milestone" : "New Milestone"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Milestone title..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phase</Label>
                <RegistrySelect
                  projectId={projectId}
                  domain="scope_items"
                  fieldKey="phase"
                  value={form.phase || ""}
                  onValueChange={v => set("phase", v)}
                  allowNone
                  noneLabel="— None —"
                  placeholder="Select phase"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Upcoming", "In Progress", "Achieved", "Missed", "Deferred"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
              </div>
              <div>
                <Label>Completed Date</Label>
                <Input type="date" value={form.completedDate} onChange={e => set("completedDate", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Owner</Label>
                <StakeholderSelect
                  stakeholders={stakeholders as any[]}
                  value={form.owner}
                  onValueChange={(v) => set("owner", v)}
                  projectId={projectId}
                />
              </div>
              <div>
                <Label>RAG Status</Label>
                <Select value={form.ragStatus} onValueChange={v => set("ragStatus", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Green", "Amber", "Red"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
            </div>
            <div>
              <Label>Linked Task</Label>
              <Select value={form.linkedTaskId || "__none__"} onValueChange={v => set("linkedTaskId", v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {(tasks as any[]).map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.taskId} — {(t.description ?? "").slice(0, 50)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
