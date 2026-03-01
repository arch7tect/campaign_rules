export type DataType =
  | 'string' | 'int' | 'float' | 'bool'
  | 'date' | 'datetime' | 'enum' | 'list'
  | 'phone' | 'email' | 'url'

export type OwnerType = 'contact' | 'campaign_member'

export interface AttributeConstraints {
  required?: boolean
  default?: string | number | boolean | null
  enum_values?: string[] | null
  validation_regex?: string | null
  min_value?: number | null
  max_value?: number | null
  min_length?: number | null
  max_length?: number | null
}

export interface AttributeDefinition {
  id: number
  name: string
  display_name: string
  data_type: DataType
  owner_type: OwnerType
  campaign_id: number | null
  constraints: AttributeConstraints | null
  is_fixed: boolean
  created_at: string
}

export interface AttributeDefinitionCreate {
  name: string
  display_name: string
  data_type: DataType
  owner_type: OwnerType
  campaign_id?: number | null
  constraints?: AttributeConstraints | null
  is_fixed?: boolean
}

export interface AttributeDefinitionUpdate {
  display_name?: string
  constraints?: AttributeConstraints | null
}
