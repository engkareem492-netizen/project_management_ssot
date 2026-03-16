import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, Search, Users, Mail, Phone,
  Target, Award, Activity, UserCheck, Briefcase,
  MoveRight, ChevronRight, ClipboardList,
} from "lucide-react";
import { ImportExportToolbar } from "@/components/ImportExportToolbar";
import { StakeholderSelect } from "@/components/StakeholderSelect";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/dateUtils";

// ─── Types ────────────────────────────────────────────────────────────────────
type Classification = "TeamMember" | "External" | "Stakeholder";

type StakeholderFormData = {
  fullName: string;
  email: string;
  position: string;
  role: string;
  job: string;
  phone: string;
  department: string;
  classification: Classification;
  isInternalTeam: boolean;
  isPooledResource: boolean;
  workingHoursPerDay: string;
  workingDaysPerWeek: number;
  stakeholderManagerId: number | null;
  externalPartyId: number | null;
  powerLevel: number;
  interestLevel: number;
  engagementStrategy: string;
  currentEngagementStatus: string;
  desiredEngagementStatus: string;
  communicationFrequency: string;
  communicationChannel: string;
  communicationMessage: string;
  communicationResponsible: string;
  communicationResponsibleId: number | null;
  notes: string;
  costPerHour: string;
  costPerDay: string;
};

const EMPTY_FORM: StakeholderFormData = {
  fullName: "",
  email: "",
  position: "",
  role: "",
  job: "",
  phone: "",
  department: "",
  classification: "Stakeholder",
  isInternalTeam: false,
  isPooledResource: false,
  workingHoursPerDay: "8",
  workingDaysPerWeek: 5,
  stakeholderManagerId: null,
  externalPartyId: null,
  powerLevel: 3,
  interestLevel: 3,
  engagementStrategy: "Manage Closely", // default: power=3, interest=3 → Manage Closely (Mendelow)
  currentEngagementStatus: "",
  desiredEngagementStatus: "",
  communicationFrequency: "",
  communicationChannel: "",
  communicationMessage: "",
  communicationResponsible: "",
  communicationResponsibleId: null,
  notes: "",
  costPerHour: "",
  costPerDay: "",
};

const ENGAGEMENT_STRATEGIES = ["Manage Closely", "Keep Satisfied", "Keep Informed", "Monitor"];
const ENGAGEMENT_STATUSES = ["Unaware", "Resistant", "Neutral", "Supportive", "Leading"];
const COMM_FREQUENCIES = ["Daily", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "As needed"];
const COMM_CHANNELS = ["Email", "Meeting", "Phone", "Slack", "Teams", "Report", "Newsletter"];

// Auto-propose engagement strategy using the Mendelow Power-Interest Matrix
function proposeEngagementStrategy(power: number, interest: number): string {
  const highPower = power >= 3;
  const highInterest = interest >= 3;
  if (highPower && highInterest) return "Manage Closely";   // High Power, High Interest
  if (highPower && !highInterest) return "Keep Satisfied";  // High Power, Low Interest
  if (!highPower && highInterest) return "Keep Informed";   // Low Power, High Interest
  return "Monitor";                                         // Low Power, Low Interest
}

function classificationToIsInternal(c: Classification): boolean {
  return c === "TeamMember";
}

function getClassificationBadge(classification: string | null | undefined) {
  if (classification === "TeamMember") {
    return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Team Member</Badge>;
  }
  if (classification === "External") {
    return <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">External</Badge>;
  }
  return <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Stakeholder</Badge>;
}

function getEngagementBadgeClass(strategy: string | null | undefined) {
  const map: Record<string, string> = {
    "Manage Closely": "bg-red-100 text-red-700 border-red-200",
    "Keep Satisfied": "bg-orange-100 text-orange-700 border-orange-200",
    "Keep Informed": "bg-blue-100 text-blue-700 border-blue-200",
    "Monitor": "bg-gray-100 text-gray-600 border-gray-200",
  };
  return map[strategy || ""] || "bg-muted text-muted-foreground border-border";
}

