import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../../stores/useStore'
import Topbar from '../../../components/layout/Topbar'
import { toast } from 'sonner'
import {
  Plus, Trash2, Copy, ExternalLink, Eye, BarChart2,
  GripVertical, X, Pencil, Check, ArrowRight, ArrowLeft,
  AlignLeft, List, ToggleLeft, Calendar, Star, Hash,
  Mail, Phone, Link, Image, Sliders, ClipboardList, Send,
  Palette, Settings, GitBranch, Clock, TrendingUp, Users,
  ChevronDown, Lock, Unlock, Globe, Code
} from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ── Question types ────────────────────────────────────────────
const Q_TYPES = [
  { id: 'short',    label: 'Texto corto',      icon: AlignLeft,    desc: 'Una línea' },
  { id: 'long',     label: 'Texto largo',      icon: AlignLeft,    desc: 'Párrafo' },
  { id: 'choice',   label: 'Opción única',     icon: List,         desc: 'Una respuesta' },
  { id: 'multiple', label: 'Múltiple',         icon: Check,        desc: 'Varias respuestas' },
  { id: 'rating',   label: 'Calificación',     icon: Star,         desc: 'Estrellas 1-10' },
  { id: 'scale',    label: 'Escala',           icon: Sliders,      desc: 'Deslizador' },
  { id: 'date',     label: 'Fecha',            icon: Calendar,     desc: 'Date picker' },
  { id: 'email',    label: 'Email',            icon: Mail,         desc: 'Con validación' },
  { id: 'phone',    label: 'Teléfono',         icon: Phone,        desc: 'Con código país' },
  { id: 'number',   label: 'Número',           icon: Hash,         desc: 'Numérico' },
  { id: 'url',      label: 'URL / Link',       icon: Link,         desc: 'Web' },
  { id: 'yesno',    label: 'Sí / No',          icon: ToggleLeft,   desc: 'Binario' },
  { id: 'upload',   label: 'Archivo',          icon: Image,        desc: 'PDF, imagen...' },
  { id: 'section',  label: 'Sección',          icon: Hash,         desc: 'Separador de secciones' },
  { id: 'statement',label: 'Declaración',      icon: AlignLeft,    desc: 'Solo texto, sin input' },
  { id: 'nps',      label: 'NPS (0-10)',       icon: TrendingUp,   desc: 'Net Promoter Score' },
]

// ── Theme presets ─────────────────────────────────────────────
const THEMES = [
  { id: 'dark',      label: 'Negro',       bg: '#18181b', text: '#ffffff', accent: '#3b82f6', inputBg: '#27272a', inputBorder: '#3f3f46', btnBg: '#ffffff', btnText: '#18181b' },
  { id: 'midnight',  label: 'Midnight',    bg: '#0f172a', text: '#f8fafc', accent: '#818cf8', inputBg: '#1e293b', inputBorder: '#334155', btnBg: '#818cf8', btnText: '#0f172a' },
  { id: 'forest',    label: 'Bosque',      bg: '#14532d', text: '#f0fdf4', accent: '#4ade80', inputBg: '#166534', inputBorder: '#15803d', btnBg: '#4ade80', btnText: '#14532d' },
  { id: 'ocean',     label: 'Océano',      bg: '#0c4a6e', text: '#f0f9ff', accent: '#38bdf8', inputBg: '#075985', inputBorder: '#0369a1', btnBg: '#38bdf8', btnText: '#0c4a6e' },
  { id: 'sunset',    label: 'Sunset',      bg: '#7c2d12', text: '#fff7ed', accent: '#fb923c', inputBg: '#9a3412', inputBorder: '#c2410c', btnBg: '#fb923c', btnText: '#7c2d12' },
  { id: 'purple',    label: 'Violeta',     bg: '#4c1d95', text: '#f5f3ff', accent: '#a78bfa', inputBg: '#5b21b6', inputBorder: '#6d28d9', btnBg: '#a78bfa', btnText: '#4c1d95' },
  { id: 'white',     label: 'Blanco',      bg: '#ffffff', text: '#18181b', accent: '#18181b', inputBg: '#f4f4f5', inputBorder: '#e4e4e7', btnBg: '#18181b', btnText: '#ffffff' },
  { id: 'custom',    label: 'Personalizado', bg: '#18181b', text: '#ffffff', accent: '#3b82f6', inputBg: '#27272a', inputBorder: '#3f3f46', btnBg: '#ffffff', btnText: '#18181b' },
]

const FONT_OPTIONS = [
  { id: 'mono', label: 'Geist Mono', css: "'Geist Mono', monospace" },
  { id: 'inter', label: 'Inter', css: "'Inter', system-ui, sans-serif" },
  { id: 'serif', label: 'Georgia Serif', css: "Georgia, serif" },
  { id: 'rounded', label: 'Nunito (Redondeado)', css: "'Nunito', sans-serif" },
  { id: 'system', label: 'System UI', css: "system-ui, sans-serif" },
]

const LAYOUTS = [
  { id: 'one_by_one', label: 'Una pregunta por vez', icon: '📋', desc: 'Estilo Typeform' },
  { id: 'all_in_one', label: 'Todas juntas', icon: '📄', desc: 'Estilo formulario web' },
  { id: 'sections',   label: 'Por secciones', icon: '📑', desc: 'Agrupadas con separadores' },
]

