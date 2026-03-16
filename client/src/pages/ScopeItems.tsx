import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Plus, Trash2, Pencil, Crosshair, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";

const PHASES = ["Explore", "Prepare", "Realize", "Deploy", "Run"];
const PROCESS_AREAS = [
  "Financial Management",
  "Supply Chain",
  "Procurement",
  "Human Resources",
  "Project Management",
  "Sales",
  "Customer Service",
  "Analytics & Reporting",
  "Integration",
  "Security & Compliance",
  "Other",
];
const CATEGORIES = ["Configuration", "Development", "Data Migration", "Integration", "Testing", "Training", "Change Management", "Other"];
const STATUSES = ["Active", "In Scope", "Out of Scope", "Deferred", "Completed"];
const PRIORITIES = ["Critical", "High", "Medium", "Low"];

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "In Scope": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "Out of Scope": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Deferred: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  High: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

function emptyForm() {
  return {
    name: "",
    description: "",
    phase: "",
    processArea: "",
    category: "",
    status: "Active",
    priority: "Medium",
    notes: "",
  };
}

type ScopeItem = {
  id: number;
  projectId: number;
  idCode: string;
  name: string;
  description?: string | null;
  phase?: string | null;
  processArea?: string | null;
  category?: string | null;
  status?: string | null;
  priority?: string | null;
  notes?: string | null;
  createdAt?: Date | string | null;
};

