import { useState, useMemo, useRef, useCallback, useEffect } from "react";
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
  Sheet, SheetContent,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, Search, Users, Mail, Phone,
  Target, Award, Activity, UserCheck, Briefcase,
  MoveRight, Download,
  Brain, Star, Lightbulb, Shield, BookOpen, TrendingUp, TrendingDown, Zap,
} from "lucide-react";
import { ImportExportToolbar } from "@/components/ImportExportToolbar";
import { StakeholderSelect } from "@/components/StakeholderSelect";
import { EmptyState } from "@/components/EmptyState";
import { formatDate, formatDateTime } from "@/lib/dateUtils";

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
const ENGAGEMENT_STATUSES = ["Resistant", "Unaware", "Neutral", "Supportive", "Leading"];
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
    assessmentDate: new Date().toISOString().slice(0, 16),
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
                    assessmentDate: new Date().toISOString().slice(0, 16),
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
                        <span className="font-medium">{formatDateTime(a.assessmentDate)}</span>
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
                  <Label>Assessment Date & Time</Label>
                  <Input
                    type="datetime-local"
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

  // Merge position options with unique positions from existing stakeholders (e.g. imported via CSV)
  const allPositionOptions = useMemo(() => {
    const knownLabels = new Set(positionOptions.map((o: any) => o.label));
    const derived = [...new Set(
      stakeholders.map((s: any) => s.position).filter((p: any) => p && !knownLabels.has(p))
    )];
    return [...positionOptions, ...derived.map((label: string) => ({ id: `derived-${label}`, label }))];
  }, [positionOptions, stakeholders]);

  // Merge role options with unique roles from existing stakeholders (e.g. imported via CSV)
  const allRoleOptions = useMemo(() => {
    const knownLabels = new Set(roleOptions.map((o: any) => o.label));
    const derived = [...new Set(
      stakeholders.map((s: any) => s.role).filter((r: any) => r && !knownLabels.has(r))
    )];
    return [...roleOptions, ...derived.map((label: string) => ({ id: `derived-${label}`, label }))];
  }, [roleOptions, stakeholders]);

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
                      {allPositionOptions.map((o: any) => (
                        <SelectItem key={o.id} value={o.label}>{o.label}</SelectItem>
                      ))}
                      {formData.position && !allPositionOptions.some((o: any) => o.label === formData.position) && (
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
                      {allRoleOptions.map((o: any) => (
                        <SelectItem key={o.id} value={o.label}>{o.label}</SelectItem>
                      ))}
                      {formData.role && !allRoleOptions.some((o: any) => o.label === formData.role) && (
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
                    value={formData.externalPartyId != null ? String(formData.externalPartyId) : "__none__"}
                    onValueChange={(v) => set({ externalPartyId: v && v !== "__none__" ? parseInt(v) : null })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select party..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— None —</SelectItem>
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
  const { currentProjectId } = useProject();

  // ── SWOT state ──
  const [swotInputs, setSwotInputs] = useState({ Strength: "", Weakness: "", Opportunity: "", Threat: "" });

  // ── Dev Plan state ──
  const [showDevPlanForm, setShowDevPlanForm] = useState(false);
  const [devPlanForm, setDevPlanForm] = useState({
    title: "", description: "", goals: "", startDate: "", endDate: "",
    status: "Not Started" as string,
    linkedSkillId: "", linkedSwotId: "",
  });

  // ── Skill state ──
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [skillForm, setSkillForm] = useState({ name: "", level: "Beginner" as "Beginner" | "Intermediate" | "Advanced" | "Expert", linkedKpiId: "", linkedSwotId: "" });

  // ── tRPC queries ──
  const { data: swotItems = [], refetch: refetchSwot } = trpc.stakeholderEnhancements.listSwot.useQuery(
    { stakeholderId: stakeholder?.id ?? 0 },
    { enabled: !!stakeholder?.id && open }
  );
  const { data: devPlans = [], refetch: refetchDevPlans } = trpc.stakeholderEnhancements.listDevPlans.useQuery(
    { stakeholderId: stakeholder?.id ?? 0 },
    { enabled: !!stakeholder?.id && open }
  );
  const { data: skills = [], refetch: refetchSkills } = trpc.stakeholderEnhancements.listSkills.useQuery(
    { stakeholderId: stakeholder?.id ?? 0 },
    { enabled: !!stakeholder?.id && open }
  );
  const { data: kpis = [] } = trpc.stakeholderEnhancements.listKpis.useQuery(
    { stakeholderId: stakeholder?.id ?? 0 },
    { enabled: !!stakeholder?.id && open }
  );
  const { data: assessments = [] } = trpc.stakeholderEnhancements.listAssessments.useQuery(
    { stakeholderId: stakeholder?.id ?? 0 },
    { enabled: !!stakeholder?.id && open }
  );

  // ── SWOT mutations ──
  const createSwot = trpc.stakeholderEnhancements.createSwot.useMutation({
    onSuccess: () => { refetchSwot(); toast.success("SWOT item added"); },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });
  const deleteSwot = trpc.stakeholderEnhancements.deleteSwot.useMutation({
    onSuccess: () => { refetchSwot(); toast.success("SWOT item removed"); },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  // ── Dev Plan mutations ──
  const createDevPlan = trpc.stakeholderEnhancements.createDevPlan.useMutation({
    onSuccess: () => {
      refetchDevPlans();
      setShowDevPlanForm(false);
      setDevPlanForm({ title: "", description: "", goals: "", startDate: "", endDate: "", status: "Not Started", linkedSkillId: "", linkedSwotId: "" });
      toast.success("Development plan added");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });
  const deleteDevPlan = trpc.stakeholderEnhancements.deleteDevPlan.useMutation({
    onSuccess: () => { refetchDevPlans(); toast.success("Development plan removed"); },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  // ── Skill mutations ──
  const createSkill = trpc.stakeholderEnhancements.createSkill.useMutation({
    onSuccess: () => {
      refetchSkills();
      setShowSkillForm(false);
      setSkillForm({ name: "", level: "Beginner" as "Beginner" | "Intermediate" | "Advanced" | "Expert", linkedKpiId: "", linkedSwotId: "" });
      toast.success("Skill added");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });
  const updateSkill = trpc.stakeholderEnhancements.updateSkill.useMutation({
    onSuccess: () => { refetchSkills(); toast.success("Skill updated"); },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });
  const deleteSkill = trpc.stakeholderEnhancements.deleteSkill.useMutation({
    onSuccess: () => { refetchSkills(); toast.success("Skill removed"); },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

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

  // ── SWOT helpers ──
  const swotQuadrants: { key: "Strength" | "Weakness" | "Opportunity" | "Threat"; label: string; shortLabel: string; icon: JSX.Element; color: string; headerColor: string }[] = [
    { key: "Strength",    label: "Strengths",    shortLabel: "S", icon: <Star className="h-4 w-4" />,       color: "border-green-200 bg-green-50",  headerColor: "text-green-700 bg-green-100" },
    { key: "Weakness",    label: "Weaknesses",   shortLabel: "W", icon: <Shield className="h-4 w-4" />,     color: "border-red-200 bg-red-50",      headerColor: "text-red-700 bg-red-100" },
    { key: "Opportunity", label: "Opportunities",shortLabel: "O", icon: <Lightbulb className="h-4 w-4" />, color: "border-blue-200 bg-blue-50",    headerColor: "text-blue-700 bg-blue-100" },
    { key: "Threat",      label: "Threats",      shortLabel: "T", icon: <Brain className="h-4 w-4" />,      color: "border-amber-200 bg-amber-50",  headerColor: "text-amber-700 bg-amber-100" },
  ];

  function getDevPlanStatusBadge(status: string) {
    const map: Record<string, string> = {
      "Not Started": "bg-gray-100 text-gray-700",
      "In Progress": "bg-blue-100 text-blue-700",
      "Completed":   "bg-green-100 text-green-700",
      "On Hold":     "bg-amber-100 text-amber-700",
    };
    return map[status] || "bg-gray-100 text-gray-700";
  }

  function getSkillLevelBadge(level: string) {
    const map: Record<string, string> = {
      "Beginner":     "bg-gray-100 text-gray-700",
      "Intermediate": "bg-blue-100 text-blue-700",
      "Advanced":     "bg-green-100 text-green-700",
      "Expert":       "bg-purple-100 text-purple-700",
    };
    return map[level] || "bg-gray-100 text-gray-700";
  }

  const latestAssessment = assessments[0] as any | undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:w-[580px] overflow-y-auto p-0">
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

        {/* ── Tabbed Body ── */}
        <Tabs defaultValue="profile" className="flex flex-col">
          <div className="px-4 pt-3 border-b">
            <TabsList className="w-full justify-start gap-0 bg-transparent p-0 h-auto">
              <TabsTrigger value="profile"    className="text-xs px-3 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Profile</TabsTrigger>
              {classification === "TeamMember" && (
                <TabsTrigger value="kpis"     className="text-xs px-3 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">KPIs</TabsTrigger>
              )}
              {classification === "TeamMember" && (
                <TabsTrigger value="swot"     className="text-xs px-3 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">SWOT</TabsTrigger>
              )}
              {classification === "TeamMember" && (
                <TabsTrigger value="devplan"  className="text-xs px-3 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Dev Plan</TabsTrigger>
              )}
              {classification === "TeamMember" && (
                <TabsTrigger value="skills"   className="text-xs px-3 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Skills</TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* ── Profile Tab ── */}
          <TabsContent value="profile" className="px-6 py-5 space-y-6 mt-0">

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
              stakeholder.engagementStrategy) && (
              <div>
                <SectionLabel label="Engagement" />

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
                  KPI Dialog
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── KPIs & Assessments Tab ── */}
          <TabsContent value="kpis" className="px-6 py-5 space-y-5 mt-0">
            {/* Latest score card */}
            {latestAssessment && (
              <div className="rounded-lg border p-4 bg-muted/20 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Latest Assessment</p>
                  <p className="text-sm font-medium">{formatDateTime(latestAssessment.assessmentDate)}</p>
                  {latestAssessment.assessorName && (
                    <p className="text-xs text-muted-foreground">by {latestAssessment.assessorName}</p>
                  )}
                </div>
                {latestAssessment.overallScore != null && (
                  <span className={`text-3xl font-bold ${getScoreColor(latestAssessment.overallScore)}`}>
                    {latestAssessment.overallScore}<span className="text-sm font-normal text-muted-foreground">/100</span>
                  </span>
                )}
              </div>
            )}

            {/* KPI definitions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">KPI Definitions</span>
                <span className="text-xs text-muted-foreground">{kpis.length} defined</span>
              </div>
              {kpis.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No KPIs defined. Open the KPI Dialog to add them.</p>
              ) : (
                <div className="space-y-2">
                  {kpis.map((kpi: any) => (
                    <div key={kpi.id} className="border rounded-lg px-3 py-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{kpi.name}</p>
                        {kpi.target && <p className="text-xs text-muted-foreground">Target: {kpi.target} {kpi.unit}</p>}
                      </div>
                      <Badge variant="outline" className="text-xs">{kpi.weight}x</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assessment history */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Assessment History</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              {assessments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No assessments yet.</p>
              ) : (
                <div className="space-y-3">
                  {(assessments as any[]).map((a) => (
                    <div key={a.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{formatDateTime(a.assessmentDate)}</span>
                          {a.assessorName && <span className="text-xs text-muted-foreground">by {a.assessorName}</span>}
                        </div>
                        {a.overallScore != null && (
                          <span className={`text-sm font-bold ${getScoreColor(a.overallScore)}`}>{a.overallScore}/100</span>
                        )}
                      </div>
                      {a.notes && <p className="text-xs text-muted-foreground">{a.notes}</p>}
                      {a.scores?.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5">
                          {a.scores.map((s: any) => (
                            <div key={s.id} className="flex items-center justify-between bg-muted/30 rounded px-2 py-1">
                              <span className="text-xs truncate">{s.kpiName || `KPI #${s.kpiId}`}</span>
                              <span className={`text-xs font-semibold ${getScoreColor(s.score)}`}>{s.score}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={onKpi}>
              <Target className="h-3.5 w-3.5" />
              Open Full KPI Manager
            </Button>
          </TabsContent>

          {/* ── SWOT Tab ── */}
          <TabsContent value="swot" className="px-4 py-4 mt-0">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">SWOT Analysis</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {swotQuadrants.map((q) => {
                const items = swotItems.filter((i: any) => i.quadrant === q.key);
                return (
                  <div key={q.key} className={`border rounded-lg p-3 space-y-2 ${q.color}`}>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold ${q.headerColor}`}>
                      {q.icon}
                      {q.label}
                      <span className="ml-auto opacity-60 font-bold">{q.shortLabel}</span>
                    </div>
                    <div className="space-y-1 min-h-[60px]">
                      {items.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">None yet</p>
                      ) : (
                        items.map((item: any) => (
                          <div key={item.id} className="flex items-start gap-1 group">
                            <span className="text-xs flex-1 leading-snug">{item.description}</span>
                            <button
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                              onClick={() => deleteSwot.mutate({ id: item.id })}
                              title="Remove"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    {/* Add input */}
                    <div className="flex gap-1 mt-1">
                      <Input
                        className="h-7 text-xs"
                        placeholder={`Add ${q.label.toLowerCase()}...`}
                        value={swotInputs[q.key]}
                        onChange={(e) => setSwotInputs((prev) => ({ ...prev, [q.key]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && swotInputs[q.key].trim()) {
                            createSwot.mutate({ stakeholderId: stakeholder.id, quadrant: q.key, description: swotInputs[q.key].trim() });
                            setSwotInputs((prev) => ({ ...prev, [q.key]: "" }));
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 shrink-0"
                        disabled={!swotInputs[q.key].trim() || createSwot.isPending}
                        onClick={() => {
                          if (!swotInputs[q.key].trim()) return;
                          createSwot.mutate({ stakeholderId: stakeholder.id, quadrant: q.key, description: swotInputs[q.key].trim() });
                          setSwotInputs((prev) => ({ ...prev, [q.key]: "" }));
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ── Dev Plan Tab ── */}
          <TabsContent value="devplan" className="px-4 py-4 space-y-4 mt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Development Plans</h3>
              </div>
              <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => setShowDevPlanForm((v) => !v)}>
                <Plus className="h-3 w-3" />
                Add Plan
              </Button>
            </div>

            {/* Add form */}
            {showDevPlanForm && (
              <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New Development Plan</p>
                <Input
                  placeholder="Plan title *"
                  value={devPlanForm.title}
                  onChange={(e) => setDevPlanForm((p) => ({ ...p, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Description"
                  rows={2}
                  value={devPlanForm.description}
                  onChange={(e) => setDevPlanForm((p) => ({ ...p, description: e.target.value }))}
                />
                <Textarea
                  placeholder="Goals"
                  rows={2}
                  value={devPlanForm.goals}
                  onChange={(e) => setDevPlanForm((p) => ({ ...p, goals: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Start Date</Label>
                    <Input type="date" value={devPlanForm.startDate} onChange={(e) => setDevPlanForm((p) => ({ ...p, startDate: e.target.value }))} className="h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End Date</Label>
                    <Input type="date" value={devPlanForm.endDate} onChange={(e) => setDevPlanForm((p) => ({ ...p, endDate: e.target.value }))} className="h-8" />
                  </div>
                </div>
                <Select value={devPlanForm.status} onValueChange={(v) => setDevPlanForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                {skills.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">Link to Skill (optional)</Label>
                    <Select value={devPlanForm.linkedSkillId} onValueChange={(v) => setDevPlanForm((p) => ({ ...p, linkedSkillId: v }))}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select skill..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">— None —</SelectItem>
                        {(skills as any[]).map((sk) => (
                          <SelectItem key={sk.id} value={String(sk.id)}>{sk.name} ({sk.level})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {swotItems.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">Link to SWOT Item (optional)</Label>
                    <Select value={devPlanForm.linkedSwotId} onValueChange={(v) => setDevPlanForm((p) => ({ ...p, linkedSwotId: v }))}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select SWOT item..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">— None —</SelectItem>
                        {(swotItems as any[]).map((sw) => (
                          <SelectItem key={sw.id} value={String(sw.id)}>[{sw.quadrant}] {sw.description.length > 50 ? sw.description.slice(0, 50) + "…" : sw.description}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!devPlanForm.title.trim() || createDevPlan.isPending}
                    onClick={() => {
                      if (!currentProjectId) { toast.error("No project selected"); return; }
                      createDevPlan.mutate({
                        stakeholderId: stakeholder.id,
                        projectId: currentProjectId,
                        title: devPlanForm.title,
                        description: devPlanForm.description,
                        goals: devPlanForm.goals,
                        startDate: devPlanForm.startDate || undefined,
                        endDate: devPlanForm.endDate || undefined,
                        status: devPlanForm.status as "Not Started" | "In Progress" | "Completed" | "On Hold",
                        linkedSkillId: devPlanForm.linkedSkillId ? parseInt(devPlanForm.linkedSkillId) : null,
                        linkedSwotId: devPlanForm.linkedSwotId ? parseInt(devPlanForm.linkedSwotId) : null,
                      });
                    }}
                  >
                    Save Plan
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowDevPlanForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Plan cards */}
            {devPlans.length === 0 && !showDevPlanForm ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No development plans yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(devPlans as any[]).map((plan) => (
                  <div key={plan.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{plan.title}</p>
                        {plan.description && <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge className={`text-xs ${getDevPlanStatusBadge(plan.status)}`}>{plan.status || "Not Started"}</Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                          onClick={() => deleteDevPlan.mutate({ id: plan.id })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {plan.goals && (
                      <div className="bg-muted/30 rounded px-2 py-1.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Goals</p>
                        <p className="text-xs">{plan.goals}</p>
                      </div>
                    )}
                    {(plan.startDate || plan.endDate) && (
                      <p className="text-xs text-muted-foreground">
                        {plan.startDate && formatDate(plan.startDate)}
                        {plan.startDate && plan.endDate && " → "}
                        {plan.endDate && formatDate(plan.endDate)}
                      </p>
                    )}
                    {/* Linked Skill */}
                    {plan.linkedSkillId && (() => {
                      const sk = (skills as any[]).find((s) => s.id === plan.linkedSkillId);
                      return sk ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full">
                          <Zap className="h-2.5 w-2.5" /> Skill: {sk.name} ({sk.level})
                        </span>
                      ) : null;
                    })()}
                    {/* Linked SWOT Item */}
                    {plan.linkedSwotId && (() => {
                      const sw = (swotItems as any[]).find((s) => s.id === plan.linkedSwotId);
                      return sw ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">
                          <Brain className="h-2.5 w-2.5" /> {sw.quadrant}: {sw.description.length > 40 ? sw.description.slice(0, 40) + "…" : sw.description}
                        </span>
                      ) : null;
                    })()}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Skills Tab ── */}
          <TabsContent value="skills" className="px-4 py-4 space-y-4 mt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Skills</h3>
              </div>
              <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => setShowSkillForm((v) => !v)}>
                <Plus className="h-3 w-3" />
                Add Skill
              </Button>
            </div>

            {/* Add skill form */}
            {showSkillForm && (
              <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New Skill</p>
                <Input
                  placeholder="Skill name *"
                  value={skillForm.name}
                  onChange={(e) => setSkillForm((p) => ({ ...p, name: e.target.value }))}
                />
                <Select value={skillForm.level} onValueChange={(v) => setSkillForm((p) => ({ ...p, level: v }))}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
                {kpis.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">Link to KPI (optional)</Label>
                    <Select value={skillForm.linkedKpiId} onValueChange={(v) => setSkillForm((p) => ({ ...p, linkedKpiId: v }))}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select KPI..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">— None —</SelectItem>
                        {(kpis as any[]).map((kpi) => (
                          <SelectItem key={kpi.id} value={String(kpi.id)}>{kpi.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {swotItems.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">Link to SWOT item (optional)</Label>
                    <Select value={skillForm.linkedSwotId} onValueChange={(v) => setSkillForm((p) => ({ ...p, linkedSwotId: v }))}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select SWOT item..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">— None —</SelectItem>
                        {(swotItems as any[]).map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>[{s.quadrant}] {s.description}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!skillForm.name.trim() || createSkill.isPending}
                    onClick={() => {
                      if (!currentProjectId) { toast.error("No project selected"); return; }
                      createSkill.mutate({
                        stakeholderId: stakeholder.id,
                        name: skillForm.name,
                        level: skillForm.level,
                        linkedKpiId: skillForm.linkedKpiId ? parseInt(skillForm.linkedKpiId) : null,
                        linkedSwotId: skillForm.linkedSwotId ? parseInt(skillForm.linkedSwotId) : null,
                      });
                    }}
                  >
                    Save Skill
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowSkillForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Skill list */}
            {skills.length === 0 && !showSkillForm ? (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No skills recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(skills as any[]).map((skill) => {
                  const linkedKpi = (kpis as any[]).find((k) => k.id === skill.linkedKpiId);
                  const linkedSwot = (swotItems as any[]).find((s) => s.id === skill.linkedSwotId);
                  return (
                    <div key={skill.id} className="border rounded-lg px-3 py-2.5 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{skill.name}</span>
                          <Badge className={`text-xs ${getSkillLevelBadge(skill.level)}`}>{skill.level}</Badge>
                          {linkedKpi && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Target className="h-2.5 w-2.5" /> KPI: {linkedKpi.name}
                            </span>
                          )}
                          {linkedSwot && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Brain className="h-2.5 w-2.5" /> {linkedSwot.quadrant}: {linkedSwot.description.length > 30 ? linkedSwot.description.slice(0, 30) + "…" : linkedSwot.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Select
                          value={skill.level}
                          onValueChange={(v) => updateSkill.mutate({ id: skill.id, data: { level: v as "Beginner" | "Intermediate" | "Advanced" | "Expert" } })}
                        >
                          <SelectTrigger className="h-6 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                          onClick={() => deleteSkill.mutate({ id: skill.id })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ─── Power/Interest Matrix ────────────────────────────────────────────────────
const QUADRANT_CONFIG = [
  { key: "keep-satisfied",  label: "Keep Satisfied",  icon: "⚡", desc: "High Power · Low Interest", gradient: "from-amber-50 to-amber-100/60",  border: "border-amber-200/60",  text: "text-amber-700",  dot: "#f59e0b", corner: "top-3 left-3"   },
  { key: "manage-closely",  label: "Manage Closely",  icon: "🎯", desc: "High Power · High Interest", gradient: "from-rose-50 to-rose-100/60",    border: "border-rose-200/60",   text: "text-rose-700",   dot: "#ef4444", corner: "top-3 right-3"  },
  { key: "monitor",         label: "Monitor",          icon: "👁", desc: "Low Power · Low Interest",  gradient: "from-slate-50 to-slate-100/50",  border: "border-slate-200/50",  text: "text-slate-500",  dot: "#94a3b8", corner: "bottom-3 left-3" },
  { key: "keep-informed",   label: "Keep Informed",   icon: "📢", desc: "Low Power · High Interest", gradient: "from-sky-50 to-sky-100/60",      border: "border-sky-200/60",    text: "text-sky-700",    dot: "#0ea5e9", corner: "bottom-3 right-3"},
];

const BUBBLE_COLORS: Record<string, string> = {
  TeamMember: "#6366f1",
  External:   "#f97316",
  Stakeholder:"#8b5cf6",
};
const FALLBACK_COLORS = ['#3b82f6','#10b981','#f97316','#ef4444','#06b6d4','#f59e0b','#84cc16','#ec4899'];

function PowerInterestMatrix({
  stakeholders,
  onUpdatePosition,
  onStakeholderClick,
}: {
  stakeholders: any[];
  onUpdatePosition?: (id: number, power: number, interest: number) => void;
  onStakeholderClick?: (s: any) => void;
}) {
  const matrixRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: number; startPower: number; startInterest: number } | null>(null);
  const [positions, setPositions] = useState<Record<number, { power: number; interest: number }>>({});
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; id: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragMoved = useRef(false);

  // Build effective positions: override with local drag state
  const getPos = useCallback((s: any) => {
    if (positions[s.id]) return positions[s.id];
    return {
      power: typeof s.powerLevel === 'number' ? s.powerLevel : 3,
      interest: typeof s.interestLevel === 'number' ? s.interestLevel : 3,
    };
  }, [positions]);

  function pctToValue(pct: number): number {
    return Math.round(Math.min(5, Math.max(1, 1 + pct * 4)));
  }
  function valueToPct(v: number): number {
    return (v - 1) / 4;
  }

  function getMatrixXY(clientX: number, clientY: number) {
    const rect = matrixRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const xPct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const yPct = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    return { xPct, yPct };
  }

  function handleBubbleMouseDown(e: React.MouseEvent, s: any) {
    e.preventDefault();
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragMoved.current = false;
    const pos = getPos(s);
    setDragging({ id: s.id, startPower: pos.power, startInterest: pos.interest });
    setHovered(s.id);
    setTooltip(null);
  }

  useEffect(() => {
    if (!dragging) return;
    function onMove(e: MouseEvent) {
      if (!dragMoved.current && dragStart.current) {
        const dx = Math.abs(e.clientX - dragStart.current.x);
        const dy = Math.abs(e.clientY - dragStart.current.y);
        if (dx > 5 || dy > 5) dragMoved.current = true;
      }
      if (!dragMoved.current) return;
      const xy = getMatrixXY(e.clientX, e.clientY);
      if (!xy) return;
      const interest = pctToValue(xy.xPct);
      const power = pctToValue(1 - xy.yPct);
      setPositions(prev => ({ ...prev, [dragging!.id]: { power, interest } }));
    }
    function onUp(e: MouseEvent) {
      if (dragMoved.current) {
        const xy = getMatrixXY(e.clientX, e.clientY);
        if (xy) {
          const interest = pctToValue(xy.xPct);
          const power = pctToValue(1 - xy.yPct);
          setPositions(prev => ({ ...prev, [dragging!.id]: { power, interest } }));
          onUpdatePosition?.(dragging!.id, power, interest);
        }
      } else {
        const clicked = stakeholders.find(x => x.id === dragging!.id);
        if (clicked) onStakeholderClick?.(clicked);
      }
      dragStart.current = null;
      dragMoved.current = false;
      setDragging(null);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging, onUpdatePosition]);

  const visible = stakeholders.filter(s => s.powerLevel != null && s.interestLevel != null);
  const missing = stakeholders.filter(s => s.powerLevel == null || s.interestLevel == null);

  // Strategy counts for legend
  const strategyCounts = useMemo(() => {
    const counts: Record<string, number> = { "manage-closely": 0, "keep-satisfied": 0, "keep-informed": 0, "monitor": 0 };
    visible.forEach(s => {
      const p = getPos(s); const strat = proposeEngagementStrategy(p.power, p.interest).toLowerCase().replace(" ", "-");
      if (counts[strat] !== undefined) counts[strat]++;
    });
    return counts;
  }, [visible, getPos]);

  return (
    <div className="space-y-4">
      {/* Header summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {QUADRANT_CONFIG.map(q => (
          <div key={q.key} className={`rounded-xl border px-3 py-2 bg-gradient-to-br ${q.gradient} ${q.border}`}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span>{q.icon}</span>
              <span className={`text-xs font-semibold ${q.text}`}>{q.label}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">{q.desc}</div>
            <div className={`text-2xl font-bold mt-1 ${q.text}`}>{strategyCounts[q.key] ?? 0}</div>
          </div>
        ))}
      </div>

      {/* Tip */}
      <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1">
        <span>💡</span> Drag a bubble to reposition a stakeholder on the matrix — changes are saved automatically.
      </p>

      {/* Matrix */}
      <div className="relative border border-border/60 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-zinc-950" style={{ height: 560 }}>
        {/* Y axis label */}
        <div className="absolute left-0 top-0 bottom-8 w-9 flex items-center justify-center z-10 pointer-events-none">
          <span className="text-[10px] font-semibold text-muted-foreground/60 -rotate-90 whitespace-nowrap tracking-widest uppercase">Power ↑</span>
        </div>

        {/* Inner matrix area */}
        <div ref={matrixRef} className="absolute left-9 right-0 top-0 bottom-8"
          style={{ cursor: dragging ? "grabbing" : "default" }}
        >
          {/* Quadrant backgrounds */}
          <div className="absolute inset-0" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" }}>
            {/* Top-left: Keep Satisfied */}
            <div className={`relative bg-gradient-to-br ${QUADRANT_CONFIG[0].gradient} border-r border-b border-amber-200/40`}>
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="text-base">{QUADRANT_CONFIG[0].icon}</span>
                <div>
                  <div className={`text-[10px] font-bold uppercase tracking-wide ${QUADRANT_CONFIG[0].text}`}>{QUADRANT_CONFIG[0].label}</div>
                  <div className="text-[9px] text-muted-foreground/60">{QUADRANT_CONFIG[0].desc}</div>
                </div>
              </div>
            </div>
            {/* Top-right: Manage Closely */}
            <div className={`relative bg-gradient-to-bl ${QUADRANT_CONFIG[1].gradient} border-b border-rose-200/40`}>
              <div className="absolute top-3 right-3 flex items-center gap-1.5 flex-row-reverse">
                <span className="text-base">{QUADRANT_CONFIG[1].icon}</span>
                <div className="text-right">
                  <div className={`text-[10px] font-bold uppercase tracking-wide ${QUADRANT_CONFIG[1].text}`}>{QUADRANT_CONFIG[1].label}</div>
                  <div className="text-[9px] text-muted-foreground/60">{QUADRANT_CONFIG[1].desc}</div>
                </div>
              </div>
            </div>
            {/* Bottom-left: Monitor */}
            <div className={`relative bg-gradient-to-tr ${QUADRANT_CONFIG[2].gradient} border-r border-slate-200/40`}>
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                <span className="text-base">{QUADRANT_CONFIG[2].icon}</span>
                <div>
                  <div className={`text-[10px] font-bold uppercase tracking-wide ${QUADRANT_CONFIG[2].text}`}>{QUADRANT_CONFIG[2].label}</div>
                  <div className="text-[9px] text-muted-foreground/60">{QUADRANT_CONFIG[2].desc}</div>
                </div>
              </div>
            </div>
            {/* Bottom-right: Keep Informed */}
            <div className={`relative bg-gradient-to-tl ${QUADRANT_CONFIG[3].gradient}`}>
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 flex-row-reverse">
                <span className="text-base">{QUADRANT_CONFIG[3].icon}</span>
                <div className="text-right">
                  <div className={`text-[10px] font-bold uppercase tracking-wide ${QUADRANT_CONFIG[3].text}`}>{QUADRANT_CONFIG[3].label}</div>
                  <div className="text-[9px] text-muted-foreground/60">{QUADRANT_CONFIG[3].desc}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Center cross-hair lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-border/80" />
            <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-border/80" />
            {/* Minor grid lines at values 2 and 4 only (skip 3=center and 5=edge) */}
            {[1,3].map(n => (
              <div key={`x${n}`} className="absolute top-0 bottom-0 w-px bg-border/20" style={{ left: `${(n / 4) * 100}%` }} />
            ))}
            {[1,3].map(n => (
              <div key={`y${n}`} className="absolute left-0 right-0 h-px bg-border/20" style={{ top: `${(n / 4) * 100}%` }} />
            ))}
          </div>

          {/* Axis tick values — absolutely positioned to match bubble coordinates */}
          <div className="absolute left-0 right-0 bottom-0 pointer-events-none" style={{ height: 0 }}>
            {[1,2,3,4,5].map(n => (
              <div key={n} className="absolute" style={{ left: `${((n - 1) / 4) * 100}%`, transform: "translateX(-50%) translateY(3px)" }}>
                <span className="text-[9px] text-muted-foreground/50">{n}</span>
              </div>
            ))}
          </div>
          <div className="absolute top-0 bottom-0 left-0 pointer-events-none" style={{ width: 0 }}>
            {[1,2,3,4,5].map(n => (
              <div key={n} className="absolute flex items-center" style={{ top: `${((5 - n) / 4) * 100}%`, transform: "translateY(-50%) translateX(-16px)" }}>
                <span className="text-[9px] text-muted-foreground/50">{n}</span>
              </div>
            ))}
          </div>

          {/* Stakeholder bubbles */}
          {visible.map((s, idx) => {
            const pos = getPos(s);
            const xPct = valueToPct(pos.interest) * 100;
            const yPct = (1 - valueToPct(pos.power)) * 100;
            const isDraggingThis = dragging?.id === s.id;
            const isHovered = hovered === s.id && !dragging;
            const cls = s.classification ?? (s.isInternalTeam ? "TeamMember" : "Stakeholder");
            const color = BUBBLE_COLORS[cls] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
            const initials = (s.fullName || s.name || "?")
              .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
            const strategy = proposeEngagementStrategy(pos.power, pos.interest);
            const stratQ = QUADRANT_CONFIG.find(q => q.key === strategy.toLowerCase().replace(/ /g, "-"));

            return (
              <div
                key={s.id}
                className="absolute select-none"
                style={{
                  left: `calc(${xPct}% - 22px)`,
                  top: `calc(${yPct}% - 22px)`,
                  zIndex: isDraggingThis ? 100 : isHovered ? 50 : 10,
                  transition: isDraggingThis ? "none" : "left 0.15s ease, top 0.15s ease",
                }}
                onMouseDown={e => handleBubbleMouseDown(e, s)}
                onMouseEnter={() => { if (!dragging) setHovered(s.id); }}
                onMouseLeave={() => { if (!dragging) setHovered(null); }}
              >
                {/* Shadow ring when hovered */}
                {(isHovered || isDraggingThis) && (
                  <div
                    className="absolute -inset-2 rounded-full animate-pulse"
                    style={{ background: `${color}25` }}
                  />
                )}
                {/* Bubble */}
                <div
                  className="h-11 w-11 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-[2.5px] border-white transition-transform"
                  style={{
                    backgroundColor: color,
                    cursor: isDraggingThis ? "grabbing" : "grab",
                    transform: isDraggingThis ? "scale(1.2)" : isHovered ? "scale(1.08)" : "scale(1)",
                    boxShadow: isDraggingThis
                      ? `0 8px 24px ${color}60`
                      : isHovered
                      ? `0 4px 12px ${color}50`
                      : `0 2px 6px ${color}40`,
                  }}
                >
                  {initials}
                </div>
                {/* Name label */}
                <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1.5 pointer-events-none transition-all ${isHovered || isDraggingThis ? "opacity-100" : "opacity-80"}`}>
                  <div className="whitespace-nowrap text-[10px] font-medium bg-background/95 border border-border rounded-full px-2 py-0.5 shadow-sm">
                    {(s.fullName || s.name || "").split(" ")[0]}
                  </div>
                </div>
                {/* Rich tooltip on hover */}
                {isHovered && !dragging && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 pointer-events-none z-50">
                    <div className="bg-background border border-border rounded-xl shadow-xl p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: color }}>{initials}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{s.fullName || s.name}</p>
                          {s.role && <p className="text-[10px] text-muted-foreground truncate">{s.role}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <div className="bg-muted/40 rounded px-2 py-1">
                          <span className="text-muted-foreground">Power</span>
                          <span className="ml-1 font-bold">{pos.power}/5</span>
                        </div>
                        <div className="bg-muted/40 rounded px-2 py-1">
                          <span className="text-muted-foreground">Interest</span>
                          <span className="ml-1 font-bold">{pos.interest}/5</span>
                        </div>
                      </div>
                      {stratQ && (
                        <div className={`flex items-center gap-1 text-[10px] rounded px-2 py-1 bg-gradient-to-r ${stratQ.gradient} border ${stratQ.border}`}>
                          <span>{stratQ.icon}</span>
                          <span className={`font-semibold ${stratQ.text}`}>{stratQ.label}</span>
                        </div>
                      )}
                      <p className="text-[9px] text-muted-foreground/60">Drag to reposition</p>
                    </div>
                    {/* Caret */}
                    <div className="w-2.5 h-2.5 bg-background border-r border-b border-border rotate-45 mx-auto -mt-1.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* X axis label */}
        <div className="absolute left-9 right-0 bottom-0 h-8 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-semibold text-muted-foreground/60 tracking-widest uppercase">Interest →</span>
        </div>
      </div>

      {/* Missing data notice */}
      {missing.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border border-border/50">
          <span>ℹ️</span>
          <span>{missing.length} stakeholder{missing.length > 1 ? "s" : ""} not shown — edit their profile to set Power (1–5) and Interest (1–5).</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Stakeholders Page ───────────────────────────────────────────────────
export default function Stakeholders() {
  const { currentProjectId } = useProject();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [classificationFilter, setClassificationFilter] = useState<"all" | "TeamMember" | "External" | "Stakeholder">("all");
  const [strategyFilter, setStrategyFilter] = useState<string>("all");
  const [matrixClassFilter, setMatrixClassFilter] = useState<"all" | "TeamMember" | "External" | "Stakeholder">("all");
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

  const { data: kpiSummaries = [] } = trpc.stakeholderEnhancements.listProjectKpiSummary.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );
  const kpiSummaryMap = useMemo(() => {
    const map = new Map<number, { latestOverallScore: number | null; previousOverallScore: number | null }>();
    for (const s of kpiSummaries) map.set(s.stakeholderId, { latestOverallScore: s.latestOverallScore, previousOverallScore: s.previousOverallScore });
    return map;
  }, [kpiSummaries]);

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

  const updatePositionMutation = trpc.stakeholders.update.useMutation({
    onSuccess: () => utils.stakeholders.list.invalidate(),
    onError: (e) => toast.error(`Failed to save position: ${e.message}`),
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

  const handleExportCSV = () => {
    const headers = ["ID","Full Name","Department","Role","Classification","Email","Phone",
      "Current Engagement","Desired Engagement","Engagement Strategy",
      "Comm Channel","Comm Frequency","Power Level","Interest Level","Notes"];

    const rows = (stakeholders ?? []).map(s => [
      s.id,
      s.fullName || s.name || "",
      s.department || "",
      s.job || s.role || "",
      s.classification || "",
      s.email || "",
      s.phone || "",
      s.currentEngagementStatus || "",
      s.desiredEngagementStatus || "",
      s.engagementStrategy || "",
      s.communicationChannel || "",
      s.communicationFrequency || "",
      s.powerLevel ?? "",
      s.interestLevel ?? "",
      s.notes || "",
    ]);

    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stakeholder-register.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1" /> Export Register
          </Button>
          <Button
            onClick={() => { setFormData(EMPTY_FORM); setIsCreateOpen(true); }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Add Stakeholder
          </Button>
          {currentProjectId && (
            <ImportExportToolbar
              module="stakeholders"
              projectId={currentProjectId}
              onImportSuccess={() => {
                utils.stakeholders.list.invalidate();
                utils.commPlanOptions.positionOptions.list.invalidate();
                utils.commPlanOptions.roleOptions.list.invalidate();
              }}
            />
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

      {/* Main tabs: Register only (Power/Interest Matrix moved to its own page) */}
      <Tabs defaultValue="register">
        <TabsList>
          <TabsTrigger value="register">Stakeholder Register</TabsTrigger>
        </TabsList>

        {/* Register Tab */}
        <TabsContent value="register" className="space-y-4 mt-4">

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
              <TableHead>KPI Score</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStakeholders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
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
                    <TableCell>
                      {(() => {
                        const kpi = kpiSummaryMap.get(s.id);
                        if (!kpi || kpi.latestOverallScore === null) {
                          return <span className="text-muted-foreground text-xs">—</span>;
                        }
                        const score = Number(kpi.latestOverallScore);
                        const prev = kpi.previousOverallScore !== null && kpi.previousOverallScore !== undefined ? Number(kpi.previousOverallScore) : null;
                        const rawDiff = prev !== null ? score - prev : null;
                        const diff = rawDiff !== null && !isNaN(rawDiff) ? rawDiff : null;
                        const scoreColor = score >= 75 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";
                        return (
                          <div className="flex items-center gap-1.5">
                            <span className={`font-semibold text-sm ${scoreColor}`}>{score}</span>
                            {diff !== null && (
                              <>
                                {diff > 0
                                  ? <TrendingUp className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                  : diff < 0
                                  ? <TrendingDown className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                  : <span className="text-muted-foreground text-xs">→</span>}
                                <span className={`text-xs font-medium ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                                  {diff > 0 ? `+${diff}` : diff}
                                </span>
                              </>
                            )}
                          </div>
                        );
                      })()}
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

        </TabsContent>

      </Tabs>

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
