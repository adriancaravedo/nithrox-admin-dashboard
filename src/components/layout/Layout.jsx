import { Outlet, useLocation } from 'react-router-dom'
import Sidebar, { SidebarProvider, useSidebar } from './Sidebar'

function LayoutInner() {
  const { mobileOpen, setMobileOpen } = useSidebar()
  const location = useLocation()

  // Close mobile sidebar on route change
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Outlet />
      </div>
    </div>
  )
}

export default function Layout() {
  return (
    <SidebarProvider>
      <LayoutInner />
    </SidebarProvider>
  )
}
