/**
 * Periodic Report — replaces Weekly Report
 * Supports multiple built-in versions (Full, Tasks, Requirements, Risks)
 * and fully customisable user-defined report templates.
 */
import { useState, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileText, Download, Printer, CheckCircle2, AlertTriangle, Clock,
  Bug, GitPullRequest, BookOpen, TrendingUp, Calendar, Settings2,
  Plus, Trash2, GripVertical, Save, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate as _formatDateUtil } from "@/lib/dateUtils";

// ─── Types ────────────────────────────────────────────────────────────────────
type SectionKey =
  | "executive-summary" | "key-highlights"
  | "tasks-in-period" | "task-status-breakdown" | "task-by-responsible"
  | "issues-in-period" | "high-priority-issues" | "issues-by-owner"
  | "requirements-in-period"
  | "risk-overview" | "overdue-tasks"
  | "pending-crs" | "recent-decisions"
  | "risks-blockers" | "next-period-plan"
  | "rag-health";

type PeriodType = "weekly" | "biweekly" | "monthly" | "quarterly" | "custom";

interface CustomTemplate {
  id: string;
  name: string;
  sections: SectionKey[];
  createdAt: string;
}

// ─── Section Registry ─────────────────────────────────────────────────────────
const ALL_SECTIONS: { key: SectionKey; label: string; desc: string; icon: string }[] = [
  { key: "executive-summary",    label: "Executive Summary",          desc: "KPI cards — totals, overdue count, test pass rate",    icon: "📊" },
  { key: "key-highlights",       label: "Key Highlights",             desc: "Free-text accomplishments for the period",             icon: "✨" },
  { key: "tasks-in-period",      label: "Tasks Due in Period",        desc: "All tasks with due dates in the selected period",      icon: "✅" },
  { key: "task-status-breakdown",label: "Task Status Breakdown",      desc: "Count of tasks grouped by status",                     icon: "📋" },
  { key: "task-by-responsible",  label: "Tasks per Responsible",      desc: "Cross-tab: person × status matrix",                   icon: "👤" },
  { key: "issues-in-period",     label: "Issues Requiring Resolution",desc: "Issues with resolution dates in the period",           icon: "🐛" },
  { key: "high-priority-issues", label: "High Priority Open Issues",  desc: "Critical and High priority open issues",              icon: "🔴" },
  { key: "issues-by-owner",      label: "Issues per Owner",           desc: "Issue count grouped by owner",                        icon: "📌" },
  { key: "requirements-in-period",label: "Requirements in Period",    desc: "Requirements created/updated in the period",          icon: "📝" },
  { key: "risk-overview",        label: "Risk Status Overview",       desc: "Risk score breakdown — critical / high / medium / low",icon: "⚡" },
  { key: "overdue-tasks",        label: "Overdue Tasks",              desc: "Tasks past their due date, not yet completed",        icon: "⚠️" },
  { key: "pending-crs",          label: "Pending Change Requests",    desc: "Change requests awaiting approval",                   icon: "🔄" },
  { key: "recent-decisions",     label: "Recent Decisions",           desc: "Decisions logged in the system",                     icon: "📅" },
  { key: "risks-blockers",       label: "Risks & Blockers",           desc: "Free-text risks and blockers for the period",         icon: "🚫" },
  { key: "next-period-plan",     label: "Next Period's Plan",         desc: "Free-text plan for the upcoming period",              icon: "🎯" },
  { key: "rag-health",           label: "RAG Health Status",           desc: "Auto-computed Red/Amber/Green for Schedule, Cost, Scope, Risk, Overall", icon: "🚦" },
];

const BUILT_IN_VERSIONS: Record<string, { label: string; desc: string; color: string; sections: SectionKey[] }> = {
  full: {
    label: "Full Report",
    desc: "All 16 sections — comprehensive project status update",
    color: "bg-slate-100 text-slate-800 border-slate-300",
    sections: ALL_SECTIONS.map((s) => s.key),
  },
  tasks: {
    label: "Tasks Version",
    desc: "Executive summary + all task-related sections",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    sections: ["executive-summary","key-highlights","tasks-in-period","task-status-breakdown","task-by-responsible","overdue-tasks","next-period-plan"],
  },
  requirements: {
    label: "Requirements Version",
    desc: "Executive summary + requirements progress",
    color: "bg-teal-100 text-teal-800 border-teal-300",
    sections: ["executive-summary","key-highlights","requirements-in-period","task-status-breakdown","next-period-plan"],
  },
  risks: {
    label: "Risks Version",
    desc: "Executive summary + all risk and issue sections",
    color: "bg-orange-100 text-orange-800 border-orange-300",
    sections: ["executive-summary","key-highlights","risk-overview","high-priority-issues","overdue-tasks","pending-crs","risks-blockers","next-period-plan"],
  },
};

