import type { Node, Edge } from '@xyflow/react'
import type { Rule, RuleNodeCreate, RuleEdgeCreate, RuleGraphUpdate } from '@/types/rule'

export interface FlowNodeData {
  label: string
  nodeType: string
  subtype: string
  config: Record<string, unknown>
  customName: string
  [key: string]: unknown
}

export function ruleToFlow(rule: Rule): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const nodes: Node<FlowNodeData>[] = rule.nodes.map(n => ({
    id: String(n.id),
    type: n.node_type,
    position: { x: n.position_x, y: n.position_y },
    data: {
      label: subtypeLabel(n.node_subtype, n.config),
      nodeType: n.node_type,
      subtype: n.node_subtype,
      config: n.config ?? {},
      customName: (n.config as Record<string, unknown> | null)?._name as string ?? '',
    },
  }))

  const edges: Edge[] = rule.edges.map(e => ({
    id: `e${e.id}`,
    source: String(e.source_node_id),
    sourceHandle: e.source_port,
    target: String(e.target_node_id),
    targetHandle: e.target_port,
    label: e.label ?? '',
    data: { customLabel: e.label ?? '' },
  }))

  return { nodes, edges }
}

export function flowToGraph(nodes: Node<FlowNodeData>[], edges: Edge[]): RuleGraphUpdate {
  const idToIndex = new Map<string, number>()
  nodes.forEach((n, i) => idToIndex.set(n.id, i))

  const serializedNodes: RuleNodeCreate[] = nodes.map(n => ({
    node_type: n.data.nodeType as 'event' | 'condition' | 'action',
    node_subtype: n.data.subtype,
    config: n.data.config,
    position_x: n.position?.x ?? 0,
    position_y: n.position?.y ?? 0,
  }))

  const serializedEdges: RuleEdgeCreate[] = edges
    .filter(e => idToIndex.has(e.source) && idToIndex.has(e.target))
    .map(e => ({
      source_node_id: idToIndex.get(e.source)!,
      source_port: e.sourceHandle || 'default',
      target_node_id: idToIndex.get(e.target)!,
      target_port: e.targetHandle ?? 'default',
      label: (e.data?.customLabel as string) || undefined,
    }))

  return { nodes: serializedNodes, edges: serializedEdges }
}

function subtypeLabel(subtype: string, config: Record<string, unknown> | null): string {
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
