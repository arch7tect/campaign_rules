import { api } from './client'
import type { Contact, ContactCreate, ContactUpdate } from '@/types/contact'

export const contactsApi = {
  list: (skip = 0, limit = 100) =>
    api.get<Contact[]>(`/api/contacts/?skip=${skip}&limit=${limit}`),
  get: (id: number) =>
    api.get<Contact>(`/api/contacts/${id}`),
  create: (data: ContactCreate) =>
    api.post<Contact>('/api/contacts/', data),
  update: (id: number, data: ContactUpdate) =>
    api.patch<Contact>(`/api/contacts/${id}`, data),
  delete: (id: number) =>
    api.delete(`/api/contacts/${id}`),
}
