import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Save, FolderCheck, Plus, Trash2, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Met: "bg-green-100 text-green-800",
  "Partially Met": "bg-yellow-100 text-yellow-800",
  "Not Met": "bg-red-100 text-red-800",
};
const STATUS_ICONS: Record<string, any> = {
  Met: CheckCircle2,
  "Partially Met": AlertCircle,
  "Not Met": XCircle,
};
const REPORT_STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  "Under Review": "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Archived: "bg-blue-100 text-blue-800",
};

export default function ClosingReport() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const { data: report, isLoading, refetch } = trpc.closingReport.get.useQuery({ projectId }, { enabled });
  const upsert = trpc.closingReport.upsert.useMutation({
    onSuccess: () => { toast.success("Closing Report saved"); refetch(); setEditing(false); },
    onError: () => toast.error("Failed to save"),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [objectives, setObjectives] = useState<Array<{ objective: string; status: "Met" | "Partially Met" | "Not Met"; completionPct: number; notes: string }>>([]);
  const [criteria, setCriteria] = useState<Array<{ criterion: string; met: boolean; notes: string }>>([]);

  const set = (f: string, v: string) => setForm(prev => ({ ...prev, [f]: v }));

  const handleEdit = () => {
    const fields = ["initialBudget", "finalCost", "budgetVariance", "fundingNotes",
      "closureJustification", "lessonsLearnedSummary", "handoverNotes", "closedDate", "closedBy", "status"];
    const initial: Record<string, string> = {};
    fields.forEach(f => {
      if (f === "closedDate" && (report as any)?.[f]) {
        initial[f] = new Date((report as any)[f]).toISOString().split("T")[0];
      } else {
        initial[f] = String((report as any)?.[f] ?? "");
      }
    });
    setForm(initial);
    setObjectives((report as any)?.objectivesStatus ?? []);
    setCriteria((report as any)?.closureCriteria ?? []);
    setEditing(true);
  };

  const handleSave = () => {
    const variance = form.initialBudget && form.finalCost
      ? String(parseFloat(form.finalCost) - parseFloat(form.initialBudget))
      : form.budgetVariance || undefined;
    upsert.mutate({
      projectId,
      objectivesStatus: objectives,
      initialBudget: form.initialBudget || undefined,
      finalCost: form.finalCost || undefined,
      budgetVariance: variance,
      fundingNotes: form.fundingNotes || undefined,
      closureCriteria: criteria,
      closureJustification: form.closureJustification || undefined,
      lessonsLearnedSummary: form.lessonsLearnedSummary || undefined,
      handoverNotes: form.handoverNotes || undefined,
      closedDate: form.closedDate || undefined,
      closedBy: form.closedBy || undefined,
      status: (form.status as any) || "Draft",
    });
  };

  if (!currentProjectId) return <div className="p-6 text-muted-foreground">Select a project first.</div>;
  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const r = report as any;
  const initialBudget = parseFloat(r?.initialBudget ?? "0") || 0;
  const finalCost = parseFloat(r?.finalCost ?? "0") || 0;
  const variance = finalCost - initialBudget;
  const objList: any[] = r?.objectivesStatus ?? [];
  const metCount = objList.filter(o => o.status === "Met").length;
  const partialCount = objList.filter(o => o.status === "Partially Met").length;
  const notMetCount = objList.filter(o => o.status === "Not Met").length;
  const avgCompletion = objList.length > 0
    ? Math.round(objList.reduce((sum, o) => sum + (o.completionPct ?? 0), 0) / objList.length)
    : 0;
  const criteriaList: any[] = r?.closureCriteria ?? [];
  const metCriteria = criteriaList.filter(c => c.met).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderCheck className="w-6 h-6" /> Closing Project Report
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Formal project closure document — objectives, funding, and closure criteria
          </p>
        </div>
        <div className="flex items-center gap-3">
          {r?.status && (
            <Badge className={REPORT_STATUS_COLORS[r.status]}>{r.status}</Badge>
          )}
          {editing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={upsert.isPending}>
                {upsert.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          ) : (
            <Button onClick={handleEdit}>Edit Report</Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{metCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Objectives Met</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-yellow-600">{partialCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Partially Met</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{notMetCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Not Met</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary">{avgCompletion}%</div>
          <div className="text-xs text-muted-foreground mt-1">Avg Completion</div>
        </Card>
      </div>

      {/* Funding Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Funding Status</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Initial Budget</Label>
                <Input type="number" value={form.initialBudget ?? ""} onChange={e => set("initialBudget", e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Final Cost</Label>
                <Input type="number" value={form.finalCost ?? ""} onChange={e => set("finalCost", e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Variance (auto-calculated)</Label>
                <div className="h-9 flex items-center text-sm font-semibold">
                  {form.initialBudget && form.finalCost
                    ? <span className={parseFloat(form.finalCost) > parseFloat(form.initialBudget) ? "text-red-600" : "text-green-600"}>
                        {(parseFloat(form.finalCost) - parseFloat(form.initialBudget)).toLocaleString()}
                      </span>
                    : "—"}
                </div>
              </div>
              <div className="md:col-span-3">
                <Label>Funding Notes</Label>
                <Textarea rows={3} value={form.fundingNotes ?? ""} onChange={e => set("fundingNotes", e.target.value)} placeholder="Explain budget variances, funding sources, or financial outcomes..." />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs uppercase tracking-wide">Initial Budget</div>
                  <div className="text-lg font-semibold">{initialBudget ? initialBudget.toLocaleString() : "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs uppercase tracking-wide">Final Cost</div>
                  <div className="text-lg font-semibold">{finalCost ? finalCost.toLocaleString() : "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs uppercase tracking-wide">Variance</div>
                  <div className={`text-lg font-semibold ${variance > 0 ? "text-red-600" : variance < 0 ? "text-green-600" : ""}`}>
                    {initialBudget && finalCost ? variance.toLocaleString() : "—"}
                  </div>
                </div>
              </div>
              {r?.fundingNotes && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.fundingNotes}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Objectives Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Objectives Status</span>
            {editing && (
              <Button size="sm" variant="outline" onClick={() => setObjectives(prev => [...prev, { objective: "", status: "Not Met", completionPct: 0, notes: "" }])}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Objective
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-3">
              {objectives.length === 0 && <p className="text-sm text-muted-foreground italic">No objectives yet.</p>}
              {objectives.map((obj, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <Input className="flex-1" placeholder="Objective description" value={obj.objective} onChange={e => setObjectives(prev => prev.map((o, idx) => idx === i ? { ...o, objective: e.target.value } : o))} />
                    <Select value={obj.status} onValueChange={v => setObjectives(prev => prev.map((o, idx) => idx === i ? { ...o, status: v as any } : o))}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Met", "Partially Met", "Not Met"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" onClick={() => setObjectives(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="text-xs shrink-0">Completion %</Label>
                    <Input type="number" min={0} max={100} className="w-24" value={obj.completionPct} onChange={e => setObjectives(prev => prev.map((o, idx) => idx === i ? { ...o, completionPct: parseInt(e.target.value) || 0 } : o))} />
                    <Input className="flex-1" placeholder="Notes" value={obj.notes} onChange={e => setObjectives(prev => prev.map((o, idx) => idx === i ? { ...o, notes: e.target.value } : o))} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {objList.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No objectives defined yet.</p>
              ) : (
                objList.map((obj, i) => {
                  const Icon = STATUS_ICONS[obj.status] ?? CheckCircle2;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-start gap-2">
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${obj.status === "Met" ? "text-green-600" : obj.status === "Partially Met" ? "text-yellow-600" : "text-red-600"}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{obj.objective}</span>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${STATUS_COLORS[obj.status]}`}>{obj.status}</Badge>
                              <span className="text-xs text-muted-foreground">{obj.completionPct}%</span>
                            </div>
                          </div>
                          <Progress value={obj.completionPct} className="h-1 mt-1" />
                          {obj.notes && <p className="text-xs text-muted-foreground mt-1">{obj.notes}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Closure Criteria */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Closure Criteria ({metCriteria}/{criteriaList.length} met)</span>
            {editing && (
              <Button size="sm" variant="outline" onClick={() => setCriteria(prev => [...prev, { criterion: "", met: false, notes: "" }])}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Criterion
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-2">
              {criteria.length === 0 && <p className="text-sm text-muted-foreground italic">No criteria yet.</p>}
              {criteria.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Checkbox checked={c.met} onCheckedChange={v => setCriteria(prev => prev.map((x, idx) => idx === i ? { ...x, met: !!v } : x))} className="mt-2" />
                  <Input className="flex-1" placeholder="Closure criterion" value={c.criterion} onChange={e => setCriteria(prev => prev.map((x, idx) => idx === i ? { ...x, criterion: e.target.value } : x))} />
                  <Input className="flex-1" placeholder="Notes" value={c.notes} onChange={e => setCriteria(prev => prev.map((x, idx) => idx === i ? { ...x, notes: e.target.value } : x))} />
                  <Button size="icon" variant="ghost" onClick={() => setCriteria(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {criteriaList.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No closure criteria defined yet.</p>
              ) : (
                criteriaList.map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${c.met ? "text-green-600" : "text-muted-foreground"}`} />
                    <div>
                      <span className={`text-sm ${c.met ? "line-through text-muted-foreground" : ""}`}>{c.criterion}</span>
                      {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Narrative Sections */}
      {[
        { field: "closureJustification", label: "Closure Justification", placeholder: "What is the basis for closing this project? What value has been delivered?" },
        { field: "lessonsLearnedSummary", label: "Lessons Learned Summary", placeholder: "Key lessons from this project — what went well, what could be improved, what to repeat or avoid..." },
        { field: "handoverNotes", label: "Handover Notes", placeholder: "What is being handed over? To whom? What ongoing support or maintenance is required?" },
      ].map(({ field, label, placeholder }) => (
        <Card key={field}>
          <CardHeader className="pb-2"><CardTitle className="text-base">{label}</CardTitle></CardHeader>
          <CardContent>
            {editing ? (
              <Textarea rows={4} placeholder={placeholder} value={form[field] ?? ""} onChange={e => set(field, e.target.value)} />
            ) : (
              <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {r?.[field] || <span className="italic">Not defined yet.</span>}
              </p>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Closure Details */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Closure Details</CardTitle></CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Closed Date</Label>
                <Input type="date" value={form.closedDate ?? ""} onChange={e => set("closedDate", e.target.value)} />
              </div>
              <div>
                <Label>Closed By</Label>
                <Input placeholder="Name" value={form.closedBy ?? ""} onChange={e => set("closedBy", e.target.value)} />
              </div>
              <div>
                <Label>Report Status</Label>
                <Select value={form.status ?? "Draft"} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Draft", "Under Review", "Approved", "Archived"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Closed Date</div>
                <div className="font-medium">{r?.closedDate ? new Date(r.closedDate).toLocaleDateString() : "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Closed By</div>
                <div className="font-medium">{r?.closedBy ?? "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Status</div>
                <Badge className={REPORT_STATUS_COLORS[r?.status ?? "Draft"]}>{r?.status ?? "Draft"}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
