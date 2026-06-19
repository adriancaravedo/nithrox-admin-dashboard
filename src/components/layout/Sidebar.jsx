import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, createContext, useContext, useEffect } from 'react'
import { useStore } from '../../stores/useStore'
import { useAuth } from '../../context/AuthContext'
import { cn, getInitials } from '../../lib/utils'
import {
  LayoutDashboard, Users, MessageSquare, FolderOpen,
  Tag, CreditCard, Monitor, Bot, Server, Globe,
  Zap, ClipboardList, FileCheck, Calendar, FileText,
  Receipt, Bell, Settings, LogOut, ChevronDown,
  ChevronsUpDown, Menu, X, UserRound,
  Share2, Mail, Store
} from 'lucide-react'

// ── Navigation structure ──────────────────────────────────────
const NAV_GROUPS = [
  {
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/employees', icon: UserRound,       label: 'Empleados' },
    ],
  },
  {
    section: 'CRM',
    items: [
      { to: '/clients',   icon: Users,          label: 'Clientes' },
      { to: '/messages',  icon: MessageSquare,  label: 'Chat',        badge: 'messages' },
      { to: '/documents', icon: FolderOpen,     label: 'Documentos' },
      { to: '/catalogo',  icon: Tag,            label: 'Catálogo' },
      { to: '/billing',   icon: CreditCard,     label: 'Facturación' },
      { to: '/inventory', icon: Store,          label: 'Inventario' },
    ],
  },
  {
    section: 'SERVICIOS',
    items: [
      { to: '/websites', icon: Monitor,  label: 'Websites' },
      { to: '/agents',   icon: Bot,      label: 'Agentes' },
      { to: '/servers',  icon: Server,   label: 'Servidores' },
      { to: '/domains',  icon: Globe,    label: 'Dominios' },
    ],
  },
  {
    section: 'HERRAMIENTAS',
    items: [
      { to: '/social',         icon: Share2,       label: 'Redes Sociales' },
      { to: '/email-marketing', icon: Mail,        label: 'Email Marketing' },
      { to: '/converter',      icon: Zap,          label: 'NTX Convertidor' },
      { to: '/forms',          icon: ClipboardList, label: 'Formularios' },
      { to: '/onboarding',     icon: FileCheck,    label: 'Onboarding' },
      { to: '/agenda',         icon: Calendar,     label: 'Agenda' },
      { to: '/contracts',      icon: FileText,     label: 'Contratos' },
      { to: '/invoices',       icon: Receipt,      label: 'Facturas' },
    ],
  },
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

const BUSINESSES = [
  { id: 'nithrox',        label: 'Nithrox',            initials: 'NX', color: 'bg-foreground' },
  { id: 'thelowyx',       label: 'TheLowyx',           initials: 'TL', color: 'bg-blue-600' },
  { id: 'algolowyx',      label: 'AlgoLowyx',          initials: 'AL', color: 'bg-purple-600' },
  { id: 'lacajadecookie', label: 'La Caja de Cookie',  initials: 'LC', color: 'bg-amber-500' },
  { id: 'lowis',          label: 'Lowis',              initials: 'LW', color: 'bg-rose-500' },
]

