import type { DragEvent } from 'react'

interface PaletteItem {
  nodeType: string
  subtype: string
  label: string
}

const groups: { title: string; items: PaletteItem[] }[] = [
  {
    title: 'Events',
    items: [
      { nodeType: 'event', subtype: 'member_added', label: 'Member Added' },
      { nodeType: 'event', subtype: 'contact_updated', label: 'Contact Updated' },
      { nodeType: 'event', subtype: 'conversation_ended', label: 'Conv. Ended' },
      { nodeType: 'event', subtype: 'conversation_updated', label: 'Conv. Updated' },
      { nodeType: 'event', subtype: 'custom', label: 'Custom Event' },
    ],
  },
  {
    title: 'Conditions',
    items: [
      { nodeType: 'condition', subtype: 'variable_check', label: 'Variable Check' },
    ],
  },
  {
    title: 'Actions',
    items: [
      { nodeType: 'action', subtype: 'modify_model', label: 'Modify Model' },
      { nodeType: 'action', subtype: 'cancel_communications', label: 'Cancel Comms' },
      { nodeType: 'action', subtype: 'schedule_communication', label: 'Schedule Comm' },
      { nodeType: 'action', subtype: 'run_script', label: 'Run Script' },
      { nodeType: 'action', subtype: 'trigger_event', label: 'Trigger Event' },
    ],
  },
]

function onDragStart(e: DragEvent, item: PaletteItem) {
  e.dataTransfer.setData('application/reactflow-type', item.nodeType)
  e.dataTransfer.setData('application/reactflow-subtype', item.subtype)
  e.dataTransfer.setData('application/reactflow-label', item.label)
  e.dataTransfer.effectAllowed = 'move'
}

const colorDot: Record<string, string> = {
  event: 'bg-green-500',
  condition: 'bg-yellow-500',
  action: 'bg-blue-500',
}

export function NodePalette() {
  return (
    <div className="w-52 border-r bg-muted/30 p-3 overflow-y-auto">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Nodes</h3>
      {groups.map(g => (
        <div key={g.title} className="mb-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-1">{g.title}</h4>
          <div className="space-y-1">
            {g.items.map(item => (
              <div
                key={item.subtype}
                draggable
                onDragStart={e => onDragStart(e, item)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-grab hover:bg-accent border border-transparent hover:border-border"
              >
                <span className={`w-2 h-2 rounded-full ${colorDot[item.nodeType]}`} />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
