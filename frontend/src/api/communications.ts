import { api } from './client'
import type { ScheduledCommunication, CommunicationStatus } from '@/types/communication'

export const communicationsApi = {
  list: (params?: { campaign_id?: number; contact_id?: number; status?: CommunicationStatus; skip?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.campaign_id != null) q.set('campaign_id', String(params.campaign_id))
    if (params?.contact_id != null) q.set('contact_id', String(params.contact_id))
    if (params?.status) q.set('status', params.status)
    if (params?.skip != null) q.set('skip', String(params.skip))
    if (params?.limit != null) q.set('limit', String(params.limit))
    return api.get<ScheduledCommunication[]>(`/api/communications/?${q}`)
  },
  cancel: (id: number) =>
    api.post<ScheduledCommunication>(`/api/communications/${id}/cancel`),
}
