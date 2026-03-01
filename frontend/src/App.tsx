import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/AppSidebar'

export default function App() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
