import { api } from './client'
import type { CampaignMember, CampaignMemberCreate, CampaignMemberUpdate } from '@/types/campaign-member'

export const campaignMembersApi = {
  list: (params?: { campaign_id?: number; contact_id?: number; skip?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.campaign_id != null) q.set('campaign_id', String(params.campaign_id))
    if (params?.contact_id != null) q.set('contact_id', String(params.contact_id))
    if (params?.skip != null) q.set('skip', String(params.skip))
    if (params?.limit != null) q.set('limit', String(params.limit))
    return api.get<CampaignMember[]>(`/api/campaign-members/?${q}`)
  },
  get: (id: number) =>
    api.get<CampaignMember>(`/api/campaign-members/${id}`),
  create: (data: CampaignMemberCreate) =>
    api.post<CampaignMember>('/api/campaign-members/', data),
  update: (id: number, data: CampaignMemberUpdate) =>
    api.patch<CampaignMember>(`/api/campaign-members/${id}`, data),
  delete: (id: number) =>
    api.delete(`/api/campaign-members/${id}`),
}
