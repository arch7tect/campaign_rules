import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, PanelLeftClose, PanelLeftOpen, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { RuleFlowEditor } from '@/editor/RuleFlowEditor'
import { useCreateRule, useDeleteRule, useRuleGraphMutation, useRules, useUpdateRule } from '@/hooks/use-rules'
import type { RuleGraphUpdate } from '@/types/rule'

export default function RuleEditorPage() {
  const { id, ruleId } = useParams<{ id: string; ruleId: string }>()
  const campaignId = Number(id)
  const navigate = useNavigate()

  const { data: rules, isLoading } = useRules(campaignId)
  const createRule = useCreateRule()
  const deleteRule = useDeleteRule()
  const updateRule = useUpdateRule()
  const graphMutation = useRuleGraphMutation()
  const [newRuleName, setNewRuleName] = useState('')
  const [rulesPanelOpen, setRulesPanelOpen] = useState(false)
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(
    ruleId ? Number(ruleId) : null,
  )

  const selectedRule = useMemo(
    () => rules?.find(r => r.id === selectedRuleId) ?? null,
    [rules, selectedRuleId],
  )

  useEffect(() => {
    if (!rules || rules.length === 0) {
      setSelectedRuleId(null)
      return
    }

    const routeRuleId = ruleId ? Number(ruleId) : null
    if (routeRuleId && rules.some(r => r.id === routeRuleId)) {
      setSelectedRuleId(routeRuleId)
      return
    }

    if (selectedRuleId && rules.some(r => r.id === selectedRuleId)) return

    const firstId = rules[0].id
    setSelectedRuleId(firstId)
    navigate(`/campaigns/${campaignId}/rules/${firstId}`, { replace: true })
  }, [campaignId, navigate, ruleId, rules, selectedRuleId])

  if (isLoading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading rules...</div>

  async function handleSave(graph: RuleGraphUpdate) {
    if (!selectedRuleId) return
    await graphMutation.mutateAsync({ id: selectedRuleId, data: graph })
  }

  function selectRule(idToSelect: number) {
    setSelectedRuleId(idToSelect)
    navigate(`/campaigns/${campaignId}/rules/${idToSelect}`)
  }

  function createNewRule() {
    const name = newRuleName.trim()
    if (!name) return
    createRule.mutate(
      { campaign_id: campaignId, name },
      {
        onSuccess: (rule) => {
          setNewRuleName('')
          selectRule(rule.id)
        },
      },
    )
  }

  function deleteCurrentRule() {
    if (!selectedRule) return
    const nextId = rules?.find(r => r.id !== selectedRule.id)?.id ?? null
    deleteRule.mutate(selectedRule.id, {
      onSuccess: () => {
        if (nextId) {
          selectRule(nextId)
        } else {
          setSelectedRuleId(null)
          navigate(`/campaigns/${campaignId}/rules`)
        }
      },
    })
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center gap-3 px-4 py-2 border-b bg-background">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/campaigns/${campaignId}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRulesPanelOpen(prev => !prev)}
        >
          {rulesPanelOpen ? <PanelLeftClose className="h-4 w-4 mr-1" /> : <PanelLeftOpen className="h-4 w-4 mr-1" />}
          {rulesPanelOpen ? 'Hide Rules' : 'Show Rules'}
        </Button>
        <span className="font-semibold">Campaign Rules</span>
      </header>

      <div className="flex-1 min-h-0 flex">
        {rulesPanelOpen && (
          <aside className="w-80 border-r p-3 space-y-3 overflow-auto">
            <div className="space-y-2">
              <div className="text-sm font-medium">Rules</div>
              <div className="flex gap-2">
                <Input
                  value={newRuleName}
                  onChange={e => setNewRuleName(e.target.value)}
                  placeholder="New rule name"
                />
                <Button
                  size="sm"
                  onClick={createNewRule}
                  disabled={createRule.isPending || !newRuleName.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {rules?.map(rule => (
                <button
                  key={rule.id}
                  className={`w-full rounded-md border p-2 text-left transition-colors ${selectedRuleId === rule.id ? 'border-primary bg-accent' : 'hover:bg-accent/50'}`}
                  onClick={() => selectRule(rule.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{rule.name}</span>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={checked => updateRule.mutate({ id: rule.id, data: { is_active: checked } })}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </button>
              ))}
              {(rules?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">No rules yet. Create your first rule.</p>
              )}
            </div>
          </aside>
        )}

        <div className="flex-1 min-h-0 flex flex-col">
          {selectedRule ? (
            <>
              <div className="h-12 border-b px-4 flex items-center justify-between">
                <div className="text-sm font-medium truncate">{selectedRule.name}</div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteCurrentRule}
                  disabled={deleteRule.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
              <div className="flex-1 min-h-0">
                <RuleFlowEditor
                  rule={selectedRule}
                  onSave={handleSave}
                  saving={graphMutation.isPending}
                  campaignId={campaignId}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a rule to edit.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
