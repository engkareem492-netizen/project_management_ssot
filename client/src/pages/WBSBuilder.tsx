import { useState, useMemo } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Layers,
  FolderOpen,
  FileText,
  Package,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
type WbsNode = {
  id: number;
  projectId: number;
  parentId: number | null;
  code: string;
  title: string;
  description: string | null;
  level: number;
  responsible: string | null;
  estimatedCost: string | null;
  actualCost: string | null;
  status: "Not Started" | "In Progress" | "Complete" | "On Hold";
  deliverableId: number | null;
  milestoneId: number | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type TreeNode = WbsNode & { children: TreeNode[] };

// ─── Helpers ────────────────────────────────────────────────────────────────
function buildTree(flat: WbsNode[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  for (const n of flat) map.set(n.id, { ...n, children: [] });
  const roots: TreeNode[] = [];
  for (const n of flat) {
    const node = map.get(n.id)!;
    if (n.parentId && map.has(n.parentId)) {
      map.get(n.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  // Sort by code
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    nodes.forEach(n => sort(n.children));
  };
  sort(roots);
  return roots;
}

const STATUS_COLORS: Record<string, string> = {
  "Not Started": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "Complete": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "On Hold": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const LEVEL_ICONS = [Layers, FolderOpen, FileText, Package];
const LEVEL_LABELS = ["Phase", "Deliverable", "Work Package", "Activity"];

// ─── WBS Node Row ────────────────────────────────────────────────────────────
function WbsRow({
  node,
  onAddChild,
  onEdit,
  onDelete,
  depth = 0,
}: {
  node: TreeNode;
  onAddChild: (parentId: number) => void;
  onEdit: (node: WbsNode) => void;
  onDelete: (id: number) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const Icon = LEVEL_ICONS[Math.min(node.level - 1, LEVEL_ICONS.length - 1)];

  return (
    <>
      <tr className="border-b border-border hover:bg-muted/30 transition-colors group">
        <td className="py-2 px-3">
          <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 20}px` }}>
            {node.children.length > 0 ? (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-muted-foreground hover:text-foreground w-4 h-4 flex items-center justify-center"
              >
                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            ) : (
              <span className="w-4" />
            )}
            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="font-mono text-xs text-muted-foreground w-12 shrink-0">{node.code}</span>
            <span className="font-medium text-sm text-foreground">{node.title}</span>
          </div>
        </td>
        <td className="py-2 px-3 text-xs text-muted-foreground hidden md:table-cell">
          {LEVEL_LABELS[Math.min(node.level - 1, LEVEL_LABELS.length - 1)]}
        </td>
        <td className="py-2 px-3 text-xs text-muted-foreground hidden lg:table-cell">
          {node.responsible || "—"}
        </td>
        <td className="py-2 px-3 text-xs text-muted-foreground hidden lg:table-cell">
          {node.estimatedCost ? `$${parseFloat(node.estimatedCost).toLocaleString()}` : "—"}
        </td>
        <td className="py-2 px-3">
          <Badge className={`text-xs px-1.5 py-0.5 ${STATUS_COLORS[node.status]}`} variant="outline">
            {node.status}
          </Badge>
        </td>
        <td className="py-2 px-3">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              title="Add child"
              onClick={() => onAddChild(node.id)}
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              title="Edit"
              onClick={() => onEdit(node)}
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive hover:text-destructive"
              title="Delete"
              onClick={() => onDelete(node.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </td>
      </tr>
      {expanded &&
        node.children.map(child => (
          <WbsRow
            key={child.id}
            node={child}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onDelete={onDelete}
            depth={depth + 1}
          />
        ))}
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
type FormState = {
  title: string;
  description: string;
  responsible: string;
  estimatedCost: string;
  status: "Not Started" | "In Progress" | "Complete" | "On Hold";
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  responsible: "",
  estimatedCost: "",
  status: "Not Started",
};

export default function WBSBuilder() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;
  const utils = trpc.useUtils();

  const { data: elements = [], isLoading } = trpc.wbs.list.useQuery(
    { projectId },
    { enabled }
  );

  const createMutation = trpc.wbs.create.useMutation({
    onSuccess: () => {
      toast.success("WBS element created");
      utils.wbs.list.invalidate({ projectId });
      setDialogOpen(false);
    },
    onError: () => toast.error("Failed to create WBS element"),
  });

  const updateMutation = trpc.wbs.update.useMutation({
    onSuccess: () => {
      toast.success("WBS element updated");
      utils.wbs.list.invalidate({ projectId });
      setDialogOpen(false);
    },
    onError: () => toast.error("Failed to update WBS element"),
  });

  const deleteMutation = trpc.wbs.delete.useMutation({
    onSuccess: (data) => {
      toast.success(`Deleted ${data?.deleted ?? 1} element(s)`);
      utils.wbs.list.invalidate({ projectId });
    },
    onError: () => toast.error("Failed to delete WBS element"),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<WbsNode | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const tree = useMemo(() => buildTree(elements as WbsNode[]), [elements]);

  // Summary stats
  const totalElements = elements.length;
  const complete = elements.filter((e: any) => e.status === "Complete").length;
  const inProgress = elements.filter((e: any) => e.status === "In Progress").length;
  const totalCost = elements.reduce((sum: number, e: any) => {
    return sum + (e.estimatedCost ? parseFloat(e.estimatedCost) : 0);
  }, 0);

  const openCreate = (pid: number | null = null) => {
    setEditingNode(null);
    setParentId(pid);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (node: WbsNode) => {
    setEditingNode(node);
    setParentId(null);
    setForm({
      title: node.title,
      description: node.description ?? "",
      responsible: node.responsible ?? "",
      estimatedCost: node.estimatedCost ?? "",
      status: node.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this element and all its children?")) return;
    deleteMutation.mutate({ id, projectId });
  };

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (editingNode) {
      updateMutation.mutate({ id: editingNode.id, ...form });
    } else {
      createMutation.mutate({ projectId, parentId, ...form });
    }
  };

  const parentLabel = useMemo(() => {
    if (!parentId) return "Root Level";
    const parent = (elements as WbsNode[]).find(e => e.id === parentId);
    return parent ? `${parent.code} — ${parent.title}` : "Root Level";
  }, [parentId, elements]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Work Breakdown Structure
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Hierarchical decomposition of project scope into manageable work packages.
          </p>
        </div>
        <Button onClick={() => openCreate(null)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Phase
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Elements", value: totalElements, color: "text-foreground" },
          { label: "Complete", value: complete, color: "text-green-500" },
          { label: "In Progress", value: inProgress, color: "text-blue-500" },
          { label: "Est. Total Cost", value: totalCost > 0 ? `$${totalCost.toLocaleString()}` : "—", color: "text-primary" },
        ].map(stat => (
          <Card key={stat.label} className="p-4">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* WBS Tree Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">WBS Hierarchy</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {elements.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No WBS elements yet</p>
              <p className="text-sm mt-1">Start by adding a Phase (top-level element)</p>
              <Button className="mt-4" onClick={() => openCreate(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Phase
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Element</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground hidden md:table-cell">Level</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground hidden lg:table-cell">Responsible</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground hidden lg:table-cell">Est. Cost</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                    <th className="py-2 px-3 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {tree.map(node => (
                    <WbsRow
                      key={node.id}
                      node={node}
                      onAddChild={openCreate}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingNode ? `Edit: ${editingNode.code} — ${editingNode.title}` : "Add WBS Element"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editingNode && (
              <div className="bg-muted/50 rounded-md px-3 py-2 text-sm text-muted-foreground">
                <span className="font-medium">Parent:</span> {parentLabel}
              </div>
            )}
            <div className="space-y-1">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Design Phase, Requirements Document"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                rows={2}
                placeholder="Brief description of this work element..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Responsible</Label>
                <Input
                  placeholder="Person or team"
                  value={form.responsible}
                  onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Estimated Cost (USD)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.estimatedCost}
                  onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={v => setForm(f => ({ ...f, status: v as FormState["status"] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Not Started", "In Progress", "Complete", "On Hold"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editingNode ? "Save Changes" : "Create Element"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
