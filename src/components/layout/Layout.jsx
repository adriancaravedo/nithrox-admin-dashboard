import { Outlet } from 'react-router-dom'
import Sidebar, { SidebarProvider } from './Sidebar'

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  )
}
