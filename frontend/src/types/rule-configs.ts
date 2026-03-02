export type ValueSource = 'constant' | 'attribute' | 'expression'

export type ComparisonOperator =
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains' | 'not_contains' | 'starts_with' | 'ends_with'
  | 'is_null' | 'is_not_null' | 'in' | 'not_in' | 'matches'

export interface ValueRef {
  source: ValueSource
  value?: unknown
  object_type?: string | null
  attribute_name?: string | null
  expression?: string | null
}

export interface VariableCheck {
  left: ValueRef
  operator: ComparisonOperator
  right: ValueRef | null
  port_name: string
}

export interface VariableCheckConditionConfig {
  condition_type: 'variable_check'
  checks: VariableCheck[]
  has_else_port: boolean
}

export interface FieldAssignment {
  object_type: string
  attribute_name: string
  value: ValueRef
}

export interface ModifyModelActionConfig {
  action_type: 'modify_model'
  assignments: FieldAssignment[]
}

export interface CancelCommunicationsActionConfig {
  action_type: 'cancel_communications'
}

export interface ScheduleCommunicationActionConfig {
  action_type: 'schedule_communication'
  channel: string
  agent_params?: Record<string, unknown> | null
  min_time_expr?: string | null
  max_time_expr?: string | null
}

export interface RunScriptActionConfig {
  action_type: 'run_script'
  script_action_id?: number | null
  params?: Record<string, unknown> | null
  script?: string | null
}

export interface TriggerEventActionConfig {
  action_type: 'trigger_event'
  event_name: string
}

export type EventConfig =
  | { event_type: 'member_added' }
  | { event_type: 'contact_updated' }
  | { event_type: 'conversation_ended' }
  | { event_type: 'conversation_updated' }
  | { event_type: 'custom'; event_name: string }

export type ActionConfig =
  | ModifyModelActionConfig
  | CancelCommunicationsActionConfig
  | ScheduleCommunicationActionConfig
  | RunScriptActionConfig
  | TriggerEventActionConfig
