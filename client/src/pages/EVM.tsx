import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Info,
  Plus,
  RefreshCw,
  Settings2,
  Pencil,
  Trash2,
  BarChart3,
  Target,
  DollarSign,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtPct(n: number): string {
  if (!isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function fmtCurrency(n: number, symbol: string): string {
  if (!isFinite(n)) return "—";
  return `${symbol}${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

type PerfStatus = "good" | "warn" | "bad" | "neutral";

function indexStatus(val: number, isIndex: boolean): PerfStatus {
  if (!isFinite(val)) return "neutral";
  if (isIndex) {
    if (val >= 1.0) return "good";
    if (val >= 0.85) return "warn";
    return "bad";
  }
  // variance
  if (val >= 0) return "good";
  if (val >= -0.05) return "warn";
  return "bad";
}

const statusColors: Record<PerfStatus, string> = {
  good: "text-emerald-500",
  warn: "text-amber-500",
  bad: "text-red-500",
  neutral: "text-muted-foreground",
};

const statusBg: Record<PerfStatus, string> = {
  good: "bg-emerald-500/10 border-emerald-500/30",
  warn: "bg-amber-500/10 border-amber-500/30",
  bad: "bg-red-500/10 border-red-500/30",
  neutral: "bg-muted/30 border-border",
};

function TrendIcon({ val, isIndex }: { val: number; isIndex: boolean }) {
  const s = indexStatus(val, isIndex);
  if (s === "good") return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (s === "bad") return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-amber-500" />;
}

// ─── KPI Card ───────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  status: PerfStatus;
  tooltip: string;
  icon?: React.ReactNode;
}

function KpiCard({ label, value, sub, status, tooltip, icon }: KpiCardProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`rounded-xl border p-4 flex flex-col gap-1 cursor-default ${statusBg[status]}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
            {icon}
          </div>
          <div className={`text-2xl font-bold ${statusColors[status]}`}>{value}</div>
          {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-xs">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function EVMDashboard() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;
  const utils = trpc.useUtils();

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: dashboard, isLoading } = trpc.evm.getDashboard.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );

  const { data: snapshots = [] } = trpc.evm.listSnapshots.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );

  // ── Currency symbol from project currencies ──────────────────────────────
  const { data: currencies = [] } = trpc.currencies.list.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );
  const baseCurrency = (currencies as Array<{ isBase: boolean; symbol?: string }>).find((c) => c.isBase);
  const symbol = baseCurrency?.symbol ?? "";

  // ── Mutations ─────────────────────────────────────────────────────────────
  const upsertBaseline = trpc.evm.upsertBaseline.useMutation({
    onSuccess: () => { utils.evm.getDashboard.invalidate({ projectId }); toast.success("Baseline saved"); },
    onError: () => toast.error("Failed to save baseline"),
  });

  const createSnapshot = trpc.evm.createSnapshot.useMutation({
    onSuccess: () => { utils.evm.getDashboard.invalidate({ projectId }); utils.evm.listSnapshots.invalidate({ projectId }); toast.success("Snapshot added"); },
    onError: () => toast.error("Failed to add snapshot"),
  });

  const updateSnapshot = trpc.evm.updateSnapshot.useMutation({
    onSuccess: () => { utils.evm.getDashboard.invalidate({ projectId }); utils.evm.listSnapshots.invalidate({ projectId }); toast.success("Snapshot updated"); },
    onError: () => toast.error("Failed to update snapshot"),
  });

  const deleteSnapshot = trpc.evm.deleteSnapshot.useMutation({
    onSuccess: () => { utils.evm.getDashboard.invalidate({ projectId }); utils.evm.listSnapshots.invalidate({ projectId }); toast.success("Snapshot deleted"); },
    onError: () => toast.error("Failed to delete snapshot"),
  });

  const syncFromWbs = trpc.evm.syncFromWbs.useMutation({
    onSuccess: (data) => { utils.evm.getDashboard.invalidate({ projectId }); toast.success(`Synced ${data.synced} WBS elements`); },
    onError: () => toast.error("Sync failed"),
  });

  // ── Local state ──────────────────────────────────────────────────────────
  const [baselineOpen, setBaselineOpen] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState<typeof snapshots[0] | null>(null);

  const [bForm, setBForm] = useState({ bac: "", startDate: "", endDate: "", notes: "" });
  const [sForm, setSForm] = useState({ periodLabel: "", periodDate: "", pv: "", ev: "", ac: "", notes: "" });

  function openBaseline() {
    setBForm({
      bac: dashboard?.bac?.toString() ?? "",
      startDate: (dashboard?.baseline as { startDate?: string | null })?.startDate ?? "",
      endDate: (dashboard?.baseline as { endDate?: string | null })?.endDate ?? "",
      notes: (dashboard?.baseline as { notes?: string | null })?.notes ?? "",
    });
    setBaselineOpen(true);
  }

  function openAddSnapshot() {
    setSForm({ periodLabel: "", periodDate: new Date().toISOString().split("T")[0], pv: "", ev: "", ac: "", notes: "" });
    setEditSnapshot(null);
    setSnapshotOpen(true);
  }

  function openEditSnapshot(s: typeof snapshots[0]) {
    setSForm({
      periodLabel: s.periodLabel,
      periodDate: s.periodDate instanceof Date ? s.periodDate.toISOString().split('T')[0] : (s.periodDate ?? ""),
      pv: s.pv?.toString() ?? "0",
      ev: s.ev?.toString() ?? "0",
      ac: s.ac?.toString() ?? "0",
      notes: s.notes ?? "",
    });
    setEditSnapshot(s);
    setSnapshotOpen(true);
  }

  function saveBaseline() {
    upsertBaseline.mutate({
      projectId,
      bac: parseFloat(bForm.bac) || 0,
      startDate: bForm.startDate || null,
      endDate: bForm.endDate || null,
      notes: bForm.notes || null,
    });
    setBaselineOpen(false);
  }

  function saveSnapshot() {
    const payload = {
      projectId,
      periodLabel: sForm.periodLabel,
      periodDate: sForm.periodDate,
      pv: parseFloat(sForm.pv) || 0,
      ev: parseFloat(sForm.ev) || 0,
      ac: parseFloat(sForm.ac) || 0,
      notes: sForm.notes || null,
    };
    if (editSnapshot) {
      updateSnapshot.mutate({ id: editSnapshot.id, ...payload });
    } else {
      createSnapshot.mutate(payload);
    }
    setSnapshotOpen(false);
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const d = dashboard;
  const bac = d?.bac ?? 0;
  const pv = d?.pv ?? 0;
  const ev = d?.ev ?? 0;
  const ac = d?.ac ?? 0;
  const sv = d?.sv ?? 0;
  const cv = d?.cv ?? 0;
  const spi = d?.spi ?? 0;
  const cpi = d?.cpi ?? 0;
  const eac = d?.eac ?? 0;
  const etc = d?.etc ?? 0;
  const vac = d?.vac ?? 0;
  const tcpi = d?.tcpi ?? 0;
  const pctComplete = d?.percentComplete ?? 0;

  // S-curve data: add BAC line
  const sCurveData = useMemo(() => {
    const series = (d?.trendSeries ?? []).map((s) => ({
      period: s.period,
      PV: s.pv,
      EV: s.ev,
      AC: s.ac,
    }));
    return series;
  }, [d?.trendSeries]);

  const hasData = (d?.snapshotCount ?? 0) > 0;

  if (!projectId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Select a project to view the EVM Dashboard.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Earned Value Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            PMBOK 7 · Performance Domain: Measurement · Track schedule and cost performance in real time
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => syncFromWbs.mutate({ projectId })} disabled={syncFromWbs.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncFromWbs.isPending ? "animate-spin" : ""}`} />
            Sync from WBS
          </Button>
          <Button variant="outline" size="sm" onClick={openBaseline}>
            <Settings2 className="h-4 w-4 mr-2" />
            {bac > 0 ? "Edit Baseline" : "Set Baseline"}
          </Button>
          <Button size="sm" onClick={openAddSnapshot}>
            <Plus className="h-4 w-4 mr-2" />
            Add Snapshot
          </Button>
        </div>
      </div>

      {/* ── Baseline Banner ──────────────────────────────────────────────── */}
      {bac === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>No baseline set. Click <strong>Set Baseline</strong> to define your Budget At Completion (BAC) and project dates.</span>
        </div>
      )}

      {/* ── Primary KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="BAC"
          value={fmtCurrency(bac, symbol)}
          sub="Budget At Completion"
          status="neutral"
          tooltip="The total authorized budget for the project (Budget At Completion)."
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          label="% Complete"
          value={fmtPct(pctComplete)}
          sub={`EV / BAC`}
          status={pctComplete >= 50 ? "good" : pctComplete >= 25 ? "warn" : "neutral"}
          tooltip="Earned Value as a percentage of Budget At Completion. Represents overall project completion."
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          label="EAC"
          value={fmtCurrency(eac, symbol)}
          sub="Estimate At Completion"
          status={eac <= bac ? "good" : "bad"}
          tooltip="Expected total cost at completion: BAC ÷ CPI. If CPI < 1, EAC > BAC (over budget)."
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          label="VAC"
          value={`${vac >= 0 ? "+" : ""}${fmtCurrency(vac, symbol)}`}
          sub="Variance At Completion"
          status={vac >= 0 ? "good" : "bad"}
          tooltip="BAC − EAC. Positive = under budget at completion; negative = over budget."
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* ── Performance Indices ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="SPI"
          value={fmt(spi)}
          sub={`SV: ${sv >= 0 ? "+" : ""}${fmtCurrency(sv, symbol)}`}
          status={indexStatus(spi, true)}
          tooltip="Schedule Performance Index = EV ÷ PV. >1 = ahead of schedule; <1 = behind schedule."
          icon={<TrendIcon val={spi} isIndex />}
        />
        <KpiCard
          label="CPI"
          value={fmt(cpi)}
          sub={`CV: ${cv >= 0 ? "+" : ""}${fmtCurrency(cv, symbol)}`}
          status={indexStatus(cpi, true)}
          tooltip="Cost Performance Index = EV ÷ AC. >1 = under budget; <1 = over budget."
          icon={<TrendIcon val={cpi} isIndex />}
        />
        <KpiCard
          label="ETC"
          value={fmtCurrency(etc, symbol)}
          sub="Estimate To Complete"
          status={etc <= (bac - ev) ? "good" : "warn"}
          tooltip="EAC − AC. Remaining cost needed to complete the project."
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          label="TCPI"
          value={fmt(tcpi)}
          sub="To-Complete PI"
          status={indexStatus(tcpi <= 1 ? 1.1 : 0.9, true)}
          tooltip="(BAC − EV) ÷ (BAC − AC). The CPI needed for remaining work to meet BAC. >1 = harder to achieve."
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* ── Current Period Values ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Planned Value (PV)</div>
          <div className="text-xl font-bold text-blue-500">{fmtCurrency(pv, symbol)}</div>
          <div className="text-xs text-muted-foreground mt-1">Budgeted work scheduled</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Earned Value (EV)</div>
          <div className="text-xl font-bold text-emerald-500">{fmtCurrency(ev, symbol)}</div>
          <div className="text-xs text-muted-foreground mt-1">Value of work completed</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Actual Cost (AC)</div>
          <div className="text-xl font-bold text-orange-500">{fmtCurrency(ac, symbol)}</div>
          <div className="text-xs text-muted-foreground mt-1">Actual cost incurred</div>
        </div>
      </div>

      {/* ── Tabs: S-Curve | WBS Breakdown | Snapshots | Reference ──────── */}
      <Tabs defaultValue="scurve">
        <TabsList>
          <TabsTrigger value="scurve">S-Curve Chart</TabsTrigger>
          <TabsTrigger value="wbs">WBS Breakdown</TabsTrigger>
          <TabsTrigger value="snapshots">Period Snapshots</TabsTrigger>
          <TabsTrigger value="reference">EVM Reference</TabsTrigger>
        </TabsList>

        {/* S-Curve */}
        <TabsContent value="scurve">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">S-Curve: PV / EV / AC Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasData ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
                  <BarChart3 className="h-10 w-10 opacity-30" />
                  <p className="text-sm">Add period snapshots to see the S-curve trend.</p>
                  <Button size="sm" onClick={openAddSnapshot}><Plus className="h-4 w-4 mr-2" />Add First Snapshot</Button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={sCurveData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${symbol}${(v / 1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      formatter={(value: number, name: string) => [`${symbol}${value.toLocaleString()}`, name]}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {bac > 0 && (
                      <ReferenceLine y={bac} stroke="#6366f1" strokeDasharray="6 3" label={{ value: "BAC", fontSize: 11, fill: "#6366f1" }} />
                    )}
                    <Line type="monotone" dataKey="PV" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="EV" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="AC" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* WBS Breakdown */}
        <TabsContent value="wbs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">WBS Element Performance</CardTitle>
              <Button variant="outline" size="sm" onClick={() => syncFromWbs.mutate({ projectId })} disabled={syncFromWbs.isPending}>
                <RefreshCw className={`h-4 w-4 mr-2 ${syncFromWbs.isPending ? "animate-spin" : ""}`} />
                Sync from WBS
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {(d?.wbsBreakdown?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2 p-6">
                  <Info className="h-8 w-8 opacity-30" />
                  <p className="text-sm text-center">No WBS data yet. Add cost estimates in the WBS Builder, then click <strong>Sync from WBS</strong>.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="text-right">BAC</TableHead>
                      <TableHead className="text-right">PV</TableHead>
                      <TableHead className="text-right">EV</TableHead>
                      <TableHead className="text-right">AC</TableHead>
                      <TableHead className="text-right">SPI</TableHead>
                      <TableHead className="text-right">CPI</TableHead>
                      <TableHead className="text-right">CV</TableHead>
                      <TableHead className="text-right">% Done</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d?.wbsBreakdown?.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-xs">{row.wbsCode}</TableCell>
                        <TableCell className="max-w-[180px] truncate text-sm">{row.wbsTitle}</TableCell>
                        <TableCell className="text-right text-xs">{fmtCurrency(row.bac, symbol)}</TableCell>
                        <TableCell className="text-right text-xs text-blue-500">{fmtCurrency(row.pv, symbol)}</TableCell>
                        <TableCell className="text-right text-xs text-emerald-500">{fmtCurrency(row.ev, symbol)}</TableCell>
                        <TableCell className="text-right text-xs text-orange-500">{fmtCurrency(row.ac, symbol)}</TableCell>
                        <TableCell className={`text-right text-xs font-medium ${statusColors[indexStatus(row.spi, true)]}`}>{fmt(row.spi)}</TableCell>
                        <TableCell className={`text-right text-xs font-medium ${statusColors[indexStatus(row.cpi, true)]}`}>{fmt(row.cpi)}</TableCell>
                        <TableCell className={`text-right text-xs ${row.cv >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {row.cv >= 0 ? "+" : ""}{fmtCurrency(row.cv, symbol)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(row.percentComplete, 100)}%` }} />
                            </div>
                            <span>{fmtPct(row.percentComplete)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Snapshots */}
        <TabsContent value="snapshots">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Period Snapshots</CardTitle>
              <Button size="sm" onClick={openAddSnapshot}><Plus className="h-4 w-4 mr-2" />Add Snapshot</Button>
            </CardHeader>
            <CardContent className="p-0">
              {snapshots.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2 p-6">
                  <Info className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No snapshots yet. Add a snapshot to record cumulative PV, EV, and AC for a reporting period.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">PV</TableHead>
                      <TableHead className="text-right">EV</TableHead>
                      <TableHead className="text-right">AC</TableHead>
                      <TableHead className="text-right">SPI</TableHead>
                      <TableHead className="text-right">CPI</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshots.map((s) => {
                      const sPv = parseFloat(s.pv?.toString() ?? "0");
                      const sEv = parseFloat(s.ev?.toString() ?? "0");
                      const sAc = parseFloat(s.ac?.toString() ?? "0");
                      const sSpi = sPv === 0 ? 0 : sEv / sPv;
                      const sCpi = sAc === 0 ? 0 : sEv / sAc;
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium text-sm">{s.periodLabel}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{s.periodDate instanceof Date ? s.periodDate.toISOString().split('T')[0] : (s.periodDate ?? '')}</TableCell>
                          <TableCell className="text-right text-xs text-blue-500">{fmtCurrency(sPv, symbol)}</TableCell>
                          <TableCell className="text-right text-xs text-emerald-500">{fmtCurrency(sEv, symbol)}</TableCell>
                          <TableCell className="text-right text-xs text-orange-500">{fmtCurrency(sAc, symbol)}</TableCell>
                          <TableCell className={`text-right text-xs font-medium ${statusColors[indexStatus(sSpi, true)]}`}>{fmt(sSpi)}</TableCell>
                          <TableCell className={`text-right text-xs font-medium ${statusColors[indexStatus(sCpi, true)]}`}>{fmt(sCpi)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{s.notes ?? "—"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSnapshot(s)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteSnapshot.mutate({ id: s.id })}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reference */}
        <TabsContent value="reference">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">EVM Formula Reference (PMBOK 7)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Formula</TableHead>
                    <TableHead>Interpretation</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: "PV", full: "Planned Value", formula: "Budgeted work scheduled", interp: "What you planned to spend", val: fmtCurrency(pv, symbol), color: "text-blue-500" },
                    { name: "EV", full: "Earned Value", formula: "% Complete × BAC", interp: "Value of work actually done", val: fmtCurrency(ev, symbol), color: "text-emerald-500" },
                    { name: "AC", full: "Actual Cost", formula: "Actual expenditure", interp: "What you actually spent", val: fmtCurrency(ac, symbol), color: "text-orange-500" },
                    { name: "SV", full: "Schedule Variance", formula: "EV − PV", interp: ">0 ahead; <0 behind schedule", val: `${sv >= 0 ? "+" : ""}${fmtCurrency(sv, symbol)}`, color: sv >= 0 ? "text-emerald-500" : "text-red-500" },
                    { name: "CV", full: "Cost Variance", formula: "EV − AC", interp: ">0 under; <0 over budget", val: `${cv >= 0 ? "+" : ""}${fmtCurrency(cv, symbol)}`, color: cv >= 0 ? "text-emerald-500" : "text-red-500" },
                    { name: "SPI", full: "Schedule Performance Index", formula: "EV ÷ PV", interp: ">1 efficient; <1 behind", val: fmt(spi), color: statusColors[indexStatus(spi, true)] },
                    { name: "CPI", full: "Cost Performance Index", formula: "EV ÷ AC", interp: ">1 under budget; <1 over budget", val: fmt(cpi), color: statusColors[indexStatus(cpi, true)] },
                    { name: "EAC", full: "Estimate At Completion", formula: "BAC ÷ CPI", interp: "Projected total cost", val: fmtCurrency(eac, symbol), color: eac <= bac ? "text-emerald-500" : "text-red-500" },
                    { name: "ETC", full: "Estimate To Complete", formula: "EAC − AC", interp: "Remaining cost to finish", val: fmtCurrency(etc, symbol), color: "text-muted-foreground" },
                    { name: "VAC", full: "Variance At Completion", formula: "BAC − EAC", interp: ">0 under; <0 over budget at end", val: `${vac >= 0 ? "+" : ""}${fmtCurrency(vac, symbol)}`, color: vac >= 0 ? "text-emerald-500" : "text-red-500" },
                    { name: "TCPI", full: "To-Complete Performance Index", formula: "(BAC − EV) ÷ (BAC − AC)", interp: ">1 harder; <1 easier to achieve BAC", val: fmt(tcpi), color: tcpi <= 1 ? "text-emerald-500" : "text-amber-500" },
                  ].map((row) => (
                    <TableRow key={row.name}>
                      <TableCell>
                        <div className="font-mono font-bold text-sm">{row.name}</div>
                        <div className="text-xs text-muted-foreground">{row.full}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{row.formula}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.interp}</TableCell>
                      <TableCell className={`text-right font-medium text-sm ${row.color}`}>{row.val}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Baseline Dialog ──────────────────────────────────────────────── */}
      <Dialog open={baselineOpen} onOpenChange={setBaselineOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Project EVM Baseline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Budget At Completion (BAC) *</Label>
              <Input
                type="number"
                placeholder="e.g. 1000000"
                value={bForm.bac}
                onChange={(e) => setBForm({ ...bForm, bac: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Total authorized project budget in base currency ({symbol || "—"})</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Project Start Date</Label>
                <Input type="date" value={bForm.startDate} onChange={(e) => setBForm({ ...bForm, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Project End Date</Label>
                <Input type="date" value={bForm.endDate} onChange={(e) => setBForm({ ...bForm, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} placeholder="Baseline assumptions..." value={bForm.notes} onChange={(e) => setBForm({ ...bForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBaselineOpen(false)}>Cancel</Button>
            <Button onClick={saveBaseline} disabled={!bForm.bac}>Save Baseline</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Snapshot Dialog ──────────────────────────────────────────────── */}
      <Dialog open={snapshotOpen} onOpenChange={setSnapshotOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editSnapshot ? "Edit Snapshot" : "Add Period Snapshot"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Period Label *</Label>
                <Input placeholder="e.g. Week 5, Mar 2026" value={sForm.periodLabel} onChange={(e) => setSForm({ ...sForm, periodLabel: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={sForm.periodDate} onChange={(e) => setSForm({ ...sForm, periodDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-blue-500">PV ({symbol})</Label>
                <Input type="number" placeholder="0" value={sForm.pv} onChange={(e) => setSForm({ ...sForm, pv: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-emerald-500">EV ({symbol})</Label>
                <Input type="number" placeholder="0" value={sForm.ev} onChange={(e) => setSForm({ ...sForm, ev: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-orange-500">AC ({symbol})</Label>
                <Input type="number" placeholder="0" value={sForm.ac} onChange={(e) => setSForm({ ...sForm, ac: e.target.value })} />
              </div>
            </div>
            {sForm.pv && sForm.ev && sForm.ac && (
              <div className="rounded-lg bg-muted/40 border p-3 text-xs space-y-1">
                <div className="font-medium text-muted-foreground mb-1">Preview KPIs</div>
                {(() => {
                  const p = parseFloat(sForm.pv) || 0;
                  const e = parseFloat(sForm.ev) || 0;
                  const a = parseFloat(sForm.ac) || 0;
                  const spi2 = p === 0 ? 0 : e / p;
                  const cpi2 = a === 0 ? 0 : e / a;
                  return (
                    <div className="grid grid-cols-4 gap-2">
                      <div><span className="text-muted-foreground">SV: </span><span className={sv >= 0 ? "text-emerald-500" : "text-red-500"}>{`${(e-p) >= 0 ? "+" : ""}${fmtCurrency(e-p, symbol)}`}</span></div>
                      <div><span className="text-muted-foreground">CV: </span><span className={(e-a) >= 0 ? "text-emerald-500" : "text-red-500"}>{`${(e-a) >= 0 ? "+" : ""}${fmtCurrency(e-a, symbol)}`}</span></div>
                      <div><span className="text-muted-foreground">SPI: </span><span className={statusColors[indexStatus(spi2, true)]}>{fmt(spi2)}</span></div>
                      <div><span className="text-muted-foreground">CPI: </span><span className={statusColors[indexStatus(cpi2, true)]}>{fmt(cpi2)}</span></div>
                    </div>
                  );
                })()}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} placeholder="Period notes..." value={sForm.notes} onChange={(e) => setSForm({ ...sForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSnapshotOpen(false)}>Cancel</Button>
            <Button onClick={saveSnapshot} disabled={!sForm.periodLabel || !sForm.periodDate}>
              {editSnapshot ? "Update" : "Add Snapshot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
