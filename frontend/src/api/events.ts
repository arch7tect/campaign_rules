import { api } from './client'
import type { EventPayload } from '@/types/event'

export const eventsApi = {
  fire: (data: EventPayload) =>
    api.post<{ status: string; event_type: string }>('/api/events/', data),
}
