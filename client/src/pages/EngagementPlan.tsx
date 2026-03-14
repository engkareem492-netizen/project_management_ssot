import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Target, TrendingUp, Users, BarChart3, CheckCircle2, Circle } from "lucide-react";

const ENGAGEMENT_STATUSES = ["Unaware", "Resistant", "Neutral", "Supportive", "Leading"];
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Unaware:    { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
  Resistant:  { bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5" },
  Neutral:    { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
  Supportive: { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  Leading:    { bg: "#dcfce7", text: "#166534", border: "#86efac" },
};

const AVATAR_COLORS = [
  ["#f87171","#b91c1c"],["#fb923c","#c2410c"],["#fbbf24","#92400e"],
  ["#34d399","#065f46"],["#60a5fa","#1d4ed8"],["#a78bfa","#5b21b6"],
  ["#f472b6","#9d174d"],["#94a3b8","#334155"],
];
const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

// ─── Stakeholder Analysis Tab ─────────────────────────────────────────────────
function StakeholderAnalysisTab({ stakeholders }: { stakeholders: any[] }) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Power/Interest Matrix (2x2 quadrants)
  const QUADRANTS = [
    { key: "Keep Satisfied",  label: "Keep Satisfied",  sub: "High Power · Low Interest",  col: 0, row: 0, bg: "#fff7ed", border: "#fb923c" },
    { key: "Manage Closely",  label: "Manage Closely",  sub: "High Power · High Interest", col: 1, row: 0, bg: "#fef2f2", border: "#f87171" },
    { key: "Monitor",         label: "Monitor",         sub: "Low Power · Low Interest",   col: 0, row: 1, bg: "#f9fafb", border: "#d1d5db" },
    { key: "Keep Informed",   label: "Keep Informed",   sub: "Low Power · High Interest",  col: 1, row: 1, bg: "#eff6ff", border: "#60a5fa" },
  ];

  return (
    <div className="space-y-6">
      {/* Power/Interest Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Power / Interest Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {QUADRANTS.map((q) => {
              const inQuadrant = stakeholders.filter((s) => s.engagementStrategy === q.key);
              return (
                <div
                  key={q.key}
                  style={{ background: q.bg, border: `1.5px solid ${q.border}`, borderRadius: "10px", padding: "14px", minHeight: "140px" }}
                >
                  <div className="font-semibold text-sm mb-0.5">{q.label}</div>
                  <div className="text-xs text-muted-foreground mb-3">{q.sub}</div>
                  <div className="flex flex-wrap gap-2">
                    {inQuadrant.map((s) => {
                      const [from, to] = avatarColor(s.id);
                      return (
                        <div
                          key={s.id}
                          onMouseEnter={() => setHoveredId(s.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          className="relative"
                          title={`${s.fullName}${s.position ? ` — ${s.position}` : ""}`}
                        >
                          <div
                            style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${from}, ${to})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", cursor: "default", boxShadow: hoveredId === s.id ? "0 0 0 3px rgba(0,0,0,0.15)" : undefined, transition: "box-shadow 0.15s" }}
                          >
                            {s.fullName?.charAt(0).toUpperCase()}
                          </div>
                          {hoveredId === s.id && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 bg-popover border rounded-lg shadow-lg p-2 text-xs whitespace-nowrap pointer-events-none">
                              <div className="font-semibold">{s.fullName}</div>
                              {s.position && <div className="text-muted-foreground">{s.position}</div>}
                              <div className="text-muted-foreground">P:{s.powerLevel ?? "?"}/5 · I:{s.interestLevel ?? "?"}/5</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {inQuadrant.length === 0 && (
                      <span className="text-xs text-muted-foreground italic">No stakeholders</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Engagement Status Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Engagement Status Assessment (Current → Desired)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Stakeholder</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>Desired Status</TableHead>
                  <TableHead>Gap</TableHead>
                  <TableHead>Strategy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stakeholders.map((s) => {
                  const currentIdx = ENGAGEMENT_STATUSES.indexOf(s.currentEngagementStatus || "");
                  const desiredIdx = ENGAGEMENT_STATUSES.indexOf(s.desiredEngagementStatus || "");
                  const gap = desiredIdx - currentIdx;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{s.fullName}</div>
                        {s.position && <div className="text-xs text-muted-foreground">{s.position}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          s.classification === "team_member" || s.isInternalTeam
                            ? "bg-blue-100 text-blue-700 border-blue-200 text-xs"
                            : s.classification === "external"
                            ? "bg-purple-100 text-purple-700 border-purple-200 text-xs"
                            : "bg-orange-100 text-orange-700 border-orange-200 text-xs"
                        }>
                          {s.classification === "team_member" || s.isInternalTeam ? "Team Member"
                            : s.classification === "external" ? "External" : "Stakeholder"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {s.currentEngagementStatus ? (
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              background: STATUS_COLORS[s.currentEngagementStatus]?.bg || "#f3f4f6",
                              color: STATUS_COLORS[s.currentEngagementStatus]?.text || "#374151",
                              border: `1px solid ${STATUS_COLORS[s.currentEngagementStatus]?.border || "#d1d5db"}`,
                            }}
                          >
                            {s.currentEngagementStatus}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        {s.desiredEngagementStatus ? (
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              background: STATUS_COLORS[s.desiredEngagementStatus]?.bg || "#f3f4f6",
                              color: STATUS_COLORS[s.desiredEngagementStatus]?.text || "#374151",
                              border: `1px solid ${STATUS_COLORS[s.desiredEngagementStatus]?.border || "#d1d5db"}`,
                            }}
                          >
                            {s.desiredEngagementStatus}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        {currentIdx >= 0 && desiredIdx >= 0 ? (
                          <span className={`text-xs font-semibold ${gap > 0 ? "text-orange-600" : gap < 0 ? "text-red-600" : "text-green-600"}`}>
                            {gap > 0 ? `+${gap} levels to improve` : gap < 0 ? `${gap} levels (regression risk)` : "At target"}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        {s.engagementStrategy ? (
                          <Badge variant="outline" className="text-xs">{s.engagementStrategy}</Badge>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {stakeholders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No stakeholders found. Add stakeholders in the Stakeholder Register first.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Engagement Plan Tab ──────────────────────────────────────────────────────
function EngagementPlanTab({ stakeholders, projectId }: { stakeholders: any[]; projectId: number }) {
  const utils = trpc.useUtils();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState({
    stakeholderId: "",
    action: "",
    objective: "",
    targetStatus: "",
    responsible: "",
    dueDate: "",
    frequency: "",
    notes: "",
    status: "Planned",
  });

  const { data: planItems = [] } = trpc.engagement.listPlanItems.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const createMutation = trpc.engagement.createPlanItem.useMutation({
    onSuccess: () => {
      utils.engagement.listPlanItems.invalidate();
      setIsAddOpen(false);
      setForm({ stakeholderId: "", action: "", objective: "", targetStatus: "", responsible: "", dueDate: "", frequency: "", notes: "", status: "Planned" });
      toast.success("Engagement action added");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const updateMutation = trpc.engagement.updatePlanItem.useMutation({
    onSuccess: () => {
      utils.engagement.listPlanItems.invalidate();
      setEditingItem(null);
      toast.success("Updated");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const deleteMutation = trpc.engagement.deletePlanItem.useMutation({
    onSuccess: () => { utils.engagement.listPlanItems.invalidate(); toast.success("Deleted"); },
  });

  const openEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      stakeholderId: item.stakeholderId?.toString() || "",
      action: item.action || "",
      objective: item.objective || "",
      targetStatus: item.targetStatus || "",
      responsible: item.responsible || "",
      dueDate: item.dueDate || "",
      frequency: item.frequency || "",
      notes: item.notes || "",
      status: item.status || "Planned",
    });
  };

  const renderForm = () => (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Stakeholder *</Label>
        <Select value={form.stakeholderId} onValueChange={(v) => setForm({ ...form, stakeholderId: v })}>
          <SelectTrigger><SelectValue placeholder="Select stakeholder..." /></SelectTrigger>
          <SelectContent>
            {stakeholders.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()}>{s.fullName}{s.position ? ` — ${s.position}` : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Action / Activity *</Label>
        <Input value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} placeholder="e.g. Schedule monthly steering committee meeting" />
      </div>
      <div className="space-y-2">
        <Label>Objective</Label>
        <Input value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} placeholder="What outcome does this action achieve?" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Target Engagement Status</Label>
          <Select value={form.targetStatus} onValueChange={(v) => setForm({ ...form, targetStatus: v })}>
            <SelectTrigger><SelectValue placeholder="Target..." /></SelectTrigger>
            <SelectContent>
              {ENGAGEMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Planned", "In Progress", "Completed", "Cancelled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Responsible</Label>
          <Input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} placeholder="Who is responsible?" />
        </div>
        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
            <SelectTrigger><SelectValue placeholder="How often?" /></SelectTrigger>
            <SelectContent>
              {["One-time", "Daily", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "As needed"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Due Date</Label>
        <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Additional notes..." />
      </div>
    </div>
  );

  const STATUS_BADGE: Record<string, string> = {
    Planned: "bg-gray-100 text-gray-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Completed: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  // Group by stakeholder
  const grouped = useMemo(() => {
    const map = new Map<number, { stakeholder: any; items: any[] }>();
    for (const item of planItems) {
      const s = stakeholders.find((x) => x.id === item.stakeholderId);
      if (!s) continue;
      if (!map.has(s.id)) map.set(s.id, { stakeholder: s, items: [] });
      map.get(s.id)!.items.push(item);
    }
    return Array.from(map.values());
  }, [planItems, stakeholders]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{planItems.length} engagement action{planItems.length !== 1 ? "s" : ""} across {grouped.length} stakeholder{grouped.length !== 1 ? "s" : ""}</p>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2" size="sm">
          <Plus className="h-4 w-4" /> Add Action
        </Button>
      </div>

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No engagement actions yet</p>
            <p className="text-sm mt-1">Add actions to move stakeholders from their current to desired engagement status.</p>
          </CardContent>
        </Card>
      ) : (
        grouped.map(({ stakeholder: s, items }) => {
          const [from, to] = avatarColor(s.id);
          return (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${from}, ${to})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white", flexShrink: 0 }}>
                    {s.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold">{s.fullName}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      {s.position && <span>{s.position}</span>}
                      {s.currentEngagementStatus && s.desiredEngagementStatus && (
                        <span className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: STATUS_COLORS[s.currentEngagementStatus]?.bg, color: STATUS_COLORS[s.currentEngagementStatus]?.text }}>{s.currentEngagementStatus}</span>
                          <span>→</span>
                          <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: STATUS_COLORS[s.desiredEngagementStatus]?.bg, color: STATUS_COLORS[s.desiredEngagementStatus]?.text }}>{s.desiredEngagementStatus}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="mt-0.5">
                        {item.status === "Completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{item.action}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[item.status] || "bg-gray-100 text-gray-700"}`}>{item.status}</span>
                          {item.targetStatus && (
                            <span className="text-xs text-muted-foreground">→ {item.targetStatus}</span>
                          )}
                        </div>
                        {item.objective && <p className="text-xs text-muted-foreground mt-0.5">{item.objective}</p>}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          {item.responsible && <span>👤 {item.responsible}</span>}
                          {item.frequency && <span>🔄 {item.frequency}</span>}
                          {item.dueDate && <span>📅 {item.dueDate}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                          <span className="text-xs">✏</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate({ id: item.id })}>
                          <span className="text-xs">✕</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Engagement Action</DialogTitle></DialogHeader>
          {renderForm()}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!form.stakeholderId || !form.action.trim()) { toast.error("Stakeholder and action are required"); return; }
                createMutation.mutate({
                  projectId,
                  stakeholderId: parseInt(form.stakeholderId),
                  action: form.action,
                  objective: form.objective || undefined,
                  targetStatus: form.targetStatus || undefined,
                  responsible: form.responsible || undefined,
                  dueDate: form.dueDate || undefined,
                  frequency: form.frequency || undefined,
                  notes: form.notes || undefined,
                  status: form.status,
                });
              }}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Adding..." : "Add Action"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(o) => !o && setEditingItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Engagement Action</DialogTitle></DialogHeader>
          {renderForm()}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!editingItem) return;
                updateMutation.mutate({
                  id: editingItem.id,
                  data: {
                    action: form.action || undefined,
                    objective: form.objective || undefined,
                    targetStatus: form.targetStatus || undefined,
                    responsible: form.responsible || undefined,
                    dueDate: form.dueDate || undefined,
                    frequency: form.frequency || undefined,
                    notes: form.notes || undefined,
                    status: form.status,
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
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EngagementPlan() {
  const { currentProjectId } = useProject();

  const { data: stakeholders = [], isLoading } = trpc.stakeholders.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

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
            <Target className="w-6 h-6 text-primary" />
            Engagement Plan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Analyse stakeholder positions and plan engagement actions to move them to desired levels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{stakeholders.length} Stakeholders</Badge>
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
            {stakeholders.filter((s) => s.currentEngagementStatus !== s.desiredEngagementStatus && s.currentEngagementStatus && s.desiredEngagementStatus).length} with gaps
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="analysis">
        <TabsList>
          <TabsTrigger value="analysis">Stakeholder Analysis</TabsTrigger>
          <TabsTrigger value="plan">Engagement Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="mt-4">
          <StakeholderAnalysisTab stakeholders={stakeholders} />
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          {currentProjectId && (
            <EngagementPlanTab stakeholders={stakeholders} projectId={currentProjectId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
