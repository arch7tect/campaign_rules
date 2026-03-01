import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAttributes } from '@/hooks/use-attributes'
import type { ValueRef, ValueSource } from '@/types/rule-configs'
import type { OwnerType } from '@/types/attribute'

interface Props {
  label: string
  value: ValueRef
  onChange: (v: ValueRef) => void
  campaignId?: number
}

const sources: { value: ValueSource; label: string }[] = [
  { value: 'constant', label: 'Constant' },
  { value: 'attribute', label: 'Attribute' },
  { value: 'expression', label: 'Expression' },
]

const objectTypes: { value: string; ownerType?: OwnerType }[] = [
  { value: 'contact', ownerType: 'contact' },
  { value: 'campaign_member', ownerType: 'campaign_member' },
  { value: 'conversation_results' },
]

export function ValueRefEditor({ label, value, onChange, campaignId }: Props) {
  const selectedObj = objectTypes.find(o => o.value === value.object_type)
  const ownerType = selectedObj?.ownerType

  const { data: globalAttrs } = useAttributes(
    ownerType ? { owner_type: ownerType } : undefined,
  )
  const { data: campaignAttrs } = useAttributes(
    ownerType && campaignId ? { owner_type: ownerType, campaign_id: campaignId } : undefined,
  )

  const allAttrs = [
    ...(globalAttrs ?? []),
    ...(campaignAttrs ?? []).filter(ca => !(globalAttrs ?? []).some(ga => ga.id === ca.id)),
  ]

  return (
    <div className="space-y-2 border rounded-md p-2">
      <Label className="text-xs">{label}</Label>
      <Select value={value.source} onValueChange={s => onChange({ ...value, source: s as ValueSource })}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {sources.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {value.source === 'constant' && (
        <Input
          className="h-8 text-xs"
          placeholder="Value"
          value={value.value != null ? String(value.value) : ''}
          onChange={e => onChange({ ...value, value: e.target.value })}
        />
      )}

      {value.source === 'attribute' && (
        <>
          <Select value={value.object_type ?? ''} onValueChange={v => onChange({ ...value, object_type: v, attribute_name: null })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Object type" /></SelectTrigger>
            <SelectContent>
              {objectTypes.map(o => <SelectItem key={o.value} value={o.value}>{o.value}</SelectItem>)}
            </SelectContent>
          </Select>
          {value.object_type === 'conversation_results' ? (
            <Input
              className="h-8 text-xs"
              placeholder="Key name"
              value={value.attribute_name ?? ''}
              onChange={e => onChange({ ...value, attribute_name: e.target.value })}
            />
          ) : allAttrs.length > 0 ? (
            <Select value={value.attribute_name ?? ''} onValueChange={v => onChange({ ...value, attribute_name: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select attribute" /></SelectTrigger>
              <SelectContent>
                {allAttrs.map(a => (
                  <SelectItem key={a.id} value={a.name}>{a.display_name} ({a.name})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              className="h-8 text-xs"
              placeholder="Attribute name"
              value={value.attribute_name ?? ''}
              onChange={e => onChange({ ...value, attribute_name: e.target.value })}
            />
          )}
        </>
      )}

      {value.source === 'expression' && (
        <Input
          className="h-8 text-xs"
          placeholder="Python expression"
          value={value.expression ?? ''}
          onChange={e => onChange({ ...value, expression: e.target.value })}
        />
      )}
    </div>
  )
}
