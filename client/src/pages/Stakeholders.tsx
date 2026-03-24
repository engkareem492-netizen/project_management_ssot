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
import {
  Sheet, SheetContent,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, Search, Users, Mail, Phone, Briefcase,
  Target, ClipboardList, Star, TrendingUp, UserCheck, Link2, Unlink,
  BarChart2, ChevronRight, Award, Activity, Brain, Lightbulb, Shield, BookOpen, Zap,
} from "lucide-react";
import { ImportExportToolbar } from "@/components/ImportExportToolbar";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/dateUtils";

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

function SparkLine({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80, h = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const lastColor = data[data.length - 1] >= data[0] ? "#22c55e" : "#ef4444";
  const lastPt = pts.split(" ").pop()!.split(",");
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline points={pts} fill="none" stroke={lastColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={parseFloat(lastPt[0])} cy={parseFloat(lastPt[1])} r="2.5" fill={lastColor} />
    </svg>
  );
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
                    <Select value={devPlanForm.linkedSkillId || "__none__"} onValueChange={(v) => setDevPlanForm((p) => ({ ...p, linkedSkillId: v === "__none__" ? "" : v }))}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select skill..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— None —</SelectItem>
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
                    <Select value={devPlanForm.linkedSwotId || "__none__"} onValueChange={(v) => setDevPlanForm((p) => ({ ...p, linkedSwotId: v === "__none__" ? "" : v }))}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select SWOT item..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— None —</SelectItem>
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
                    {/* DEV Tasks link */}
                    <div className="pt-1 border-t border-dashed border-teal-200 mt-1">
                      <button
                        onClick={() => {
                          sessionStorage.setItem('tasks_tab', 'development');
                          window.location.href = '/tasks';
                        }}
                        className="inline-flex items-center gap-1 text-[10px] text-teal-600 hover:text-teal-700 hover:underline font-medium"
                      >
                        <CheckSquare className="h-2.5 w-2.5" />
                        View / Create DEV Tasks →
                      </button>
                    </div>
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
                    <Select value={skillForm.linkedKpiId || "__none__"} onValueChange={(v) => setSkillForm((p) => ({ ...p, linkedKpiId: v === "__none__" ? "" : v }))}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select KPI..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— None —</SelectItem>
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
                    <Select value={skillForm.linkedSwotId || "__none__"} onValueChange={(v) => setSkillForm((p) => ({ ...p, linkedSwotId: v === "__none__" ? "" : v }))}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select SWOT item..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— None —</SelectItem>
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
  const [detailOpen, setDetailOpen] = useState(false);
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

  const handleRowClick = (s: any) => {
    setSelectedStakeholder(s);
    setDetailOpen(true);
  };

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
        <div className="space-y-2">
          <Label>Engagement Strategy</Label>
          <Select value={formData.engagementStrategy} onValueChange={(v) => setFormData({ ...formData, engagementStrategy: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select strategy..." />
            </SelectTrigger>
            <SelectContent>
              {ENGAGEMENT_STRATEGIES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        const QUADRANTS = [
          { key: "Keep Satisfied",  label: "Keep Satisfied",  sub: "High Power · Low Interest",  color: "bg-orange-50 border-orange-300",  headerColor: "text-orange-700", dotColor: "bg-orange-400" },
          { key: "Manage Closely",  label: "Manage Closely",  sub: "High Power · High Interest", color: "bg-red-50 border-red-300",         headerColor: "text-red-700",    dotColor: "bg-red-500"    },
          { key: "Monitor",         label: "Monitor",         sub: "Low Power · Low Interest",   color: "bg-gray-50 border-gray-300",       headerColor: "text-gray-600",   dotColor: "bg-gray-400"   },
          { key: "Keep Informed",   label: "Keep Informed",   sub: "Low Power · High Interest",  color: "bg-blue-50 border-blue-300",       headerColor: "text-blue-700",   dotColor: "bg-blue-400"   },
        ];
        const UNASSIGNED_KEY = "__unassigned__";
        const assignedKeys = new Set(QUADRANTS.map(q => q.key));
        const unassigned = filteredStakeholders.filter(s => !s.engagementStrategy || !assignedKeys.has(s.engagementStrategy));
        const StakeholderCard = ({ s }: { s: any }) => (
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("stakeholderId", String(s.id));
              e.dataTransfer.effectAllowed = "move";
            }}
            className="bg-white dark:bg-card border border-border rounded-xl p-2.5 shadow-sm cursor-grab active:cursor-grabbing select-none hover:shadow-md transition-all hover:-translate-y-0.5 w-full"
            title={`${s.fullName}${s.position ? ` — ${s.position}` : ""}\nDrag to change engagement strategy`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {s.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">{s.fullName}</div>
                {s.position && <div className="text-[10px] text-muted-foreground truncate">{s.position}</div>}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-muted-foreground w-10 flex-shrink-0">Power</span>
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-400 rounded-full" style={{ width: `${((s.powerLevel ?? 3) / 5) * 100}%` }} />
                </div>
                <span className="text-[9px] text-muted-foreground w-3">{s.powerLevel ?? 3}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-muted-foreground w-10 flex-shrink-0">Interest</span>
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${((s.interestLevel ?? 3) / 5) * 100}%` }} />
                </div>
                <span className="text-[9px] text-muted-foreground w-3">{s.interestLevel ?? 3}</span>
              </div>
            </div>
          </div>
        );
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Drag stakeholder cards between quadrants to change their engagement strategy.</p>
              {unassigned.length > 0 && (
                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">{unassigned.length} unassigned</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {QUADRANTS.map(q => (
                <div
                  key={q.key}
                  className={`rounded-xl border-2 p-3 min-h-[200px] transition-all ${q.color} ${dragOverQuadrant === q.key ? "ring-2 ring-primary ring-offset-1 scale-[1.01] shadow-lg" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOverQuadrant(q.key); }}
                  onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverQuadrant(null); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverQuadrant(null);
                    const id = parseInt(e.dataTransfer.getData("stakeholderId"));
                    if (!id) return;
                    updateMutation.mutate({ id, data: { engagementStrategy: q.key } });
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className={`font-bold text-sm ${q.headerColor}`}>{q.label}</div>
                      <div className="text-[10px] text-muted-foreground">{q.sub}</div>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${q.dotColor}`} />
                  </div>
                  <div className="space-y-2">
                    {filteredStakeholders
                      .filter(s => s.engagementStrategy === q.key)
                      .map(s => <StakeholderCard key={s.id} s={s} />)}
                    {filteredStakeholders.filter(s => s.engagementStrategy === q.key).length === 0 && (
                      <div className={`border-2 border-dashed rounded-lg p-3 text-center text-[11px] text-muted-foreground/50 transition-colors ${dragOverQuadrant === q.key ? 'border-primary/50 bg-primary/5' : 'border-muted'}`}>
                        Drop here
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Axis labels */}
            <div className="flex justify-between text-[11px] text-muted-foreground px-1">
              <span>← Low Interest</span>
              <span>High Interest →</span>
            </div>
            {/* Unassigned Pool */}
            <div
              className={`rounded-xl border-2 border-dashed p-3 transition-all ${
                dragOverQuadrant === UNASSIGNED_KEY
                  ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-1"
                  : "border-gray-300 bg-gray-50/50 dark:bg-muted/20"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOverQuadrant(UNASSIGNED_KEY); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverQuadrant(null); }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverQuadrant(null);
                const id = parseInt(e.dataTransfer.getData("stakeholderId"));
                if (!id) return;
                updateMutation.mutate({ id, data: { engagementStrategy: "" } });
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="font-semibold text-sm text-muted-foreground">Unassigned Pool</div>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{unassigned.length}</span>
                <span className="text-[10px] text-muted-foreground/60 ml-auto">Drag here to remove from matrix</span>
              </div>
              {unassigned.length === 0 ? (
                <div className="text-[11px] text-muted-foreground/50 italic text-center py-2">All stakeholders are assigned to a quadrant</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
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
                <TableRow key={s.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => handleRowClick(s)}>
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
                createMutation.mutate({
                  ...formData,
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
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setIsEditOpen(false); setFormData(EMPTY_FORM); }}>Cancel</Button>
            <Button
              onClick={() => {
                if (!selectedStakeholder) return;
                if (!formData.fullName.trim()) { toast.error("Full name is required"); return; }
                updateMutation.mutate({
                  id: selectedStakeholder.id,
                  data: {
                    ...formData,
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
    </div>
  );
}
