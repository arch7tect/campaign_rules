import { api } from './client'
import type { AttributeDefinition, AttributeDefinitionCreate, AttributeDefinitionUpdate, OwnerType } from '@/types/attribute'

export const attributesApi = {
  list: (params?: { owner_type?: OwnerType; campaign_id?: number }) => {
    const q = new URLSearchParams()
    if (params?.owner_type) q.set('owner_type', params.owner_type)
    if (params?.campaign_id != null) q.set('campaign_id', String(params.campaign_id))
    return api.get<AttributeDefinition[]>(`/api/attributes/?${q}`)
  },
  get: (id: number) =>
    api.get<AttributeDefinition>(`/api/attributes/${id}`),
  create: (data: AttributeDefinitionCreate) =>
    api.post<AttributeDefinition>('/api/attributes/', data),
  update: (id: number, data: AttributeDefinitionUpdate) =>
    api.patch<AttributeDefinition>(`/api/attributes/${id}`, data),
  delete: (id: number) =>
    api.delete(`/api/attributes/${id}`),
}
