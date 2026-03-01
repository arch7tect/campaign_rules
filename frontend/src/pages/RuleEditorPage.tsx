import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { RuleFlowEditor } from '@/editor/RuleFlowEditor'
import { useRule, useUpdateRule, useRuleGraphMutation } from '@/hooks/use-rules'
import type { RuleGraphUpdate } from '@/types/rule'

export default function RuleEditorPage() {
  const { id, ruleId } = useParams<{ id: string; ruleId: string }>()
  const campaignId = Number(id)
  const ruleIdNum = Number(ruleId)
  const navigate = useNavigate()

  const { data: rule, isLoading } = useRule(ruleIdNum)
  const updateRule = useUpdateRule()
  const graphMutation = useRuleGraphMutation(ruleIdNum)

  if (isLoading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading rule...</div>
  if (!rule) return <div className="flex items-center justify-center h-screen">Rule not found</div>

  function handleSave(graph: RuleGraphUpdate) {
    graphMutation.mutate(graph)
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center gap-3 px-4 py-2 border-b bg-background">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/campaigns/${campaignId}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <span className="font-semibold">{rule.name}</span>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">Active</span>
          <Switch
            checked={rule.is_active}
            onCheckedChange={checked => updateRule.mutate({ id: ruleIdNum, data: { is_active: checked } })}
          />
        </div>
      </header>
      <div className="flex-1">
        <RuleFlowEditor rule={rule} onSave={handleSave} saving={graphMutation.isPending} campaignId={campaignId} />
      </div>
    </div>
  )
}
