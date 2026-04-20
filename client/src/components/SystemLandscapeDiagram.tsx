import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
  ReactFlowProvider,
  Handle,
  Position,
  NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { Search, Network } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
export interface Portfolio {
  id: number;
  name: string;
  description?: string | null;
}
export interface Program {
  id: number;
  name: string;
  description?: string | null;
  portfolioId?: number | null;
}
export interface Project {
  id: number;
  name: string;
  status?: string | null;
  programId?: number | null;
  portfolioId?: number | null;
}

interface Props {
  portfolios: Portfolio[];
  programs: Program[];
  projects: Project[];
}

// ── Custom node: Portfolio ────────────────────────────────────────────────────
function PortfolioNode({ data, selected }: NodeProps) {
  const progCount = data.programCount ?? 0;
  const projCount = data.projectCount ?? 0;
  return (
    <div
      className={`relative rounded-xl border-2 px-5 py-4 min-w-[180px] text-center cursor-pointer transition-all ${
        selected ? "border-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "border-blue-400"
      }`}
      style={{ background: "rgba(15,30,60,0.92)" }}
    >
      <Handle type="source" position={Position.Bottom} style={{ background: "#60a5fa", width: 12, height: 12, border: "2px solid #1e3a5f" }} />
      <div className="text-[10px] font-bold tracking-widest text-blue-400 mb-1">PORTFOLIO</div>
      <div className="text-white font-bold text-sm leading-tight">{data.label}</div>
      {(progCount > 0 || projCount > 0) && (
        <div className="text-[11px] text-blue-300 mt-1.5">
          {progCount > 0 && `${progCount} prog`}{progCount > 0 && projCount > 0 && " · "}{projCount > 0 && `${projCount} proj`}
        </div>
      )}
    </div>
  );
}

// ── Custom node: Program ──────────────────────────────────────────────────────
function ProgramNode({ data, selected }: NodeProps) {
  const projCount = data.projectCount ?? 0;
  return (
    <div
      className={`relative rounded-xl border-2 px-5 py-4 min-w-[180px] text-center cursor-pointer transition-all ${
        selected ? "border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.5)]" : "border-amber-500"
      }`}
      style={{ background: "rgba(40,25,5,0.92)" }}
    >
      <Handle type="target" position={Position.Top} style={{ background: "#f59e0b", width: 12, height: 12, border: "2px solid #451a03" }} />
      <Handle type="source" position={Position.Bottom} style={{ background: "#f59e0b", width: 12, height: 12, border: "2px solid #451a03" }} />
      <div className="text-[10px] font-bold tracking-widest text-amber-400 mb-1">PROGRAM</div>
      <div className="text-white font-bold text-sm leading-tight truncate max-w-[160px] mx-auto">{data.label}</div>
      {projCount > 0 && (
        <div className="text-[11px] text-amber-300 mt-1.5">{projCount} project{projCount !== 1 ? "s" : ""}</div>
      )}
    </div>
  );
}

// ── Custom node: Project ──────────────────────────────────────────────────────
const PROJECT_STATUS_COLORS: Record<string, { border: string; text: string; statusColor: string }> = {
  Active:    { border: "#22c55e", text: "#86efac", statusColor: "#22c55e" },
  Planning:  { border: "#3b82f6", text: "#93c5fd", statusColor: "#3b82f6" },
  "On Hold": { border: "#eab308", text: "#fde047", statusColor: "#eab308" },
  Completed: { border: "#6b7280", text: "#d1d5db", statusColor: "#6b7280" },
  Cancelled: { border: "#ef4444", text: "#fca5a5", statusColor: "#ef4444" },
};

function ProjectNode({ data, selected }: NodeProps) {
  const colors = PROJECT_STATUS_COLORS[data.status] ?? { border: "#22c55e", text: "#86efac", statusColor: "#22c55e" };
  return (
    <div
      className={`relative rounded-xl border-2 px-5 py-4 min-w-[160px] text-center cursor-pointer transition-all ${
        selected ? "shadow-[0_0_20px_rgba(34,197,94,0.5)]" : ""
      }`}
      style={{ background: "rgba(5,25,15,0.92)", borderColor: colors.border }}
    >
      <Handle type="target" position={Position.Top} style={{ background: colors.border, width: 12, height: 12, border: "2px solid #052e16" }} />
      <div className="text-[10px] font-bold tracking-widest mb-1" style={{ color: colors.text }}>PROJECT</div>
      <div className="text-white font-bold text-sm leading-tight truncate max-w-[150px] mx-auto">{data.label}</div>
      {data.status && (
        <div className="text-[11px] mt-1.5 font-medium" style={{ color: colors.statusColor }}>{data.status}</div>
      )}
    </div>
  );
}

// ── Node type registry ────────────────────────────────────────────────────────
const nodeTypes = {
  portfolio: PortfolioNode,
  program: ProgramNode,
  project: ProjectNode,
};

// ── Layout constants ──────────────────────────────────────────────────────────
const NODE_W = 200;
const NODE_H = 90;
const H_GAP = 60;
const ROW_Y = { portfolio: 60, program: 280, project: 500 };

