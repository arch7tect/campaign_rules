import { Label } from '@/components/ui/label'
import { CodeEditor } from '@/components/CodeEditor'

interface Props {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function RunScriptForm({ config, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label>Python Script</Label>
      <CodeEditor
        value={(config.script as string) ?? ''}
        onChange={script => onChange({ ...config, action_type: 'run_script', script })}
        height="300px"
      />
      <p className="text-xs text-muted-foreground">
        {"Variables: contact_*, member_*, conv_*. Use return {...} to set values (e.g. return {\"contact.score\": 100})."}
      </p>
    </div>
  )
}
