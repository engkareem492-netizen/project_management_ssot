import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Checkbox } from '@/components/ui/checkbox';

export interface EntityNode {
  id: string;
  type: 'task' | 'requirement' | 'issue' | 'risk' | 'deliverable';
  title: string;
  description?: string;
  status?: string;
  priority?: string;
}

export interface EntityEdge {
  from: string;
  to: string;
  label?: string;
}

interface RelationshipMapProps {
  nodes: EntityNode[];
  edges: EntityEdge[];
  onNodeClick?: (node: EntityNode) => void;
}

const nodeColors: Record<string, string> = {
  task: '#3b82f6',
  requirement: '#10b981',
  issue: '#ef4444',
  risk: '#f59e0b',
  deliverable: '#8b5cf6',
};

const nodeLabels: Record<string, string> = {
  task: 'Tasks',
  requirement: 'Requirements',
  issue: 'Issues',
  risk: 'Risks',
  deliverable: 'Deliverables',
};

/* ── Layout helper ─────────────────────────────────────────────────────────── */
function buildLayout(nodes: EntityNode[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const groups: Record<string, EntityNode[]> = {
    requirement: [], task: [], issue: [], risk: [], deliverable: [],
  };
  nodes.forEach((n) => { (groups[n.type] ??= []).push(n); });
  let col = 0;
  const COL_W = 260, ROW_H = 130, START_X = 60, START_Y = 60;
  Object.entries(groups).forEach(([, grpNodes]) => {
    if (grpNodes.length === 0) return;
    grpNodes.forEach((n, row) => {
      positions[n.id] = { x: START_X + col * COL_W, y: START_Y + row * ROW_H };
    });
    col++;
  });
  return positions;
}

/* ── Inner component (needs ReactFlowProvider context) ─────────────────────── */
function RelationshipMapInner({ nodes, edges, onNodeClick }: RelationshipMapProps) {
  const { fitView } = useReactFlow();
  const [filters, setFilters] = useState<Record<string, boolean>>({
    task: true, requirement: true, issue: true, risk: true, deliverable: true,
  });

  const flowNodes: Node[] = useMemo(() => {
    const filtered = nodes.filter((n) => filters[n.type]);
    const positions = buildLayout(filtered);
    return filtered.map((node) => ({
      id: node.id,
      type: 'default',
      position: positions[node.id] ?? { x: 0, y: 0 },
      data: {
        label: (
          <div style={{
            background: nodeColors[node.type] ?? '#64748b',
            color: 'white',
            borderRadius: '8px',
            padding: '8px 12px',
            minWidth: '140px',
            maxWidth: '210px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            cursor: 'pointer',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {node.type}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px', lineHeight: 1.3 }}>
              {node.title}
            </div>
            {node.description && (
              <div style={{ fontSize: '10px', marginTop: '3px', opacity: 0.85, lineHeight: 1.3 }}>
                {node.description.length > 60 ? node.description.slice(0, 60) + '\u2026' : node.description}
              </div>
            )}
            {node.status && (
              <div style={{ fontSize: '9px', marginTop: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', padding: '1px 5px', display: 'inline-block' }}>
                {node.status}
              </div>
            )}
          </div>
        ),
      },
      draggable: true,
    }));
  }, [nodes, filters]);

  const flowEdges: Edge[] = useMemo(() => {
    const nodeIds = new Set(flowNodes.map((n) => n.id));
    return edges
      .filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to))
      .map((edge, i) => ({
        id: `edge-${i}`,
        source: edge.from,
        target: edge.to,
        label: edge.label,
        type: 'smoothstep',
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
        style: { strokeWidth: 2, stroke: '#94a3b8' },
        labelStyle: { fontSize: 10, fill: '#64748b' },
      }));
  }, [edges, flowNodes]);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(flowNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(flowEdges);

  const fitScheduled = useRef(false);
  useEffect(() => {
    setRfNodes(flowNodes);
    setRfEdges(flowEdges);
    if (!fitScheduled.current) {
      fitScheduled.current = true;
      setTimeout(() => {
        fitView({ padding: 0.15, duration: 300 });
        fitScheduled.current = false;
      }, 80);
    }
  }, [flowNodes, flowEdges, setRfNodes, setRfEdges, fitView]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const entity = nodes.find((n) => n.id === node.id);
      if (entity && onNodeClick) onNodeClick(entity);
    },
    [nodes, onNodeClick]
  );

  const toggleFilter = (type: string) =>
    setFilters((prev) => ({ ...prev, [type]: !prev[type] }));

  const isEmpty = rfNodes.length === 0;

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {/* Filter bar */}
      <div className="flex items-center gap-5 flex-wrap px-1">
        <span className="text-sm font-semibold text-muted-foreground">Show:</span>
        {Object.entries(nodeLabels).map(([type, label]) => (
          <label key={type} className="flex items-center gap-1.5 cursor-pointer select-none">
            <Checkbox
              id={`filter-${type}`}
              checked={!!filters[type]}
              onCheckedChange={() => toggleFilter(type)}
            />
            <div className="w-3 h-3 rounded-sm" style={{ background: nodeColors[type] }} />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>

      {/* Graph canvas */}
      <div className="flex-1 rounded-xl border overflow-hidden" style={{ minHeight: '460px' }}>
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No connected entities to display. Add tasks with linked requirements, issues, or deliverables.
          </div>
        ) : (
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            attributionPosition="bottom-left"
            minZoom={0.2}
            maxZoom={2}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
            <Controls />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}

/* ── Public export (wraps with provider) ───────────────────────────────────── */
export function RelationshipMap(props: RelationshipMapProps) {
  return (
    <ReactFlowProvider>
      <RelationshipMapInner {...props} />
    </ReactFlowProvider>
  );
}