const DEFAULT_BRIEFING = [
  { id: 'q1', type: 'short', label: '¿Cuál es el nombre de tu empresa o proyecto?', required: true, placeholder: '' },
  { id: 'q2', type: 'long', label: '¿Cuál es el objetivo principal de tu sitio web/app?', required: true, placeholder: 'Vender, generar leads, informar...' },
  { id: 'q3', type: 'choice', label: '¿Qué tipo de proyecto es?', required: true, options: ['Sitio web corporativo', 'Tienda online', 'App web', 'App móvil', 'Landing page', 'Otro'] },
  { id: 'q4', type: 'multiple', label: '¿Qué funcionalidades necesitas?', options: ['Carrito de compras', 'Blog', 'Formulario de contacto', 'Chat en vivo', 'Área de clientes', 'Pasarela de pago', 'Reservas/Agenda', 'Mapa', 'Galería', 'Multiidioma'] },
  { id: 'q5', type: 'long', label: '¿Quién es tu público objetivo?', required: true, placeholder: 'Edad, ubicación, intereses...' },
  { id: 'q6', type: 'short', label: 'Comparte links de referencia o competidores', placeholder: 'https://...' },
  { id: 'q7', type: 'choice', label: '¿Cuál es tu presupuesto aproximado?', options: ['Menos de $500', '$500-$1,500', '$1,500-$5,000', '$5,000-$15,000', 'Más de $15,000', 'Por definir'] },
  { id: 'q8', type: 'date', label: '¿Cuándo necesitas el proyecto listo?', required: true },
  { id: 'q9', type: 'rating', label: '¿Cuánto sabes sobre tecnología web? (1=básico, 10=experto)', max: 10 },
  { id: 'q10', type: 'long', label: '¿Tienes logo, colores o manual de marca?', placeholder: 'Colores, tipografías, estilo...' },
  { id: 'q11', type: 'multiple', label: '¿En qué redes sociales tienes presencia?', options: ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'YouTube', 'Twitter/X', 'WhatsApp Business'] },
  { id: 'q12', type: 'yesno', label: '¿Ya tienes dominio y hosting?' },
  { id: 'q13', type: 'nps', label: '¿Qué tan probable es que recomiendes Nithrox?' },
  { id: 'q14', type: 'long', label: '¿Hay algo más que debamos saber?', placeholder: 'Requisitos especiales...' },
]

