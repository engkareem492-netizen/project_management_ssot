import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, BookOpen, ClipboardList, Bug, FileText, Link2, ArrowRight, CheckSquare, Activity } from "lucide-react";

/* ── Concept relationship diagram (SVG) ─────────────────────────────────── */
function ConceptDiagram() {
  return (
    <svg viewBox="0 0 760 420" className="w-full max-w-3xl mx-auto" style={{ fontFamily: "inherit" }}>
      {/* ── Arrows ─────────────────────────────────────────────────────── */}
      {/* Requirement → UserStory */}
      <defs>
        <marker id="arrowBlue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#3b82f6" />
        </marker>
      </defs>
      {/* Req → UserStory (1:n) */}
      <line x1="185" y1="130" x2="310" y2="130" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowBlue)" />
      <text x="220" y="122" fontSize="10" fill="#94a3b8">create/assign (1:n)</text>
      {/* Feature → UserStory (n:1) */}
      <line x1="580" y1="130" x2="455" y2="130" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowBlue)" />
      <text x="480" y="122" fontSize="10" fill="#94a3b8">assign (n:1)</text>
      {/* Feature → UserStory create (n:1) */}
      <line x1="580" y1="150" x2="455" y2="150" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowBlue)" />
      <text x="460" y="168" fontSize="10" fill="#94a3b8">create/assign (n:1)</text>
      {/* Req → Feature (1:n top arc) */}
      <path d="M 110 100 Q 380 30 640 100" stroke="#3b82f6" strokeWidth="2" fill="none" markerEnd="url(#arrowBlue)" />
      <text x="310" y="42" fontSize="10" fill="#94a3b8">create/assign (1:n)</text>
      {/* UserStory → TestCase (n:m) */}
      <line x1="380" y1="165" x2="380" y2="255" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowBlue)" />
      <text x="388" y="215" fontSize="10" fill="#94a3b8">assign (n:m)</text>
      {/* Req → TestCase (n:m) */}
      <line x1="140" y1="165" x2="310" y2="270" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowBlue)" />
      <text x="148" y="230" fontSize="10" fill="#94a3b8">assign (n:m)</text>
      {/* Defect → TestCase (n:m) */}
      <line x1="590" y1="270" x2="455" y2="290" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowBlue)" />
      <text x="490" y="265" fontSize="10" fill="#94a3b8">create/assign (n:m)</text>
      {/* TestPlan → TestCase (n:m) */}
      <line x1="380" y1="375" x2="380" y2="335" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowBlue)" />
      <text x="388" y="360" fontSize="10" fill="#94a3b8">assign (n:m)</text>

      {/* ── Nodes ──────────────────────────────────────────────────────── */}
      {/* Requirement */}
      <rect x="40" y="100" width="145" height="55" rx="6" fill="none" stroke="#a855f7" strokeWidth="2.5" />
      <text x="112" y="132" textAnchor="middle" fontSize="14" fill="#a855f7" fontWeight="600">Requirement</text>

      {/* User Story */}
      <rect x="310" y="100" width="145" height="55" rx="6" fill="none" stroke="#22c55e" strokeWidth="2.5" />
      <text x="382" y="132" textAnchor="middle" fontSize="14" fill="#22c55e" fontWeight="600">User Story</text>

      {/* Feature */}
      <rect x="580" y="100" width="130" height="55" rx="6" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
      <text x="645" y="132" textAnchor="middle" fontSize="14" fill="#3b82f6" fontWeight="600">Feature</text>

      {/* Test Case */}
      <rect x="310" y="260" width="145" height="55" rx="6" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
      <text x="382" y="292" textAnchor="middle" fontSize="14" fill="#f59e0b" fontWeight="600">Test Case</text>

      {/* Test Plan */}
      <rect x="310" y="370" width="145" height="45" rx="6" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
      <text x="382" y="397" textAnchor="middle" fontSize="14" fill="#f59e0b" fontWeight="600">Test Plan</text>

      {/* Defect */}
      <rect x="570" y="260" width="120" height="55" rx="6" fill="none" stroke="#ef4444" strokeWidth="2.5" />
      <text x="630" y="292" textAnchor="middle" fontSize="14" fill="#ef4444" fontWeight="600">Defect</text>
    </svg>
  );
}

