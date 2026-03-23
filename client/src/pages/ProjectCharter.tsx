import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, FileText, Target, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import { CURRENCIES } from "@/lib/currencies";
import { RegistrySelect } from "@/components/RegistrySelect";

const RAG_COLORS: Record<string, string> = {
  Green: "bg-green-100 text-green-800 border-green-300",
  Amber: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Red: "bg-red-100 text-red-800 border-red-300",
};

const RAG_DOT: Record<string, string> = {
  Green: "bg-green-500",
  Amber: "bg-yellow-500",
  Red: "bg-red-500",
};

export default function ProjectCharter() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const { data: charter, isLoading, refetch } = trpc.charter.get.useQuery({ projectId }, { enabled });
  const { data: stakeholders = [] } = trpc.stakeholders.list.useQuery({ projectId }, { enabled });

  const upsert = trpc.charter.upsert.useMutation({
    onSuccess: () => { toast.success("Charter saved"); refetch(); },
    onError: () => toast.error("Failed to save charter"),
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);

  const getValue = (field: string) =>
    editing ? (form[field] ?? "") : ((charter as any)?.[field] ?? "");

  const handleEdit = () => {
    const initial: Record<string, string> = {};
    const fields = [
      "objectives", "scopeStatement", "outOfScope", "successCriteria",
      "constraints", "methodology", "projectStartDate", "projectEndDate",
      "phase", "ragStatus", "ragJustification", "budget", "currency", "notes",
    ];
    fields.forEach(f => { initial[f] = (charter as any)?.[f] ?? ""; });
    initial.sponsorId = String((charter as any)?.sponsorId ?? "");
    initial.projectManagerId = String((charter as any)?.projectManagerId ?? "");
    setForm(initial);
    setEditing(true);
  };

  const handleSave = () => {
    upsert.mutate({
      projectId,
      objectives: form.objectives || undefined,
      scopeStatement: form.scopeStatement || undefined,
      outOfScope: form.outOfScope || undefined,
      successCriteria: form.successCriteria || undefined,
      constraints: form.constraints || undefined,
      methodology: form.methodology || undefined,
      projectStartDate: form.projectStartDate || undefined,
      projectEndDate: form.projectEndDate || undefined,
      phase: form.phase || undefined,
      ragStatus: (form.ragStatus as "Green" | "Amber" | "Red") || undefined,
      ragJustification: form.ragJustification || undefined,
      sponsorId: form.sponsorId ? parseInt(form.sponsorId) : undefined,
      projectManagerId: form.projectManagerId ? parseInt(form.projectManagerId) : undefined,
      budget: form.budget || undefined,
      currency: form.currency || undefined,
      notes: form.notes || undefined,
    }, {
      onSuccess: () => setEditing(false),
    });
  };

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  if (!currentProjectId) {
    return <div className="p-6 text-muted-foreground">Select a project to view the charter.</div>;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const ragStatus = (charter as any)?.ragStatus ?? "Green";
  const sponsor = stakeholders.find((s: any) => s.id === (charter as any)?.sponsorId);
  const pm = stakeholders.find((s: any) => s.id === (charter as any)?.projectManagerId);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" /> Project Charter
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Single source of truth for project definition and governance</p>
        </div>
        <div className="flex items-center gap-3">
          {!editing && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${RAG_COLORS[ragStatus]}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${RAG_DOT[ragStatus]}`} />
              {ragStatus}
            </div>
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
            <Button onClick={handleEdit}>Edit Charter</Button>
          )}
        </div>
      </div>

      {/* RAG & Key Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Methodology</div>
          {editing ? (
            <Select value={form.methodology || "Waterfall"} onValueChange={v => set("methodology", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Waterfall", "Agile", "SAP Activate", "PRINCE2", "Hybrid", "Other"].map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-lg font-semibold">{(charter as any)?.methodology ?? "—"}</div>
          )}
        </Card>

        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Timeline</div>
          {editing ? (
            <div className="space-y-1">
              <Input type="date" value={form.projectStartDate} onChange={e => set("projectStartDate", e.target.value)} />
              <Input type="date" value={form.projectEndDate} onChange={e => set("projectEndDate", e.target.value)} />
            </div>
          ) : (
            <div className="text-sm">
              <div>{(charter as any)?.projectStartDate ? new Date((charter as any).projectStartDate).toLocaleDateString() : "—"}</div>
              <div className="text-muted-foreground">to {(charter as any)?.projectEndDate ? new Date((charter as any).projectEndDate).toLocaleDateString() : "—"}</div>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Project RAG Status</div>
          {editing ? (
            <div className="space-y-2">
              <Select value={form.ragStatus || "Green"} onValueChange={v => set("ragStatus", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Green", "Amber", "Red"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Justification..." value={form.ragJustification} onChange={e => set("ragJustification", e.target.value)} />
            </div>
          ) : (
            <div>
              <div className={`inline-flex items-center gap-2 px-2 py-1 rounded text-sm font-medium ${RAG_COLORS[ragStatus]}`}>
                <span className={`w-2 h-2 rounded-full ${RAG_DOT[ragStatus]}`} />{ragStatus}
              </div>
              {(charter as any)?.ragJustification && (
                <p className="text-xs text-muted-foreground mt-1">{(charter as any).ragJustification}</p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Budget & People */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Budget</div>
          {editing ? (
            <div className="flex gap-2">
              <Select value={form.currency || "USD"} onValueChange={v => set("currency", v)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(({ code, label }) => <SelectItem key={code} value={code}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Total budget" value={form.budget} onChange={e => set("budget", e.target.value)} />
            </div>
          ) : (
            <div className="text-lg font-semibold">
              {(charter as any)?.budget
                ? `${(charter as any)?.currency ?? "USD"} ${parseFloat((charter as any).budget).toLocaleString()}`
                : "—"}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
            <Users className="w-3 h-3" /> Key People
          </div>
          {editing ? (
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Sponsor</Label>
                <Select value={form.sponsorId || ""} onValueChange={v => set("sponsorId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select sponsor" /></SelectTrigger>
                  <SelectContent>
                    {stakeholders.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Project Manager</Label>
                <Select value={form.projectManagerId || ""} onValueChange={v => set("projectManagerId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select PM" /></SelectTrigger>
                  <SelectContent>
                    {stakeholders.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-sm"><span className="text-muted-foreground">Sponsor: </span>{sponsor?.fullName ?? "—"}</div>
              <div className="text-sm"><span className="text-muted-foreground">PM: </span>{pm?.fullName ?? "—"}</div>
            </div>
          )}
        </Card>
      </div>

      {/* Content Sections */}
      {[
        { field: "objectives", label: "Objectives", icon: Target },
        { field: "scopeStatement", label: "Scope Statement (In-Scope)", icon: CheckCircle2 },
        { field: "outOfScope", label: "Out of Scope", icon: AlertTriangle },
        { field: "successCriteria", label: "Success Criteria", icon: CheckCircle2 },
        { field: "constraints", label: "Constraints & Assumptions", icon: AlertTriangle },
      ].map(({ field, label, icon: Icon }) => (
        <Card key={field}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground" />{label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <Textarea
                rows={4}
                placeholder={`Enter ${label.toLowerCase()}...`}
                value={form[field] ?? ""}
                onChange={e => set(field, e.target.value)}
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {(charter as any)?.[field] || <span className="italic">Not defined yet.</span>}
              </p>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Phase */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Current Phase & Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {editing ? (
            <>
              <div>
                <Label>Current Phase</Label>
                <RegistrySelect
                  projectId={projectId}
                  domain="scope_items"
                  fieldKey="phase"
                  value={form.phase || ""}
                  onValueChange={v => set("phase", v)}
                  allowNone
                  noneLabel="— None —"
                  placeholder="Select phase"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea rows={3} value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {(charter as any)?.phase && (
                <div><Badge variant="outline">{(charter as any).phase}</Badge></div>
              )}
              {(charter as any)?.notes && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{(charter as any).notes}</p>
              )}
              {!(charter as any)?.phase && !(charter as any)?.notes && (
                <p className="text-sm text-muted-foreground italic">No phase or notes defined.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
