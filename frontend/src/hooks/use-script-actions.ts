import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { scriptActionsApi } from '@/api/script-actions'
import type { ScriptActionCreate, ScriptActionUpdate } from '@/types/script-action'

export function useScriptActions() {
  return useQuery({
    queryKey: ['script-actions'],
    queryFn: () => scriptActionsApi.list(),
  })
}

export function useCreateScriptAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ScriptActionCreate) => scriptActionsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['script-actions'] }),
  })
}

export function useUpdateScriptAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ScriptActionUpdate }) => scriptActionsApi.update(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['script-actions'] })
      qc.invalidateQueries({ queryKey: ['script-actions', id] })
    },
  })
}

export function useDeleteScriptAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => scriptActionsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['script-actions'] }),
  })
}
