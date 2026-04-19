import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, DollarSign, BarChart2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const PHASES = ["Initiation", "Planning", "Design", "Development", "Testing", "Deployment", "Closure"] as const;
type Phase = typeof PHASES[number];

const PHASE_COLORS: Record<Phase, string> = {
  Initiation: "bg-slate-100 text-slate-700",
  Planning: "bg-blue-100 text-blue-700",
  Design: "bg-purple-100 text-purple-700",
  Development: "bg-indigo-100 text-indigo-700",
  Testing: "bg-yellow-100 text-yellow-700",
  Deployment: "bg-orange-100 text-orange-700",
  Closure: "bg-green-100 text-green-700",
};

interface Props {
  projectId: number;
  stakeholders: Array<{ id: number; fullName: string; classification?: string }>;
}

const EMPTY_FORM = {
  stakeholderId: "",
  phase: "Planning" as Phase,
  roleOnPhase: "",
  startDate: "",
  endDate: "",
  allocationPct: "100",
  plannedHours: "0",
  actualHours: "0",
  costRate: "",
  notes: "",
};

function formatCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function ResourceAllocationTab({ projectId, stakeholders }: Props) {
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [activeView, setActiveView] = useState<"matrix" | "list" | "cost">("matrix");

  const { data: allocations = [], isLoading } = trpc.stakeholderSub.allocations.list.useQuery({ projectId });
  const { data: matrix = [] } = trpc.stakeholderSub.allocations.matrix.useQuery({ projectId });
  const { data: costSummary } = trpc.stakeholderSub.allocations.costSummary.useQuery({ projectId });

  const invalidate = () => {
    utils.stakeholderSub.allocations.list.invalidate({ projectId });
    utils.stakeholderSub.allocations.matrix.invalidate({ projectId });
    utils.stakeholderSub.allocations.costSummary.invalidate({ projectId });
  };

  const createMutation = trpc.stakeholderSub.allocations.create.useMutation({
    onSuccess: () => { toast.success("Allocation added"); invalidate(); setShowCreate(false); setForm({ ...EMPTY_FORM }); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.stakeholderSub.allocations.update.useMutation({
    onSuccess: () => { toast.success("Updated"); invalidate(); setEditId(null); setShowCreate(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.stakeholderSub.allocations.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit() {
    if (!form.stakeholderId || !form.phase) {
      toast.error("Resource and phase are required");
      return;
    }
    const payload = {
      projectId,
      stakeholderId: Number(form.stakeholderId),
      phase: form.phase,
      roleOnPhase: form.roleOnPhase || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      allocationPct: Number(form.allocationPct),
      plannedHours: Number(form.plannedHours),
      actualHours: Number(form.actualHours),
      costRate: form.costRate ? Number(form.costRate) : null,
      notes: form.notes || undefined,
    };
    if (editId !== null) {
      updateMutation.mutate({ id: editId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function openEdit(a: typeof allocations[number]) {
    setEditId(a.id);
    setForm({
      stakeholderId: String(a.stakeholderId),
      phase: a.phase as Phase,
      roleOnPhase: a.roleOnPhase ?? "",
      startDate: a.startDate ?? "",
      endDate: a.endDate ?? "",
      allocationPct: String(a.allocationPct ?? 100),
      plannedHours: String(a.plannedHours ?? 0),
      actualHours: String(a.actualHours ?? 0),
      costRate: a.costRate != null ? String(a.costRate) : "",
      notes: a.notes ?? "",
    });
    setShowCreate(true);
  }

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border overflow-hidden">
          {(["matrix", "list", "cost"] as const).map((v) => (
            <button
              key={v}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeView === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              onClick={() => setActiveView(v)}
            >
              {v === "matrix" ? "Allocation Matrix" : v === "list" ? "All Allocations" : "Cost Summary"}
            </button>
          ))}
        </div>
        <Button size="sm" className="ml-auto h-8 gap-1" onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowCreate(true); }}>
          <Plus className="h-3.5 w-3.5" /> Add Allocation
        </Button>
      </div>

      {/* Matrix View */}
      {activeView === "matrix" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              Resource × Phase Allocation Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Resource</TableHead>
                  {PHASES.map(p => (
                    <TableHead key={p} className="text-center min-w-[100px]">
                      <Badge className={`text-[10px] ${PHASE_COLORS[p]}`}>{p}</Badge>
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Total Planned</TableHead>
                  <TableHead className="text-right">Total Actual</TableHead>
                  <TableHead className="text-right">Est. Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrix.length === 0 ? (
                  <TableRow><TableCell colSpan={PHASES.length + 4} className="text-center py-8 text-muted-foreground">No allocations yet. Add allocations to see the matrix.</TableCell></TableRow>
                ) : matrix.map((row: any) => (
                  <TableRow key={row.stakeholderId}>
                    <TableCell className="font-medium text-sm">{row.stakeholderName}</TableCell>
                    {PHASES.map(p => {
                      const cell = row.phases[p];
                      if (!cell) return <TableCell key={p} className="text-center text-muted-foreground text-xs">—</TableCell>;
                      const pct = cell.allocationPct;
                      const pctColor = pct > 100 ? "text-red-600 font-bold" : pct >= 80 ? "text-yellow-600" : "text-green-600";
                      return (
                        <TableCell key={p} className="text-center">
                          <div className="text-xs font-medium">{cell.plannedHours}h</div>
                          <div className={`text-[10px] ${pctColor}`}>{pct}%</div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-medium text-sm">{row.totalPlanned}h</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{row.totalActual}h</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(row.totalCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {activeView === "list" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Alloc %</TableHead>
                  <TableHead className="text-right">Planned h</TableHead>
                  <TableHead className="text-right">Actual h</TableHead>
                  <TableHead className="text-right">Cost Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : allocations.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No allocations yet</TableCell></TableRow>
                ) : allocations.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-sm">{a.stakeholderName ?? `#${a.stakeholderId}`}</TableCell>
                    <TableCell><Badge className={`text-xs ${PHASE_COLORS[a.phase as Phase] ?? ""}`}>{a.phase}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.roleOnPhase || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.startDate && a.endDate ? `${a.startDate} → ${a.endDate}` : "—"}</TableCell>
                    <TableCell className="text-right text-sm">{a.allocationPct ?? 100}%</TableCell>
                    <TableCell className="text-right text-sm font-medium">{Number(a.plannedHours ?? 0).toFixed(0)}h</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{Number(a.actualHours ?? 0).toFixed(0)}h</TableCell>
                    <TableCell className="text-right text-sm">{a.effectiveCostRate ? `$${Number(a.effectiveCostRate).toFixed(0)}/h` : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Delete this allocation?")) deleteMutation.mutate({ id: a.id }); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Cost Summary View */}
      {activeView === "cost" && costSummary && (
        <div className="space-y-4">
          {/* Top-level summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-xl font-bold text-blue-700">{formatCurrency(costSummary.totalPlannedCost)}</div>
                  <div className="text-xs text-blue-600">Planned Cost</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-xl font-bold text-green-700">{formatCurrency(costSummary.totalActualCost)}</div>
                  <div className="text-xs text-green-600">Actual Cost</div>
                </div>
              </CardContent>
            </Card>
            <Card className={`border-2 ${costSummary.variance >= 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <BarChart2 className={`h-5 w-5 ${costSummary.variance >= 0 ? "text-emerald-600" : "text-red-600"}`} />
                <div>
                  <div className={`text-xl font-bold ${costSummary.variance >= 0 ? "text-emerald-700" : "text-red-700"}`}>{formatCurrency(Math.abs(costSummary.variance))}</div>
                  <div className={`text-xs ${costSummary.variance >= 0 ? "text-emerald-600" : "text-red-600"}`}>{costSummary.variance >= 0 ? "Under Budget" : "Over Budget"}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Per-resource breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Cost by Resource</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead className="text-right">Planned h</TableHead>
                    <TableHead className="text-right">Actual h</TableHead>
                    <TableHead className="text-right">Planned Cost</TableHead>
                    <TableHead className="text-right">Actual Cost</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(costSummary.byResource as any[]).map((r) => (
                    <TableRow key={r.stakeholderId}>
                      <TableCell className="font-medium text-sm">{r.stakeholderName}</TableCell>
                      <TableCell className="text-right text-sm">{r.plannedHours.toFixed(0)}h</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{r.actualHours.toFixed(0)}h</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(r.plannedCost)}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(r.actualCost)}</TableCell>
                      <TableCell className={`text-right text-sm font-medium ${r.variance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {r.variance >= 0 ? "+" : ""}{formatCurrency(r.variance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Per-phase breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Cost by Phase</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phase</TableHead>
                    <TableHead className="text-right">Planned Cost</TableHead>
                    <TableHead className="text-right">Actual Cost</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(costSummary.byPhase as Record<string, { plannedCost: number; actualCost: number }>).map(([phase, data]) => {
                    const variance = data.plannedCost - data.actualCost;
                    return (
                      <TableRow key={phase}>
                        <TableCell><Badge className={`text-xs ${PHASE_COLORS[phase as Phase] ?? "bg-gray-100 text-gray-700"}`}>{phase}</Badge></TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(data.plannedCost)}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{formatCurrency(data.actualCost)}</TableCell>
                        <TableCell className={`text-right text-sm font-medium ${variance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {variance >= 0 ? "+" : ""}{formatCurrency(variance)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId !== null ? "Edit Allocation" : "Add Allocation"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Resource *</Label>
                <Select value={form.stakeholderId} onValueChange={(v) => setForm({ ...form, stakeholderId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select resource..." /></SelectTrigger>
                  <SelectContent>
                    {stakeholders.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Phase *</Label>
                <Select value={form.phase} onValueChange={(v) => setForm({ ...form, phase: v as Phase })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PHASES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Role on Phase</Label>
              <Input value={form.roleOnPhase} onChange={(e) => setForm({ ...form, roleOnPhase: e.target.value })} placeholder="e.g. Lead Developer" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>Allocation %</Label>
                <Input type="number" min={0} max={200} value={form.allocationPct} onChange={(e) => setForm({ ...form, allocationPct: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Planned Hours</Label>
                <Input type="number" min={0} step={0.5} value={form.plannedHours} onChange={(e) => setForm({ ...form, plannedHours: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Actual Hours</Label>
                <Input type="number" min={0} step={0.5} value={form.actualHours} onChange={(e) => setForm({ ...form, actualHours: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Cost Rate Override ($/h) — leave blank to use resource default</Label>
              <Input type="number" min={0} step={0.01} value={form.costRate} onChange={(e) => setForm({ ...form, costRate: e.target.value })} placeholder="e.g. 85.00" />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditId(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editId !== null ? "Save Changes" : "Add Allocation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
