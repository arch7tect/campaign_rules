export type CommunicationStatus = 'pending' | 'cancelled' | 'completed'

export interface ScheduledCommunication {
  id: number
  contact_id: number
  campaign_id: number
  campaign_member_id: number
  channel: string
  agent_params: Record<string, unknown> | null
  min_time: string | null
  max_time: string | null
  status: CommunicationStatus
  created_at: string
}
