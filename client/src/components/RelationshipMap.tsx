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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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

const nodeColors = {
  task: '#60a5fa',        // blue
  requirement: '#34d399', // green
  issue: '#f87171',       // red
  risk: '#fbbf24',        // yellow
  deliverable: '#a78bfa', // purple
};

const nodeLabels = {
  task: 'Tasks',
  requirement: 'Requirements',
  issue: 'Issues',
  risk: 'Risks',
  deliverable: 'Deliverables',
};

export function RelationshipMap({ nodes, edges, onNodeClick }: RelationshipMapProps) {
  const [filters, setFilters] = useState({
    task: true,
    requirement: true,
    issue: true,
    risk: true,
    deliverable: true,
  });

  // Convert entity nodes to React Flow nodes
  const flowNodes: Node[] = useMemo(() => {
    const filtered = nodes.filter((n) => filters[n.type]);
    
    // Calculate positions using a force-directed layout simulation
    const nodePositions = calculateNodePositions(filtered);
    
    return filtered.map((node, index) => ({
      id: node.id,
      type: 'default',
      position: nodePositions[node.id] || { x: (index % 5) * 200, y: Math.floor(index / 5) * 150 },
      data: {
        label: (
          <div
            className="px-4 py-2 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
            style={{
              backgroundColor: nodeColors[node.type],
              color: 'white',
              minWidth: '140px',
              maxWidth: '220px',
              textAlign: 'center',
            }}
          >
            <div className="font-bold text-xs opacity-80">{node.title}</div>
            {node.description && <div className="font-semibold text-sm mt-0.5 leading-tight">{node.description}</div>}
            {node.status && <div className="text-xs mt-1 opacity-80">{node.status}</div>}
          </div>
        ),
      },
      draggable: true,
    }));
  }, [nodes, filters]);

  // Convert entity edges to React Flow edges
  const flowEdges: Edge[] = useMemo(() => {
    const filtered = edges.filter(
      (e) =>
        flowNodes.some((n) => n.id === e.from) &&
        flowNodes.some((n) => n.id === e.to)
    );

    return filtered.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.from,
      target: edge.to,
      label: edge.label,
      type: 'smoothstep',
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      style: {
        strokeWidth: 2,
        stroke: '#94a3b8',
      },
      labelStyle: {
        fontSize: 10,
        fill: '#64748b',
      },
    }));
  }, [edges, flowNodes]);

  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Update nodes and edges when filters change
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

  const toggleFilter = (type: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Filter Controls */}
      <Card className="p-4">
        <div className="flex items-center gap-6 flex-wrap">
          <Label className="font-semibold">Show:</Label>
          {Object.entries(nodeLabels).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <Checkbox
                id={`filter-${type}`}
                checked={filters[type as keyof typeof filters]}
                onCheckedChange={() => toggleFilter(type as keyof typeof filters)}
              />
              <Label
                htmlFor={`filter-${type}`}
                className="cursor-pointer flex items-center gap-2"
              >
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: nodeColors[type as keyof typeof nodeColors] }}
                />
                {label}
              </Label>
            </div>
          ))}
        </div>
      </Card>

      {/* React Flow Graph */}
      <Card className="flex-1 overflow-hidden">
        <div className="w-full h-full" style={{ minHeight: '500px' }}>
          <ReactFlow
            nodes={reactFlowNodes}
            edges={reactFlowEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            fitView
            attributionPosition="bottom-left"
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Controls />
          </ReactFlow>
        </div>
      </Card>
    </div>
  );
}

// Simple force-directed layout calculation
function calculateNodePositions(nodes: EntityNode[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  
  // Group nodes by type
  const nodesByType: Record<string, EntityNode[]> = {
    task: [],
    requirement: [],
    issue: [],
    risk: [],
    deliverable: [],
  };
  
  nodes.forEach((node) => {
    nodesByType[node.type].push(node);
  });
  
  // Position nodes in columns by type
  let xOffset = 100;
  const columnWidth = 250;
  const rowHeight = 120;
  
  Object.entries(nodesByType).forEach(([type, typeNodes]) => {
    if (typeNodes.length === 0) return;
    
    typeNodes.forEach((node, index) => {
      positions[node.id] = {
        x: xOffset,
        y: 100 + index * rowHeight,
      };
    });
    
    xOffset += columnWidth;
  });
  
  return positions;
}
