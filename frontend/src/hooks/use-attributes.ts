import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attributesApi } from '@/api/attributes'
import type { AttributeDefinitionCreate, AttributeDefinitionUpdate, OwnerType } from '@/types/attribute'

export function useAttributes(params?: { owner_type?: OwnerType; campaign_id?: number }) {
  return useQuery({
    queryKey: ['attributes', params],
    queryFn: () => attributesApi.list(params),
  })
}

export function useCreateAttribute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AttributeDefinitionCreate) => attributesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attributes'] }),
  })
}

export function useUpdateAttribute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AttributeDefinitionUpdate }) => attributesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attributes'] }),
  })
}

export function useDeleteAttribute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => attributesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attributes'] }),
  })
}