// ── Main component (inner) ────────────────────────────────────────────────────
function SystemLandscapeDiagramInner({ portfolios, programs, projects }: Props) {
  const [filter, setFilter] = useState<"all" | "portfolio" | "program" | "project">("all");
  const [search, setSearch] = useState("");
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // Build nodes + edges from data
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // ── Portfolio nodes ──
    const filteredPortfolios = portfolios.filter(p =>
      !search || p.name.toLowerCase().includes(search.toLowerCase())
    );
    const filteredPrograms = programs.filter(p =>
      !search || p.name.toLowerCase().includes(search.toLowerCase())
    );
    const filteredProjects = projects.filter(p =>
      !search || p.name.toLowerCase().includes(search.toLowerCase())
    );

    const showPortfolios = filter === "all" || filter === "portfolio";
    const showPrograms = filter === "all" || filter === "program";
    const showProjects = filter === "all" || filter === "project";

    // Count programs/projects per portfolio
    const progCountByPortfolio: Record<number, number> = {};
    const projCountByProgram: Record<number, number> = {};
    programs.forEach(p => { if (p.portfolioId) progCountByPortfolio[p.portfolioId] = (progCountByPortfolio[p.portfolioId] ?? 0) + 1; });
    projects.forEach(p => { if (p.programId) projCountByProgram[p.programId] = (projCountByProgram[p.programId] ?? 0) + 1; });
    const projCountByPortfolio: Record<number, number> = {};
    projects.forEach(p => { if (p.portfolioId && !p.programId) projCountByPortfolio[p.portfolioId] = (projCountByPortfolio[p.portfolioId] ?? 0) + 1; });

    // Layout portfolios
    const displayPortfolios = showPortfolios ? filteredPortfolios : [];
    const totalPortfolioW = displayPortfolios.length * (NODE_W + H_GAP) - H_GAP;
    const portfolioCenterX = Math.max(600, totalPortfolioW / 2 + 200);

    displayPortfolios.forEach((p, i) => {
      const x = portfolioCenterX - totalPortfolioW / 2 + i * (NODE_W + H_GAP);
      nodes.push({
        id: `portfolio-${p.id}`,
        type: "portfolio",
        position: { x, y: ROW_Y.portfolio },
        data: {
          label: p.name,
          description: p.description,
          programCount: progCountByPortfolio[p.id] ?? 0,
          projectCount: (projCountByPortfolio[p.id] ?? 0) + (projCountByProgram[p.id] ?? 0),
          raw: p,
          nodeType: "portfolio",
        },
        draggable: true,
      });
    });

    // Layout programs
    const displayPrograms = showPrograms ? filteredPrograms : [];
    const totalProgramW = displayPrograms.length * (NODE_W + H_GAP) - H_GAP;
    const programCenterX = Math.max(600, totalProgramW / 2 + 200);

    displayPrograms.forEach((p, i) => {
      const x = programCenterX - totalProgramW / 2 + i * (NODE_W + H_GAP);
      nodes.push({
        id: `program-${p.id}`,
        type: "program",
        position: { x, y: ROW_Y.program },
        data: {
          label: p.name,
          description: p.description,
          projectCount: projCountByProgram[p.id] ?? 0,
          raw: p,
          nodeType: "program",
        },
        draggable: true,
      });

      // Edge: portfolio → program
      if (p.portfolioId && showPortfolios) {
        edges.push({
          id: `e-portfolio-${p.portfolioId}-program-${p.id}`,
          source: `portfolio-${p.portfolioId}`,
          target: `program-${p.id}`,
          type: "default",
          animated: false,
          style: { stroke: "#f59e0b", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b", width: 12, height: 12 },
        });
      }
    });

    // Layout projects
    const displayProjects = showProjects ? filteredProjects : [];
    const totalProjectW = displayProjects.length * (NODE_W + H_GAP) - H_GAP;
    const projectCenterX = Math.max(600, totalProjectW / 2 + 200);

    displayProjects.forEach((p, i) => {
      const x = projectCenterX - totalProjectW / 2 + i * (NODE_W + H_GAP);
      nodes.push({
        id: `project-${p.id}`,
        type: "project",
        position: { x, y: ROW_Y.project },
        data: {
          label: p.name,
          status: p.status,
          raw: p,
          nodeType: "project",
        },
        draggable: true,
      });

      // Edge: program → project (solid)
      if (p.programId && showPrograms) {
        edges.push({
          id: `e-program-${p.programId}-project-${p.id}`,
          source: `program-${p.programId}`,
          target: `project-${p.id}`,
          type: "default",
          animated: false,
          style: { stroke: "#f59e0b", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b", width: 12, height: 12 },
        });
      }

      // Edge: portfolio → project directly (dashed)
      if (p.portfolioId && !p.programId && showPortfolios) {
        edges.push({
          id: `e-portfolio-${p.portfolioId}-project-${p.id}`,
          source: `portfolio-${p.portfolioId}`,
          target: `project-${p.id}`,
          type: "default",
          animated: false,
          style: { stroke: "#60a5fa", strokeWidth: 1.5, strokeDasharray: "6 4" },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa", width: 12, height: 12 },
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [portfolios, programs, projects, filter, search]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when data/filter/search changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data);
  }, []);

  const isEmpty = portfolios.length === 0 && programs.length === 0 && projects.length === 0;

  return (
    <div className="flex flex-col h-full" style={{ background: "#0a0f1a" }}>
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10" style={{ background: "#0d1424" }}>
        {/* Filter pills */}
        {(["all", "portfolio", "program", "project"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filter === f
                ? f === "all"
                  ? "bg-red-500 text-white"
                  : f === "portfolio"
                  ? "bg-blue-500 text-white"
                  : f === "program"
                  ? "bg-amber-500 text-white"
                  : "bg-green-500 text-white"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1) + "s"}
          </button>
        ))}

        {/* Search */}
        <div className="relative ml-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-8 pr-3 py-1 rounded-full text-xs bg-white/10 text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-white/30 w-44"
          />
        </div>

        <div className="ml-auto text-[11px] text-white/30">
          Click nodes to view details · Drag nodes to reposition
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 px-4 py-1.5 text-[11px] text-white/50 border-b border-white/5">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-blue-400 inline-block" /> Portfolio</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-amber-500 inline-block" /> Program</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-green-500 inline-block" /> Project</span>
        <span className="flex items-center gap-1.5"><span className="w-8 border-t border-white/40 inline-block" /> Link</span>
        <span className="flex items-center gap-1.5"><span className="w-8 border-t border-dashed border-white/40 inline-block" /> Direct Link</span>
        <span className="text-white/30 ml-1">Drag from <strong className="text-white/50">bottom port</strong> of a node to <strong className="text-white/50">top port</strong> of another to connect.</span>
      </div>

      {/* ── Canvas ── */}
      <div className="flex flex-1 min-h-0">
        {/* Row labels */}
        <div className="flex flex-col justify-start w-10 shrink-0 pt-4 gap-0" style={{ background: "#0a0f1a" }}>
          {[
            { label: "Portfolios", y: ROW_Y.portfolio + 30 },
            { label: "Programs", y: ROW_Y.program + 30 },
            { label: "Projects", y: ROW_Y.project + 30 },
          ].map(({ label, y }) => (
            <div
              key={label}
              className="absolute text-[10px] text-white/25 font-semibold tracking-widest"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", top: y + 60, left: 4 }}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="flex-1 relative">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-white/30">
              <Network className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">No portfolios, programs or projects yet.</p>
              <p className="text-xs mt-1 opacity-60">Create items in the Portfolios and Programs tabs to see the hierarchy here.</p>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              minZoom={0.3}
              maxZoom={2}
              style={{ background: "#0a0f1a" }}
              defaultEdgeOptions={{
                type: "default",
                style: { stroke: "#f59e0b", strokeWidth: 1.5 },
              }}
            >
              <Background variant={BackgroundVariant.Dots} color="#1e2a3a" gap={24} size={1} />
              <Controls
                style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.1)" }}
                showInteractive={false}
              />
            </ReactFlow>
          )}
        </div>
      </div>

      {/* ── Detail panel (bottom slide-up) ── */}
      {selectedNode && (
        <div
          className="absolute bottom-0 right-0 w-80 rounded-tl-xl border border-white/10 p-4 z-50"
          style={{ background: "#0d1424" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded ${
              selectedNode.nodeType === "portfolio" ? "bg-blue-500/20 text-blue-300" :
              selectedNode.nodeType === "program" ? "bg-amber-500/20 text-amber-300" :
              "bg-green-500/20 text-green-300"
            }`}>
              {(selectedNode.nodeType ?? "").toUpperCase()}
            </span>
            <button onClick={() => setSelectedNode(null)} className="text-white/30 hover:text-white/70 text-lg leading-none">×</button>
          </div>
          <div className="text-white font-bold text-base mb-1">{selectedNode.label}</div>
          {selectedNode.description && (
            <p className="text-white/50 text-xs mb-2">{selectedNode.description}</p>
          )}
          {selectedNode.nodeType === "portfolio" && (
            <div className="flex gap-3 text-xs text-white/40 mt-2">
              <span>{selectedNode.programCount} program{selectedNode.programCount !== 1 ? "s" : ""}</span>
              <span>·</span>
              <span>{selectedNode.projectCount} project{selectedNode.projectCount !== 1 ? "s" : ""}</span>
            </div>
          )}
          {selectedNode.nodeType === "program" && (
            <div className="text-xs text-white/40 mt-2">{selectedNode.projectCount} project{selectedNode.projectCount !== 1 ? "s" : ""}</div>
          )}
          {selectedNode.nodeType === "project" && selectedNode.status && (
            <div className="text-xs mt-2" style={{ color: PROJECT_STATUS_COLORS[selectedNode.status]?.statusColor ?? "#22c55e" }}>
              {selectedNode.status}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Export wrapped with ReactFlowProvider ─────────────────────────────────────
export default function SystemLandscapeDiagram(props: Props) {
  return (
    <ReactFlowProvider>
      <SystemLandscapeDiagramInner {...props} />
    </ReactFlowProvider>
  );
}
