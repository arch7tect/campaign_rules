import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function TriggerEventForm({ config, onChange }: Props) {
  return (
    <div>
      <Label>Event Name</Label>
      <Input
        value={(config.event_name as string) ?? ''}
        onChange={e => onChange({ ...config, action_type: 'trigger_event', event_name: e.target.value })}
        placeholder="my_event"
      />
    </div>
  )
}
