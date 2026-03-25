// @ts-nocheck
import { useState, useMemo } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, BookMarked, Search, ThumbsUp, TrendingUp, Lightbulb, Settings2, X, Check } from "lucide-react";
import { StakeholderSelect } from "@/components/StakeholderSelect";

// Fallback badge colors for dynamic category values
const CAT_PALETTE = [
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-purple-100 text-purple-800",
  "bg-yellow-100 text-yellow-800",
  "bg-red-100 text-red-800",
  "bg-orange-100 text-orange-800",
  "bg-gray-100 text-gray-700",
  "bg-teal-100 text-teal-800",
  "bg-pink-100 text-pink-800",
  "bg-indigo-100 text-indigo-800",
];

function getCatColor(cat: string, allCats: string[]) {
  const idx = allCats.indexOf(cat);
  return CAT_PALETTE[idx % CAT_PALETTE.length] ?? "bg-gray-100 text-gray-700";
}

const IMPACT_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low: "bg-gray-100 text-gray-700",
};

function getImpactColor(impact: string) {
  return IMPACT_COLORS[impact] ?? "bg-gray-100 text-gray-700";
}

const EMPTY_FORM = {
  title: "",
  category: "",
  phase: "",
  whatWentWell: "",
  whatToImprove: "",
  recommendation: "",
  impact: "",
  owner: "",
  dateRecorded: "",
  status: "",
  linkedDocumentId: null as number | null,
};

type FieldType = "category" | "impact" | "status" | "phase";