function getEngagementStatusBadgeClass(status: string | null | undefined) {
  const map: Record<string, string> = {
    "Unaware": "bg-gray-100 text-gray-600 border-gray-200",
    "Resistant": "bg-red-100 text-red-700 border-red-200",
    "Neutral": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "Supportive": "bg-green-100 text-green-700 border-green-200",
    "Leading": "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  return map[status || ""] || "bg-muted text-muted-foreground border-border";
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

// ─── KPI Management Dialog ────────────────────────────────────────────────────
function KpiManagementDialog({
  stakeholder,
  open,
  onOpenChange,
}: {
  stakeholder: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { currentProjectId } = useProject();
  const utils = trpc.useUtils();
  const [kpiForm, setKpiForm] = useState({ name: "", description: "", target: "", unit: "", weight: 1 });
  const [editingKpi, setEditingKpi] = useState<any>(null);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    assessmentDate: new Date().toISOString().split("T")[0],
    assessorName: "",
    notes: "",
    scores: {} as Record<number, { score: number; notes: string }>,
  });

  const { data: kpis = [] } = trpc.stakeholderEnhancements.listKpis.useQuery(
    { stakeholderId: stakeholder?.id },
    { enabled: !!stakeholder?.id && open }
  );
  const { data: assessments = [] } = trpc.stakeholderEnhancements.listAssessments.useQuery(
    { stakeholderId: stakeholder?.id },
    { enabled: !!stakeholder?.id && open }
  );

  const createKpi = trpc.stakeholderEnhancements.createKpi.useMutation({
    onSuccess: () => {
      utils.stakeholderEnhancements.listKpis.invalidate({ stakeholderId: stakeholder.id });
      setKpiForm({ name: "", description: "", target: "", unit: "", weight: 1 });
      toast.success("KPI added");
    },
  });
  const updateKpi = trpc.stakeholderEnhancements.updateKpi.useMutation({
    onSuccess: () => {
      utils.stakeholderEnhancements.listKpis.invalidate({ stakeholderId: stakeholder.id });
      setEditingKpi(null);
      toast.success("KPI updated");
    },
  });
  const deleteKpi = trpc.stakeholderEnhancements.deleteKpi.useMutation({
    onSuccess: () => {
      utils.stakeholderEnhancements.listKpis.invalidate({ stakeholderId: stakeholder.id });
      toast.success("KPI deleted");
    },
  });
  const createAssessment = trpc.stakeholderEnhancements.createAssessment.useMutation({
    onSuccess: (data) => {
      utils.stakeholderEnhancements.listAssessments.invalidate({ stakeholderId: stakeholder.id });
      setAssessmentOpen(false);
      toast.success(`Assessment saved — Overall Score: ${data.overallScore}/100`);
    },
  });
  const deleteAssessment = trpc.stakeholderEnhancements.deleteAssessment.useMutation({
    onSuccess: () => {
      utils.stakeholderEnhancements.listAssessments.invalidate({ stakeholderId: stakeholder.id });
      toast.success("Assessment deleted");
    },
  });

  const handleCreateAssessment = () => {
    if (!currentProjectId) return;
    const scores = kpis.map((k) => ({
      kpiId: k.id,
      score: assessmentForm.scores[k.id]?.score ?? 50,
      notes: assessmentForm.scores[k.id]?.notes ?? "",
    }));
    createAssessment.mutate({
      stakeholderId: stakeholder.id,
      projectId: currentProjectId,
      assessmentDate: assessmentForm.assessmentDate,
      assessorName: assessmentForm.assessorName,
      notes: assessmentForm.notes,
      scores,
    });
  };

  const latestScore = assessments[0]?.overallScore;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            KPIs & Assessments — {stakeholder?.fullName}
          </DialogTitle>
          <DialogDescription>
            Define performance indicators and run periodic assessments to score this stakeholder.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="kpis">
          <TabsList>
            <TabsTrigger value="kpis">KPI Definitions</TabsTrigger>
            <TabsTrigger value="assessments">Assessment History</TabsTrigger>
          </TabsList>

          {/* KPI Definitions Tab */}
          <TabsContent value="kpis" className="space-y-4 mt-4">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>KPI Name</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpis.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No KPIs defined yet. Add one below.
                      </TableCell>
                    </TableRow>
                  ) : (
                    kpis.map((kpi) =>
                      editingKpi?.id === kpi.id ? (
                        <TableRow key={kpi.id}>
                          <TableCell>
                            <Input
                              value={editingKpi.name}
                              onChange={(e) => setEditingKpi({ ...editingKpi, name: e.target.value })}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editingKpi.target || ""}
                              onChange={(e) => setEditingKpi({ ...editingKpi, target: e.target.value })}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editingKpi.unit || ""}
                              onChange={(e) => setEditingKpi({ ...editingKpi, unit: e.target.value })}
                              className="h-8 w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              value={editingKpi.weight || 1}
                              onChange={(e) => setEditingKpi({ ...editingKpi, weight: parseInt(e.target.value) || 1 })}
                              className="h-8 w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 px-2" onClick={() => updateKpi.mutate({ id: kpi.id, data: editingKpi })}>
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingKpi(null)}>
                                Cancel
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow key={kpi.id}>
                          <TableCell className="font-medium">{kpi.name}</TableCell>
                          <TableCell>{kpi.target || "—"}</TableCell>
                          <TableCell>{kpi.unit || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{kpi.weight}x</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingKpi({ ...kpi })}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteKpi.mutate({ id: kpi.id })}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    )
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Add KPI form */}
            <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
              <p className="text-sm font-medium">Add New KPI</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Input
                    placeholder="KPI Name (e.g. Task Completion Rate)"
                    value={kpiForm.name}
                    onChange={(e) => setKpiForm({ ...kpiForm, name: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Target (e.g. 95%)"
                  value={kpiForm.target}
                  onChange={(e) => setKpiForm({ ...kpiForm, target: e.target.value })}
                />
                <Input
                  placeholder="Unit (e.g. %, tasks)"
                  value={kpiForm.unit}
                  onChange={(e) => setKpiForm({ ...kpiForm, unit: e.target.value })}
                />
                <div className="col-span-2">
                  <Input
                    placeholder="Description (optional)"
                    value={kpiForm.description}
                    onChange={(e) => setKpiForm({ ...kpiForm, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Weight:</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={kpiForm.weight}
                    onChange={(e) => setKpiForm({ ...kpiForm, weight: parseInt(e.target.value) || 1 })}
                    className="w-20"
                  />
                </div>
              </div>
              <Button
                size="sm"
                disabled={!kpiForm.name.trim() || createKpi.isPending}
                onClick={() => {
                  if (!currentProjectId) return;
                  createKpi.mutate({ ...kpiForm, stakeholderId: stakeholder.id, projectId: currentProjectId });
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add KPI
              </Button>
            </div>
          </TabsContent>

          {/* Assessment History Tab */}
          <TabsContent value="assessments" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              {latestScore != null && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Latest Score:</span>
                  <span className={`text-2xl font-bold ${getScoreColor(latestScore)}`}>{latestScore}/100</span>
                </div>
              )}
              <Button
                size="sm"
                onClick={() => {
                  setAssessmentForm({
                    assessmentDate: new Date().toISOString().split("T")[0],
                    assessorName: "",
                    notes: "",
                    scores: {},
                  });
                  setAssessmentOpen(true);
                }}
                disabled={kpis.length === 0}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Assessment
              </Button>
            </div>
            {kpis.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Define KPIs first before running an assessment.
              </p>
            )}

            <div className="space-y-3">
              {assessments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No assessments yet.</p>
              ) : (
                assessments.map((a: any) => (
                  <div key={a.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Award className="h-4 w-4 text-primary" />
                        <span className="font-medium">{formatDate(a.assessmentDate)}</span>
                        {a.assessorName && <span className="text-sm text-muted-foreground">by {a.assessorName}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {a.overallScore != null && (
                          <span className={`text-lg font-bold ${getScoreColor(a.overallScore)}`}>
                            {a.overallScore}/100
                          </span>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => deleteAssessment.mutate({ id: a.id })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {a.notes && <p className="text-sm text-muted-foreground">{a.notes}</p>}
                    {a.scores?.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {a.scores.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between bg-muted/30 rounded px-3 py-1.5">
                            <span className="text-sm">{s.kpiName || `KPI #${s.kpiId}`}</span>
                            <span className={`text-sm font-semibold ${getScoreColor(s.score)}`}>{s.score}/100</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* New Assessment Dialog */}
        <Dialog open={assessmentOpen} onOpenChange={setAssessmentOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Assessment — {stakeholder?.fullName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Assessment Date</Label>
                  <Input
                    type="date"
                    value={assessmentForm.assessmentDate}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, assessmentDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Assessor Name</Label>
                  <Input
                    placeholder="Your name"
                    value={assessmentForm.assessorName}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, assessorName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="font-medium">KPI Scores (0 – 100)</Label>
                {kpis.map((kpi) => (
                  <div key={kpi.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{kpi.name}</span>
                      <span className={`text-sm font-bold ${getScoreColor(assessmentForm.scores[kpi.id]?.score ?? 50)}`}>
                        {assessmentForm.scores[kpi.id]?.score ?? 50}
                      </span>
                    </div>
                    {kpi.target && <p className="text-xs text-muted-foreground">Target: {kpi.target} {kpi.unit}</p>}
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[assessmentForm.scores[kpi.id]?.score ?? 50]}
                      onValueChange={([val]) =>
                        setAssessmentForm((prev) => ({
                          ...prev,
                          scores: { ...prev.scores, [kpi.id]: { score: val, notes: prev.scores[kpi.id]?.notes ?? "" } },
                        }))
                      }
                    />
                    <Input
                      placeholder="Notes for this KPI (optional)"
                      className="h-7 text-xs"
                      value={assessmentForm.scores[kpi.id]?.notes ?? ""}
                      onChange={(e) =>
                        setAssessmentForm((prev) => ({
                          ...prev,
                          scores: { ...prev.scores, [kpi.id]: { score: prev.scores[kpi.id]?.score ?? 50, notes: e.target.value } },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <Label>Overall Notes</Label>
                <Textarea
                  placeholder="General assessment notes..."
                  value={assessmentForm.notes}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssessmentOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateAssessment} disabled={createAssessment.isPending}>
                {createAssessment.isPending ? "Saving..." : "Save Assessment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stakeholder Form Dialog ──────────────────────────────────────────────────
function StakeholderFormDialog({
  open,
  onOpenChange,
  title,
  formData,
  setFormData,
  onSubmit,
  isPending,
  stakeholders,
  currentProjectId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  formData: StakeholderFormData;
  setFormData: (data: StakeholderFormData) => void;
  onSubmit: () => void;
  isPending: boolean;
  stakeholders: any[];
  currentProjectId: number | null | undefined;
}) {
  const utils = trpc.useUtils();
  const set = (partial: Partial<StakeholderFormData>) => {
    const next = { ...formData, ...partial };
    // Auto-propose engagement strategy when classification is Stakeholder and power/interest change
    if (next.classification === "Stakeholder" &&
        (partial.powerLevel !== undefined || partial.interestLevel !== undefined || partial.classification === "Stakeholder")) {
      next.engagementStrategy = proposeEngagementStrategy(next.powerLevel, next.interestLevel);
    }
    setFormData(next);
  };

  // External parties — owned by the dialog so it is self-contained
  const [isAddingParty, setIsAddingParty] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const { data: externalParties = [] } = trpc.externalParties.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );
  const createPartyMutation = trpc.externalParties.create.useMutation({
    onSuccess: (newParty: any) => {
      utils.externalParties.list.invalidate();
      set({ externalPartyId: newParty.id });
      setNewPartyName("");
      setIsAddingParty(false);
      toast.success("Party created");
    },
    onError: (e: any) => toast.error(`Failed: ${e.message}`),
  });

  // Position options
  const { data: positionOptions = [] } = trpc.commPlanOptions.positionOptions.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );
  const createPositionOption = trpc.commPlanOptions.positionOptions.create.useMutation({
    onSuccess: () => utils.commPlanOptions.positionOptions.list.invalidate(),
    onError: (e: any) => toast.error(`Failed: ${e.message}`),
  });

  // Role options
  const { data: roleOptions = [] } = trpc.commPlanOptions.roleOptions.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );
  const createRoleOption = trpc.commPlanOptions.roleOptions.create.useMutation({
    onSuccess: () => utils.commPlanOptions.roleOptions.list.invalidate(),
    onError: (e: any) => toast.error(`Failed: ${e.message}`),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Basic Information */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basic Information</p>

            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => set({ fullName: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => set({ email: e.target.value })}
                  placeholder="jane@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                value={formData.department}
                onChange={(e) => set({ department: e.target.value })}
                placeholder="Engineering"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Position — managed dropdown with inline create */}
              <div className="space-y-2">
                <Label>Position</Label>
                <div className="flex gap-1">
                  <Select
                    value={formData.position || ""}
                    onValueChange={(v) => set({ position: v })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select position..." />
                    </SelectTrigger>
                    <SelectContent>
                      {positionOptions.map((o: any) => (
                        <SelectItem key={o.id} value={o.label}>{o.label}</SelectItem>
                      ))}
                      {formData.position && !positionOptions.some((o: any) => o.label === formData.position) && (
                        <SelectItem value={formData.position}>{formData.position}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      const val = prompt("New position name:");
                      if (val?.trim() && currentProjectId) {
                        createPositionOption.mutate({ projectId: currentProjectId, label: val.trim() }, {
                          onSuccess: (row: any) => row && set({ position: row.label }),
                        });
                      }
                    }}
                    title="Add new position"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Role — managed dropdown with inline create */}
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex gap-1">
                  <Select
                    value={formData.role || ""}
                    onValueChange={(v) => set({ role: v })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((o: any) => (
                        <SelectItem key={o.id} value={o.label}>{o.label}</SelectItem>
                      ))}
                      {formData.role && !roleOptions.some((o: any) => o.label === formData.role) && (
                        <SelectItem value={formData.role}>{formData.role}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      const val = prompt("New role name:");
                      if (val?.trim() && currentProjectId) {
                        createRoleOption.mutate({ projectId: currentProjectId, label: val.trim() }, {
                          onSuccess: (row: any) => row && set({ role: row.label }),
                        });
                      }
                    }}
                    title="Add new role"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Classification</Label>
              <Select
                value={formData.classification}
                onValueChange={(v) =>
                  set({
                    classification: v as Classification,
                    isInternalTeam: classificationToIsInternal(v as Classification),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TeamMember">Team Member</SelectItem>
                  <SelectItem value="External">External</SelectItem>
                  <SelectItem value="Stakeholder">Stakeholder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Remark / Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => set({ notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>

          {/* Team Member fields */}
          {formData.classification === "TeamMember" && (
            <div className="space-y-3 border-t pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Member Details</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Cost Per Hour ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costPerHour}
                    onChange={(e) => set({ costPerHour: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost Per Day ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costPerDay}
                    onChange={(e) => set({ costPerDay: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Switch
                  checked={formData.isPooledResource}
                  onCheckedChange={(v) => set({ isPooledResource: v })}
                />
                <Label>Is Pooled Resource</Label>
              </div>
            </div>
          )}

          {/* Work Schedule — available for all classifications */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Work Schedule</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Working Hours/Day</Label>
                <Input
                  type="number"
                  min="1"
                  max="24"
                  value={formData.workingHoursPerDay}
                  onChange={(e) => set({ workingHoursPerDay: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Working Days/Week</Label>
                <Input
                  type="number"
                  min="1"
                  max="7"
                  value={formData.workingDaysPerWeek}
                  onChange={(e) => set({ workingDaysPerWeek: parseInt(e.target.value) || 5 })}
                />
              </div>
            </div>
          </div>

          {/* External fields */}
          {formData.classification === "External" && (
            <div className="space-y-3 border-t pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">External Details</p>

              {/* External Party */}
              <div className="space-y-2">
                <Label>External Party</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.externalPartyId != null ? String(formData.externalPartyId) : ""}
                    onValueChange={(v) => set({ externalPartyId: v ? parseInt(v) : null })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select party..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">— None —</SelectItem>
                      {externalParties.map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Add new party"
                    onClick={() => setIsAddingParty(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {/* Inline add party */}
                {isAddingParty && (
                  <div className="flex gap-2 mt-1">
                    <Input
                      autoFocus
                      placeholder="New party name..."
                      value={newPartyName}
                      onChange={(e) => setNewPartyName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newPartyName.trim() && currentProjectId) {
                          createPartyMutation.mutate({ projectId: currentProjectId, name: newPartyName.trim() });
                        }
                        if (e.key === "Escape") { setIsAddingParty(false); setNewPartyName(""); }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={!newPartyName.trim() || createPartyMutation.isPending}
                      onClick={() => {
                        if (newPartyName.trim() && currentProjectId)
                          createPartyMutation.mutate({ projectId: currentProjectId, name: newPartyName.trim() });
                      }}
                    >Add</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setIsAddingParty(false); setNewPartyName(""); }}>Cancel</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Stakeholder Manager</Label>
                <Select
                  value={formData.stakeholderManagerId != null ? String(formData.stakeholderManagerId) : ""}
                  onValueChange={(v) => set({ stakeholderManagerId: v ? parseInt(v) : null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stakeholders.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Stakeholder fields */}
          {formData.classification === "Stakeholder" && (
            <div className="space-y-3 border-t pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stakeholder Engagement</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Power Level: {formData.powerLevel}/5</Label>
                  <Slider
                    min={1} max={5} step={1}
                    value={[formData.powerLevel]}
                    onValueChange={([v]) => set({ powerLevel: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Interest Level: {formData.interestLevel}/5</Label>
                  <Slider
                    min={1} max={5} step={1}
                    value={[formData.interestLevel]}
                    onValueChange={([v]) => set({ interestLevel: v })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  Engagement Strategy
                  <span className="text-[10px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    Auto-proposed from Power × Interest
                  </span>
                </Label>
                <Select value={formData.engagementStrategy || "__none__"} onValueChange={(v) => set({ engagementStrategy: v === "__none__" ? "" : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select strategy..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Not set —</SelectItem>
                    {ENGAGEMENT_STRATEGIES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Current Engagement Status</Label>
                  <Select value={formData.currentEngagementStatus || "__none__"} onValueChange={(v) => set({ currentEngagementStatus: v === "__none__" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Current..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Not set —</SelectItem>
                      {ENGAGEMENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Desired Engagement Status</Label>
                  <Select value={formData.desiredEngagementStatus || "__none__"} onValueChange={(v) => set({ desiredEngagementStatus: v === "__none__" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Desired..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Not set —</SelectItem>
                      {ENGAGEMENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Communication Frequency</Label>
                  <Select value={formData.communicationFrequency || "__none__"} onValueChange={(v) => set({ communicationFrequency: v === "__none__" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Frequency..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Not set —</SelectItem>
                      {COMM_FREQUENCIES.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Communication Channel</Label>
                  <Select value={formData.communicationChannel || "__none__"} onValueChange={(v) => set({ communicationChannel: v === "__none__" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Channel..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Not set —</SelectItem>
                      {COMM_CHANNELS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Communication Message</Label>
                <Textarea
                  value={formData.communicationMessage}
                  onChange={(e) => set({ communicationMessage: e.target.value })}
                  placeholder="Key message to communicate..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Communication Responsible</Label>
                <Select
                  value={formData.communicationResponsibleId != null ? String(formData.communicationResponsibleId) : ""}
                  onValueChange={(v) => {
                    const id = v ? parseInt(v) : null;
                    const found = stakeholders.find((s: any) => s.id === id);
                    set({ communicationResponsibleId: id, communicationResponsible: found?.fullName ?? "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select responsible stakeholder..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stakeholders.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({
  stakeholder,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onKpi,
}: {
  stakeholder: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onKpi: () => void;
}) {
  if (!stakeholder) return null;

  const classification: Classification = stakeholder.classification || (stakeholder.isInternalTeam ? "TeamMember" : "Stakeholder");

  const clsColors: Record<string, { bg: string; text: string; dot: string }> = {
    TeamMember: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    External:   { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
    Stakeholder:{ bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  };
  const clr = clsColors[classification] ?? clsColors.Stakeholder;

  function SectionLabel({ label }: { label: string }) {
    return (
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    );
  }

  function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
    if (!value && value !== 0) return null;
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:w-[480px] overflow-y-auto p-0">
        {/* ── Header banner ── */}
        <div className={`${clr.bg} px-6 pt-8 pb-5 relative`}>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-base leading-none">&times;</span>
          </button>

          {/* Avatar circle */}
          <div className={`w-14 h-14 rounded-full ${clr.dot} flex items-center justify-center text-white text-xl font-bold mb-3 shadow-sm`}>
            {stakeholder.fullName?.charAt(0)?.toUpperCase() ?? "?"}
          </div>

          <h2 className="text-lg font-bold text-foreground leading-tight">{stakeholder.fullName}</h2>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {getClassificationBadge(classification)}
            {stakeholder.position && (
              <span className="text-xs text-muted-foreground">{stakeholder.position}</span>
            )}
            {stakeholder.department && (
              <span className="text-xs text-muted-foreground">· {stakeholder.department}</span>
            )}
          </div>

          {/* Quick contact row */}
          {(stakeholder.email || stakeholder.phone) && (
            <div className="flex items-center gap-4 mt-3">
              {stakeholder.email && (
                <a href={`mailto:${stakeholder.email}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="h-3.5 w-3.5" />
                  {stakeholder.email}
                </a>
              )}
              {stakeholder.phone && (
                <a href={`tel:${stakeholder.phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="h-3.5 w-3.5" />
                  {stakeholder.phone}
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-6">

          {/* Position & Role */}
          {(stakeholder.job || stakeholder.role || stakeholder.position || stakeholder.department) && (
            <div>
              <SectionLabel label="Position & Role" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <InfoRow label="Position" value={stakeholder.position} />
                <InfoRow label="Role" value={stakeholder.role} />
                <InfoRow label="Job Title" value={stakeholder.job} />
                <InfoRow label="Department" value={stakeholder.department} />
              </div>
            </div>
          )}

          {/* Work Schedule */}
          {(stakeholder.workingHoursPerDay != null || stakeholder.workingDaysPerWeek != null) && (
            <div>
              <SectionLabel label="Work Schedule" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <InfoRow label="Hours / Day" value={stakeholder.workingHoursPerDay} />
                <InfoRow label="Days / Week" value={stakeholder.workingDaysPerWeek} />
              </div>
            </div>
          )}

          {/* Team Member cost details */}
          {classification === "TeamMember" && (stakeholder.costPerHour != null || stakeholder.costPerDay != null || stakeholder.isPooledResource) && (
            <div>
              <SectionLabel label="Cost & Resource" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {stakeholder.costPerHour != null && (
                  <InfoRow label="Cost / Hour" value={`$${Number(stakeholder.costPerHour).toFixed(2)}`} />
                )}
                {stakeholder.costPerDay != null && (
                  <InfoRow label="Cost / Day" value={`$${Number(stakeholder.costPerDay).toFixed(2)}`} />
                )}
              </div>
              {stakeholder.isPooledResource && (
                <Badge variant="outline" className="text-xs mt-2">Pooled Resource</Badge>
              )}
            </div>
          )}

          {/* Engagement */}
          {(stakeholder.currentEngagementStatus || stakeholder.desiredEngagementStatus ||
            stakeholder.powerLevel != null || stakeholder.interestLevel != null ||
            stakeholder.engagementStrategy) && (
            <div>
              <SectionLabel label="Engagement" />

              {/* Current → Desired status arrow */}
              {(stakeholder.currentEngagementStatus || stakeholder.desiredEngagementStatus) && (
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {stakeholder.currentEngagementStatus && (
                    <Badge className={`text-xs border ${getEngagementStatusBadgeClass(stakeholder.currentEngagementStatus)}`}>
                      {stakeholder.currentEngagementStatus}
                    </Badge>
                  )}
                  {stakeholder.currentEngagementStatus && stakeholder.desiredEngagementStatus && (
                    <MoveRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  {stakeholder.desiredEngagementStatus && (
                    <Badge className={`text-xs border ${getEngagementStatusBadgeClass(stakeholder.desiredEngagementStatus)}`}>
                      {stakeholder.desiredEngagementStatus}
                    </Badge>
                  )}
                </div>
              )}

              {/* Power / Interest as visual bars */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-3">
                {stakeholder.powerLevel != null && (
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Power Level</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-2 w-full rounded-sm ${i <= (stakeholder.powerLevel ?? 0) ? "bg-primary" : "bg-muted"}`} />
                      ))}
                      <span className="text-xs font-semibold ml-1">{stakeholder.powerLevel}/5</span>
                    </div>
                  </div>
                )}
                {stakeholder.interestLevel != null && (
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Interest Level</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-2 w-full rounded-sm ${i <= (stakeholder.interestLevel ?? 0) ? "bg-primary" : "bg-muted"}`} />
                      ))}
                      <span className="text-xs font-semibold ml-1">{stakeholder.interestLevel}/5</span>
                    </div>
                  </div>
                )}
              </div>

              {stakeholder.engagementStrategy && (
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Strategy</span>
                  <div className="mt-1">
                    <Badge className={`text-xs border ${getEngagementBadgeClass(stakeholder.engagementStrategy)}`}>
                      {stakeholder.engagementStrategy}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Communication */}
          {(stakeholder.communicationFrequency || stakeholder.communicationChannel || stakeholder.communicationResponsible || stakeholder.communicationMessage) && (
            <div>
              <SectionLabel label="Communication" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <InfoRow label="Frequency" value={stakeholder.communicationFrequency} />
                <InfoRow label="Channel" value={stakeholder.communicationChannel} />
                <InfoRow label="Responsible" value={stakeholder.communicationResponsible} />
              </div>
              {stakeholder.communicationMessage && (
                <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Key Message</span>
                  <p className="text-sm text-foreground">{stakeholder.communicationMessage}</p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {stakeholder.notes && (
            <div>
              <SectionLabel label="Notes" />
              <p className="text-sm text-muted-foreground leading-relaxed">{stakeholder.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-1">
            <SectionLabel label="Actions" />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="gap-1.5" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={onKpi}>
                <Target className="h-3.5 w-3.5" />
                KPI & Assessments
              </Button>
              {classification === "TeamMember" && (
                <>
                  <Button size="sm" variant="outline" className="gap-1.5"
                    onClick={() => toast.info("Coming soon — use Engagement Plan / Resource Management pages")}>
                    <ClipboardList className="h-3.5 w-3.5" />
                    Dev Plan
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5"
                    onClick={() => toast.info("Coming soon — use Engagement Plan / Resource Management pages")}>
                    <Activity className="h-3.5 w-3.5" />
                    Skills
                  </Button>
                </>
              )}
              <Button size="sm" variant="destructive" className="gap-1.5" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Stakeholders Page ───────────────────────────────────────────────────
export default function Stakeholders() {
  const { currentProjectId } = useProject();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [classificationFilter, setClassificationFilter] = useState<"all" | "TeamMember" | "External" | "Stakeholder">("all");
  const [strategyFilter, setStrategyFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStakeholder, setSelectedStakeholder] = useState<any>(null);
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [formData, setFormData] = useState<StakeholderFormData>(EMPTY_FORM);
  const utils = trpc.useUtils();

  const { data: stakeholders = [], isLoading } = trpc.stakeholders.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const createMutation = trpc.stakeholders.create.useMutation({
    onSuccess: () => {
      utils.stakeholders.list.invalidate();
      setIsCreateOpen(false);
      setFormData(EMPTY_FORM);
      toast.success("Stakeholder created");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const updateMutation = trpc.stakeholders.update.useMutation({
    onSuccess: () => {
      utils.stakeholders.list.invalidate();
      setIsEditOpen(false);
      setDetailOpen(false);
      setSelectedStakeholder(null);
      setFormData(EMPTY_FORM);
      toast.success("Stakeholder updated");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const deleteMutation = trpc.stakeholders.delete.useMutation({
    onSuccess: () => {
      utils.stakeholders.list.invalidate();
      setIsDeleteOpen(false);
      setDetailOpen(false);
      setSelectedStakeholder(null);
      toast.success("Stakeholder deleted");
    },
  });

  function getStakeholderClassification(s: any): Classification {
    if (s.classification) return s.classification as Classification;
    return s.isInternalTeam ? "TeamMember" : "Stakeholder";
  }

  function buildFormData(s: any): StakeholderFormData {
    const classification = getStakeholderClassification(s);
    return {
      fullName: s.fullName || "",
      email: s.email || "",
      position: s.position || "",
      role: s.role || "",
      job: s.job || "",
      phone: s.phone || "",
      department: s.department || "",
      classification,
      isInternalTeam: classificationToIsInternal(classification),
      isPooledResource: s.isPooledResource || false,
      workingHoursPerDay: s.workingHoursPerDay != null ? String(s.workingHoursPerDay) : "8",
      workingDaysPerWeek: s.workingDaysPerWeek ?? 5,
      stakeholderManagerId: s.stakeholderManagerId ?? null,
      externalPartyId: s.externalPartyId ?? null,
      powerLevel: s.powerLevel ?? 3,
      interestLevel: s.interestLevel ?? 3,
      engagementStrategy: s.engagementStrategy || "",
      currentEngagementStatus: s.currentEngagementStatus || "",
      desiredEngagementStatus: s.desiredEngagementStatus || "",
      communicationFrequency: s.communicationFrequency || "",
      communicationChannel: s.communicationChannel || "",
      communicationMessage: s.communicationMessage || "",
      communicationResponsible: s.communicationResponsible || "",
      communicationResponsibleId: s.communicationResponsibleId ?? null,
      notes: s.notes || "",
      costPerHour: s.costPerHour != null ? String(s.costPerHour) : "",
      costPerDay: s.costPerDay != null ? String(s.costPerDay) : "",
    };
  }

  const handleEdit = (s: any) => {
    setSelectedStakeholder(s);
    setFormData(buildFormData(s));
    setIsEditOpen(true);
  };

  const handleRowClick = (s: any) => {
    setSelectedStakeholder(s);
    setDetailOpen(true);
  };

  type EngagementStatusValue = "Unaware" | "Resistant" | "Neutral" | "Supportive" | "Leading";
  const toEngagementStatus = (v: string): EngagementStatusValue | undefined =>
    (["Unaware", "Resistant", "Neutral", "Supportive", "Leading"].includes(v)
      ? (v as EngagementStatusValue)
      : undefined);

  const handleCreate = () => {
    if (!formData.fullName.trim()) { toast.error("Full name is required"); return; }
    if (!currentProjectId) { toast.error("No project selected"); return; }
    createMutation.mutate({
      ...formData,
      projectId: currentProjectId,
      isInternalTeam: classificationToIsInternal(formData.classification),
      currentEngagementStatus: toEngagementStatus(formData.currentEngagementStatus),
      desiredEngagementStatus: toEngagementStatus(formData.desiredEngagementStatus),
      costPerHour: formData.costPerHour || undefined,
      costPerDay: formData.costPerDay || undefined,
       communicationResponsibleId: formData.communicationResponsibleId ?? undefined,
      externalPartyId: formData.externalPartyId ?? undefined,
    });
  };
  const handleUpdate = () => {
    if (!selectedStakeholder) return;
    if (!formData.fullName.trim()) { toast.error("Full name is required"); return; }
    updateMutation.mutate({
      id: selectedStakeholder.id,
      data: {
        ...formData,
        isInternalTeam: classificationToIsInternal(formData.classification),
        currentEngagementStatus: toEngagementStatus(formData.currentEngagementStatus),
        desiredEngagementStatus: toEngagementStatus(formData.desiredEngagementStatus),
        costPerHour: formData.costPerHour || null,
        costPerDay: formData.costPerDay || null,
        communicationResponsibleId: formData.communicationResponsibleId ?? null,
        externalPartyId: formData.externalPartyId ?? null,
      },
    });
  };

  // Derived counts
  const teamMemberCount = stakeholders.filter((s) => getStakeholderClassification(s) === "TeamMember").length;
  const externalCount = stakeholders.filter((s) => getStakeholderClassification(s) === "External").length;
  const stakeholderCount = stakeholders.filter((s) => getStakeholderClassification(s) === "Stakeholder").length;
  const manageCloselyCount = stakeholders.filter((s) => s.engagementStrategy === "Manage Closely").length;

  const filteredStakeholders = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return stakeholders.filter((s) => {
      const classification = getStakeholderClassification(s);

      const matchesSearch =
        !q ||
        s.fullName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q) ||
        s.role?.toLowerCase().includes(q) ||
        s.job?.toLowerCase().includes(q) ||
        s.position?.toLowerCase().includes(q);

      const matchesClassification =
        classificationFilter === "all" || classification === classificationFilter;

      const matchesStrategy =
        strategyFilter === "all" || s.engagementStrategy === strategyFilter;

      return matchesSearch && matchesClassification && matchesStrategy;
    });
  }, [stakeholders, searchTerm, classificationFilter, strategyFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-card border rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Stakeholder Register
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage team members, external parties, stakeholders, KPIs, and engagement strategies.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{stakeholders.length} Total</Badge>
          <Button
            onClick={() => { setFormData(EMPTY_FORM); setIsCreateOpen(true); }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Add Stakeholder
          </Button>
          {currentProjectId && (
            <ImportExportToolbar module="stakeholders" projectId={currentProjectId} onImportSuccess={() => {}} />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Users className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold">{teamMemberCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg"><Briefcase className="h-5 w-5 text-orange-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">External</p>
                <p className="text-2xl font-bold">{externalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg"><UserCheck className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Stakeholders</p>
                <p className="text-2xl font-bold">{stakeholderCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg"><Activity className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Manage Closely</p>
                <p className="text-2xl font-bold">{manageCloselyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, department, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Classification filter */}
        <div className="flex gap-1 border rounded-lg p-1">
          {(
            [
              { key: "all", label: "All" },
              { key: "TeamMember", label: "Team Members" },
              { key: "External", label: "External" },
              { key: "Stakeholder", label: "Stakeholders" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setClassificationFilter(t.key)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                classificationFilter === t.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Strategy filter — only relevant for Stakeholders */}
        {(classificationFilter === "all" || classificationFilter === "Stakeholder") && (
          <Select value={strategyFilter} onValueChange={setStrategyFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Engagement Strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strategies</SelectItem>
              {ENGAGEMENT_STRATEGIES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Job / Role</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Remark</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStakeholders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState
                    icon={Users}
                    title={searchTerm ? "No stakeholders match your search" : "No stakeholders yet"}
                    description={searchTerm ? "Try a different search term." : "Add your first stakeholder to get started."}
                    actionLabel={searchTerm ? undefined : "Add Stakeholder"}
                    onAction={searchTerm ? undefined : () => setIsCreateOpen(true)}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredStakeholders.map((s) => {
                const classification = getStakeholderClassification(s);
                return (
                  <TableRow
                    key={s.id}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => handleRowClick(s)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{s.fullName}</p>
                        {s.position && <p className="text-xs text-muted-foreground">{s.position}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{s.department || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {s.job && <p>{s.job}</p>}
                        {s.role && <p className="text-muted-foreground text-xs">{s.role}</p>}
                        {!s.job && !s.role && <span className="text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getClassificationBadge(classification)}
                    </TableCell>
                    <TableCell>
                      {s.email ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[140px]">{s.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.phone ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                          {s.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.notes ? (
                        <span className="text-xs text-muted-foreground line-clamp-2 max-w-[160px]">{s.notes}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          title="Edit"
                          onClick={() => handleEdit(s)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-primary"
                          title="KPIs & Assessments"
                          onClick={() => { setSelectedStakeholder(s); setKpiDialogOpen(true); }}
                        >
                          <Target className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          title="Delete"
                          onClick={() => { setSelectedStakeholder(s); setIsDeleteOpen(true); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <StakeholderFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Add New Stakeholder"
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
        stakeholders={stakeholders as any[]}
        currentProjectId={currentProjectId}
      />

      {/* Edit Dialog */}
      <StakeholderFormDialog
        open={isEditOpen}
        onOpenChange={(v) => { setIsEditOpen(v); if (!v) setFormData(EMPTY_FORM); }}
        title={`Edit — ${selectedStakeholder?.fullName}`}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleUpdate}
        isPending={updateMutation.isPending}
        stakeholders={stakeholders as any[]}
        currentProjectId={currentProjectId}
      />

      {/* Detail Panel */}
      <DetailPanel
        stakeholder={selectedStakeholder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={() => {
          setDetailOpen(false);
          if (selectedStakeholder) handleEdit(selectedStakeholder);
        }}
        onDelete={() => {
          setDetailOpen(false);
          setIsDeleteOpen(true);
        }}
        onKpi={() => {
          setDetailOpen(false);
          setKpiDialogOpen(true);
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stakeholder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedStakeholder?.fullName}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedStakeholder && deleteMutation.mutate({ id: selectedStakeholder.id })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* KPI & Assessment Dialog */}
      {selectedStakeholder && (
        <KpiManagementDialog
          stakeholder={selectedStakeholder}
          open={kpiDialogOpen}
          onOpenChange={setKpiDialogOpen}
        />
      )}
    </div>
  );
}
