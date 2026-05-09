import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, FolderKanban, CreditCard,
  FileText, MessageSquare, LogOut, Menu, X
} from 'lucide-react'

const NAV = [
  { to: '/portal',           label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { to: '/portal/proyecto',  label: 'Mi proyecto',  icon: FolderKanban },
  { to: '/portal/pagos',     label: 'Pagos',        icon: CreditCard },
  { to: '/portal/documentos',label: 'Documentos',   icon: FileText },
  { to: '/portal/mensajes',  label: 'Mensajes',     icon: MessageSquare },
]

export default function PortalLayout() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CL'

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col" style={{ fontFamily: "'Geist Mono', monospace" }}>
      {/* Topbar */}
      <header className="bg-zinc-900 text-white h-14 flex items-center justify-between px-4 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* Mobile menu */}
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
              <span className="text-zinc-900 font-black text-[10px]">NTX</span>
            </div>
            <span className="font-bold text-sm hidden sm:block">Portal del Cliente</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold">{profile?.name || profile?.email}</p>
            <p className="text-[10px] text-zinc-400">Cliente</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
            {initials(profile?.name || profile?.email)}
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`
          bg-white border-r border-zinc-200 flex flex-col shrink-0 z-50
          fixed inset-y-0 left-0 w-64 transition-transform duration-300 pt-14
          lg:static lg:translate-x-0 lg:w-52 lg:pt-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Mobile close */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 lg:hidden">
            <span className="text-xs font-bold uppercase tracking-widest">Menú</span>
            <button onClick={() => setMobileOpen(false)}><X className="w-4 h-4 text-zinc-400" /></button>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {NAV.map(item => {
              const Icon = item.icon
              return (
                <NavLink key={item.to} to={item.to} end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isActive ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}
                  `}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="p-3 border-t border-zinc-100">
            <button onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-colors">
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
