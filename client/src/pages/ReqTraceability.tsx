import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Network, ChevronDown, ChevronRight, Search, CheckCircle2, XCircle,
  AlertCircle, Clock, FileText, Bug, FlaskConical, BookOpen, Layers,
  ChevronUp, Filter,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── Status colour helpers ─────────────────────────────────────────────────────
const STATUS_COLOURS: Record<string, string> = {
  "Done": "bg-green-100 text-green-800 border-green-200",
  "Completed": "bg-green-100 text-green-800 border-green-200",
  "Passed": "bg-green-100 text-green-800 border-green-200",
  "Approved": "bg-green-100 text-green-800 border-green-200",
  "Closed": "bg-gray-100 text-gray-600 border-gray-200",
  "Released": "bg-green-100 text-green-800 border-green-200",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
  "Active": "bg-blue-100 text-blue-800 border-blue-200",
  "Under Review": "bg-blue-100 text-blue-800 border-blue-200",
  "Open": "bg-amber-100 text-amber-800 border-amber-200",
  "Backlog": "bg-amber-100 text-amber-800 border-amber-200",
  "Draft": "bg-gray-100 text-gray-700 border-gray-200",
  "Not Executed": "bg-gray-100 text-gray-700 border-gray-200",
  "Failed": "bg-red-100 text-red-800 border-red-200",
  "Rejected": "bg-red-100 text-red-800 border-red-200",
};

function StatusBadge({ status }: { status: string | null | undefined }) {
  const cls = STATUS_COLOURS[status ?? ""] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium border ${cls}`}>
      {status ?? "—"}
    </span>
  );
}

function SeverityDot({ severity }: { severity: string | null | undefined }) {
  const map: Record<string, string> = {
    Critical: "bg-red-500",
    High: "bg-orange-500",
    Medium: "bg-yellow-500",
    Low: "bg-green-500",
  };
  const col = map[severity ?? ""] ?? "bg-gray-400";
  return <span className={`inline-block w-2 h-2 rounded-full ${col} mr-1`} title={severity ?? "—"} />;
}

function ChainRow({
  icon, label, code, title, status, extra, depth = 0, colour,
}: {
  icon: React.ReactNode; label: string; code: string; title: string;
  status?: string | null; extra?: React.ReactNode; depth?: number; colour: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 py-2 px-3 rounded-lg border ${colour} text-sm`}
      style={{ marginLeft: depth * 20 }}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-semibold opacity-70">{code}</span>
          <span className="font-medium truncate">{title}</span>
          {status && <StatusBadge status={status} />}
          {extra}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}

function CoverageBar({ covered, total, label }: { covered: number; total: number; label: string }) {
  const pct = total > 0 ? Math.round((covered / total) * 100) : 0;
  const colour = pct === 100 ? "bg-green-500" : pct > 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${colour}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-medium w-12 text-right">{covered}/{total}</span>
    </div>
  );
}

