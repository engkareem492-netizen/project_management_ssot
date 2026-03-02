import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, Printer, CheckCircle2, AlertTriangle, Clock, Bug, FlaskConical, GitPullRequest, BookOpen, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch { return String(d); }
}

function todayStr(): string {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function getDefaultPeriod(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1); // Monday
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Sunday
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

export default function WeeklyReport() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;
  const reportRef = useRef<HTMLDivElement>(null);

  const defaultPeriod = getDefaultPeriod();
  const [periodStart, setPeriodStart] = useState(defaultPeriod.start);
  const [periodEnd, setPeriodEnd] = useState(defaultPeriod.end);
  const [reportTitle, setReportTitle] = useState("Weekly Status Report");
  const [preparedBy, setPreparedBy] = useState("");
  const [highlights, setHighlights] = useState("");
  const [risksText, setRisksText] = useState("");
  const [nextSteps, setNextSteps] = useState("");

  const { data, isLoading } = trpc.traceability.weeklyReportData.useQuery(
    { projectId, periodStart, periodEnd },
    { enabled: !!projectId }
  );

  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  const handleDownloadHTML = () => {
    if (!reportRef.current) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${reportTitle}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; color: #1a1a1a; font-size: 13px; }
      h1 { color: #0f4c75; font-size: 22px; margin-bottom: 4px; }
      h2 { color: #0f4c75; font-size: 15px; border-bottom: 2px solid #0f4c75; padding-bottom: 4px; margin-top: 28px; }
      h3 { color: #1b6ca8; font-size: 13px; margin-bottom: 8px; }
      .meta { color: #555; font-size: 12px; margin-bottom: 24px; }
      .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
      .kpi { background: #f0f7ff; border: 1px solid #c8dff5; border-radius: 8px; padding: 12px; text-align: center; }
      .kpi .value { font-size: 28px; font-weight: bold; color: #0f4c75; }
      .kpi .label { font-size: 11px; color: #555; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
      th { background: #0f4c75; color: white; padding: 8px 10px; text-align: left; }
      td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
      tr:nth-child(even) td { background: #f9fafb; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
      .badge-green { background: #dcfce7; color: #166534; }
      .badge-red { background: #fee2e2; color: #991b1b; }
      .badge-amber { background: #fef3c7; color: #92400e; }
      .badge-blue { background: #dbeafe; color: #1e40af; }
      .badge-gray { background: #f3f4f6; color: #374151; }
      .section { margin-bottom: 24px; }
      .note-box { background: #f0f7ff; border-left: 4px solid #0f4c75; padding: 12px 16px; border-radius: 4px; margin: 8px 0; white-space: pre-wrap; }
      .progress-bar { background: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden; }
      .progress-fill { background: #0f4c75; height: 100%; border-radius: 4px; }
      .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 12px; color: #888; font-size: 11px; }
      @media print { body { margin: 20px; } }
    </style></head><body>
    ${reportRef.current.innerHTML}
    </body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportTitle.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded as HTML (open in browser and print as PDF)");
  };

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">Loading report data...</div>;
  if (!data) return <div className="p-6 text-center text-muted-foreground">No data available. Please select a project.</div>;

  const { summary, tasksByStatus, issuesByStatus, issuesByPriority, reqsByStatus, testsByStatus, crsByStatus, overdueTasks, highPriorityOpenIssues, recentDecisions, pendingCRs, tasksByResponsible, issuesByOwner, taskStatusByResponsible, riskScoreBreakdown, tasksInPeriod, issuesNeedingResolution, requirementsInPeriod } = data;

  const statusColor = (s: string) => {
    const l = s.toLowerCase();
    if (l.includes("done") || l.includes("completed") || l.includes("closed") || l.includes("passed") || l.includes("approved")) return "badge-green";
    if (l.includes("progress") || l.includes("review")) return "badge-blue";
    if (l.includes("open") || l.includes("pending") || l.includes("submitted")) return "badge-amber";
    if (l.includes("overdue") || l.includes("failed") || l.includes("rejected") || l.includes("blocked")) return "badge-red";
    return "badge-gray";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-gray-500" />
              Weekly Report Generator
            </h1>
            <p className="text-gray-500 text-sm mt-1">Generate a formatted status report for stakeholders</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Button onClick={handleDownloadHTML} className="bg-gray-900 hover:bg-gray-800 text-white gap-2">
              <Download className="w-4 h-4" /> Download Report
            </Button>
          </div>
        </div>
      </div>

      {/* Report Customization */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" /> Report Settings & Period</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1"><Label>Report Title</Label><Input value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} /></div>
          <div className="space-y-1"><Label>Prepared By</Label><Input value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} placeholder="Your name / role" /></div>
          <div className="space-y-1">
            <Label>Report Period — Start Date</Label>
            <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Report Period — End Date</Label>
            <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2"><Label>Key Highlights / Accomplishments</Label><Textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} placeholder="e.g., Completed UAT for Module X, resolved 5 critical issues..." rows={2} /></div>
          <div className="space-y-1"><Label>Risks & Blockers</Label><Textarea value={risksText} onChange={(e) => setRisksText(e.target.value)} placeholder="e.g., Dependency on SAP transport approval pending..." rows={2} /></div>
          <div className="space-y-1"><Label>Next Period's Plan</Label><Textarea value={nextSteps} onChange={(e) => setNextSteps(e.target.value)} placeholder="e.g., Begin SIT for Module Y, review open CRs..." rows={2} /></div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      <div className="border-2 border-dashed border-blue-200 rounded-xl p-2">
        <p className="text-center text-xs text-blue-500 mb-2">Report Preview (scroll to review, then download or print)</p>
        <div ref={reportRef} className="bg-white rounded-lg p-8 shadow-sm" style={{ fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#1a1a1a" }}>
          {/* Report Header */}
          <div style={{ borderBottom: "3px solid #0f4c75", paddingBottom: "16px", marginBottom: "20px" }}>
            <h1 style={{ color: "#0f4c75", fontSize: "22px", margin: "0 0 4px 0" }}>{reportTitle}</h1>
            <div style={{ color: "#555", fontSize: "12px" }}>
              <strong>Project:</strong> Project #{currentProjectId ?? "—"} &nbsp;|&nbsp;
              <strong>Period:</strong> {formatDate(periodStart)} – {formatDate(periodEnd)} &nbsp;|&nbsp;
              <strong>Date:</strong> {todayStr()}
              {preparedBy && <>&nbsp;|&nbsp;<strong>Prepared by:</strong> {preparedBy}</>}
            </div>
          </div>

          {/* 1. Executive Summary KPIs */}
          <h2 style={{ color: "#0f4c75", fontSize: "15px", borderBottom: "2px solid #0f4c75", paddingBottom: "4px", marginTop: "0" }}>1. Executive Summary</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", margin: "16px 0" }}>
            {[
              { value: summary.totalRequirements, label: "Requirements", icon: "📋" },
              { value: summary.totalTasks, label: "Total Tasks", icon: "✅" },
              { value: summary.totalIssues, label: "Total Issues", icon: "🐛" },
              { value: summary.totalRisks ?? 0, label: "Total Risks", icon: "⚡" },
              { value: summary.overdueTasks, label: "Overdue Tasks", icon: "⚠️", highlight: summary.overdueTasks > 0 },
              { value: summary.highPriorityOpenIssues, label: "High Priority Issues", icon: "🔴", highlight: summary.highPriorityOpenIssues > 0 },
              { value: summary.testPassRate + "%", label: "Test Pass Rate", icon: "📊" },
              { value: summary.totalCRs, label: "Change Requests", icon: "🔄" },
            ].map((kpi, i) => (
              <div key={i} style={{ background: kpi.highlight ? "#fff1f2" : "#f0f7ff", border: `1px solid ${kpi.highlight ? "#fecaca" : "#c8dff5"}`, borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: kpi.highlight ? "#dc2626" : "#0f4c75" }}>{kpi.icon} {kpi.value}</div>
                <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* 2. Key Highlights */}
          {highlights && (
            <>
              <h2 style={{ color: "#0f4c75", fontSize: "15px", borderBottom: "2px solid #0f4c75", paddingBottom: "4px", marginTop: "28px" }}>2. Key Highlights</h2>
              <div style={{ background: "#f0f7ff", borderLeft: "4px solid #0f4c75", padding: "12px 16px", borderRadius: "4px", margin: "8px 0", whiteSpace: "pre-wrap" }}>{highlights}</div>
            </>
          )}

          {/* 3. Tasks in Period */}
          <h2 style={{ color: "#0f4c75", fontSize: "15px", borderBottom: "2px solid #0f4c75", paddingBottom: "4px", marginTop: "28px" }}>3. Tasks Due in Period ({tasksInPeriod?.length ?? 0})</h2>
          {tasksInPeriod && tasksInPeriod.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", margin: "12px 0", fontSize: "12px" }}>
              <thead><tr>{["Task ID", "Description", "Due Date", "Status", "Responsible", "Priority"].map((h) => <th key={h} style={{ background: "#0f4c75", color: "white", padding: "8px 10px", textAlign: "left" }}>{h}</th>)}</tr></thead>
              <tbody>
                {tasksInPeriod.map((t, i) => (
                  <tr key={t.taskId}>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f9fafb", fontFamily: "monospace", fontWeight: "bold", color: "#0f4c75" }}>{t.taskId}</td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f9fafb" }}>{t.description?.slice(0, 60)}</td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f9fafb" }}>{t.dueDate ?? "—"}</td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f9fafb" }}>{t.status ?? "—"}</td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f9fafb" }}>{t.responsible ?? "—"}</td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f9fafb" }}>{t.priority ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{ color: "#888", fontSize: "12px", margin: "8px 0" }}>No tasks due in this period.</p>}

          {/* 4. Task Status Breakdown */}
          <h2 style={{ color: "#0f4c75", fontSize: "15px", borderBottom: "2px solid #0f4c75", paddingBottom: "4px", marginTop: "28px" }}>4. Overall Task Status Breakdown</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", margin: "12px 0", fontSize: "12px" }}>
            <thead><tr>{["Status", "Count", "% of Total"].map((h) => <th key={h} style={{ background: "#0f4c75", color: "white", padding: "8px 10px", textAlign: "left" }}>{h}</th>)}</tr></thead>
            <tbody>
              {Object.entries(tasksByStatus).map(([status, count], i) => (
                <tr key={status}><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f9fafb" }}>{status}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f9fafb", fontWeight: "bold" }}>{count}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f9fafb" }}>{summary.totalTasks > 0 ? Math.round((count / summary.totalTasks) * 100) : 0}%</td></tr>
              ))}
            </tbody>
          </table>

          {/* 5. Task Status per Responsible */}
          {taskStatusByResponsible && Object.keys(taskStatusByResponsible).length > 0 && (
            <>
              <h2 style={{ color: "#0f4c75", fontSize: "15px", borderBottom: "2px solid #0f4c75", paddingBottom: "4px", marginTop: "28px" }}>5. Task Status per Responsible</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "12px 0", fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th style={{ background: "#0f4c75", color: "white", padding: "8px 10px", textAlign: "left" }}>Responsible</th>
                    {Array.from(new Set(Object.values(taskStatusByResponsible).flatMap(s => Object.keys(s)))).map(status => (
                      <th key={status} style={{ background: "#0f4c75", color: "white", padding: "8px 10px", textAlign: "center" }}>{status}</th>
                    ))}
                    <th style={{ background: "#0f4c75", color: "white", padding: "8px 10px", textAlign: "center" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(taskStatusByResponsible).map(([resp, statuses], i) => {
                    const allStatuses = Array.from(new Set(Object.values(taskStatusByResponsible).flatMap(s => Object.keys(s))));
                    const total = Object.values(statuses).reduce((a, b) => a + b, 0);
                    return (
                      <tr key={resp}>
                        <td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f9fafb", fontWeight: "bold" }}>{resp}</td>
                        {allStatuses.map(status => (
                          <td key={status} style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f9fafb", textAlign: "center" }}>{statuses[status] ?? 0}</td>
                        ))}
                        <td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f9fafb", textAlign: "center", fontWeight: "bold" }}>{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {/* 6. Issues Needing Resolution in Period */}
          <h2 style={{ color: "#d97706", fontSize: "15px", borderBottom: "2px solid #d97706", paddingBottom: "4px", marginTop: "28px" }}>6. Issues Requiring Resolution in Period ({issuesNeedingResolution?.length ?? 0})</h2>
          {issuesNeedingResolution && issuesNeedingResolution.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", margin: "12px 0", fontSize: "12px" }}>
              <thead><tr>{["Issue ID", "Description", "Resolution Date", "Priority", "Status", "Owner"].map((h) => <th key={h} style={{ background: "#d97706", color: "white", padding: "8px 10px", textAlign: "left" }}>{h}</th>)}</tr></thead>
              <tbody>
                {issuesNeedingResolution.map((i, idx) => (
                  <tr key={i.issueId}>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: idx % 2 === 0 ? "white" : "#fffbeb", fontFamily: "monospace", fontWeight: "bold", color: "#d97706" }}>{i.issueId}</td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: idx % 2 === 0 ? "white" : "#fffbeb" }}>{i.description?.slice(0, 60)}</td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: idx % 2 === 0 ? "white" : "#fffbeb", fontWeight: "bold", color: "#dc2626" }}>{i.resolutionDate ?? "—"}</td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: idx % 2 === 0 ? "white" : "#fffbeb" }}>{i.priority ?? "—"}</td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: idx % 2 === 0 ? "white" : "#fffbeb" }}>{i.status ?? "—"}</td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: idx % 2 === 0 ? "white" : "#fffbeb" }}>{i.owner ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{ color: "#888", fontSize: "12px", margin: "8px 0" }}>No issues requiring resolution in this period.</p>}

          {/* 7. High Priority Open Issues */}
          {highPriorityOpenIssues.length > 0 && (
            <>
              <h2 style={{ color: "#dc2626", fontSize: "15px", borderBottom: "2px solid #dc2626", paddingBottom: "4px", marginTop: "28px" }}>7. High Priority Open Issues ({highPriorityOpenIssues.length})</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "12px 0", fontSize: "12px" }}>
                <thead><tr>{["Issue ID", "Description", "Priority", "Status", "Owner"].map((h) => <th key={h} style={{ background: "#dc2626", color: "white", padding: "8px 10px", textAlign: "left" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {highPriorityOpenIssues.map((i, idx) => (
                    <tr key={i.issueId}><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: idx % 2 === 0 ? "white" : "#fef2f2", fontFamily: "monospace", fontWeight: "bold", color: "#dc2626" }}>{i.issueId}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: idx % 2 === 0 ? "white" : "#fef2f2" }}>{i.description?.slice(0, 60)}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: idx % 2 === 0 ? "white" : "#fef2f2" }}>{i.priority ?? "—"}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: idx % 2 === 0 ? "white" : "#fef2f2" }}>{i.status ?? "—"}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: idx % 2 === 0 ? "white" : "#fef2f2" }}>{i.owner ?? "—"}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* 8. Issue per Owner */}
          {issuesByOwner && Object.keys(issuesByOwner).length > 0 && (
            <>
              <h2 style={{ color: "#d97706", fontSize: "15px", borderBottom: "2px solid #d97706", paddingBottom: "4px", marginTop: "28px" }}>8. Issues per Owner</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "12px 0", fontSize: "12px" }}>
                <thead><tr>{["Owner", "Issue Count"].map((h) => <th key={h} style={{ background: "#d97706", color: "white", padding: "8px 10px", textAlign: "left" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {Object.entries(issuesByOwner).sort((a, b) => b[1] - a[1]).map(([owner, count], i) => (
                    <tr key={owner}><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#fffbeb" }}>{owner}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#fffbeb", fontWeight: "bold" }}>{count}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* 9. Requirements Gathered in Period */}
          <h2 style={{ color: "#0f766e", fontSize: "15px", borderBottom: "2px solid #0f766e", paddingBottom: "4px", marginTop: "28px" }}>9. Requirements Gathered in Period ({requirementsInPeriod?.length ?? 0})</h2>
          {requirementsInPeriod && requirementsInPeriod.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", margin: "12px 0", fontSize: "12px" }}>
              <thead><tr>{["Req ID", "Description", "Status", "Priority", "Owner"].map((h) => <th key={h} style={{ background: "#0f766e", color: "white", padding: "8px 10px", textAlign: "left" }}>{h}</th>)}</tr></thead>
              <tbody>
                {requirementsInPeriod.map((r, i) => (
                  <tr key={r.idCode}><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f0fdfa", fontFamily: "monospace", fontWeight: "bold", color: "#0f766e" }}>{r.idCode}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f0fdfa" }}>{(r.description ?? "")?.slice(0, 70)}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f0fdfa" }}>{r.status ?? "—"}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f0fdfa" }}>{r.priority ?? "—"}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f0fdfa" }}>{r.owner ?? "—"}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{ color: "#888", fontSize: "12px", margin: "8px 0" }}>No requirements gathered in this period.</p>}

          {/* 10. Risk Status */}
          {riskScoreBreakdown && (
            <>
              <h2 style={{ color: "#7c3aed", fontSize: "15px", borderBottom: "2px solid #7c3aed", paddingBottom: "4px", marginTop: "28px" }}>10. Risk Status Overview (Total: {summary.totalRisks ?? 0})</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", margin: "12px 0" }}>
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
            </>
          )}

          {/* 11. Overdue Tasks */}
          {overdueTasks.length > 0 && (
            <>
              <h2 style={{ color: "#dc2626", fontSize: "15px", borderBottom: "2px solid #dc2626", paddingBottom: "4px", marginTop: "28px" }}>11. Overdue Tasks ({overdueTasks.length})</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "12px 0", fontSize: "12px" }}>
                <thead><tr>{["Task ID", "Description", "Due Date", "Status", "Responsible"].map((h) => <th key={h} style={{ background: "#dc2626", color: "white", padding: "8px 10px", textAlign: "left" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {overdueTasks.map((t, i) => (
                    <tr key={t.taskId}><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#fef2f2", fontFamily: "monospace", fontWeight: "bold", color: "#dc2626" }}>{t.taskId}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#fef2f2" }}>{t.description?.slice(0, 60)}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#fef2f2" }}>{t.dueDate ?? "—"}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#fef2f2" }}>{t.status ?? "—"}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#fef2f2" }}>{t.responsible ?? "—"}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* 12. Pending CRs */}
          {pendingCRs.length > 0 && (
            <>
              <h2 style={{ color: "#7c3aed", fontSize: "15px", borderBottom: "2px solid #7c3aed", paddingBottom: "4px", marginTop: "28px" }}>12. Pending Change Requests ({pendingCRs.length})</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "12px 0", fontSize: "12px" }}>
                <thead><tr>{["CR ID", "Title", "Priority", "Status", "Requested By"].map((h) => <th key={h} style={{ background: "#7c3aed", color: "white", padding: "8px 10px", textAlign: "left" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {pendingCRs.map((cr, i) => (
                    <tr key={cr.crId}><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#faf5ff", fontFamily: "monospace", fontWeight: "bold", color: "#7c3aed" }}>{cr.crId}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#faf5ff" }}>{cr.title?.slice(0, 60)}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#faf5ff" }}>{cr.priority ?? "—"}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#faf5ff" }}>{cr.status ?? "—"}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#faf5ff" }}>{cr.requestedBy ?? "—"}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* 13. Recent Decisions */}
          {recentDecisions.length > 0 && (
            <>
              <h2 style={{ color: "#0f766e", fontSize: "15px", borderBottom: "2px solid #0f766e", paddingBottom: "4px", marginTop: "28px" }}>13. Recent Decisions</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "12px 0", fontSize: "12px" }}>
                <thead><tr>{["Decision ID", "Title", "Date", "Status", "Decided By"].map((h) => <th key={h} style={{ background: "#0f766e", color: "white", padding: "8px 10px", textAlign: "left" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {recentDecisions.map((d, i) => (
                    <tr key={d.decisionId}><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f0fdfa", fontFamily: "monospace", fontWeight: "bold", color: "#0f766e" }}>{d.decisionId}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f0fdfa" }}>{d.title?.slice(0, 60)}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f0fdfa" }}>{formatDate(d.decisionDate)}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f0fdfa" }}>{d.status ?? "—"}</td><td style={{ padding: "7px 10px", borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#f0fdfa" }}>{d.decidedBy ?? "—"}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {risksText && (
            <>
              <h2 style={{ color: "#dc2626", fontSize: "15px", borderBottom: "2px solid #dc2626", paddingBottom: "4px", marginTop: "28px" }}>14. Risks & Blockers</h2>
              <div style={{ background: "#fff1f2", borderLeft: "4px solid #dc2626", padding: "12px 16px", borderRadius: "4px", margin: "8px 0", whiteSpace: "pre-wrap" }}>{risksText}</div>
            </>
          )}

          {nextSteps && (
            <>
              <h2 style={{ color: "#0f4c75", fontSize: "15px", borderBottom: "2px solid #0f4c75", paddingBottom: "4px", marginTop: "28px" }}>15. Next Period's Plan</h2>
              <div style={{ background: "#f0f7ff", borderLeft: "4px solid #0f4c75", padding: "12px 16px", borderRadius: "4px", margin: "8px 0", whiteSpace: "pre-wrap" }}>{nextSteps}</div>
            </>
          )}

          {/* Footer */}
          <div style={{ marginTop: "40px", borderTop: "1px solid #e5e7eb", paddingTop: "12px", color: "#888", fontSize: "11px" }}>
            Generated by Project Management SSOT &nbsp;|&nbsp; {todayStr()} &nbsp;|&nbsp; {preparedBy || "Project Manager"}
          </div>
        </div>
      </div>
    </div>
  );
}
