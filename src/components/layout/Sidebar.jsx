import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, createContext, useContext, useEffect } from 'react'
import { useStore } from '../../stores/useStore'
import { useAuth } from '../../context/AuthContext'
import { cn, getInitials, BUSINESSES } from '../../lib/utils'
import { t } from '../../lib/i18n'
import {
  LayoutDashboard, Users, FolderKanban, MessageSquare,
  FileText, FolderOpen, Calendar, Zap, Server, Bell,
  Settings, LogOut, ChevronDown, ChevronLeft, ChevronRight,
  ClipboardList, Store, BarChart2, FileCheck, Globe, Menu, X,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',     icon: LayoutDashboard, key: 'nav.dashboard' },
  { to: '/clients',       icon: Users,           key: 'nav.clients' },
  { to: '/projects',      icon: FolderKanban,    key: 'nav.projects' },
  { to: '/proposals',     icon: FileCheck,       key: 'nav.proposals' },
  { to: '/forms',         icon: ClipboardList,   key: 'nav.forms' },
  { to: '/messages',      icon: MessageSquare,   key: 'nav.messages' },
  { to: '/contracts',     icon: FileText,        key: 'nav.contracts' },
  { to: '/documents',     icon: FolderOpen,      key: 'nav.documents' },
  { to: '/portals',       icon: Globe,           key: 'nav.portals' },
  { to: '/agenda',        icon: Calendar,        key: 'nav.agenda' },
  { to: '/converter',     icon: Zap,             key: 'nav.converter' },
  { to: '/insights',      icon: BarChart2,       key: 'nav.insights' },
  { to: '/marketplace',   icon: Store,           key: 'nav.marketplace' },
  { to: '/servers',       icon: Server,          key: 'nav.servers' },
  { to: '/notifications', icon: Bell,            key: 'nav.notifications' },
]

export const SidebarContext = createContext({
  collapsed: false, toggle: () => {},
  mobileOpen: false, setMobileOpen: () => {},
})
export const useSidebar = () => useContext(SidebarContext)

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <SidebarContext.Provider value={{
      collapsed, toggle: () => setCollapsed(c => !c),
      mobileOpen, setMobileOpen,
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

// ── Hamburger button (shown in topbar on mobile) ─────────────
export function MobileMenuButton() {
  const { setMobileOpen } = useSidebar()
  return (
    <button
      onClick={() => setMobileOpen(true)}
      className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}

export default function Sidebar() {
  const { currentBusiness, setBusiness, notifications } = useStore()
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar()
  const { profile, logout } = useAuth()
  const [bizOpen, setBizOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const lang = useStore.getState().language || 'es'

  // Close mobile sidebar on navigation
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const unreadCount = notifications?.filter(n => !n.read).length || 0
  const currentBiz = BUSINESSES?.find(b => b.id === currentBusiness) || { label: 'Nithrox', icon: '⚡' }

  const handleLogout = async () => {
    setUserOpen(false)
    await logout()
    navigate('/login')
  }

  const sidebarClass = cn(
    'flex flex-col bg-background border-r border-border transition-all duration-300 z-50',
    // Desktop: inline, collapsible
    'hidden lg:flex',
    collapsed ? 'w-14' : 'w-56',
    // Mobile: fixed overlay
    mobileOpen && '!flex fixed inset-y-0 left-0 w-64 shadow-2xl',
  )

  return (
    <aside className={sidebarClass}>
      {/* Header */}
      <div className={cn(
        'flex items-center border-b border-border shrink-0 h-14',
        collapsed && !mobileOpen ? 'justify-center px-2' : 'px-3 gap-2'
      )}>
        {/* Logo */}
        <div className="w-7 h-7 bg-foreground rounded-lg flex items-center justify-center shrink-0">
          <span className="text-background font-black text-[10px]">NTX</span>
        </div>

        {(!collapsed || mobileOpen) && (
          <>
            {/* Business switcher */}
            <button onClick={() => setBizOpen(!bizOpen)}
              className="flex-1 flex items-center gap-1.5 text-left hover:bg-accent rounded-lg px-1.5 py-1 transition-colors min-w-0">
              <span className="text-sm font-bold truncate uppercase tracking-tight">{currentBiz.label}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
            </button>

            {/* Mobile close */}
            <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>

          </>
        )}

        {/* Desktop expand (when collapsed) */}
        {collapsed && !mobileOpen && (
          <button onClick={toggle} className="hidden lg:flex p-1 text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-3 h-3" />
          </button>
        )}

        {/* Biz dropdown */}
        {bizOpen && (!collapsed || mobileOpen) && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setBizOpen(false)} />
            <div className="absolute left-2 top-14 w-52 bg-popover border border-border rounded-xl shadow-xl z-50 p-1">
              {BUSINESSES?.map(biz => (
                <button key={biz.id} onClick={() => { setBusiness(biz.id); setBizOpen(false) }}
                  className={cn('flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-colors', currentBusiness === biz.id ? 'bg-accent font-bold' : 'hover:bg-accent/50')}>
                  <span>{biz.icon}</span>
                  <span>{biz.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(({ to, icon: Icon, key }) => {
          const label = t(key, lang)
          const isCollapsed = collapsed && !mobileOpen
          return (
            <NavLink key={to} to={to}
              title={isCollapsed ? label : undefined}
              className={({ isActive }) => cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors relative',
                isCollapsed ? 'justify-center px-0' : '',
                isActive
                  ? 'bg-accent text-accent-foreground font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="flex-1 truncate">{label}</span>}
              {!isCollapsed && to === '/notifications' && unreadCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
              {!isCollapsed && to === '/messages' && (
                <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
              )}
              {isCollapsed && to === '/notifications' && unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-destructive" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-2 border-t border-border shrink-0">
        <button onClick={() => setUserOpen(!userOpen)}
          className={cn(
            'flex items-center w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors',
            collapsed && !mobileOpen ? 'justify-center' : 'gap-2.5'
          )}
          title={collapsed && !mobileOpen ? (profile?.name || 'Usuario') : undefined}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 bg-zinc-800">
            {getInitials(profile?.name || profile?.email || 'AC')}
          </div>
          {(!collapsed || mobileOpen) && (
            <>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-bold truncate uppercase tracking-tight">{profile?.name || 'Admin'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{profile?.email || ''}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </>
          )}
        </button>

        {userOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />
            <div className={cn(
              'bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50',
              collapsed && !mobileOpen ? 'absolute left-14 bottom-4 w-44' : 'absolute left-2 right-2 bottom-14'
            )}>
              <div className="p-1">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-xs font-bold uppercase">{profile?.name || 'Admin'}</p>
                  <p className="text-[10px] text-muted-foreground">{profile?.email}</p>
                </div>
                <NavLink to="/settings"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md hover:bg-accent transition-colors"
                  onClick={() => setUserOpen(false)}>
                  <Settings className="w-3.5 h-3.5" /> Ajustes
                </NavLink>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md hover:bg-accent transition-colors w-full text-left text-destructive">
                  <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
