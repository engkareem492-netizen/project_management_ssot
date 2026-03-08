import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Loader2, Plus, Trash2, Lightbulb, Pencil, History, X } from "lucide-react";
import { toast } from "sonner";
import { ImportExportToolbar } from "@/components/ImportExportToolbar";
import { formatDate } from "@/lib/dateUtils";
import { EmptyState } from "@/components/EmptyState";

// ─── helpers ──────────────────────────────────────────────────────────────────
const NONE = "none";

function emptyForm() {
  return {
    description: "",
    categoryId: undefined as number | undefined,
    statusId: undefined as number | undefined,
    impactLevelId: undefined as number | undefined,
    ownerId: undefined as number | undefined,
    requirementId: undefined as number | undefined,
    taskId: undefined as number | undefined,
    notes: "",
  };
}

// ─── component ────────────────────────────────────────────────────────────────
export default function Assumptions() {
  const { currentProjectId } = useProject();
  const utils = trpc.useUtils();

  // ── list & search ──
  const [searchTerm, setSearchTerm] = useState("");
  const { data: assumptions = [], isLoading } = trpc.assumptions.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  // ── dropdown data ──
  const { data: categories = [] } = trpc.assumptions.categories.list.useQuery(
    { projectId: currentProjectId! }, { enabled: !!currentProjectId }
  );
  const { data: statuses = [] } = trpc.assumptions.statuses.list.useQuery(
    { projectId: currentProjectId! }, { enabled: !!currentProjectId }
  );
  const { data: impactLevels = [] } = trpc.assumptions.impactLevels.list.useQuery(
    { projectId: currentProjectId! }, { enabled: !!currentProjectId }
  );
  const { data: stakeholders = [] } = trpc.stakeholders.list.useQuery(
    { projectId: currentProjectId! }, { enabled: !!currentProjectId }
  );
  const { data: requirements = [] } = trpc.requirements.list.useQuery(
    { projectId: currentProjectId! }, { enabled: !!currentProjectId }
  );
  const { data: tasks = [] } = trpc.tasks.list.useQuery(
    { projectId: currentProjectId! }, { enabled: !!currentProjectId }
  );

  // ── create dialog ──
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // ── edit dialog ──
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm());

  // ── history panel ──
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyAssumptionId, setHistoryAssumptionId] = useState<number | null>(null);
  const { data: history = [], isLoading: historyLoading } = trpc.assumptions.getHistory.useQuery(
    { assumptionId: historyAssumptionId! },
    { enabled: !!historyAssumptionId }
  );

  // ── delete dialog ──
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── inline dropdown create states ──
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newStatusName, setNewStatusName] = useState("");
  const [newImpactName, setNewImpactName] = useState("");
  const [newStakeholder, setNewStakeholder] = useState({ fullName: "", email: "", position: "", role: "", job: "", phone: "" });

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [impactDialogOpen, setImpactDialogOpen] = useState(false);
  const [stakeholderDialogOpen, setStakeholderDialogOpen] = useState(false);
  // track which form triggered the stakeholder dialog ("create" | "edit")
  const [stakeholderDialogSource, setStakeholderDialogSource] = useState<"create" | "edit">("create");

  // ── mutations ──
  const createMutation = trpc.assumptions.create.useMutation({
    onSuccess: () => {
      utils.assumptions.list.invalidate();
      setCreateOpen(false);
      setForm(emptyForm());
      toast.success("Assumption created successfully");
    },
    onError: (e) => toast.error(`Create failed: ${e.message}`),
  });

  const updateMutation = trpc.assumptions.update.useMutation({
    onSuccess: () => {
      utils.assumptions.list.invalidate();
      setEditOpen(false);
      setEditingId(null);
      toast.success("Assumption updated successfully");
    },
    onError: (e) => toast.error(`Update failed: ${e.message}`),
  });

  const deleteMutation = trpc.assumptions.delete.useMutation({
    onSuccess: () => {
      utils.assumptions.list.invalidate();
      setDeleteOpen(false);
      setDeletingId(null);
      toast.success("Assumption deleted");
    },
    onError: (e) => toast.error(`Delete failed: ${e.message}`),
  });

  // inline dropdown mutations
  const createCategoryMutation = trpc.assumptions.categories.create.useMutation({
    onSuccess: (data: any) => {
      utils.assumptions.categories.list.invalidate();
      const id = data?.id;
      if (id) {
        if (stakeholderDialogSource === "edit") setEditForm((p) => ({ ...p, categoryId: id }));
        else setForm((p) => ({ ...p, categoryId: id }));
      }
      setCategoryDialogOpen(false);
      setNewCategoryName("");
      toast.success("Category created");
    },
    onError: (e) => toast.error(e.message),
  });

  const createStatusMutation = trpc.assumptions.statuses.create.useMutation({
    onSuccess: (data: any) => {
      utils.assumptions.statuses.list.invalidate();
      const id = data?.id;
      if (id) {
        if (stakeholderDialogSource === "edit") setEditForm((p) => ({ ...p, statusId: id }));
        else setForm((p) => ({ ...p, statusId: id }));
      }
      setStatusDialogOpen(false);
      setNewStatusName("");
      toast.success("Status created");
    },
    onError: (e) => toast.error(e.message),
  });

  const createImpactMutation = trpc.assumptions.impactLevels.create.useMutation({
    onSuccess: (data: any) => {
      utils.assumptions.impactLevels.list.invalidate();
      const id = data?.id;
      if (id) {
        if (stakeholderDialogSource === "edit") setEditForm((p) => ({ ...p, impactLevelId: id }));
        else setForm((p) => ({ ...p, impactLevelId: id }));
      }
      setImpactDialogOpen(false);
      setNewImpactName("");
      toast.success("Impact level created");
    },
    onError: (e) => toast.error(e.message),
  });

  const createStakeholderMutation = trpc.stakeholders.create.useMutation({
    onSuccess: (data: any) => {
      utils.stakeholders.list.invalidate();
      const id = data?.id ?? data?.insertId;
      if (id) {
        if (stakeholderDialogSource === "edit") setEditForm((p) => ({ ...p, ownerId: Number(id) }));
        else setForm((p) => ({ ...p, ownerId: Number(id) }));
      }
      setStakeholderDialogOpen(false);
      setNewStakeholder({ fullName: "", email: "", position: "", role: "", job: "", phone: "" });
      toast.success("Stakeholder created");
    },
    onError: (e) => toast.error(e.message),
  });

  // ── helpers ──
  const openEdit = (a: any) => {
    setEditingId(a.id);
    setEditForm({
      description: a.description ?? "",
      categoryId: a.categoryId ?? undefined,
      statusId: a.statusId ?? undefined,
      impactLevelId: a.impactLevelId ?? undefined,
      ownerId: a.ownerId ?? undefined,
      requirementId: a.requirementId ?? undefined,
      taskId: a.taskId ?? undefined,
      notes: a.notes ?? "",
    });
    setEditOpen(true);
  };

  const openHistory = (id: number) => {
    setHistoryAssumptionId(id);
    setHistoryOpen(true);
  };

  const filtered = assumptions.filter((a: any) =>
    a.assumptionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── form section renderer (shared between create and edit) ──
  function FormFields({
    data,
    set,
    source,
  }: {
    data: ReturnType<typeof emptyForm>;
    set: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyForm>>>;
    source: "create" | "edit";
  }) {
    return (
      <ScrollArea className="max-h-[65vh] pr-2">
        <div className="space-y-4 py-2">
          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={data.description}
              onChange={(e) => set((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe the assumption..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <Label>Category</Label>
              <div className="flex gap-2">
                <Select
                  value={data.categoryId?.toString() ?? NONE}
                  onValueChange={(v) => set((p) => ({ ...p, categoryId: v === NONE ? undefined : Number(v) }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {categories.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon"
                  onClick={() => { setStakeholderDialogSource(source); setCategoryDialogOpen(true); }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <div className="flex gap-2">
                <Select
                  value={data.statusId?.toString() ?? NONE}
                  onValueChange={(v) => set((p) => ({ ...p, statusId: v === NONE ? undefined : Number(v) }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {statuses.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon"
                  onClick={() => { setStakeholderDialogSource(source); setStatusDialogOpen(true); }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Impact Level */}
            <div>
              <Label>Impact Level</Label>
              <div className="flex gap-2">
                <Select
                  value={data.impactLevelId?.toString() ?? NONE}
                  onValueChange={(v) => set((p) => ({ ...p, impactLevelId: v === NONE ? undefined : Number(v) }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select impact" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {impactLevels.map((il: any) => <SelectItem key={il.id} value={il.id.toString()}>{il.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon"
                  onClick={() => { setStakeholderDialogSource(source); setImpactDialogOpen(true); }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Owner (Stakeholder) */}
            <div>
              <Label>Owner (Stakeholder)</Label>
              <div className="flex gap-2">
                <Select
                  value={data.ownerId?.toString() ?? NONE}
                  onValueChange={(v) => set((p) => ({ ...p, ownerId: v === NONE ? undefined : Number(v) }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {stakeholders.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon"
                  onClick={() => { setStakeholderDialogSource(source); setStakeholderDialogOpen(true); }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Linked Requirement */}
            <div>
              <Label>Linked Requirement</Label>
              <Select
                value={data.requirementId?.toString() ?? NONE}
                onValueChange={(v) => set((p) => ({ ...p, requirementId: v === NONE ? undefined : Number(v) }))}
              >
                <SelectTrigger><SelectValue placeholder="Select requirement" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {requirements.map((r: any) => (
                    <SelectItem key={r.id} value={r.id.toString()}>
                      {r.requirementId} — {r.title ?? r.description?.slice(0, 40)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Linked Task */}
            <div>
              <Label>Linked Task</Label>
              <Select
                value={data.taskId?.toString() ?? NONE}
                onValueChange={(v) => set((p) => ({ ...p, taskId: v === NONE ? undefined : Number(v) }))}
              >
                <SelectTrigger><SelectValue placeholder="Select task" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {tasks.map((t: any) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.taskId} — {t.title ?? t.description?.slice(0, 40)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={data.notes}
              onChange={(e) => set((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-gray-500" />
            Assumptions Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track project assumptions with full change history</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-yellow-700 border-yellow-300">{filtered.length} Assumptions</Badge>
          <Button onClick={() => setCreateOpen(true)} className="bg-gray-900 hover:bg-gray-800 text-white gap-2">
            <Plus className="w-4 h-4" /> Create New
          </Button>
          {currentProjectId && (
            <ImportExportToolbar
              module="assumptions"
              projectId={currentProjectId}
              onImportSuccess={() => {}}
            />
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by ID, description, owner, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Assumption ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Req.</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono font-medium">{a.assumptionId}</TableCell>
                    <TableCell className="max-w-xs truncate">{a.description || "—"}</TableCell>
                    <TableCell>{a.category || "—"}</TableCell>
                    <TableCell>
                      {a.status ? <Badge variant="outline">{a.status}</Badge> : "—"}
                    </TableCell>
                    <TableCell>{a.impactLevelId ? (impactLevels.find((il: any) => il.id === a.impactLevelId) as any)?.name ?? "—" : "—"}</TableCell>
                    <TableCell>{a.owner || "—"}</TableCell>
                    <TableCell>{a.requirementId ? (requirements.find((r: any) => r.id === a.requirementId) as any)?.requirementId ?? "—" : "—"}</TableCell>
                    <TableCell>{a.taskId ? (tasks.find((t: any) => t.id === a.taskId) as any)?.taskId ?? "—" : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(a)} title="Edit">
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openHistory(a.id)} title="History">
                          <History className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { setDeletingId(a.id); setDeleteOpen(true); }} title="Delete">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filtered.length === 0 && (
            <EmptyState
              icon={Lightbulb}
              title="No assumptions found"
              description='Click &quot;Create New&quot; to add an assumption.'
              actionLabel="Create Assumption"
              onAction={() => setCreateOpen(true)}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Create Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Assumption</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">Assumption ID will be auto-generated (e.g. ASM-001)</p>
          <FormFields data={form} set={setForm} source="create" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => currentProjectId && createMutation.mutate({ projectId: currentProjectId, ...form })}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Assumption"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Assumption</DialogTitle>
          </DialogHeader>
          <FormFields data={editForm} set={setEditForm} source="edit" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={() => editingId && updateMutation.mutate({ id: editingId, ...editForm })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── History Dialog ── */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><History className="w-4 h-4" /> Change History</DialogTitle>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No changes recorded yet.</p>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                {history.map((h: any) => (
                  <div key={h.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{h.changedByName ?? "System"}</span>
                      <span className="text-muted-foreground">{formatDate(h.changedAt)} {h.changedAt ? new Date(h.changedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      {Object.entries(h.changedFields as Record<string, { oldValue: any; newValue: any }>).map(([field, diff]) => (
                        <div key={field} className="text-sm grid grid-cols-3 gap-2">
                          <span className="font-medium capitalize">{field}</span>
                          <span className="text-red-500 line-through truncate">{String(diff.oldValue ?? "—")}</span>
                          <span className="text-green-600 truncate">{String(diff.newValue ?? "—")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assumption?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate({ id: deletingId })} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Inline: Create Category ── */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Create Category</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name</Label>
              <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g. Technical" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => currentProjectId && newCategoryName.trim() && createCategoryMutation.mutate({ projectId: currentProjectId, name: newCategoryName.trim() })}
                disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Inline: Create Status ── */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Create Status</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status Name</Label>
              <Input value={newStatusName} onChange={(e) => setNewStatusName(e.target.value)} placeholder="e.g. Active" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => currentProjectId && newStatusName.trim() && createStatusMutation.mutate({ projectId: currentProjectId, name: newStatusName.trim() })}
                disabled={!newStatusName.trim() || createStatusMutation.isPending}
              >
                {createStatusMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Inline: Create Impact Level ── */}
      <Dialog open={impactDialogOpen} onOpenChange={setImpactDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Create Impact Level</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Impact Level Name</Label>
              <Input value={newImpactName} onChange={(e) => setNewImpactName(e.target.value)} placeholder="e.g. High" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImpactDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => currentProjectId && newImpactName.trim() && createImpactMutation.mutate({ projectId: currentProjectId, name: newImpactName.trim() })}
                disabled={!newImpactName.trim() || createImpactMutation.isPending}
              >
                {createImpactMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Inline: Create Stakeholder ── */}
      <Dialog open={stakeholderDialogOpen} onOpenChange={setStakeholderDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Stakeholder / Owner</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={newStakeholder.fullName} onChange={(e) => setNewStakeholder({ ...newStakeholder, fullName: e.target.value })} placeholder="Enter full name..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input type="email" value={newStakeholder.email} onChange={(e) => setNewStakeholder({ ...newStakeholder, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={newStakeholder.phone} onChange={(e) => setNewStakeholder({ ...newStakeholder, phone: e.target.value })} placeholder="+1 234 567 8900" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Position</Label>
                <Input value={newStakeholder.position} onChange={(e) => setNewStakeholder({ ...newStakeholder, position: e.target.value })} placeholder="e.g. Project Sponsor" />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={newStakeholder.role} onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })} placeholder="e.g. Decision Maker" />
              </div>
            </div>
            <div>
              <Label>Job Title</Label>
              <Input value={newStakeholder.job} onChange={(e) => setNewStakeholder({ ...newStakeholder, job: e.target.value })} placeholder="e.g. Chief Risk Officer" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStakeholderDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => currentProjectId && newStakeholder.fullName.trim() && createStakeholderMutation.mutate({
                  projectId: currentProjectId,
                  fullName: newStakeholder.fullName.trim(),
                  email: newStakeholder.email.trim() || undefined,
                  position: newStakeholder.position.trim() || undefined,
                  role: newStakeholder.role.trim() || undefined,
                  job: newStakeholder.job.trim() || undefined,
                  phone: newStakeholder.phone.trim() || undefined,
                })}
                disabled={!newStakeholder.fullName.trim() || createStakeholderMutation.isPending}
              >
                {createStakeholderMutation.isPending ? "Creating..." : "Create Stakeholder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
