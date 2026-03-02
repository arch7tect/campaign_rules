import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AttributeDefinition, AttributeDefinitionCreate, DataType, OwnerType } from '@/types/attribute'

interface AttributeFormProps {
  initial?: AttributeDefinition
  campaignId?: number
  ownerType: OwnerType
  onSubmit: (data: AttributeDefinitionCreate) => void
  loading?: boolean
}

const dataTypes: DataType[] = ['string', 'int', 'float', 'bool', 'date', 'datetime', 'enum', 'list', 'phone', 'email', 'url']

export function AttributeForm({ initial, campaignId, ownerType, onSubmit, loading }: AttributeFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [displayName, setDisplayName] = useState(initial?.display_name ?? '')
  const [dataType, setDataType] = useState<DataType>(initial?.data_type ?? 'string')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: AttributeDefinitionCreate = {
      name,
      display_name: displayName,
      data_type: dataType,
      owner_type: ownerType,
    }
    if (ownerType === 'campaign_member' && campaignId != null) {
      data.campaign_id = campaignId
    }
    onSubmit({
      ...data,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="attr_name">Name</Label>
        <Input id="attr_name" value={name} onChange={e => setName(e.target.value)} required disabled={!!initial} />
      </div>
      <div>
        <Label htmlFor="display_name">Display Name</Label>
        <Input id="display_name" value={displayName} onChange={e => setDisplayName(e.target.value)} required />
      </div>
      <div>
        <Label>Data Type</Label>
        <Select value={dataType} onValueChange={v => setDataType(v as DataType)} disabled={!!initial}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {dataTypes.map(dt => <SelectItem key={dt} value={dt}>{dt}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={loading || !name || !displayName}>
        {initial ? 'Update' : 'Create'}
      </Button>
    </form>
  )
}
