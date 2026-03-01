import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ValueRefEditor } from './ValueRefEditor'
import { useAttributes } from '@/hooks/use-attributes'
import { Plus, Trash2 } from 'lucide-react'
import type { FieldAssignment, ValueRef } from '@/types/rule-configs'
import type { OwnerType } from '@/types/attribute'

interface Props {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
  campaignId?: number
}

const objectTypes: { value: string; ownerType: OwnerType }[] = [
  { value: 'contact', ownerType: 'contact' },
  { value: 'campaign_member', ownerType: 'campaign_member' },
]

function emptyAssignment(): FieldAssignment {
  return { object_type: 'contact', attribute_name: '', value: { source: 'constant', value: '' } }
}

export function ModifyModelForm({ config, onChange, campaignId }: Props) {
  const assignments = (config.assignments as FieldAssignment[] | undefined) ?? []

  function update(index: number, patch: Partial<FieldAssignment>) {
    const updated = assignments.map((a, i) => i === index ? { ...a, ...patch } : a)
    onChange({ ...config, action_type: 'modify_model', assignments: updated })
  }

  function add() {
    onChange({ ...config, action_type: 'modify_model', assignments: [...assignments, emptyAssignment()] })
  }

  function remove(index: number) {
    onChange({ ...config, action_type: 'modify_model', assignments: assignments.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Assignments</Label>
        <Button variant="outline" size="sm" onClick={add}><Plus className="h-3 w-3 mr-1" /> Add</Button>
      </div>
      {assignments.map((a, i) => (
        <AssignmentRow
          key={i}
          index={i}
          assignment={a}
          campaignId={campaignId}
          onUpdate={update}
          onRemove={remove}
        />
      ))}
    </div>
  )
}

function AssignmentRow({ index, assignment, campaignId, onUpdate, onRemove }: {
  index: number
  assignment: FieldAssignment
  campaignId?: number
  onUpdate: (index: number, patch: Partial<FieldAssignment>) => void
  onRemove: (index: number) => void
}) {
  const selectedObj = objectTypes.find(o => o.value === assignment.object_type)
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
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium">Assignment #{index + 1}</span>
        <Button variant="ghost" size="sm" onClick={() => onRemove(index)}><Trash2 className="h-3 w-3" /></Button>
      </div>
      <Select value={assignment.object_type} onValueChange={v => onUpdate(index, { object_type: v, attribute_name: '' })}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {objectTypes.map(o => <SelectItem key={o.value} value={o.value}>{o.value}</SelectItem>)}
        </SelectContent>
      </Select>
      {allAttrs.length > 0 ? (
        <Select value={assignment.attribute_name} onValueChange={v => onUpdate(index, { attribute_name: v })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select attribute" /></SelectTrigger>
          <SelectContent>
            {allAttrs.map(a => (
              <SelectItem key={a.id} value={a.name}>{a.display_name} ({a.name})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input className="h-8 text-xs" placeholder="Attribute name" value={assignment.attribute_name} onChange={e => onUpdate(index, { attribute_name: e.target.value })} />
      )}
      <ValueRefEditor label="Value" value={assignment.value} onChange={(value: ValueRef) => onUpdate(index, { value })} campaignId={campaignId} />
    </div>
  )
}
