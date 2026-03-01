import { useCallback, useState, useRef, useMemo, type DragEvent } from 'react'
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { v4 as uuid } from 'uuid'
import { NodePalette } from './NodePalette'
import { ConfigPanel } from './ConfigPanel'
import { EventNode } from './nodes/EventNode'
import { ConditionNode } from './nodes/ConditionNode'
import { ActionNode } from './nodes/ActionNode'
import { LabeledEdge } from './edges/LabeledEdge'
import { ruleToFlow, flowToGraph, type FlowNodeData } from './utils/serialization'
import type { Rule, RuleGraphUpdate } from '@/types/rule'

const nodeTypes = {
  event: EventNode,
  condition: ConditionNode,
  action: ActionNode,
}

const edgeTypes = {
  labeled: LabeledEdge,
}

interface RuleFlowEditorProps {
  rule: Rule
  onSave: (graph: RuleGraphUpdate) => void
  saving?: boolean
  campaignId?: number
}

export function RuleFlowEditor({ rule, onSave, saving, campaignId }: RuleFlowEditorProps) {
  const initial = useMemo(() => ruleToFlow(rule), [rule])
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)
  const [selectedNode, setSelectedNode] = useState<Node<FlowNodeData> | null>(null)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReturnType<typeof useRef<unknown>>['current']>(null)

  const nodesRef = useRef(nodes)
  nodesRef.current = nodes
  const edgesRef = useRef(edges)
  edgesRef.current = edges

  const onConnect = useCallback((connection: Connection) => {
    // No edges into event nodes
    const targetNode = nodes.find(n => n.id === connection.target)
    if (targetNode?.data.nodeType === 'event') return
    // No self-loops
    if (connection.source === connection.target) return
    const label = connection.sourceHandle || 'default'
    setEdges(eds => addEdge({ ...connection, type: 'labeled', label, data: {} }, eds))
  }, [nodes, setEdges])

  const isValidConnection = useCallback((connection: Edge | Connection) => {
    const targetNode = nodes.find(n => n.id === connection.target)
    if (targetNode?.data.nodeType === 'event') return false
    if (connection.source === connection.target) return false
    return true
  }, [nodes])

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    const nodeType = e.dataTransfer.getData('application/reactflow-type')
    const subtype = e.dataTransfer.getData('application/reactflow-subtype')
    const label = e.dataTransfer.getData('application/reactflow-label')
    if (!nodeType || !subtype) return

    const bounds = reactFlowWrapper.current?.getBoundingClientRect()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rfInstance = reactFlowInstance as any
    if (!bounds || !rfInstance) return

    const position = rfInstance.screenToFlowPosition({
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    })

    const defaultConfigs: Record<string, Record<string, unknown>> = {
      'event:member_added': { event_type: 'member_added' },
      'event:contact_updated': { event_type: 'contact_updated' },
      'event:conversation_ended': { event_type: 'conversation_ended' },
      'event:conversation_updated': { event_type: 'conversation_updated' },
      'event:custom': { event_type: 'custom', event_name: '' },
      'condition:variable_check': { condition_type: 'variable_check', checks: [], has_else_port: true },
      'action:modify_model': { action_type: 'modify_model', assignments: [] },
      'action:cancel_communications': { action_type: 'cancel_communications' },
      'action:schedule_communication': { action_type: 'schedule_communication', channel: '' },
      'action:run_script': { action_type: 'run_script', script: '' },
      'action:trigger_event': { action_type: 'trigger_event', event_name: '' },
    }

    const newNode: Node<FlowNodeData> = {
      id: uuid(),
      type: nodeType,
      position,
      data: {
        label,
        nodeType,
        subtype,
        config: defaultConfigs[`${nodeType}:${subtype}`] ?? {},
        customName: '',
      },
    }

    setNodes(nds => [...nds, newNode])
  }, [reactFlowInstance, setNodes])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const handleConfigChange = useCallback((nodeId: string, config: Record<string, unknown>) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n
      const subtype = n.data.subtype
      const label = getLabel(subtype, config)
      return { ...n, data: { ...n.data, config, label } }
    }))
    setSelectedNode(prev => {
      if (!prev || prev.id !== nodeId) return prev
      const subtype = prev.data.subtype
      const label = getLabel(subtype, config)
      return { ...prev, data: { ...prev.data, config, label } }
    })
  }, [setNodes])

  const handleNameChange = useCallback((nodeId: string, name: string) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n
      const config = { ...n.data.config, _name: name || undefined }
      if (!name) delete config._name
      return { ...n, data: { ...n.data, config, customName: name } }
    }))
    setSelectedNode(prev => {
      if (!prev || prev.id !== nodeId) return prev
      const config = { ...prev.data.config, _name: name || undefined }
      if (!name) delete config._name
      return { ...prev, data: { ...prev.data, config, customName: name } }
    })
  }, [setNodes])

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId))
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId))
    setSelectedNode(null)
  }, [setNodes, setEdges])

  const handleEdgeLabelChange = useCallback((edgeId: string, newLabel: string) => {
    const trimmed = newLabel.trim() || 'default'
    const updater = (eds: Edge[]) => eds.map(e => {
      if (e.id !== edgeId) return e
      return { ...e, data: { ...e.data, customLabel: trimmed } }
    })
    edgesRef.current = updater(edgesRef.current)
    setEdges(updater)
  }, [setEdges])

  const edgesWithCallbacks = useMemo(() =>
    edges.map(e => ({
      ...e,
      type: 'labeled' as const,
      data: { ...e.data, onLabelChange: handleEdgeLabelChange },
    })),
    [edges, handleEdgeLabelChange],
  )

  const handleSave = useCallback(() => {
    const graph = flowToGraph(nodesRef.current, edgesRef.current)
    onSave(graph)
  }, [onSave])

  return (
    <div className="flex h-full" ref={reactFlowWrapper}>
      <NodePalette />
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edgesWithCallbacks}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onInit={setReactFlowInstance as never}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          deleteKeyCode="Delete"
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={16} />
        </ReactFlow>
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <ConfigPanel
        node={selectedNode}
        onConfigChange={handleConfigChange}
        onNameChange={handleNameChange}
        onDelete={handleDeleteNode}
        onClose={() => setSelectedNode(null)}
        campaignId={campaignId}
      />
    </div>
  )
}

function getLabel(subtype: string, config: Record<string, unknown>): string {
  const labels: Record<string, string> = {
    member_added: 'Member Added',
    contact_updated: 'Contact Updated',
    conversation_ended: 'Conversation Ended',
    conversation_updated: 'Conversation Updated',
    custom: config?.event_name ? `Custom: ${config.event_name}` : 'Custom Event',
    variable_check: 'Condition',
    modify_model: 'Modify Model',
    cancel_communications: 'Cancel Comms',
    schedule_communication: 'Schedule Comm',
    run_script: 'Run Script',
    trigger_event: config?.event_name ? `Trigger: ${config.event_name}` : 'Trigger Event',
  }
  return labels[subtype] ?? subtype
}
