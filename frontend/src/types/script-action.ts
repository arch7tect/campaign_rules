export interface ScriptAction {
  id: number
  name: string
  description?: string | null
  script: string
  param_schema?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ScriptActionCreate {
  name: string
  description?: string | null
  script: string
  param_schema?: Record<string, unknown> | null
}

export interface ScriptActionUpdate {
  name?: string
  description?: string | null
  script?: string
  param_schema?: Record<string, unknown> | null
}
