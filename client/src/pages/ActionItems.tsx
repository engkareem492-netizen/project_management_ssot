import { useState, useMemo } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, ListChecks, Search, CheckCircle2 } from "lucide-react";
import { StakeholderSelect } from "@/components/StakeholderSelect";

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-blue-100 text-blue-800",
  "In Progress": "bg-purple-100 text-purple-800",
  Done: "bg-green-100 text-green-800",
  Cancelled: "bg-gray-100 text-gray-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "bg-red-600 text-white",
  High: "bg-red-100 text-red-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low: "bg-gray-100 text-gray-700",
};

const EMPTY_FORM = {
  description: "", owner: "", dueDate: "",
  status: "Open" as "Open" | "In Progress" | "Done" | "Cancelled",
  priority: "Medium" as "Low" | "Medium" | "High" | "Critical",
  sourceType: "", sourceId: "", notes: "",
};

export default function ActionItems() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const { data: items = [], isLoading, refetch } = trpc.actionItems.list.useQuery({ projectId }, { enabled });
  const { data: meetings = [] } = trpc.meetings.listMeetings.useQuery({ projectId }, { enabled });
  const { data: stakeholders = [] } = trpc.stakeholders.list.useQuery({ projectId }, { enabled });

  const create = trpc.actionItems.create.useMutation({ onSuccess: () => { toast.success("Action item created"); refetch(); setOpen(false); } });
  const update = trpc.actionItems.update.useMutation({ onSuccess: () => { toast.success("Updated"); refetch(); setOpen(false); } });
  const del = trpc.actionItems.delete.useMutation({ onSuccess: () => { toast.success("Deleted"); refetch(); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const openNew = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setOpen(true); };
  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      description: item.description ?? "",
      owner: item.owner ?? "",
      dueDate: item.dueDate ? item.dueDate.substring(0, 10) : "",
      status: item.status ?? "Open",
      priority: item.priority ?? "Medium",
      sourceType: item.sourceType ?? "",
      sourceId: item.sourceId ?? "",
      notes: item.notes ?? "",
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.description.trim()) return toast.error("Description is required");
    if (editing) {
      update.mutate({ id: editing.id, ...form, dueDate: form.dueDate || undefined });
    } else {
      create.mutate({ projectId, ...form, dueDate: form.dueDate || undefined });
    }
  };

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const filtered = useMemo(() => items.filter((item: any) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (search && !item.description?.toLowerCase().includes(search.toLowerCase()) &&
        !item.owner?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [items, statusFilter, search]);

  const summary = useMemo(() => {
    const open = items.filter((i: any) => i.status === "Open").length;
    const inProgress = items.filter((i: any) => i.status === "In Progress").length;
    const done = items.filter((i: any) => i.status === "Done").length;
    const overdue = items.filter((i: any) => {
      if (!i.dueDate || i.status === "Done" || i.status === "Cancelled") return false;
      return new Date(i.dueDate) < new Date();
    }).length;
    return { open, inProgress, done, overdue };
  }, [items]);

  if (!currentProjectId) return <div className="p-6 text-muted-foreground">Select a project to view action items.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ListChecks className="w-6 h-6" /> Action Items</h1>
          <p className="text-muted-foreground text-sm mt-1">Track follow-up actions from meetings, decisions, and issues</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Action Item</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Open", value: summary.open, color: "text-blue-600" },
          { label: "In Progress", value: summary.inProgress, color: "text-purple-600" },
          { label: "Done", value: summary.done, color: "text-green-600" },
          { label: "Overdue", value: summary.overdue, color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
            <div className={`text-3xl font-bold mt-1 ${color}`}>{value}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["Open", "In Progress", "Done", "Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <ListChecks className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No action items yet.</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item: any) => {
                const isOverdue = item.dueDate && item.status !== "Done" && item.status !== "Cancelled" && new Date(item.dueDate) < new Date();
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{item.actionItemId}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex items-start gap-2">
                        {item.status === "Done" && <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />}
                        <span className={item.status === "Done" ? "line-through text-muted-foreground" : ""}>{item.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.owner || "—"}</TableCell>
                    <TableCell className={isOverdue ? "text-red-600 font-semibold" : ""}>
                      {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "—"}
                      {isOverdue && <div className="text-xs">Overdue</div>}
                    </TableCell>
                    <TableCell>
                      <Badge className={PRIORITY_COLORS[item.priority ?? "Medium"] + " border-0"}>{item.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[item.status ?? "Open"] + " border-0"}>{item.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.sourceType && (
                        <Badge variant="outline" className="text-xs">{item.sourceType}{item.sourceId ? ` · ${item.sourceId}` : ""}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Pencil className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => del.mutate({ id: item.id })} className="text-red-500 hover:text-red-700">
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
            <DialogTitle>{editing ? "Edit Action Item" : "New Action Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description *</Label>
              <Textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="What needs to be done..." />
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
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => set("priority", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Low", "Medium", "High", "Critical"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Open", "In Progress", "Done", "Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Source Type</Label>
                <Select value={form.sourceType || ""} onValueChange={v => set("sourceType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="decision">Decision</SelectItem>
                    <SelectItem value="issue">Issue</SelectItem>
                    <SelectItem value="risk">Risk</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Source Reference</Label>
                <Input value={form.sourceId} onChange={e => set("sourceId", e.target.value)} placeholder="e.g. MTG-0001" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
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
