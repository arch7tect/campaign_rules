export interface Contact {
  id: number
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  attributes: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ContactCreate {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  attributes?: Record<string, unknown> | null
}

export interface ContactUpdate {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  attributes?: Record<string, unknown> | null
}
