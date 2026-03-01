import { Handle, Position, type NodeProps } from '@xyflow/react'
import { BaseNode } from './BaseNode'

export function ActionNode({ data, selected }: NodeProps) {
  return (
    <BaseNode title="Action" color="blue" customName={data.customName as string} selected={selected}>
      <Handle type="target" position={Position.Top} id="default" />
      <div>{data.label as string}</div>
      <Handle type="source" position={Position.Bottom} id="default" />
    </BaseNode>
  )
}
