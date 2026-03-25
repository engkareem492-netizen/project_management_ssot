<<<<<<< HEAD
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
=======
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, Trash2, Pencil, Search, Loader2, BookOpen, Link2, Unlink,
  Layers, ChevronRight, X, Eye, CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUSES = ["New", "In Analysis", "In Development", "In Test", "Done", "Accepted", "Rejected"];
const PRIORITIES = ["Critical", "High", "Medium", "Low"];

const STATUS_COLORS: Record<string, string> = {
  New: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  "In Analysis": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "In Development": "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  "In Test": "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  Done: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Accepted: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  High: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

// ─── Empty form factory ──────────────────────────────────────────────────────

function emptyForm() {
  return {
    title: "",
    description: "",
    acceptanceCriteria: "",
    priority: "Medium",
    status: "New",
    storyPoints: "" as string | number,
    effortDays: "" as string | number,
    scopeItemId: null as number | null,
    assignedToId: null as number | null,
    processStep: "",
    businessRole: "",
    notes: "",
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function UserStories() {
  const { currentProject } = useProject();
  const projectId = currentProject?.id;
  const utils = trpc.useUtils();

  // ── State ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterScopeItem, setFilterScopeItem] = useState<number | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [form, setForm] = useState(emptyForm());
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkStory, setLinkStory] = useState<any>(null);
  const [reqSearchTerm, setReqSearchTerm] = useState("");
  const [linkTaskDialogOpen, setLinkTaskDialogOpen] = useState(false);
  const [linkTaskStory, setLinkTaskStory] = useState<any>(null);
  const [taskSearchTerm, setTaskSearchTerm] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewStory, setViewStory] = useState<any>(null);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: stories = [], isLoading } = trpc.userStories.list.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data: scopeItemsList = [] } = trpc.scopeItems.list.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data: stakeholderList = [] } = trpc.stakeholders.list.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data: requirementsList = [] } = trpc.requirements.list.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data: tasksList = [] } = trpc.tasks.list.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data: sprintsList = [] } = trpc.sprints.list.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  ).catch ? [] : [];

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMut = trpc.userStories.create.useMutation({
    onSuccess: () => {
      toast.success("User story created");
      utils.userStories.list.invalidate();
      setDialogOpen(false);
      setForm(emptyForm());
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.userStories.update.useMutation({
    onSuccess: () => {
      toast.success("User story updated");
      utils.userStories.list.invalidate();
      setDialogOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.userStories.delete.useMutation({
    onSuccess: () => {
      toast.success("User story deleted");
      utils.userStories.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const linkReqMut = trpc.userStories.linkRequirement.useMutation({
    onSuccess: () => {
      toast.success("Requirement linked");
      utils.userStories.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const unlinkReqMut = trpc.userStories.unlinkRequirement.useMutation({
    onSuccess: () => {
      toast.success("Requirement unlinked");
      utils.userStories.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const linkTaskMut = trpc.userStories.linkTask.useMutation({
    onSuccess: () => {
      toast.success("Task linked");
      utils.userStories.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const unlinkTaskMut = trpc.userStories.unlinkTask.useMutation({
    onSuccess: () => {
      toast.success("Task unlinked");
      utils.userStories.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const scopeItemMap = useMemo(
    () => new Map(scopeItemsList.map((s) => [s.id, s])),
    [scopeItemsList]
  );

  const filtered = useMemo(() => {
    return stories.filter((s) => {
      const matchSearch =
        !search ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.storyId.toLowerCase().includes(search.toLowerCase()) ||
        (s.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "All" || s.status === filterStatus;
      const matchScope =
        filterScopeItem === "all" || s.scopeItemId === filterScopeItem;
      return matchSearch && matchStatus && matchScope;
    });
  }, [stories, search, filterStatus, filterScopeItem]);

  function openCreate() {
    setEditMode(false);
    setSelectedStory(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(story: any) {
    setEditMode(true);
    setSelectedStory(story);
    setForm({
      title: story.title ?? "",
      description: story.description ?? "",
      acceptanceCriteria: story.acceptanceCriteria ?? "",
      priority: story.priority ?? "Medium",
      status: story.status ?? "New",
      storyPoints: story.storyPoints ?? "",
      effortDays: story.effortDays ?? "",
      scopeItemId: story.scopeItemId ?? null,
      assignedToId: story.assignedToId ?? null,
      processStep: story.processStep ?? "",
      businessRole: story.businessRole ?? "",
      notes: story.notes ?? "",
    });
    setDialogOpen(true);
  }

  function openView(story: any) {
    setViewStory(story);
    setViewDialogOpen(true);
  }

  function openLinkReqs(story: any) {
    setLinkStory(story);
    setReqSearchTerm("");
    setLinkDialogOpen(true);
  }

  function openLinkTasks(story: any) {
    setLinkTaskStory(story);
    setTaskSearchTerm("");
    setLinkTaskDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    const payload: any = {
      ...form,
      storyPoints: form.storyPoints !== "" ? Number(form.storyPoints) : null,
      effortDays: form.effortDays !== "" ? Number(form.effortDays) : null,
    };
    if (editMode && selectedStory) {
      updateMut.mutate({ id: selectedStory.id, data: payload });
    } else {
      createMut.mutate({ projectId: projectId!, ...payload });
    }
  }

  function handleDelete(story: any) {
    if (confirm(`Delete User Story "${story.storyId}: ${story.title}"?`)) {
      deleteMut.mutate({ id: story.id });
    }
  }

  // ── Filtered requirements for the link dialog ─────────────────────────────
  const linkedReqIds = useMemo(
    () => new Set((linkStory?.requirements ?? []).map((r: any) => r.id)),
    [linkStory]
  );

  const filteredReqs = useMemo(() => {
    if (!reqSearchTerm) return requirementsList;
    const q = reqSearchTerm.toLowerCase();
    return requirementsList.filter(
      (r: any) =>
        (r.idCode ?? "").toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q)
    );
  }, [requirementsList, reqSearchTerm]);

  const linkedTaskIds = useMemo(
    () => new Set((linkTaskStory?.linkedTasks ?? []).map((t: any) => t.id)),
    [linkTaskStory]
  );

  const filteredTasks = useMemo(() => {
    const topLevel = (tasksList as any[]).filter((t) => !t.parentTaskId);
    if (!taskSearchTerm) return topLevel;
    const q = taskSearchTerm.toLowerCase();
    return topLevel.filter(
      (t: any) =>
        (t.taskId ?? "").toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q)
    );
  }, [tasksList, taskSearchTerm]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            User Stories
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Agile user stories linked to scope items and requirements
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New User Story
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search stories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterScopeItem === "all" ? "all" : String(filterScopeItem)}
          onValueChange={(v) => setFilterScopeItem(v === "all" ? "all" : Number(v))}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Scope Items" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scope Items</SelectItem>
            {scopeItemsList.map((si) => (
              <SelectItem key={si.id} value={String(si.id)}>
                {si.idCode} – {si.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {["New", "In Development", "In Test", "Done"].map((s) => {
          const count = stories.filter((st) => st.status === s).length;
          return (
            <Card key={s} className="py-3 px-4">
              <p className="text-xs text-muted-foreground">{s}</p>
              <p className="text-2xl font-bold">{count}</p>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No user stories yet"
              description="Create user stories linked to scope items and requirements"
              icon={<BookOpen className="w-10 h-10 text-muted-foreground" />}
              action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />New User Story</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Scope Item</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-24">Priority</TableHead>
                  <TableHead className="w-20 text-center">Points</TableHead>
                  <TableHead className="w-24 text-center">Reqs</TableHead>
                  <TableHead className="w-24 text-center">Tasks</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((story) => {
                  const scopeItem = story.scopeItemId
                    ? scopeItemMap.get(story.scopeItemId)
                    : null;
                  return (
                    <TableRow key={story.id} className="hover:bg-primary/5">
                      <TableCell className="font-mono font-bold text-primary text-sm">
                        {story.storyId}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{story.title}</p>
                          {story.businessRole && (
                            <p className="text-xs text-muted-foreground">
                              Role: {story.businessRole}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {scopeItem ? (
                          <div>
                            <span className="text-xs font-mono text-muted-foreground">
                              {scopeItem.idCode}
                            </span>
                            <p className="text-sm font-medium truncate max-w-[160px]">
                              {scopeItem.name}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${STATUS_COLORS[story.status ?? "New"] ?? ""}`}
                        >
                          {story.status ?? "New"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${PRIORITY_COLORS[story.priority ?? "Medium"] ?? ""}`}
                        >
                          {story.priority ?? "Medium"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {story.storyPoints != null ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {story.storyPoints}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          onClick={() => openLinkReqs(story)}
                        >
                          <Link2 className="w-3 h-3" />
                          {story.requirements?.length ?? 0}
                        </button>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          className="inline-flex items-center gap-1 text-xs text-orange-600 hover:underline"
                          onClick={() => openLinkTasks(story)}
                        >
                          <CheckSquare className="w-3 h-3" />
                          {story.linkedTasks?.length ?? 0}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => openView(story)}
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => openLinkReqs(story)}
                            title="Link requirements"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => openLinkTasks(story)}
                            title="Link tasks"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => openEdit(story)}
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(story)}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Create / Edit Dialog ───────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {editMode ? "Edit User Story" : "New User Story"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                placeholder="As a [role], I want [goal] so that [benefit]"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            {/* Scope Item */}
            <div className="space-y-1.5">
              <Label>Scope Item</Label>
              <Select
                value={form.scopeItemId ? String(form.scopeItemId) : "__none__"}
                onValueChange={(v) =>
                  setForm({ ...form, scopeItemId: v === "__none__" ? null : Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scope item..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {scopeItemsList.map((si) => (
                    <SelectItem key={si.id} value={String(si.id)}>
                      {si.idCode} – {si.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
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
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
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
            </div>

            {/* Story Points + Effort */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Story Points</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g. 5"
                  value={form.storyPoints}
                  onChange={(e) => setForm({ ...form, storyPoints: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Effort (days)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  placeholder="e.g. 2.5"
                  value={form.effortDays}
                  onChange={(e) => setForm({ ...form, effortDays: e.target.value })}
                />
              </div>
            </div>

            {/* Business Role + Process Step */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Business Role</Label>
                <Input
                  placeholder="e.g. Procurement Manager"
                  value={form.businessRole}
                  onChange={(e) => setForm({ ...form, businessRole: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Process Step</Label>
                <Input
                  placeholder="e.g. Create Purchase Order"
                  value={form.processStep}
                  onChange={(e) => setForm({ ...form, processStep: e.target.value })}
                />
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              <Select
                value={form.assignedToId ? String(form.assignedToId) : "__none__"}
                onValueChange={(v) =>
                  setForm({ ...form, assignedToId: v === "__none__" ? null : Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Unassigned —</SelectItem>
                  {stakeholderList.map((st: any) => (
                    <SelectItem key={st.id} value={String(st.id)}>
                      {st.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Detailed description of the user story..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Acceptance Criteria */}
            <div className="space-y-1.5">
              <Label>Acceptance Criteria</Label>
              <Textarea
                placeholder="Given... When... Then...&#10;- Criterion 1&#10;- Criterion 2"
                rows={4}
                value={form.acceptanceCriteria}
                onChange={(e) => setForm({ ...form, acceptanceCriteria: e.target.value })}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMut.isPending || updateMut.isPending}
            >
              {(createMut.isPending || updateMut.isPending) && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {editMode ? "Save Changes" : "Create Story"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── View Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-mono text-primary">{viewStory?.storyId}</span>
              <span className="font-normal text-foreground">— {viewStory?.title}</span>
            </DialogTitle>
          </DialogHeader>
          {viewStory && (
            <div className="space-y-4 mt-3">
              <div className="flex flex-wrap gap-2">
                <Badge className={STATUS_COLORS[viewStory.status ?? "New"] ?? ""}>
                  {viewStory.status ?? "New"}
                </Badge>
                <Badge className={PRIORITY_COLORS[viewStory.priority ?? "Medium"] ?? ""}>
                  {viewStory.priority ?? "Medium"}
                </Badge>
                {viewStory.storyPoints != null && (
                  <Badge variant="outline">{viewStory.storyPoints} pts</Badge>
                )}
                {viewStory.effortDays != null && (
                  <Badge variant="outline">{viewStory.effortDays}d effort</Badge>
                )}
              </div>

              {viewStory.scopeItemName && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Scope Item
                  </p>
                  <p className="text-sm font-medium">
                    <span className="font-mono text-muted-foreground">
                      {viewStory.scopeItemCode}
                    </span>{" "}
                    {viewStory.scopeItemName}
                  </p>
                </div>
              )}

              {viewStory.businessRole && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Business Role</p>
                  <p className="text-sm">{viewStory.businessRole}</p>
                </div>
              )}
              {viewStory.processStep && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Process Step</p>
                  <p className="text-sm">{viewStory.processStep}</p>
                </div>
              )}

              {viewStory.description && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{viewStory.description}</p>
                </div>
              )}

              {viewStory.acceptanceCriteria && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Acceptance Criteria</p>
                  <div className="bg-muted/40 rounded p-3 text-sm whitespace-pre-wrap">
                    {viewStory.acceptanceCriteria}
                  </div>
                </div>
              )}

              {viewStory.requirements?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Linked Requirements ({viewStory.requirements.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {viewStory.requirements.map((r: any) => (
                      <Badge key={r.id} variant="secondary" className="font-mono text-xs">
                        {r.idCode}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {viewStory.linkedTasks?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Linked Tasks ({viewStory.linkedTasks.length})
                  </p>
                  <div className="space-y-1">
                    {viewStory.linkedTasks.map((t: any) => (
                      <div key={t.id} className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-xs text-orange-600 font-bold">{t.taskId}</span>
                        <span className="truncate text-foreground">{t.description}</span>
                        {t.status && (
                          <Badge variant="outline" className="text-[10px] ml-auto flex-shrink-0">{t.status}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button onClick={() => { setViewDialogOpen(false); if (viewStory) openEdit(viewStory); }}>
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Link Requirements Dialog ───────────────────────────────────────── */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              Link Requirements — {linkStory?.storyId}
            </DialogTitle>
          </DialogHeader>

          {/* Currently linked */}
          {(linkStory?.requirements?.length ?? 0) > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Currently Linked
              </p>
              <div className="flex flex-wrap gap-2">
                {linkStory?.requirements?.map((r: any) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 rounded text-xs font-mono text-blue-700 dark:text-blue-300"
                  >
                    {r.idCode}
                    <button
                      className="ml-1 text-blue-400 hover:text-red-500"
                      onClick={() =>
                        unlinkReqMut.mutate({
                          userStoryId: linkStory.id,
                          requirementId: r.id,
                        })
                      }
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <Separator className="mt-3" />
            </div>
          )}

          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search requirements..."
              value={reqSearchTerm}
              onChange={(e) => setReqSearchTerm(e.target.value)}
            />
          </div>

          <ScrollArea className="flex-1 mt-2 border rounded">
            <div className="p-1">
              {filteredReqs.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">No requirements found</p>
              ) : (
                filteredReqs.map((req: any) => {
                  const isLinked = linkedReqIds.has(req.id);
                  return (
                    <div
                      key={req.id}
                      className={`flex items-start gap-3 p-2.5 rounded hover:bg-muted/50 cursor-pointer ${isLinked ? "opacity-50" : ""}`}
                      onClick={() => {
                        if (!isLinked && linkStory) {
                          linkReqMut.mutate({
                            userStoryId: linkStory.id,
                            requirementId: req.id,
                            projectId: projectId!,
                          });
                        }
                      }}
                    >
                      <Checkbox checked={isLinked} readOnly className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-xs text-primary font-bold">{req.idCode}</span>
                        <p className="text-sm text-foreground truncate">{req.description}</p>
                        {req.status && (
                          <Badge variant="outline" className="text-[10px] mt-0.5">{req.status}</Badge>
                        )}
                      </div>
                      {!isLinked && (
                        <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-1" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end mt-3">
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Link Tasks Dialog ──────────────────────────────────────────────── */}
      <Dialog open={linkTaskDialogOpen} onOpenChange={setLinkTaskDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              Link Tasks — {linkTaskStory?.storyId}
            </DialogTitle>
          </DialogHeader>

          {/* Currently linked */}
          {(linkTaskStory?.linkedTasks?.length ?? 0) > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Currently Linked
              </p>
              <div className="flex flex-wrap gap-2">
                {linkTaskStory?.linkedTasks?.map((t: any) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/40 rounded text-xs font-mono text-orange-700 dark:text-orange-300"
                  >
                    {t.taskId}
                    <button
                      className="ml-1 text-orange-400 hover:text-red-500"
                      onClick={() =>
                        unlinkTaskMut.mutate({
                          userStoryId: linkTaskStory.id,
                          taskId: t.id,
                        })
                      }
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <Separator className="mt-3" />
            </div>
          )}

          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search tasks..."
              value={taskSearchTerm}
              onChange={(e) => setTaskSearchTerm(e.target.value)}
            />
          </div>

          <ScrollArea className="flex-1 mt-2 border rounded">
            <div className="p-1">
              {filteredTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">No tasks found</p>
              ) : (
                filteredTasks.map((task: any) => {
                  const isLinked = linkedTaskIds.has(task.id);
                  return (
                    <div
                      key={task.id}
                      className={`flex items-start gap-3 p-2.5 rounded hover:bg-muted/50 cursor-pointer ${isLinked ? "opacity-50" : ""}`}
                      onClick={() => {
                        if (!isLinked && linkTaskStory) {
                          linkTaskMut.mutate({
                            userStoryId: linkTaskStory.id,
                            taskId: task.id,
                            projectId: projectId!,
                          });
                        }
                      }}
                    >
                      <Checkbox checked={isLinked} readOnly className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-xs text-orange-600 font-bold">{task.taskId}</span>
                        <p className="text-sm text-foreground truncate">{task.description}</p>
                        {task.status && (
                          <Badge variant="outline" className="text-[10px] mt-0.5">{task.status}</Badge>
                        )}
                      </div>
                      {!isLinked && (
                        <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-1" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end mt-3">
            <Button variant="outline" onClick={() => setLinkTaskDialogOpen(false)}>Done</Button>
          </div>
>>>>>>> github/MANUS
        </DialogContent>
      </Dialog>
    </div>
  );
}