/* ── Workflow step card ──────────────────────────────────────────────────── */
function Step({ num, title, desc, color, icon: Icon }: { num: number; title: string; desc: string; color: string; icon: React.ElementType }) {
  return (
    <div className="flex gap-4 items-start">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${color}`}>{num}</div>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

export default function ConceptGuidePage() {
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Link2 className="w-6 h-6 text-primary" /> Requirements Management — Concept Guide</h1>
        <p className="text-sm text-muted-foreground mt-1">How the six entities relate to each other and how to use them in your project</p>
      </div>

      {/* Diagram */}
      <Card className="p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-base">Entity Relationship Diagram</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ConceptDiagram />
          <div className="flex flex-wrap gap-3 mt-4 justify-center text-xs">
            {[
              { label: "Requirement", color: "border-purple-500 text-purple-400" },
              { label: "User Story", color: "border-green-500 text-green-400" },
              { label: "Feature", color: "border-blue-500 text-blue-400" },
              { label: "Test Case", color: "border-yellow-500 text-yellow-400" },
              { label: "Test Plan", color: "border-yellow-500 text-yellow-400" },
              { label: "Defect", color: "border-red-500 text-red-400" },
            ].map(e => <Badge key={e.label} variant="outline" className={e.color}>{e.label}</Badge>)}
          </div>
        </CardContent>
      </Card>

      {/* Relationship Table */}
      <Card className="p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-base">Relationship Reference</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 pr-4">From</th>
                <th className="text-left py-2 pr-4">To</th>
                <th className="text-left py-2 pr-4">Cardinality</th>
                <th className="text-left py-2">Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { from: "Requirement", to: "User Story", card: "1 : n", meaning: "One requirement can spawn many user stories" },
                { from: "Requirement", to: "Feature", card: "1 : n", meaning: "A requirement can be grouped under many features" },
                { from: "Feature", to: "User Story", card: "n : 1", meaning: "Many user stories belong to one feature" },
                { from: "User Story", to: "Test Case", card: "n : m", meaning: "Stories verified by multiple test cases; test cases cover multiple stories" },
                { from: "Requirement", to: "Test Case", card: "n : m", meaning: "Direct traceability: requirements verified by test cases" },
                { from: "Test Plan", to: "Test Case", card: "n : m", meaning: "A test plan groups many test cases; a test case can appear in multiple plans" },
                { from: "Defect", to: "Test Case", card: "n : m", meaning: "Defects found during test execution; one defect may affect multiple test cases" },
              ].map((r, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="py-2 pr-4 font-medium">{r.from}</td>
                  <td className="py-2 pr-4 font-medium">{r.to}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-primary">{r.card}</td>
                  <td className="py-2 text-muted-foreground">{r.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* How to Use — Step by Step */}
      <Card className="p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-base">Recommended Workflow</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-5">
          <Step num={1} title="Define Requirements" icon={FileText} color="bg-purple-500/20 text-purple-400"
            desc="Start in Requirements Register. Capture every stakeholder need, constraint, or business rule. Assign a unique REQ-XXXX code, priority, and owner." />
          <Step num={2} title="Create Features" icon={Layers} color="bg-blue-500/20 text-blue-400"
            desc="Go to Features and define high-level product capabilities (FT-XXXX). Link the relevant Requirements to each Feature using the 'Link Requirement' button in the Feature detail panel." />
          <Step num={3} title="Write User Stories" icon={BookOpen} color="bg-green-500/20 text-green-400"
            desc="In User Stories, write 'As a [role], I want [goal], so that [benefit]' stories (US-XXXX). Assign each story to a Feature and link the parent Requirements. Add Acceptance Criteria and Story Points." />
          <Step num={4} title="Build Test Cases" icon={CheckSquare} color="bg-yellow-500/20 text-yellow-400"
            desc="In Test Cases, create test cases (TC-XXXX) with steps and expected results. Link them to User Stories and Requirements for full traceability. Set priority and assign an owner." />
          <Step num={5} title="Organise Test Plans" icon={ClipboardList} color="bg-yellow-500/20 text-yellow-400"
            desc="Create Test Plans (TP-XXXX) for each sprint or release cycle. Assign test cases to the plan. Set start/end dates and track plan status (Draft → Active → Completed)." />
          <Step num={6} title="Log Defects" icon={Bug} color="bg-red-500/20 text-red-400"
            desc="When a test case fails, log a Defect (DF-XXXX) with severity, steps to reproduce, expected vs. actual results. Link it to the failing test case(s). Track through Open → Fixed → Verified → Closed." />
          <Step num={7} title="Monitor with CFD" icon={Activity} color="bg-primary/20 text-primary"
            desc="On the Dashboard, the Cumulative Flow Diagram shows task status distribution over time. Click 'Save Snapshot' daily (or automate it) to build the trend. A healthy project shows the Done band growing steadily." />
        </CardContent>
      </Card>

      {/* CFD Explanation */}
      <Card className="p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" /> How to Read the Cumulative Flow Diagram</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-3 text-sm text-muted-foreground">
          <p>The CFD is a stacked area chart showing the <strong className="text-foreground">percentage of tasks in each status</strong> on each snapshot date. The four bands are:</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { color: "bg-gray-400/30 border-gray-400/50", label: "Open (grey)", desc: "Tasks not yet started. A shrinking Open band means work is being picked up." },
              { color: "bg-blue-500/20 border-blue-500/40", label: "In Progress (blue)", desc: "Actively being worked on. A wide band indicates WIP limit may be exceeded." },
              { color: "bg-red-500/20 border-red-500/40", label: "Blocked (red)", desc: "Impediments preventing progress. Any red band warrants immediate attention." },
              { color: "bg-green-500/20 border-green-500/40", label: "Done (green)", desc: "Completed tasks. A steadily growing Done band indicates healthy throughput." },
            ].map(b => (
              <div key={b.label} className={`rounded-lg p-3 border ${b.color}`}>
                <p className="font-semibold text-foreground text-xs mb-1">{b.label}</p>
                <p className="text-xs">{b.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-2"><strong className="text-foreground">Tip:</strong> Save a snapshot at the end of each day or sprint. The more data points you have, the more useful the trend becomes for forecasting completion.</p>
        </CardContent>
      </Card>
    </div>
  );
}