const TEMPLATES_KEY = "periodic-report-templates-v2";
const PERIOD_TYPE_KEY = "periodic-report-period-type";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDateStr(d: Date): string { return d.toISOString().split("T")[0]; }

function getPeriodDates(type: PeriodType, customStart: string, customEnd: string): { start: string; end: string } {
  const now = new Date();
  if (type === "custom") return { start: customStart, end: customEnd };
  if (type === "weekly") {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1);
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return { start: toDateStr(start), end: toDateStr(end) };
  }
  if (type === "biweekly") {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1 - 7);
    const end = new Date(start); end.setDate(start.getDate() + 13);
    return { start: toDateStr(start), end: toDateStr(end) };
  }
  if (type === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: toDateStr(start), end: toDateStr(end) };
  }
  if (type === "quarterly") {
    const q = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), q * 3, 1);
    const end = new Date(now.getFullYear(), (q + 1) * 3, 0);
    return { start: toDateStr(start), end: toDateStr(end) };
  }
  return { start: toDateStr(now), end: toDateStr(now) };
}

function formatDate(d: any): string {
  if (!d) return "—";
  return _formatDateUtil(d instanceof Date ? d.toISOString() : String(d));
}

function todayStr(): string {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function statusColor(s: string, completeStatuses?: Set<string>): string {
  const l = s.toLowerCase();
  if (completeStatuses ? completeStatuses.has(l) : (l.includes("done") || l.includes("completed") || l.includes("closed") || l.includes("passed") || l.includes("approved"))) return "badge-green";
  if (l.includes("progress") || l.includes("review")) return "badge-blue";
  if (l.includes("open") || l.includes("pending") || l.includes("submitted")) return "badge-amber";
  if (l.includes("overdue") || l.includes("failed") || l.includes("rejected") || l.includes("blocked")) return "badge-red";
  return "badge-gray";
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PeriodicReport() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: allProjects } = trpc.projects.list.useQuery();
  const currentProject = allProjects?.find(p => p.id === currentProjectId);

  // ── Period ────────────────────────────────────────────────────────────────
  const [periodType, setPeriodType] = useState<PeriodType>(() =>
    (localStorage.getItem(PERIOD_TYPE_KEY) as PeriodType) ?? "weekly"
  );
  const today = new Date();
  const [customStart, setCustomStart] = useState(() => toDateStr(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [customEnd, setCustomEnd] = useState(() => toDateStr(new Date(today.getFullYear(), today.getMonth() + 1, 0)));
  const { start: periodStart, end: periodEnd } = useMemo(
    () => getPeriodDates(periodType, customStart, customEnd),
    [periodType, customStart, customEnd]
  );

  // ── Version ───────────────────────────────────────────────────────────────
  const [selectedVersion, setSelectedVersion] = useState<string>("full");

  // ── Custom templates ──────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<CustomTemplate[]>(() => {
    try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) ?? "[]"); } catch { return []; }
  });
  const saveTemplates = (t: CustomTemplate[]) => {
    setTemplates(t);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(t));
  };

  // ── Custom builder state ──────────────────────────────────────────────────
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderSections, setBuilderSections] = useState<SectionKey[]>(ALL_SECTIONS.map((s) => s.key));
  const [newTemplateName, setNewTemplateName] = useState("");

  // ── Report meta ───────────────────────────────────────────────────────────
  const [reportTitle, setReportTitle] = useState("Project Status Report");
  const [preparedBy, setPreparedBy] = useState("");
  const [highlights, setHighlights] = useState("");
  const [risksText, setRisksText] = useState("");
  const [nextSteps, setNextSteps] = useState("");

  // ── Data query ────────────────────────────────────────────────────────────
  const { data, isLoading } = trpc.traceability.weeklyReportData.useQuery(
    { projectId, periodStart, periodEnd },
    { enabled: !!projectId }
  );

  // ── Determine active sections ─────────────────────────────────────────────
  const activeSections = useMemo<SectionKey[]>(() => {
    if (BUILT_IN_VERSIONS[selectedVersion]) return BUILT_IN_VERSIONS[selectedVersion].sections;
    const tpl = templates.find((t) => t.id === selectedVersion);
    return tpl?.sections ?? BUILT_IN_VERSIONS.full.sections;
  }, [selectedVersion, templates]);

  function hasSection(key: SectionKey): boolean { return activeSections.includes(key); }

  // ── Builder actions ───────────────────────────────────────────────────────
  function openBuilderFromVersion() {
    const current = BUILT_IN_VERSIONS[selectedVersion]?.sections
      ?? templates.find((t) => t.id === selectedVersion)?.sections
      ?? ALL_SECTIONS.map((s) => s.key);
    setBuilderSections([...current]);
    setNewTemplateName("");
    setShowBuilder(true);
  }

  function toggleBuilderSection(key: SectionKey) {
    setBuilderSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function moveSection(key: SectionKey, dir: "up" | "down") {
    setBuilderSections((prev) => {
      const idx = prev.indexOf(key);
      if (idx === -1) return prev;
      const next = [...prev];
      const swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  function saveAsTemplate() {
    if (!newTemplateName.trim()) { toast.error("Please enter a template name"); return; }
    const id = `custom-${Date.now()}`;
    const newTpl: CustomTemplate = { id, name: newTemplateName.trim(), sections: builderSections, createdAt: new Date().toISOString() };
    saveTemplates([...templates, newTpl]);
    setSelectedVersion(id);
    setShowBuilder(false);
    toast.success(`Template "${newTpl.name}" saved`);
  }

  function deleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    const next = templates.filter((t) => t.id !== id);
    saveTemplates(next);
    if (selectedVersion === id) setSelectedVersion("full");
    toast.success("Template deleted");
  }

  // ── Export ────────────────────────────────────────────────────────────────
  const handlePrint = () => { window.print(); };

  const handleDownload = () => {
    if (!reportRef.current) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${reportTitle}</title>
<style>
body{font-family:Arial,sans-serif;margin:40px;color:#1a1a1a;font-size:13px}
h1{color:#0f4c75;font-size:22px;margin-bottom:4px}
h2{color:#0f4c75;font-size:15px;border-bottom:2px solid #0f4c75;padding-bottom:4px;margin-top:28px}
.meta{color:#555;font-size:12px;margin-bottom:24px}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}
.kpi{background:#f0f7ff;border:1px solid #c8dff5;border-radius:8px;padding:12px;text-align:center}
.kpi .value{font-size:28px;font-weight:bold;color:#0f4c75}
.kpi .label{font-size:11px;color:#555;margin-top:4px}
table{width:100%;border-collapse:collapse;margin:12px 0;font-size:12px}
th{background:#0f4c75;color:white;padding:8px 10px;text-align:left}
td{padding:7px 10px;border-bottom:1px solid #e5e7eb}
tr:nth-child(even) td{background:#f9fafb}
.badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600}
.badge-green{background:#dcfce7;color:#166534}
.badge-red{background:#fee2e2;color:#991b1b}
.badge-amber{background:#fef3c7;color:#92400e}
.badge-blue{background:#dbeafe;color:#1e40af}
.badge-gray{background:#f3f4f6;color:#374151}
.note-box{background:#f0f7ff;border-left:4px solid #0f4c75;padding:12px 16px;border-radius:4px;margin:8px 0;white-space:pre-wrap}
.footer{margin-top:40px;border-top:1px solid #e5e7eb;padding-top:12px;color:#888;font-size:11px}
@media print{body{margin:20px}}
</style></head><body>${reportRef.current.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportTitle.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded (open in browser to print as PDF)");
  };

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">Loading report data…</div>;
  if (!data) return <div className="p-6 text-center text-muted-foreground">No data. Select a project first.</div>;

  const {
    summary, tasksByStatus, issuesByStatus, reqsByStatus, testsByStatus, crsByStatus,
    overdueTasks, highPriorityOpenIssues, recentDecisions, pendingCRs,
    tasksByResponsible, issuesByOwner, taskStatusByResponsible,
    riskScoreBreakdown, tasksInPeriod, issuesNeedingResolution, requirementsInPeriod,
  } = data;

  const activeLabel = BUILT_IN_VERSIONS[selectedVersion]?.label
    ?? templates.find((t) => t.id === selectedVersion)?.name
    ?? "Custom";

  return (
    <div className="p-6 space-y-6">
      {/* ── Page Header ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-gray-500" />
              Periodic Report
            </h1>
            <p className="text-gray-500 text-sm mt-1">Generate configurable status reports — choose a version or build your own</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Button onClick={handleDownload} className="bg-gray-900 hover:bg-gray-800 text-white gap-2">
              <Download className="w-4 h-4" /> Download
            </Button>
          </div>
        </div>
      </div>

      {/* ── Version Selector ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Report Version
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(BUILT_IN_VERSIONS).map(([key, v]) => (
              <button
                key={key}
                onClick={() => setSelectedVersion(key)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                  selectedVersion === key
                    ? `${v.color} ring-2 ring-offset-1 ring-current shadow-sm`
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {v.label}
                <span className="ml-2 text-[10px] opacity-60">({v.sections.length} sections)</span>
              </button>
            ))}
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setSelectedVersion(tpl.id)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-1 ${
                  selectedVersion === tpl.id
                    ? "bg-violet-100 text-violet-800 border-violet-300 ring-2 ring-offset-1 ring-violet-500 shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {tpl.name}
                <span className="opacity-50 text-[10px]">({tpl.sections.length})</span>
                <span
                  onClick={(e) => { e.stopPropagation(); deleteTemplate(tpl.id); }}
                  className="ml-1 text-red-400 hover:text-red-600 cursor-pointer"
                  title="Delete template"
                >×</span>
              </button>
            ))}
            <Button size="sm" variant="outline" onClick={openBuilderFromVersion} className="gap-1.5 border-dashed">
              <Settings2 className="w-3.5 h-3.5" /> Build Custom Version
            </Button>
          </div>
          {selectedVersion !== "full" && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">{activeLabel}</span> includes: {activeSections.map((k) => ALL_SECTIONS.find((s) => s.key === k)?.label).filter(Boolean).join(" · ")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Period & Meta Settings ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Period & Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>Period Type</Label>
            <Select value={periodType} onValueChange={(v) => {
              setPeriodType(v as PeriodType);
              localStorage.setItem(PERIOD_TYPE_KEY, v);
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly (Mon–Sun)</SelectItem>
                <SelectItem value="biweekly">Bi-Weekly (2 weeks)</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {periodType === "custom" ? (
            <>
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
              </div>
            </>
          ) : (
            <div className="space-y-1 md:col-span-2">
              <Label>Calculated Period</Label>
              <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-muted/40 text-sm">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{formatDate(periodStart)} → {formatDate(periodEnd)}</span>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <Label>Report Title</Label>
            <Input value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Prepared By</Label>
            <Input value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} placeholder="Your name / role" />
          </div>
          <div className="space-y-1 md:col-span-3">
            <Label>Key Highlights / Accomplishments</Label>
            <Textarea value={highlights} onChange={(e) => setHighlights(e.target.value)}
              placeholder="e.g., Completed UAT for Module X, resolved 5 critical issues…" rows={2} />
          </div>
          <div className="space-y-1 md:col-span-1">
            <Label>Risks & Blockers</Label>
            <Textarea value={risksText} onChange={(e) => setRisksText(e.target.value)}
              placeholder="e.g., Dependency on SAP pending…" rows={2} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Next Period's Plan</Label>
            <Textarea value={nextSteps} onChange={(e) => setNextSteps(e.target.value)}
              placeholder="e.g., Begin SIT for Module Y, review open CRs…" rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* ── Report Preview ── */}
      <div className="border-2 border-dashed border-blue-200 rounded-xl p-2">
        <div className="text-center text-xs text-blue-500 mb-2">
          <Badge variant="outline" className="mr-2">{activeLabel}</Badge>
          Report Preview — {activeSections.length} sections included
        </div>

        <div ref={reportRef} className="bg-white rounded-lg p-8 shadow-sm" style={{ fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#1a1a1a" }}>
          {/* Report Header */}
          <div style={{ borderBottom: "3px solid #0f4c75", paddingBottom: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              {(currentProject as any)?.logoUrl && (
                <img src={(currentProject as any).logoUrl} alt="logo" style={{ height: "48px", width: "48px", objectFit: "contain" }} />
              )}
              <div>
                <h1 style={{ color: "#0f4c75", fontSize: "22px", margin: "0 0 2px 0" }}>{reportTitle}</h1>
                {currentProject?.name && <div style={{ fontSize: "13px", color: "#444", fontWeight: 600 }}>{currentProject.name}</div>}
              </div>
            </div>
            <div style={{ color: "#555", fontSize: "12px" }}>
              <strong>Version:</strong> {activeLabel} &nbsp;|&nbsp;
              <strong>Period:</strong> {formatDate(periodStart)} – {formatDate(periodEnd)} &nbsp;|&nbsp;
              <strong>Date:</strong> {todayStr()}
              {preparedBy && <>&nbsp;|&nbsp;<strong>Prepared by:</strong> {preparedBy}</>}
            </div>
          </div>

          {/* ── Section renderer ── */}
          {hasSection("executive-summary") && (
            <>
              <h2 style={H2}>1. Executive Summary</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", margin: "16px 0" }}>
                {[
                  { value: summary.totalRequirements, label: "Requirements", icon: "📋" },
                  { value: summary.totalTasks, label: "Total Tasks", icon: "✅" },
                  { value: summary.totalIssues, label: "Total Issues", icon: "🐛" },
                  { value: summary.totalRisks ?? 0, label: "Total Risks", icon: "⚡" },
                  { value: summary.overdueTasks, label: "Overdue Tasks", icon: "⚠️", highlight: summary.overdueTasks > 0 },
                  { value: summary.highPriorityOpenIssues, label: "High Priority Issues", icon: "🔴", highlight: summary.highPriorityOpenIssues > 0 },
                  { value: `${summary.testPassRate}%`, label: "Test Pass Rate", icon: "📊" },
                  { value: summary.totalCRs, label: "Change Requests", icon: "🔄" },
                ].map((k, i) => (
                  <div key={i} style={{ background: (k as any).highlight ? "#fff1f2" : "#f0f7ff", border: `1px solid ${(k as any).highlight ? "#fecaca" : "#c8dff5"}`, borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: (k as any).highlight ? "#dc2626" : "#0f4c75" }}>{k.icon} {k.value}</div>
                    <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>{k.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {hasSection("key-highlights") && highlights && (
            <SectionBlock num={sectionNum(activeSections, "key-highlights")} title="Key Highlights" h2Style={H2}>
              <div style={{ background: "#f0f7ff", borderLeft: "4px solid #0f4c75", padding: "12px 16px", borderRadius: "4px", whiteSpace: "pre-wrap" }}>{highlights}</div>
            </SectionBlock>
          )}

          {hasSection("tasks-in-period") && (
            <SectionBlock num={sectionNum(activeSections, "tasks-in-period")} title={`Tasks Due in Period (${tasksInPeriod?.length ?? 0})`} h2Style={H2}>
              {tasksInPeriod && tasksInPeriod.length > 0 ? (
                <ReportTable headers={["Task ID","Description","Due Date","Status","Responsible","Priority"]}
                  rows={tasksInPeriod.map((t) => [t.taskId, t.description?.slice(0,60), t.dueDate ?? "—", t.status ?? "—", t.responsible ?? "—", t.priority ?? "—"])} />
              ) : <EmptyMsg />}
            </SectionBlock>
          )}

          {hasSection("task-status-breakdown") && (
            <SectionBlock num={sectionNum(activeSections, "task-status-breakdown")} title="Overall Task Status Breakdown" h2Style={H2}>
              <ReportTable headers={["Status","Count","% of Total"]}
                rows={Object.entries(tasksByStatus).map(([s, c]) => [s, String(c), `${summary.totalTasks > 0 ? Math.round((c / summary.totalTasks) * 100) : 0}%`])} />
            </SectionBlock>
          )}

          {hasSection("task-by-responsible") && taskStatusByResponsible && Object.keys(taskStatusByResponsible).length > 0 && (
            <SectionBlock num={sectionNum(activeSections, "task-by-responsible")} title="Task Status per Responsible" h2Style={H2}>
              {(() => {
                const allStatuses = Array.from(new Set(Object.values(taskStatusByResponsible).flatMap((s) => Object.keys(s))));
                return (
                  <table style={{ width: "100%", borderCollapse: "collapse", margin: "12px 0", fontSize: "12px" }}>
                    <thead><tr>
                      {["Responsible", ...allStatuses, "Total"].map((h) => <th key={h} style={TH}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {Object.entries(taskStatusByResponsible).map(([resp, statuses], i) => {
                        const total = Object.values(statuses as Record<string,number>).reduce((a, b) => a + b, 0);
                        return (
                          <tr key={resp}>
                            <td style={{ ...TD, background: i % 2 === 0 ? "white" : "#f9fafb", fontWeight: "bold" }}>{resp}</td>
                            {allStatuses.map((st) => <td key={st} style={{ ...TD, background: i % 2 === 0 ? "white" : "#f9fafb", textAlign: "center" }}>{(statuses as any)[st] ?? 0}</td>)}
                            <td style={{ ...TD, background: i % 2 === 0 ? "white" : "#f9fafb", textAlign: "center", fontWeight: "bold" }}>{total}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </SectionBlock>
          )}

          {hasSection("issues-in-period") && (
            <SectionBlock num={sectionNum(activeSections, "issues-in-period")} title={`Issues Requiring Resolution in Period (${issuesNeedingResolution?.length ?? 0})`} h2Style={{ ...H2, color: "#d97706", borderBottomColor: "#d97706" }}>
              {issuesNeedingResolution && issuesNeedingResolution.length > 0 ? (
                <ReportTable thColor="#d97706" headers={["Issue ID","Description","Resolution Date","Priority","Status","Owner"]}
                  rows={issuesNeedingResolution.map((i) => [i.issueId, i.description?.slice(0,60), i.resolutionDate ?? "—", i.priority ?? "—", i.status ?? "—", i.owner ?? "—"])} />
              ) : <EmptyMsg />}
            </SectionBlock>
          )}

          {hasSection("high-priority-issues") && highPriorityOpenIssues.length > 0 && (
            <SectionBlock num={sectionNum(activeSections, "high-priority-issues")} title={`High Priority Open Issues (${highPriorityOpenIssues.length})`} h2Style={{ ...H2, color: "#dc2626", borderBottomColor: "#dc2626" }}>
              <ReportTable thColor="#dc2626" headers={["Issue ID","Description","Priority","Status","Owner"]}
                rows={highPriorityOpenIssues.map((i) => [i.issueId, i.description?.slice(0,60), i.priority ?? "—", i.status ?? "—", i.owner ?? "—"])} />
            </SectionBlock>
          )}

          {hasSection("issues-by-owner") && issuesByOwner && Object.keys(issuesByOwner).length > 0 && (
            <SectionBlock num={sectionNum(activeSections, "issues-by-owner")} title="Issues per Owner" h2Style={{ ...H2, color: "#d97706", borderBottomColor: "#d97706" }}>
              <ReportTable thColor="#d97706" headers={["Owner","Issue Count"]}
                rows={Object.entries(issuesByOwner).sort((a, b) => b[1] - a[1]).map(([o, c]) => [o, String(c)])} />
            </SectionBlock>
          )}

          {hasSection("requirements-in-period") && (
            <SectionBlock num={sectionNum(activeSections, "requirements-in-period")} title={`Requirements Gathered in Period (${requirementsInPeriod?.length ?? 0})`} h2Style={{ ...H2, color: "#0f766e", borderBottomColor: "#0f766e" }}>
              {requirementsInPeriod && requirementsInPeriod.length > 0 ? (
                <ReportTable thColor="#0f766e" headers={["Req ID","Description","Status","Priority","Owner"]}
                  rows={requirementsInPeriod.map((r) => [r.idCode, (r.description ?? "")?.slice(0,70), r.status ?? "—", r.priority ?? "—", r.owner ?? "—"])} />
              ) : <EmptyMsg />}
            </SectionBlock>
          )}

          {hasSection("risk-overview") && riskScoreBreakdown && (
            <SectionBlock num={sectionNum(activeSections, "risk-overview")} title={`Risk Status Overview (Total: ${summary.totalRisks ?? 0})`} h2Style={{ ...H2, color: "#7c3aed", borderBottomColor: "#7c3aed" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", margin: "12px 0" }}>
                {[
                  { label: "Critical (≥20)", value: riskScoreBreakdown.critical, color: "#dc2626", bg: "#fee2e2" },
                  { label: "High (12–19)", value: riskScoreBreakdown.high, color: "#d97706", bg: "#fef3c7" },
                  { label: "Medium (6–11)", value: riskScoreBreakdown.medium, color: "#2563eb", bg: "#dbeafe" },
                  { label: "Low (<6)", value: riskScoreBreakdown.low, color: "#16a34a", bg: "#dcfce7" },
                ].map((r) => (
                  <div key={r.label} style={{ background: r.bg, border: `1px solid ${r.color}40`, borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: r.color }}>{r.value}</div>
                    <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>{r.label}</div>
                  </div>
                ))}
              </div>
            </SectionBlock>
          )}

          {hasSection("overdue-tasks") && overdueTasks.length > 0 && (
            <SectionBlock num={sectionNum(activeSections, "overdue-tasks")} title={`Overdue Tasks (${overdueTasks.length})`} h2Style={{ ...H2, color: "#dc2626", borderBottomColor: "#dc2626" }}>
              <ReportTable thColor="#dc2626" headers={["Task ID","Description","Due Date","Status","Responsible"]}
                rows={overdueTasks.map((t) => [t.taskId, t.description?.slice(0,60), t.dueDate ?? "—", t.status ?? "—", t.responsible ?? "—"])} />
            </SectionBlock>
          )}

          {hasSection("pending-crs") && pendingCRs.length > 0 && (
            <SectionBlock num={sectionNum(activeSections, "pending-crs")} title={`Pending Change Requests (${pendingCRs.length})`} h2Style={{ ...H2, color: "#7c3aed", borderBottomColor: "#7c3aed" }}>
              <ReportTable thColor="#7c3aed" headers={["CR ID","Title","Priority","Status","Requested By"]}
                rows={pendingCRs.map((c) => [c.crId, c.title?.slice(0,60), c.priority ?? "—", c.status ?? "—", c.requestedBy ?? "—"])} />
            </SectionBlock>
          )}

          {hasSection("recent-decisions") && recentDecisions.length > 0 && (
            <SectionBlock num={sectionNum(activeSections, "recent-decisions")} title="Recent Decisions" h2Style={{ ...H2, color: "#0f766e", borderBottomColor: "#0f766e" }}>
              <ReportTable thColor="#0f766e" headers={["Decision ID","Title","Date","Status","Decided By"]}
                rows={recentDecisions.map((d) => [d.decisionId, d.title?.slice(0,60), formatDate(d.decisionDate), d.status ?? "—", d.decidedBy ?? "—"])} />
            </SectionBlock>
          )}

          {hasSection("risks-blockers") && risksText && (
            <SectionBlock num={sectionNum(activeSections, "risks-blockers")} title="Risks & Blockers" h2Style={{ ...H2, color: "#dc2626", borderBottomColor: "#dc2626" }}>
              <div style={{ background: "#fff1f2", borderLeft: "4px solid #dc2626", padding: "12px 16px", borderRadius: "4px", whiteSpace: "pre-wrap" }}>{risksText}</div>
            </SectionBlock>
          )}

          {hasSection("next-period-plan") && nextSteps && (
            <SectionBlock num={sectionNum(activeSections, "next-period-plan")} title="Next Period's Plan" h2Style={H2}>
              <div style={{ background: "#f0f7ff", borderLeft: "4px solid #0f4c75", padding: "12px 16px", borderRadius: "4px", whiteSpace: "pre-wrap" }}>{nextSteps}</div>
            </SectionBlock>
          )}

          {hasSection("rag-health") && (() => {
            const totalTasks = summary.totalTasks ?? 0;
            const overdue = overdueTasks.length;
            const overdueRatio = totalTasks > 0 ? overdue / totalTasks : 0;
            const scheduleRAG = overdueRatio > 0.2 ? "Red" : overdueRatio > 0.1 ? "Amber" : "Green";
            const criticalRisks = riskScoreBreakdown?.critical ?? 0;
            const highRisks = riskScoreBreakdown?.high ?? 0;
            const riskRAG = criticalRisks > 0 ? "Red" : highRisks > 2 ? "Amber" : "Green";
            const openHighIssues = highPriorityOpenIssues.length;
            const scopeRAG = openHighIssues > 5 ? "Red" : openHighIssues > 2 ? "Amber" : "Green";
            const pendingCRCount = pendingCRs.length;
            const costRAG = pendingCRCount > 5 ? "Amber" : "Green";
            const overallRAG = [scheduleRAG, riskRAG, scopeRAG, costRAG].includes("Red") ? "Red" : [scheduleRAG, riskRAG, scopeRAG, costRAG].includes("Amber") ? "Amber" : "Green";
            const ragColor = (r: string) => r === "Red" ? { bg: "#fee2e2", color: "#dc2626", dot: "#dc2626" } : r === "Amber" ? { bg: "#fef3c7", color: "#d97706", dot: "#d97706" } : { bg: "#dcfce7", color: "#16a34a", dot: "#16a34a" };
            const items = [
              { label: "Schedule", rag: scheduleRAG, note: `${overdue} overdue task${overdue !== 1 ? "s" : ""}` },
              { label: "Cost", rag: costRAG, note: `${pendingCRCount} pending CR${pendingCRCount !== 1 ? "s" : ""}` },
              { label: "Scope", rag: scopeRAG, note: `${openHighIssues} high-priority issue${openHighIssues !== 1 ? "s" : ""}` },
              { label: "Risk", rag: riskRAG, note: `${criticalRisks} critical, ${highRisks} high risk${highRisks !== 1 ? "s" : ""}` },
              { label: "Overall", rag: overallRAG, note: "Composite health" },
            ];
            return (
              <SectionBlock num={sectionNum(activeSections, "rag-health")} title="RAG Health Status" h2Style={{ ...H2, color: "#374151", borderBottomColor: "#374151" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "10px", margin: "12px 0" }}>
                  {items.map((item) => {
                    const c = ragColor(item.rag);
                    return (
                      <div key={item.label} style={{ background: c.bg, border: `2px solid ${c.color}40`, borderRadius: "10px", padding: "14px 10px", textAlign: "center" }}>
                        <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: c.dot, margin: "0 auto 8px" }} />
                        <div style={{ fontSize: "13px", fontWeight: "700", color: c.color }}>{item.rag}</div>
                        <div style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginTop: "4px" }}>{item.label}</div>
                        <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "4px" }}>{item.note}</div>
                      </div>
                    );
                  })}
                </div>
              </SectionBlock>
            );
          })()}

          {/* Footer */}
          <div style={{ marginTop: "40px", borderTop: "1px solid #e5e7eb", paddingTop: "12px", color: "#888", fontSize: "11px" }}>
            {reportTitle} · {activeLabel} · Generated by Project Management SSOT &nbsp;|&nbsp; {todayStr()} &nbsp;|&nbsp; {preparedBy || "Project Manager"}
          </div>
        </div>
      </div>

      {/* ── Custom Template Builder Dialog ── */}
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" /> Custom Report Version Builder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Select and order the sections you want in your custom report version. Use ↑↓ to reorder.
            </p>

            <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-lg p-2">
              {ALL_SECTIONS.map((s) => {
                const included = builderSections.includes(s.key);
                const idx = builderSections.indexOf(s.key);
                return (
                  <div
                    key={s.key}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors ${included ? "bg-violet-50 border-violet-200" : "bg-white border-gray-200"}`}
                  >
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => toggleBuilderSection(s.key)}
                      className="accent-violet-600 w-4 h-4 shrink-0"
                    />
                    <span className="text-base shrink-0">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{s.label}</div>
                      <div className="text-xs text-muted-foreground">{s.desc}</div>
                    </div>
                    {included && (
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button onClick={() => moveSection(s.key, "up")} disabled={idx === 0}
                          className="p-0.5 rounded hover:bg-violet-100 disabled:opacity-30">
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button onClick={() => moveSection(s.key, "down")} disabled={idx === builderSections.length - 1}
                          className="p-0.5 rounded hover:bg-violet-100 disabled:opacity-30">
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {included && (
                      <Badge variant="outline" className="text-[10px] shrink-0">#{idx + 1}</Badge>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-sm text-muted-foreground">
              {builderSections.length} section{builderSections.length !== 1 ? "s" : ""} selected
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Save as Named Template</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., Monthly Executive Deck, Risk Review…"
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && saveAsTemplate()}
                />
                <Button onClick={saveAsTemplate} className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5">
                  <Save className="w-4 h-4" /> Save
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBuilder(false)}>Close</Button>
            <Button
              onClick={() => {
                // Apply without saving — create a transient version
                const id = `transient-${Date.now()}`;
                const tpl: CustomTemplate = { id, name: "Custom (unsaved)", sections: builderSections, createdAt: new Date().toISOString() };
                saveTemplates([...templates.filter((t) => !t.id.startsWith("transient-")), tpl]);
                setSelectedVersion(id);
                setShowBuilder(false);
                toast.success("Custom version applied (not saved as template)");
              }}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              Apply Without Saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sectionNum(sections: SectionKey[], key: SectionKey): number {
  return sections.indexOf(key) + 1;
}

const H2: React.CSSProperties = {
  color: "#0f4c75", fontSize: "15px", borderBottom: "2px solid #0f4c75",
  paddingBottom: "4px", marginTop: "28px",
};

const TH: React.CSSProperties = {
  background: "#0f4c75", color: "white", padding: "8px 10px", textAlign: "left",
};

const TD: React.CSSProperties = {
  padding: "7px 10px", borderBottom: "1px solid #e5e7eb",
};

function SectionBlock({ num, title, h2Style, children }: {
  num: number; title: string; h2Style: React.CSSProperties; children: React.ReactNode;
}) {
  return (
    <>
      <h2 style={h2Style}>{num}. {title}</h2>
      {children}
    </>
  );
}

function EmptyMsg() {
  return <p style={{ color: "#888", fontSize: "12px", margin: "8px 0" }}>No data in this period.</p>;
}

function ReportTable({ headers, rows, thColor = "#0f4c75" }: {
  headers: string[];
  rows: (string | null | undefined)[][];
  thColor?: string;
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", margin: "12px 0", fontSize: "12px" }}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} style={{ background: thColor, color: "white", padding: "8px 10px", textAlign: "left" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f9fafb" }}>
                {cell ?? "—"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
