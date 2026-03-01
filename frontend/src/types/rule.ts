export type NodeType = 'event' | 'condition' | 'action'

export interface RuleNodeCreate {
  node_type: NodeType
  node_subtype: string
  config: Record<string, unknown>
  position_x: number
  position_y: number
}

export interface RuleNode {
  id: number
  rule_id: number
  node_type: NodeType
  node_subtype: string
  config: Record<string, unknown> | null
  position_x: number
  position_y: number
}

export interface RuleEdgeCreate {
  source_node_id: number
  source_port: string
  target_node_id: number
  target_port: string
  label?: string | null
}

export interface RuleEdge {
  id: number
  rule_id: number
  source_node_id: number
  source_port: string
  target_node_id: number
  target_port: string
  label?: string | null
}

export interface Rule {
  id: number
  campaign_id: number
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  nodes: RuleNode[]
  edges: RuleEdge[]
}

export interface RuleCreate {
  campaign_id: number
  name: string
  description?: string | null
  is_active?: boolean
  nodes?: RuleNodeCreate[]
  edges?: RuleEdgeCreate[]
}

export interface RuleUpdate {
  name?: string
  description?: string | null
  is_active?: boolean
}

export interface RuleGraphUpdate {
  nodes: RuleNodeCreate[]
  edges: RuleEdgeCreate[]
}
