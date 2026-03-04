'use client'

import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { DiagramNode, DiagramEdge } from '@/lib/types'

interface FlowDiagramProps {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

export function FlowDiagram({ nodes, edges }: FlowDiagramProps) {
  const rfNodes: Node[] = nodes.map(n => ({
    ...n,
    data: {
      label: (
        <div className="text-left">
          <div className="font-semibold text-xs text-primary">{n.data.app}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{n.data.action || n.data.label}</div>
        </div>
      ),
    },
    style: {
      background: 'white',
      border:     '1px solid #e5e7eb',
      borderRadius: 8,
      padding:    '10px 14px',
      fontSize:   13,
      minWidth:   180,
    },
  }))

  const rfEdges: Edge[] = edges.map(e => ({
    ...e,
    animated: true,
    style:    { stroke: '#6366f1', strokeWidth: 2 },
  }))

  return (
    <div className="w-full h-[400px] rounded-xl border border-border overflow-hidden bg-gray-50">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnDoubleClick={false}
      >
        <Background gap={16} color="#e5e7eb" />
        <Controls showInteractive={false} />
        <MiniMap nodeColor="#6366f1" maskColor="rgba(0,0,0,0.05)" />
      </ReactFlow>
    </div>
  )
}
