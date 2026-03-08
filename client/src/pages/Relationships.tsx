/**
 * Stakeholder Engagement Map
 * Repurposed from the old "Relationships" page.
 * Shows:
 *  1. Power/Interest Grid — 2×2 quadrant with stakeholder cards
 *  2. Communication Plan — table of all stakeholders with comms details
 *  3. Engagement Summary — distribution analytics
 */
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Map, MessageSquare, BarChart2,
  AlertTriangle, TrendingUp, Info, Eye,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

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

const QUADRANT_CONFIG = [
  {
    key: "manage-closely",
    label: "Manage Closely",
    subtitle: "High Power · High Interest",
    color: "border-red-200 bg-red-50/40",
    headerColor: "text-red-700",
    Icon: AlertTriangle,
  },
  {
    key: "keep-satisfied",
    label: "Keep Satisfied",
    subtitle: "High Power · Low Interest",
    color: "border-orange-200 bg-orange-50/40",
    headerColor: "text-orange-700",
    Icon: TrendingUp,
  },
  {
    key: "keep-informed",
    label: "Keep Informed",
    subtitle: "Low Power · High Interest",
    color: "border-blue-200 bg-blue-50/40",
    headerColor: "text-blue-700",
    Icon: Info,
  },
  {
    key: "monitor",
    label: "Monitor",
    subtitle: "Low Power · Low Interest",
    color: "border-gray-200 bg-gray-50/40",
    headerColor: "text-gray-600",
    Icon: Eye,
  },
];

function getQuadrant(s: any): string {
  const power = s.powerLevel ?? 3;
  const interest = s.interestLevel ?? 3;
  if (power >= 3 && interest >= 3) return "manage-closely";
  if (power >= 3 && interest < 3) return "keep-satisfied";
  if (power < 3 && interest >= 3) return "keep-informed";
  return "monitor";
}

// ─── Power/Interest Grid ──────────────────────────────────────────────────────
function PowerInterestGrid({ stakeholders }: { stakeholders: any[] }) {
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {
      "manage-closely": [],
      "keep-satisfied": [],
      "keep-informed": [],
      "monitor": [],
    };
    stakeholders.forEach((s) => {
      map[getQuadrant(s)].push(s);
    });
    return map;
  }, [stakeholders]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Each stakeholder is placed based on their <strong>Power</strong> (1–5) and <strong>Interest</strong> (1–5) levels. Set these values in the Stakeholder Register.
      </p>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {QUADRANT_CONFIG.map((q) => {
          const items = grouped[q.key] || [];
          return (
            <div key={q.key} className={`border-2 rounded-xl p-4 ${q.color} min-h-[180px]`}>
              <div className="flex items-center gap-2 mb-3">
                <q.Icon className={`h-4 w-4 ${q.headerColor}`} />
                <div>
                  <p className={`font-semibold text-sm ${q.headerColor}`}>{q.label}</p>
                  <p className="text-xs text-muted-foreground">{q.subtitle}</p>
                </div>
                <Badge variant="outline" className="ml-auto text-xs">{items.length}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No stakeholders in this quadrant</p>
                ) : (
                  items.map((s) => (
                    <div
                      key={s.id}
                      className="bg-white border rounded-lg px-2.5 py-1.5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <p className="text-xs font-medium leading-tight">{s.fullName}</p>
                      {s.position && <p className="text-[10px] text-muted-foreground">{s.position}</p>}
                      <div className="flex gap-1 mt-1">
                        <span className="text-[10px] bg-muted px-1 rounded">P:{s.powerLevel ?? "?"}</span>
                        <span className="text-[10px] bg-muted px-1 rounded">I:{s.interestLevel ?? "?"}</span>
                        {s.isInternalTeam && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">Int</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t pt-3">
        <span><strong>P</strong> = Power Level (1–5)</span>
        <span><strong>I</strong> = Interest Level (1–5)</span>
        <span><strong>Int</strong> = Internal Team Member</span>
        <span>Threshold: ≥3 = High, &lt;3 = Low</span>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Relationships() {
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
            <Map className="w-6 h-6 text-primary" />
            Stakeholder Engagement Map
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Power/Interest grid, communication plan, and engagement analytics for all stakeholders
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
        <Tabs defaultValue="grid">
          <TabsList>
            <TabsTrigger value="grid" className="gap-2">
              <Map className="h-4 w-4" /> Power/Interest Grid
            </TabsTrigger>
            <TabsTrigger value="comms" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Communication Plan
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2">
              <BarChart2 className="h-4 w-4" /> Engagement Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="mt-4">
            <PowerInterestGrid stakeholders={stakeholders} />
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
