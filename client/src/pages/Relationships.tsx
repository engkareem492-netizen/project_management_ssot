/**
 * Stakeholder Engagement Map
 * Distinct from the Stakeholders → "Engagement Matrix" tab (which is a manual drag-and-drop board).
 * This page shows:
 *  1. Bubble Map — SVG scatter-plot with each stakeholder plotted at their exact (Interest, Power)
 *     coordinates. Bubble size reflects influence (avg of power+interest). Quadrant shading shows
 *     the four strategy zones. Hover tooltip shows full details.
 *  2. Communication Plan — table of all stakeholders with comms details
 *  3. Engagement Summary — distribution analytics
 */
import { useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Map, MessageSquare, BarChart2, LayoutGrid,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getEngagementColors(strategy: string | null | undefined) {
  const map: Record<string, string> = {
    "Manage Closely": "bg-red-100 text-red-700 border-red-200",
    "Keep Satisfied": "bg-orange-100 text-orange-700 border-orange-200",
    "Keep Informed": "bg-blue-100 text-blue-700 border-blue-200",
    "Monitor": "bg-gray-100 text-gray-600 border-gray-200",
  };
  return map[strategy || ""] || "bg-muted text-muted-foreground border-border";
}

// Strategy color for bubble fill
const STRATEGY_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  "Manage Closely": { fill: "#fee2e2", stroke: "#ef4444", text: "#b91c1c" },
  "Keep Satisfied": { fill: "#ffedd5", stroke: "#f97316", text: "#c2410c" },
  "Keep Informed":  { fill: "#dbeafe", stroke: "#3b82f6", text: "#1d4ed8" },
  "Monitor":        { fill: "#f3f4f6", stroke: "#9ca3af", text: "#4b5563" },
};
const DEFAULT_COLOR = { fill: "#e9d5ff", stroke: "#8b5cf6", text: "#5b21b6" };

// Avatar palette (for bubble initials fallback)
const AVATAR_COLORS = [
  "#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#14b8a6",
];
const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

