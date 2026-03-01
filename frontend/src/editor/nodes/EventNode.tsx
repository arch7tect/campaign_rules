import { Handle, Position, type NodeProps } from '@xyflow/react'
import { BaseNode } from './BaseNode'

export function EventNode({ data, selected }: NodeProps) {
  return (
    <BaseNode title="Event" color="green" customName={data.customName as string} selected={selected}>
      <div>{data.label as string}</div>
      <Handle type="source" position={Position.Bottom} id="default" />
    </BaseNode>
  )
}
