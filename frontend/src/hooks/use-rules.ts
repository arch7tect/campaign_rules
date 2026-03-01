import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rulesApi } from '@/api/rules'
import type { RuleCreate, RuleUpdate, RuleGraphUpdate } from '@/types/rule'

export function useRules(campaignId?: number) {
  return useQuery({
    queryKey: ['rules', { campaign_id: campaignId }],
    queryFn: () => rulesApi.list({ campaign_id: campaignId }),
  })
}

export function useRule(id: number) {
  return useQuery({
    queryKey: ['rules', id],
    queryFn: () => rulesApi.get(id),
  })
}

export function useCreateRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RuleCreate) => rulesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  })
}

export function useUpdateRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RuleUpdate }) => rulesApi.update(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['rules'] })
      qc.invalidateQueries({ queryKey: ['rules', id] })
    },
  })
}

export function useRuleGraphMutation(ruleId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RuleGraphUpdate) => rulesApi.putGraph(ruleId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rules'] })
      qc.invalidateQueries({ queryKey: ['rules', ruleId] })
    },
  })
}

export function useDeleteRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => rulesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  })
}
