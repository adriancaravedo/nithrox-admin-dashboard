// ── Column types ─────────────────────────────────────────────
export const COL_TYPES = [
  { id: 'text',      label: 'Texto',          icon: '📝' },
  { id: 'textarea',  label: 'Texto largo',    icon: '📄' },
  { id: 'email',     label: 'Email',          icon: '📧' },
  { id: 'phone',     label: 'Teléfono',       icon: '📞' },
  { id: 'number',    label: 'Número',         icon: '🔢' },
  { id: 'currency',  label: 'Moneda',         icon: '💰' },
  { id: 'date',      label: 'Fecha',          icon: '📅' },
  { id: 'select',    label: 'Lista opciones', icon: '🔽' },
  { id: 'checkbox',  label: 'Sí / No',        icon: '☑️' },
  { id: 'rating',    label: 'Puntuación',     icon: '⭐' },
  { id: 'url',       label: 'URL / Link',     icon: '🔗' },
]

// ── Country codes ─────────────────────────────────────────────
export const COUNTRY_CODES = [
  { code: '+51',  flag: '🇵🇪', name: 'Perú' },
  { code: '+1',   flag: '🇺🇸', name: 'USA / Canadá' },
  { code: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { code: '+55',  flag: '🇧🇷', name: 'Brasil' },
  { code: '+56',  flag: '🇨🇱', name: 'Chile' },
  { code: '+57',  flag: '🇨🇴', name: 'Colombia' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+598', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+58',  flag: '🇻🇪', name: 'Venezuela' },
  { code: '+52',  flag: '🇲🇽', name: 'México' },
  { code: '+502', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+503', flag: '🇸🇻', name: 'El Salvador' },
  { code: '+504', flag: '🇭🇳', name: 'Honduras' },
  { code: '+505', flag: '🇳🇮', name: 'Nicaragua' },
  { code: '+506', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+507', flag: '🇵🇦', name: 'Panamá' },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+34',  flag: '🇪🇸', name: 'España' },
  { code: '+44',  flag: '🇬🇧', name: 'Reino Unido' },
  { code: '+33',  flag: '🇫🇷', name: 'Francia' },
  { code: '+49',  flag: '🇩🇪', name: 'Alemania' },
  { code: '+39',  flag: '🇮🇹', name: 'Italia' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+81',  flag: '🇯🇵', name: 'Japón' },
  { code: '+86',  flag: '🇨🇳', name: 'China' },
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+27',  flag: '🇿🇦', name: 'Sudáfrica' },
  { code: '+971', flag: '🇦🇪', name: 'Emiratos Árabes' },
  { code: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: '+82',  flag: '🇰🇷', name: 'Corea del Sur' },
  { code: '+65',  flag: '🇸🇬', name: 'Singapur' },
]

// ── Validation ────────────────────────────────────────────────
export function validateField(type, value) {
  if (!value || !value.trim()) return null // empty is ok (not required)
  switch (type) {
    case 'email':
      if (!value.includes('@')) return 'El email debe contener @'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido'
      return null
    case 'url':
      try { new URL(value.startsWith('http') ? value : `https://${value}`); return null }
      catch { return 'URL inválida' }
    case 'number':
    case 'currency':
      if (isNaN(Number(value))) return 'Debe ser un número'
      return null
    case 'rating':
      if (![1,2,3,4,5].includes(Number(value))) return 'Valor entre 1 y 5'
      return null
    default:
      return null
  }
}

// ── Parse phone into { countryCode, number } ─────────────────
export function parsePhone(raw) {
  if (!raw) return { countryCode: '+51', number: '' }
  const match = COUNTRY_CODES.find(c => raw.startsWith(c.code))
  if (match) return { countryCode: match.code, number: raw.slice(match.code.length).trim() }
  return { countryCode: '+51', number: raw }
}

export function formatPhone(countryCode, number) {
  if (!number) return ''
  return `${countryCode} ${number}`
}

// ── localStorage key for column definitions ───────────────────
export const COL_DEFS_KEY_CONTACTS  = 'ntx_col_defs_contacts'
export const COL_DEFS_KEY_COMPANIES = 'ntx_col_defs_companies'
