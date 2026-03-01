import { api } from './client'
import type { Campaign, CampaignCreate, CampaignUpdate } from '@/types/campaign'

export const campaignsApi = {
  list: (skip = 0, limit = 100) =>
    api.get<Campaign[]>(`/api/campaigns/?skip=${skip}&limit=${limit}`),
  get: (id: number) =>
    api.get<Campaign>(`/api/campaigns/${id}`),
  create: (data: CampaignCreate) =>
    api.post<Campaign>('/api/campaigns/', data),
  update: (id: number, data: CampaignUpdate) =>
    api.patch<Campaign>(`/api/campaigns/${id}`, data),
  delete: (id: number) =>
    api.delete(`/api/campaigns/${id}`),
}
