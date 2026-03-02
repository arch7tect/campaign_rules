import { api } from './client'
import type { ScriptAction, ScriptActionCreate, ScriptActionUpdate } from '@/types/script-action'

export const scriptActionsApi = {
  list: () => api.get<ScriptAction[]>('/api/script-actions/'),
  get: (id: number) => api.get<ScriptAction>(`/api/script-actions/${id}`),
  create: (data: ScriptActionCreate) => api.post<ScriptAction>('/api/script-actions/', data),
  update: (id: number, data: ScriptActionUpdate) => api.patch<ScriptAction>(`/api/script-actions/${id}`, data),
  delete: (id: number) => api.delete(`/api/script-actions/${id}`),
}
