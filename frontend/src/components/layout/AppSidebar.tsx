import { NavLink } from 'react-router-dom'
import { Megaphone, Users } from 'lucide-react'

const links = [
  { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/contacts', label: 'Contacts', icon: Users },
]

export function AppSidebar() {
  return (
    <aside className="w-56 border-r bg-muted/40 flex flex-col">
      <div className="p-4 font-semibold text-lg border-b">Rules Engine</div>
      <nav className="flex-1 p-2 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
