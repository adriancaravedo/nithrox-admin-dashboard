import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../stores/useStore'

const STATIC_COMMANDS = [
  { id: 'dashboard',      label: 'Dashboard',       icon: '⚡', action: '/dashboard' },
  { id: 'clients',        label: 'Clientes',         icon: '👥', action: '/clients' },
  { id: 'projects',       label: 'Proyectos',        icon: '📁', action: '/projects' },
  { id: 'messages',       label: 'Mensajes',         icon: '💬', action: '/messages' },
  { id: 'contracts',      label: 'Contratos',        icon: '📝', action: '/contracts' },
  { id: 'documents',      label: 'Documentos',       icon: '🗂️',  action: '/documents' },
  { id: 'agenda',         label: 'Agenda',           icon: '📅', action: '/agenda' },
  { id: 'converter',      label: 'Converter',        icon: '⚙️',  action: '/converter' },
  { id: 'servers',        label: 'Servidores',       icon: '🖥️',  action: '/servers' },
  { id: 'settings',       label: 'Ajustes',          icon: '⚙️',  action: '/settings' },
  { id: 'notifications',  label: 'Notificaciones',   icon: '🔔', action: '/notifications' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { contacts, companies, projects } = useStore()

  // Build dynamic commands from data
  const dynamicCommands = [
    ...contacts.slice(0, 10).map(c => ({
      id: `contact-${c.id}`, label: c.name, sub: c.email || 'Contacto',
      icon: '👤', action: `/clients/contacts/${c.id}`
    })),
    ...companies.slice(0, 5).map(c => ({
      id: `co-${c.id}`, label: c.name, sub: c.industry || 'Empresa',
      icon: '🏢', action: `/clients/companies/${c.id}`
    })),
    ...projects.filter(p => !p._deleted).slice(0, 5).map(p => ({
      id: `proj-${p.id}`, label: p.name, sub: p.company || 'Proyecto',
      icon: '📁', action: `/projects/${p.id}`
    })),
  ]

  const allCommands = [...STATIC_COMMANDS, ...dynamicCommands]

  const filtered = query.trim()
    ? allCommands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.sub?.toLowerCase().includes(query.toLowerCase())
      )
    : STATIC_COMMANDS

  const [selected, setSelected] = useState(0)

  useEffect(() => { setSelected(0) }, [query])

  const handleOpen = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setOpen(o => !o)
      setQuery('')
    }
    if (e.key === 'Escape') setOpen(false)
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleOpen)
    return () => window.removeEventListener('keydown', handleOpen)
  }, [handleOpen])

  const execute = (cmd) => {
    navigate(cmd.action)
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && filtered[selected]) execute(filtered[selected])
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}>
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <span className="text-muted-foreground text-base">⌘</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar página, contacto, proyecto..."
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="text-[10px] border border-border rounded px-1.5 py-0.5 text-muted-foreground">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Sin resultados para "{query}"
            </div>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={() => execute(cmd)}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${i === selected ? 'bg-accent' : 'hover:bg-accent/50'}`}
            >
              <span className="text-base w-6 text-center shrink-0">{cmd.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{cmd.label}</p>
                {cmd.sub && <p className="text-xs text-muted-foreground truncate">{cmd.sub}</p>}
              </div>
              {i === selected && <kbd className="text-[10px] border border-border rounded px-1.5 py-0.5 text-muted-foreground shrink-0">↵</kbd>}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><kbd className="border border-border rounded px-1">↑↓</kbd> navegar</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><kbd className="border border-border rounded px-1">↵</kbd> abrir</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><kbd className="border border-border rounded px-1">ESC</kbd> cerrar</span>
        </div>
      </div>
    </div>
  )
}
