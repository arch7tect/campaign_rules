import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactsApi } from '@/api/contacts'
import type { ContactCreate, ContactUpdate } from '@/types/contact'

export function useContacts() {
  return useQuery({ queryKey: ['contacts'], queryFn: () => contactsApi.list() })
}

export function useContact(id: number) {
  return useQuery({ queryKey: ['contacts', id], queryFn: () => contactsApi.get(id) })
}

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ContactCreate) => contactsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}

export function useUpdateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ContactUpdate }) => contactsApi.update(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['contacts', id] })
    },
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => contactsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}
