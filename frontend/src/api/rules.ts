import { api } from './client'
import type { Rule, RuleCreate, RuleUpdate, RuleGraphUpdate } from '@/types/rule'

export const rulesApi = {
  list: (params?: { campaign_id?: number; skip?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.campaign_id != null) q.set('campaign_id', String(params.campaign_id))
    if (params?.skip != null) q.set('skip', String(params.skip))
    if (params?.limit != null) q.set('limit', String(params.limit))
    return api.get<Rule[]>(`/api/rules/?${q}`)
  },
  get: (id: number) =>
    api.get<Rule>(`/api/rules/${id}`),
  create: (data: RuleCreate) =>
    api.post<Rule>('/api/rules/', data),
  update: (id: number, data: RuleUpdate) =>
    api.patch<Rule>(`/api/rules/${id}`, data),
  putGraph: (id: number, data: RuleGraphUpdate) =>
    api.put<Rule>(`/api/rules/${id}/graph`, data),
  delete: (id: number) =>
    api.delete(`/api/rules/${id}`),
}
