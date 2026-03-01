import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { communicationsApi } from '@/api/communications'
import type { CommunicationStatus } from '@/types/communication'

export function useCommunications(params?: { campaign_id?: number; contact_id?: number; status?: CommunicationStatus }) {
  return useQuery({
    queryKey: ['communications', params],
    queryFn: () => communicationsApi.list(params),
  })
}

export function useCancelCommunication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => communicationsApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communications'] }),
  })
}
