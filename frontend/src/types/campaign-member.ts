export type MemberStatus = 'active' | 'paused' | 'removed' | 'completed'

export interface CampaignMember {
  id: number
  contact_id: number
  campaign_id: number
  attributes: Record<string, unknown> | null
  status: MemberStatus
  created_at: string
  updated_at: string
}

export interface CampaignMemberCreate {
  contact_id: number
  campaign_id: number
  attributes?: Record<string, unknown> | null
  status?: MemberStatus
}

export interface CampaignMemberUpdate {
  attributes?: Record<string, unknown> | null
  status?: MemberStatus
}
