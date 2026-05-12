import { PanelLeft, Moon, Sun, Search, Menu } from 'lucide-react'
import { useSidebar } from './Sidebar'
import { useTheme } from '../../context/ThemeContext'

export default function Topbar({ title, actions, leftContent, hidePanelToggle }) {
  const { toggle, setMobileOpen } = useSidebar()
  const { dark, toggle: toggleDark } = useTheme()

  return (
    <div className="flex items-center justify-between h-12 px-3 md:px-4 border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Desktop collapse toggle */}
        {!hidePanelToggle && (
          <button
            onClick={toggle}
            className="hidden lg:flex p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
            title="Colapsar menú (⌘B)"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <span className="text-sm font-bold tracking-tight uppercase truncate">{title}</span>

        {leftContent && (
          <div className="hidden lg:flex items-center ml-1">{leftContent}</div>
        )}
      </div>

      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Search — hidden on very small screens */}
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs text-muted-foreground border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <Search className="w-3 h-3" />
          <span>Buscar</span>
          <kbd className="text-[10px] bg-muted px-1 rounded">⌘K</kbd>
        </button>

        {/* Dark mode */}
        <button
          onClick={toggleDark}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title={dark ? 'Modo claro' : 'Modo oscuro'}
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {actions && (
          <div className="flex items-center gap-1.5 md:gap-2 ml-1">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
