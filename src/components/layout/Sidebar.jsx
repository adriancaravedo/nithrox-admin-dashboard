import { NavLink, useNavigate } from 'react-router-dom'
import { useState, createContext, useContext } from 'react'
import { useStore } from '../../stores/useStore'
import { cn, getInitials, BUSINESSES } from '../../lib/utils'
import { t } from '../../lib/i18n'
import {
  LayoutDashboard, Users, FolderKanban, MessageSquare,
  FileText, FolderOpen, Calendar, Zap, Server, Bell,
  Settings, LogOut, ChevronDown, Plus, ClipboardList,
  Store, BarChart2, FileCheck, Globe,
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

export const SidebarContext = createContext({ collapsed: false, toggle: () => {} })
export const useSidebar = () => useContext(SidebarContext)

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed(c => !c) }}>
      {children}
    </SidebarContext.Provider>
  )
}

export default function Sidebar() {
  const { currentBusiness, setBusiness, notifications } = useStore()
  const { collapsed } = useSidebar()
  const [bizOpen, setBizOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const navigate = useNavigate()

  const unreadCount = notifications.filter(n => !n.read).length
  const currentBiz = BUSINESSES.find(b => b.id === currentBusiness) || BUSINESSES[0]

  return (
    <aside className={cn(
      'relative flex flex-col min-h-screen border-r border-border bg-background shrink-0 transition-[width] duration-200 overflow-hidden',
      collapsed ? 'w-[52px]' : 'w-[220px]'
    )}>
      {/* Business Switcher */}
      <div className="p-2 border-b border-border shrink-0">
        <button
          onClick={() => setBizOpen(!bizOpen)}
          className={cn('flex items-center w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-left', collapsed ? 'justify-center' : 'gap-2.5')}
          title={collapsed ? currentBiz.label : undefined}
        >
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: currentBiz.color }}>
            {currentBiz.initials}
          </div>
          {!collapsed && <>
            <span className="text-sm font-bold flex-1 truncate uppercase tracking-tight">{currentBiz.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </>}
        </button>

        {bizOpen && !collapsed && (
          <div className="mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-2 py-2 space-y-0.5">
              {BUSINESSES.map(biz => (
                <button key={biz.id} onClick={() => { setBusiness(biz.id); setBizOpen(false) }}
                  className={cn('flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg text-sm transition-colors', currentBusiness === biz.id ? 'bg-accent font-medium' : 'hover:bg-accent')}>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: biz.color }}>{biz.initials}</div>
                  {biz.label}
                </button>
              ))}
              <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors mt-0.5">
                <Plus className="w-4 h-4" /> Add business
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(({ to, icon: Icon, key }) => {
          const lang = useStore.getState().language || 'es'
          const label = t(key, lang)
          return (
            <NavLink key={to} to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) => cn(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors relative',
                collapsed ? 'justify-center px-0' : '',
                isActive ? 'bg-accent text-accent-foreground font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{label}</span>}
              {!collapsed && to === '/notifications' && unreadCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
              {!collapsed && to === '/messages' && (
                <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
              )}
              {collapsed && to === '/notifications' && unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-destructive" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-2 border-t border-border shrink-0">
        <button onClick={() => setUserOpen(!userOpen)}
          className={cn('flex items-center w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors', collapsed ? 'justify-center' : 'gap-2.5')}
          title={collapsed ? 'Adrian Caravedo' : undefined}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: '#18181b' }}>
            AC
          </div>
          {!collapsed && <>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-bold truncate uppercase tracking-tight">Adrian Caravedo</p>
              <p className="text-[10px] text-muted-foreground">CEO · NTX Labs</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </>}
        </button>

        {userOpen && (
          <div className={cn('bg-popover border border-border rounded-xl shadow-xl overflow-hidden', collapsed ? 'absolute left-14 bottom-4 w-44 z-50' : 'mt-1')}>
            <div className="p-1">
              <div className="px-2 py-2 border-b border-border mb-1">
                <p className="text-xs font-bold uppercase">Adrian Caravedo</p>
                <p className="text-[10px] text-muted-foreground">CEO · Nithrox</p>
              </div>
              <NavLink to="/settings" className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors" onClick={() => setUserOpen(false)}>
                <Settings className="w-3.5 h-3.5" /> Ajustes
              </NavLink>
              <button onClick={() => { setUserOpen(false) }} className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors w-full text-left text-destructive">
                <LogOut className="w-3.5 h-3.5" /> Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
