export interface EventPayload {
  event_type: string
  campaign_id: number
  contact_id: number
  event_name?: string | null
  conversation_results?: Record<string, unknown> | null
}
