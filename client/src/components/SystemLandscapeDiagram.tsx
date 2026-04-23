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
  addEdge,
  Connection,
  MarkerType,
  ReactFlowProvider,
  Handle,
  Position,
  NodeProps,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";
import { Search, Network } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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
  /** Called after a link is persisted so the parent can refetch data */
  onLinkCreated?: () => void;
}

// ── Custom node: Portfolio ────────────────────────────────────────────────────
function PortfolioNode({ data, selected }: NodeProps) {
  const progCount = data.programCount ?? 0;
  const projCount = data.projectCount ?? 0;
  return (
    <div
      className={`relative rounded-xl border-2 px-5 py-4 text-center cursor-pointer transition-all ${
        selected
          ? "border-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
          : "border-blue-400"
      }`}
      style={{ background: "rgba(15,30,60,0.92)", minWidth: 180, maxWidth: 220 }}
    >
      {/* Target handle at top — allows incoming connections */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#60a5fa", width: 14, height: 14, border: "2px solid #1e3a5f" }}
      />
      {/* Source handle at bottom — drag from here to connect */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#60a5fa", width: 14, height: 14, border: "2px solid #1e3a5f" }}
      />
      <div className="text-[10px] font-bold tracking-widest text-blue-400 mb-1">PORTFOLIO</div>
      <div
        className="text-white font-bold text-sm leading-tight"
        style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
      >
        {data.label}
      </div>
      {(progCount > 0 || projCount > 0) && (
        <div className="text-[11px] text-blue-300 mt-1.5">
          {progCount > 0 && `${progCount} prog`}
          {progCount > 0 && projCount > 0 && " · "}
          {projCount > 0 && `${projCount} proj`}
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
      className={`relative rounded-xl border-2 px-5 py-4 text-center cursor-pointer transition-all ${
        selected
          ? "border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.5)]"
          : "border-amber-500"
      }`}
      style={{ background: "rgba(40,25,5,0.92)", minWidth: 180, maxWidth: 220 }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#f59e0b", width: 14, height: 14, border: "2px solid #451a03" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#f59e0b", width: 14, height: 14, border: "2px solid #451a03" }}
      />
      <div className="text-[10px] font-bold tracking-widest text-amber-400 mb-1">PROGRAM</div>
      <div
        className="text-white font-bold text-sm leading-tight"
        style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
      >
        {data.label}
      </div>
      {projCount > 0 && (
        <div className="text-[11px] text-amber-300 mt-1.5">
          {projCount} project{projCount !== 1 ? "s" : ""}
        </div>
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
  const colors =
    PROJECT_STATUS_COLORS[data.status] ?? {
      border: "#22c55e",
      text: "#86efac",
      statusColor: "#22c55e",
    };
  return (
    <div
      className={`relative rounded-xl border-2 px-5 py-4 text-center cursor-pointer transition-all ${
        selected ? "shadow-[0_0_20px_rgba(34,197,94,0.5)]" : ""
      }`}
      style={{
        background: "rgba(5,25,15,0.92)",
        borderColor: colors.border,
        minWidth: 160,
        maxWidth: 200,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: colors.border,
          width: 14,
          height: 14,
          border: "2px solid #052e16",
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: colors.border,
          width: 14,
          height: 14,
          border: "2px solid #052e16",
        }}
      />
      <div
        className="text-[10px] font-bold tracking-widest mb-1"
        style={{ color: colors.text }}
      >
        PROJECT
      </div>
      <div
        className="text-white font-bold text-sm leading-tight"
        style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
      >
        {data.label}
      </div>
      {data.status && (
        <div
          className="text-[11px] mt-1.5 font-medium"
          style={{ color: colors.statusColor }}
        >
          {data.status}
        </div>
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
const NODE_W = 210;
const H_GAP = 70;
const ROW_Y = { portfolio: 60, program: 300, project: 540 };

// ── Parse node id helpers ─────────────────────────────────────────────────────
function parseNodeId(id: string): { type: "portfolio" | "program" | "project"; id: number } | null {
  const m = id.match(/^(portfolio|program|project)-(\d+)$/);
  if (!m) return null;
  return { type: m[1] as "portfolio" | "program" | "project", id: parseInt(m[2]) };
}

// ── Main component (inner) ────────────────────────────────────────────────────
function SystemLandscapeDiagramInner({ portfolios, programs, projects, onLinkCreated }: Props) {
  const [filter, setFilter] = useState<"all" | "portfolio" | "program" | "project">("all");
  const [search, setSearch] = useState("");
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // tRPC mutations for persisting links
  const utils = trpc.useUtils();
  const linkProgramToPortfolio = trpc.portfolios.linkProgram.useMutation({
    onSuccess: () => {
      utils.programs.list.invalidate();
      utils.portfolios.list.invalidate();
      utils.projects.list.invalidate();
      onLinkCreated?.();
      toast.success("Program linked to portfolio");
    },
    onError: (e) => toast.error(`Failed to link: ${e.message}`),
  });
  const linkProjectToPortfolio = trpc.portfolios.linkProject.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      onLinkCreated?.();
      toast.success("Project linked to portfolio");
    },
    onError: (e) => toast.error(`Failed to link: ${e.message}`),
  });
  const linkProjectToProgram = trpc.programs.linkProject.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      onLinkCreated?.();
      toast.success("Project linked to program");
    },
    onError: (e) => toast.error(`Failed to link: ${e.message}`),
  });

  // Build nodes + edges from data
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const q = search.toLowerCase();
    const filteredPortfolios = portfolios.filter(
      (p) => !q || p.name.toLowerCase().includes(q)
    );
    const filteredPrograms = programs.filter(
      (p) => !q || p.name.toLowerCase().includes(q)
    );
    const filteredProjects = projects.filter(
      (p) => !q || p.name.toLowerCase().includes(q)
    );

    const showPortfolios = filter === "all" || filter === "portfolio";
    const showPrograms = filter === "all" || filter === "program";
    const showProjects = filter === "all" || filter === "project";

    // Count programs/projects per portfolio
    const progCountByPortfolio: Record<number, number> = {};
    const projCountByProgram: Record<number, number> = {};
    programs.forEach((p) => {
      if (p.portfolioId)
        progCountByPortfolio[p.portfolioId] =
          (progCountByPortfolio[p.portfolioId] ?? 0) + 1;
    });
    projects.forEach((p) => {
      if (p.programId)
        projCountByProgram[p.programId] =
          (projCountByProgram[p.programId] ?? 0) + 1;
    });
    const projCountByPortfolio: Record<number, number> = {};
    projects.forEach((p) => {
      if (p.portfolioId && !p.programId)
        projCountByPortfolio[p.portfolioId] =
          (projCountByPortfolio[p.portfolioId] ?? 0) + 1;
    });

    // ── Portfolio row ──
    const displayPortfolios = showPortfolios ? filteredPortfolios : [];
    const totalPortfolioW =
      displayPortfolios.length * (NODE_W + H_GAP) - H_GAP;
    const portfolioStartX = Math.max(100, 600 - totalPortfolioW / 2);

    displayPortfolios.forEach((p, i) => {
      nodes.push({
        id: `portfolio-${p.id}`,
        type: "portfolio",
        position: { x: portfolioStartX + i * (NODE_W + H_GAP), y: ROW_Y.portfolio },
        data: {
          label: p.name,
          description: p.description,
          programCount: progCountByPortfolio[p.id] ?? 0,
          projectCount:
            (projCountByPortfolio[p.id] ?? 0) +
            (projCountByProgram[p.id] ?? 0),
          raw: p,
          nodeType: "portfolio",
        },
        draggable: true,
      });
    });

    // ── Program row ──
    const displayPrograms = showPrograms ? filteredPrograms : [];
    const totalProgramW = displayPrograms.length * (NODE_W + H_GAP) - H_GAP;
    const programStartX = Math.max(100, 600 - totalProgramW / 2);

    displayPrograms.forEach((p, i) => {
      nodes.push({
        id: `program-${p.id}`,
        type: "program",
        position: { x: programStartX + i * (NODE_W + H_GAP), y: ROW_Y.program },
        data: {
          label: p.name,
          description: p.description,
          projectCount: projCountByProgram[p.id] ?? 0,
          raw: p,
          nodeType: "program",
        },
        draggable: true,
      });

      if (p.portfolioId && showPortfolios) {
        edges.push({
          id: `e-pf${p.portfolioId}-pg${p.id}`,
          source: `portfolio-${p.portfolioId}`,
          target: `program-${p.id}`,
          type: "smoothstep",
          animated: false,
          style: { stroke: "#f59e0b", strokeWidth: 1.8 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#f59e0b",
            width: 14,
            height: 14,
          },
        });
      }
    });

    // ── Project row ──
    const displayProjects = showProjects ? filteredProjects : [];
    const totalProjectW = displayProjects.length * (NODE_W + H_GAP) - H_GAP;
    const projectStartX = Math.max(100, 600 - totalProjectW / 2);

    displayProjects.forEach((p, i) => {
      nodes.push({
        id: `project-${p.id}`,
        type: "project",
        position: { x: projectStartX + i * (NODE_W + H_GAP), y: ROW_Y.project },
        data: {
          label: p.name,
          status: p.status,
          raw: p,
          nodeType: "project",
        },
        draggable: true,
      });

      // Program → Project (solid amber)
      if (p.programId && showPrograms) {
        edges.push({
          id: `e-pg${p.programId}-pj${p.id}`,
          source: `program-${p.programId}`,
          target: `project-${p.id}`,
          type: "smoothstep",
          animated: false,
          style: { stroke: "#f59e0b", strokeWidth: 1.8 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#f59e0b",
            width: 14,
            height: 14,
          },
        });
      }

      // Portfolio → Project directly (dashed blue)
      if (p.portfolioId && !p.programId && showPortfolios) {
        edges.push({
          id: `e-pf${p.portfolioId}-pj${p.id}`,
          source: `portfolio-${p.portfolioId}`,
          target: `project-${p.id}`,
          type: "smoothstep",
          animated: false,
          style: {
            stroke: "#60a5fa",
            strokeWidth: 1.8,
            strokeDasharray: "6 4",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#60a5fa",
            width: 14,
            height: 14,
          },
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

  // ── Drag-to-connect handler — persists to DB ──────────────────────────────
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const src = parseNodeId(connection.source);
      const tgt = parseNodeId(connection.target);

      if (!src || !tgt) return;

      // Determine relationship type and call the right mutation
      if (src.type === "portfolio" && tgt.type === "program") {
        linkProgramToPortfolio.mutate({ portfolioId: src.id, programId: tgt.id });
      } else if (src.type === "portfolio" && tgt.type === "project") {
        linkProjectToPortfolio.mutate({ portfolioId: src.id, projectId: tgt.id });
      } else if (src.type === "program" && tgt.type === "project") {
        linkProjectToProgram.mutate({ programId: src.id, projectId: tgt.id });
      } else if (src.type === "program" && tgt.type === "portfolio") {
        // Reverse drag: portfolio→program
        linkProgramToPortfolio.mutate({ portfolioId: tgt.id, programId: src.id });
      } else if (src.type === "project" && tgt.type === "program") {
        // Reverse drag: program→project
        linkProjectToProgram.mutate({ programId: tgt.id, projectId: src.id });
      } else if (src.type === "project" && tgt.type === "portfolio") {
        // Reverse drag: portfolio→project
        linkProjectToPortfolio.mutate({ portfolioId: tgt.id, projectId: src.id });
      } else {
        toast.error("Cannot connect two nodes of the same type");
        return;
      }

      // Optimistically add the edge (will be replaced by real edge on refetch)
      const newEdge: Edge = {
        ...connection,
        id: `e-custom-${connection.source}-${connection.target}-${Date.now()}`,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#a78bfa", strokeWidth: 1.8 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#a78bfa",
          width: 14,
          height: 14,
        },
      } as Edge;
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, linkProgramToPortfolio, linkProjectToPortfolio, linkProjectToProgram]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data);
  }, []);

  const isEmpty =
    portfolios.length === 0 &&
    programs.length === 0 &&
    projects.length === 0;

  return (
    <div className="flex flex-col h-full" style={{ background: "#0a0f1a" }}>
      {/* ── Top bar ── */}
      <div
        className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-white/10 shrink-0"
        style={{ background: "#0d1424" }}
      >
        {/* Filter pills */}
        {(["all", "portfolio", "program", "project"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
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
        <div className="relative ml-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-8 pr-3 py-1 rounded-full text-xs bg-white/10 text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-white/30 w-44"
          />
        </div>

        <div className="ml-auto text-[11px] text-white/30 hidden sm:block">
          Click nodes to view details · Drag nodes to reposition · Drag from{" "}
          <strong className="text-white/50">any port</strong> to another node to connect
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-1.5 text-[11px] text-white/50 border-b border-white/5 shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-blue-400 inline-block" />
          Portfolio
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-amber-500 inline-block" />
          Program
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-green-500 inline-block" />
          Project
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-8 border-t border-white/40 inline-block" />
          Link
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-8 border-t border-dashed border-white/40 inline-block" />
          Direct Link
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-purple-400 inline-block" />
          Custom Link
        </span>
      </div>

      {/* ── Canvas ── */}
      <div className="flex flex-1 min-h-0 relative">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center w-full text-white/30">
            <Network className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">No portfolios, programs or projects yet.</p>
            <p className="text-xs mt-1 opacity-60">
              Create items in the Portfolios and Programs tabs to see the
              hierarchy here.
            </p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.2}
            maxZoom={2.5}
            style={{ background: "#0a0f1a" }}
            defaultEdgeOptions={{
              type: "smoothstep",
              style: { stroke: "#f59e0b", strokeWidth: 1.8 },
            }}
            connectionLineStyle={{ stroke: "#a78bfa", strokeWidth: 2 }}
            connectionLineType={"smoothstep" as any}
          >
            <Background
              variant={BackgroundVariant.Dots}
              color="#1e2a3a"
              gap={24}
              size={1}
            />
            <Controls
              style={{
                background: "#0d1424",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              showInteractive={false}
            />
            <MiniMap
              style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.1)" }}
              nodeColor={(n) =>
                n.type === "portfolio"
                  ? "#3b82f6"
                  : n.type === "program"
                  ? "#f59e0b"
                  : "#22c55e"
              }
              maskColor="rgba(0,0,0,0.5)"
            />
          </ReactFlow>
        )}

        {/* ── Detail panel (bottom-right slide-up) ── */}
        {selectedNode && (
          <div
            className="absolute bottom-4 right-4 w-72 rounded-xl border border-white/10 p-4 z-50 shadow-2xl"
            style={{ background: "#0d1424" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded ${
                  selectedNode.nodeType === "portfolio"
                    ? "bg-blue-500/20 text-blue-300"
                    : selectedNode.nodeType === "program"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-green-500/20 text-green-300"
                }`}
              >
                {(selectedNode.nodeType ?? "").toUpperCase()}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-white/30 hover:text-white/70 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="text-white font-bold text-base mb-1 break-words">
              {selectedNode.label}
            </div>
            {selectedNode.description && (
              <p className="text-white/50 text-xs mb-2 break-words">
                {selectedNode.description}
              </p>
            )}
            {selectedNode.nodeType === "portfolio" && (
              <div className="flex gap-3 text-xs text-white/40 mt-2">
                <span>
                  {selectedNode.programCount} program
                  {selectedNode.programCount !== 1 ? "s" : ""}
                </span>
                <span>·</span>
                <span>
                  {selectedNode.projectCount} project
                  {selectedNode.projectCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {selectedNode.nodeType === "program" && (
              <div className="text-xs text-white/40 mt-2">
                {selectedNode.projectCount} project
                {selectedNode.projectCount !== 1 ? "s" : ""}
              </div>
            )}
            {selectedNode.nodeType === "project" && selectedNode.status && (
              <div
                className="text-xs mt-2 font-medium"
                style={{
                  color:
                    PROJECT_STATUS_COLORS[selectedNode.status]?.statusColor ??
                    "#22c55e",
                }}
              >
                {selectedNode.status}
              </div>
            )}
          </div>
        )}
      </div>
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
