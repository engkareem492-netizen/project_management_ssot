<<<<<<< HEAD
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Globe,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
} from "lucide-react";
import { toast } from "sonner";

type EefFactor = {
  id: number;
  projectId: number;
  type: "Internal" | "External";
  category: string;
  name: string;
  description: string | null;
  impact: "High" | "Medium" | "Low" | null;
  influence: "Positive" | "Negative" | "Neutral" | null;
  source: string | null;
  notes: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

const IMPACT_BADGE: Record<string, string> = {
  High: "bg-red-100 text-red-700 border-red-300",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Low: "bg-green-100 text-green-700 border-green-300",
};

const INFLUENCE_ICON: Record<string, React.ReactNode> = {
  Positive: <TrendingUp className="h-3.5 w-3.5 text-green-600" />,
  Negative: <TrendingDown className="h-3.5 w-3.5 text-red-600" />,
  Neutral: <Minus className="h-3.5 w-3.5 text-gray-400" />,
};

const INTERNAL_CATEGORIES = [
  "Organizational Culture",
  "Governance Framework",
  "Infrastructure",
  "Human Resources",
  "IT Systems",
  "Financial Controls",
  "Policies & Procedures",
  "Stakeholder Risk Appetite",
  "Other",
];

const EXTERNAL_CATEGORIES = [
  "Market Conditions",
  "Regulatory / Legal",
  "Economic Factors",
  "Political Environment",
  "Social & Cultural",
  "Technology Trends",
  "Environmental / Sustainability",
  "Competitive Landscape",
  "Industry Standards",
  "Other",
];

const EMPTY_FORM = {
  type: "Internal" as "Internal" | "External",
  category: "",
  name: "",
  description: "",
  impact: "Medium" as "High" | "Medium" | "Low",
  influence: "Neutral" as "Positive" | "Negative" | "Neutral",
  source: "",
  notes: "",
};

export default function EEFPage() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;

  const { data: factors = [], isLoading, refetch } = trpc.eef.list.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );

  const createMutation = trpc.eef.create.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("EEF factor added");
      setDialogOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.eef.update.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("EEF factor updated");
      setDialogOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.eef.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("EEF factor deleted");
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeType, setActiveType] = useState<"All" | "Internal" | "External">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);

  const openAdd = (type: "Internal" | "External" = "Internal") => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, type });
    setDialogOpen(true);
  };

  const openEdit = (f: EefFactor) => {
    setEditingId(f.id);
    setForm({
      type: f.type,
      category: f.category,
      name: f.name,
      description: f.description ?? "",
      impact: f.impact ?? "Medium",
      influence: f.influence ?? "Neutral",
      source: f.source ?? "",
      notes: f.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.category.trim()) {
      toast.error("Name and Category are required");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, projectId, ...form });
    } else {
      createMutation.mutate({ projectId, ...form });
    }
  };

  const filtered = factors.filter((f) => {
    const matchType = activeType === "All" || f.type === activeType;
    const matchSearch =
      !searchTerm ||
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.description ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  const internalCount = factors.filter((f) => f.type === "Internal").length;
  const externalCount = factors.filter((f) => f.type === "External").length;
  const highImpactCount = factors.filter((f) => f.impact === "High").length;

  const categories = form.type === "Internal" ? INTERNAL_CATEGORIES : EXTERNAL_CATEGORIES;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-muted-foreground py-20">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Page Header — matches Issues/RiskRegister style */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="h-6 w-6 text-blue-600" />
            Enterprise Environmental Factors
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Conditions outside the team's control that influence, constrain, or direct the project (PMBOK 7)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-blue-700 border-blue-300">
            {factors.length} Factor{factors.length !== 1 ? "s" : ""}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInfoOpen(true)}
            className="text-gray-600"
          >
            <Info className="h-4 w-4 mr-1" /> PMBOK Context
          </Button>
          <Button size="sm" onClick={() => openAdd("Internal")}>
            <Plus className="h-4 w-4 mr-1" /> Add Factor
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-gray-200">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Internal
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="text-3xl font-bold text-gray-900">{internalCount}</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> External
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="text-3xl font-bold text-gray-900">{externalCount}</div>
          </CardContent>
        </Card>
        <Card className="border border-red-200 bg-red-50/40">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-xs font-medium text-red-600 uppercase tracking-wide">
              High Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="text-3xl font-bold text-red-600">{highImpactCount}</div>
=======
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
  linkedDocumentId: null as number | null,
};

