import { Handle, Position, type NodeProps } from '@xyflow/react'
import { BaseNode } from './BaseNode'
import type { VariableCheckConditionConfig, VariableCheck } from '@/types/rule-configs'

function checkSummary(check: VariableCheck): string {
  const left = refLabel(check.left)
  const op = check.operator.replace('_', ' ')
  if (check.operator === 'is_null' || check.operator === 'is_not_null') {
    return `${left} ${op}`
  }
  const right = check.right ? refLabel(check.right) : '?'
  return `${left} ${op} ${right}`
}

function refLabel(ref: { source: string; value?: unknown; attribute_name?: string | null; object_type?: string | null; expression?: string | null }): string {
  if (ref.source === 'attribute') {
    const obj = ref.object_type ? `${ref.object_type}.` : ''
    return obj + (ref.attribute_name ?? '?')
  }
  if (ref.source === 'expression') return ref.expression ?? '?'
  return ref.value != null ? String(ref.value) : '?'
}

export function ConditionNode({ data, selected }: NodeProps) {
  const config = data.config as unknown as VariableCheckConditionConfig | undefined
  const checks = config?.checks ?? []
  const hasElse = config?.has_else_port !== false

  const ports = new Set<string>()
  checks.forEach(c => ports.add(c.port_name))
  if (hasElse) ports.add('else')
  const portList = Array.from(ports)

  return (
    <BaseNode title="Condition" color="yellow" customName={data.customName as string} selected={selected}>
      <Handle type="target" position={Position.Top} id="default" />
      {checks.length > 0 ? (
        <div className="space-y-1">
          {checks.map((check, i) => (
            <div key={i} className="text-[11px] flex items-center gap-1">
              <span className="font-medium text-yellow-700 dark:text-yellow-400">{check.port_name}:</span>
              <span className="text-muted-foreground truncate max-w-[140px]">{checkSummary(check)}</span>
            </div>
          ))}
          {hasElse && <div className="text-[11px] text-muted-foreground italic">else</div>}
        </div>
      ) : (
        <div className="text-muted-foreground text-xs">No checks</div>
      )}
      <div className="flex gap-3 mt-2 justify-center">
        {portList.map((port, i) => (
          <Handle
            key={port}
            type="source"
            position={Position.Bottom}
            id={port}
            style={{ left: `${((i + 1) / (portList.length + 1)) * 100}%` }}
          />
        ))}
      </div>
    </BaseNode>
  )
}
