import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TicketCheck, Clock, ShieldCheck, AlertTriangle, Headset,
  Flame, TrendingUp, CheckCircle2, XCircle, BarChart3
} from "lucide-react";
import { Link } from "wouter";

// ─── Colour helpers ───────────────────────────────────────────────────────────
const PRIORITY_COLOR: Record<string, string> = {
  Critical: "bg-red-500/20 text-red-300 border-red-500/30",
  High:     "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Medium:   "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Low:      "bg-slate-500/20 text-slate-300 border-slate-500/30",
};
const STATUS_COLOR: Record<string, string> = {
  Open:        "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "In Progress": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Waiting:     "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Resolved:    "bg-green-500/20 text-green-300 border-green-500/30",
  Closed:      "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, accent, sub,
}: {
  label: string; value: string | number; icon: React.ElementType; accent: string; sub?: string;
}) {
  return (
    <Card className="bg-card/60 border-border/40">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl font-bold" style={{ color: accent }}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="rounded-lg p-2" style={{ background: accent + "22" }}>
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-20">
      {data.map(d => (
        <div key={d.label} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs text-muted-foreground">{d.value}</span>
          <div
            className="w-full rounded-t"
            style={{ height: `${(d.value / max) * 60}px`, background: d.color, minHeight: d.value > 0 ? 4 : 0 }}
          />
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Operations Dashboard ─────────────────────────────────────────────────────
function OpsDashboard() {
  const { currentProjectId } = useProject();
  const pid = currentProjectId!;

  const { data: tickets = [] } = trpc.tickets.list.useQuery({ projectId: pid }, { enabled: !!pid });
  const { data: slaSummary }   = trpc.tickets.slaSummary.useQuery({ projectId: pid }, { enabled: !!pid });
  const { data: escalations = [] } = trpc.escalations.list.useQuery({ projectId: pid }, { enabled: !!pid });
  const { data: escalationStats } = trpc.escalations.stats.useQuery({ projectId: pid }, { enabled: !!pid });

  const openTickets     = tickets.filter(t => t.status === "Open" || t.status === "In Progress").length;
  const resolvedToday   = tickets.filter(t => {
    if (!t.resolvedAt) return false;
    const d = new Date(t.resolvedAt);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }).length;
  const createdToday    = tickets.filter(t => {
    const d = new Date(t.createdAt);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }).length;
  const slaCompliance   = slaSummary?.complianceRate ?? 100;
  const breachedCount   = slaSummary?.resolutionBreached ?? 0;

  const byPriority = ["Critical", "High", "Medium", "Low"].map(p => ({
    label: p, value: tickets.filter(t => t.priority === p).length,
    color: p === "Critical" ? "#ef4444" : p === "High" ? "#f97316" : p === "Medium" ? "#eab308" : "#64748b",
  }));
  const byStatus = ["Open", "In Progress", "Waiting", "Resolved", "Closed"].map(s => ({
    label: s.replace(" ", "\u00A0"), value: tickets.filter(t => t.status === s).length,
    color: s === "Open" ? "#3b82f6" : s === "In Progress" ? "#f59e0b" : s === "Waiting" ? "#8b5cf6" : s === "Resolved" ? "#22c55e" : "#64748b",
  }));

  const openEscalations = escalations.filter(e => !["Resolved", "Closed"].includes(e.status ?? "")).length;

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open Tickets"    value={openTickets}    icon={TicketCheck}  accent="#ef4444" sub={`${tickets.length} total`} />
        <StatCard label="Created Today"   value={createdToday}   icon={Headset}      accent="#3b82f6" />
        <StatCard label="Resolved Today"  value={resolvedToday}  icon={ShieldCheck}  accent="#22c55e" />
        <StatCard
          label="SLA Compliance"
          value={`${slaCompliance}%`}
          icon={Clock}
          accent={slaCompliance >= 90 ? "#22c55e" : slaCompliance >= 75 ? "#f59e0b" : "#ef4444"}
          sub={breachedCount > 0 ? `${breachedCount} breached` : "All within SLA"}
        />
      </div>

      {/* SLA breach alert */}
      {breachedCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-800/50 bg-red-950/30 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <span className="text-sm text-red-200">
            {breachedCount} ticket{breachedCount !== 1 ? "s have" : " has"} breached SLA resolution targets.{" "}
            <Link href="/sla-tickets" className="underline text-red-300 hover:text-red-100">View tickets →</Link>
          </span>
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card/60 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" /> Tickets by Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={byPriority} />
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" /> Tickets by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={byStatus} />
          </CardContent>
        </Card>
      </div>

      {/* Escalations summary */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" /> Escalations Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{escalationStats?.total ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{openEscalations}</p>
              <p className="text-xs text-muted-foreground">Open</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{escalationStats?.resolved ?? 0}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: (escalationStats?.slaCompliance ?? 100) >= 80 ? "#22c55e" : "#ef4444" }}>
                {escalationStats?.slaCompliance ?? 100}%
              </p>
              <p className="text-xs text-muted-foreground">SLA Compliance</p>
            </div>
          </div>
          {openEscalations > 0 && (
            <div className="mt-3 text-right">
              <Link href="/escalations" className="text-xs text-orange-400 hover:text-orange-300 underline">
                View all escalations →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent open tickets */}
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TicketCheck className="h-4 w-4 text-blue-400" /> Recent Open Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.filter(t => t.status === "Open" || t.status === "In Progress").length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              No open tickets — all clear!
            </div>
          ) : (
            <div className="space-y-2">
              {tickets
                .filter(t => t.status === "Open" || t.status === "In Progress")
                .slice(0, 8)
                .map(t => (
                  <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border/30 bg-background/40 px-3 py-2">
                    <span className="font-mono text-xs text-sky-400 w-16 shrink-0">{t.idCode}</span>
                    <span className="text-sm text-foreground flex-1 truncate">{t.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium shrink-0 ${PRIORITY_COLOR[t.priority] ?? ""}`}>{t.priority}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium shrink-0 ${STATUS_COLOR[t.status] ?? ""}`}>{t.status}</span>
                    {t.slaResolutionBreached && (
                      <span title="SLA Breached">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                      </span>
                    )}
                  </div>
                ))}
              {tickets.filter(t => t.status === "Open" || t.status === "In Progress").length > 8 && (
                <div className="text-right">
                  <Link href="/sla-tickets" className="text-xs text-blue-400 hover:text-blue-300 underline">
                    View all {tickets.filter(t => t.status === "Open" || t.status === "In Progress").length} open tickets →
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OperationsDashboard() {
  const { currentProjectId } = useProject();

  if (!currentProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <Headset className="h-10 w-10 opacity-30" />
        <p className="text-sm">Select a project to view the Operations Dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg p-2 bg-emerald-500/10">
          <Headset className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Operations Dashboard</h1>
          <p className="text-xs text-muted-foreground">ITIL-aligned service desk · tickets · SLA · escalations</p>
        </div>
      </div>

      <OpsDashboard />

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "SLA Tickets",  href: "/sla-tickets",   icon: TicketCheck, color: "#3b82f6" },
          { label: "Escalations",  href: "/escalations",   icon: Flame,       color: "#f97316" },
          { label: "SLA Policies", href: "/sla-tickets?tab=policies", icon: ShieldCheck, color: "#22c55e" },
        ].map(({ label, href, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <div
              className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 px-4 py-3 cursor-pointer hover:bg-card/80 transition-colors"
              style={{ borderLeftColor: color, borderLeftWidth: 3 }}
            >
              <Icon className="h-4 w-4 shrink-0" style={{ color }} />
              <span className="text-sm font-medium">{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
