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
import { Loader2, Plus, Pencil, Trash2, BookMarked, Search, ThumbsUp, TrendingUp, Lightbulb } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  Technical: "bg-blue-100 text-blue-800",
  Process: "bg-green-100 text-green-800",
  People: "bg-purple-100 text-purple-800",
  Commercial: "bg-yellow-100 text-yellow-800",
  Risk: "bg-red-100 text-red-800",
  Communication: "bg-orange-100 text-orange-800",
  Other: "bg-gray-100 text-gray-700",
};

const IMPACT_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low: "bg-gray-100 text-gray-700",
};

const EMPTY_FORM = {
  title: "",
  category: "Process" as "Technical" | "Process" | "People" | "Commercial" | "Risk" | "Communication" | "Other",
  phase: "",
  whatWentWell: "",
  whatToImprove: "",
  recommendation: "",
  impact: "Medium" as "Low" | "Medium" | "High",
  owner: "",
  dateRecorded: "",
  status: "Draft" as "Draft" | "Reviewed" | "Approved" | "Archived",
};

export default function LessonsLearned() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const { data: lessons = [], isLoading, refetch } = trpc.lessonsLearned.list.useQuery({ projectId }, { enabled });

  const create = trpc.lessonsLearned.create.useMutation({ onSuccess: () => { toast.success("Lesson recorded"); refetch(); setOpen(false); } });
  const update = trpc.lessonsLearned.update.useMutation({ onSuccess: () => { toast.success("Updated"); refetch(); setOpen(false); } });
  const del = trpc.lessonsLearned.delete.useMutation({ onSuccess: () => { toast.success("Deleted"); refetch(); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const openNew = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setOpen(true); };
  const openEdit = (l: any) => {
    setEditing(l);
    setForm({
      title: l.title ?? "", category: l.category ?? "Process", phase: l.phase ?? "",
      whatWentWell: l.whatWentWell ?? "", whatToImprove: l.whatToImprove ?? "",
      recommendation: l.recommendation ?? "", impact: l.impact ?? "Medium",
      owner: l.owner ?? "", dateRecorded: l.dateRecorded ? l.dateRecorded.substring(0, 10) : "",
      status: l.status ?? "Draft",
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (editing) {
      update.mutate({ id: editing.id, ...form, dateRecorded: form.dateRecorded || undefined });
    } else {
      create.mutate({ projectId, ...form, dateRecorded: form.dateRecorded || undefined });
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
          <Badge key={cat} className={CATEGORY_COLORS[cat] + " border-0 cursor-pointer text-sm"} onClick={() => setCatFilter(catFilter === cat ? "all" : cat)}>
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
            {["Technical", "Process", "People", "Commercial", "Risk", "Communication", "Other"].map(c => (
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{lesson.lessonId}</span>
                      <Badge className={CATEGORY_COLORS[lesson.category] + " border-0 text-xs"}>{lesson.category}</Badge>
                      <Badge className={IMPACT_COLORS[lesson.impact ?? "Medium"] + " border-0 text-xs"}>{lesson.impact} Impact</Badge>
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

      {/* Dialog */}
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
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => set("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Technical", "Process", "People", "Commercial", "Risk", "Communication", "Other"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Impact</Label>
                <Select value={form.impact} onValueChange={v => set("impact", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Low", "Medium", "High"].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Draft", "Reviewed", "Approved", "Archived"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Phase</Label>
                <Select value={form.phase || ""} onValueChange={v => set("phase", v)}>
                  <SelectTrigger><SelectValue placeholder="Select phase" /></SelectTrigger>
                  <SelectContent>
                    {["Initiation", "Planning", "Execution", "Closure", "Explore", "Realize", "Deploy"].map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Owner</Label>
                <Input value={form.owner} onChange={e => set("owner", e.target.value)} placeholder="Name..." />
              </div>
              <div>
                <Label>Date Recorded</Label>
                <Input type="date" value={form.dateRecorded} onChange={e => set("dateRecorded", e.target.value)} />
              </div>
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
