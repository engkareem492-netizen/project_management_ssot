import { useCallback, useMemo, useState } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface EntityNode {
  id: string;
  type: 'task' | 'requirement' | 'userStory' | 'issue' | 'risk' | 'deliverable' | 'testCase';
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
  requirement: '#34d399', // green
  userStory:   '#f97316', // orange
  task:        '#60a5fa', // blue
  testCase:    '#22d3ee', // cyan
  issue:       '#f87171', // red
  risk:        '#fbbf24', // yellow
  deliverable: '#a78bfa', // purple
};

const nodeTypeLabels: Record<string, string> = {
  requirement: 'REQ',
  userStory:   'US',
  task:        'TASK',
  testCase:    'TC',
  issue:       'DEFECT',
  risk:        'RISK',
  deliverable: 'DEL',
};

const filterLabels: Record<string, string> = {
  requirement: 'Requirements',
  userStory:   'User Stories',
  task:        'Tasks',
  testCase:    'Test Cases',
  issue:       'Defects/Issues',
  risk:        'Risks',
  deliverable: 'Deliverables',
};

// Flow levels: top-to-bottom waterfall hierarchy
const flowLevels: Record<string, number> = {
  requirement: 0,
  userStory:   1,
  task:        2,
  testCase:    3,
  issue:       3,
  risk:        2,
  deliverable: 4,
};

// Edge colors by label keyword
function getEdgeColor(label?: string): string {
  if (!label) return '#94a3b8';
  const l = label.toLowerCase();
  if (l.includes('implements') || l.includes('implements user story')) return '#60a5fa';
  if (l.includes('refines') || l.includes('derives')) return '#f97316';
  if (l.includes('validates') || l.includes('tests') || l.includes('verified')) return '#22d3ee';
  if (l.includes('found defect') || l.includes('blocks') || l.includes('affects')) return '#f87171';
  if (l.includes('threatens')) return '#fbbf24';
  if (l.includes('contributes') || l.includes('fulfills')) return '#a78bfa';
  return '#94a3b8';
}

