import type { ReactNode } from 'react'

interface BaseNodeProps {
  title: string
  color: string
  customName?: string
  selected?: boolean
  children?: ReactNode
}

const colorClasses: Record<string, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
}

export function BaseNode({ title, color, customName, selected, children }: BaseNodeProps) {
  return (
    <div className={`rounded-lg border bg-card shadow-sm min-w-[160px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className={`${colorClasses[color] ?? 'bg-gray-500'} text-white px-3 py-1.5 rounded-t-lg text-xs font-medium`}>
        {customName || title}
      </div>
      <div className="px-3 py-2 text-sm">
        {children}
      </div>
    </div>
  )
}
