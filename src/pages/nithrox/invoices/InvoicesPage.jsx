import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../../stores/useStore'
import Topbar from '../../../components/layout/Topbar'
import { toast } from 'sonner'
import {
  Plus, X, Trash2, Download, Send, Check, Clock, AlertCircle,
  CheckCircle, FileText, Eye, Pencil, Copy, ChevronDown,
  MessageSquare, Mail, DollarSign, TrendingUp, Receipt
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────
const LS_KEY = 'ntx_invoices'

const CURRENCIES = [
  { id: 'USD', symbol: '$' },
  { id: 'PEN', symbol: 'S/' },
  { id: 'EUR', symbol: '€' },
]

const STATUS_MAP = {
  draft:   { label: 'Borrador', color: 'bg-muted text-muted-foreground',       icon: FileText },
  sent:    { label: 'Enviada',  color: 'bg-blue-100 text-blue-700',            icon: Send },
  paid:    { label: 'Pagada',   color: 'bg-green-100 text-green-700',          icon: CheckCircle },
  overdue: { label: 'Vencida',  color: 'bg-red-100 text-red-600',             icon: AlertCircle },
  partial: { label: 'Parcial',  color: 'bg-yellow-100 text-yellow-700',        icon: Clock },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtAmt(n, currency = 'USD') {
  const sym = CURRENCIES.find(c => c.id === currency)?.symbol || '$'
  return `${sym}${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function nextInvoiceId(invoices) {
  const max = invoices.reduce((m, inv) => Math.max(m, parseInt(inv.number?.replace('NTX-', '') || '0')), 0)
  return `NTX-${String(max + 1).padStart(5, '0')}`
}

function loadInvoices() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function saveInvoices(invs) {
  localStorage.setItem(LS_KEY, JSON.stringify(invs))
}

// ── Invoice HTML for preview/print ───────────────────────────
function generateInvoiceHTML(inv, contacts, companies) {
  const contact = contacts.find(c => c.id === inv.contact_id)
  const company = companies.find(c => c.id === inv.company_id)
  const sym = CURRENCIES.find(c => c.id === inv.currency)?.symbol || '$'
  const subtotal = inv.items.reduce((s, i) => s + (i.price * i.qty), 0)
  const taxAmt = inv.tax ? subtotal * inv.tax / 100 : 0
  const discAmt = inv.discount ? subtotal * inv.discount / 100 : 0
  const total = subtotal - discAmt + taxAmt

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Courier New',monospace;max-width:680px;margin:0 auto;padding:40px;color:#18181b;font-size:12px;line-height:1.6}
    .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:2px solid #18181b;margin-bottom:28px}
    .brand{font-size:10px;letter-spacing:3px;color:#64748b;margin-bottom:4px}
    .title{font-size:24px;font-weight:900;letter-spacing:2px}
    .meta{text-align:right}
    .meta-label{font-size:9px;color:#64748b;letter-spacing:1px;text-transform:uppercase}
    .meta-value{font-size:13px;font-weight:700}
    .section-title{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#64748b;margin:20px 0 8px}
    .parties{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    thead tr{background:#f8fafc}
    th,td{text-align:left;padding:8px 10px;border:1px solid #e2e8f0;font-size:11px}
    th{font-size:9px;letter-spacing:1px;text-transform:uppercase}
    .totals{max-width:260px;margin-left:auto;margin-top:16px}
    .totals div{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:11px}
    .totals .final{font-weight:900;font-size:15px;border-bottom:2px solid #18181b;padding-top:8px}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;letter-spacing:1px}
    .status-paid{color:#16a34a;font-weight:900;font-size:11px;border:1.5px solid #16a34a;padding:2px 8px;display:inline-block}
  </style></head><body>
    <div class="header">
      <div>
        <div class="brand">NTX LABS LLC · NITHROX</div>
        <div class="title">FACTURA</div>
        <div style="margin-top:8px;font-size:11px;color:#64748b">Lima, Perú · nithrox.com</div>
      </div>
      <div class="meta">
        <div class="meta-label">N° Factura</div>
        <div class="meta-value">${inv.number}</div>
        <div class="meta-label" style="margin-top:10px">Fecha emisión</div>
        <div class="meta-value">${fmtDate(inv.issued_at)}</div>
        <div class="meta-label" style="margin-top:6px">Vencimiento</div>
        <div class="meta-value">${fmtDate(inv.due_date)}</div>
        ${inv.status === 'paid' ? `<div style="margin-top:10px"><span class="status-paid">✓ PAGADO</span></div>` : ''}
      </div>
    </div>

    <div class="parties">
      <div>
        <div class="section-title">De</div>
        <div style="font-weight:700">NTX Labs LLC</div>
        <div style="color:#64748b">Adrian Caravedo, CEO</div>
        <div style="color:#64748b">Lima, Perú</div>
        <div style="color:#64748b">hola@nithrox.com</div>
      </div>
      <div>
        <div class="section-title">Para</div>
        <div style="font-weight:700">${company?.name || inv.company_name || '—'}</div>
        ${company?.ruc ? `<div style="color:#64748b">RUC: ${company.ruc}</div>` : ''}
        <div style="color:#64748b">${contact?.name || '—'}</div>
        <div style="color:#64748b">${contact?.email || inv.client_email || '—'}</div>
      </div>
    </div>

    ${inv.concept ? `<div><div class="section-title">Concepto</div><p style="color:#64748b;margin-bottom:16px">${inv.concept}</p></div>` : ''}

    <table>
      <thead><tr><th>Descripción</th><th>Cant.</th><th style="text-align:right">Precio unit.</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>
        ${inv.items.map(item => `<tr>
          <td>${item.name}${item.description ? `<br><span style="color:#94a3b8;font-size:10px">${item.description}</span>` : ''}</td>
          <td>${item.qty}</td>
          <td style="text-align:right">${sym}${Number(item.price).toLocaleString('en-US',{minimumFractionDigits:2})}</td>
          <td style="text-align:right;font-weight:700">${sym}${(item.price*item.qty).toLocaleString('en-US',{minimumFractionDigits:2})}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div><span>Subtotal</span><span>${sym}${subtotal.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
      ${inv.discount > 0 ? `<div style="color:#16a34a"><span>Descuento (${inv.discount}%)</span><span>-${sym}${discAmt.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>` : ''}
      ${inv.tax > 0 ? `<div><span>IGV (${inv.tax}%)</span><span>+${sym}${taxAmt.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>` : ''}
      <div class="final"><span>TOTAL</span><span>${sym}${total.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
    </div>

    ${inv.payment_method ? `<div style="margin-top:20px"><div class="section-title">Datos de pago</div><p style="color:#64748b">${inv.payment_method}</p></div>` : ''}
    ${inv.notes ? `<div style="margin-top:20px"><div class="section-title">Notas</div><p style="color:#64748b">${inv.notes}</p></div>` : ''}

    <div class="footer">
      <p>NTX LABS LLC · RUC: — · Lima, Perú · hola@nithrox.com · nithrox.com</p>
      <p style="margin-top:4px">Esta factura fue generada digitalmente por el sistema de gestión Nithrox.</p>
    </div>
  </body></html>`
}

// ── New invoice dialog ────────────────────────────────────────
function NewInvoiceDialog({ invoices, contacts, companies, onClose, onCreate }) {
  const [form, setForm] = useState({
    contact_id: '', company_id: '', company_name: '', client_email: '',
    concept: '', currency: 'USD', due_date: '',
    tax: 18, discount: 0, payment_method: 'Transferencia bancaria a Cuenta BCP — Nithrox',
    notes: '', items: [{ id: '1', name: '', description: '', qty: 1, price: 0 }]
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const sym = CURRENCIES.find(c => c.id === form.currency)?.symbol || '$'

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { id: String(Date.now()), name: '', description: '', qty: 1, price: 0 }] }))
  const removeItem = (id) => setForm(p => ({ ...p, items: p.items.filter(i => i.id !== id) }))
  const updateItem = (id, k, v) => setForm(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, [k]: v } : i) }))

  const subtotal = form.items.reduce((s, i) => s + i.price * i.qty, 0)
  const taxAmt = subtotal * form.tax / 100
  const discAmt = subtotal * form.discount / 100
  const total = subtotal - discAmt + taxAmt

  const handleCreate = () => {
    if (!form.items.some(i => i.name)) { toast.error('Agrega al menos un ítem'); return }
    const inv = {
      ...form,
      id: `inv_${Date.now()}`,
      number: nextInvoiceId(invoices),
      status: 'draft',
      issued_at: new Date().toISOString(),
      total,
    }
    onCreate(inv)
    onClose()
    toast.success(`Factura ${inv.number} creada`)
  }

  const selectedContact = contacts.find(c => c.id === form.contact_id)

  return (
    <div className="fixed inset-0 z-50 bg-black/40 overflow-y-auto flex items-start justify-center p-4 pt-10">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl mb-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-bold text-sm">Nueva factura</p>
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Client */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contacto</label>
              <select value={form.contact_id} onChange={e => {
                const c = contacts.find(x => x.id === e.target.value)
                set('contact_id', e.target.value)
                if (c) { set('client_email', c.email || ''); set('company_id', c.company_id || ''); set('company_name', companies.find(co => co.id === c.company_id)?.name || '') }
              }} className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background">
                <option value="">Seleccionar contacto...</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Empresa</label>
              <input value={form.company_name || companies.find(c => c.id === form.company_id)?.name || ''}
                onChange={e => set('company_name', e.target.value)}
                placeholder="Nombre de empresa..."
                className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email cliente</label>
              <input value={form.client_email} onChange={e => set('client_email', e.target.value)}
                placeholder="cliente@empresa.com"
                className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Moneda</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background">
                {CURRENCIES.map(c => <option key={c.id} value={c.id}>{c.id} ({c.symbol})</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vence el</label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Concepto / descripción</label>
            <input value={form.concept} onChange={e => set('concept', e.target.value)}
              placeholder="Ej: Desarrollo de tienda online — Fase 2"
              className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background" />
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ítems</label>
              <button onClick={addItem} className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="w-3 h-3" /> Agregar ítem
              </button>
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/40 border-b border-border">
                <p className="col-span-5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Descripción</p>
                <p className="col-span-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Cant.</p>
                <p className="col-span-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Precio</p>
                <p className="col-span-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Total</p>
                <p className="col-span-1" />
              </div>
              {form.items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 border-b border-border last:border-0">
                  <div className="col-span-5">
                    <input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)}
                      placeholder="Servicio o producto..."
                      className="w-full text-sm outline-none bg-transparent border-b border-transparent focus:border-foreground" />
                    <input value={item.description || ''} onChange={e => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Detalle opcional..."
                      className="w-full text-[10px] text-muted-foreground outline-none bg-transparent mt-0.5" />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <input type="number" min="1" value={item.qty} onChange={e => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                      className="w-12 text-sm text-center outline-none bg-transparent border border-border rounded-lg px-1 py-0.5" />
                  </div>
                  <div className="col-span-3 flex items-center gap-1 justify-end">
                    <span className="text-xs text-muted-foreground">{sym}</span>
                    <input type="number" min="0" value={item.price} onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                      className="w-20 text-sm text-right outline-none bg-transparent" />
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="text-xs font-bold tabular-nums">{sym}{(item.price * item.qty).toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {form.items.length > 1 && (
                      <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals + tax/discount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Método de pago</label>
                <input value={form.payment_method} onChange={e => set('payment_method', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Notas internas</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                  rows={2} className="w-full px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-foreground bg-background resize-none" />
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Subtotal</span>
                <span className="text-sm font-bold tabular-nums">{sym}{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Descuento (%)</span>
                <div className="flex items-center gap-1">
                  <input type="number" min="0" max="100" value={form.discount} onChange={e => set('discount', parseFloat(e.target.value) || 0)}
                    className="w-12 text-xs text-right border border-border rounded-lg px-1 py-0.5 outline-none bg-background" />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">IGV (%)</span>
                <div className="flex items-center gap-1">
                  <input type="number" min="0" max="30" value={form.tax} onChange={e => set('tax', parseFloat(e.target.value) || 0)}
                    className="w-12 text-xs text-right border border-border rounded-lg px-1 py-0.5 outline-none bg-background" />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
              <div className="border-t border-border pt-2.5 flex items-center justify-between">
                <span className="text-sm font-black">TOTAL</span>
                <span className="text-lg font-black tabular-nums">{sym}{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-border rounded-xl hover:bg-accent">Cancelar</button>
            <button onClick={handleCreate}
              className="flex-1 py-2.5 text-sm font-bold bg-foreground text-background rounded-xl hover:bg-foreground/90">
              Crear factura
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Invoice row ───────────────────────────────────────────────
function InvoiceRow({ inv, contacts, companies, onView, onStatusChange, onDelete }) {
  const contact = contacts.find(c => c.id === inv.contact_id)
  const company = companies.find(c => c.id === inv.company_id)
  const s = STATUS_MAP[inv.status] || STATUS_MAP.draft
  const StatusIcon = s.icon
  const sym = CURRENCIES.find(c => c.id === inv.currency)?.symbol || '$'
  const isOverdue = inv.status === 'sent' && inv.due_date && new Date(inv.due_date) < new Date()

  const clientName = company?.name || inv.company_name || contact?.name || '—'
  const displayStatus = isOverdue ? 'overdue' : inv.status
  const displayS = STATUS_MAP[displayStatus] || s

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-accent/30 transition-colors group">
      {/* Number + client */}
      <div className="w-28 shrink-0">
        <p className="text-xs font-bold font-mono">{inv.number}</p>
        <p className="text-[10px] text-muted-foreground">{fmtDate(inv.issued_at)}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{clientName}</p>
        <p className="text-xs text-muted-foreground truncate">{inv.concept || '—'}</p>
      </div>
      <div className="w-28 shrink-0 text-center">
        <p className="text-xs text-muted-foreground">{fmtDate(inv.due_date)}</p>
      </div>
      <div className="w-24 shrink-0 flex justify-center">
        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${displayS.color}`}>
          <displayS.icon className="w-3 h-3" /> {displayS.label}
        </span>
      </div>
      <div className="w-28 shrink-0 text-right">
        <p className="text-sm font-black tabular-nums">{sym}{Number(inv.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
      </div>
      {/* Actions — visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onView(inv)} title="Ver factura"
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
          <Eye className="w-3.5 h-3.5" />
        </button>
        {inv.status === 'draft' && (
          <button onClick={() => onStatusChange(inv.id, 'sent')} title="Marcar como enviada"
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
            <Send className="w-3.5 h-3.5" />
          </button>
        )}
        {(inv.status === 'sent' || inv.status === 'overdue' || inv.status === 'partial') && (
          <button onClick={() => onStatusChange(inv.id, 'paid')} title="Marcar como pagada"
            className="p-1.5 rounded-lg hover:bg-green-50 hover:text-green-600 transition-colors text-muted-foreground">
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={() => onDelete(inv.id)} title="Eliminar"
          className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-muted-foreground">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Invoice preview modal ─────────────────────────────────────
function InvoicePreview({ inv, contacts, companies, onClose, onStatusChange }) {
  const iframeRef = useRef(null)
  const html = generateInvoiceHTML(inv, contacts, companies)
  const sym = CURRENCIES.find(c => c.id === inv.currency)?.symbol || '$'
  const contact = contacts.find(c => c.id === inv.contact_id)
  const company = companies.find(c => c.id === inv.company_id)
  const clientEmail = contact?.email || inv.client_email || ''
  const clientPhone = contact?.phone || ''
  const s = STATUS_MAP[inv.status] || STATUS_MAP.draft

  const downloadPDF = () => {
    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close(); win.print() }
  }

  const sendWhatsApp = () => {
    if (!clientPhone) { toast.error('Sin número de teléfono'); return }
    const msg = encodeURIComponent(`Hola! Te envío la factura ${inv.number} por ${sym}${Number(inv.total).toLocaleString('en-US', { minimumFractionDigits: 2 })} con vencimiento el ${fmtDate(inv.due_date)}. Por favor confírmame la recepción. Gracias!`)
    window.open(`https://wa.me/${clientPhone.replace(/\D/g, '')}?text=${msg}`, '_blank')
    onStatusChange(inv.id, 'sent')
    toast.success('Enlace de WhatsApp abierto')
  }

  const sendEmail = () => {
    if (!clientEmail) { toast.error('Sin email registrado'); return }
    window.open(`mailto:${clientEmail}?subject=Factura ${inv.number} — Nithrox&body=Hola, adjunto encontrarás la factura ${inv.number} por ${sym}${Number(inv.total).toLocaleString('en-US',{minimumFractionDigits:2})}. Fecha de vencimiento: ${fmtDate(inv.due_date)}.%0A%0ASaludos,%0ANithrox`, '_blank')
    onStatusChange(inv.id, 'sent')
    toast.success('Cliente de email abierto')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-stretch">
      {/* Sidebar */}
      <div className="w-72 bg-background border-r border-border flex flex-col shrink-0">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-sm font-bold">{inv.number}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total</p>
            <p className="text-2xl font-black tabular-nums">{sym}{Number(inv.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Cliente</p>
            <p className="text-sm font-semibold">{company?.name || inv.company_name || '—'}</p>
            <p className="text-xs text-muted-foreground">{contact?.name || '—'}</p>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Vencimiento</p>
            <p className="text-sm">{fmtDate(inv.due_date)}</p>
          </div>

          {/* Send actions */}
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Enviar factura</p>
            <button onClick={sendWhatsApp}
              className="w-full flex items-center gap-2 px-3 py-2.5 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" /> Enviar por WhatsApp
            </button>
            <button onClick={sendEmail}
              className="w-full flex items-center gap-2 px-3 py-2.5 border border-border rounded-xl text-xs font-bold hover:bg-accent transition-colors">
              <Mail className="w-3.5 h-3.5" /> Enviar por Email
            </button>
          </div>

          {/* Status change */}
          <div className="space-y-2 border-t border-border pt-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Estado</p>
            {['draft', 'sent', 'partial', 'paid'].map(st => (
              <button key={st} onClick={() => { onStatusChange(inv.id, st); toast.success(`Estado: ${STATUS_MAP[st]?.label}`) }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${inv.status === st ? 'bg-foreground text-background' : 'border border-border hover:bg-accent'}`}>
                {(() => { const S = STATUS_MAP[st]; return <><S.icon className="w-3.5 h-3.5" />{S.label}</> })()}
              </button>
            ))}
          </div>

          <button onClick={downloadPDF}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-border rounded-xl text-xs font-bold hover:bg-accent transition-colors">
            <Download className="w-3.5 h-3.5" /> Descargar / Imprimir
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 bg-zinc-100 overflow-hidden">
        <iframe
          ref={iframeRef}
          srcDoc={html}
          className="w-full h-full border-0"
          title="Invoice preview"
        />
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function InvoicesPage() {
  const { contacts, companies } = useStore()
  const [invoices, setInvoices] = useState(loadInvoices)
  const [showNew, setShowNew] = useState(false)
  const [preview, setPreview] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { saveInvoices(invoices) }, [invoices])

  const addInvoice = (inv) => setInvoices(p => [inv, ...p])
  const updateStatus = (id, status) => {
    setInvoices(p => p.map(inv => inv.id === id ? { ...inv, status } : inv))
    if (preview?.id === id) setPreview(p => ({ ...p, status }))
  }
  const deleteInvoice = (id) => { setInvoices(p => p.filter(inv => inv.id !== id)); toast.success('Factura eliminada') }

  const filtered = filter === 'all' ? invoices : invoices.filter(inv => {
    if (filter === 'overdue') return inv.status === 'sent' && inv.due_date && new Date(inv.due_date) < new Date()
    return inv.status === filter
  })

  // Stats
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0)
  const totalPending = invoices.filter(i => ['sent', 'partial'].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0)
  const totalDraft = invoices.filter(i => i.status === 'draft').reduce((s, i) => s + (i.total || 0), 0)
  const totalOverdue = invoices.filter(i => i.status === 'sent' && i.due_date && new Date(i.due_date) < new Date()).reduce((s, i) => s + (i.total || 0), 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="FACTURAS" actions={
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-foreground text-background rounded-full hover:bg-foreground/90 uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" /> Nueva factura
        </button>
      } />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Cobrado', value: `$${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, icon: CheckCircle, color: 'text-green-600', sub: 'pagadas' },
            { label: 'Por cobrar', value: `$${totalPending.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, icon: Clock, color: 'text-blue-600', sub: 'enviadas' },
            { label: 'Vencidas', value: `$${totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, icon: AlertCircle, color: 'text-red-500', sub: 'requieren atención' },
            { label: 'Borradores', value: `$${totalDraft.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, icon: FileText, color: 'text-muted-foreground', sub: 'sin enviar' },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="bg-background border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'all', label: `Todas (${invoices.length})` },
            { id: 'draft', label: 'Borradores' },
            { id: 'sent', label: 'Enviadas' },
            { id: 'paid', label: 'Pagadas' },
            { id: 'overdue', label: 'Vencidas' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${filter === f.id ? 'bg-foreground text-background' : 'border border-border hover:bg-accent'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-background border border-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[7rem_1fr_7rem_6rem_7rem_5rem] gap-4 px-5 py-3 border-b border-border bg-muted/30">
            {['N° Factura', 'Cliente / Concepto', 'Vencimiento', 'Estado', 'Total', ''].map((h, i) => (
              <p key={i} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{h}</p>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="w-10 h-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-bold text-muted-foreground">Sin facturas</p>
              <p className="text-xs text-muted-foreground mt-1">
                {filter === 'all' ? 'Crea tu primera factura con el botón de arriba' : `No hay facturas con estado "${STATUS_MAP[filter]?.label || filter}"`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(inv => (
                <InvoiceRow
                  key={inv.id}
                  inv={inv}
                  contacts={contacts}
                  companies={companies}
                  onView={setPreview}
                  onStatusChange={updateStatus}
                  onDelete={deleteInvoice}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewInvoiceDialog
          invoices={invoices}
          contacts={contacts}
          companies={companies}
          onClose={() => setShowNew(false)}
          onCreate={addInvoice}
        />
      )}

      {preview && (
        <InvoicePreview
          inv={preview}
          contacts={contacts}
          companies={companies}
          onClose={() => setPreview(null)}
          onStatusChange={updateStatus}
        />
      )}
    </div>
  )
}
