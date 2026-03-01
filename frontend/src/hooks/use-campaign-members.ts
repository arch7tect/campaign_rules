import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignMembersApi } from '@/api/campaign-members'
import type { CampaignMemberCreate, CampaignMemberUpdate } from '@/types/campaign-member'

export function useCampaignMembers(params?: { campaign_id?: number; contact_id?: number }) {
  return useQuery({
    queryKey: ['campaign-members', params],
    queryFn: () => campaignMembersApi.list(params),
  })
}

export function useCreateCampaignMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CampaignMemberCreate) => campaignMembersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign-members'] }),
  })
}

export function useUpdateCampaignMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CampaignMemberUpdate }) => campaignMembersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign-members'] }),
  })
}

export function useDeleteCampaignMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => campaignMembersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign-members'] }),
  })
}
