import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import DashboardLayout from "@/components/DashboardLayout";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Building2, Globe, AlertTriangle, TrendingUp, Minus } from "lucide-react";
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

const IMPACT_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

const INFLUENCE_ICONS: Record<string, React.ReactNode> = {
  Positive: <TrendingUp className="h-3.5 w-3.5 text-green-500" />,
  Negative: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
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
  const { currentProject } = useProject();
  const projectId = currentProject?.id ?? 0;

  const { data: factors = [], isLoading, refetch } = trpc.eef.list.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );

  const createMutation = trpc.eef.create.useMutation({
    onSuccess: () => { refetch(); toast.success("EEF factor added"); setDialogOpen(false); setForm(EMPTY_FORM); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.eef.update.useMutation({
    onSuccess: () => { refetch(); toast.success("EEF factor updated"); setDialogOpen(false); setEditingId(null); setForm(EMPTY_FORM); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.eef.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("EEF factor deleted"); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState<"Internal" | "External">("Internal");

  const openAdd = (type: "Internal" | "External") => {
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

  const internalFactors = factors.filter((f) => f.type === "Internal");
  const externalFactors = factors.filter((f) => f.type === "External");

  const categories = form.type === "Internal" ? INTERNAL_CATEGORIES : EXTERNAL_CATEGORIES;

  const FactorTable = ({ items, type }: { items: EefFactor[]; type: "Internal" | "External" }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {type === "Internal" ? <Building2 className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
          <span>{items.length} factor{items.length !== 1 ? "s" : ""}</span>
        </div>
        <Button size="sm" onClick={() => openAdd(type)}>
          <Plus className="h-4 w-4 mr-1" /> Add {type} Factor
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <div className="flex justify-center mb-3">
            {type === "Internal" ? <Building2 className="h-10 w-10 opacity-30" /> : <Globe className="h-10 w-10 opacity-30" />}
          </div>
          <p className="font-medium">No {type} factors recorded</p>
          <p className="text-sm mt-1">
            {type === "Internal"
              ? "Document internal factors like culture, governance, infrastructure, and IT systems."
              : "Document external factors like market conditions, regulations, and economic trends."}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => openAdd(type)}>
            <Plus className="h-4 w-4 mr-1" /> Add First {type} Factor
          </Button>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Factor Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Influence</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">{f.category}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="max-w-xs">
                    <span className="text-sm text-muted-foreground line-clamp-2">
                      {f.description || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {f.impact && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${IMPACT_COLORS[f.impact]}`}>
                        {f.impact}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {f.influence && INFLUENCE_ICONS[f.influence]}
                      <span className="text-sm">{f.influence}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{f.source || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(f)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
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
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Enterprise Environmental Factors</h1>
          <p className="text-muted-foreground mt-1">
            Conditions not under the project team's control that influence, constrain, or direct the project.
            Defined in PMBOK 7th Edition as key inputs to project planning.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Internal Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{internalFactors.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {internalFactors.filter(f => f.impact === "High").length} high-impact
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Globe className="h-4 w-4" /> External Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{externalFactors.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {externalFactors.filter(f => f.impact === "High").length} high-impact
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> High-Impact Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">
                {factors.filter(f => f.impact === "High").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {factors.filter(f => f.influence === "Negative" && f.impact === "High").length} negative high-impact
              </p>
            </CardContent>
          </Card>
        </div>

        {/* PMBOK Context Card */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">PMBOK 7 Context</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p><strong>Internal EEFs</strong> include: organizational culture, governance frameworks, infrastructure, existing human resources, IT software, resource availability, and employee capability.</p>
            <p><strong>External EEFs</strong> include: marketplace conditions, social and cultural influences, regulatory environment, commercial databases, academic research, industry standards, financial considerations, and physical environmental elements.</p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "Internal" | "External")}>
          <TabsList>
            <TabsTrigger value="Internal" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Internal ({internalFactors.length})
            </TabsTrigger>
            <TabsTrigger value="External" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              External ({externalFactors.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="Internal" className="mt-4">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <FactorTable items={internalFactors} type="Internal" />
            )}
          </TabsContent>

          <TabsContent value="External" className="mt-4">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <FactorTable items={externalFactors} type="External" />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit EEF Factor" : `Add ${form.type} Factor`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "Internal" | "External", category: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Internal">Internal</SelectItem>
                    <SelectItem value="External">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category <span className="text-destructive">*</span></Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Factor Name <span className="text-destructive">*</span></Label>
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
                <Select value={form.impact} onValueChange={(v) => setForm({ ...form, impact: v as "High" | "Medium" | "Low" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Influence</Label>
                <Select value={form.influence} onValueChange={(v) => setForm({ ...form, influence: v as "Positive" | "Negative" | "Neutral" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Positive">Positive</SelectItem>
                    <SelectItem value="Negative">Negative</SelectItem>
                    <SelectItem value="Neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Source / Reference</Label>
              <Input
                placeholder="e.g. Government Regulation No. 123, PMO Policy v2"
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save Changes" : "Add Factor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete EEF Factor</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this environmental factor. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId, projectId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