function buildFlowNode(node: EntityNode, position: { x: number; y: number }): Node {
  const color = nodeColors[node.type] ?? '#94a3b8';
  const typeLabel = nodeTypeLabels[node.type] ?? node.type.toUpperCase();

  return {
    id: node.id,
    type: 'default',
    position,
    data: {
      label: (
        <div
          style={{
            minWidth: '160px',
            maxWidth: '220px',
            background: 'white',
            border: `2px solid ${color}`,
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'left',
          }}
        >
          {/* Type banner */}
          <div
            style={{
              background: color,
              padding: '3px 8px',
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            {typeLabel}
          </div>
          {/* Body */}
          <div style={{ padding: '6px 8px' }}>
            <div style={{ fontWeight: 700, fontSize: '12px', color: '#1e293b', lineHeight: 1.2 }}>
              {node.title}
            </div>
            {node.description && (
              <div
                style={{
                  fontSize: '11px',
                  color: '#475569',
                  marginTop: '3px',
                  lineHeight: 1.3,
                  maxHeight: '32px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {node.description.length > 60
                  ? node.description.substring(0, 57) + '...'
                  : node.description}
              </div>
            )}
            {node.status && (
              <div
                style={{
                  marginTop: '5px',
                  display: 'inline-block',
                  background: `${color}22`,
                  color: color === '#fbbf24' ? '#92400e' : '#1e293b',
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: '999px',
                  border: `1px solid ${color}66`,
                }}
              >
                {node.status}
              </div>
            )}
          </div>
        </div>
      ),
    },
    draggable: true,
    style: { background: 'transparent', border: 'none', padding: 0 },
  };
}

export function RelationshipMap({ nodes, edges, onNodeClick }: RelationshipMapProps) {
  const [filters, setFilters] = useState<Record<string, boolean>>({
    requirement: true,
    userStory:   true,
    task:        true,
    testCase:    true,
    issue:       true,
    risk:        true,
    deliverable: true,
  });

  const flowNodes: Node[] = useMemo(() => {
    const filtered = nodes.filter((n) => filters[n.type] ?? true);
    const positions = calculateNodePositions(filtered);
    return filtered.map((node) =>
      buildFlowNode(node, positions[node.id] ?? { x: 0, y: 0 })
    );
  }, [nodes, filters]);

  const flowEdges: Edge[] = useMemo(() => {
    const nodeIds = new Set(flowNodes.map((n) => n.id));
    return edges
      .filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to))
      .map((edge, index) => {
        const color = getEdgeColor(edge.label);
        return {
          id: `edge-${index}`,
          source: edge.from,
          target: edge.to,
          label: edge.label,
          type: 'smoothstep',
          animated: edge.label?.toLowerCase().includes('blocks') || edge.label?.toLowerCase().includes('found defect'),
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color,
          },
          style: {
            strokeWidth: 2,
            stroke: color,
          },
          labelStyle: {
            fontSize: 10,
            fill: color,
            fontWeight: 600,
          },
          labelBgStyle: { fill: 'white', fillOpacity: 0.85 },
        };
      });
  }, [edges, flowNodes]);

  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useMemo(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const entityNode = nodes.find((n) => n.id === node.id);
      if (entityNode && onNodeClick) {
        onNodeClick(entityNode);
      }
    },
    [nodes, onNodeClick]
  );

  const toggleFilter = (type: string) => {
    setFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const visibleTypes = Object.keys(filterLabels).filter((t) =>
    nodes.some((n) => n.type === t)
  );

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {/* Filter Controls */}
      <Card className="p-3">
        <div className="flex items-center gap-4 flex-wrap">
          <Label className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Show:</Label>
          {visibleTypes.map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <Checkbox
                id={`filter-${type}`}
                checked={filters[type] ?? true}
                onCheckedChange={() => toggleFilter(type)}
              />
              <Label
                htmlFor={`filter-${type}`}
                className="cursor-pointer flex items-center gap-1.5 text-sm"
              >
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: nodeColors[type] }}
                />
                {filterLabels[type]}
              </Label>
            </div>
          ))}
        </div>
      </Card>

      {/* Flow Legend */}
      <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
        <span className="font-medium">Flow:</span>
        {(['requirement', 'userStory', 'task', 'testCase', 'issue'] as const).map((t, i) => (
          <span key={t} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-400">→</span>}
            <span
              className="px-2 py-0.5 rounded text-white text-xs font-semibold"
              style={{ backgroundColor: nodeColors[t] }}
            >
              {filterLabels[t]}
            </span>
          </span>
        ))}
      </div>

      {/* React Flow Graph */}
      <Card className="flex-1 overflow-hidden">
        <div className="w-full h-full" style={{ minHeight: '500px' }}>
          {flowNodes.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No connected entities found. Try adjusting filters or adding relationships.
            </div>
          ) : (
            <ReactFlow
              nodes={reactFlowNodes}
              edges={reactFlowEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              attributionPosition="bottom-left"
            >
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" />
              <Controls />
            </ReactFlow>
          )}
        </div>
      </Card>
    </div>
  );
}

// Hierarchical flow layout: top-to-bottom by entity level
function calculateNodePositions(nodes: EntityNode[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  // Group nodes by their flow level
  const nodesByLevel: Record<number, EntityNode[]> = {};
  nodes.forEach((node) => {
    const level = flowLevels[node.type] ?? 2;
    if (!nodesByLevel[level]) nodesByLevel[level] = [];
    nodesByLevel[level].push(node);
  });

  const levelHeight = 200;
  const nodeSpacing = 250;

  Object.entries(nodesByLevel).forEach(([levelStr, levelNodes]) => {
    const level = parseInt(levelStr);
    const y = level * levelHeight + 40;
    const totalWidth = (levelNodes.length - 1) * nodeSpacing;
    const startX = Math.max(40, 600 - totalWidth / 2);

    // Within the same level, separate by type (e.g. task vs risk at level 2)
    const byType: Record<string, EntityNode[]> = {};
    levelNodes.forEach((n) => {
      if (!byType[n.type]) byType[n.type] = [];
      byType[n.type].push(n);
    });

    let xCursor = startX;
    Object.values(byType).forEach((typeNodes) => {
      typeNodes.forEach((node) => {
        positions[node.id] = { x: xCursor, y };
        xCursor += nodeSpacing;
      });
      xCursor += 40; // small gap between different types at same level
    });
  });

  return positions;
}
