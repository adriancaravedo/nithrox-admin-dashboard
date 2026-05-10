import { useState, useRef, useEffect } from 'react'
import { COL_TYPES, COUNTRY_CODES, validateField, parsePhone, formatPhone } from '../../lib/columnTypes'
import { Check, X, ChevronDown, Plus, Trash2, Pencil } from 'lucide-react'

// ── Phone input with country code picker ─────────────────────
export function PhoneInput({ value, onChange, className = '' }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const parsed = parsePhone(value)
  const ref = useRef()

  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.includes(search)
  )

  const selected = COUNTRY_CODES.find(c => c.code === parsed.countryCode) || COUNTRY_CODES[0]

  return (
    <div ref={ref} className={`flex gap-0 ${className}`} style={{ position: 'relative' }}>
      {/* Country code button */}
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch('') }}
        className="flex items-center gap-1 px-2 py-1.5 border border-r-0 border-border rounded-l-lg bg-muted hover:bg-accent transition-colors text-xs whitespace-nowrap shrink-0"
      >
        <span>{selected.flag}</span>
        <span className="font-mono">{selected.code}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {/* Number input */}
      <input
        type="tel"
        value={parsed.number}
        onChange={e => onChange(formatPhone(parsed.countryCode, e.target.value))}
        placeholder="999 000 111"
        className="flex-1 border border-border rounded-r-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-background min-w-0"
      />

      {/* Country dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-xl shadow-xl w-64 overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar país..."
              className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary bg-background"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(formatPhone(c.code, parsed.number)); setOpen(false) }}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left ${c.code === parsed.countryCode ? 'bg-accent font-medium' : ''}`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Generic typed field input ─────────────────────────────────
export function TypedInput({ col, value, onChange, onError, className = '' }) {
  const [error, setError] = useState(null)

  const handleChange = (val) => {
    const err = validateField(col.type, val)
    setError(err)
    onError?.(err)
    onChange(val)
  }

  const baseClass = `w-full border rounded-lg px-3 py-1.5 text-sm outline-none transition-colors bg-background ${error ? 'border-red-400 focus:border-red-500' : 'border-border focus:border-primary'} ${className}`

  if (col.type === 'phone') {
    return (
      <div>
        <PhoneInput value={value} onChange={handleChange} />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    )
  }

  if (col.type === 'textarea') {
    return <textarea value={value || ''} onChange={e => handleChange(e.target.value)} rows={3}
      placeholder={col.label} className={`${baseClass} resize-none`} />
  }

  if (col.type === 'date') {
    return <input type="date" value={value || ''} onChange={e => handleChange(e.target.value)} className={baseClass} />
  }

  if (col.type === 'number') {
    return (
      <div>
        <input type="number" value={value || ''} onChange={e => handleChange(e.target.value)} className={baseClass} />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    )
  }

  if (col.type === 'currency') {
    return (
      <div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
          <input type="number" value={value || ''} onChange={e => handleChange(e.target.value)}
            placeholder="0.00" className={`${baseClass} pl-7`} />
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    )
  }

  if (col.type === 'checkbox') {
    const checked = value === 'true' || value === true
    return (
      <button type="button" onClick={() => handleChange(checked ? 'false' : 'true')}
        className={`flex items-center gap-2 text-sm ${checked ? 'text-green-600' : 'text-muted-foreground'}`}>
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${checked ? 'bg-green-600 border-green-600' : 'border-border'}`}>
          {checked && <Check className="w-2.5 h-2.5 text-white" />}
        </div>
        {checked ? 'Sí' : 'No'}
      </button>
    )
  }

  if (col.type === 'rating') {
    const current = Number(value) || 0
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => handleChange(String(n))}
            className={`text-lg transition-colors ${n <= current ? 'text-amber-400' : 'text-muted-foreground/30 hover:text-amber-300'}`}>
            ★
          </button>
        ))}
      </div>
    )
  }

  if (col.type === 'select') {
    const options = col.options || []
    return (
      <select value={value || ''} onChange={e => handleChange(e.target.value)} className={baseClass}>
        <option value="">Seleccionar...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }

  if (col.type === 'url') {
    return (
      <div>
        <input type="url" value={value || ''} onChange={e => handleChange(e.target.value)} placeholder="https://..." className={baseClass} />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    )
  }

  // Default: email or text
  return (
    <div>
      <input
        type={col.type === 'email' ? 'email' : 'text'}
        value={value || ''}
        onChange={e => handleChange(e.target.value)}
        placeholder={col.type === 'email' ? 'nombre@empresa.com' : col.label}
        className={baseClass}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ── Column definition editor (used in Add Section dialog) ─────
export function ColDefEditor({ open, onClose, onSave, initial = null }) {
  const [label, setLabel] = useState(initial?.label || '')
  const [type, setType] = useState(initial?.type || 'text')
  const [options, setOptions] = useState(initial?.options || [])
  const [newOption, setNewOption] = useState('')

  useEffect(() => {
    if (open) {
      setLabel(initial?.label || '')
      setType(initial?.type || 'text')
      setOptions(initial?.options || [])
      setNewOption('')
    }
  }, [open, initial])

  const addOption = () => {
    if (!newOption.trim()) return
    setOptions(p => [...p, newOption.trim()])
    setNewOption('')
  }

  const handleSave = () => {
    if (!label.trim()) return
    onSave({ label: label.trim(), type, options, width: initial?.width || 150 })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">{initial ? 'Editar columna' : 'Nueva columna'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Label */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre de la columna</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="País, Cargo, Prioridad..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && type !== 'select' && handleSave()}
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tipo de dato</label>
            <div className="grid grid-cols-2 gap-2">
              {COL_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left ${type === t.id ? 'border-foreground bg-foreground/5 font-medium' : 'border-border hover:border-foreground/30'}`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Options for select type */}
          {type === 'select' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Opciones</label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {options.map((o, i) => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-muted rounded-lg">
                    <span className="flex-1 text-sm">{o}</span>
                    <button onClick={() => setOptions(p => p.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newOption}
                  onChange={e => setNewOption(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addOption()}
                  placeholder="Nueva opción..."
                  className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-background"
                />
                <button onClick={addOption} disabled={!newOption.trim()} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-40">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Type-specific hints */}
          {type === 'email' && (
            <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              📧 Se validará que el valor contenga @ antes de guardar
            </div>
          )}
          {type === 'phone' && (
            <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              📞 Incluye selector de código de área por país
            </div>
          )}
          {type === 'checkbox' && (
            <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              ☑️ Campo booleano — Sí / No. Ej: Activo, Verificado, Cliente recurrente
            </div>
          )}
          {type === 'rating' && (
            <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              ⭐ Puntuación del 1 al 5. Ej: Prioridad, Calidad del lead, Satisfacción
            </div>
          )}
          {type === 'currency' && (
            <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              💰 Valor monetario. Ej: Presupuesto, Facturación anual, Ticket promedio
            </div>
          )}
          {type === 'textarea' && (
            <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              📄 Texto largo. Ej: Descripción, Notas del cliente, Observaciones
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={!label.trim()} className="flex-1 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-40 font-medium transition-colors">
            {initial ? 'Guardar cambios' : 'Agregar columna'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Inline editable cell for Key Information ─────────────────
export function InlineField({ col, value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const [error, setError] = useState(null)

  const commit = () => {
    const err = validateField(col.type, draft)
    if (err) { setError(err); return }
    onSave(draft)
    setEditing(false)
    setError(null)
  }

  const cancel = () => { setDraft(value || ''); setEditing(false); setError(null) }

  const displayValue = () => {
    if (col.type === 'checkbox') {
      const checked = value === 'true' || value === true
      return <span className={checked ? 'text-green-600 font-medium' : 'text-muted-foreground'}>{checked ? '✓ Sí' : '✗ No'}</span>
    }
    if (col.type === 'rating') {
      const n = Number(value) || 0
      if (!n) return <span className="text-muted-foreground">—</span>
      return <span className="text-amber-400">{'★'.repeat(n)}<span className="text-muted-foreground/30">{'★'.repeat(5 - n)}</span></span>
    }
    if (!value) return <span className="text-muted-foreground">—</span>
    if (col.type === 'url') return <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-full">{value}</a>
    if (col.type === 'email') return <a href={`mailto:${value}`} className="text-primary hover:underline">{value}</a>
    if (col.type === 'phone') return <a href={`tel:${value}`} className="text-primary hover:underline">{value}</a>
    if (col.type === 'currency') return <span>${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
    if (col.type === 'textarea') return <span className="text-sm leading-relaxed whitespace-pre-wrap">{value}</span>
    return <span>{value}</span>
  }

  // Checkbox and rating toggle directly without entering edit mode
  if (col.type === 'checkbox') {
    const checked = value === 'true' || value === true
    return (
      <button type="button" onClick={() => onSave(checked ? 'false' : 'true')}
        className="flex items-center gap-2 text-sm">
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${checked ? 'bg-green-600 border-green-600' : 'border-border hover:border-foreground/40'}`}>
          {checked && <Check className="w-2.5 h-2.5 text-white" />}
        </div>
        <span className={checked ? 'text-green-600 font-medium' : 'text-muted-foreground'}>{checked ? 'Sí' : 'No'}</span>
      </button>
    )
  }

  if (col.type === 'rating') {
    const current = Number(value) || 0
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onSave(String(n))}
            className={`text-lg transition-colors leading-none ${n <= current ? 'text-amber-400' : 'text-muted-foreground/30 hover:text-amber-300'}`}>
            ★
          </button>
        ))}
      </div>
    )
  }

  if (editing) {
    return (
      <div className="space-y-1">
        <TypedInput
          col={col}
          value={draft}
          onChange={setDraft}
          onError={setError}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-1 mt-1">
          <button onClick={commit} className="text-green-600 hover:text-green-700 p-0.5"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={cancel} className="text-muted-foreground hover:text-foreground p-0.5"><X className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => { setDraft(value || ''); setEditing(true) }}
      className="text-sm text-left w-full hover:text-primary transition-colors"
    >
      {displayValue()}
    </button>
  )
}
