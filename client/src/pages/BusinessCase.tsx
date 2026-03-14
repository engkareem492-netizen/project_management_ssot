import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2, Save, Briefcase, TrendingUp, Target, Plus, Trash2,
  CheckCircle2, AlertCircle, Clock, XCircle, Edit2, BarChart2
} from "lucide-react";

const OKR_STATUS_COLORS: Record<string, string> = {
  "On Track": "bg-green-100 text-green-800",
  "At Risk": "bg-yellow-100 text-yellow-800",
  "Behind": "bg-red-100 text-red-800",
  "Achieved": "bg-blue-100 text-blue-800",
  "Cancelled": "bg-gray-100 text-gray-500",
};
const OKR_STATUS_ICONS: Record<string, any> = {
  "On Track": CheckCircle2,
  "At Risk": AlertCircle,
  "Behind": Clock,
  "Achieved": CheckCircle2,
  "Cancelled": XCircle,
};

export default function BusinessCase() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const { data: bc, isLoading, refetch } = trpc.businessCase.get.useQuery({ projectId }, { enabled });
  const { data: okrs = [], refetch: refetchOKRs } = trpc.businessCase.listOKRs.useQuery({ projectId }, { enabled });

  const upsert = trpc.businessCase.upsert.useMutation({
    onSuccess: () => { toast.success("Business Case saved"); refetch(); },
    onError: () => toast.error("Failed to save"),
  });
  const createOKR = trpc.businessCase.createOKR.useMutation({
    onSuccess: () => { toast.success("OKR created"); refetchOKRs(); setOkrDialog(false); },
    onError: () => toast.error("Failed to create OKR"),
  });
  const updateOKR = trpc.businessCase.updateOKR.useMutation({
    onSuccess: () => { toast.success("OKR updated"); refetchOKRs(); setOkrDialog(false); setEditingOKR(null); },
    onError: () => toast.error("Failed to update OKR"),
  });
  const deleteOKR = trpc.businessCase.deleteOKR.useMutation({
    onSuccess: () => { toast.success("OKR deleted"); refetchOKRs(); },
    onError: () => toast.error("Failed to delete OKR"),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [costBenefitRows, setCostBenefitRows] = useState<Array<{ item: string; cost: string; benefit: string; notes: string }>>([]);
  const [reportSections, setReportSections] = useState<Array<{ section: string; metric: string; target: string }>>([]);
  const [okrDialog, setOkrDialog] = useState(false);
  const [editingOKR, setEditingOKR] = useState<any>(null);
  const [okrForm, setOkrForm] = useState<Record<string, string>>({});
  const [keyResults, setKeyResults] = useState<Array<{ kr: string; target: string; current: string; unit: string; status: string }>>([]);

  const set = (f: string, v: string) => setForm(prev => ({ ...prev, [f]: v }));

  const handleEdit = () => {
    const fields = ["projectJustification", "problemStatement", "alternativesConsidered", "recommendedSolution",
      "strategicObjectives", "alignmentRationale", "estimatedCost", "estimatedBenefit", "roi",
      "paybackPeriodMonths", "successMeasures"];
    const initial: Record<string, string> = {};
    fields.forEach(f => { initial[f] = String((bc as any)?.[f] ?? ""); });
    setForm(initial);
    setCostBenefitRows((bc as any)?.costBenefitDetails ?? []);
    setReportSections((bc as any)?.reportSections ?? []);
    setEditing(true);
  };

  const handleSave = () => {
    upsert.mutate({
      projectId,
      projectJustification: form.projectJustification || undefined,
      problemStatement: form.problemStatement || undefined,
      alternativesConsidered: form.alternativesConsidered || undefined,
      recommendedSolution: form.recommendedSolution || undefined,
      strategicObjectives: form.strategicObjectives || undefined,
      alignmentRationale: form.alignmentRationale || undefined,
      estimatedCost: form.estimatedCost || undefined,
      estimatedBenefit: form.estimatedBenefit || undefined,
      roi: form.roi || undefined,
      paybackPeriodMonths: form.paybackPeriodMonths ? parseInt(form.paybackPeriodMonths) : undefined,
      costBenefitDetails: costBenefitRows.length > 0 ? costBenefitRows : undefined,
      successMeasures: form.successMeasures || undefined,
      reportSections: reportSections.length > 0 ? reportSections : undefined,
    }, { onSuccess: () => setEditing(false) });
  };

  const openNewOKR = () => {
    setEditingOKR(null);
    setOkrForm({ objective: "", status: "On Track", progressPct: "0", owner: "", dueDate: "", linkedReportSection: "", notes: "" });
    setKeyResults([{ kr: "", target: "", current: "0", unit: "", status: "On Track" }]);
    setOkrDialog(true);
  };

  const openEditOKR = (okr: any) => {
    setEditingOKR(okr);
    setOkrForm({
      objective: okr.objective ?? "",
      status: okr.status ?? "On Track",
      progressPct: String(okr.progressPct ?? 0),
      owner: okr.owner ?? "",
      dueDate: okr.dueDate ? new Date(okr.dueDate).toISOString().split("T")[0] : "",
      linkedReportSection: okr.linkedReportSection ?? "",
      notes: okr.notes ?? "",
    });
    setKeyResults(okr.keyResults ?? []);
    setOkrDialog(true);
  };

  const saveOKR = () => {
    const payload = {
      objective: okrForm.objective,
      status: okrForm.status as any,
      progressPct: parseInt(okrForm.progressPct) || 0,
      owner: okrForm.owner || undefined,
      dueDate: okrForm.dueDate || undefined,
      linkedReportSection: okrForm.linkedReportSection || undefined,
      notes: okrForm.notes || undefined,
      keyResults: keyResults.filter(kr => kr.kr.trim()),
    };
    if (editingOKR) {
      updateOKR.mutate({ id: editingOKR.id, ...payload });
    } else {
      createOKR.mutate({ projectId, ...payload });
    }
  };

  if (!currentProjectId) return <div className="p-6 text-muted-foreground">Select a project first.</div>;
  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const roi = bc ? (parseFloat((bc as any).roi ?? "0") || 0) : 0;
  const estimatedCost = bc ? (parseFloat((bc as any).estimatedCost ?? "0") || 0) : 0;
  const estimatedBenefit = bc ? (parseFloat((bc as any).estimatedBenefit ?? "0") || 0) : 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="w-6 h-6" /> Business Case Document
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Project justification, strategic alignment, cost-benefit analysis, and OKRs</p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </div>
        ) : (
          <Button onClick={handleEdit}>Edit Business Case</Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Estimated Cost</div>
          <div className="text-2xl font-bold text-red-600">{estimatedCost ? estimatedCost.toLocaleString() : "—"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Estimated Benefit</div>
          <div className="text-2xl font-bold text-green-600">{estimatedBenefit ? estimatedBenefit.toLocaleString() : "—"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">ROI</div>
          <div className="text-2xl font-bold text-primary">{roi ? `${roi}%` : "—"}</div>
          {(bc as any)?.paybackPeriodMonths && (
            <div className="text-xs text-muted-foreground mt-1">Payback: {(bc as any).paybackPeriodMonths} months</div>
          )}
        </Card>
      </div>

      <Tabs defaultValue="justification">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="justification">Justification</TabsTrigger>
          <TabsTrigger value="strategic">Strategic Alignment</TabsTrigger>
          <TabsTrigger value="cost-benefit">Cost-Benefit Analysis</TabsTrigger>
          <TabsTrigger value="success">Success Measurement</TabsTrigger>
          <TabsTrigger value="okrs">
            <Target className="w-3.5 h-3.5 mr-1" />OKRs ({okrs.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Justification ── */}
        <TabsContent value="justification" className="space-y-4 mt-4">
          {[
            { field: "problemStatement", label: "Problem Statement", placeholder: "What problem or opportunity is this project addressing?" },
            { field: "projectJustification", label: "Project Justification", placeholder: "Why should this project be approved? What is the business rationale?" },
            { field: "alternativesConsidered", label: "Alternatives Considered", placeholder: "What other options were evaluated? Why were they rejected?" },
            { field: "recommendedSolution", label: "Recommended Solution", placeholder: "What is the proposed approach and why is it the best option?" },
          ].map(({ field, label, placeholder }) => (
            <Card key={field}>
              <CardHeader className="pb-2"><CardTitle className="text-base">{label}</CardTitle></CardHeader>
              <CardContent>
                {editing ? (
                  <Textarea rows={4} placeholder={placeholder} value={form[field] ?? ""} onChange={e => set(field, e.target.value)} />
                ) : (
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {(bc as any)?.[field] || <span className="italic">Not defined yet.</span>}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Strategic Alignment ── */}
        <TabsContent value="strategic" className="space-y-4 mt-4">
          {[
            { field: "strategicObjectives", label: "Strategic Objectives Addressed", placeholder: "Which organisational strategic objectives does this project support?" },
            { field: "alignmentRationale", label: "Alignment Rationale", placeholder: "How does this project contribute to the organisation's strategy? What is the strategic fit?" },
          ].map(({ field, label, placeholder }) => (
            <Card key={field}>
              <CardHeader className="pb-2"><CardTitle className="text-base">{label}</CardTitle></CardHeader>
              <CardContent>
                {editing ? (
                  <Textarea rows={5} placeholder={placeholder} value={form[field] ?? ""} onChange={e => set(field, e.target.value)} />
                ) : (
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {(bc as any)?.[field] || <span className="italic">Not defined yet.</span>}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Cost-Benefit Analysis ── */}
        <TabsContent value="cost-benefit" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { field: "estimatedCost", label: "Estimated Cost", type: "number" },
              { field: "estimatedBenefit", label: "Estimated Benefit", type: "number" },
              { field: "roi", label: "ROI (%)", type: "number" },
              { field: "paybackPeriodMonths", label: "Payback (months)", type: "number" },
            ].map(({ field, label, type }) => (
              <div key={field}>
                <Label className="text-xs">{label}</Label>
                {editing ? (
                  <Input type={type} value={form[field] ?? ""} onChange={e => set(field, e.target.value)} />
                ) : (
                  <div className="text-lg font-semibold mt-1">{(bc as any)?.[field] ?? "—"}</div>
                )}
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Cost-Benefit Breakdown</span>
                {editing && (
                  <Button size="sm" variant="outline" onClick={() => setCostBenefitRows(prev => [...prev, { item: "", cost: "", benefit: "", notes: "" }])}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-2">
                  {costBenefitRows.map((row, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-start">
                      <Input placeholder="Item" value={row.item} onChange={e => setCostBenefitRows(prev => prev.map((r, idx) => idx === i ? { ...r, item: e.target.value } : r))} />
                      <Input placeholder="Cost" value={row.cost} onChange={e => setCostBenefitRows(prev => prev.map((r, idx) => idx === i ? { ...r, cost: e.target.value } : r))} />
                      <Input placeholder="Benefit" value={row.benefit} onChange={e => setCostBenefitRows(prev => prev.map((r, idx) => idx === i ? { ...r, benefit: e.target.value } : r))} />
                      <Input placeholder="Notes" value={row.notes} onChange={e => setCostBenefitRows(prev => prev.map((r, idx) => idx === i ? { ...r, notes: e.target.value } : r))} />
                      <Button size="icon" variant="ghost" onClick={() => setCostBenefitRows(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  {costBenefitRows.length === 0 && <p className="text-sm text-muted-foreground italic">No rows yet. Click "Add Row" to start.</p>}
                </div>
              ) : (
                <div>
                  {((bc as any)?.costBenefitDetails ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No cost-benefit breakdown defined yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-muted-foreground text-xs uppercase">
                        <th className="text-left py-1 pr-3">Item</th>
                        <th className="text-left py-1 pr-3">Cost</th>
                        <th className="text-left py-1 pr-3">Benefit</th>
                        <th className="text-left py-1">Notes</th>
                      </tr></thead>
                      <tbody>
                        {((bc as any)?.costBenefitDetails ?? []).map((r: any, i: number) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 pr-3 font-medium">{r.item}</td>
                            <td className="py-2 pr-3 text-red-600">{r.cost}</td>
                            <td className="py-2 pr-3 text-green-600">{r.benefit}</td>
                            <td className="py-2 text-muted-foreground">{r.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Success Measurement ── */}
        <TabsContent value="success" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Success Measures</CardTitle></CardHeader>
            <CardContent>
              {editing ? (
                <Textarea rows={5} placeholder="How will project success be measured? What KPIs, metrics, or outcomes define success?" value={form.successMeasures ?? ""} onChange={e => set("successMeasures", e.target.value)} />
              ) : (
                <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {(bc as any)?.successMeasures || <span className="italic">Not defined yet.</span>}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Report Section Linkage</span>
                {editing && (
                  <Button size="sm" variant="outline" onClick={() => setReportSections(prev => [...prev, { section: "", metric: "", target: "" }])}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Link
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-2">
                  {reportSections.map((row, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start">
                      <Input placeholder="Report section" value={row.section} onChange={e => setReportSections(prev => prev.map((r, idx) => idx === i ? { ...r, section: e.target.value } : r))} />
                      <Input placeholder="Metric" value={row.metric} onChange={e => setReportSections(prev => prev.map((r, idx) => idx === i ? { ...r, metric: e.target.value } : r))} />
                      <Input placeholder="Target" value={row.target} onChange={e => setReportSections(prev => prev.map((r, idx) => idx === i ? { ...r, target: e.target.value } : r))} />
                      <Button size="icon" variant="ghost" onClick={() => setReportSections(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  {reportSections.length === 0 && <p className="text-sm text-muted-foreground italic">No section links yet.</p>}
                </div>
              ) : (
                <div>
                  {((bc as any)?.reportSections ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No report section links defined yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-muted-foreground text-xs uppercase">
                        <th className="text-left py-1 pr-3">Report Section</th>
                        <th className="text-left py-1 pr-3">Metric</th>
                        <th className="text-left py-1">Target</th>
                      </tr></thead>
                      <tbody>
                        {((bc as any)?.reportSections ?? []).map((r: any, i: number) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 pr-3 font-medium">{r.section}</td>
                            <td className="py-2 pr-3 text-muted-foreground">{r.metric}</td>
                            <td className="py-2 text-muted-foreground">{r.target}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── OKRs ── */}
        <TabsContent value="okrs" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Define project Objectives and Key Results, track progress, and link to report sections.</p>
            <Button size="sm" onClick={openNewOKR}><Plus className="w-4 h-4 mr-1" /> Add OKR</Button>
          </div>

          {okrs.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No OKRs defined yet. Click "Add OKR" to create the first one.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {okrs.map((okr: any) => {
                const StatusIcon = OKR_STATUS_ICONS[okr.status] ?? CheckCircle2;
                return (
                  <Card key={okr.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="text-xs shrink-0">{okr.okrCode}</Badge>
                          <div>
                            <div className="font-semibold text-sm">{okr.objective}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`text-xs ${OKR_STATUS_COLORS[okr.status]}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />{okr.status}
                              </Badge>
                              {okr.owner && <span className="text-xs text-muted-foreground">Owner: {okr.owner}</span>}
                              {okr.dueDate && <span className="text-xs text-muted-foreground">Due: {new Date(okr.dueDate).toLocaleDateString()}</span>}
                              {okr.linkedReportSection && <span className="text-xs text-blue-600">→ {okr.linkedReportSection}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="icon" variant="ghost" onClick={() => openEditOKR(okr)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteOKR.mutate({ id: okr.id })}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span><span>{okr.progressPct ?? 0}%</span>
                        </div>
                        <Progress value={okr.progressPct ?? 0} className="h-1.5" />
                      </div>
                    </CardHeader>
                    {(okr.keyResults ?? []).length > 0 && (
                      <CardContent className="pt-0">
                        <div className="space-y-1">
                          {(okr.keyResults ?? []).map((kr: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <BarChart2 className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="flex-1">{kr.kr}</span>
                              <span className="text-muted-foreground">{kr.current}/{kr.target} {kr.unit}</span>
                              <Badge className={`text-xs ${OKR_STATUS_COLORS[kr.status] ?? ""}`}>{kr.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* OKR Dialog */}
      <Dialog open={okrDialog} onOpenChange={setOkrDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOKR ? "Edit OKR" : "New OKR"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Objective *</Label>
              <Textarea rows={2} placeholder="What do you want to achieve?" value={okrForm.objective ?? ""} onChange={e => setOkrForm(p => ({ ...p, objective: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={okrForm.status ?? "On Track"} onValueChange={v => setOkrForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["On Track", "At Risk", "Behind", "Achieved", "Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Progress (%)</Label>
                <Input type="number" min={0} max={100} value={okrForm.progressPct ?? "0"} onChange={e => setOkrForm(p => ({ ...p, progressPct: e.target.value }))} />
              </div>
              <div>
                <Label>Owner</Label>
                <Input placeholder="Owner name" value={okrForm.owner ?? ""} onChange={e => setOkrForm(p => ({ ...p, owner: e.target.value }))} />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={okrForm.dueDate ?? ""} onChange={e => setOkrForm(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Linked Report Section</Label>
              <Input placeholder="e.g. Periodic Report → KPIs" value={okrForm.linkedReportSection ?? ""} onChange={e => setOkrForm(p => ({ ...p, linkedReportSection: e.target.value }))} />
            </div>

            {/* Key Results */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Key Results</Label>
                <Button size="sm" variant="outline" onClick={() => setKeyResults(prev => [...prev, { kr: "", target: "", current: "0", unit: "", status: "On Track" }])}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add KR
                </Button>
              </div>
              <div className="space-y-2">
                {keyResults.map((kr, i) => (
                  <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-1 items-start">
                    <Input placeholder="Key result" value={kr.kr} onChange={e => setKeyResults(prev => prev.map((k, idx) => idx === i ? { ...k, kr: e.target.value } : k))} />
                    <Input placeholder="Target" value={kr.target} onChange={e => setKeyResults(prev => prev.map((k, idx) => idx === i ? { ...k, target: e.target.value } : k))} />
                    <Input placeholder="Current" value={kr.current} onChange={e => setKeyResults(prev => prev.map((k, idx) => idx === i ? { ...k, current: e.target.value } : k))} />
                    <Input placeholder="Unit" value={kr.unit} onChange={e => setKeyResults(prev => prev.map((k, idx) => idx === i ? { ...k, unit: e.target.value } : k))} />
                    <Select value={kr.status} onValueChange={v => setKeyResults(prev => prev.map((k, idx) => idx === i ? { ...k, status: v } : k))}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["On Track", "At Risk", "Behind", "Achieved", "Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" onClick={() => setKeyResults(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea rows={2} value={okrForm.notes ?? ""} onChange={e => setOkrForm(p => ({ ...p, notes: e.target.value }))} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOkrDialog(false)}>Cancel</Button>
              <Button onClick={saveOKR} disabled={createOKR.isPending || updateOKR.isPending}>
                {(createOKR.isPending || updateOKR.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save OKR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
