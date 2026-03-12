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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, Search, Users, Mail, Phone, Briefcase,
  Target, ClipboardList, Star, TrendingUp, UserCheck, Link2, Unlink,
  BarChart2, ChevronRight, Award, Activity,
} from "lucide-react";
import { ImportExportToolbar } from "@/components/ImportExportToolbar";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/dateUtils";
import { CustomFieldsSection } from "@/components/CustomFieldsSection";

// ─── Types ────────────────────────────────────────────────────────────────────
type StakeholderFormData = {
  fullName: string;
  email: string;
  position: string;
  role: string;
  job: string;
  phone: string;
  isInternalTeam: boolean;
  powerLevel: number;
  interestLevel: number;
  engagementStrategy: string;
  communicationFrequency: string;
  communicationChannel: string;
  communicationMessage: string;
  communicationResponsible: string;
  communicationResponsibleId: number | undefined;
  notes: string;
  costPerHour: string;
  costPerDay: string;
};

const EMPTY_FORM: StakeholderFormData = {
  fullName: "", email: "", position: "", role: "", job: "", phone: "",
  isInternalTeam: false, powerLevel: 3, interestLevel: 3,
  engagementStrategy: "", communicationFrequency: "", communicationChannel: "",
  communicationMessage: "", communicationResponsible: "", communicationResponsibleId: undefined, notes: "",
  costPerHour: "", costPerDay: "",
};

const ENGAGEMENT_STRATEGIES = [
  "Manage Closely",
  "Keep Satisfied",
  "Keep Informed",
  "Monitor",
];

const COMM_FREQUENCIES = ["Daily", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "As needed"];
const COMM_CHANNELS = ["Email", "Meeting", "Phone", "Slack", "Teams", "Report", "Newsletter"];