function ScopeForm({
  form,
  onChange,
}: {
  form: ReturnType<typeof emptyForm>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Name *</Label>
        <Input
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Scope item name"
        />
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Detailed description"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Phase</Label>
          <Select value={form.phase || "__none__"} onValueChange={(v) => onChange("phase", v === "__none__" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— None —</SelectItem>
              {PHASES.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Process Area</Label>
          <Select value={form.processArea || "__none__"} onValueChange={(v) => onChange("processArea", v === "__none__" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— None —</SelectItem>
              {PROCESS_AREAS.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Category</Label>
          <Select value={form.category || "__none__"} onValueChange={(v) => onChange("category", v === "__none__" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— None —</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => onChange("status", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={(v) => onChange("priority", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          placeholder="Additional notes"
          rows={2}
        />
      </div>
    </div>
  );
}

export default function ScopeItems() {
  const { currentProjectId } = useProject();
  const utils = trpc.useUtils();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPhase, setFilterPhase] = useState("__all__");
  const [filterStatus, setFilterStatus] = useState("__all__");

  const { data: scopeItems = [], isLoading } = trpc.scopeItems.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const { data: allRequirements = [] } = trpc.requirements.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  // Detail / expand
  const [selectedItem, setSelectedItem] = useState<ScopeItem | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm());

  // Delete confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createMutation = trpc.scopeItems.create.useMutation({
    onSuccess: () => {
      utils.scopeItems.list.invalidate();
      setCreateOpen(false);
      setForm(emptyForm());
      toast.success("Scope item created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.scopeItems.update.useMutation({
    onSuccess: () => {
      utils.scopeItems.list.invalidate();
      setEditOpen(false);
      toast.success("Scope item updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.scopeItems.delete.useMutation({
    onSuccess: () => {
      utils.scopeItems.list.invalidate();
      setDeleteId(null);
      if (selectedItem?.id === deleteId) setSelectedItem(null);
      toast.success("Scope item deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  function handleFormChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleEditFormChange(key: string, value: string) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  function openEdit(item: ScopeItem) {
    setEditingId(item.id);
    setEditForm({
      name: item.name ?? "",
      description: item.description ?? "",
      phase: item.phase ?? "",
      processArea: item.processArea ?? "",
      category: item.category ?? "",
      status: item.status ?? "Active",
      priority: item.priority ?? "Medium",
      notes: item.notes ?? "",
    });
    setEditOpen(true);
  }

  const filtered = scopeItems.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.idCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.processArea?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPhase = filterPhase === "__all__" || item.phase === filterPhase;
    const matchesStatus = filterStatus === "__all__" || item.status === filterStatus;
    return matchesSearch && matchesPhase && matchesStatus;
  });

  // Group by phase for summary
  const phaseGroups = PHASES.reduce<Record<string, number>>((acc, p) => {
    acc[p] = scopeItems.filter((i) => i.phase === p).length;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Crosshair className="h-5 w-5 text-primary flex-shrink-0" />
          <h1 className="text-xl font-semibold truncate">Project Scope</h1>
          <Badge variant="secondary" className="flex-shrink-0">{scopeItems.length}</Badge>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyForm()); setCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New Scope Item
        </Button>
      </div>

      {/* Phase summary cards */}
      <div className="grid grid-cols-5 gap-2">
        {PHASES.map((phase) => (
          <Card
            key={phase}
            className={`cursor-pointer transition-colors hover:border-primary ${filterPhase === phase ? "border-primary" : ""}`}
            onClick={() => setFilterPhase((prev) => prev === phase ? "__all__" : phase)}
          >
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{phaseGroups[phase] ?? 0}</div>
              <div className="text-xs text-muted-foreground truncate">{phase}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search scope items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterPhase} onValueChange={setFilterPhase}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Phases</SelectItem>
            {PHASES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Crosshair}
              title="No scope items"
              description="Create scope items to organise requirements, test cases, and change requests under project phases and process areas."
              action={<Button size="sm" onClick={() => { setForm(emptyForm()); setCreateOpen(true); }}><Plus className="h-4 w-4 mr-1" />New Scope Item</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-28">Phase</TableHead>
                  <TableHead className="w-36 hidden md:table-cell">Process Area</TableHead>
                  <TableHead className="w-28 hidden lg:table-cell">Category</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-20 hidden sm:table-cell">Priority</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedItem(item)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{item.idCode}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="truncate font-medium">{item.name}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.phase ? (
                        <Badge variant="outline" className="text-xs truncate max-w-full">{item.phase}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="truncate block text-sm max-w-36">{item.processArea || "—"}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="truncate block text-sm max-w-28">{item.category || "—"}</span>
                    </TableCell>
                    <TableCell>
                      {item.status ? (
                        <Badge className={`text-xs ${STATUS_COLORS[item.status] ?? ""}`}>{item.status}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {item.priority ? (
                        <Badge className={`text-xs ${PRIORITY_COLORS[item.priority] ?? ""}`}>{item.priority}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </Card>

      {/* Detail panel */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-sm text-muted-foreground flex-shrink-0">{selectedItem.idCode}</span>
                <span className="truncate">{selectedItem.name}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              {selectedItem.description && (
                <p className="text-muted-foreground">{selectedItem.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {selectedItem.phase && <Badge variant="outline">{selectedItem.phase}</Badge>}
                {selectedItem.processArea && <Badge variant="outline">{selectedItem.processArea}</Badge>}
                {selectedItem.category && <Badge variant="outline">{selectedItem.category}</Badge>}
                {selectedItem.status && (
                  <Badge className={STATUS_COLORS[selectedItem.status] ?? ""}>{selectedItem.status}</Badge>
                )}
                {selectedItem.priority && (
                  <Badge className={PRIORITY_COLORS[selectedItem.priority] ?? ""}>{selectedItem.priority}</Badge>
                )}
              </div>
              {selectedItem.notes && (
                <div>
                  <p className="font-medium mb-1">Notes</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedItem.notes}</p>
                </div>
              )}
              {/* Linked Requirements */}
              {(() => {
                const linked = (allRequirements as any[]).filter((r: any) => r.scopeItemId === selectedItem.id);
                if (linked.length === 0) return null;
                return (
                  <div>
                    <p className="font-medium mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">Linked Requirements ({linked.length})</p>
                    <div className="flex flex-col gap-1">
                      {linked.map((r: any) => (
                        <div key={r.id} className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1">
                          <span className="font-mono text-muted-foreground shrink-0">{r.idCode}</span>
                          <span className="truncate">{r.description ?? '—'}</span>
                          {r.status && <Badge className="text-[10px] ml-auto shrink-0" variant="outline">{r.status}</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => { openEdit(selectedItem); setSelectedItem(null); }}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => { setDeleteId(selectedItem.id); setSelectedItem(null); }}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Scope Item</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-1">
            <ScopeForm form={form} onChange={handleFormChange} />
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              disabled={!form.name.trim() || createMutation.isPending}
              onClick={() => {
                if (!currentProjectId) return;
                createMutation.mutate({
                  projectId: currentProjectId,
                  name: form.name.trim(),
                  description: form.description || undefined,
                  phase: form.phase || undefined,
                  processArea: form.processArea || undefined,
                  category: form.category || undefined,
                  status: form.status || undefined,
                  priority: form.priority || undefined,
                  notes: form.notes || undefined,
                });
              }}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Scope Item</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-1">
            <ScopeForm form={editForm} onChange={handleEditFormChange} />
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              disabled={!editForm.name.trim() || updateMutation.isPending}
              onClick={() => {
                if (!editingId) return;
                updateMutation.mutate({
                  id: editingId,
                  data: {
                    name: editForm.name.trim(),
                    description: editForm.description || undefined,
                    phase: editForm.phase || undefined,
                    processArea: editForm.processArea || undefined,
                    category: editForm.category || undefined,
                    status: editForm.status || undefined,
                    priority: editForm.priority || undefined,
                    notes: editForm.notes || undefined,
                  },
                });
              }}
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scope Item</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this scope item. Requirements, test cases, and change requests linked to it will keep their reference but the scope item will no longer exist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId !== null && deleteMutation.mutate({ id: deleteId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
