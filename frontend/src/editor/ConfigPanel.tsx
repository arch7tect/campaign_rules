import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'
import { EventConfigForm } from './config-forms/EventConfigForm'
import { ConditionConfigForm } from './config-forms/ConditionConfigForm'
import { ModifyModelForm } from './config-forms/ModifyModelForm'
import { ScheduleCommunicationForm } from './config-forms/ScheduleCommunicationForm'
import { RunScriptForm } from './config-forms/RunScriptForm'
import { TriggerEventForm } from './config-forms/TriggerEventForm'
import { CancelCommunicationsForm } from './config-forms/CancelCommunicationsForm'
import type { Node } from '@xyflow/react'
import type { FlowNodeData } from './utils/serialization'

interface ConfigPanelProps {
  node: Node<FlowNodeData> | null
  onConfigChange: (nodeId: string, config: Record<string, unknown>) => void
  onNameChange: (nodeId: string, name: string) => void
  onDelete: (nodeId: string) => void
  onClose: () => void
  campaignId?: number
}

export function ConfigPanel({ node, onConfigChange, onNameChange, onDelete, onClose, campaignId }: ConfigPanelProps) {
  if (!node) return null

  const { subtype, config, customName } = node.data

  function handleChange(newConfig: Record<string, unknown>) {
    onConfigChange(node!.id, newConfig)
  }

  function renderForm() {
    switch (node!.data.nodeType) {
      case 'event':
        return <EventConfigForm subtype={subtype} config={config} onChange={handleChange} />
      case 'condition':
        return <ConditionConfigForm config={config} onChange={handleChange} campaignId={campaignId} />
      case 'action':
        switch (subtype) {
          case 'modify_model': return <ModifyModelForm config={config} onChange={handleChange} campaignId={campaignId} />
          case 'schedule_communication': return <ScheduleCommunicationForm config={config} onChange={handleChange} />
          case 'run_script': return <RunScriptForm config={config} onChange={handleChange} />
          case 'trigger_event': return <TriggerEventForm config={config} onChange={handleChange} />
          case 'cancel_communications': return <CancelCommunicationsForm />
          default: return <p className="text-sm text-muted-foreground">No config for this action type.</p>
        }
      default:
        return null
    }
  }

  return (
    <Sheet open={!!node} onOpenChange={open => { if (!open) onClose() }}>
      <SheetContent className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{(customName as string) || node.data.label}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div>
            <Label>Node Name</Label>
            <Input
              value={(customName as string) ?? ''}
              onChange={e => onNameChange(node!.id, e.target.value)}
              placeholder={node.data.label as string}
            />
          </div>
          {renderForm()}
          <div className="pt-4 border-t">
            <Button variant="destructive" size="sm" onClick={() => onDelete(node.id)}>
              <Trash2 className="h-3 w-3 mr-1" /> Delete Node
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
