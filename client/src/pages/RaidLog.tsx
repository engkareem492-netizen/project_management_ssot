import { useMemo, useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShieldAlert, Link2, AlertTriangle, FileCheck, Search } from "lucide-react";
import { useLocation } from "wouter";

type RaidType = "Risk" | "Assumption" | "Issue" | "Dependency";

const TYPE_COLORS: Record<RaidType, string> = {
  Risk: "bg-red-100 text-red-800",
  Assumption: "bg-blue-100 text-blue-800",
  Issue: "bg-orange-100 text-orange-800",
  Dependency: "bg-purple-100 text-purple-800",
};

const TYPE_ICONS: Record<RaidType, React.ElementType> = {
  Risk: ShieldAlert,
  Assumption: FileCheck,
  Issue: AlertTriangle,
  Dependency: Link2,
};

function getPriorityBadge(priority: string) {
  const colors: Record<string, string> = {
    Critical: "bg-red-600 text-white",
    High: "bg-red-100 text-red-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Low: "bg-gray-100 text-gray-700",
  };
  return colors[priority] ?? "bg-gray-100 text-gray-700";
}

export default function RaidLog() {
  const { currentProjectId } = useProject();
  const [, navigate] = useLocation();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: risks = [], isLoading: r } = trpc.risks.list.useQuery({ projectId }, { enabled });
  const { data: assumptions = [], isLoading: a } = trpc.assumptions?.list?.useQuery?.({ projectId }, { enabled }) ?? { data: [], isLoading: false };
  const { data: issues = [], isLoading: i } = trpc.issues.list.useQuery({ projectId }, { enabled });
  const { data: dependencies = [], isLoading: d } = trpc.dependencies?.list?.useQuery?.({ projectId }, { enabled }) ?? { data: [], isLoading: false };

  const isLoading = r || a || i || d;

  const raidItems = useMemo(() => {
    const items: any[] = [];

    risks.forEach((risk: any) => items.push({
      id: `risk-${risk.id}`, type: "Risk" as RaidType,
      idCode: risk.riskId, title: risk.title,
      status: risk.status ?? "Open",
      priority: risk.score >= 15 ? "Critical" : risk.score >= 9 ? "High" : risk.score >= 4 ? "Medium" : "Low",
      owner: risk.riskOwner ?? "—",
      dueDate: null,
      notes: `Impact: ${risk.impact ?? "—"} | Prob: ${risk.probability ?? "—"}`,
      href: "/risk-register",
    }));

    assumptions.forEach((a: any) => items.push({
      id: `assumption-${a.id}`, type: "Assumption" as RaidType,
      idCode: a.assumptionId, title: a.description,
      status: a.status ?? "Open",
      priority: "Medium",
      owner: a.owner ?? "—",
      dueDate: null,
      notes: a.notes ?? "",
      href: "/assumptions",
    }));

    issues.forEach((issue: any) => items.push({
      id: `issue-${issue.id}`, type: "Issue" as RaidType,
      idCode: issue.issueId, title: issue.description,
      status: issue.status ?? "Open",
      priority: issue.priority ?? "Medium",
      owner: issue.owner ?? "—",
      dueDate: issue.dueDate ?? null,
      notes: issue.type ?? "",
      href: "/issues",
    }));

    dependencies.forEach((dep: any) => items.push({
      id: `dep-${dep.id}`, type: "Dependency" as RaidType,
      idCode: dep.dependencyId, title: dep.description ?? dep.dependencyId,
      status: dep.status ?? "Open",
      priority: "Medium",
      owner: dep.owner ?? "—",
      dueDate: dep.dueDate ?? null,
      notes: dep.type ?? "",
      href: "/dependencies",
    }));

    return items;
  }, [risks, assumptions, issues, dependencies]);

  const filtered = useMemo(() => raidItems.filter(item => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (search && !item.title?.toLowerCase().includes(search.toLowerCase()) &&
        !item.idCode?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [raidItems, typeFilter, statusFilter, search]);

  const summary = useMemo(() => ({
    risks: risks.length,
    assumptions: assumptions.length,
    issues: issues.filter((i: any) => i.status !== "Closed" && i.status !== "Resolved").length,
    dependencies: dependencies.length,
    open: raidItems.filter(i => !["Closed", "Resolved", "Mitigated", "Done"].includes(i.status)).length,
  }), [raidItems, risks, assumptions, issues, dependencies]);

  if (!currentProjectId) return <div className="p-6 text-muted-foreground">Select a project to view the RAID log.</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-6 h-6" /> RAID Log
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Consolidated view: Risks · Assumptions · Issues · Dependencies</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Risks", value: summary.risks, icon: ShieldAlert, color: "text-red-600" },
          { label: "Assumptions", value: summary.assumptions, icon: FileCheck, color: "text-blue-600" },
          { label: "Issues (Open)", value: summary.issues, icon: AlertTriangle, color: "text-orange-600" },
          { label: "Dependencies", value: summary.dependencies, icon: Link2, color: "text-purple-600" },
          { label: "Total Open", value: summary.open, icon: ShieldAlert, color: "text-foreground" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {["Risk", "Assumption", "Issue", "Dependency"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["Open", "In Progress", "Closed", "Resolved", "Mitigated", "Deferred"].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Title / Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">No items match your filters.</TableCell>
                </TableRow>
              ) : (
                filtered.map(item => {
                  const Icon = (TYPE_ICONS as Record<string, React.ElementType>)[item.type] ?? ShieldAlert;
                  return (
                    <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(item.href)}>
                      <TableCell>
                        <Badge className={`${(TYPE_COLORS as Record<string, string>)[item.type] ?? "bg-gray-100 text-gray-700"} border-0 flex items-center gap-1 w-fit`}>
                          <Icon className="w-3 h-3" />{item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{item.idCode}</TableCell>
                      <TableCell className="max-w-xs truncate font-medium">{item.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadge(item.priority) + " border-0"}>{item.priority}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.owner}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-32 truncate">{item.notes}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <div className="px-4 py-2 border-t text-xs text-muted-foreground">
            Showing {filtered.length} of {raidItems.length} items. Click a row to navigate to the source module.
          </div>
        </Card>
      )}
    </div>
  );
}