export default function Sidebar() {
  const { notifications } = useStore()
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar()
  const { profile, logout } = useAuth()
  const [userOpen, setUserOpen] = useState(false)
  const [bizOpen, setBizOpen] = useState(false)
  const [activeBiz, setActiveBiz] = useState('nithrox')
  const navigate = useNavigate()
  const location = useLocation()
  const currentBiz = BUSINESSES.find(b => b.id === activeBiz) || BUSINESSES[0]

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const unreadNotifs = notifications?.filter(n => !n.read).length || 0
  const unreadMessages = useStore(s => s.messages.reduce((sum, m) => sum + (m.unread || 0), 0))

  const handleLogout = async () => {
    setUserOpen(false)
    await logout()
    navigate('/login')
  }

  const isCollapsed = collapsed && !mobileOpen

  const sidebarClass = cn(
    'flex flex-col bg-background border-r border-border transition-all duration-300 z-50 select-none',
    'hidden lg:flex',
    collapsed ? 'w-14' : 'w-52',
    mobileOpen && '!flex fixed inset-y-0 left-0 w-64 shadow-2xl',
  )

  const getBadge = (badge) => {
    if (badge === 'messages') return unreadMessages > 0 ? unreadMessages : 0
    if (badge === 'notifications') return unreadNotifs > 0 ? unreadNotifs : 0
    return 0
  }

  return (
    <aside className={sidebarClass}>
      {/* Header — Business switcher */}
      <div className={cn(
        'flex items-center border-b border-border shrink-0 h-14 px-3 gap-2 relative',
        isCollapsed && 'justify-center px-0'
      )}>
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', currentBiz.color)}>
          <span className="text-white font-black text-[10px]">{currentBiz.initials}</span>
        </div>

        {!isCollapsed && (
          <>
            <span className="text-sm font-black uppercase tracking-tight flex-1 truncate">{currentBiz.label}</span>
            {/* Mobile close */}
            <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
            {/* Business switcher button */}
            <button
              title="Cambiar negocio"
              onClick={() => setBizOpen(o => !o)}
              className="hidden lg:flex p-1 text-muted-foreground hover:text-foreground rounded hover:bg-accent transition-colors"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {/* Dropdown */}
        {bizOpen && !isCollapsed && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setBizOpen(false)} />
            <div className="absolute top-14 left-1 right-1 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <p className="px-3 pt-2.5 pb-1 text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Mis negocios</p>
              <div className="p-1">
                {BUSINESSES.map(biz => (
                  <button
                    key={biz.id}
                    onClick={() => { setActiveBiz(biz.id); setBizOpen(false) }}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors',
                      activeBiz === biz.id ? 'bg-accent font-semibold' : 'hover:bg-accent/60 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shrink-0', biz.color)}>
                      <span className="text-white font-black text-[9px]">{biz.initials}</span>
                    </div>
                    <span className="flex-1 text-left truncate text-[13px]">{biz.label}</span>
                    {activeBiz === biz.id && <span className="text-[9px] bg-foreground text-background px-1.5 py-0.5 rounded-full font-bold">ACTIVO</span>}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-1' : ''}>
            {/* Section header */}
            {group.section && !isCollapsed && (
              <p className="px-3 pt-3 pb-1 text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.12em]">
                {group.section}
              </p>
            )}
            {group.section && isCollapsed && (
              <div className="mx-2 my-1 h-px bg-border" />
            )}

            {/* Nav items */}
            <div className="px-2 space-y-0.5">
              {group.items.map(({ to, icon: Icon, label, badge }) => {
                const badgeCount = badge ? getBadge(badge) : 0
                return (
                  <NavLink key={to} to={to}
                    title={isCollapsed ? label : undefined}
                    className={({ isActive }) => cn(
                      'flex items-center gap-2.5 px-2 py-[7px] rounded-md text-sm transition-colors relative',
                      isCollapsed ? 'justify-center px-0' : '',
                      isActive
                        ? 'bg-foreground text-background font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                    )}
                  >
                    <Icon className="w-[15px] h-[15px] shrink-0" />
                    {!isCollapsed && <span className="flex-1 truncate text-[13px]">{label}</span>}
                    {/* Badge - expanded */}
                    {!isCollapsed && badgeCount > 0 && (
                      <span className="bg-destructive text-destructive-foreground text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                        {badgeCount}
                      </span>
                    )}
                    {/* Badge dot - collapsed */}
                    {isCollapsed && badgeCount > 0 && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-destructive" />
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}

        {/* Spacer */}
        <div className="flex-1" />
      </nav>

      {/* Bottom: Notifications + User */}
      <div className="shrink-0 border-t border-border">
        {/* Notifications */}
        <div className="px-2 py-2">
          <NavLink to="/notifications" title={isCollapsed ? 'Notificaciones' : undefined}
            className={({ isActive }) => cn(
              'flex items-center gap-2.5 px-2 py-[7px] rounded-md text-sm transition-colors relative',
              isCollapsed ? 'justify-center px-0' : '',
              isActive ? 'bg-foreground text-background font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            )}>
            <Bell className="w-[15px] h-[15px] shrink-0" />
            {!isCollapsed && <span className="flex-1 text-[13px]">Notificaciones</span>}
            {!isCollapsed && unreadNotifs > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                {unreadNotifs}
              </span>
            )}
            {isCollapsed && unreadNotifs > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-destructive" />
            )}
          </NavLink>
        </div>

        {/* User */}
        <div className="px-2 pb-2 relative">
          <button onClick={() => setUserOpen(!userOpen)}
            className={cn(
              'flex items-center w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors',
              isCollapsed ? 'justify-center' : 'gap-2.5'
            )}
            title={isCollapsed ? (profile?.name || 'Usuario') : undefined}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 bg-zinc-800">
              {getInitials(profile?.name || profile?.email || 'AC')}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[11px] font-bold truncate">{profile?.name || 'Admin'}</p>
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
                'absolute bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50',
                isCollapsed ? 'left-14 bottom-2 w-44' : 'left-1 right-1 bottom-12'
              )}>
                <div className="p-1">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-xs font-bold">{profile?.name || 'Admin'}</p>
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
      </div>
    </aside>
  )
}
