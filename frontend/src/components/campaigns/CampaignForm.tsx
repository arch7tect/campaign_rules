import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Campaign, CampaignCreate, CampaignStatus } from '@/types/campaign'

interface CampaignFormProps {
  initial?: Campaign
  onSubmit: (data: CampaignCreate) => void
  loading?: boolean
}

const statuses: CampaignStatus[] = ['draft', 'active', 'paused', 'completed']

export function CampaignForm({ initial, onSubmit, loading }: CampaignFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [status, setStatus] = useState<CampaignStatus>(initial?.status ?? 'draft')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ name, description: description || null, status })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div>
        <Label>Status</Label>
        <Select value={status} onValueChange={v => setStatus(v as CampaignStatus)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={loading || !name}>{initial ? 'Update' : 'Create'}</Button>
    </form>
  )
}
