import { useState, useRef } from 'react'
import { useStore } from '../../../stores/useStore'
import Topbar from '../../../components/layout/Topbar'
import { toast } from 'sonner'
import {
  Plus, X, Check, Clock, Video, MapPin, Phone,
  Copy, Globe, Settings, ChevronLeft, ChevronRight,
  Calendar, Users, Link, ToggleLeft, Pencil, Trash2,
  ArrowLeft, ArrowRight, ExternalLink
} from 'lucide-react'

// ── Meeting type colors ──────────────────────────────────────
const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#84cc16']

// ── Time slots ───────────────────────────────────────────────
const TIME_SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30',
]

const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ── Booking flow (client side) ────────────────────────────────
function BookingFlow({ meetingType, onBook, onClose }) {
  const [step, setStep] = useState(1) // 1=date, 2=time, 3=info, 4=confirm
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [form, setForm] = useState({ name: '', email: '', notes: '', location: '' })

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const today = new Date()

  const isAvailable = (day) => {
    const date = new Date(calYear, calMonth, day)
    const dow = date.getDay()
    if (date < today) return false
    const avail = meetingType.availability || {}
    const dayKey = ['sun','mon','tue','wed','thu','fri','sat'][dow]
    return avail[dayKey] !== false
  }

  const handleBook = () => {
    onBook({
      date: `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`,
      time: selectedTime,
      ...form,
      meeting_type_id: meetingType.id,
      meeting_type_name: meetingType.name,
      duration: meetingType.duration,
      location_type: meetingType.location_type,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: meetingType.color + '20' }}>
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: meetingType.color }} />
            </div>
            <div>
              <h2 className="text-sm font-bold">{meetingType.name}</h2>
              <p className="text-xs text-zinc-500 flex items-center gap-2">
                <Clock className="w-3 h-3" /> {meetingType.duration} min
                <span>·</span>
                {meetingType.location_type === 'online' ? <><Video className="w-3 h-3" /> Online</> :
                 meetingType.location_type === 'phone' ? <><Phone className="w-3 h-3" /> Llamada</> :
                 <><MapPin className="w-3 h-3" /> Presencial</>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {['Fecha', 'Hora', 'Datos', 'Confirmar'].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                  {step > i + 1 ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${step === i + 1 ? 'text-zinc-900' : 'text-zinc-400'}`}>{s}</span>
                {i < 3 && <div className="w-8 h-px bg-zinc-200" />}
              </div>
            ))}
          </div>

          {/* Step 1 — Date picker */}
          {step === 1 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Selecciona una fecha</p>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}
                  className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <p className="text-sm font-bold">{MONTHS_ES[calMonth]} {calYear}</p>
                <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}
                  className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-7 mb-2">
                {DAYS_ES.map(d => <div key={d} className="text-center text-[10px] font-bold text-zinc-400 py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const avail = isAvailable(day)
                  const sel = selectedDate === day
                  return (
                    <button key={day} onClick={() => avail && setSelectedDate(day)} disabled={!avail}
                      className={`aspect-square rounded-xl text-sm font-medium transition-all ${sel ? 'bg-zinc-900 text-white' : avail ? 'hover:bg-zinc-100 text-zinc-700' : 'text-zinc-300 cursor-not-allowed'}`}>
                      {day}
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-end mt-5">
                <button onClick={() => setStep(2)} disabled={!selectedDate}
                  className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-zinc-700">
                  Siguiente <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Time */}
          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 mb-4 font-medium">
                <ArrowLeft className="w-3.5 h-3.5" /> Cambiar fecha
              </button>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
                Selecciona una hora — {selectedDate} {MONTHS_ES[calMonth]}
              </p>
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {TIME_SLOTS.map(t => (
                  <button key={t} onClick={() => setSelectedTime(t)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${selectedTime === t ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 hover:border-zinc-400 text-zinc-700'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-5">
                <button onClick={() => setStep(1)} className="px-4 py-2 border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50">Atrás</button>
                <button onClick={() => setStep(3)} disabled={!selectedTime}
                  className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold disabled:opacity-40">
                  Siguiente <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Info */}
          {step === 3 && (
            <div className="space-y-4">
              <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 font-medium">
                <ArrowLeft className="w-3.5 h-3.5" /> Cambiar hora
              </button>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Tus datos</p>
              {[
                { k: 'name', l: 'Nombre completo *', type: 'text', placeholder: 'Tu nombre' },
                { k: 'email', l: 'Email *', type: 'email', placeholder: 'tu@email.com' },
                { k: 'notes', l: 'Notas (opcional)', type: 'text', placeholder: '¿Algo que debamos saber antes de la reunión?' },
              ].map(f => (
                <div key={f.k} className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500">{f.l}</label>
                  <input type={f.type} value={form[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-zinc-900 bg-white transition-colors" />
                </div>
              ))}
              {meetingType.location_type === 'physical' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500">Dirección de reunión *</label>
                  <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="Av. Javier Prado 1234, Miraflores..."
                    className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-zinc-900 bg-white" />
                </div>
              )}
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)} className="px-4 py-2 border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50">Atrás</button>
                <button onClick={() => setStep(4)} disabled={!form.name || !form.email}
                  className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold disabled:opacity-40">
                  Revisar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — Confirm */}
          {step === 4 && (
            <div className="space-y-4">
              <button onClick={() => setStep(3)} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 font-medium">
                <ArrowLeft className="w-3.5 h-3.5" /> Editar datos
              </button>
              <div className="bg-zinc-50 rounded-2xl p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Resumen de tu reunión</p>
                {[
                  { l: 'Tipo', v: meetingType.name },
                  { l: 'Fecha', v: `${selectedDate} ${MONTHS_ES[calMonth]} ${calYear}` },
                  { l: 'Hora', v: `${selectedTime} (${meetingType.duration} min)` },
                  { l: 'Modalidad', v: meetingType.location_type === 'online' ? '📹 Online (link se enviará por email)' : meetingType.location_type === 'phone' ? '📞 Llamada telefónica' : `📍 Presencial — ${form.location}` },
                  { l: 'Nombre', v: form.name },
                  { l: 'Email', v: form.email },
                  form.notes && { l: 'Notas', v: form.notes },
                ].filter(Boolean).map(item => (
                  <div key={item.l} className="flex gap-3">
                    <span className="text-xs text-zinc-400 w-20 shrink-0 font-medium">{item.l}</span>
                    <span className="text-xs text-zinc-700 font-medium">{item.v}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleBook}
                className="w-full py-3.5 bg-zinc-900 text-white rounded-2xl text-sm font-bold hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Confirmar reunión
              </button>
              <p className="text-[10px] text-center text-zinc-400">Recibirás una confirmación por email con todos los detalles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Meeting type editor ───────────────────────────────────────
function MeetingTypeEditor({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    name: '', description: '', duration: 30,
    location_type: 'online', location_detail: '',
    color: COLORS[0], active: true,
    availability: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
    time_start: '09:00', time_end: '18:00',
    buffer: 15, max_per_day: 4,
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const DAYS_MAP = [
    { k: 'mon', l: 'Lun' }, { k: 'tue', l: 'Mar' }, { k: 'wed', l: 'Mié' },
    { k: 'thu', l: 'Jue' }, { k: 'fri', l: 'Vie' }, { k: 'sat', l: 'Sáb' }, { k: 'sun', l: 'Dom' },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 sticky top-0 bg-white z-10">
          <h3 className="text-sm font-bold">{initial ? 'Editar' : 'Nuevo'} tipo de reunión</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-zinc-400" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nombre *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Consulta inicial, Demo del proyecto..."
              className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Descripción</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              placeholder="Qué incluye esta reunión..."
              className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-zinc-900 resize-none" />
          </div>

          {/* Duration + color */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Duración</label>
              <select value={form.duration} onChange={e => set('duration', parseInt(e.target.value))}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-zinc-900">
                {[15, 20, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} minutos</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Color</label>
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => set('color', c)}
                    className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-zinc-400 scale-110' : ''}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>

          {/* Location type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Modalidad</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { k: 'online', l: '📹 Online', sub: 'Zoom / Meet / Teams' },
                { k: 'phone', l: '📞 Llamada', sub: 'Teléfono' },
                { k: 'physical', l: '📍 Presencial', sub: 'El cliente pone dirección' },
              ].map(opt => (
                <button key={opt.k} onClick={() => set('location_type', opt.k)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${form.location_type === opt.k ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'}`}>
                  <p className="text-xs font-bold">{opt.l}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{opt.sub}</p>
                </button>
              ))}
            </div>
            {form.location_type === 'online' && (
              <input value={form.location_detail} onChange={e => set('location_detail', e.target.value)}
                placeholder="Link de Zoom / Meet / Teams (opcional — se puede agregar al confirmar)"
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-zinc-900" />
            )}
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Días disponibles</label>
            <div className="flex gap-2">
              {DAYS_MAP.map(d => (
                <button key={d.k} onClick={() => set('availability', { ...form.availability, [d.k]: !form.availability[d.k] })}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${form.availability[d.k] ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                  {d.l}
                </button>
              ))}
            </div>
          </div>

          {/* Time range + buffer */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Desde</label>
              <input type="time" value={form.time_start} onChange={e => set('time_start', e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-900" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Hasta</label>
              <input type="time" value={form.time_end} onChange={e => set('time_end', e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-900" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Buffer</label>
              <select value={form.buffer} onChange={e => set('buffer', parseInt(e.target.value))}
                className="w-full border border-zinc-200 rounded-xl px-2 py-2 text-sm bg-white outline-none focus:border-zinc-900">
                {[0, 5, 10, 15, 30].map(b => <option key={b} value={b}>{b} min</option>)}
              </select>
            </div>
          </div>

          {/* Max per day */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Máximo de reuniones por día</label>
            <input type="number" min={1} max={20} value={form.max_per_day} onChange={e => set('max_per_day', parseInt(e.target.value))}
              className="w-32 border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-900" />
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50">Cancelar</button>
          <button onClick={() => { if (!form.name) return; onSave({ ...form, id: initial?.id || `mt${Date.now()}` }); onClose() }}
            disabled={!form.name}
            className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 disabled:opacity-40">
            {initial ? 'Guardar cambios' : 'Crear tipo de reunión'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Booking confirmed ─────────────────────────────────────────
function BookingConfirmed({ booking, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">¡Reunión confirmada!</h2>
        <p className="text-sm text-zinc-500 mb-5">
          {booking.meeting_type_name} · {booking.date} · {booking.time}
        </p>
        <div className="bg-zinc-50 rounded-xl p-4 text-left space-y-2 mb-5">
          {[
            { l: 'Nombre', v: booking.name },
            { l: 'Email', v: booking.email },
            { l: 'Duración', v: `${booking.duration} min` },
          ].map(i => (
            <div key={i.l} className="flex gap-3">
              <span className="text-[10px] text-zinc-400 w-16 shrink-0 font-medium">{i.l}</span>
              <span className="text-xs text-zinc-700">{i.v}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-400 mb-5">Se ha enviado una confirmación al email del cliente</p>
        <button onClick={onClose} className="w-full py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-700">
          Cerrar
        </button>
      </div>
    </div>
  )
}

// ── Main Agenda page ─────────────────────────────────────────
export default function AgendaPage() {
  const { contacts, companies } = useStore()
  const [meetingTypes, setMeetingTypes] = useState([
    {
      id: 'mt1', name: 'Consulta inicial', description: 'Primera reunión para conocer tu proyecto y necesidades.', duration: 30,
      location_type: 'online', color: '#3b82f6', active: true,
      availability: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
      time_start: '09:00', time_end: '17:00', buffer: 15, max_per_day: 4, bookings: 0,
    },
    {
      id: 'mt2', name: 'Demo del proyecto', description: 'Presentación del avance de tu proyecto en curso.', duration: 45,
      location_type: 'online', color: '#8b5cf6', active: true,
      availability: { mon: true, tue: false, wed: true, thu: false, fri: true, sat: false, sun: false },
      time_start: '10:00', time_end: '16:00', buffer: 15, max_per_day: 3, bookings: 0,
    },
    {
      id: 'mt3', name: 'Reunión presencial', description: 'Reunión en persona. El cliente indica la dirección.', duration: 60,
      location_type: 'physical', color: '#10b981', active: true,
      availability: { mon: false, tue: true, wed: false, thu: true, fri: false, sat: true, sun: false },
      time_start: '11:00', time_end: '18:00', buffer: 30, max_per_day: 2, bookings: 0,
    },
  ])
  const [bookings, setBookings] = useState([
    { id: 'b1', meeting_type_name: 'Consulta inicial', name: 'María Quispe', email: 'maria@fashionco.pe', date: '2026-04-28', time: '10:00', duration: 30, location_type: 'online', status: 'confirmed' },
    { id: 'b2', meeting_type_name: 'Demo del proyecto', name: 'Luis Vera', email: 'luis@techpe.com', date: '2026-04-29', time: '14:30', duration: 45, location_type: 'online', status: 'confirmed' },
  ])

  const [view, setView] = useState('types') // types | bookings | settings
  const [showEditor, setShowEditor] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [bookingFlow, setBookingFlow] = useState(null)
  const [confirmedBooking, setConfirmedBooking] = useState(null)
  const [showEmbedFor, setShowEmbedFor] = useState(null)
  const [copiedLink, setCopiedLink] = useState(null)

  const handleSaveType = (type) => {
    setMeetingTypes(prev => {
      const exists = prev.find(t => t.id === type.id)
      if (exists) return prev.map(t => t.id === type.id ? { ...t, ...type } : t)
      return [...prev, { ...type, bookings: 0 }]
    })
    toast.success(editingType ? 'Tipo de reunión actualizado' : 'Tipo de reunión creado')
    setEditingType(null)
  }

  const handleBook = (bookingData) => {
    const newBooking = { id: `b${Date.now()}`, ...bookingData, status: 'confirmed' }
    setBookings(prev => [...prev, newBooking])
    setMeetingTypes(prev => prev.map(t => t.id === bookingData.meeting_type_id ? { ...t, bookings: (t.bookings || 0) + 1 } : t))
    setBookingFlow(null)
    setConfirmedBooking(newBooking)
    toast.success('Reunión agendada correctamente')
  }

  const copyLink = (typeId) => {
    const link = `${window.location.origin}/book/${typeId}`
    navigator.clipboard?.writeText(link)
    setCopiedLink(typeId)
    toast.success('Link copiado al portapapeles')
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const publicUrl = (typeId) => `${window.location.origin}/book/${typeId}`
  const embedCode = (typeId) => `<iframe src="${publicUrl(typeId)}" width="100%" height="700" frameborder="0" style="border:none;border-radius:12px"></iframe>`

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="AGENDA" actions={
        <button onClick={() => { setEditingType(null); setShowEditor(true) }}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" /> Nuevo tipo
        </button>
      } />

      <div className="flex-1 overflow-hidden p-4">
      <div className="h-full rounded-xl border border-border bg-background overflow-hidden shadow-sm flex flex-col">
      {/* Sub-tabs */}
      <div className="flex border-b border-border px-5 shrink-0">
        {[
          { id: 'types', l: 'TIPOS DE REUNIÓN' },
          { id: 'bookings', l: `RESERVAS (${bookings.length})` },
          { id: 'settings', l: 'CONFIGURACIÓN' },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={`px-4 py-3 text-[10px] font-bold border-b-2 transition-colors uppercase tracking-widest ${view === t.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.l}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 min-h-0">

        {/* ── Meeting Types ──────────────────────────────────── */}
        {view === 'types' && (
          <div className="space-y-4">
            {meetingTypes.length === 0 && (
              <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
                <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Sin tipos de reunión</p>
                <p className="text-xs text-muted-foreground mt-1">Crea tu primero para empezar a recibir reservas</p>
                <button onClick={() => setShowEditor(true)} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-wider">
                  <Plus className="w-3.5 h-3.5 inline mr-1" /> Crear tipo de reunión
                </button>
              </div>
            )}

            {meetingTypes.map(type => (
              <div key={type.id} className="bg-background border border-border rounded-xl overflow-hidden hover:shadow-sm transition-all">
                <div className="flex items-start gap-4 p-5">
                  {/* Color indicator */}
                  <div className="w-1.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: type.color }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold">{type.name}</h3>
                      {!type.active && <span className="text-[9px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-bold uppercase">Inactivo</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{type.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {type.duration} min
                      </span>
                      <span className="flex items-center gap-1">
                        {type.location_type === 'online' ? <Video className="w-3.5 h-3.5" /> : type.location_type === 'phone' ? <Phone className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                        {type.location_type === 'online' ? 'Online' : type.location_type === 'phone' ? 'Llamada' : 'Presencial'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {type.bookings || 0} reservas
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {type.time_start}–{type.time_end}
                      </span>
                    </div>

                    {/* Available days */}
                    <div className="flex gap-1 mt-3">
                      {[['L','mon'],['M','tue'],['X','wed'],['J','thu'],['V','fri'],['S','sat'],['D','sun']].map(([l, k]) => (
                        <span key={k} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${type.availability?.[k] ? 'text-white' : 'bg-zinc-100 text-zinc-300'}`}
                          style={type.availability?.[k] ? { backgroundColor: type.color } : {}}>
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => setBookingFlow(type)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-lg hover:bg-accent transition-colors uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5" /> Ver disponibilidad
                    </button>
                    <div className="flex gap-1.5">
                      <button onClick={() => copyLink(type.id)}
                        className={`flex items-center gap-1.5 flex-1 px-2.5 py-1.5 text-xs font-bold border rounded-lg transition-colors uppercase tracking-wider ${copiedLink === type.id ? 'border-green-500 text-green-700 bg-green-50' : 'border-border hover:bg-accent'}`}>
                        {copiedLink === type.id ? <><Check className="w-3 h-3" /> Copiado</> : <><Link className="w-3 h-3" /> Link</>}
                      </button>
                      <button onClick={() => setShowEmbedFor(showEmbedFor === type.id ? null : type.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold border border-border rounded-lg hover:bg-accent uppercase tracking-wider">
                        {'</>'} Embed
                      </button>
                      <button onClick={() => { setEditingType(type); setShowEditor(true) }}
                        className="p-1.5 border border-border rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setMeetingTypes(p => p.filter(t => t.id !== type.id))}
                        className="p-1.5 border border-border rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Embed section */}
                {showEmbedFor === type.id && (
                  <div className="border-t border-border p-5 bg-muted/20 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">INTEGRACIÓN</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Link público</label>
                        <div className="flex gap-2">
                          <input readOnly value={publicUrl(type.id)} className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background font-mono text-muted-foreground" />
                          <button onClick={() => copyLink(type.id)} className="px-2.5 py-1.5 border border-border rounded-lg hover:bg-accent text-xs font-bold">
                            <Copy className="w-3 h-3" />
                          </button>
                          <a href={publicUrl(type.id)} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 border border-border rounded-lg hover:bg-accent">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Código embed (iframe)</label>
                        <div className="flex gap-2">
                          <input readOnly value={embedCode(type.id)} className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background font-mono text-muted-foreground" />
                          <button onClick={() => { navigator.clipboard?.writeText(embedCode(type.id)); toast.success('Embed copiado') }}
                            className="px-2.5 py-1.5 border border-border rounded-lg hover:bg-accent text-xs font-bold">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Pega el código embed en cualquier sitio web para mostrar tu agenda de reservas.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Bookings ───────────────────────────────────────── */}
        {view === 'bookings' && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Sin reservas aún</p>
                <p className="text-xs text-muted-foreground mt-1">Comparte tu link de reservas para empezar a recibir reuniones</p>
              </div>
            ) : (
              bookings.map(b => {
                const mt = meetingTypes.find(t => t.id === b.meeting_type_id)
                return (
                  <div key={b.id} className="bg-background border border-border rounded-xl p-5 flex items-start gap-4">
                    <div className="w-1.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: mt?.color || '#64748b' }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold">{b.meeting_type_name}</p>
                        <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Confirmada</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{b.name} · {b.email}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {b.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {b.time} · {b.duration} min</span>
                        <span className="flex items-center gap-1">
                          {b.location_type === 'online' ? <Video className="w-3.5 h-3.5" /> : b.location_type === 'phone' ? <Phone className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                          {b.location_type === 'online' ? 'Online' : b.location_type === 'phone' ? 'Llamada' : 'Presencial'}
                        </span>
                      </div>
                      {b.location && <p className="text-xs text-muted-foreground mt-1">📍 {b.location}</p>}
                      {b.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{b.notes}"</p>}
                    </div>
                    <button onClick={() => setBookings(p => p.filter(x => x.id !== b.id))}
                      className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-accent transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── Settings ───────────────────────────────────────── */}
        {view === 'settings' && (
          <div className="max-w-lg space-y-5">
            <div className="bg-background border border-border rounded-xl p-5 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">PERFIL DE AGENDA</p>
              {[
                { l: 'URL pública', v: `${window.location.origin}/book/adrian`, copy: true },
                { l: 'Nombre público', v: 'Adrian Caravedo — Nithrox' },
                { l: 'Zona horaria', v: 'America/Lima (UTC-5)' },
                { l: 'Idioma', v: 'Español (Perú)' },
              ].map(f => (
                <div key={f.l} className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{f.l}</label>
                  <div className="flex gap-2">
                    <input readOnly={!f.editable} value={f.v}
                      className="flex-1 border border-border rounded-lg px-3 py-1.5 text-xs bg-muted font-mono text-muted-foreground" />
                    {f.copy && (
                      <button onClick={() => { navigator.clipboard?.writeText(f.v); toast.success('Copiado') }}
                        className="px-2.5 py-1.5 border border-border rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-background border border-border rounded-xl p-5 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">INTEGRACIÓN EN TU SITIO</p>
              <p className="text-xs text-muted-foreground">Pega este código en tu web para mostrar todos tus tipos de reunión:</p>
              <div className="relative">
                <pre className="text-[10px] bg-muted/30 rounded-xl p-4 overflow-x-auto text-muted-foreground font-mono border border-border">
{`<!-- Agenda Nithrox -->
<script src="${window.location.origin}/widget.js"></script>
<div id="nithrox-booking" data-user="adrian"></div>`}
                </pre>
                <button onClick={() => { navigator.clipboard?.writeText(`<!-- Agenda Nithrox -->\n<script src="${window.location.origin}/widget.js"></script>\n<div id="nithrox-booking" data-user="adrian"></div>`); toast.success('Código copiado') }}
                  className="absolute top-3 right-3 p-1.5 bg-background border border-border rounded-lg hover:bg-accent text-muted-foreground">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
      </div>

      {/* Meeting type editor */}
      {showEditor && (
        <MeetingTypeEditor
          initial={editingType}
          onSave={handleSaveType}
          onClose={() => { setShowEditor(false); setEditingType(null) }}
        />
      )}

      {/* Booking flow */}
      {bookingFlow && (
        <BookingFlow meetingType={bookingFlow} onBook={handleBook} onClose={() => setBookingFlow(null)} />
      )}

      {/* Booking confirmed */}
      {confirmedBooking && (
        <BookingConfirmed booking={confirmedBooking} onClose={() => setConfirmedBooking(null)} />
      )}
    </div>
  )
}
