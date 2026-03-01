import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function ScheduleCommunicationForm({ config, onChange }: Props) {
  function set(key: string, value: string) {
    onChange({ ...config, action_type: 'schedule_communication', [key]: value })
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Channel</Label>
        <Input value={(config.channel as string) ?? ''} onChange={e => set('channel', e.target.value)} placeholder="sms, email, etc." />
      </div>
      <div>
        <Label>Agent Params (JSON)</Label>
        <Textarea
          className="font-mono text-xs"
          rows={4}
          value={config.agent_params ? JSON.stringify(config.agent_params, null, 2) : ''}
          onChange={e => {
            try {
              onChange({ ...config, action_type: 'schedule_communication', agent_params: JSON.parse(e.target.value) })
            } catch {
              // keep raw text while user types invalid JSON
              onChange({ ...config, action_type: 'schedule_communication', agent_params: e.target.value })
            }
          }}
          placeholder="{}"
        />
      </div>
      <div>
        <Label>Min Time Expression</Label>
        <Input value={(config.min_time_expr as string) ?? ''} onChange={e => set('min_time_expr', e.target.value)} placeholder="datetime.now() + timedelta(hours=1)" />
      </div>
      <div>
        <Label>Max Time Expression</Label>
        <Input value={(config.max_time_expr as string) ?? ''} onChange={e => set('max_time_expr', e.target.value)} placeholder="datetime.now() + timedelta(hours=2)" />
      </div>
    </div>
  )
}
