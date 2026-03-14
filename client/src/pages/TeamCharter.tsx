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
import { toast } from "sonner";
import { Loader2, Save, Users, Plus, Trash2, Shield, MessageSquare, Gavel, BookOpen, UserCheck, CheckCircle2 } from "lucide-react";

export default function TeamCharter() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const { data: charter, isLoading, refetch } = trpc.teamCharter.get.useQuery({ projectId }, { enabled });
  const upsert = trpc.teamCharter.upsert.useMutation({
    onSuccess: () => { toast.success("Team Charter saved"); refetch(); setEditing(false); },
    onError: () => toast.error("Failed to save"),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [coreValues, setCoreValues] = useState<string[]>([]);
  const [groundRules, setGroundRules] = useState<string[]>([]);
  const [violations, setViolations] = useState<Array<{ violation: string; consequence: string }>>([])
  const [acknowledgements, setAcknowledgements] = useState<Array<{ name: string; role: string; date: string; signed: boolean }>>([])

  const { data: stakeholders = [] } = trpc.stakeholders.list.useQuery({ projectId }, { enabled });

  const set = (f: string, v: string) => setForm(prev => ({ ...prev, [f]: v }));

  const handleEdit = () => {
    const fields = ["communicationProtocol", "meetingCadence", "decisionMakingAuthority", "responsibilityMatrix", "conflictResolution"];
    const initial: Record<string, string> = {};
    fields.forEach(f => { initial[f] = (charter as any)?.[f] ?? ""; });
    setForm(initial);
    setCoreValues((charter as any)?.coreValues ?? []);
    setGroundRules((charter as any)?.groundRules ?? []);
    setViolations((charter as any)?.violations ?? []);
    setAcknowledgements((charter as any)?.acknowledgements ?? []);
    setEditing(true);
  };

  const handleSave = () => {
    upsert.mutate({
      projectId,
      coreValues: coreValues.filter(v => v.trim()),
      groundRules: groundRules.filter(r => r.trim()),
      violations: violations.filter(v => v.violation.trim()),
      communicationProtocol: form.communicationProtocol || undefined,
      meetingCadence: form.meetingCadence || undefined,
      decisionMakingAuthority: form.decisionMakingAuthority || undefined,
      responsibilityMatrix: form.responsibilityMatrix || undefined,
      conflictResolution: form.conflictResolution || undefined,
      acknowledgements: acknowledgements as any,
    });
  };

  if (!currentProjectId) return <div className="p-6 text-muted-foreground">Select a project first.</div>;
  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const tc = charter as any;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" /> Team Charter
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Forming-stage document — core values, ground rules, communication protocols, and decision authority
          </p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Charter
            </Button>
          </div>
        ) : (
          <Button onClick={handleEdit}>Edit Charter</Button>
        )}
      </div>

      <Tabs defaultValue="values">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="values"><BookOpen className="w-3.5 h-3.5 mr-1" />Core Values</TabsTrigger>
          <TabsTrigger value="communication"><MessageSquare className="w-3.5 h-3.5 mr-1" />Communication</TabsTrigger>
          <TabsTrigger value="decisions"><Gavel className="w-3.5 h-3.5 mr-1" />Decisions & Roles</TabsTrigger>
          <TabsTrigger value="rules"><Shield className="w-3.5 h-3.5 mr-1" />Ground Rules & Violations</TabsTrigger>
          <TabsTrigger value="succession"><UserCheck className="w-3.5 h-3.5 mr-1" />Succession & Delegation</TabsTrigger>
          <TabsTrigger value="signatures"><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Acknowledgements</TabsTrigger>
        </TabsList>

        {/* ── Core Values ── */}
        <TabsContent value="values" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Core Values</span>
                {editing && (
                  <Button size="sm" variant="outline" onClick={() => setCoreValues(prev => [...prev, ""])}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Value
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-2">
                  {coreValues.length === 0 && <p className="text-sm text-muted-foreground italic">No core values defined. Click "Add Value" to start.</p>}
                  {coreValues.map((v, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={v} placeholder="e.g. Transparency, Accountability, Respect..." onChange={e => setCoreValues(prev => prev.map((x, idx) => idx === i ? e.target.value : x))} />
                      <Button size="icon" variant="ghost" onClick={() => setCoreValues(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(tc?.coreValues ?? []).length === 0
                    ? <p className="text-sm text-muted-foreground italic">No core values defined yet.</p>
                    : (tc?.coreValues ?? []).map((v: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-sm px-3 py-1">{v}</Badge>
                      ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Communication ── */}
        <TabsContent value="communication" className="space-y-4 mt-4">
          {[
            { field: "communicationProtocol", label: "Communication Protocol", placeholder: "How does the team communicate? Which channels for what? Response time expectations? Escalation paths for urgent matters?" },
            { field: "meetingCadence", label: "Meeting Cadence", placeholder: "What recurring meetings are held? Daily standups, weekly syncs, monthly reviews? Who attends? What is the agenda format?" },
          ].map(({ field, label, placeholder }) => (
            <Card key={field}>
              <CardHeader className="pb-2"><CardTitle className="text-base">{label}</CardTitle></CardHeader>
              <CardContent>
                {editing ? (
                  <Textarea rows={5} placeholder={placeholder} value={form[field] ?? ""} onChange={e => set(field, e.target.value)} />
                ) : (
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {tc?.[field] || <span className="italic">Not defined yet.</span>}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Decisions & Roles ── */}
        <TabsContent value="decisions" className="space-y-4 mt-4">
          {[
            { field: "decisionMakingAuthority", label: "Decision-Making Authority", placeholder: "Who makes which decisions? What decisions require team consensus? What can the PM decide alone? What needs sponsor approval? Define RACI or DACI..." },
            { field: "responsibilityMatrix", label: "Responsibility Matrix", placeholder: "Clear responsibilities for each team role — who is accountable for what deliverables, processes, and outcomes..." },
            { field: "conflictResolution", label: "Conflict Resolution Process", placeholder: "How does the team resolve disagreements? What is the escalation path for unresolved conflicts? Who mediates?" },
          ].map(({ field, label, placeholder }) => (
            <Card key={field}>
              <CardHeader className="pb-2"><CardTitle className="text-base">{label}</CardTitle></CardHeader>
              <CardContent>
                {editing ? (
                  <Textarea rows={5} placeholder={placeholder} value={form[field] ?? ""} onChange={e => set(field, e.target.value)} />
                ) : (
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {tc?.[field] || <span className="italic">Not defined yet.</span>}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Ground Rules & Violations ── */}
        <TabsContent value="rules" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Ground Rules</span>
                {editing && (
                  <Button size="sm" variant="outline" onClick={() => setGroundRules(prev => [...prev, ""])}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Rule
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-2">
                  {groundRules.length === 0 && <p className="text-sm text-muted-foreground italic">No ground rules defined yet.</p>}
                  {groundRules.map((r, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={r} placeholder="e.g. Be on time for meetings, Respect all opinions..." onChange={e => setGroundRules(prev => prev.map((x, idx) => idx === i ? e.target.value : x))} />
                      <Button size="icon" variant="ghost" onClick={() => setGroundRules(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-1">
                  {(tc?.groundRules ?? []).length === 0
                    ? <p className="text-sm text-muted-foreground italic">No ground rules defined yet.</p>
                    : (tc?.groundRules ?? []).map((r: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary font-bold mt-0.5">•</span>{r}
                        </li>
                      ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Restricted Violations & Consequences</span>
                {editing && (
                  <Button size="sm" variant="outline" onClick={() => setViolations(prev => [...prev, { violation: "", consequence: "" }])}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Violation
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-2">
                  {violations.length === 0 && <p className="text-sm text-muted-foreground italic">No violations defined yet.</p>}
                  {violations.map((v, i) => (
                    <div key={i} className="flex gap-2">
                      <Input className="flex-1" placeholder="Violation (what is NOT allowed)" value={v.violation} onChange={e => setViolations(prev => prev.map((x, idx) => idx === i ? { ...x, violation: e.target.value } : x))} />
                      <Input className="flex-1" placeholder="Consequence" value={v.consequence} onChange={e => setViolations(prev => prev.map((x, idx) => idx === i ? { ...x, consequence: e.target.value } : x))} />
                      <Button size="icon" variant="ghost" onClick={() => setViolations(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {(tc?.violations ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No violations defined yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-muted-foreground text-xs uppercase">
                        <th className="text-left py-1 pr-4">Violation</th>
                        <th className="text-left py-1">Consequence</th>
                      </tr></thead>
                      <tbody>
                        {(tc?.violations ?? []).map((v: any, i: number) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 pr-4 text-red-700">{v.violation}</td>
                            <td className="py-2 text-muted-foreground">{v.consequence}</td>
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
        {/* ── Succession & Delegation ── */}
        <TabsContent value="succession" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Succession & Delegation Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">Team members marked with succession or delegation requirements in the Stakeholder Register appear here.</p>
              {(stakeholders as any[]).filter((s: any) => s.needsSuccessionPlan || s.hasDelegation).length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No succession or delegation flags set. Go to Stakeholder Register → edit a team member → check "Needs Succession Plan" or "Has Delegation".</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground text-xs uppercase">
                    <th className="text-left py-1 pr-4">Name</th>
                    <th className="text-left py-1 pr-4">Role</th>
                    <th className="text-center py-1 pr-4">Succession Plan</th>
                    <th className="text-center py-1">Delegation</th>
                  </tr></thead>
                  <tbody>
                    {(stakeholders as any[]).filter((s: any) => s.needsSuccessionPlan || s.hasDelegation).map((s: any) => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{s.fullName ?? s.name ?? s.stakeholderName}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{s.role ?? s.stakeholderRole ?? "—"}</td>
                        <td className="py-2 pr-4 text-center">{s.needsSuccessionPlan ? <span className="text-amber-600 font-medium">Required</span> : <span className="text-muted-foreground">—</span>}</td>
                        <td className="py-2 text-center">{s.hasDelegation ? <span className="text-blue-600 font-medium">Yes</span> : <span className="text-muted-foreground">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Acknowledgements / Signatures ── */}
        <TabsContent value="signatures" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Team Acknowledgements</span>
                {editing && (
                  <Button size="sm" variant="outline" onClick={() => setAcknowledgements(prev => [...prev, { name: "", role: "", date: new Date().toISOString().slice(0, 10), signed: false }])}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Member
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">Each team member acknowledges they have read, understood, and agreed to the Team Charter.</p>
              {editing ? (
                <div className="space-y-2">
                  {acknowledgements.length === 0 && <p className="text-sm text-muted-foreground italic">No acknowledgements yet. Add team members above.</p>}
                  {acknowledgements.map((a, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="checkbox" checked={a.signed} onChange={e => setAcknowledgements(prev => prev.map((x, idx) => idx === i ? { ...x, signed: e.target.checked } : x))} className="w-4 h-4" />
                      <input className="flex-1 border rounded px-2 py-1 text-sm" placeholder="Full name" value={a.name} onChange={e => setAcknowledgements(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} />
                      <input className="flex-1 border rounded px-2 py-1 text-sm" placeholder="Role" value={a.role} onChange={e => setAcknowledgements(prev => prev.map((x, idx) => idx === i ? { ...x, role: e.target.value } : x))} />
                      <input type="date" className="border rounded px-2 py-1 text-sm" value={a.date} onChange={e => setAcknowledgements(prev => prev.map((x, idx) => idx === i ? { ...x, date: e.target.value } : x))} />
                      <Button size="icon" variant="ghost" onClick={() => setAcknowledgements(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {(tc?.acknowledgements ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No acknowledgements recorded yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-muted-foreground text-xs uppercase">
                        <th className="text-left py-1 pr-4">Name</th>
                        <th className="text-left py-1 pr-4">Role</th>
                        <th className="text-center py-1 pr-4">Date</th>
                        <th className="text-center py-1">Signed</th>
                      </tr></thead>
                      <tbody>
                        {(tc?.acknowledgements ?? []).map((a: any, i: number) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">{a.name}</td>
                            <td className="py-2 pr-4 text-muted-foreground">{a.role}</td>
                            <td className="py-2 pr-4 text-center text-muted-foreground">{a.date}</td>
                            <td className="py-2 text-center">{a.signed ? <span className="text-green-600 font-medium flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4" /> Signed</span> : <span className="text-muted-foreground">Pending</span>}</td>
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
      </Tabs>
    </div>
  );
}
