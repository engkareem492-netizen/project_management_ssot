import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Network, ChevronDown, ChevronRight, Search, CheckCircle2, XCircle, AlertCircle, Clock, FileText, Bug, FlaskConical, GitPullRequest, BookOpen } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  "Done": "bg-green-100 text-green-800",
  "Completed": "bg-green-100 text-green-800",
  "Passed": "bg-green-100 text-green-800",
  "Approved": "bg-green-100 text-green-800",
  "Closed": "bg-gray-100 text-gray-600",
  "In Progress": "bg-blue-100 text-blue-800",
  "Under Review": "bg-blue-100 text-blue-800",
  "Open": "bg-amber-100 text-amber-800",
  "Submitted": "bg-amber-100 text-amber-800",
  "Failed": "bg-red-100 text-red-800",
  "Rejected": "bg-red-100 text-red-800",
};

function StatusBadge({ status }: { status: string | null | undefined }) {
  const cls = STATUS_BADGE[status ?? ""] ?? "bg-gray-100 text-gray-600";
  return <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{status ?? "—"}</span>;
}

function CountBadge({ count, label, icon, color }: { count: number; label: string; icon: React.ReactNode; color: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm ${color}`}>
      {icon}
      <span className="font-semibold">{count}</span>
      <span className="text-xs opacity-80">{label}</span>
    </div>
  );
}

export default function TraceabilityMatrix() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data: matrix = [], isLoading } = trpc.traceability.matrix.useQuery({ projectId }, { enabled: !!projectId });

  const filtered = matrix.filter((row) =>
    !search ||
    row.requirement.idCode?.toLowerCase().includes(search.toLowerCase()) ||
    row.requirement.description?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(filtered.map((r) => r.requirement.idCode ?? "")));
  const collapseAll = () => setExpanded(new Set());

  // Summary stats
  const totalReqs = matrix.length;
  const coveredReqs = matrix.filter((r) => r.summary.testTotal > 0).length;
  const totalTests = matrix.reduce((s, r) => s + r.summary.testTotal, 0);
  const passedTests = matrix.reduce((s, r) => s + r.summary.testPassed, 0);
  const openIssues = matrix.reduce((s, r) => s + r.summary.openIssues, 0);
  const openTasks = matrix.reduce((s, r) => s + r.summary.openTasks, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Network className="w-6 h-6 text-gray-500" />
              Traceability Matrix
            </h1>
            <p className="text-gray-500 text-sm mt-1">End-to-end traceability from Requirements → Tasks → Issues → Test Cases → Change Requests → Decisions</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CountBadge count={totalReqs} label="Requirements" icon={<BookOpen className="w-4 h-4" />} color="bg-teal-50 border-teal-200 text-teal-700" />
            <CountBadge count={coveredReqs} label="With Tests" icon={<FlaskConical className="w-4 h-4" />} color="bg-blue-50 border-blue-200 text-blue-700" />
            <CountBadge count={openIssues} label="Open Issues" icon={<Bug className="w-4 h-4" />} color="bg-amber-50 border-amber-200 text-amber-700" />
            <CountBadge count={openTasks} label="Open Tasks" icon={<Clock className="w-4 h-4" />} color="bg-purple-50 border-purple-200 text-purple-700" />
          </div>
        </div>

        {/* Overall test coverage */}
        {totalTests > 0 && (
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-teal-700 font-medium">Overall Test Coverage:</span>
            <div className="flex-1 max-w-xs">
              <Progress value={totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0} className="h-2" />
            </div>
            <span className="text-sm font-semibold text-teal-800">{totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}% Passed ({passedTests}/{totalTests})</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search requirements..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={expandAll}>Expand All</Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>Collapse All</Button>
      </div>

      {/* Matrix Rows */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading traceability data...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Network className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No requirements found. Add requirements to build the traceability matrix.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const reqId = row.requirement.idCode ?? String(row.requirement.id);
            const isOpen = expanded.has(reqId);
            const { summary } = row;

            return (
              <Collapsible key={reqId} open={isOpen} onOpenChange={() => toggleExpand(reqId)}>
                <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                  {/* Requirement header */}
                  <CollapsibleTrigger asChild>
                    <div className="flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="mt-0.5 text-teal-600">
                        {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-teal-700 text-sm">{reqId}</span>
                          <StatusBadge status={row.requirement.status} />
                          {row.requirement.priority && <Badge variant="outline" className="text-xs">{row.requirement.priority}</Badge>}
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{row.requirement.description ?? "—"}</p>
                      </div>
                      {/* Summary chips */}
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <div className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded">
                          <Clock className="w-3 h-3" />{summary.taskCount} tasks ({summary.openTasks} open)
                        </div>
                        <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                          <Bug className="w-3 h-3" />{summary.issueCount} issues ({summary.openIssues} open)
                        </div>
                        <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                          <FlaskConical className="w-3 h-3" />{summary.testTotal} tests
                          {summary.testTotal > 0 && <span className="ml-1 font-semibold">{summary.testCoverage}%✓</span>}
                        </div>
                        {summary.crCount > 0 && (
                          <div className="flex items-center gap-1 text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
                            <GitPullRequest className="w-3 h-3" />{summary.crCount} CRs
                          </div>
                        )}
                        {summary.decisionCount > 0 && (
                          <div className="flex items-center gap-1 text-xs text-teal-700 bg-teal-50 px-2 py-1 rounded">
                            <FileText className="w-3 h-3" />{summary.decisionCount} decisions
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* Expanded detail */}
                  <CollapsibleContent>
                    <div className="border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x">
                      {/* Tasks */}
                      <div className="p-4">
                        <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> Tasks ({row.tasks.length})
                        </h4>
                        {row.tasks.length === 0 ? <p className="text-xs text-muted-foreground italic">No linked tasks</p> : (
                          <div className="space-y-2">
                            {row.tasks.map((t) => (
                              <div key={t.taskId} className="flex items-start gap-2">
                                <span className="font-mono text-xs text-purple-600 shrink-0">{t.taskId}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-600 truncate">{t.description?.slice(0, 50)}</p>
                                  <StatusBadge status={t.status} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Issues */}
                      <div className="p-4">
                        <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <Bug className="w-3.5 h-3.5" /> Issues ({row.issues.length})
                        </h4>
                        {row.issues.length === 0 ? <p className="text-xs text-muted-foreground italic">No linked issues</p> : (
                          <div className="space-y-2">
                            {row.issues.map((i) => (
                              <div key={i.issueId} className="flex items-start gap-2">
                                <span className="font-mono text-xs text-amber-600 shrink-0">{i.issueId}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-600 truncate">{i.description?.slice(0, 50)}</p>
                                  <StatusBadge status={i.status} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Test Cases */}
                      <div className="p-4">
                        <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5" /> Test Cases ({row.testCases.length})
                        </h4>
                        {row.testCases.length === 0 ? <p className="text-xs text-muted-foreground italic">No test cases linked</p> : (
                          <div className="space-y-2">
                            {row.testCases.map((tc) => (
                              <div key={tc.testId} className="flex items-start gap-2">
                                {tc.status === "Passed" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" /> :
                                  tc.status === "Failed" ? <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" /> :
                                  <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />}
                                <div className="flex-1 min-w-0">
                                  <span className="font-mono text-xs text-blue-600">{tc.testId}</span>
                                  <p className="text-xs text-gray-600 truncate">{tc.title?.slice(0, 45)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {row.testCases.length > 0 && (
                          <div className="mt-3">
                            <Progress value={summary.testCoverage} className="h-1.5" />
                            <p className="text-xs text-muted-foreground mt-1">{summary.testCoverage}% pass rate ({summary.testPassed}/{summary.testTotal})</p>
                          </div>
                        )}
                      </div>

                      {/* CRs and Decisions */}
                      {(row.changeRequests.length > 0 || row.decisions.length > 0) && (
                        <div className="p-4 md:col-span-2 lg:col-span-3 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {row.changeRequests.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                  <GitPullRequest className="w-3.5 h-3.5" /> Change Requests ({row.changeRequests.length})
                                </h4>
                                <div className="space-y-1.5">
                                  {row.changeRequests.map((cr) => (
                                    <div key={cr.crId} className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-orange-600">{cr.crId}</span>
                                      <p className="text-xs text-gray-600 truncate flex-1">{cr.title?.slice(0, 50)}</p>
                                      <StatusBadge status={cr.status} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {row.decisions.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5" /> Decisions ({row.decisions.length})
                                </h4>
                                <div className="space-y-1.5">
                                  {row.decisions.map((d) => (
                                    <div key={d.decisionId} className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-teal-600">{d.decisionId}</span>
                                      <p className="text-xs text-gray-600 truncate flex-1">{d.title?.slice(0, 50)}</p>
                                      <StatusBadge status={d.status} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
