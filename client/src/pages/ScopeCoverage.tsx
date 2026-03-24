/**
 * Scope Coverage Overview
 *
 * Bird's-eye view of scope coverage: for each scope item, shows how many
 * requirements, user stories, and issues are linked — and what is orphaned.
 *
 * Inspired by SAP Cloud ALM's scope item coverage dashboard.
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, Search, Layers, BookOpen, FileText, AlertTriangle,
  CheckCircle2, AlertCircle, Circle, ChevronDown, ChevronRight, RefreshCw, CheckSquare,
} from "lucide-react";
import { useLocation } from "wouter";
import { EmptyState } from "@/components/EmptyState";

// ─── Health badge ────────────────────────────────────────────────────────────

function HealthBadge({ health }: { health: string }) {
  if (health === "green")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Covered
      </span>
    );
  if (health === "yellow")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-300 px-2 py-0.5 rounded-full">
        <AlertCircle className="w-3 h-3" /> Partial
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 dark:bg-red-900/40 dark:text-red-300 px-2 py-0.5 rounded-full">
      <AlertTriangle className="w-3 h-3" /> Not Covered
    </span>
  );
}

// ─── Orphaned items panel ────────────────────────────────────────────────────

function OrphanedItems({
  requirements,
  userStories,
  issues,
}: {
  requirements: any[];
  userStories: any[];
  issues: any[];
}) {
  const [open, setOpen] = useState(false);
  const orphanedReqs = requirements.filter((r: any) => !r.scopeItemId);
  const orphanedStories = userStories.filter((s: any) => !s.scopeItemId);
  const orphanedIssues = issues.filter((i: any) => !i.scopeItemId);
  const total = orphanedReqs.length + orphanedStories.length + orphanedIssues.length;

  if (total === 0) return null;

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-2 pt-4 px-4">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setOpen(!open)}
        >
          <CardTitle className="text-base flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <AlertTriangle className="w-4 h-4" />
            {total} Unlinked Item{total !== 1 ? "s" : ""} (no Scope Item)
          </CardTitle>
          {open ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>
      {open && (
        <CardContent className="pt-0 pb-4 px-4 space-y-4">
          {orphanedReqs.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Requirements ({orphanedReqs.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {orphanedReqs.map((r: any) => (
                  <Badge key={r.id} variant="outline" className="font-mono text-xs">
                    {r.idCode}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {orphanedStories.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                User Stories ({orphanedStories.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {orphanedStories.map((s: any) => (
                  <Badge key={s.id} variant="outline" className="font-mono text-xs text-blue-600">
                    {s.storyId}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {orphanedIssues.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Issues ({orphanedIssues.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {orphanedIssues.map((i: any) => (
                  <Badge key={i.id} variant="outline" className="font-mono text-xs text-red-600">
                    {i.issueId}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Open these items and assign them to a Scope Item to improve coverage.
          </p>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ScopeCoverage() {
  const { currentProject } = useProject();
  const projectId = currentProject?.id;
  const [, navigate] = useLocation();

  const [search, setSearch] = useState("");
  const [filterHealth, setFilterHealth] = useState("all");

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: coverage = [], isLoading: loadingCoverage, refetch } = trpc.userStories.scopeCoverage.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data: requirements = [] } = trpc.requirements.list.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data: userStories = [] } = trpc.userStories.list.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data: issues = [] } = trpc.issues.list.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalScopes = coverage.length;
  const covered = coverage.filter((c) => c.health === "green").length;
  const partial = coverage.filter((c) => c.health === "yellow").length;
  const uncovered = coverage.filter((c) => c.health === "red").length;
  const coveragePct = totalScopes > 0 ? Math.round((covered / totalScopes) * 100) : 0;

  // ── Filtered rows ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return coverage.filter((row) => {
      const matchSearch =
        !search ||
        row.scopeItem.name.toLowerCase().includes(search.toLowerCase()) ||
        row.scopeItem.idCode.toLowerCase().includes(search.toLowerCase());
      const matchHealth = filterHealth === "all" || row.health === filterHealth;
      return matchSearch && matchHealth;
    });
  }, [coverage, search, filterHealth]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Scope Coverage
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bird's-eye view of requirements, user stories, and issues per scope item
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* KPI summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="py-3 px-4">
          <p className="text-xs text-muted-foreground">Total Scope Items</p>
          <p className="text-2xl font-bold">{totalScopes}</p>
        </Card>
        <Card className="py-3 px-4 border-green-200 dark:border-green-800">
          <p className="text-xs text-green-600 font-semibold">Fully Covered</p>
          <p className="text-2xl font-bold text-green-700">{covered}</p>
        </Card>
        <Card className="py-3 px-4 border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-600 font-semibold">Partially Covered</p>
          <p className="text-2xl font-bold text-yellow-700">{partial}</p>
        </Card>
        <Card className="py-3 px-4 border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 font-semibold">Not Covered</p>
          <p className="text-2xl font-bold text-red-700">{uncovered}</p>
        </Card>
      </div>

      {/* Coverage progress bar */}
      {totalScopes > 0 && (
        <Card className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Overall Coverage</p>
            <p className="text-sm font-bold text-primary">{coveragePct}%</p>
          </div>
          <Progress value={coveragePct} className="h-2.5" />
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Covered</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />Partial (reqs, no stories)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />No requirements</span>
          </div>
        </Card>
      )}

      {/* Orphaned items */}
      <OrphanedItems
        requirements={requirements as any[]}
        userStories={userStories as any[]}
        issues={issues as any[]}
      />

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search scope items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterHealth} onValueChange={setFilterHealth}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Health</SelectItem>
            <SelectItem value="green">Covered</SelectItem>
            <SelectItem value="yellow">Partial</SelectItem>
            <SelectItem value="red">Not Covered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Coverage table */}
      <Card>
        <CardContent className="p-0">
          {loadingCoverage ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No scope items found"
              description="Create scope items and link requirements, user stories, and issues to them"
              icon={<Layers className="w-10 h-10 text-muted-foreground" />}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead className="w-10">Health</TableHead>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Scope Item</TableHead>
                  <TableHead className="w-20">Phase</TableHead>
                  <TableHead className="w-28 text-center">
                    <span className="flex items-center justify-center gap-1">
                      <FileText className="w-3.5 h-3.5" />Requirements
                    </span>
                  </TableHead>
                  <TableHead className="w-28 text-center">
                    <span className="flex items-center justify-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />User Stories
                    </span>
                  </TableHead>
                  <TableHead className="w-28 text-center">
                    <span className="flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />Issues
                    </span>
                  </TableHead>
                  <TableHead className="w-28 text-center">Story Progress</TableHead>
                  <TableHead className="w-28 text-center">
                    <span className="flex items-center justify-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5" />Tasks
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => {
                  const storyPct =
                    row.userStoryCount > 0
                      ? Math.round((row.userStoryDoneCount / row.userStoryCount) * 100)
                      : 0;
                  const taskCount = (row as any).taskCount ?? 0;
                  const taskDone = (row as any).taskDoneCount ?? 0;
                  const taskPct = taskCount > 0 ? Math.round((taskDone / taskCount) * 100) : 0;
                  return (
                    <TableRow key={row.scopeItem.id} className="hover:bg-primary/5">
                      <TableCell className="py-3">
                        <HealthBadge health={row.health} />
                      </TableCell>
                      <TableCell className="font-mono text-sm font-bold text-primary py-3">
                        {row.scopeItem.idCode}
                      </TableCell>
                      <TableCell className="py-3">
                        <div>
                          <p className="font-medium text-sm">{row.scopeItem.name}</p>
                          {row.scopeItem.processArea && (
                            <p className="text-xs text-muted-foreground">
                              {row.scopeItem.processArea}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        {row.scopeItem.phase ? (
                          <Badge variant="outline" className="text-xs">
                            {row.scopeItem.phase}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      {/* Requirements count */}
                      <TableCell className="text-center py-3">
                        <span
                          className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-sm font-bold ${
                            row.requirementCount > 0
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {row.requirementCount}
                        </span>
                      </TableCell>
                      {/* User Stories count */}
                      <TableCell className="text-center py-3">
                        <span
                          className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-sm font-bold ${
                            row.userStoryCount > 0
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {row.userStoryCount}
                        </span>
                      </TableCell>
                      {/* Issues count */}
                      <TableCell className="text-center py-3">
                        {row.issueCount > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-sm text-foreground">
                              {row.issueCount}
                            </span>
                            {row.openIssueCount > 0 && (
                              <span className="text-[10px] text-orange-600 font-semibold">
                                {row.openIssueCount} open
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      {/* Story progress */}
                      <TableCell className="py-3 text-center">
                        {row.userStoryCount > 0 ? (
                          <div className="space-y-1">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden w-full max-w-[80px] mx-auto">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${storyPct}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {row.userStoryDoneCount}/{row.userStoryCount} done
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      {/* Task completion */}
                      <TableCell className="py-3 text-center">
                        {taskCount > 0 ? (
                          <div className="space-y-1">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden w-full max-w-[80px] mx-auto">
                              <div
                                className="h-full bg-orange-500 rounded-full"
                                style={{ width: `${taskPct}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {taskDone}/{taskCount} done
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-muted/30">
        <CardContent className="py-3 px-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Coverage Legend
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-700">Covered</p>
                <p className="text-muted-foreground">Has requirements AND user stories</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-700">Partial</p>
                <p className="text-muted-foreground">Has requirements but no user stories</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700">Not Covered</p>
                <p className="text-muted-foreground">No requirements linked at all</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