// ─── Manage Dropdown Options Dialog ─────────────────────────────────────────
function ManageOptionsDialog({
  open,
  onClose,
  fieldType,
  label,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  fieldType: FieldType;
  label: string;
  projectId: number;
}) {
  const utils = trpc.useUtils();
  const { data: rows = [], refetch } = trpc.llDropdown.listByType.useQuery(
    { projectId, fieldType },
    { enabled: open }
  );
  const addMut = trpc.llDropdown.add.useMutation({
    onSuccess: () => { refetch(); utils.llDropdown.list.invalidate(); setNewVal(""); toast.success("Option added"); },
  });
  const updateMut = trpc.llDropdown.update.useMutation({
    onSuccess: () => { refetch(); utils.llDropdown.list.invalidate(); setEditingId(null); toast.success("Option updated"); },
  });
  const deleteMut = trpc.llDropdown.delete.useMutation({
    onSuccess: () => { refetch(); utils.llDropdown.list.invalidate(); toast.success("Option removed"); },
  });

  const [newVal, setNewVal] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");

  const startEdit = (id: number, val: string) => { setEditingId(id); setEditVal(val); };
  const confirmEdit = (id: number) => { if (editVal.trim()) updateMut.mutate({ id, value: editVal.trim() }); };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage {label} Options</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Existing options */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {rows.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No options yet. Add one below.</p>
            )}
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-2 group">
                {editingId === row.id ? (
                  <>
                    <Input
                      className="flex-1 h-8 text-sm"
                      value={editVal}
                      onChange={e => setEditVal(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") confirmEdit(row.id); if (e.key === "Escape") setEditingId(null); }}
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => confirmEdit(row.id)} disabled={updateMut.isPending}>
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm px-2 py-1 rounded border border-transparent group-hover:border-border bg-muted/30">{row.value}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => startEdit(row.id, row.value)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700" onClick={() => deleteMut.mutate({ id: row.id })} disabled={deleteMut.isPending}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add new */}
          <div className="flex gap-2 pt-2 border-t">
            <Input
              className="flex-1 h-8 text-sm"
              placeholder={`New ${label.toLowerCase()} option...`}
              value={newVal}
              onChange={e => setNewVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && newVal.trim()) addMut.mutate({ projectId, fieldType, value: newVal.trim() }); }}
            />
            <Button
              size="sm"
              onClick={() => { if (newVal.trim()) addMut.mutate({ projectId, fieldType, value: newVal.trim() }); }}
              disabled={!newVal.trim() || addMut.isPending}
            >
              {addMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Add
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dynamic Dropdown with Manage Button ─────────────────────────────────────
function DynamicSelect({
  label,
  fieldType,
  value,
  options,
  placeholder,
  onChange,
  projectId,
}: {
  label: string;
  fieldType: FieldType;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (v: string) => void;
  projectId: number;
}) {
  const [manageOpen, setManageOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label>{label}</Label>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          onClick={() => setManageOpen(true)}
          title={`Manage ${label} options`}
        >
          <Settings2 className="w-3 h-3" />
          Manage
        </button>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={placeholder ?? `Select ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
          {options.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">No options yet — click Manage to add</div>
          )}
        </SelectContent>
      </Select>
      <ManageOptionsDialog
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        fieldType={fieldType}
        label={label}
        projectId={projectId}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LessonsLearned() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const { data: lessons = [], isLoading, refetch } = trpc.lessonsLearned.list.useQuery({ projectId }, { enabled });
  const { data: stakeholders = [] } = trpc.stakeholders.list.useQuery({ projectId }, { enabled });
  const { data: allDocuments = [] } = trpc.documents.list.useQuery({ projectId }, { enabled });
  const { data: dropdownOptions } = trpc.llDropdown.list.useQuery({ projectId }, { enabled });

  const categories = dropdownOptions?.category ?? ["Technical", "Process", "People", "Commercial", "Risk", "Communication", "Other"];
  const impacts = dropdownOptions?.impact ?? ["Low", "Medium", "High"];
  const statuses = dropdownOptions?.status ?? ["Draft", "Reviewed", "Approved", "Archived"];
  const phases = dropdownOptions?.phase ?? ["Initiation", "Planning", "Execution", "Closure"];

  const create = trpc.lessonsLearned.create.useMutation({ onSuccess: () => { toast.success("Lesson recorded"); refetch(); setOpen(false); } });
  const update = trpc.lessonsLearned.update.useMutation({ onSuccess: () => { toast.success("Updated"); refetch(); setOpen(false); } });
  const del = trpc.lessonsLearned.delete.useMutation({ onSuccess: () => { toast.success("Deleted"); refetch(); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const openNew = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      category: categories[0] ?? "",
      impact: impacts.find(i => i === "Medium") ?? impacts[0] ?? "",
      status: statuses.find(s => s === "Draft") ?? statuses[0] ?? "",
    });
    setOpen(true);
  };

  const openEdit = (l: any) => {
    setEditing(l);
    setForm({
      title: l.title ?? "",
      category: l.category ?? categories[0] ?? "",
      phase: l.phase ?? "",
      whatWentWell: l.whatWentWell ?? "",
      whatToImprove: l.whatToImprove ?? "",
      recommendation: l.recommendation ?? "",
      impact: l.impact ?? impacts[0] ?? "",
      owner: l.owner ?? "",
      dateRecorded: l.dateRecorded ? l.dateRecorded.substring(0, 10) : "",
      status: l.status ?? statuses[0] ?? "",
      linkedDocumentId: l.linkedDocumentId ?? null,
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (editing) {
      update.mutate({ id: editing.id, ...form, dateRecorded: form.dateRecorded || undefined, linkedDocumentId: form.linkedDocumentId });
    } else {
      create.mutate({ projectId, ...form, dateRecorded: form.dateRecorded || undefined, linkedDocumentId: form.linkedDocumentId });
    }
  };

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const filtered = useMemo(() => lessons.filter((l: any) => {
    if (catFilter !== "all" && l.category !== catFilter) return false;
    if (search && !l.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [lessons, catFilter, search]);

  const byCat = useMemo(() => {
    const m: Record<string, number> = {};
    lessons.forEach((l: any) => { m[l.category] = (m[l.category] || 0) + 1; });
    return m;
  }, [lessons]);

  if (!currentProjectId) return <div className="p-6 text-muted-foreground">Select a project.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookMarked className="w-6 h-6" /> Lessons Learned</h1>
          <p className="text-muted-foreground text-sm mt-1">Capture insights to improve future phases and projects</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Record Lesson</Button>
      </div>

      {/* Category Summary */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(byCat).map(([cat, count]) => (
          <Badge
            key={cat}
            className={getCatColor(cat, categories) + " border-0 cursor-pointer text-sm"}
            onClick={() => setCatFilter(catFilter === cat ? "all" : cat)}
          >
            {cat}: {count}
          </Badge>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search lessons..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <BookMarked className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No lessons recorded yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((lesson: any) => (
            <Card key={lesson.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{lesson.lessonId}</span>
                      <Badge className={getCatColor(lesson.category, categories) + " border-0 text-xs"}>{lesson.category}</Badge>
                      <Badge className={getImpactColor(lesson.impact ?? "") + " border-0 text-xs"}>{lesson.impact} Impact</Badge>
                      <Badge variant="outline" className="text-xs">{lesson.status}</Badge>
                      {lesson.phase && <Badge variant="outline" className="text-xs">{lesson.phase}</Badge>}
                    </div>
                    <CardTitle className="text-base cursor-pointer" onClick={() => setExpandedId(expandedId === lesson.id ? null : lesson.id)}>
                      {lesson.title}
                    </CardTitle>
                    {lesson.owner && <p className="text-xs text-muted-foreground mt-1">Recorded by: {lesson.owner}{lesson.dateRecorded ? ` · ${new Date(lesson.dateRecorded).toLocaleDateString()}` : ""}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(lesson)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => del.mutate({ id: lesson.id })} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </CardHeader>
              {expandedId === lesson.id && (
                <CardContent className="space-y-4 border-t pt-4">
                  {lesson.whatWentWell && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-green-700 mb-1">
                        <ThumbsUp className="w-4 h-4" /> What Went Well
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lesson.whatWentWell}</p>
                    </div>
                  )}
                  {lesson.whatToImprove && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-orange-600 mb-1">
                        <TrendingUp className="w-4 h-4" /> What to Improve
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lesson.whatToImprove}</p>
                    </div>
                  )}
                  {lesson.recommendation && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-1">
                        <Lightbulb className="w-4 h-4" /> Recommendation
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lesson.recommendation}</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Lesson" : "Record Lesson Learned"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Brief title..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <DynamicSelect
                label="Category"
                fieldType="category"
                value={form.category}
                options={categories}
                onChange={v => set("category", v)}
                projectId={projectId}
              />
              <DynamicSelect
                label="Impact"
                fieldType="impact"
                value={form.impact}
                options={impacts}
                onChange={v => set("impact", v)}
                projectId={projectId}
              />
              <DynamicSelect
                label="Status"
                fieldType="status"
                value={form.status}
                options={statuses}
                onChange={v => set("status", v)}
                projectId={projectId}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <DynamicSelect
                label="Phase"
                fieldType="phase"
                value={form.phase}
                options={phases}
                placeholder="Select phase"
                onChange={v => set("phase", v)}
                projectId={projectId}
              />
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
                <Label>Date Recorded</Label>
                <Input type="date" value={form.dateRecorded} onChange={e => set("dateRecorded", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Link to Document</Label>
              <Select value={form.linkedDocumentId?.toString() ?? "none"} onValueChange={v => setForm(prev => ({ ...prev, linkedDocumentId: v === "none" ? null : parseInt(v) }))}>
                <SelectTrigger><SelectValue placeholder="Select a registered document (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked document</SelectItem>
                  {allDocuments.map((doc: any) => (
                    <SelectItem key={doc.id} value={doc.id.toString()}>
                      {doc.documentId} — {doc.originalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1"><ThumbsUp className="w-3 h-3 text-green-600" /> What Went Well</Label>
              <Textarea rows={3} value={form.whatWentWell} onChange={e => set("whatWentWell", e.target.value)} placeholder="Describe what worked well..." />
            </div>
            <div>
              <Label className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-orange-500" /> What to Improve</Label>
              <Textarea rows={3} value={form.whatToImprove} onChange={e => set("whatToImprove", e.target.value)} placeholder="What could have been done better..." />
            </div>
            <div>
              <Label className="flex items-center gap-1"><Lightbulb className="w-3 h-3 text-blue-600" /> Recommendation</Label>
              <Textarea rows={3} value={form.recommendation} onChange={e => set("recommendation", e.target.value)} placeholder="Actionable recommendation for the future..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Update" : "Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
