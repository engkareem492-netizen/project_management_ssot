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
import { Loader2, Plus, Pencil, Trash2, Gauge, Search, Building2, Globe } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  Internal: "bg-blue-100 text-blue-800",
  External: "bg-purple-100 text-purple-800",
};

const IMPACT_COLORS: Record<string, string> = {
  Positive: "bg-green-100 text-green-800",
  Negative: "bg-red-100 text-red-800",
  Neutral: "bg-gray-100 text-gray-700",
};

const IMPACT_LEVEL_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low: "bg-gray-100 text-gray-700",
};

const EMPTY_FORM = {
  category: "Internal" as "Internal" | "External",
  type: "",
  description: "",
  impact: "Neutral" as "Positive" | "Negative" | "Neutral",
  impactLevel: "Medium" as "High" | "Medium" | "Low",
  owner: "",
  notes: "",
};

export default function EEF() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const { data: factors = [], isLoading, refetch } = trpc.eef.list.useQuery({ projectId }, { enabled });
  const create = trpc.eef.create.useMutation({ onSuccess: () => { toast.success("EEF factor added"); refetch(); setOpen(false); } });
  const update = trpc.eef.update.useMutation({ onSuccess: () => { toast.success("Updated"); refetch(); setOpen(false); } });
  const del = trpc.eef.delete.useMutation({ onSuccess: () => { toast.success("Deleted"); refetch(); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterImpact, setFilterImpact] = useState("All");

  const set = (k: keyof typeof EMPTY_FORM, v: string) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setOpen(true); };
  const openEdit = (f: any) => {
    setEditing(f);
    setForm({
      category: f.category,
      type: f.type,
      description: f.description ?? "",
      impact: f.impact ?? "Neutral",
      impactLevel: f.impactLevel ?? "Medium",
      owner: f.owner ?? "",
      notes: f.notes ?? "",
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.type.trim()) { toast.error("Type is required"); return; }
    if (editing) {
      update.mutate({ id: editing.id, projectId, ...form });
    } else {
      create.mutate({ projectId, ...form });
    }
  };

  const filtered = useMemo(() => {
    return factors.filter(f => {
      const matchSearch = !search || f.type.toLowerCase().includes(search.toLowerCase()) || (f.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = filterCategory === "All" || f.category === filterCategory;
      const matchImpact = filterImpact === "All" || f.impact === filterImpact;
      return matchSearch && matchCategory && matchImpact;
    });
  }, [factors, search, filterCategory, filterImpact]);

  const internalCount = factors.filter(f => f.category === "Internal").length;
  const externalCount = factors.filter(f => f.category === "External").length;
  const positiveCount = factors.filter(f => f.impact === "Positive").length;
  const negativeCount = factors.filter(f => f.impact === "Negative").length;

  if (!currentProjectId) {
    return <div className="p-6 text-muted-foreground">Please select a project first.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gauge className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Enterprise Environmental Factors</h1>
            <p className="text-sm text-muted-foreground">Internal and external factors that influence the project</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add EEF Factor
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{internalCount}</div>
                <div className="text-xs text-muted-foreground">Internal Factors</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{externalCount}</div>
                <div className="text-xs text-muted-foreground">External Factors</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">+</div>
              <div>
                <div className="text-2xl font-bold">{positiveCount}</div>
                <div className="text-xs text-muted-foreground">Positive Impact</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">−</div>
              <div>
                <div className="text-2xl font-bold">{negativeCount}</div>
                <div className="text-xs text-muted-foreground">Negative Impact</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search factors..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            <SelectItem value="Internal">Internal</SelectItem>
            <SelectItem value="External">External</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterImpact} onValueChange={setFilterImpact}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Impact" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Impacts</SelectItem>
            <SelectItem value="Positive">Positive</SelectItem>
            <SelectItem value="Negative">Negative</SelectItem>
            <SelectItem value="Neutral">Neutral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            EEF Factors
            <span className="ml-2 text-sm font-normal text-muted-foreground">({filtered.length} of {factors.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Gauge className="h-10 w-10 opacity-30" />
              <p className="text-sm">{factors.length === 0 ? "No EEF factors yet. Click \"Add EEF Factor\" to get started." : "No factors match the current filters."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground w-24">ID</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground w-28">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type / Factor</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground w-28">Impact</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground w-24">Level</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground w-36">Owner</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((factor, idx) => (
                    <tr key={factor.id} className={`border-b transition-colors hover:bg-muted/20 ${idx % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{factor.eefId}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${CATEGORY_COLORS[factor.category] ?? "bg-gray-100 text-gray-700"}`}>
                          {factor.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{factor.type}</div>
                        {factor.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{factor.description}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {factor.impact ? (
                          <Badge className={`text-xs ${IMPACT_COLORS[factor.impact] ?? "bg-gray-100 text-gray-700"}`}>
                            {factor.impact}
                          </Badge>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {factor.impactLevel ? (
                          <Badge className={`text-xs ${IMPACT_LEVEL_COLORS[factor.impactLevel] ?? "bg-gray-100 text-gray-700"}`}>
                            {factor.impactLevel}
                          </Badge>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm">{factor.owner ?? <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(factor)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => {
                            if (confirm("Delete this EEF factor?")) del.mutate({ id: factor.id, projectId });
                          }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit EEF Factor" : "Add EEF Factor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={v => set("category", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Internal">Internal</SelectItem>
                    <SelectItem value="External">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Impact Level</Label>
                <Select value={form.impactLevel} onValueChange={v => set("impactLevel", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Type / Factor Name *</Label>
              <Input value={form.type} onChange={e => set("type", e.target.value)} placeholder="e.g. Organizational Culture, Market Conditions..." />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the factor and its context..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Impact Direction</Label>
                <Select value={form.impact} onValueChange={v => set("impact", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Positive">Positive</SelectItem>
                    <SelectItem value="Negative">Negative</SelectItem>
                    <SelectItem value="Neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Owner / Responsible</Label>
                <Input value={form.owner} onChange={e => set("owner", e.target.value)} placeholder="Name..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Additional notes or mitigation strategies..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Save Changes" : "Add Factor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
