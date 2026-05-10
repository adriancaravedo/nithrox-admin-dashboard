import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount || 0)
}

export function formatDate(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))
}

export function formatRelative(date) {
  if (!date) return '—'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `hace ${days}d`
  return formatDate(date)
}

export const ROLES = {
  admin:     { label: 'Admin',         pages: ['*'] },
  designer:  { label: 'Diseñador',     pages: ['projects', 'documents', 'messages', 'dashboard'] },
  developer: { label: 'Desarrollador', pages: ['projects', 'converter', 'servers', 'dashboard'] },
  sales:     { label: 'Ventas',        pages: ['crm', 'agenda', 'messages', 'dashboard'] },
  viewer:    { label: 'Viewer',        pages: ['dashboard'] },
}

export const DEAL_STAGES = [
  { id: 'new',         label: 'Nuevo lead',       color: '#6366f1', pct: 10 },
  { id: 'contacted',   label: 'Contactado',        color: '#8b5cf6', pct: 20 },
  { id: 'meeting',     label: 'Reunión agendada',  color: '#ec4899', pct: 40 },
  { id: 'proposal',    label: 'Propuesta enviada', color: '#f59e0b', pct: 60 },
  { id: 'negotiation', label: 'Negociación',       color: '#f97316', pct: 80 },
  { id: 'won',         label: 'Cerrado ganado',    color: '#22c55e', pct: 100 },
  { id: 'lost',        label: 'Cerrado perdido',   color: '#ef4444', pct: 0 },
]

export const PROJECT_PHASES = [
  { id: 'kickoff',     label: 'Kick off',    pct: 10, icon: '🚀' },
  { id: 'design',      label: 'Diseño',      pct: 40, icon: '🎨' },
  { id: 'development', label: 'Desarrollo',  pct: 40, icon: '⚙️' },
  { id: 'publication', label: 'Publicación', pct: 10, icon: '🌐' },
]

export const FRAMEWORKS = [
  'WordPress', 'WooCommerce', 'Shopify', 'React', 'Next.js',
  'Vue', 'HTML/CSS', 'React Native', 'Flutter', 'Angular', 'Webflow', 'Laravel',
]

export const INDUSTRIES = [
  'Tecnología', 'E-commerce', 'Moda', 'Restaurante', 'Inmobiliaria',
  'Salud', 'Educación', 'Finanzas', 'Retail', 'Servicios', 'Otro',
]

export const LEAD_STATUSES = [
  'New', 'Open', 'In Progress', 'Open Deal', 'Unqualified',
  'Attempted to Contact', 'Connected',
]

export const LIFECYCLE_STAGES = [
  'Lead', 'Marketing Qualified', 'Sales Qualified', 'Opportunity', 'Customer', 'Evangelist',
]

// Shared field definitions — drive both the add form and the detail profile
// type: used by InlineField/TypedInput for editing
// options: used by select type
export const CONTACT_FIELD_DEFS = [
  { id: 'email',              label: 'Email',            type: 'email' },
  { id: 'phone',              label: 'Teléfono',         type: 'phone' },
  { id: 'role',               label: 'Cargo / Rol',      type: 'text' },
  { id: 'lead_status',        label: 'Lead Status',      type: 'select', options: LEAD_STATUSES },
  { id: 'preferred_channels', label: 'Canal preferido',  type: 'text' },
  { id: 'topics',             label: 'Temas',            type: 'text' },
]

export const COMPANY_FIELD_DEFS = [
  { id: 'domain',      label: 'Dominio / Web',  type: 'text' },
  { id: 'ruc',         label: 'RUC',            type: 'text' },
  { id: 'owner',       label: 'Owner',          type: 'text' },
  { id: 'industry',    label: 'Industria',      type: 'text' },
  { id: 'phone',       label: 'Teléfono',       type: 'phone' },
  { id: 'city',        label: 'Ciudad',         type: 'text' },
  { id: 'country',     label: 'País',           type: 'text' },
  { id: 'lifecycle',   label: 'Lifecycle',      type: 'select', options: LIFECYCLE_STAGES },
  { id: 'lead_status', label: 'Lead Status',    type: 'select', options: LEAD_STATUSES },
]

export const BUSINESSES = [
  { id: 'nithrox', label: 'Nithrox', initials: 'NX', color: '#18181b' },
  { id: 'thelowyx', label: 'TheLowyx', initials: 'TL', color: '#2563eb' },
  { id: 'algolowyx', label: 'AlgoLowyx', initials: 'AL', color: '#16a34a' },
]