// ─── Bubble Map (SVG Scatter-plot) ────────────────────────────────────────────
function BubbleMap({ stakeholders }: { stakeholders: any[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ s: any; x: number; y: number } | null>(null);

  // Canvas dimensions
  const W = 700;
  const H = 480;
  const PAD = { top: 40, right: 40, bottom: 60, left: 60 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Scale: interest on X (1–5), power on Y (1–5)
  const scaleX = (v: number) => PAD.left + ((v - 1) / 4) * plotW;
  const scaleY = (v: number) => PAD.top + ((5 - v) / 4) * plotH; // invert Y

  // Bubble radius: proportional to (power+interest)/2, range 14–30
  const bubbleR = (s: any) => {
    const avg = ((s.powerLevel ?? 3) + (s.interestLevel ?? 3)) / 2;
    return 14 + ((avg - 1) / 4) * 16;
  };

  // Quadrant midpoints for labels
  const qMidX1 = PAD.left + plotW * 0.25;
  const qMidX2 = PAD.left + plotW * 0.75;
  const qMidY1 = PAD.top + plotH * 0.25;
  const qMidY2 = PAD.top + plotH * 0.75;
  const midX = PAD.left + plotW / 2;
  const midY = PAD.top + plotH / 2;

  // Jitter to avoid perfect overlaps (deterministic by id)
  const jitter = (id: number, axis: "x" | "y") => {
    const seed = axis === "x" ? id * 7 : id * 13;
    return ((seed % 11) - 5) * 1.2;
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Each bubble is plotted at the stakeholder's exact <strong>Interest (X)</strong> and <strong>Power (Y)</strong> scores (1–5).
        Bubble size reflects overall influence. Color matches the engagement strategy set in the Stakeholder Register.
        Hover a bubble for details.
      </p>
      <div className="border rounded-xl overflow-hidden bg-white dark:bg-card" style={{ maxWidth: W }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: "block", fontFamily: "inherit" }}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* ── Quadrant background fills ── */}
          {/* Top-left: Keep Satisfied (High Power, Low Interest) */}
          <rect x={PAD.left} y={PAD.top} width={plotW / 2} height={plotH / 2}
            fill="#fff7ed" opacity="0.7" />
          {/* Top-right: Manage Closely (High Power, High Interest) */}
          <rect x={midX} y={PAD.top} width={plotW / 2} height={plotH / 2}
            fill="#fef2f2" opacity="0.7" />
          {/* Bottom-left: Monitor (Low Power, Low Interest) */}
          <rect x={PAD.left} y={midY} width={plotW / 2} height={plotH / 2}
            fill="#f9fafb" opacity="0.7" />
          {/* Bottom-right: Keep Informed (Low Power, High Interest) */}
          <rect x={midX} y={midY} width={plotW / 2} height={plotH / 2}
            fill="#eff6ff" opacity="0.7" />

          {/* ── Quadrant divider lines ── */}
          <line x1={midX} y1={PAD.top} x2={midX} y2={PAD.top + plotH}
            stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="6 3" />
          <line x1={PAD.left} y1={midY} x2={PAD.left + plotW} y2={midY}
            stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="6 3" />

          {/* ── Quadrant labels ── */}
          <text x={qMidX1} y={qMidY1} textAnchor="middle" fontSize="11" fontWeight="700"
            fill="#c2410c" opacity="0.5">Keep Satisfied</text>
          <text x={qMidX2} y={qMidY1} textAnchor="middle" fontSize="11" fontWeight="700"
            fill="#b91c1c" opacity="0.5">Manage Closely</text>
          <text x={qMidX1} y={qMidY2} textAnchor="middle" fontSize="11" fontWeight="700"
            fill="#4b5563" opacity="0.5">Monitor</text>
          <text x={qMidX2} y={qMidY2} textAnchor="middle" fontSize="11" fontWeight="700"
            fill="#1d4ed8" opacity="0.5">Keep Informed</text>

          {/* ── Grid lines (minor) ── */}
          {[2, 3, 4].map(v => (
            <g key={v}>
              <line x1={scaleX(v)} y1={PAD.top} x2={scaleX(v)} y2={PAD.top + plotH}
                stroke="#e5e7eb" strokeWidth="1" />
              <line x1={PAD.left} y1={scaleY(v)} x2={PAD.left + plotW} y2={scaleY(v)}
                stroke="#e5e7eb" strokeWidth="1" />
            </g>
          ))}

          {/* ── Axes ── */}
          <line x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH}
            stroke="#6b7280" strokeWidth="1.5" />
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH}
            stroke="#6b7280" strokeWidth="1.5" />

          {/* ── Axis tick labels ── */}
          {[1, 2, 3, 4, 5].map(v => (
            <g key={v}>
              {/* X ticks */}
              <text x={scaleX(v)} y={PAD.top + plotH + 16} textAnchor="middle"
                fontSize="11" fill="#6b7280">{v}</text>
              {/* Y ticks */}
              <text x={PAD.left - 10} y={scaleY(v) + 4} textAnchor="end"
                fontSize="11" fill="#6b7280">{v}</text>
            </g>
          ))}

          {/* ── Axis titles ── */}
          <text x={PAD.left + plotW / 2} y={H - 8} textAnchor="middle"
            fontSize="12" fontWeight="600" fill="#374151">INTEREST →</text>
          <text
            x={14} y={PAD.top + plotH / 2}
            textAnchor="middle" fontSize="12" fontWeight="600" fill="#374151"
            transform={`rotate(-90, 14, ${PAD.top + plotH / 2})`}
          >POWER ↑</text>

          {/* ── Bubbles ── */}
          {stakeholders.map((s) => {
            const cx = scaleX(s.interestLevel ?? 3) + jitter(s.id, "x");
            const cy = scaleY(s.powerLevel ?? 3) + jitter(s.id, "y");
            const r = bubbleR(s);
            const col = STRATEGY_COLORS[s.engagementStrategy || ""] || DEFAULT_COLOR;
            const initials = (s.fullName || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <g
                key={s.id}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => {
                  const svgEl = svgRef.current;
                  if (!svgEl) return;
                  const rect = svgEl.getBoundingClientRect();
                  const scaleRatio = rect.width / W;
                  setTooltip({ s, x: cx * scaleRatio, y: cy * scaleRatio });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Shadow */}
                <circle cx={cx + 1} cy={cy + 2} r={r} fill="rgba(0,0,0,0.08)" />
                {/* Bubble */}
                <circle cx={cx} cy={cy} r={r}
                  fill={col.fill} stroke={col.stroke} strokeWidth="2" />
                {/* Initials */}
                <text x={cx} y={cy + 4} textAnchor="middle"
                  fontSize={r > 20 ? "10" : "8"} fontWeight="700" fill={col.text}
                  style={{ pointerEvents: "none" }}>
                  {initials}
                </text>
              </g>
            );
          })}

          {/* ── Legend ── */}
          {Object.entries(STRATEGY_COLORS).map(([label, col], i) => (
            <g key={label} transform={`translate(${PAD.left + i * 155}, ${H - 24})`}>
              <circle cx={6} cy={0} r={6} fill={col.fill} stroke={col.stroke} strokeWidth="1.5" />
              <text x={16} y={4} fontSize="10" fill="#374151">{label}</text>
            </g>
          ))}
        </svg>

        {/* Tooltip (positioned relative to the container) */}
        {tooltip && (
          <div
            style={{
              position: "absolute",
              left: tooltip.x + 12,
              top: tooltip.y - 10,
              pointerEvents: "none",
              zIndex: 50,
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "10px 14px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              minWidth: "180px",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "13px", color: "#111827", marginBottom: "4px" }}>
              {tooltip.s.fullName}
            </div>
            {tooltip.s.position && (
              <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}>{tooltip.s.position}</div>
            )}
            <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", background: "#f3f4f6", padding: "1px 6px", borderRadius: "4px" }}>
                Power: <strong>{tooltip.s.powerLevel ?? 3}</strong>
              </span>
              <span style={{ fontSize: "11px", background: "#f3f4f6", padding: "1px 6px", borderRadius: "4px" }}>
                Interest: <strong>{tooltip.s.interestLevel ?? 3}</strong>
              </span>
            </div>
            {tooltip.s.engagementStrategy && (
              <div style={{ fontSize: "11px", color: STRATEGY_COLORS[tooltip.s.engagementStrategy]?.text || "#374151", fontWeight: 600 }}>
                {tooltip.s.engagementStrategy}
              </div>
            )}
            {tooltip.s.organization && (
              <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>{tooltip.s.organization}</div>
            )}
          </div>
        )}
      </div>

      {/* Stakeholder list below the chart */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
        {stakeholders.map((s) => {
          const col = STRATEGY_COLORS[s.engagementStrategy || ""] || DEFAULT_COLOR;
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "white" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: avatarColor(s.id), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "white", flexShrink: 0 }}>
                {(s.fullName || "?")[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.fullName}</div>
                <div style={{ fontSize: "9px", color: col.text, fontWeight: 600 }}>{s.engagementStrategy || "Unset"}</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: "9px", color: "#9ca3af", flexShrink: 0 }}>P{s.powerLevel ?? 3}/I{s.interestLevel ?? 3}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Communication Plan Table ─────────────────────────────────────────────────
function CommunicationPlan({ stakeholders }: { stakeholders: any[] }) {
  const withComms = stakeholders.filter(
    (s) => s.communicationFrequency || s.communicationChannel || s.communicationMessage
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Communication plan derived from stakeholder engagement settings. Edit stakeholders in the Stakeholder Register to update their communication details.
      </p>
      {withComms.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No communication plans defined"
          description="Edit stakeholders and fill in Communication Frequency, Channel, and Key Message fields to populate this plan."
        />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Stakeholder</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Key Message</TableHead>
                <TableHead>Responsible</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withComms.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{s.fullName}</p>
                      {s.position && <p className="text-xs text-muted-foreground">{s.position}</p>}
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
                    {s.engagementStrategy ? (
                      <Badge className={`text-xs border ${getEngagementColors(s.engagementStrategy)}`}>
                        {s.engagementStrategy}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{s.communicationFrequency || "—"}</TableCell>
                  <TableCell className="text-sm">{s.communicationChannel || "—"}</TableCell>
                  <TableCell className="text-sm max-w-[200px]">
                    <p className="truncate" title={s.communicationMessage || ""}>
                      {s.communicationMessage || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{s.communicationResponsible || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Engagement Summary ───────────────────────────────────────────────────────
function EngagementSummary({ stakeholders }: { stakeholders: any[] }) {
  const strategyCount = useMemo(() => {
    const counts: Record<string, number> = {
      "Manage Closely": 0,
      "Keep Satisfied": 0,
      "Keep Informed": 0,
      "Monitor": 0,
      "Not Set": 0,
    };
    stakeholders.forEach((s) => {
      const key = s.engagementStrategy || "Not Set";
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [stakeholders]);

  const total = stakeholders.length;
  const barColors: Record<string, string> = {
    "Manage Closely": "bg-red-500",
    "Keep Satisfied": "bg-orange-500",
    "Keep Informed": "bg-blue-500",
    "Monitor": "bg-gray-400",
    "Not Set": "bg-muted-foreground/30",
  };

  const internalCount = stakeholders.filter((s) => s.isInternalTeam).length;
  const externalCount = stakeholders.filter((s) => !s.isInternalTeam).length;
  const highPower = stakeholders.filter((s) => (s.powerLevel ?? 3) >= 3).length;
  const highInterest = stakeholders.filter((s) => (s.interestLevel ?? 3) >= 3).length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Stakeholders</p>
            <p className="text-3xl font-bold mt-1">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Internal Team</p>
            <p className="text-3xl font-bold mt-1 text-blue-600">{internalCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">High Power (≥3)</p>
            <p className="text-3xl font-bold mt-1 text-red-600">{highPower}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">High Interest (≥3)</p>
            <p className="text-3xl font-bold mt-1 text-primary">{highInterest}</p>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Engagement Strategy Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(strategyCount).map(([strategy, count]) => {
            if (count === 0) return null;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={strategy} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{strategy}</span>
                  <span className="text-muted-foreground">{count} ({pct}%)</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColors[strategy] || "bg-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Internal vs External breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Team Composition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                {total > 0 && (
                  <>
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${Math.round((internalCount / total) * 100)}%` }}
                    />
                    <div
                      className="h-full bg-purple-400 transition-all"
                      style={{ width: `${Math.round((externalCount / total) * 100)}%` }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-6 mt-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span>Internal: {internalCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-400" />
              <span>External: {externalCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Engagement Matrix (Drag-and-Drop Board) ─────────────────────────────────
const QUADRANTS_DEF = [
  { key: "Keep Satisfied",  label: "Keep Satisfied",  emoji: "😐", sub: "High Power · Low Interest",  bg: "#fff7ed", border: "#fb923c", headerColor: "#c2410c", badgeBg: "#ffedd5", badgeText: "#c2410c" },
  { key: "Manage Closely",  label: "Manage Closely",  emoji: "🎯", sub: "High Power · High Interest", bg: "#fef2f2", border: "#f87171", headerColor: "#b91c1c", badgeBg: "#fee2e2", badgeText: "#b91c1c" },
  { key: "Monitor",         label: "Monitor",         emoji: "👁",  sub: "Low Power · Low Interest",   bg: "#f9fafb", border: "#d1d5db", headerColor: "#4b5563", badgeBg: "#f3f4f6", badgeText: "#4b5563" },
  { key: "Keep Informed",   label: "Keep Informed",   emoji: "📢", sub: "Low Power · High Interest",  bg: "#eff6ff", border: "#60a5fa", headerColor: "#1d4ed8", badgeBg: "#dbeafe", badgeText: "#1d4ed8" },
];
const UNASSIGNED_KEY = "__unassigned__";
const MATRIX_AVATAR_COLORS: [string, string][] = [
  ["#f87171","#b91c1c"],["#fb923c","#c2410c"],["#fbbf24","#92400e"],
  ["#34d399","#065f46"],["#60a5fa","#1d4ed8"],["#a78bfa","#5b21b6"],
  ["#f472b6","#9d174d"],["#94a3b8","#334155"],
];
const matrixAvatarColor = (id: number) => MATRIX_AVATAR_COLORS[id % MATRIX_AVATAR_COLORS.length];

function MatrixCard({ s, onDrop }: { s: any; onDrop?: (id: number, strategy: string) => void }) {
  const [from, to] = matrixAvatarColor(s.id);
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("stakeholderId", String(s.id));
        e.dataTransfer.effectAllowed = "move";
      }}
      style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "10px", cursor: "grab", userSelect: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", transition: "box-shadow 0.15s, transform 0.15s" }}
      className="hover:shadow-lg hover:-translate-y-0.5 active:cursor-grabbing w-full"
      title={`${s.fullName}${s.position ? ` — ${s.position}` : ""}\nDrag to change engagement strategy`}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `linear-gradient(135deg, ${from}, ${to})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "white", flexShrink: 0 }}>
          {s.fullName?.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.fullName}</div>
          {s.position && <div style={{ fontSize: "10px", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.position}</div>}
        </div>
        <div style={{ marginLeft: "auto", flexShrink: 0, fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "4px", background: "#f3f4f6", color: "#374151" }}>
          P{s.powerLevel ?? 3}/I{s.interestLevel ?? 3}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "9px", color: "#9ca3af", width: "36px", flexShrink: 0 }}>Power</span>
          <div style={{ flex: 1, height: "4px", background: "#f3f4f6", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#f97316", borderRadius: "2px", width: `${((s.powerLevel ?? 3) / 5) * 100}%` }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "9px", color: "#9ca3af", width: "36px", flexShrink: 0 }}>Interest</span>
          <div style={{ flex: 1, height: "4px", background: "#f3f4f6", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#3b82f6", borderRadius: "2px", width: `${((s.interestLevel ?? 3) / 5) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EngagementMatrix({ stakeholders, onStrategyChange }: { stakeholders: any[]; onStrategyChange: (id: number, strategy: string) => void }) {
  const [dragOverQuadrant, setDragOverQuadrant] = useState<string | null>(null);
  const assignedKeys = new Set(QUADRANTS_DEF.map(q => q.key));
  const unassigned = stakeholders.filter(s => !s.engagementStrategy || !assignedKeys.has(s.engagementStrategy));

  const handleDrop = (e: React.DragEvent, strategy: string) => {
    e.preventDefault();
    setDragOverQuadrant(null);
    const id = parseInt(e.dataTransfer.getData("stakeholderId"));
    if (!id) return;
    onStrategyChange(id, strategy);
  };

  return (
    <div className="space-y-4">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <p style={{ fontSize: "12px", color: "#6b7280" }}>Drag stakeholder cards between quadrants to change their engagement strategy. Drop on the <strong>Unassigned</strong> pool to clear.</p>
        {unassigned.length > 0 && (
          <span style={{ fontSize: "10px", background: "#fef9c3", color: "#854d0e", padding: "2px 8px", borderRadius: "999px", fontWeight: 600 }}>{unassigned.length} unassigned</span>
        )}
      </div>

      {/* 2×2 Grid */}
      <div style={{ display: "flex", gap: "0" }}>
        {/* Y-axis label */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "24px", flexShrink: 0, gap: "4px" }}>
          <span style={{ fontSize: "9px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em", writingMode: "vertical-rl", transform: "rotate(180deg)", textTransform: "uppercase" }}>POWER ↑</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "4px" }}>
            {[QUADRANTS_DEF[0], QUADRANTS_DEF[1]].map(q => (
              <div key={q.key}
                style={{ background: q.bg, border: `2px solid ${dragOverQuadrant === q.key ? "#6d28d9" : q.border}`, borderRadius: "12px", padding: "12px", minHeight: "180px", transition: "all 0.15s", boxShadow: dragOverQuadrant === q.key ? "0 0 0 3px rgba(109,40,217,0.2), 0 4px 12px rgba(0,0,0,0.1)" : "none", transform: dragOverQuadrant === q.key ? "scale(1.01)" : "scale(1)" }}
                onDragOver={(e) => { e.preventDefault(); setDragOverQuadrant(q.key); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverQuadrant(null); }}
                onDrop={(e) => handleDrop(e, q.key)}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "14px" }}>{q.emoji}</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: q.headerColor }}>{q.label}</span>
                    </div>
                    <div style={{ fontSize: "10px", color: "#6b7280" }}>{q.sub}</div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, background: q.badgeBg, color: q.badgeText, padding: "1px 6px", borderRadius: "6px" }}>
                    {stakeholders.filter(s => s.engagementStrategy === q.key).length}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {stakeholders.filter(s => s.engagementStrategy === q.key).map(s => <MatrixCard key={s.id} s={s} />)}
                  {stakeholders.filter(s => s.engagementStrategy === q.key).length === 0 && (
                    <div style={{ border: `2px dashed ${dragOverQuadrant === q.key ? "#6d28d9" : "#d1d5db"}`, borderRadius: "8px", padding: "16px", textAlign: "center", fontSize: "11px", color: "#9ca3af", background: dragOverQuadrant === q.key ? "rgba(109,40,217,0.04)" : "transparent", transition: "all 0.15s" }}>Drop here</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {[QUADRANTS_DEF[2], QUADRANTS_DEF[3]].map(q => (
              <div key={q.key}
                style={{ background: q.bg, border: `2px solid ${dragOverQuadrant === q.key ? "#6d28d9" : q.border}`, borderRadius: "12px", padding: "12px", minHeight: "180px", transition: "all 0.15s", boxShadow: dragOverQuadrant === q.key ? "0 0 0 3px rgba(109,40,217,0.2), 0 4px 12px rgba(0,0,0,0.1)" : "none", transform: dragOverQuadrant === q.key ? "scale(1.01)" : "scale(1)" }}
                onDragOver={(e) => { e.preventDefault(); setDragOverQuadrant(q.key); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverQuadrant(null); }}
                onDrop={(e) => handleDrop(e, q.key)}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "14px" }}>{q.emoji}</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: q.headerColor }}>{q.label}</span>
                    </div>
                    <div style={{ fontSize: "10px", color: "#6b7280" }}>{q.sub}</div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, background: q.badgeBg, color: q.badgeText, padding: "1px 6px", borderRadius: "6px" }}>
                    {stakeholders.filter(s => s.engagementStrategy === q.key).length}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {stakeholders.filter(s => s.engagementStrategy === q.key).map(s => <MatrixCard key={s.id} s={s} />)}
                  {stakeholders.filter(s => s.engagementStrategy === q.key).length === 0 && (
                    <div style={{ border: `2px dashed ${dragOverQuadrant === q.key ? "#6d28d9" : "#d1d5db"}`, borderRadius: "8px", padding: "16px", textAlign: "center", fontSize: "11px", color: "#9ca3af", background: dragOverQuadrant === q.key ? "rgba(109,40,217,0.04)" : "transparent", transition: "all 0.15s" }}>Drop here</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* X-axis label */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px 0", fontSize: "10px", color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em" }}>
            <span>← LOW INTEREST</span>
            <span>HIGH INTEREST →</span>
          </div>
        </div>
      </div>

      {/* Unassigned Pool */}
      <div
        style={{ border: `2px dashed ${dragOverQuadrant === UNASSIGNED_KEY ? "#6d28d9" : "#d1d5db"}`, borderRadius: "12px", padding: "12px", background: dragOverQuadrant === UNASSIGNED_KEY ? "rgba(109,40,217,0.04)" : "#f9fafb", transition: "all 0.15s", boxShadow: dragOverQuadrant === UNASSIGNED_KEY ? "0 0 0 3px rgba(109,40,217,0.15)" : "none" }}
        onDragOver={(e) => { e.preventDefault(); setDragOverQuadrant(UNASSIGNED_KEY); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverQuadrant(null); }}
        onDrop={(e) => { e.preventDefault(); setDragOverQuadrant(null); const id = parseInt(e.dataTransfer.getData("stakeholderId")); if (!id) return; onStrategyChange(id, ""); }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#6b7280" }}>Unassigned Pool</span>
          <span style={{ fontSize: "10px", background: "#e5e7eb", color: "#374151", padding: "1px 6px", borderRadius: "999px", fontWeight: 600 }}>{unassigned.length}</span>
          <span style={{ fontSize: "10px", color: "#9ca3af", marginLeft: "auto" }}>Drag here to remove from matrix</span>
        </div>
        {unassigned.length === 0 ? (
          <div style={{ fontSize: "11px", color: "#9ca3af", textAlign: "center", padding: "8px", fontStyle: "italic" }}>All stakeholders are assigned to a quadrant</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px" }}>
            {unassigned.map(s => <MatrixCard key={s.id} s={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Relationships() {
  const { currentProjectId } = useProject();
  const utils = trpc.useUtils();

  const { data: stakeholders = [], isLoading } = trpc.stakeholders.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const updateMutation = trpc.stakeholders.update.useMutation({
    onSuccess: () => {
      utils.stakeholders.list.invalidate({ projectId: currentProjectId! });
      toast.success("Engagement strategy updated");
    },
    onError: () => toast.error("Failed to update strategy"),
  });

  const handleStrategyChange = (id: number, strategy: string) => {
    updateMutation.mutate({ id, data: { engagementStrategy: strategy || null } });
  };

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
            <Map className="w-6 h-6 text-primary" />
            Stakeholder Engagement Map
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visual bubble map of stakeholder positions, communication plan, and engagement analytics.
            Drag-and-drop matrix, bubble map, communication plan, and engagement analytics for all stakeholders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{stakeholders.length} Stakeholders</Badge>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            {stakeholders.filter((s) => s.isInternalTeam).length} Internal
          </Badge>
        </div>
      </div>

      {stakeholders.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No stakeholders found"
          description="Add stakeholders in the Stakeholder Register first, then set their Power and Interest levels to see the engagement map."
        />
      ) : (
        <Tabs defaultValue="bubble">
          <TabsList>
            <TabsTrigger value="matrix" className="gap-2">
              <LayoutGrid className="h-4 w-4" /> Engagement Matrix
            </TabsTrigger>
            <TabsTrigger value="bubble" className="gap-2">
              <Map className="h-4 w-4" /> Bubble Map
            </TabsTrigger>
            <TabsTrigger value="comms" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Communication Plan
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2">
              <BarChart2 className="h-4 w-4" /> Engagement Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matrix" className="mt-4">
            <EngagementMatrix stakeholders={stakeholders} onStrategyChange={handleStrategyChange} />
          </TabsContent>

          <TabsContent value="bubble" className="mt-4">
            <div className="relative">
              <BubbleMap stakeholders={stakeholders} />
            </div>
          </TabsContent>

          <TabsContent value="comms" className="mt-4">
            <CommunicationPlan stakeholders={stakeholders} />
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <EngagementSummary stakeholders={stakeholders} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
