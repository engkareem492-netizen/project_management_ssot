import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, History, ChevronDown, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";

const ENTITY_COLORS: Record<string, string> = {
  requirement: "bg-blue-100 text-blue-700",
  task: "bg-violet-100 text-violet-700",
  issue: "bg-red-100 text-red-700",
  assumption: "bg-yellow-100 text-yellow-700",
  risk: "bg-orange-100 text-orange-700",
  deliverable: "bg-green-100 text-green-700",
  stakeholder: "bg-pink-100 text-pink-700",
  decision: "bg-teal-100 text-teal-700",
  "change-request": "bg-purple-100 text-purple-700",
};

const PAGE_SIZE = 25;

function formatTs(ts: string | Date) {
  const d = new Date(ts);
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function DiffRow({ field, change }: { field: string; change: { oldValue: any; newValue: any } }) {
  const old = String(change.oldValue ?? "—");
  const next = String(change.newValue ?? "—");
  return (
    <div className="flex items-start gap-2 text-xs py-0.5">
      <span className="font-medium text-muted-foreground w-28 shrink-0 truncate">{field}:</span>
      <span className="line-through text-red-400 max-w-[120px] truncate" title={old}>{old.slice(0, 40)}</span>
      <span className="text-muted-foreground">→</span>
      <span className="text-green-600 font-medium max-w-[120px] truncate" title={next}>{next.slice(0, 40)}</span>
    </div>
  );
}

export default function ActionLog() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;

  const [search, setSearch] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const { data: actionLogs, isLoading } = trpc.actionLogs.list.useQuery(
    undefined,
    { enabled: true }
  );

  // Derive entity types from data
  const entityTypes = useMemo(() => {
    if (!actionLogs) return [];
    const types = new Set(actionLogs.map(l => l.entityType));
    return Array.from(types).sort();
  }, [actionLogs]);

  const filtered = useMemo(() => {
    if (!actionLogs) return [];
    return actionLogs.filter(log => {
      if (entityTypeFilter !== "all" && log.entityType !== entityTypeFilter) return false;
      if (dateFrom) {
        const logDate = new Date(log.changedAt);
        if (logDate < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const logDate = new Date(log.changedAt);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        if (logDate > to) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const entityId = String(log.entityId ?? "").toLowerCase();
        const fields = Object.keys(log.changedFields as Record<string, any>).join(" ").toLowerCase();
        if (!entityId.includes(q) && !fields.includes(q)) return false;
      }
      return true;
    });
  }, [actionLogs, entityTypeFilter, dateFrom, dateTo, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearFilters = () => {
    setSearch("");
    setEntityTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasActiveFilters = search || entityTypeFilter !== "all" || dateFrom || dateTo;

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="w-6 h-6 text-gray-500" />
            Action Log
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Full audit trail of every change made across all project entities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-slate-700 border-slate-300">
            {filtered.length} / {actionLogs?.length ?? 0} entries
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(f => !f)}
            className={showFilters ? "border-primary text-primary" : ""}
          >
            <SlidersHorizontal className="w-4 h-4 mr-1.5" />
            Filters
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by entity ID or changed field…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground gap-1">
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 p-4 bg-muted/40 rounded-lg border">
            <div className="space-y-1 min-w-[160px]">
              <Label className="text-xs">Entity Type</Label>
              <Select value={entityTypeFilter} onValueChange={v => { setEntityTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {entityTypes.map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From Date</Label>
              <Input type="date" className="h-8 text-sm w-40" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To Date</Label>
              <Input type="date" className="h-8 text-sm w-40" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-0 p-0">
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-8" />
                  <TableHead className="font-semibold">Timestamp</TableHead>
                  <TableHead className="w-36 font-semibold">Entity Type</TableHead>
                  <TableHead className="w-36 font-semibold">Entity ID</TableHead>
                  <TableHead className="font-semibold">Changed Fields</TableHead>
                  <TableHead className="w-20 font-semibold text-center"># Fields</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      {hasActiveFilters
                        ? "No entries match the current filters."
                        : "No changes recorded yet. Edit requirements, tasks, or issues to see the action log."}
                    </TableCell>
                  </TableRow>
                ) : paginated.map((log) => {
                  const fields = log.changedFields as Record<string, { oldValue: any; newValue: any }>;
                  const fieldKeys = Object.keys(fields);
                  const isExpanded = expandedRows.has(log.id);
                  const entityColor = ENTITY_COLORS[log.entityType] ?? "bg-gray-100 text-gray-600";

                  return (
                    <>
                      <TableRow
                        key={log.id}
                        className="hover:bg-slate-50/50 cursor-pointer"
                        onClick={() => toggleRow(log.id)}
                      >
                        <TableCell className="w-8 text-center">
                          {isExpanded
                            ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground inline" />
                            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground inline" />
                          }
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {formatTs(log.changedAt)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs capitalize ${entityColor}`}>{log.entityType}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold">{log.entityId}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {fieldKeys.map(f => (
                              <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm font-semibold text-muted-foreground">
                          {fieldKeys.length}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${log.id}-expand`} className="bg-slate-50/60">
                          <TableCell />
                          <TableCell colSpan={5} className="py-3 px-4">
                            <div className="space-y-0.5">
                              {fieldKeys.map(field => (
                                <DiffRow key={field} field={field} change={fields[field]} />
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages} &nbsp;·&nbsp; {filtered.length} total entries
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
