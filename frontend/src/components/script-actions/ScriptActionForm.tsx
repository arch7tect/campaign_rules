import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CodeEditor } from '@/components/CodeEditor'
import type { ScriptAction, ScriptActionCreate } from '@/types/script-action'

interface ScriptActionFormProps {
  initial?: ScriptAction
  loading?: boolean
  onSubmit: (data: ScriptActionCreate) => void
}

export function ScriptActionForm({ initial, loading, onSubmit }: ScriptActionFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [script, setScript] = useState(initial?.script ?? "return {'contact.flag': True}")
  const [schemaText, setSchemaText] = useState(
    initial?.param_schema ? JSON.stringify(initial.param_schema, null, 2) : '',
  )
  const [schemaError, setSchemaError] = useState<string | null>(null)

  useEffect(() => {
    setName(initial?.name ?? '')
    setDescription(initial?.description ?? '')
    setScript(initial?.script ?? "return {'contact.flag': True}")
    setSchemaText(initial?.param_schema ? JSON.stringify(initial.param_schema, null, 2) : '')
    setSchemaError(null)
  }, [initial])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    let paramSchema: Record<string, unknown> | null = null
    if (schemaText.trim()) {
      try {
        const parsed = JSON.parse(schemaText)
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          setSchemaError('Param schema must be a JSON object.')
          return
        }
        paramSchema = parsed as Record<string, unknown>
        setSchemaError(null)
      } catch {
        setSchemaError('Invalid JSON for param schema.')
        return
      }
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      script,
      param_schema: paramSchema,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} required />
      </div>

      <div>
        <Label>Description</Label>
        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" />
      </div>

      <div>
        <Label>Param Schema (JSON)</Label>
        <Textarea
          className="font-mono text-xs"
          rows={5}
          value={schemaText}
          onChange={e => {
            setSchemaText(e.target.value)
            if (schemaError) setSchemaError(null)
          }}
          placeholder='{"tier": {"type": "string", "required": true}}'
        />
        {schemaError && <p className="text-xs text-destructive mt-1">{schemaError}</p>}
      </div>

      <div>
        <Label>Python Script</Label>
        <CodeEditor value={script} onChange={setScript} height="280px" />
      </div>

      <p className="text-xs text-muted-foreground">
        Variables: `contact_*`, `member_*`, `conv_*`, `params`, and `param_*`. Return a dict like {'{"contact.score": 100}'}.
      </p>

      <Button type="submit" disabled={loading || !name.trim() || !script.trim()}>
        {initial ? 'Update Action' : 'Create Action'}
      </Button>
    </form>
  )
}
