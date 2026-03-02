import { useState, useRef, useEffect, useCallback } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'

export function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  markerEnd,
  style,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const displayLabel = (data?.customLabel as string) ?? (label as string) ?? ''
  const hasVisibleLabel = displayLabel.trim().length > 0
  const onLabelChange = data?.onLabelChange as ((edgeId: string, newLabel: string) => void) | undefined

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const commit = useCallback(() => {
    setEditing(false)
    if (onLabelChange && draft !== displayLabel) {
      onLabelChange(id, draft)
    }
  }, [id, draft, displayLabel, onLabelChange])

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {editing ? (
            <input
              ref={inputRef}
              className="bg-background border rounded px-1.5 py-0.5 text-xs w-20 text-center outline-none focus:ring-1 focus:ring-primary"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onMouseDown={e => e.stopPropagation()}
              onKeyDown={e => {
                e.stopPropagation()
                if (e.key === 'Enter') commit()
                if (e.key === 'Escape') setEditing(false)
              }}
            />
          ) : (
            hasVisibleLabel ? (
              <span
                className="bg-background border rounded px-1.5 py-0.5 text-xs cursor-pointer hover:bg-accent"
                onDoubleClick={() => {
                  setDraft(displayLabel)
                  setEditing(true)
                }}
              >
                {displayLabel}
              </span>
            ) : (
              <span
                className="block h-2 w-8 cursor-pointer"
                onDoubleClick={() => {
                  setDraft(displayLabel)
                  setEditing(true)
                }}
              />
            )
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
