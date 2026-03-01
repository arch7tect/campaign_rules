export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'

export interface Campaign {
  id: number
  name: string
  description: string | null
  status: CampaignStatus
  created_at: string
  updated_at: string
}

export interface CampaignCreate {
  name: string
  description?: string | null
  status?: CampaignStatus
}

export interface CampaignUpdate {
  name?: string
  description?: string | null
  status?: CampaignStatus
}