export default function ReqTraceability() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  const { data: chains = [], isLoading } = trpc.reqTraceability.chain.useQuery(
    { projectId }, { enabled: !!projectId }
  );

  const filtered = useMemo(() => {
    return chains.filter((c) => {
      const matchSearch =
        !search ||
        c.req.idCode?.toLowerCase().includes(search.toLowerCase()) ||
        c.req.description?.toLowerCase().includes(search.toLowerCase());
      const score =
        (c.summary.featureCount > 0 ? 1 : 0) +
        (c.summary.storyCount > 0 ? 1 : 0) +
        (c.summary.testTotal > 0 ? 1 : 0);
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "covered" && score === 3) ||
        (filterStatus === "partial" && score > 0 && score < 3) ||
        (filterStatus === "uncovered" && score === 0);
      return matchSearch && matchStatus;
    });
  }, [chains, search, filterStatus]);

  const stats = useMemo(() => ({
    total: chains.length,
    covered: chains.filter((c) => c.summary.featureCount > 0 && c.summary.storyCount > 0 && c.summary.testTotal > 0).length,
    partial: chains.filter((c) => {
      const s = (c.summary.featureCount > 0 ? 1 : 0) + (c.summary.storyCount > 0 ? 1 : 0) + (c.summary.testTotal > 0 ? 1 : 0);
      return s > 0 && s < 3;
    }).length,
    uncovered: chains.filter((c) => c.summary.featureCount === 0 && c.summary.storyCount === 0 && c.summary.testTotal === 0).length,
    withDefects: chains.filter((c) => c.summary.openDefects > 0).length,
  }), [chains]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => {
    if (allExpanded) {
      setExpanded(new Set());
      setAllExpanded(false);
    } else {
      setExpanded(new Set(filtered.map((c) => c.req.id)));
      setAllExpanded(true);
    }
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Network className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a project to view the traceability chain.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Network className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Requirements Traceability</h1>
            <p className="text-sm text-muted-foreground">
              Full chain: Requirement → Feature → User Story → Test Case → Defect
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          {[
            { label: "Total Reqs", value: stats.total, icon: <FileText className="w-4 h-4" />, colour: "border-gray-200 bg-gray-50" },
            { label: "Fully Covered", value: stats.covered, icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, colour: "border-green-200 bg-green-50" },
            { label: "Partially Covered", value: stats.partial, icon: <AlertCircle className="w-4 h-4 text-amber-600" />, colour: "border-amber-200 bg-amber-50" },
            { label: "Uncovered", value: stats.uncovered, icon: <XCircle className="w-4 h-4 text-red-600" />, colour: "border-red-200 bg-red-50" },
            { label: "Open Defects", value: stats.withDefects, icon: <Bug className="w-4 h-4 text-red-600" />, colour: "border-red-200 bg-red-50" },
          ].map((s) => (
            <div key={s.label} className={`flex items-center gap-3 p-3 rounded-lg border ${s.colour}`}>
              {s.icon}
              <div>
                <div className="text-xl font-bold leading-none">{s.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search requirements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44 h-9">
              <Filter className="w-3.5 h-3.5 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requirements</SelectItem>
              <SelectItem value="covered">Fully Covered</SelectItem>
              <SelectItem value="partial">Partially Covered</SelectItem>
              <SelectItem value="uncovered">Uncovered</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExpandAll} className="h-9">
            {allExpanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
            {allExpanded ? "Collapse All" : "Expand All"}
          </Button>
        </div>
      </div>

      {/* Chain list */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Clock className="w-5 h-5 animate-spin mr-2" />
              Loading traceability chain...
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Network className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No requirements match your filter.</p>
            </div>
          )}

          {filtered.map((chain) => {
            const isExpanded = expanded.has(chain.req.id);
            const { req, features, userStories, testCases, defects: chainDefects, summary } = chain;
            const score =
              (summary.featureCount > 0 ? 1 : 0) +
              (summary.storyCount > 0 ? 1 : 0) +
              (summary.testTotal > 0 ? 1 : 0);

            const coverageColour =
              score === 3
                ? "border-green-200 bg-green-50/50"
                : score > 0
                ? "border-amber-200 bg-amber-50/50"
                : "border-red-200 bg-red-50/50";

            const coverageIcon =
              score === 3 ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              ) : score > 0 ? (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              );

            return (
              <Collapsible key={req.id} open={isExpanded} onOpenChange={() => toggleExpand(req.id)}>
                <div className={`rounded-xl border ${coverageColour} overflow-hidden`}>
                  {/* Requirement header */}
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-black/5 transition-colors select-none">
                      {coverageIcon}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-primary">{req.idCode}</span>
                          <span className="font-medium text-sm truncate">{req.description}</span>
                          <StatusBadge status={req.status} />
                          {req.priority && (
                            <span className="text-[11px] text-muted-foreground border rounded px-1.5 py-0.5">
                              {req.priority}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${summary.featureCount > 0 ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>
                            {summary.featureCount} feature{summary.featureCount !== 1 ? "s" : ""}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${summary.storyCount > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                            {summary.storyCount} user stor{summary.storyCount !== 1 ? "ies" : "y"}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${summary.testTotal > 0 ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                            {summary.testTotal} test case{summary.testTotal !== 1 ? "s" : ""}
                            {summary.testCoverage !== null ? ` · ${summary.testCoverage}% pass` : ""}
                          </span>
                          {summary.defectCount > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${summary.openDefects > 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
                              {summary.defectCount} defect{summary.defectCount !== 1 ? "s" : ""}
                              {summary.openDefects > 0 ? ` (${summary.openDefects} open)` : " (all closed)"}
                            </span>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </CollapsibleTrigger>

                  {/* Chain detail */}
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-2 border-t pt-3">
                      {/* Features */}
                      {features.length === 0 ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground italic pl-2">
                          <Layers className="w-3.5 h-3.5" /> No features linked
                        </div>
                      ) : features.map((f) => (
                        <ChainRow
                          key={`f-${f.id}`}
                          icon={<Layers className="w-3.5 h-3.5 text-purple-600" />}
                          label="Feature"
                          code={f.featureCode ?? `FT-${f.id}`}
                          title={f.title}
                          status={f.status}
                          colour="border-purple-100 bg-purple-50/50"
                          depth={1}
                        />
                      ))}

                      {/* User Stories */}
                      {userStories.length === 0 ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground italic pl-8">
                          <BookOpen className="w-3.5 h-3.5" /> No user stories linked
                        </div>
                      ) : userStories.map((us) => (
                        <ChainRow
                          key={`us-${us.id}`}
                          icon={<BookOpen className="w-3.5 h-3.5 text-blue-600" />}
                          label="User Story"
                          code={us.storyCode ?? `US-${us.id}`}
                          title={us.title}
                          status={us.status}
                          extra={us.storyPoints ? (
                            <span className="text-[10px] border rounded px-1.5 py-0.5 text-muted-foreground">
                              {us.storyPoints} pts
                            </span>
                          ) : undefined}
                          colour="border-blue-100 bg-blue-50/50"
                          depth={2}
                        />
                      ))}

                      {/* Test Cases */}
                      {testCases.length === 0 ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground italic pl-14">
                          <FlaskConical className="w-3.5 h-3.5" /> No test cases linked
                        </div>
                      ) : testCases.map((tc) => (
                        <ChainRow
                          key={`tc-${tc.id}`}
                          icon={<FlaskConical className="w-3.5 h-3.5 text-teal-600" />}
                          label="Test Case"
                          code={tc.testId ?? `TC-${tc.id}`}
                          title={tc.title}
                          status={tc.status}
                          extra={tc.priority ? (
                            <span className="text-[10px] border rounded px-1.5 py-0.5 text-muted-foreground">
                              {tc.priority}
                            </span>
                          ) : undefined}
                          colour="border-teal-100 bg-teal-50/50"
                          depth={3}
                        />
                      ))}

                      {/* Defects */}
                      {chainDefects.length > 0 && (
                        <>
                          <Separator className="my-1" />
                          {chainDefects.map((d) => (
                            <ChainRow
                              key={`d-${d.id}`}
                              icon={<Bug className="w-3.5 h-3.5 text-red-600" />}
                              label="Defect"
                              code={d.defectCode ?? `DF-${d.id}`}
                              title={d.title}
                              status={d.status}
                              extra={<SeverityDot severity={d.severity} />}
                              colour={
                                d.status === "Closed" || d.status === "Fixed" || d.status === "Verified"
                                  ? "border-gray-200 bg-gray-50"
                                  : "border-red-100 bg-red-50/50"
                              }
                              depth={4}
                            />
                          ))}
                        </>
                      )}

                      {/* Coverage summary */}
                      <div className="mt-3 pt-3 border-t space-y-1.5">
                        <CoverageBar covered={summary.featureCount > 0 ? 1 : 0} total={1} label="Feature coverage" />
                        <CoverageBar covered={summary.storyCount > 0 ? 1 : 0} total={1} label="Story coverage" />
                        <CoverageBar
                          covered={summary.testPassed}
                          total={summary.testTotal || 1}
                          label="Test pass rate"
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
