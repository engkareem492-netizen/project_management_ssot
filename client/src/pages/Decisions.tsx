import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Eye, Pencil, Trash2, CheckSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";

type DecisionStatus = "Open" | "Implemented" | "Deferred" | "Cancelled";

const STATUS_COLORS: Record<DecisionStatus, string> = {
  Open: "bg-blue-100 text-blue-700",
  Implemented: "bg-green-100 text-green-700",
  Deferred: "bg-yellow-100 text-yellow-700",
  Cancelled: "bg-gray-100 text-gray-600",
};

interface DecisionForm {
  title: string;
  description: string;
  decidedBy: string;
  decisionDate: string;
  status: DecisionStatus;
  impact: string;
  requirementId: string;
  taskId: string;
  issueId: string;
}

const emptyForm: DecisionForm = {
  title: "", description: "", decidedBy: "", decisionDate: "",
  status: "Open", impact: "", requirementId: "", taskId: "", issueId: "",
};

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return String(d); }
}

export default function Decisions() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<DecisionForm>(emptyForm);

  const utils = trpc.useUtils();

  const { data: decisions = [], isLoading } = trpc.meetings.listDecisions.useQuery(
    { projectId },
    { enabled: !!currentProjectId }
  );

  const createMutation = trpc.meetings.createDecision.useMutation({
    onSuccess: () => {
      utils.meetings.listDecisions.invalidate();
      setShowCreate(false);
      setForm(emptyForm);
      toast.success("Decision logged");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.meetings.updateDecision.useMutation({
    onSuccess: () => {
      utils.meetings.listDecisions.invalidate();
      setShowEdit(false);
      toast.success("Decision updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.meetings.deleteDecision.useMutation({
    onSuccess: () => {
      utils.meetings.listDecisions.invalidate();
      toast.success("Decision deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const selectedDecision = decisions.find((d) => d.id === selectedId);

  const filtered = decisions.filter((d) => {
    const matchSearch =
      !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.decidedBy ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.decisionId ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openEdit(d: typeof decisions[0]) {
    setSelectedId(d.id);
    setForm({
      title: d.title,
      description: d.description ?? "",
      decidedBy: d.decidedBy ?? "",
      decisionDate: d.decisionDate ? new Date(d.decisionDate).toISOString().split("T")[0] : "",
      status: (d.status as DecisionStatus) ?? "Open",
      impact: d.impact ?? "",
      requirementId: d.requirementId ?? "",
      taskId: d.taskId ?? "",
      issueId: d.issueId ?? "",
    });
    setShowEdit(true);
  }

  function handleCreate() {
    createMutation.mutate({
      projectId,
      title: form.title,
      description: form.description,
      decidedBy: form.decidedBy,
      decisionDate: form.decisionDate,
      status: form.status,
      impact: form.impact,
      requirementId: form.requirementId,
      taskId: form.taskId,
      issueId: form.issueId,
    });
  }

  function handleUpdate() {
    if (!selectedId) return;
    updateMutation.mutate({
      id: selectedId,
      title: form.title,
      description: form.description,
      decidedBy: form.decidedBy,
      decisionDate: form.decisionDate,
      status: form.status,
      impact: form.impact,
      requirementId: form.requirementId,
      taskId: form.taskId,
      issueId: form.issueId,
    });
  }

  if (!currentProjectId) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-muted-foreground">
        Select a project to view decisions.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-gray-500" />
            Decisions
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track key project decisions, owners, and impacts</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-indigo-700 border-indigo-300">{decisions.length} Total</Badge>
          <Button
            className="bg-gray-900 hover:bg-gray-800 text-white"
            onClick={() => { setForm(emptyForm); setShowCreate(true); }}
          >
            <Plus className="w-4 h-4 mr-1" /> New Decision
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search decisions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(["Open", "Implemented", "Deferred", "Cancelled"] as DecisionStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-28 font-semibold">ID</TableHead>
                <TableHead className="font-semibold">Title</TableHead>
                <TableHead className="w-28 font-semibold">Date</TableHead>
                <TableHead className="w-36 font-semibold">Decided By</TableHead>
                <TableHead className="w-32 font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Impact</TableHead>
                <TableHead className="w-28 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No decisions found
                  </TableCell>
                </TableRow>
              ) : filtered.map((d) => (
                <TableRow
                  key={d.id}
                  className="hover:bg-gray-50/60 cursor-pointer"
                  onClick={() => { setSelectedId(d.id); setShowView(true); }}
                >
                  <TableCell className="font-mono text-xs font-semibold text-indigo-700">{d.decisionId}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="font-medium text-sm truncate">{d.title}</div>
                    {d.description && (
                      <div className="text-xs text-muted-foreground truncate">{d.description}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(d.decisionDate)}</TableCell>
                  <TableCell className="text-sm">{d.decidedBy ?? "—"}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Badge className={`text-xs ${STATUS_COLORS[(d.status as DecisionStatus) ?? "Open"]}`}>
                      {d.status ?? "Open"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{d.impact ?? "—"}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedId(d.id); setShowView(true); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(d)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          if (confirm("Delete this decision?")) {
                            deleteMutation.mutate({ id: d.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* View Decision Dialog */}
      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Decision Details</DialogTitle></DialogHeader>
          {selectedDecision && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono font-bold text-indigo-700">{selectedDecision.decisionId}</span>
                <Badge className={STATUS_COLORS[(selectedDecision.status as DecisionStatus) ?? "Open"]}>
                  {selectedDecision.status}
                </Badge>
              </div>
              <h2 className="text-xl font-semibold">{selectedDecision.title}</h2>
              {selectedDecision.description && (
                <p className="text-muted-foreground text-sm">{selectedDecision.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-medium">Decided By:</span> {selectedDecision.decidedBy ?? "—"}</div>
                <div><span className="font-medium">Date:</span> {formatDate(selectedDecision.decisionDate)}</div>
                {selectedDecision.requirementId && (
                  <div><span className="font-medium">Requirement:</span> {selectedDecision.requirementId}</div>
                )}
                {selectedDecision.taskId && (
                  <div><span className="font-medium">Task:</span> {selectedDecision.taskId}</div>
                )}
                {selectedDecision.issueId && (
                  <div><span className="font-medium">Issue:</span> {selectedDecision.issueId}</div>
                )}
              </div>
              {selectedDecision.impact && (
                <div>
                  <span className="font-medium text-sm">Impact:</span>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{selectedDecision.impact}</p>
                </div>
              )}

              {/* Action Items (if field exists on decision) */}
              {Array.isArray((selectedDecision as any).actionItems) && (selectedDecision as any).actionItems.length > 0 && (
                <div>
                  <div className="font-medium text-sm mb-2">Action Items</div>
                  <div className="space-y-2">
                    {((selectedDecision as any).actionItems as Array<{ description: string; owner?: string; dueDate?: string; done?: boolean }>).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Checkbox
                          checked={item.done ?? false}
                          onCheckedChange={(checked) => {
                            const newItems = [...(selectedDecision as any).actionItems];
                            newItems[idx] = { ...item, done: !!checked };
                            updateMutation.mutate({ id: selectedDecision.id, actionItems: newItems });
                          }}
                        />
                        <div>
                          <div className="text-sm">{item.description}</div>
                          {(item.owner || item.dueDate) && (
                            <div className="text-xs text-muted-foreground">
                              {item.owner && <span>{item.owner}</span>}
                              {item.owner && item.dueDate && <span> · </span>}
                              {item.dueDate && <span>Due {formatDate(item.dueDate)}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowView(false)}>Close</Button>
            <Button
              className="bg-gray-900 hover:bg-gray-800 text-white"
              onClick={() => { setShowView(false); if (selectedDecision) openEdit(selectedDecision); }}
            >
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Decision Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Decision</DialogTitle></DialogHeader>
          <DecisionFormFields form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              className="bg-gray-900 hover:bg-gray-800 text-white"
              onClick={handleCreate}
              disabled={!form.title || createMutation.isPending}
            >
              {createMutation.isPending ? "Saving..." : "Log Decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Decision Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Decision</DialogTitle></DialogHeader>
          <DecisionFormFields form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button
              className="bg-gray-900 hover:bg-gray-800 text-white"
              onClick={handleUpdate}
              disabled={!form.title || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DecisionFormFields({
  form,
  setForm,
}: {
  form: DecisionForm;
  setForm: React.Dispatch<React.SetStateAction<DecisionForm>>;
}) {
  const set = (key: keyof DecisionForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="grid grid-cols-2 gap-4 py-2">
      <div className="col-span-2 space-y-1">
        <Label>Title *</Label>
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Decision title" />
      </div>
      <div className="col-span-2 space-y-1">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
      </div>
      <div className="space-y-1">
        <Label>Decided By</Label>
        <Input value={form.decidedBy} onChange={(e) => set("decidedBy", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Decision Date</Label>
        <Input type="date" value={form.decisionDate} onChange={(e) => set("decisionDate", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Status</Label>
        <Select value={form.status} onValueChange={(v) => set("status", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(["Open", "Implemented", "Deferred", "Cancelled"] as DecisionStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Linked Requirement ID</Label>
        <Input value={form.requirementId} onChange={(e) => set("requirementId", e.target.value)} placeholder="e.g. REQ-0001" />
      </div>
      <div className="col-span-2 space-y-1">
        <Label>Impact</Label>
        <Textarea value={form.impact} onChange={(e) => set("impact", e.target.value)} rows={2} placeholder="Describe the impact of this decision..." />
      </div>
      <div className="space-y-1">
        <Label>Linked Task ID</Label>
        <Input value={form.taskId} onChange={(e) => set("taskId", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Linked Issue ID</Label>
        <Input value={form.issueId} onChange={(e) => set("issueId", e.target.value)} />
      </div>
    </div>
  );
}
