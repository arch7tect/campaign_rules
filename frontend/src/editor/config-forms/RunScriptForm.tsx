import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { CodeEditor } from '@/components/CodeEditor'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateScriptAction, useScriptActions } from '@/hooks/use-script-actions'

interface Props {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function RunScriptForm({ config, onChange }: Props) {
  const { data: actions } = useScriptActions()
  const createAction = useCreateScriptAction()

  const selectedId = config.script_action_id as number | null | undefined
  const currentParams = useMemo(
    () => (config.params as Record<string, unknown> | null | undefined) ?? {},
    [config.params],
  )

  const [paramsText, setParamsText] = useState(JSON.stringify(currentParams, null, 2))
  const [paramsError, setParamsError] = useState<string | null>(null)

  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newScript, setNewScript] = useState("return {'contact.flag': True}")

  useEffect(() => {
    setParamsText(JSON.stringify(currentParams, null, 2))
  }, [currentParams])

  function onParamsChange(nextText: string) {
    setParamsText(nextText)
    try {
      const parsed = JSON.parse(nextText || '{}')
      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        setParamsError('Params must be a JSON object.')
        return
      }
      setParamsError(null)
      onChange({ ...config, action_type: 'run_script', params: parsed })
    } catch {
      setParamsError('Invalid JSON.')
    }
  }

  function createNewAction() {
    const name = newName.trim()
    if (!name || !newScript.trim()) return
    createAction.mutate(
      {
        name,
        description: newDescription.trim() || null,
        script: newScript,
      },
      {
        onSuccess: (action) => {
          onChange({
            ...config,
            action_type: 'run_script',
            script_action_id: action.id,
            params: {},
          })
          setOpen(false)
          setNewName('')
          setNewDescription('')
          setNewScript("return {'contact.flag': True}")
        },
      },
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Script Action</Label>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/script-actions" target="_blank" rel="noreferrer">Manage Library</Link>
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-3 w-3 mr-1" /> New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Script Action</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Action name" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Optional" />
                </div>
                <div>
                  <Label>Script</Label>
                  <CodeEditor value={newScript} onChange={setNewScript} height="220px" />
                </div>
                <Button onClick={createNewAction} disabled={createAction.isPending || !newName.trim() || !newScript.trim()}>
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Select
        value={selectedId ? String(selectedId) : ''}
        onValueChange={v => onChange({ ...config, action_type: 'run_script', script_action_id: Number(v), script: null })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select script action" />
        </SelectTrigger>
        <SelectContent>
          {actions?.map(action => (
            <SelectItem key={action.id} value={String(action.id)}>
              {action.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div>
        <Label>Params (JSON)</Label>
        <Textarea
          className="font-mono text-xs"
          rows={6}
          value={paramsText}
          onChange={e => onParamsChange(e.target.value)}
          placeholder='{"tier":"vip"}'
        />
        {paramsError && <p className="text-xs text-destructive mt-1">{paramsError}</p>}
      </div>

      <p className="text-xs text-muted-foreground">
        Variables: `contact_*`, `member_*`, `conv_*`, `params`, and `param_*`.
      </p>
    </div>
  )
}
