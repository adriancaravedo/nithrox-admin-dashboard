import { useState } from 'react'
import { ChevronsUpDown, ChevronDown, LogOut } from 'lucide-react'
import { useSidebar } from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import { getInitials, cn } from '../../lib/utils'

export const BUSINESSES = [
  { id: 'nithrox',        label: 'Nithrox',           initials: 'NX', color: 'bg-foreground' },
  { id: 'thelowyx',       label: 'TheLowyx',          initials: 'TL', color: 'bg-blue-600' },
  { id: 'algolowyx',      label: 'AlgoLowyx',         initials: 'AL', color: 'bg-purple-600' },
  { id: 'lacajadecookie', label: 'La Caja de Cookie', initials: 'LC', color: 'bg-amber-500' },
  { id: 'lowis',          label: 'Lowis',             initials: 'LW', color: 'bg-rose-500' },
]

export default function BizSidebar({ config, activeSection, setActiveSection }) {
  const { activeBiz, setActiveBiz } = useSidebar()
  const { profile, logout } = useAuth()
  const [bizOpen, setBizOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const biz = BUSINESSES.find(b => b.id === activeBiz) || BUSINESSES[0]

  return (
    <aside className="flex flex-col w-52 bg-background border-r border-border shrink-0 select-none z-10">

      {/* Header — brand + switcher */}
      <div className="relative flex items-center gap-2 h-14 px-3 border-b border-border shrink-0">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', biz.color)}>
          <span className="text-white font-black text-[10px]">{biz.initials}</span>
        </div>
        <span className="text-sm font-black uppercase tracking-tight flex-1 truncate">{biz.label}</span>
        <button
          onClick={() => setBizOpen(o => !o)}
          className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-accent transition-colors"
          title="Cambiar negocio"
        >
          <ChevronsUpDown className="w-3.5 h-3.5" />
        </button>

        {bizOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setBizOpen(false)} />
            <div className="absolute top-14 left-1 right-1 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <p className="px-3 pt-2.5 pb-1 text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
                Mis negocios
              </p>
              <div className="p-1">
                {BUSINESSES.map(b => (
                  <button
                    key={b.id}
                    onClick={() => { setActiveBiz(b.id); setBizOpen(false) }}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors',
                      activeBiz === b.id
                        ? 'bg-accent font-semibold'
                        : 'hover:bg-accent/60 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shrink-0', b.color)}>
                      <span className="text-white font-black text-[9px]">{b.initials}</span>
                    </div>
                    <span className="flex-1 text-left truncate text-[13px]">{b.label}</span>
                    {activeBiz === b.id && (
                      <span className="text-[9px] bg-foreground text-background px-1.5 py-0.5 rounded-full font-bold">
                        ACTIVO
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {config.sections.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-1' : ''}>
            {section.label && (
              <p className="px-3 pt-3 pb-1 text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.12em]">
                {section.label}
              </p>
            )}
            <div className="px-2 space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-2 py-[7px] rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-foreground text-background font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                    )}
                  >
                    <Icon className="w-[15px] h-[15px] shrink-0" />
                    <span className="flex-1 text-left truncate text-[13px]">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="shrink-0 border-t border-border px-2 py-2 relative">
        <button
          onClick={() => setUserOpen(!userOpen)}
          className="flex items-center w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors gap-2.5"
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 bg-zinc-800">
            {getInitials(profile?.name || profile?.email || 'AC')}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-[11px] font-bold truncate">{profile?.name || 'Admin'}</p>
            <p className="text-[10px] text-muted-foreground truncate">{profile?.email || ''}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </button>

        {userOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />
            <div className="absolute left-1 right-1 bottom-12 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-1">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-xs font-bold">{profile?.name || 'Admin'}</p>
                  <p className="text-[10px] text-muted-foreground">{profile?.email}</p>
                </div>
                <button
                  onClick={async () => { setUserOpen(false); await logout() }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md hover:bg-accent transition-colors w-full text-left text-destructive"
                >
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