function getEngagementBadge(strategy: string | null | undefined) {
  const map: Record<string, string> = {
    "Manage Closely": "bg-red-100 text-red-700 border-red-200",
    "Keep Satisfied": "bg-orange-100 text-orange-700 border-orange-200",
    "Keep Informed": "bg-blue-100 text-blue-700 border-blue-200",
    "Monitor": "bg-gray-100 text-gray-600 border-gray-200",
  };
  return map[strategy || ""] || "bg-muted text-muted-foreground border-border";
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

// ─── Dev Plan Dialog (Internal Team Task Groups) ──────────────────────────────
function DevPlanDialog({
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
  const [selectedTgId, setSelectedTgId] = useState<string>("");

  const { data: links = [] } = trpc.stakeholderEnhancements.listTaskGroupLinks.useQuery(
    { stakeholderId: stakeholder?.id },
    { enabled: !!stakeholder?.id && open }
  );
  const { data: allTaskGroups = [] } = trpc.dropdownOptions.taskGroups.getAll.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId && open }
  );
  const { data: allTasks = [] } = trpc.tasks.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId && open }
  );

  const linkMutation = trpc.stakeholderEnhancements.linkTaskGroup.useMutation({
    onSuccess: () => {
      utils.stakeholderEnhancements.listTaskGroupLinks.invalidate({ stakeholderId: stakeholder.id });
      setSelectedTgId("");
      toast.success("Task Group linked");
    },
  });
  const unlinkMutation = trpc.stakeholderEnhancements.unlinkTaskGroup.useMutation({
    onSuccess: () => {
      utils.stakeholderEnhancements.listTaskGroupLinks.invalidate({ stakeholderId: stakeholder.id });
      toast.success("Task Group unlinked");
    },
  });

  const linkedIds = new Set(links.map((l: any) => l.taskGroupId));
  const availableTgs = allTaskGroups.filter((tg: any) => !linkedIds.has(tg.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Development Plan — {stakeholder?.fullName}
          </DialogTitle>
          <DialogDescription>
            Link Task Groups to this team member to define their development responsibilities.
          </DialogDescription>
        </DialogHeader>

        {/* Link new task group */}
        <div className="flex gap-2">
          <Select value={selectedTgId} onValueChange={setSelectedTgId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a Task Group to link..." />
            </SelectTrigger>
            <SelectContent>
              {availableTgs.map((tg: any) => (
                <SelectItem key={tg.id} value={String(tg.id)}>
                  {tg.idCode} — {tg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={!selectedTgId || linkMutation.isPending}
            onClick={() => linkMutation.mutate({ stakeholderId: stakeholder.id, taskGroupId: parseInt(selectedTgId) })}
          >
            <Link2 className="h-4 w-4 mr-1" /> Link
          </Button>
        </div>

        {/* Linked Task Groups with their tasks */}
        <div className="space-y-4">
          {links.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No Task Groups linked yet.</p>
          ) : (
            links.map((link: any) => {
              const groupTasks = allTasks.filter((t: any) => t.taskGroupId === link.taskGroupId);
              const doneTasks = groupTasks.filter((t: any) =>
                ["Completed", "Closed", "Done", "Solved", "Approved", "Passed"].some(
                  (s) => (t.currentStatus || "").toLowerCase() === s.toLowerCase()
                )
              );
              const progress = groupTasks.length > 0 ? Math.round((doneTasks.length / groupTasks.length) * 100) : 0;

              return (
                <div key={link.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{link.taskGroupCode} — {link.taskGroupName}</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {doneTasks.length}/{groupTasks.length} tasks complete
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">{progress}%</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => unlinkMutation.mutate({ id: link.id })}
                      >
                        <Unlink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {/* Task list */}
                  {groupTasks.length > 0 && (
                    <div className="space-y-1">
                      {groupTasks.slice(0, 5).map((t: any) => (
                        <div key={t.id} className="flex items-center gap-2 text-sm">
                          <div className={`h-2 w-2 rounded-full shrink-0 ${
                            ["Completed", "Closed", "Done", "Solved"].some((s) => (t.currentStatus || "").toLowerCase() === s.toLowerCase())
                              ? "bg-green-500"
                              : "bg-muted-foreground/40"
                          }`} />
                          <span className="flex-1 truncate">{t.taskId} — {t.description}</span>
                          <Badge variant="outline" className="text-xs shrink-0">{t.currentStatus || "Open"}</Badge>
                        </div>
                      ))}
                      {groupTasks.length > 5 && (
                        <p className="text-xs text-muted-foreground pl-4">+{groupTasks.length - 5} more tasks</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Stakeholders Page ───────────────────────────────────────────────────
export default function Stakeholders() {
  const { currentProjectId } = useProject();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStakeholder, setSelectedStakeholder] = useState<any>(null);
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [devPlanDialogOpen, setDevPlanDialogOpen] = useState(false);
  const [formData, setFormData] = useState<StakeholderFormData>(EMPTY_FORM);
  const [viewMode, setViewMode] = useState<"table" | "matrix">("table");
  const [dragOverQuadrant, setDragOverQuadrant] = useState<string | null>(null);

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
      setSelectedStakeholder(null);
      toast.success("Stakeholder deleted");
    },
  });

  const handleEdit = (s: any) => {
    setSelectedStakeholder(s);
    setFormData({
      fullName: s.fullName || "",
      email: s.email || "",
      position: s.position || "",
      role: s.role || "",
      job: s.job || "",
      phone: s.phone || "",
      isInternalTeam: s.isInternalTeam || false,
      powerLevel: s.powerLevel ?? 3,
      interestLevel: s.interestLevel ?? 3,
      engagementStrategy: s.engagementStrategy || "",
      communicationFrequency: s.communicationFrequency || "",
      communicationChannel: s.communicationChannel || "",
      communicationMessage: s.communicationMessage || "",
      communicationResponsible: s.communicationResponsible || "",
      communicationResponsibleId: s.communicationResponsibleId ?? undefined,
      notes: s.notes || "",
      costPerHour: s.costPerHour != null ? String(s.costPerHour) : "",
      costPerDay: s.costPerDay != null ? String(s.costPerDay) : "",
    });
    setIsEditOpen(true);
  };

  const filteredStakeholders = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return stakeholders.filter((s) => {
      const matchesSearch =
        !q ||
        s.fullName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.position?.toLowerCase().includes(q) ||
        s.role?.toLowerCase().includes(q) ||
        s.job?.toLowerCase().includes(q);
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "internal" && s.isInternalTeam) ||
        (activeTab === "external" && !s.isInternalTeam);
      return matchesSearch && matchesTab;
    });
  }, [stakeholders, searchTerm, activeTab]);

  const internalCount = stakeholders.filter((s) => s.isInternalTeam).length;
  const externalCount = stakeholders.filter((s) => !s.isInternalTeam).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // ─── Shared form fields ───────────────────────────────────────────────────
  const renderFormFields = () => (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basic Information</p>
        <div className="space-y-2">
          <Label>Full Name *</Label>
          <Input
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="John Doe"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 234 567 8900"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Position</Label>
            <Input
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="Project Manager"
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="Sponsor"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Department</Label>
          <Input
            value={formData.job}
            onChange={(e) => setFormData({ ...formData, job: e.target.value })}
            placeholder="IT Department"
          />
        </div>
      </div>

      {/* Cost fields */}
      <div className="space-y-3 border-t pt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cost Rates</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Cost Per Hour ($)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.costPerHour}
              onChange={(e) => setFormData({ ...formData, costPerHour: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, costPerDay: e.target.value })}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Internal Team */}
      <div className="space-y-3 border-t pt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Classification</p>
        <div className="flex items-center gap-3">
          <Switch
            checked={formData.isInternalTeam}
            onCheckedChange={(v) => setFormData({ ...formData, isInternalTeam: v })}
          />
          <Label>Internal Team Member</Label>
          {formData.isInternalTeam && (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">Internal</Badge>
          )}
        </div>
      </div>

      {/* Engagement */}
      <div className="space-y-3 border-t pt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Engagement & Communication</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Power Level: {formData.powerLevel}/5</Label>
            <Slider
              min={1} max={5} step={1}
              value={[formData.powerLevel]}
              onValueChange={([v]) => setFormData({ ...formData, powerLevel: v })}
            />
          </div>
          <div className="space-y-2">
            <Label>Interest Level: {formData.interestLevel}/5</Label>
            <Slider
              min={1} max={5} step={1}
              value={[formData.interestLevel]}
              onValueChange={([v]) => setFormData({ ...formData, interestLevel: v })}
            />
          </div>
        </div>
        {/* Engagement strategy auto-derived from Power/Interest sliders */}
        <div className="space-y-1 p-2 bg-muted/40 rounded-md">
          <p className="text-xs text-muted-foreground">Engagement Strategy (auto-derived from Power/Interest)</p>
          <p className="text-sm font-semibold">
            {formData.powerLevel >= 3 && formData.interestLevel >= 3 ? "Manage Closely" :
             formData.powerLevel >= 3 && formData.interestLevel < 3 ? "Keep Satisfied" :
             formData.powerLevel < 3 && formData.interestLevel >= 3 ? "Keep Informed" :
             "Monitor"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Communication Frequency</Label>
            <Select value={formData.communicationFrequency} onValueChange={(v) => setFormData({ ...formData, communicationFrequency: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Frequency..." />
              </SelectTrigger>
              <SelectContent>
                {COMM_FREQUENCIES.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Channel</Label>
            <Select value={formData.communicationChannel} onValueChange={(v) => setFormData({ ...formData, communicationChannel: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Channel..." />
              </SelectTrigger>
              <SelectContent>
                {COMM_CHANNELS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Key Message</Label>
          <Textarea
            value={formData.communicationMessage}
            onChange={(e) => setFormData({ ...formData, communicationMessage: e.target.value })}
            placeholder="Key message to communicate to this stakeholder..."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>Communication Responsible</Label>
          <Select
            value={formData.communicationResponsibleId?.toString() ?? ""}
            onValueChange={(val) => {
              const id = parseInt(val);
              const found = stakeholders.find((s) => s.id === id);
              setFormData({
                ...formData,
                communicationResponsibleId: id,
                communicationResponsible: found?.fullName ?? "",
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select responsible stakeholder..." />
            </SelectTrigger>
            <SelectContent>
              {stakeholders.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  <span className="font-medium">{s.fullName}</span>
                  {s.position && <span className="text-muted-foreground ml-1 text-xs">— {s.position}</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes..."
            rows={2}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-card border rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Stakeholder Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage stakeholders, internal team development plans, KPIs, and engagement strategies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{stakeholders.length} Total</Badge>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">{internalCount} Internal</Badge>
          <Button onClick={() => { setFormData(EMPTY_FORM); setIsCreateOpen(true); }} className="gap-2">
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
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stakeholders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><UserCheck className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Internal Team</p>
                <p className="text-2xl font-bold">{internalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg"><Briefcase className="h-5 w-5 text-purple-600" /></div>
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
              <div className="p-2 bg-red-100 rounded-lg"><Activity className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Manage Closely</p>
                <p className="text-2xl font-bold">
                  {stakeholders.filter((s) => s.engagementStrategy === "Manage Closely").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stakeholders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1 border rounded-lg p-1">
          {[
            { key: "all", label: "All" },
            { key: "internal", label: "Internal Team" },
            { key: "external", label: "External" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* View mode toggle */}
        <div className="flex gap-1 border rounded-lg p-1 ml-auto">
          <button onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            Table
          </button>
          <button onClick={() => setViewMode("matrix")}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === "matrix" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            Engagement Matrix
          </button>
        </div>
      </div>

      {/* ── Engagement Matrix View ────────────────────────────────────────────── */}
      {viewMode === "matrix" && (() => {
        // ── Power/Interest quadrant layout (top-left=Keep Satisfied, top-right=Manage Closely, bottom-left=Monitor, bottom-right=Keep Informed)
        const QUADRANTS = [
          { key: "Keep Satisfied",  label: "Keep Satisfied",  emoji: "😐", sub: "High Power · Low Interest",  bg: "#fff7ed", border: "#fb923c", headerColor: "#c2410c", badgeBg: "#ffedd5", badgeText: "#c2410c" },
          { key: "Manage Closely",  label: "Manage Closely",  emoji: "🎯", sub: "High Power · High Interest", bg: "#fef2f2", border: "#f87171", headerColor: "#b91c1c", badgeBg: "#fee2e2", badgeText: "#b91c1c" },
          { key: "Monitor",         label: "Monitor",         emoji: "👁",  sub: "Low Power · Low Interest",   bg: "#f9fafb", border: "#d1d5db", headerColor: "#4b5563", badgeBg: "#f3f4f6", badgeText: "#4b5563" },
          { key: "Keep Informed",   label: "Keep Informed",   emoji: "📢", sub: "Low Power · High Interest",  bg: "#eff6ff", border: "#60a5fa", headerColor: "#1d4ed8", badgeBg: "#dbeafe", badgeText: "#1d4ed8" },
        ];
        const UNASSIGNED_KEY = "__unassigned__";
        const assignedKeys = new Set(QUADRANTS.map(q => q.key));
        const unassigned = filteredStakeholders.filter(s => !s.engagementStrategy || !assignedKeys.has(s.engagementStrategy));
        // Avatar color palette
        const AVATAR_COLORS = [
          ["#f87171","#b91c1c"],["#fb923c","#c2410c"],["#fbbf24","#92400e"],
          ["#34d399","#065f46"],["#60a5fa","#1d4ed8"],["#a78bfa","#5b21b6"],
          ["#f472b6","#9d174d"],["#94a3b8","#334155"],
        ];
        const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];
        const StakeholderCard = ({ s, quadrantBg }: { s: any; quadrantBg?: string }) => {
          const [from, to] = avatarColor(s.id);
          return (
            <div
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("stakeholderId", String(s.id));
                e.dataTransfer.effectAllowed = "move";
              }}
              style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px', cursor: 'grab', userSelect: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', transition: 'box-shadow 0.15s, transform 0.15s' }}
              className="hover:shadow-lg hover:-translate-y-0.5 active:cursor-grabbing w-full"
              title={`${s.fullName}${s.position ? ` — ${s.position}` : ""}\nDrag to change engagement strategy`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${from}, ${to})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {s.fullName?.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.fullName}</div>
                  {s.position && <div style={{ fontSize: '10px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.position}</div>}
                </div>
                <div style={{ marginLeft: 'auto', flexShrink: 0, fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: '#f3f4f6', color: '#374151' }}>
                  P{s.powerLevel ?? 3}/I{s.interestLevel ?? 3}
                </div>
              </div>
              {/* Mini power/interest bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#9ca3af', width: '36px', flexShrink: 0 }}>Power</span>
                  <div style={{ flex: 1, height: '4px', background: '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#f97316', borderRadius: '2px', width: `${((s.powerLevel ?? 3) / 5) * 100}%` }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#9ca3af', width: '36px', flexShrink: 0 }}>Interest</span>
                  <div style={{ flex: 1, height: '4px', background: '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#3b82f6', borderRadius: '2px', width: `${((s.interestLevel ?? 3) / 5) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        };
        return (
          <div className="space-y-4">
            {/* Instructions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Drag stakeholder cards between quadrants to change their engagement strategy. Drop on the <strong>Unassigned</strong> pool to clear.</p>
              {unassigned.length > 0 && (
                <span style={{ fontSize: '10px', background: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>{unassigned.length} unassigned</span>
              )}
            </div>

            {/* The 2×2 Power/Interest Matrix */}
            <div style={{ display: 'flex', gap: '0' }}>
              {/* Y-axis label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '24px', flexShrink: 0, gap: '4px' }}>
                <span style={{ fontSize: '10px', color: '#6b7280', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.05em', fontWeight: 600 }}>POWER ↑</span>
              </div>
              <div style={{ flex: 1 }}>
                {/* Top row: High Power */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', marginBottom: '3px' }}>
                  {/* Top-left: Keep Satisfied (High Power, Low Interest) */}
                  {[QUADRANTS[0], QUADRANTS[1]].map(q => (
                    <div
                      key={q.key}
                      style={{ background: q.bg, border: `2px solid ${dragOverQuadrant === q.key ? '#6d28d9' : q.border}`, borderRadius: '12px', padding: '12px', minHeight: '180px', transition: 'all 0.15s', boxShadow: dragOverQuadrant === q.key ? '0 0 0 3px rgba(109,40,217,0.2), 0 4px 12px rgba(0,0,0,0.1)' : 'none', transform: dragOverQuadrant === q.key ? 'scale(1.01)' : 'scale(1)' }}
                      onDragOver={(e) => { e.preventDefault(); setDragOverQuadrant(q.key); }}
                      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverQuadrant(null); }}
                      onDrop={(e) => { e.preventDefault(); setDragOverQuadrant(null); const id = parseInt(e.dataTransfer.getData("stakeholderId")); if (!id) return; updateMutation.mutate({ id, data: { engagementStrategy: q.key } }); }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '14px' }}>{q.emoji}</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: q.headerColor }}>{q.label}</span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#6b7280' }}>{q.sub}</div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, background: q.badgeBg, color: q.badgeText, padding: '1px 6px', borderRadius: '6px' }}>
                          {filteredStakeholders.filter(s => s.engagementStrategy === q.key).length}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {filteredStakeholders.filter(s => s.engagementStrategy === q.key).map(s => <StakeholderCard key={s.id} s={s} />)}
                        {filteredStakeholders.filter(s => s.engagementStrategy === q.key).length === 0 && (
                          <div style={{ border: `2px dashed ${dragOverQuadrant === q.key ? '#6d28d9' : '#d1d5db'}`, borderRadius: '8px', padding: '16px', textAlign: 'center', fontSize: '11px', color: '#9ca3af', background: dragOverQuadrant === q.key ? 'rgba(109,40,217,0.04)' : 'transparent', transition: 'all 0.15s' }}>
                            Drop here
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Bottom row: Low Power */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
                  {[QUADRANTS[2], QUADRANTS[3]].map(q => (
                    <div
                      key={q.key}
                      style={{ background: q.bg, border: `2px solid ${dragOverQuadrant === q.key ? '#6d28d9' : q.border}`, borderRadius: '12px', padding: '12px', minHeight: '180px', transition: 'all 0.15s', boxShadow: dragOverQuadrant === q.key ? '0 0 0 3px rgba(109,40,217,0.2), 0 4px 12px rgba(0,0,0,0.1)' : 'none', transform: dragOverQuadrant === q.key ? 'scale(1.01)' : 'scale(1)' }}
                      onDragOver={(e) => { e.preventDefault(); setDragOverQuadrant(q.key); }}
                      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverQuadrant(null); }}
                      onDrop={(e) => { e.preventDefault(); setDragOverQuadrant(null); const id = parseInt(e.dataTransfer.getData("stakeholderId")); if (!id) return; updateMutation.mutate({ id, data: { engagementStrategy: q.key } }); }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '14px' }}>{q.emoji}</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: q.headerColor }}>{q.label}</span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#6b7280' }}>{q.sub}</div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, background: q.badgeBg, color: q.badgeText, padding: '1px 6px', borderRadius: '6px' }}>
                          {filteredStakeholders.filter(s => s.engagementStrategy === q.key).length}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {filteredStakeholders.filter(s => s.engagementStrategy === q.key).map(s => <StakeholderCard key={s.id} s={s} />)}
                        {filteredStakeholders.filter(s => s.engagementStrategy === q.key).length === 0 && (
                          <div style={{ border: `2px dashed ${dragOverQuadrant === q.key ? '#6d28d9' : '#d1d5db'}`, borderRadius: '8px', padding: '16px', textAlign: 'center', fontSize: '11px', color: '#9ca3af', background: dragOverQuadrant === q.key ? 'rgba(109,40,217,0.04)' : 'transparent', transition: 'all 0.15s' }}>
                            Drop here
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* X-axis label */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px 0', fontSize: '10px', color: '#6b7280', fontWeight: 600, letterSpacing: '0.05em' }}>
                  <span>← LOW INTEREST</span>
                  <span>HIGH INTEREST →</span>
                </div>
              </div>
            </div>

            {/* Unassigned Pool */}
            <div
              style={{ border: `2px dashed ${dragOverQuadrant === UNASSIGNED_KEY ? '#6d28d9' : '#d1d5db'}`, borderRadius: '12px', padding: '12px', background: dragOverQuadrant === UNASSIGNED_KEY ? 'rgba(109,40,217,0.04)' : '#f9fafb', transition: 'all 0.15s', boxShadow: dragOverQuadrant === UNASSIGNED_KEY ? '0 0 0 3px rgba(109,40,217,0.15)' : 'none' }}
              onDragOver={(e) => { e.preventDefault(); setDragOverQuadrant(UNASSIGNED_KEY); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverQuadrant(null); }}
              onDrop={(e) => { e.preventDefault(); setDragOverQuadrant(null); const id = parseInt(e.dataTransfer.getData("stakeholderId")); if (!id) return; updateMutation.mutate({ id, data: { engagementStrategy: "" } }); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Unassigned Pool</span>
                <span style={{ fontSize: '10px', background: '#e5e7eb', color: '#374151', padding: '1px 6px', borderRadius: '999px', fontWeight: 600 }}>{unassigned.length}</span>
                <span style={{ fontSize: '10px', color: '#9ca3af', marginLeft: 'auto' }}>Drag here to remove from matrix</span>
              </div>
              {unassigned.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', padding: '8px', fontStyle: 'italic' }}>All stakeholders are assigned to a quadrant</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
                  {unassigned.map(s => <StakeholderCard key={s.id} s={s} />)}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Table */}
      {viewMode === "table" &&
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Position / Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Power / Interest</TableHead>
              <TableHead className="hidden xl:table-cell">Cost Rate</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStakeholders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
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
              filteredStakeholders.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="font-medium">{s.fullName}</p>
                      {s.job && <p className="text-xs text-muted-foreground">{s.job}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.isInternalTeam ? (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Internal</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">External</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {s.position && <p>{s.position}</p>}
                      {s.role && <p className="text-muted-foreground">{s.role}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-0.5">
                      {s.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[140px]">{s.email}</span>
                        </div>
                      )}
                      {s.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {s.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.engagementStrategy ? (
                      <Badge className={`text-xs border ${getEngagementBadge(s.engagementStrategy)}`}>
                        {s.engagementStrategy}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      <span>P: {s.powerLevel ?? "—"}/5</span>
                      <span className="mx-1">·</span>
                      <span>I: {s.interestLevel ?? "—"}/5</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="text-xs space-y-0.5">
                      {s.costPerHour != null && (
                        <div className="text-muted-foreground">${Number(s.costPerHour).toFixed(2)}/hr</div>
                      )}
                      {s.costPerDay != null && (
                        <div className="text-muted-foreground">${Number(s.costPerDay).toFixed(2)}/day</div>
                      )}
                      {s.costPerHour == null && s.costPerDay == null && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        title="Edit"
                        onClick={() => handleEdit(s)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {s.isInternalTeam && (
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-blue-600"
                          title="Development Plan"
                          onClick={() => { setSelectedStakeholder(s); setDevPlanDialogOpen(true); }}
                        >
                          <ClipboardList className="h-3.5 w-3.5" />
                        </Button>
                      )}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Stakeholder</DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setFormData(EMPTY_FORM); }}>Cancel</Button>
            <Button
              onClick={() => {
                if (!formData.fullName.trim()) { toast.error("Full name is required"); return; }
                if (!currentProjectId) { toast.error("No project selected"); return; }
                const derivedStrategy = formData.powerLevel >= 3 && formData.interestLevel >= 3 ? "Manage Closely" :
                  formData.powerLevel >= 3 && formData.interestLevel < 3 ? "Keep Satisfied" :
                  formData.powerLevel < 3 && formData.interestLevel >= 3 ? "Keep Informed" : "Monitor";
                createMutation.mutate({
                  ...formData,
                  engagementStrategy: derivedStrategy,
                  projectId: currentProjectId,
                  costPerHour: formData.costPerHour || undefined,
                  costPerDay: formData.costPerDay || undefined,
                });
              }}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Stakeholder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Stakeholder — {selectedStakeholder?.fullName}</DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          {/* Custom Fields */}
          {currentProjectId && selectedStakeholder?.id && (
            <CustomFieldsSection
              projectId={currentProjectId}
              entityType="stakeholder"
              entityId={String(selectedStakeholder.id)}
            />
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setIsEditOpen(false); setFormData(EMPTY_FORM); }}>Cancel</Button>
            <Button
              onClick={() => {
                if (!selectedStakeholder) return;
                if (!formData.fullName.trim()) { toast.error("Full name is required"); return; }
                const derivedStrategy = formData.powerLevel >= 3 && formData.interestLevel >= 3 ? "Manage Closely" :
                  formData.powerLevel >= 3 && formData.interestLevel < 3 ? "Keep Satisfied" :
                  formData.powerLevel < 3 && formData.interestLevel >= 3 ? "Keep Informed" : "Monitor";
                updateMutation.mutate({
                  id: selectedStakeholder.id,
                  data: {
                    ...formData,
                    engagementStrategy: derivedStrategy,
                    costPerHour: formData.costPerHour || null,
                    costPerDay: formData.costPerDay || null,
                  },
                });
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Dev Plan Dialog */}
      {selectedStakeholder && (
        <DevPlanDialog
          stakeholder={selectedStakeholder}
          open={devPlanDialogOpen}
          onOpenChange={setDevPlanDialogOpen}
        />
      )}
    </div>
  );
}
