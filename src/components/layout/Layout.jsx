import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar, { SidebarProvider, useSidebar } from './Sidebar'
import BizSidebar from './BizSidebar'
import InventoryPage from '../../pages/nithrox/inventory/InventoryPage'
import TradingPage from '../../pages/algolowyx/TradingPage'
import {
  Package, Tag, BarChart3, Link2,
  BookOpen, Activity, DollarSign, LayoutDashboard, Menu,
} from 'lucide-react'

// ── Per-business sidebar configs ──────────────────────────────
const BIZ_CONFIGS = {
  lowis: {
    defaultSection: 'products',
    Page: InventoryPage,
    sections: [
      {
        label: null,
        items: [
          { id: 'products',     label: 'Productos',           icon: Package },
          { id: 'categories',   label: 'Categorías',          icon: Tag },
          { id: 'stock',        label: 'Stock & Movimientos', icon: BarChart3 },
          { id: 'integrations', label: 'Integraciones',       icon: Link2 },
        ],
      },
    ],
  },
  algolowyx: {
    defaultSection: 'dashboard',
    Page: TradingPage,
    sections: [
      {
        label: null,
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'journal',   label: 'Journal',   icon: BookOpen },
          { id: 'analytics', label: 'Analytics', icon: Activity },
          { id: 'accounts',  label: 'Cuentas',   icon: DollarSign },
        ],
      },
    ],
  },
}

// ── Inner layout that reads sidebar context ───────────────────
function LayoutInner() {
  const { mobileOpen, setMobileOpen, activeBiz } = useSidebar()
  const [bizSection, setBizSection] = useState({}) // { [bizId]: activeSection }

  const config = BIZ_CONFIGS[activeBiz]

  if (config) {
    const activeSection = bizSection[activeBiz] || config.defaultSection
    const setActiveSection = (section) =>
      setBizSection(prev => ({ ...prev, [activeBiz]: section }))
    const Page = config.Page

    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <BizSidebar
          config={config}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Page activeTab={activeSection} setActiveTab={setActiveSection} />
        </div>
      </div>
    )
  }

  // Default: Nithrox + other businesses that share the main admin
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-background shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm">Nithrox</span>
        </div>
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
