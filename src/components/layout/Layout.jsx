import { Outlet } from 'react-router-dom'
import Sidebar, { SidebarProvider, useSidebar } from './Sidebar'
import InventoryPage from '../../pages/nithrox/inventory/InventoryPage'
import TradingPage from '../../pages/algolowyx/TradingPage'

const BIZ_DASHBOARDS = {
  lowis:      InventoryPage,
  algolowyx:  TradingPage,
}

function LayoutInner() {
  const { mobileOpen, setMobileOpen, activeBiz } = useSidebar()
  const CustomDashboard = BIZ_DASHBOARDS[activeBiz]

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
        {CustomDashboard ? <CustomDashboard /> : <Outlet />}
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