export default function EEF() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const { data: factors = [], isLoading, refetch } = trpc.eef.list.useQuery({ projectId }, { enabled });
  const { data: allDocuments = [] } = trpc.documents.list.useQuery({ projectId }, { enabled });
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
      linkedDocumentId: f.linkedDocumentId ?? null,
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.type.trim()) { toast.error("Type is required"); return; }
    if (editing) {
      update.mutate({ id: editing.id, projectId, ...form, linkedDocumentId: form.linkedDocumentId });
    } else {
      create.mutate({ projectId, ...form, linkedDocumentId: form.linkedDocumentId });
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
>>>>>>> github/MANUS
          </CardContent>
        </Card>
      </div>

<<<<<<< HEAD
      {/* Filter + Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
          {(["All", "Internal", "External"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                activeType === t
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t === "All" ? `All (${factors.length})` : t === "Internal" ? `Internal (${internalCount})` : `External (${externalCount})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search factors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex gap-2 ml-auto">
          <Button size="sm" variant="outline" onClick={() => openAdd("Internal")}>
            <Building2 className="h-4 w-4 mr-1" /> Internal
          </Button>
          <Button size="sm" variant="outline" onClick={() => openAdd("External")}>
            <Globe className="h-4 w-4 mr-1" /> External
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Card className="border border-gray-200">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Globe className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-gray-700">No factors found</p>
              <p className="text-sm mt-1">
                {factors.length === 0
                  ? "Start by adding Internal or External environmental factors."
                  : "Try adjusting your search or filter."}
              </p>
              {factors.length === 0 && (
                <Button size="sm" className="mt-4" onClick={() => openAdd("Internal")}>
                  <Plus className="h-4 w-4 mr-1" /> Add First Factor
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-24">Type</TableHead>
                  <TableHead className="w-44">Category</TableHead>
                  <TableHead>Factor Name</TableHead>
                  <TableHead className="max-w-xs">Description</TableHead>
                  <TableHead className="w-24">Impact</TableHead>
                  <TableHead className="w-28">Influence</TableHead>
                  <TableHead className="w-36">Source</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          f.type === "Internal"
                            ? "text-purple-700 border-purple-300 bg-purple-50"
                            : "text-blue-700 border-blue-300 bg-blue-50"
                        }
                      >
                        {f.type === "Internal" ? (
                          <Building2 className="h-3 w-3 mr-1 inline" />
                        ) : (
                          <Globe className="h-3 w-3 mr-1 inline" />
                        )}
                        {f.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{f.category}</span>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{f.name}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500 line-clamp-2">
                        {f.description || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {f.impact && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${IMPACT_BADGE[f.impact]}`}
                        >
                          {f.impact}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        {f.influence && INFLUENCE_ICON[f.influence]}
                        {f.influence}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 truncate max-w-[140px]">
                      {f.source || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-500 hover:text-gray-900"
                          onClick={() => openEdit(f)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-600"
                          onClick={() => setDeleteId(f.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
=======
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
>>>>>>> github/MANUS
          )}
        </CardContent>
      </Card>

<<<<<<< HEAD
      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) {
            setEditingId(null);
            setForm(EMPTY_FORM);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit EEF Factor" : `Add ${form.type} EEF Factor`}
            </DialogTitle>
=======
      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit EEF Factor" : "Add EEF Factor"}</DialogTitle>
>>>>>>> github/MANUS
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
<<<<<<< HEAD
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm({ ...form, type: v as "Internal" | "External", category: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
=======
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={v => set("category", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
>>>>>>> github/MANUS
                  <SelectContent>
                    <SelectItem value="Internal">Internal</SelectItem>
                    <SelectItem value="External">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
<<<<<<< HEAD
                <Label>
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                Factor Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. PMO Governance Policy"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe how this factor affects the project..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Impact Level</Label>
                <Select
                  value={form.impact}
                  onValueChange={(v) =>
                    setForm({ ...form, impact: v as "High" | "Medium" | "Low" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
=======
                <Label>Impact Level</Label>
                <Select value={form.impactLevel} onValueChange={v => set("impactLevel", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
>>>>>>> github/MANUS
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
<<<<<<< HEAD
              <div className="space-y-1.5">
                <Label>Influence</Label>
                <Select
                  value={form.influence}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      influence: v as "Positive" | "Negative" | "Neutral",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
=======
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
>>>>>>> github/MANUS
                  <SelectContent>
                    <SelectItem value="Positive">Positive</SelectItem>
                    <SelectItem value="Negative">Negative</SelectItem>
                    <SelectItem value="Neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
<<<<<<< HEAD
            </div>

            <div className="space-y-1.5">
              <Label>Source / Reference</Label>
              <Input
                placeholder="e.g. Government Regulation No. 123"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes or mitigation considerations..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "Save Changes" : "Add Factor"}
=======
              <div className="space-y-1.5">
                <Label>Owner / Responsible</Label>
                <Input value={form.owner} onChange={e => set("owner", e.target.value)} placeholder="Name..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Additional notes or mitigation strategies..." rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Link to Document</Label>
              <Select value={form.linkedDocumentId?.toString() ?? "none"} onValueChange={v => setForm(f => ({ ...f, linkedDocumentId: v === "none" ? null : parseInt(v) }))}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Save Changes" : "Add Factor"}
>>>>>>> github/MANUS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
<<<<<<< HEAD

      {/* PMBOK Context Info Dialog */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>PMBOK 7 — Enterprise Environmental Factors</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-700 py-2">
            <div>
              <p className="font-semibold text-purple-700 mb-1 flex items-center gap-1.5">
                <Building2 className="h-4 w-4" /> Internal EEFs
              </p>
              <p>
                Organizational culture, governance frameworks, infrastructure, existing human
                resources, IT software, resource availability, and employee capability.
              </p>
            </div>
            <div>
              <p className="font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                <Globe className="h-4 w-4" /> External EEFs
              </p>
              <p>
                Marketplace conditions, social and cultural influences, regulatory environment,
                commercial databases, academic research, industry standards, financial
                considerations, and physical environmental elements.
              </p>
            </div>
            <p className="text-xs text-gray-400 border-t pt-3">
              Source: PMBOK® Guide — Seventh Edition, Section 2.2
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete EEF Factor</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this environmental factor. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteId && deleteMutation.mutate({ id: deleteId, projectId })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
=======
>>>>>>> github/MANUS
    </div>
  );
}
