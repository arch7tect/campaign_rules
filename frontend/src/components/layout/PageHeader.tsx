import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface Crumb {
  label: string
  to?: string
}

interface PageHeaderProps {
  title: string
  breadcrumbs?: Crumb[]
  actions?: ReactNode
}

export function PageHeader({ title, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:underline">{crumb.label}</Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
