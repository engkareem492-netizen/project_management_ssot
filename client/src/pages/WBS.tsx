import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Loader2, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Check, X, FolderTree, ArrowUp, ArrowDown, Link2, Unlink,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { RegistrySelect } from "@/components/RegistrySelect";

const STATUS_COLORS: Record<string, string> = {
  "Not Started": "bg-gray-100 text-gray-700 border-gray-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  "Complete":    "bg-green-50 text-green-700 border-green-200",
  "On Hold":     "bg-amber-50 text-amber-700 border-amber-200",
};

const EMPTY_FORM = {
  code: "", name: "", description: "", deliverable: "",
  responsible: "", status: "Not Started" as const,
  linkedTaskId: "" as string,
};

export default function WBS() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const { data: nodes = [], isLoading, refetch } = trpc.wbsNodes.list.useQuery({ projectId }, { enabled });
  const { data: tasks = [] } = trpc.tasks.list.useQuery({ projectId }, { enabled });
  const { data: stakeholders = [] } = trpc.stakeholders.list.useQuery({ projectId }, { enabled });
  const { data: deliverables = [] } = trpc.deliverables.list.useQuery({ projectId }, { enabled });

  const createNode = trpc.wbsNodes.create.useMutation({
    onSuccess: () => { refetch(); setShowAddDialog(false); setAddParentId(null); toast.success("WBS node added"); },
    onError: (e) => toast.error(e.message),
  });
  const updateNode = trpc.wbsNodes.update.useMutation({
    onSuccess: () => { refetch(); setEditingId(null); toast.success("WBS node updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteNode = trpc.wbsNodes.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("WBS node deleted"); },
  });

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addParentId, setAddParentId] = useState<number | null>(null);
  const [addForm, setAddForm] = useState({ ...EMPTY_FORM });

  // Build tree
  const nodeMap: Record<number, any> = {};
  (nodes as any[]).forEach(n => { nodeMap[n.id] = { ...n, children: [] }; });
  const roots: any[] = [];
  (nodes as any[]).forEach(n => {
    if (n.parentId && nodeMap[n.parentId]) nodeMap[n.parentId].children.push(nodeMap[n.id]);
    else roots.push(nodeMap[n.id]);
  });
  const sort = (arr: any[]) => arr.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0) || a.code.localeCompare(b.code));
  const sortTree = (arr: any[]) => { sort(arr); arr.forEach(n => sortTree(n.children)); };
  sortTree(roots);

  const taskLabel = (id: number | null) => {
    if (!id) return null;
    const t = (tasks as any[]).find((t: any) => t.id === id);
    return t ? `${t.taskId} — ${t.description?.slice(0, 40) ?? ""}` : `Task #${id}`;
  };

  const openAddDialog = (parentId: number | null) => {
    const parent = parentId ? nodeMap[parentId] : null;
    setAddParentId(parentId);
    setAddForm({ ...EMPTY_FORM, code: parent ? parent.code + "." : "" });
    setShowAddDialog(true);
  };

  const openEdit = (node: any) => {
    setEditingId(node.id);
    setEditForm({
      code: node.code,
      name: node.name,
      description: node.description ?? "",
      deliverable: node.deliverable ?? "",
      responsible: node.responsible ?? "",
      status: node.status ?? "Not Started",
      linkedTaskId: node.linkedTaskId ? String(node.linkedTaskId) : "",
    });
  };

  const renderNode = (node: any, depth: number, siblings: any[], idx: number): React.ReactNode => {
    const isExp = expanded[node.id] !== false;
    const hasChildren = node.children.length > 0;
    const isEditing = editingId === node.id;
    const linkedTask = taskLabel(node.linkedTaskId);

    return (
      <div key={node.id}>
        <div className={depth > 0 ? "ml-6 border-l-2 border-gray-200 pl-4" : ""}>
          <div className={`group rounded-xl border mb-1.5 transition-all ${
            isEditing ? "border-primary bg-primary/5 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
          }`}>
            {isEditing ? (
              <div className="p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Code</Label>
                    <Input className="h-7 text-xs mt-0.5" value={editForm.code} onChange={e => setEditForm(p => ({ ...p, code: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Name</Label>
                    <Input className="h-7 text-xs mt-0.5" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Deliverable</Label>
                    <Select value={editForm.deliverable || "__none__"} onValueChange={v => setEditForm(p => ({ ...p, deliverable: v === "__none__" ? "" : v }))}>
                      <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue placeholder="Link deliverable" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— None —</SelectItem>
                        {(deliverables as any[]).map((d: any) => (
                          <SelectItem key={d.id} value={d.name ?? d.title ?? String(d.id)}>{d.name ?? d.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Responsible</Label>
                    <Select value={editForm.responsible || "__none__"} onValueChange={v => setEditForm(p => ({ ...p, responsible: v === "__none__" ? "" : v }))}>
                      <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue placeholder="Select person" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— None —</SelectItem>
                        {(stakeholders as any[]).map((s: any) => (
                          <SelectItem key={s.id} value={s.fullName}>{s.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Status</Label>
                    <RegistrySelect projectId={projectId} domain="wbs" fieldKey="status"
                      value={editForm.status} onValueChange={v => setEditForm(p => ({ ...p, status: v as any }))}
                      size="sm" triggerClassName="mt-0.5" />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Linked Task</Label>
                    <Select value={editForm.linkedTaskId || "__none__"} onValueChange={v => setEditForm(p => ({ ...p, linkedTaskId: v === "__none__" ? "" : v }))}>
                      <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {(tasks as any[]).map((t: any) => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.taskId} — {(t.description ?? "").slice(0, 40)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Description</Label>
                  <Input className="h-7 text-xs mt-0.5" placeholder="Optional" value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="h-7 text-xs gap-1"
                    disabled={!editForm.code.trim() || !editForm.name.trim() || updateNode.isPending}
                    onClick={() => updateNode.mutate({
                      id: node.id,
                      code: editForm.code.trim(),
                      name: editForm.name.trim(),
                      description: editForm.description || undefined,
                      deliverable: editForm.deliverable || undefined,
                      responsible: editForm.responsible || undefined,
                      status: editForm.status,
                      linkedTaskId: editForm.linkedTaskId ? parseInt(editForm.linkedTaskId) : null,
                    })}>
                    {updateNode.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setEditingId(null)}>
                    <X className="w-3 h-3" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5">
                {/* Expand */}
                {hasChildren ? (
                  <button onClick={() => setExpanded(p => ({ ...p, [node.id]: !isExp }))} className="shrink-0 text-gray-400 hover:text-gray-600">
                    {isExp ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                ) : <span className="w-3.5 shrink-0" />}

                {/* Code */}
                <span className="font-mono text-xs text-muted-foreground shrink-0 w-14 truncate font-semibold">{node.code}</span>

                {/* Name */}
                <span className="text-sm font-semibold flex-1 truncate">{node.name}</span>

                {/* Deliverable */}
                {node.deliverable && (
                  <span className="text-xs text-muted-foreground truncate max-w-[120px] hidden md:block">{node.deliverable}</span>
                )}

                {/* Linked task badge */}
                {node.linkedTaskId && (
                  <Badge variant="outline" className="text-[10px] gap-1 shrink-0 border-blue-200 text-blue-700 bg-blue-50">
                    <Link2 className="w-2.5 h-2.5" />
                    {(tasks as any[]).find((t: any) => t.id === node.linkedTaskId)?.taskId ?? `#${node.linkedTaskId}`}
                  </Badge>
                )}

                {/* Status */}
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${STATUS_COLORS[node.status] ?? STATUS_COLORS["Not Started"]}`}>
                  {node.status}
                </span>

                {/* Actions (on hover) */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {idx > 0 && (
                    <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                      title="Move up"
                      onClick={() => updateNode.mutate({ id: node.id, sequence: (siblings[idx - 1].sequence ?? idx - 1) - 1 })}>
                      <ArrowUp className="w-3 h-3" />
                    </button>
                  )}
                  {idx < siblings.length - 1 && (
                    <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                      title="Move down"
                      onClick={() => updateNode.mutate({ id: node.id, sequence: (siblings[idx + 1].sequence ?? idx + 1) + 1 })}>
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  )}
                  <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-green-50 text-gray-400 hover:text-green-600"
                    title="Add child" onClick={() => openAddDialog(node.id)}>
                    <Plus className="w-3 h-3" />
                  </button>
                  <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                    title="Edit" onClick={() => openEdit(node)}>
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                    title="Delete" onClick={() => { if (confirm(`Delete "${node.name}"?`)) deleteNode.mutate({ id: node.id }); }}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Children */}
        {isExp && hasChildren && (
          <div>{node.children.map((child: any, ci: number) => renderNode(child, depth + 1, node.children, ci))}</div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FolderTree className="w-6 h-6 text-primary" />
              Work Breakdown Structure
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Hierarchical decomposition of project work. Each node can be linked to a Task.
            </p>
          </div>
          <Button onClick={() => openAddDialog(null)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Root Node
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_COLORS).map(([s, cls]) => (
            <span key={s} className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${cls}`}>{s}</span>
          ))}
          <span className="text-[11px] px-2 py-0.5 rounded-full border font-medium border-blue-200 text-blue-700 bg-blue-50 flex items-center gap-1">
            <Link2 className="w-2.5 h-2.5" /> Linked to Task
          </span>
        </div>

        {/* Tree */}
        <Card>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : roots.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-xl text-muted-foreground">
                <FolderTree className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No WBS nodes yet</p>
                <p className="text-xs mt-1 opacity-70">Click "Add Root Node" to start building your WBS.</p>
              </div>
            ) : (
              <div className="space-y-0">
                {roots.map((r, i) => renderNode(r, 0, roots, i))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Node Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{addParentId ? `Add Child under ${nodeMap[addParentId]?.code ?? ""}` : "Add Root WBS Node"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Code</Label>
                <Input className="mt-1" placeholder="e.g. 1.1" value={addForm.code} onChange={e => setAddForm(p => ({ ...p, code: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Name *</Label>
                <Input className="mt-1" placeholder="Work package name" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Deliverable</Label>
                <Select value={addForm.deliverable || "__none__"} onValueChange={v => setAddForm(p => ({ ...p, deliverable: v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Link deliverable" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {(deliverables as any[]).map((d: any) => (
                      <SelectItem key={d.id} value={d.name ?? d.title ?? String(d.id)}>{d.name ?? d.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Responsible</Label>
                <Select value={addForm.responsible || "__none__"} onValueChange={v => setAddForm(p => ({ ...p, responsible: v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select person" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {(stakeholders as any[]).map((s: any) => (
                      <SelectItem key={s.id} value={s.fullName}>{s.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Status</Label>
                <RegistrySelect projectId={projectId} domain="wbs" fieldKey="status"
                  value={addForm.status} onValueChange={v => setAddForm(p => ({ ...p, status: v as any }))}
                  className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Link to Task</Label>
                <Select value={addForm.linkedTaskId || "__none__"} onValueChange={v => setAddForm(p => ({ ...p, linkedTaskId: v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {(tasks as any[]).map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.taskId} — {(t.description ?? "").slice(0, 40)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input className="mt-1" placeholder="Optional description" value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button
              disabled={!addForm.code.trim() || !addForm.name.trim() || createNode.isPending}
              onClick={() => createNode.mutate({
                projectId,
                code: addForm.code.trim(),
                name: addForm.name.trim(),
                description: addForm.description || undefined,
                deliverable: addForm.deliverable || undefined,
                responsible: addForm.responsible || undefined,
                status: addForm.status,
                linkedTaskId: addForm.linkedTaskId ? parseInt(addForm.linkedTaskId) : undefined,
                parentId: addParentId ?? undefined,
              })}>
              {createNode.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Node
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
