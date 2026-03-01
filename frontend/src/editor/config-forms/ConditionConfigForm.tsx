import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ValueRefEditor } from './ValueRefEditor'
import { Plus, Trash2 } from 'lucide-react'
import type { VariableCheck, ComparisonOperator, ValueRef } from '@/types/rule-configs'

interface Props {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
  campaignId?: number
}

const operators: { value: ComparisonOperator; label: string }[] = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '!=' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'not contains' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
  { value: 'is_null', label: 'is null' },
  { value: 'is_not_null', label: 'is not null' },
  { value: 'in', label: 'in' },
  { value: 'not_in', label: 'not in' },
  { value: 'matches', label: 'matches' },
]

const unaryOps = new Set<string>(['is_null', 'is_not_null'])

function emptyRef(): ValueRef {
  return { source: 'constant', value: '' }
}

function emptyCheck(): VariableCheck {
  return { left: emptyRef(), operator: 'eq', right: emptyRef(), port_name: 'match' }
}

export function ConditionConfigForm({ config, onChange, campaignId }: Props) {
  const checks = (config.checks as VariableCheck[] | undefined) ?? []
  const hasElse = (config.has_else_port as boolean | undefined) !== false

  function updateCheck(index: number, patch: Partial<VariableCheck>) {
    const updated = checks.map((c, i) => i === index ? { ...c, ...patch } : c)
    onChange({ ...config, condition_type: 'variable_check', checks: updated })
  }

  function addCheck() {
    onChange({ ...config, condition_type: 'variable_check', checks: [...checks, emptyCheck()] })
  }

  function removeCheck(index: number) {
    onChange({ ...config, condition_type: 'variable_check', checks: checks.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Checks</Label>
        <Button variant="outline" size="sm" onClick={addCheck}><Plus className="h-3 w-3 mr-1" /> Add</Button>
      </div>

      {checks.map((check, i) => (
        <div key={i} className="border rounded-md p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium">Check #{i + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => removeCheck(i)}><Trash2 className="h-3 w-3" /></Button>
          </div>

          <ValueRefEditor label="Left" value={check.left} onChange={left => updateCheck(i, { left })} campaignId={campaignId} />

          <Select value={check.operator} onValueChange={op => updateCheck(i, { operator: op as ComparisonOperator })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {operators.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>

          {!unaryOps.has(check.operator) && (
            <ValueRefEditor label="Right" value={check.right ?? emptyRef()} onChange={right => updateCheck(i, { right })} campaignId={campaignId} />
          )}
        </div>
      ))}

      <div className="flex items-center gap-2">
        <Switch checked={hasElse} onCheckedChange={v => onChange({ ...config, condition_type: 'variable_check', has_else_port: v })} />
        <Label className="text-xs">Has else port</Label>
      </div>
    </div>
  )
}
