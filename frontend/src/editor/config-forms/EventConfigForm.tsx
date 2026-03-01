import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  subtype: string
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function EventConfigForm({ subtype, config, onChange }: Props) {
  if (subtype === 'custom') {
    return (
      <div>
        <Label>Event Name</Label>
        <Input
          value={(config.event_name as string) ?? ''}
          onChange={e => onChange({ ...config, event_type: 'custom', event_name: e.target.value })}
          placeholder="my_custom_event"
        />
      </div>
    )
  }

  return <p className="text-sm text-muted-foreground">Event type: {subtype}</p>
}