// ── Sortable question in builder ──────────────────────────────
function SortableQuestion({ q, index, selected, onSelect, onUpdate, onDelete, questions }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const typeInfo = Q_TYPES.find(t => t.id === q.type)
  const Icon = typeInfo?.icon || AlignLeft
  const isSel = selected === q.id
  const isSection = q.type === 'section' || q.type === 'statement'

  return (
    <div ref={setNodeRef} style={style} {...attributes}
      className={`border rounded-xl transition-all cursor-pointer ${isDragging ? 'opacity-40 shadow-xl' : ''} ${isSel ? 'border-foreground shadow-sm' : isSection ? 'border-dashed border-border bg-muted/20' : 'border-border hover:border-foreground/30'}`}
      onClick={() => onSelect(q.id)}>
      <div className="flex items-start gap-3 p-4">
        <div {...listeners} className="cursor-grab mt-0.5 shrink-0 touch-none text-muted-foreground hover:text-foreground">
          <GripVertical className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-bold text-muted-foreground w-5 shrink-0 mt-1">{isSection ? '—' : index + 1}</span>
        <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {isSel ? (
            <input value={q.label} onChange={e => onUpdate(q.id, { label: e.target.value })} onClick={e => e.stopPropagation()}
              className="w-full text-sm font-medium outline-none bg-transparent border-b border-primary" placeholder="Escribe tu pregunta..." autoFocus />
          ) : (
            <p className={`text-sm font-medium truncate ${isSection ? 'text-muted-foreground uppercase tracking-widest text-[10px] font-bold' : ''}`}>
              {q.label || 'Pregunta sin título'}
            </p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-muted-foreground">{typeInfo?.label}</p>
            {q.required && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 rounded font-bold">REQ</span>}
            {q.logic?.length > 0 && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 rounded font-bold flex items-center gap-0.5"><GitBranch className="w-2.5 h-2.5" /> LÓGICA</span>}
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(q.id) }}
          className="text-muted-foreground hover:text-destructive shrink-0 p-1 rounded hover:bg-accent transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Question editor when selected */}
      {isSel && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-3" onClick={e => e.stopPropagation()}>
          {/* Type selector */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Tipo</label>
            <div className="grid grid-cols-4 gap-1.5">
              {Q_TYPES.map(t => {
                const TIcon = t.icon
                return (
                  <button key={t.id} onClick={() => onUpdate(q.id, { type: t.id })}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left transition-all ${q.type === t.id ? 'border-foreground bg-foreground/5 font-medium' : 'border-border hover:border-foreground/30'}`}>
                    <TIcon className="w-3 h-3 shrink-0" />
                    <span className="text-[9px] truncate">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Description / sublabel */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Descripción (opcional)</label>
            <input value={q.description || ''} onChange={e => onUpdate(q.id, { description: e.target.value })}
              placeholder="Texto de ayuda bajo la pregunta..."
              className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary bg-background" />
          </div>

          {/* Placeholder */}
          {['short','long','url','email','phone','number'].includes(q.type) && (
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Placeholder</label>
              <input value={q.placeholder || ''} onChange={e => onUpdate(q.id, { placeholder: e.target.value })}
                placeholder="Texto de ejemplo..."
                className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary bg-background" />
            </div>
          )}

          {/* Options */}
          {['choice','multiple'].includes(q.type) && (
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Opciones</label>
              <div className="space-y-1.5">
                {(q.options || []).map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-${q.type === 'choice' ? 'full' : 'sm'} border border-border shrink-0`} />
                    <input value={opt} onChange={e => {
                      const opts = [...(q.options || [])]
                      opts[i] = e.target.value
                      onUpdate(q.id, { options: opts })
                    }} className="flex-1 text-xs border-0 border-b border-border outline-none bg-transparent py-0.5 focus:border-primary" />
                    <button onClick={() => onUpdate(q.id, { options: (q.options || []).filter((_, j) => j !== i) })}
                      className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                <button onClick={() => onUpdate(q.id, { options: [...(q.options || []), `Opción ${(q.options?.length || 0) + 1}`] })}
                  className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Agregar opción
                </button>
                {'choice' === q.type && (
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <div onClick={() => onUpdate(q.id, { allow_other: !q.allow_other })}
                      className={`w-8 h-4 rounded-full transition-colors relative ${q.allow_other ? 'bg-foreground' : 'bg-muted'}`}>
                      <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all" style={{ left: q.allow_other ? '18px' : '2px' }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">Agregar opción "Otro"</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Rating config */}
          {['rating','nps'].includes(q.type) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Mín</label>
                <input type="number" value={q.min || (q.type === 'nps' ? 0 : 1)} onChange={e => onUpdate(q.id, { min: parseInt(e.target.value) })} className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Máx</label>
                <input type="number" value={q.max || 10} onChange={e => onUpdate(q.id, { max: parseInt(e.target.value) })} className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Label izquierdo</label>
                <input value={q.label_left || ''} onChange={e => onUpdate(q.id, { label_left: e.target.value })} placeholder="Muy malo" className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Label derecho</label>
                <input value={q.label_right || ''} onChange={e => onUpdate(q.id, { label_right: e.target.value })} placeholder="Excelente" className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background outline-none" />
              </div>
            </div>
          )}

          {/* Scale config */}
          {q.type === 'scale' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Mín</label>
                <input type="number" value={q.min || 0} onChange={e => onUpdate(q.id, { min: parseInt(e.target.value) })} className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Máx</label>
                <input type="number" value={q.max || 100} onChange={e => onUpdate(q.id, { max: parseInt(e.target.value) })} className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Paso</label>
                <input type="number" value={q.step || 1} onChange={e => onUpdate(q.id, { step: parseInt(e.target.value) })} className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background outline-none" />
              </div>
            </div>
          )}

          {/* Validation */}
          {['short','long','number'].includes(q.type) && (
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Validación</label>
              <div className="grid grid-cols-2 gap-2">
                {q.type === 'number' ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Valor mínimo</label>
                      <input type="number" value={q.validation?.min || ''} onChange={e => onUpdate(q.id, { validation: { ...q.validation, min: e.target.value } })}
                        className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Valor máximo</label>
                      <input type="number" value={q.validation?.max || ''} onChange={e => onUpdate(q.id, { validation: { ...q.validation, max: e.target.value } })}
                        className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background outline-none" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Mín caracteres</label>
                      <input type="number" value={q.validation?.minLength || ''} onChange={e => onUpdate(q.id, { validation: { ...q.validation, minLength: e.target.value } })}
                        className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Máx caracteres</label>
                      <input type="number" value={q.validation?.maxLength || ''} onChange={e => onUpdate(q.id, { validation: { ...q.validation, maxLength: e.target.value } })}
                        className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background outline-none" />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Conditional logic */}
          {!isSection && (
            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <GitBranch className="w-3 h-3" /> Lógica condicional
                </label>
                <button onClick={() => onUpdate(q.id, { logic: [...(q.logic || []), { if_question: '', if_answer: '', action: 'show' }] })}
                  className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                  <Plus className="w-3 h-3" /> Agregar regla
                </button>
              </div>
              {(q.logic || []).map((rule, ri) => {
                const sourceQ = questions.find(x => x.id === rule.if_question)
                return (
                  <div key={ri} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase">Si</span>
                    <select value={rule.if_question} onChange={e => { const l = [...q.logic]; l[ri] = { ...l[ri], if_question: e.target.value }; onUpdate(q.id, { logic: l }) }}
                      className="flex-1 border border-border rounded px-1.5 py-1 text-[10px] bg-background outline-none">
                      <option value="">Pregunta...</option>
                      {questions.filter(x => x.id !== q.id && !['section','statement'].includes(x.type)).map(x => (
                        <option key={x.id} value={x.id}>{x.label?.slice(0, 30) || `Pregunta ${x.id}`}</option>
                      ))}
                    </select>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase shrink-0">=</span>
                    <input value={rule.if_answer} onChange={e => { const l = [...q.logic]; l[ri] = { ...l[ri], if_answer: e.target.value }; onUpdate(q.id, { logic: l }) }}
                      placeholder="valor..."
                      className="flex-1 border border-border rounded px-1.5 py-1 text-[10px] bg-background outline-none" />
                    <select value={rule.action} onChange={e => { const l = [...q.logic]; l[ri] = { ...l[ri], action: e.target.value }; onUpdate(q.id, { logic: l }) }}
                      className="border border-border rounded px-1.5 py-1 text-[10px] bg-background outline-none shrink-0">
                      <option value="show">Mostrar</option>
                      <option value="hide">Ocultar</option>
                      <option value="require">Requerir</option>
                      <option value="skip">Saltar a</option>
                    </select>
                    <button onClick={() => onUpdate(q.id, { logic: q.logic.filter((_, j) => j !== ri) })}
                      className="text-muted-foreground hover:text-destructive shrink-0"><X className="w-3 h-3" /></button>
                  </div>
                )
              })}
              {(q.logic || []).length === 0 && (
                <p className="text-[10px] text-muted-foreground">Sin reglas — esta pregunta siempre se muestra</p>
              )}
            </div>
          )}

          {/* Required + hidden toggle */}
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => onUpdate(q.id, { required: !q.required })}
                className={`w-8 h-4 rounded-full transition-colors relative ${q.required ? 'bg-foreground' : 'bg-muted'}`}>
                <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all" style={{ left: q.required ? '18px' : '2px' }} />
              </div>
              <span className="text-[10px] text-muted-foreground">Requerida</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => onUpdate(q.id, { hidden: !q.hidden })}
                className={`w-8 h-4 rounded-full transition-colors relative ${q.hidden ? 'bg-foreground' : 'bg-muted'}`}>
                <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all" style={{ left: q.hidden ? '18px' : '2px' }} />
              </div>
              <span className="text-[10px] text-muted-foreground">Oculta por defecto</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Style editor ──────────────────────────────────────────────
function StyleEditor({ form, updateForm }) {
  const theme = THEMES.find(t => t.id === (form.theme?.preset || 'dark')) || THEMES[0]
  const currentTheme = form.theme?.preset === 'custom' ? { ...theme, ...form.theme?.custom } : theme
  const font = FONT_OPTIONS.find(f => f.id === (form.theme?.font || 'mono')) || FONT_OPTIONS[0]
  const layout = LAYOUTS.find(l => l.id === (form.layout || 'one_by_one')) || LAYOUTS[0]

  const updateTheme = (key, val) => {
    updateForm(form.id, { theme: { ...form.theme, [key]: val } })
  }

  const updateCustomColor = (key, val) => {
    updateForm(form.id, { theme: { ...form.theme, preset: 'custom', custom: { ...(form.theme?.custom || {}), [key]: val } } })
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6">
      {/* Layout */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Diseño del formulario</label>
        <div className="space-y-2">
          {LAYOUTS.map(l => (
            <button key={l.id} onClick={() => updateForm(form.id, { layout: l.id })}
              className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 text-left transition-all ${form.layout === l.id ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/20'}`}>
              <span className="text-xl shrink-0">{l.icon}</span>
              <div>
                <p className="text-xs font-bold">{l.label}</p>
                <p className="text-[10px] text-muted-foreground">{l.desc}</p>
              </div>
              {form.layout === l.id && <Check className="w-4 h-4 ml-auto text-foreground" />}
            </button>
          ))}
        </div>
      </div>

      {/* Theme presets */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tema de color</label>
        <div className="grid grid-cols-4 gap-2">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => updateTheme('preset', t.id)}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${form.theme?.preset === t.id ? 'border-foreground' : 'border-border hover:border-foreground/30'}`}
              style={{ backgroundColor: t.bg }}>
              <div className="w-6 h-3 rounded" style={{ backgroundColor: t.accent }} />
              <p className="text-[9px] font-bold" style={{ color: t.text }}>{t.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom colors */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Colores personalizados</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'bg', label: 'Fondo', val: currentTheme.bg },
            { key: 'text', label: 'Texto', val: currentTheme.text },
            { key: 'accent', label: 'Acento / Botones', val: currentTheme.accent },
            { key: 'inputBg', label: 'Fondo inputs', val: currentTheme.inputBg },
            { key: 'inputBorder', label: 'Borde inputs', val: currentTheme.inputBorder },
            { key: 'btnText', label: 'Texto botón', val: currentTheme.btnText },
          ].map(c => (
            <div key={c.key} className="flex items-center gap-2.5 p-2.5 bg-muted/30 rounded-xl border border-border">
              <input type="color" value={c.val}
                onChange={e => updateCustomColor(c.key, e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0.5 bg-transparent shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold truncate">{c.label}</p>
                <p className="text-[9px] text-muted-foreground font-mono">{c.val}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tipografía</label>
        <div className="space-y-2">
          {FONT_OPTIONS.map(f => (
            <button key={f.id} onClick={() => updateTheme('font', f.id)}
              className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl border-2 text-left transition-all ${form.theme?.font === f.id ? 'border-foreground' : 'border-border hover:border-foreground/20'}`}>
              <p className="text-sm" style={{ fontFamily: f.css }}>{f.label}</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: f.css }}>Aa Bb Cc</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tamaño pregunta</label>
            <select value={form.theme?.question_size || 'xl'} onChange={e => updateTheme('question_size', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-xs bg-background outline-none">
              <option value="lg">Grande (24px)</option>
              <option value="xl">Extra grande (32px)</option>
              <option value="2xl">XXL (40px)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Border radius</label>
            <select value={form.theme?.radius || 'xl'} onChange={e => updateTheme('radius', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-xs bg-background outline-none">
              <option value="none">Sin redondeo</option>
              <option value="sm">Pequeño (4px)</option>
              <option value="lg">Medio (12px)</option>
              <option value="xl">Grande (16px)</option>
              <option value="full">Total (pill)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Intro / Outro */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pantalla de inicio</label>
        <div className="space-y-2">
          <input value={form.intro?.title || ''} onChange={e => updateForm(form.id, { intro: { ...form.intro, title: e.target.value } })}
            placeholder="Título de bienvenida..."
            className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
          <textarea value={form.intro?.description || ''} onChange={e => updateForm(form.id, { intro: { ...form.intro, description: e.target.value } })}
            placeholder="Descripción / instrucciones..."
            rows={2} className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-background resize-none" />
          <input value={form.intro?.button_label || ''} onChange={e => updateForm(form.id, { intro: { ...form.intro, button_label: e.target.value } })}
            placeholder="Texto del botón (ej: Comenzar →)"
            className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pantalla de agradecimiento</label>
        <div className="space-y-2">
          <input value={form.outro?.title || ''} onChange={e => updateForm(form.id, { outro: { ...form.outro, title: e.target.value } })}
            placeholder="¡Gracias! Recibimos tu respuesta."
            className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
          <textarea value={form.outro?.description || ''} onChange={e => updateForm(form.id, { outro: { ...form.outro, description: e.target.value } })}
            placeholder="Mensaje de confirmación..."
            rows={2} className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-background resize-none" />
          <input value={form.outro?.redirect_url || ''} onChange={e => updateForm(form.id, { outro: { ...form.outro, redirect_url: e.target.value } })}
            placeholder="Redirigir a URL al completar (opcional)"
            className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Configuración</label>
        <div className="space-y-2">
          {[
            { key: 'show_progress', label: 'Mostrar barra de progreso' },
            { key: 'show_question_numbers', label: 'Mostrar números de pregunta' },
            { key: 'allow_back', label: 'Permitir volver atrás' },
            { key: 'shuffle_questions', label: 'Ordenar preguntas aleatoriamente' },
            { key: 'one_response_per_device', label: 'Una respuesta por dispositivo' },
            { key: 'show_count', label: 'Mostrar "X de Y preguntas"' },
          ].map(opt => (
            <label key={opt.key} className="flex items-center justify-between py-2 border-b border-border/50 cursor-pointer">
              <span className="text-xs">{opt.label}</span>
              <div onClick={() => updateForm(form.id, { settings: { ...form.settings, [opt.key]: !form.settings?.[opt.key] } })}
                className={`w-9 h-5 rounded-full transition-colors relative ${form.settings?.[opt.key] ? 'bg-foreground' : 'bg-muted'}`}>
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: form.settings?.[opt.key] ? '18px' : '2px' }} />
              </div>
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Máx respuestas</label>
            <input type="number" value={form.settings?.max_responses || ''} onChange={e => updateForm(form.id, { settings: { ...form.settings, max_responses: e.target.value } })}
              placeholder="Sin límite"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cerrar el</label>
            <input type="datetime-local" value={form.settings?.close_at || ''} onChange={e => updateForm(form.id, { settings: { ...form.settings, close_at: e.target.value } })}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Notificaciones</label>
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Email de notificación (cada respuesta)</label>
            <input type="email" value={form.notifications?.email || ''} onChange={e => updateForm(form.id, { notifications: { ...form.notifications, email: e.target.value } })}
              placeholder="adrian@nithrox.com"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Webhook URL (POST por cada respuesta)</label>
            <input type="url" value={form.notifications?.webhook || ''} onChange={e => updateForm(form.id, { notifications: { ...form.notifications, webhook: e.target.value } })}
              placeholder="https://..."
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Full-screen Typeform preview ──────────────────────────────
function FormPreview({ form, onClose, onSubmit }) {
  const theme = THEMES.find(t => t.id === (form.theme?.preset || 'dark')) || THEMES[0]
  const t = form.theme?.preset === 'custom' ? { ...theme, ...form.theme?.custom } : theme
  const font = FONT_OPTIONS.find(f => f.id === (form.theme?.font || 'mono'))?.css || "'Geist Mono', monospace"
  const layout = form.layout || 'one_by_one'
  const questions = (form.questions || []).filter(q => q.type !== 'section' && q.type !== 'statement' || true)
  const [current, setCurrent] = useState(-1) // -1 = intro screen
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [otherValues, setOtherValues] = useState({})

  const visibleQuestions = questions.filter(q => {
    if (!q.logic?.length) return true
    return q.logic.every(rule => {
      if (rule.action !== 'show') return true
      return String(answers[rule.if_question]) === String(rule.if_answer)
    })
  })

  const q = visibleQuestions[current]
  const answer = answers[q?.id] ?? (q?.type === 'multiple' ? [] : q?.type === 'scale' ? (q.min || 0) : '')
  const setAnswer = val => setAnswers(p => ({ ...p, [q.id]: val }))

  const canNext = !q?.required || (
    q.type === 'multiple' ? (answer?.length > 0) :
    q.type === 'yesno' ? (answer !== '') :
    (answer !== '' && answer !== undefined && answer !== null)
  )

  const handleNext = () => {
    if (current === -1) { setCurrent(0); return }
    if (current < visibleQuestions.length - 1) setCurrent(c => c + 1)
    else handleSubmit()
  }
  const handleSubmit = () => { onSubmit(answers); setSubmitted(true) }

  const introTitle = form.intro?.title || form.name
  const introDesc = form.intro?.description || 'Por favor completa este formulario. Solo tomará unos minutos.'
  const introBtnLabel = form.intro?.button_label || 'Comenzar →'
  const outroTitle = form.outro?.title || '¡Gracias!'
  const outroDesc = form.outro?.description || 'Recibimos tus respuestas. Te contactaremos pronto.'
  const progress = current >= 0 ? ((current + 1) / visibleQuestions.length) * 100 : 0
  const qSize = { lg: '24px', xl: '28px', '2xl': '36px' }[form.theme?.question_size || 'xl']
  const borderRadius = { none: '0px', sm: '4px', lg: '12px', xl: '16px', full: '9999px' }[form.theme?.radius || 'xl']

  const inputStyle = { backgroundColor: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.text, borderRadius, fontFamily: font }
  const btnStyle = { backgroundColor: t.accent, color: t.btnText, borderRadius, fontFamily: font }

  const renderInput = () => {
    if (!q) return null
    if (q.type === 'section') return (
      <div className="text-center py-8">
        <div className="w-16 h-px mx-auto mb-6" style={{ backgroundColor: t.text + '30' }} />
        <p className="text-sm font-bold uppercase tracking-widest" style={{ color: t.text + '70' }}>{q.label}</p>
        {q.description && <p className="text-sm mt-2" style={{ color: t.text + '60' }}>{q.description}</p>}
        <button onClick={handleNext} className="mt-6 px-6 py-2.5 text-sm font-bold" style={{ ...btnStyle }}>Continuar →</button>
      </div>
    )
    if (q.type === 'statement') return (
      <div className="py-4">
        {q.description && <p className="text-base leading-relaxed" style={{ color: t.text + '80' }}>{q.description}</p>}
        <button onClick={handleNext} className="mt-6 px-6 py-2.5 text-sm font-bold" style={{ ...btnStyle }}>Entendido →</button>
      </div>
    )
    if (q.type === 'short' || q.type === 'email' || q.type === 'phone' || q.type === 'url' || q.type === 'number') return (
      <input type={q.type === 'number' ? 'number' : q.type === 'email' ? 'email' : 'text'}
        value={answer} onChange={e => setAnswer(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && canNext && handleNext()}
        placeholder={q.placeholder || 'Tu respuesta...'}
        style={{ ...inputStyle, fontSize: '18px', padding: '12px 16px', width: '100%', outline: 'none' }} autoFocus />
    )
    if (q.type === 'long') return (
      <textarea value={answer} onChange={e => setAnswer(e.target.value)}
        placeholder={q.placeholder || 'Tu respuesta...'}
        rows={4} style={{ ...inputStyle, fontSize: '16px', padding: '12px 16px', width: '100%', outline: 'none', resize: 'none' }} autoFocus />
    )
    if (q.type === 'date') return (
      <input type="date" value={answer} onChange={e => setAnswer(e.target.value)}
        style={{ ...inputStyle, fontSize: '16px', padding: '12px 16px', outline: 'none', colorScheme: 'dark' }} autoFocus />
    )
    if (q.type === 'yesno') return (
      <div className="flex gap-4">
        {['Sí', 'No'].map(opt => (
          <button key={opt} onClick={() => { setAnswer(opt); layout === 'one_by_one' && setTimeout(handleNext, 300) }}
            style={{ ...inputStyle, padding: '16px 32px', fontSize: '16px', fontWeight: 'bold', flex: 1, ...(answer === opt ? { borderColor: t.accent, backgroundColor: t.accent + '25' } : {}) }}>
            {opt === 'Sí' ? '👍 Sí' : '👎 No'}
          </button>
        ))}
      </div>
    )
    if (q.type === 'choice') return (
      <div className="space-y-2">
        {(q.options || []).map((opt, i) => (
          <button key={i} onClick={() => { setAnswer(opt); layout === 'one_by_one' && setTimeout(handleNext, 300) }}
            style={{ ...inputStyle, padding: '12px 16px', fontSize: '14px', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', ...(answer === opt ? { borderColor: t.accent, backgroundColor: t.accent + '20' } : {}) }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${answer === opt ? t.accent : t.inputBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: answer === opt ? t.accent : 'transparent' }}>
              {answer === opt && <span style={{ color: t.btnText, fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
            </span>
            {String.fromCharCode(65 + i)} — {opt}
          </button>
        ))}
        {q.allow_other && (
          <div style={{ ...inputStyle, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${t.inputBorder}`, flexShrink: 0 }} />
            <input value={otherValues[q.id] || ''} onChange={e => { setOtherValues(p => ({ ...p, [q.id]: e.target.value })); setAnswer(`Otro: ${e.target.value}`) }}
              placeholder="Otro..." style={{ background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: font, flex: 1 }} />
          </div>
        )}
      </div>
    )
    if (q.type === 'multiple') return (
      <div className="space-y-2">
        {(q.options || []).map((opt, i) => {
          const sel = (answer || []).includes(opt)
          return (
            <button key={i} onClick={() => setAnswer(sel ? (answer || []).filter(x => x !== opt) : [...(answer || []), opt])}
              style={{ ...inputStyle, padding: '12px 16px', fontSize: '14px', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', ...(sel ? { borderColor: t.accent, backgroundColor: t.accent + '20' } : {}) }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${sel ? t.accent : t.inputBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: sel ? t.accent : 'transparent' }}>
                {sel && <span style={{ color: t.btnText, fontSize: '11px' }}>✓</span>}
              </span>
              {opt}
            </button>
          )
        })}
      </div>
    )
    if (q.type === 'rating' || q.type === 'nps') return (
      <div>
        {q.label_left && q.label_right && (
          <div className="flex justify-between text-xs mb-2" style={{ color: t.text + '60' }}>
            <span>{q.label_left}</span><span>{q.label_right}</span>
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: (q.max || 10) - (q.min || (q.type === 'nps' ? 0 : 1)) + 1 }, (_, i) => i + (q.min || (q.type === 'nps' ? 0 : 1))).map(n => (
            <button key={n} onClick={() => { setAnswer(n); layout === 'one_by_one' && setTimeout(handleNext, 300) }}
              style={{ width: '44px', height: '44px', borderRadius, border: `2px solid ${answer === n ? t.accent : t.inputBorder}`, backgroundColor: answer === n ? t.accent : t.inputBg, color: answer === n ? t.btnText : t.text, fontWeight: 'bold', fontFamily: font, fontSize: '14px' }}>
              {n}
            </button>
          ))}
        </div>
      </div>
    )
    if (q.type === 'scale') return (
      <div className="space-y-4">
        <input type="range" min={q.min || 0} max={q.max || 100} step={q.step || 1}
          value={answer || (q.min || 0)} onChange={e => setAnswer(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: t.accent }} />
        <div className="flex justify-between text-sm">
          <span style={{ color: t.text + '60' }}>{q.min || 0}</span>
          <span style={{ color: t.accent, fontWeight: 'bold', fontSize: '24px' }}>{answer || (q.min || 0)}</span>
          <span style={{ color: t.text + '60' }}>{q.max || 100}</span>
        </div>
      </div>
    )
    if (q.type === 'upload') return (
      <div style={{ ...inputStyle, padding: '32px', textAlign: 'center', cursor: 'pointer', border: `2px dashed ${t.inputBorder}` }}>
        <p style={{ color: t.text + '60', fontSize: '14px' }}>📎 Arrastra o haz click para subir</p>
        <p style={{ color: t.text + '40', fontSize: '12px', marginTop: '8px' }}>PNG, JPG, PDF hasta 10MB</p>
      </div>
    )
    return null
  }

  // All-in-one layout
  if (layout === 'all_in_one') return (
    <div className="fixed inset-0 z-[200] overflow-y-auto" style={{ backgroundColor: t.bg, fontFamily: font }}>
      <button onClick={onClose} style={{ position: 'fixed', top: '16px', right: '16px', color: t.text + '50', zIndex: 10 }}><X size={20} /></button>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ color: t.text, fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>{form.name}</h1>
        {introDesc && <p style={{ color: t.text + '70', fontSize: '14px', marginBottom: '40px' }}>{introDesc}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {visibleQuestions.map((qq, i) => {
            const qAnswer = answers[qq.id] ?? (qq.type === 'multiple' ? [] : qq.type === 'scale' ? (qq.min || 0) : '')
            return (
              <div key={qq.id}>
                <p style={{ color: t.text, fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {i + 1}. {qq.label} {qq.required && <span style={{ color: '#ef4444' }}>*</span>}
                </p>
                {qq.description && <p style={{ color: t.text + '60', fontSize: '13px', marginBottom: '12px' }}>{qq.description}</p>}
              </div>
            )
          })}
        </div>
        <button onClick={() => { onSubmit(answers); onClose() }}
          style={{ ...btnStyle, marginTop: '40px', padding: '16px 32px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
          Enviar respuestas
        </button>
      </div>
    </div>
  )

  // One by one layout (Typeform)
  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ backgroundColor: t.bg, fontFamily: font }}>
      {/* Progress */}
      {form.settings?.show_progress !== false && current >= 0 && (
        <div style={{ height: '3px', backgroundColor: t.inputBorder }}>
          <div style={{ height: '100%', backgroundColor: t.accent, width: `${progress}%`, transition: 'width 0.5s ease' }} />
        </div>
      )}

      <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', color: t.text + '50', zIndex: 10 }}><X size={20} /></button>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16" style={{ minHeight: 0 }}>
        <div style={{ width: '100%', maxWidth: '600px' }}>
          {submitted ? (
            <div className="text-center">
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
              <h2 style={{ color: t.text, fontSize: '28px', fontWeight: 'bold', marginBottom: '12px' }}>{outroTitle}</h2>
              <p style={{ color: t.text + '70', fontSize: '16px', marginBottom: '32px' }}>{outroDesc}</p>
              <button onClick={onClose} style={{ ...btnStyle, padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Cerrar</button>
            </div>
          ) : current === -1 ? (
            <div className="text-center">
              {form.intro?.logo && <img src={form.intro.logo} alt="logo" style={{ maxHeight: '60px', marginBottom: '24px', margin: '0 auto 24px' }} />}
              <h2 style={{ color: t.text, fontSize: qSize, fontWeight: 'bold', marginBottom: '16px', lineHeight: 1.2 }}>{introTitle}</h2>
              <p style={{ color: t.text + '70', fontSize: '16px', marginBottom: '40px', lineHeight: 1.6 }}>{introDesc}</p>
              <button onClick={handleNext} style={{ ...btnStyle, padding: '16px 32px', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>{introBtnLabel}</button>
              {form.settings?.show_count !== false && <p style={{ color: t.text + '40', fontSize: '12px', marginTop: '24px' }}>{visibleQuestions.length} preguntas · ~{Math.ceil(visibleQuestions.length * 0.5)} min</p>}
            </div>
          ) : q ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '32px' }}>
                {form.settings?.show_question_numbers !== false && (
                  <span style={{ color: t.text + '40', fontSize: '14px', fontWeight: 'bold', marginTop: '2px', flexShrink: 0 }}>{current + 1} →</span>
                )}
                <div style={{ flex: 1 }}>
                  <h2 style={{ color: t.text, fontSize: qSize, fontWeight: 'bold', lineHeight: 1.3, marginBottom: '8px' }}>
                    {q.label}
                    {q.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                  </h2>
                  {q.description && <p style={{ color: t.text + '60', fontSize: '14px', lineHeight: 1.5 }}>{q.description}</p>}
                </div>
              </div>

              {renderInput()}

              {!['yesno', 'choice', 'rating', 'nps', 'section', 'statement'].includes(q.type) && (
                <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={handleNext} disabled={!canNext}
                    style={{ ...btnStyle, padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: canNext ? 'pointer' : 'not-allowed', opacity: canNext ? 1 : 0.4 }}>
                    {current < visibleQuestions.length - 1 ? 'Siguiente' : 'Enviar'} →
                  </button>
                  <span style={{ color: t.text + '40', fontSize: '12px' }}>o presiona Enter ↵</span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Nav */}
      {current >= 0 && !submitted && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderTop: `1px solid ${t.inputBorder}` }}>
          <button onClick={() => setCurrent(c => Math.max(form.settings?.allow_back === false ? c : c - 1, current > 0 ? 0 : 0))}
            disabled={current === 0 || form.settings?.allow_back === false}
            style={{ color: t.text + '50', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', opacity: (current === 0 || form.settings?.allow_back === false) ? 0.3 : 1 }}>
            ← Anterior
          </button>
          <span style={{ color: t.text + '30', fontSize: '12px' }}>
            {form.settings?.show_count !== false ? `${current + 1} / ${visibleQuestions.length}` : ''}
          </span>
          <div />
        </div>
      )}
    </div>
  )
}

// ── Analytics view ────────────────────────────────────────────
function ResponsesView({ form }) {
  const responses = form.responses || []
  if (responses.length === 0) return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-bold uppercase tracking-widest">Sin respuestas aún</p>
        <p className="text-xs mt-1">Comparte el link del formulario con tu cliente</p>
      </div>
    </div>
  )

  const completionRate = form.views ? Math.round((responses.length / form.views) * 100) : 0
  const avgTime = '2m 34s'

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l: 'RESPUESTAS', v: responses.length, icon: Users },
          { l: 'VISTAS', v: form.views || 0, icon: Eye },
          { l: 'COMPLETADO', v: `${completionRate}%`, icon: TrendingUp },
          { l: 'TIEMPO PROM.', v: avgTime, icon: Clock },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.l} className="bg-background border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.l}</p>
              </div>
              <p className="text-2xl font-bold tabular-nums">{s.v}</p>
            </div>
          )
        })}
      </div>

      {/* Per-question summary */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">RESUMEN POR PREGUNTA</p>
        {(form.questions || []).filter(q => !['section','statement'].includes(q.type)).map(q => {
          const questionAnswers = responses.map(r => r.answers?.[q.id]).filter(Boolean)
          const totalAnswered = questionAnswers.length
          if (['choice','multiple','yesno','rating','nps'].includes(q.type) && totalAnswered > 0) {
            const counts = {}
            questionAnswers.flat().forEach(a => { const k = String(a); counts[k] = (counts[k] || 0) + 1 })
            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
            return (
              <div key={q.id} className="bg-background border border-border rounded-xl p-4">
                <p className="text-xs font-bold mb-3">{q.label}</p>
                <div className="space-y-2">
                  {sorted.slice(0, 6).map(([val, count]) => {
                    const pct = Math.round((count / totalAnswered) * 100)
                    return (
                      <div key={val} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="truncate">{val}</span>
                          <span className="font-bold shrink-0 ml-2">{pct}% ({count})</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          }
          return (
            <div key={q.id} className="bg-background border border-border rounded-xl p-4">
              <p className="text-xs font-bold mb-1">{q.label}</p>
              <p className="text-[10px] text-muted-foreground">{totalAnswered} respuestas · Texto libre</p>
              {questionAnswers.slice(0, 3).map((a, i) => (
                <p key={i} className="text-xs text-muted-foreground mt-1.5 pl-3 border-l-2 border-border truncate">"{String(a)}"</p>
              ))}
            </div>
          )
        })}
      </div>

      {/* Individual responses */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">RESPUESTAS INDIVIDUALES</p>
        {responses.map((r, i) => (
          <div key={r.id} className="bg-background border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
              <p className="text-[10px] font-bold uppercase tracking-widest">#{i + 1}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(r.submitted_at).toLocaleString('es-PE')}</p>
            </div>
            <div className="divide-y divide-border/50">
              {(form.questions || []).map(q => {
                const ans = r.answers?.[q.id]
                if (!ans && ans !== 0) return null
                return (
                  <div key={q.id} className="px-4 py-2.5">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{q.label}</p>
                    <p className="text-xs">{Array.isArray(ans) ? ans.join(', ') : String(ans)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Forms page ───────────────────────────────────────────
export default function FormsPage() {
  const { forms, addForm, updateForm, deleteForm, addFormResponse } = useStore()
  const [activeForm, setActiveForm] = useState(null)
  const [activeTab, setActiveTab] = useState('builder')
  const [selectedQ, setSelectedQ] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newFormName, setNewFormName] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const form = forms.find(f => f.id === activeForm)
  const questions = form?.questions || []

  const createForm = async () => {
    if (!newFormName.trim()) return
    const newForm = await addForm({
      name: newFormName.trim(),
      description: '',
      questions: DEFAULT_BRIEFING,
      theme: { preset: 'dark', font: 'mono' },
      layout: 'one_by_one',
      settings: { show_progress: true, show_question_numbers: true, allow_back: true },
    })
    setNewFormName(''); setShowNew(false)
    if (newForm) {
      setActiveForm(newForm.id)
      toast.success('Formulario creado con 14 preguntas base')
    } else {
      toast.error('Error al crear el formulario')
    }
  }

  const updateQ = (qId, data) => updateForm(form.id, { questions: questions.map(q => q.id === qId ? { ...q, ...data } : q) })
  const deleteQ = (qId) => { updateForm(form.id, { questions: questions.filter(q => q.id !== qId) }); if (selectedQ === qId) setSelectedQ(null) }
  const addQuestion = (type) => {
    const newQ = { id: `q${Date.now()}`, type, label: '', required: false, logic: [], placeholder: '', description: '',
      options: ['choice','multiple'].includes(type) ? ['Opción 1','Opción 2','Opción 3'] : undefined,
      max: ['rating','nps'].includes(type) ? 10 : undefined, min: type === 'nps' ? 0 : undefined }
    updateForm(form.id, { questions: [...questions, newQ] }); setSelectedQ(newQ.id)
  }
  const handleQDrag = ({ active, over }) => {
    if (!over || active.id === over.id) return
    updateForm(form.id, { questions: arrayMove(questions, questions.findIndex(q => q.id === active.id), questions.findIndex(q => q.id === over.id)) })
  }

  const copyLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/f/${form.id}`)
    setCopiedLink(true); toast.success('Link copiado'); setTimeout(() => setCopiedLink(false), 2000)
  }

  const TABS = [
    { id: 'builder', label: 'PREGUNTAS', icon: ClipboardList },
    { id: 'style', label: 'ESTILO', icon: Palette },
    { id: 'responses', label: `RESPUESTAS (${form?.responses?.length || 0})`, icon: BarChart2 },
  ]

  const Q_GROUPS = [
    { label: 'Texto', types: ['short','long','statement'] },
    { label: 'Contacto', types: ['email','phone','url'] },
    { label: 'Selección', types: ['choice','multiple','yesno'] },
    { label: 'Número', types: ['number','rating','scale','nps'] },
    { label: 'Otros', types: ['date','upload','section'] },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="FORMULARIOS" actions={
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" /> Nuevo formulario
        </button>
      } />

      <div className="flex flex-1 overflow-hidden">
        {/* Forms list */}
        <div className="w-64 border-r border-border flex flex-col shrink-0">
          <div className="p-3 border-b border-border">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1">MIS FORMULARIOS ({forms.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {forms.map(f => (
              <button key={f.id} onClick={() => { setActiveForm(f.id); setActiveTab('builder') }}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${activeForm === f.id ? 'bg-foreground text-background' : 'hover:bg-accent/50'}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-xs font-bold uppercase tracking-tight truncate flex-1">{f.name}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1 shrink-0 ${f.status === 'active' ? (activeForm === f.id ? 'bg-green-400 text-green-900' : 'bg-green-100 text-green-700') : (activeForm === f.id ? 'bg-background/20 text-background/70' : 'bg-muted text-muted-foreground')}`}>
                    {f.status === 'active' ? '●' : '○'}
                  </span>
                </div>
                <p className={`text-[10px] ${activeForm === f.id ? 'text-background/60' : 'text-muted-foreground'}`}>
                  {f.questions?.length || 0}q · {f.responses?.length || 0} resp
                </p>
              </button>
            ))}
            {forms.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">Sin formularios</p>
              </div>
            )}
          </div>
        </div>

        {/* Main */}
        {form ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background shrink-0">
              <div className="flex items-center gap-3">
                <input value={form.name} onChange={e => updateForm(form.id, { name: e.target.value })}
                  className="text-sm font-bold outline-none bg-transparent border-b border-transparent focus:border-primary transition-colors uppercase tracking-tight" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg bg-muted/30">
                  <Link className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground truncate max-w-32 font-mono">/f/{form.id.slice(-8)}</span>
                  <button onClick={copyLink} className="text-muted-foreground hover:text-foreground">
                    {copiedLink ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <button onClick={() => setPreviewOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent uppercase tracking-wider font-bold">
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button onClick={() => updateForm(form.id, { status: form.status === 'active' ? 'draft' : 'active' })}
                  className={`px-3 py-1.5 text-xs rounded-lg font-bold uppercase tracking-wider ${form.status === 'active' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-muted text-muted-foreground border border-border hover:bg-accent'}`}>
                  {form.status === 'active' ? '● Activo' : 'Activar'}
                </button>
                <button onClick={() => { deleteForm(form.id); setActiveForm(null) }}
                  className="p-1.5 text-muted-foreground hover:text-destructive rounded hover:bg-accent">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-5 shrink-0">
              {TABS.map(t => {
                const Icon = t.icon
                return (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-[9px] font-bold border-b-2 transition-colors uppercase tracking-widest ${activeTab === t.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <Icon className="w-3.5 h-3.5" /> {t.label}
                  </button>
                )
              })}
            </div>

            {/* Builder */}
            {activeTab === 'builder' && (
              <div className="flex flex-1 overflow-hidden">
                {/* Questions */}
                <div className="flex-1 overflow-y-auto p-5 space-y-2">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleQDrag}>
                    <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                      {questions.map((q, i) => (
                        <SortableQuestion key={q.id} q={q} index={i} selected={selectedQ}
                          onSelect={setSelectedQ} onUpdate={updateQ} onDelete={deleteQ} questions={questions} />
                      ))}
                    </SortableContext>
                  </DndContext>
                  {questions.length === 0 && (
                    <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
                      <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-bold uppercase tracking-widest">Sin preguntas</p>
                      <p className="text-xs mt-1">Agrega preguntas desde el panel de la derecha</p>
                    </div>
                  )}
                </div>

                {/* Add question panel */}
                <div className="w-52 border-l border-border overflow-y-auto shrink-0">
                  <div className="p-3 space-y-4">
                    {Q_GROUPS.map(group => (
                      <div key={group.label}>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1.5">{group.label}</p>
                        <div className="space-y-0.5">
                          {Q_TYPES.filter(t => group.types.includes(t.id)).map(t => {
                            const Icon = t.icon
                            return (
                              <button key={t.id} onClick={() => addQuestion(t.id)}
                                className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-left hover:bg-accent transition-colors group">
                                <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                                <span className="text-xs font-medium">{t.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'style' && <StyleEditor form={form} updateForm={updateForm} />}
            {activeTab === 'responses' && <ResponsesView form={form} />}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">Selecciona un formulario</p>
              <button onClick={() => setShowNew(true)} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-wider">
                <Plus className="w-3.5 h-3.5 inline mr-1" /> Crear formulario
              </button>
            </div>
          </div>
        )}
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-5">Nuevo formulario</h3>
            <input value={newFormName} onChange={e => setNewFormName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createForm()}
              placeholder="Ej: Brief — Fashion Co." autoFocus
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary bg-background mb-3" />
            <p className="text-xs text-muted-foreground mb-5">Se creará con 14 preguntas de briefing base. Puedes editar, agregar lógica condicional y personalizar el estilo.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-accent">Cancelar</button>
              <button onClick={createForm} disabled={!newFormName.trim()} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl disabled:opacity-40 font-bold uppercase tracking-wider">Crear</button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && form && (
        <FormPreview form={form} onClose={() => setPreviewOpen(false)}
          onSubmit={(answers) => { addFormResponse(form.id, { answers }); toast.success('Respuesta registrada') }} />
      )}
    </div>
  )
}
