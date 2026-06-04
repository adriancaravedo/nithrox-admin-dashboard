import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../../../stores/useStore'
import { PROJECT_PHASES } from '../../../lib/utils'
import Topbar from '../../../components/layout/Topbar'
import SitemapCanvas from '../../../components/shared/SitemapCanvas'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import {
  ChevronRight, Upload, Plus, Trash2, ExternalLink,
  Check, X, Lock, CheckCircle2, Circle, Clock,
  CreditCard, Smartphone, Bitcoin, Building2, FileText,
  MessageSquare, Send, Pin, Server, Globe, AlertTriangle,
  Wifi, Shield, Database, Copy
} from 'lucide-react'

// ── Shared: File upload ─────────────────────────────────────
function FileArea({ files = [], onChange, label, accept = '*', compact = false }) {
  const ref = useRef()
  const handle = (e) => {
    const newFiles = Array.from(e.target.files).map(f => ({
      id: `f${Date.now()}${Math.random()}`,
      name: f.name, size: `${(f.size / 1024).toFixed(0)} KB`,
      type: f.type, url: URL.createObjectURL(f),
    }))
    onChange([...files, ...newFiles])
  }
  return (
    <div className="space-y-2">
      <div onClick={() => ref.current?.click()} onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handle({ target: { files: e.dataTransfer.files } }) }}
        className={`border-2 border-dashed border-border rounded-xl text-center cursor-pointer hover:border-primary/50 hover:bg-accent/20 transition-all ${compact ? 'p-3' : 'p-5'}`}>
        <Upload className={`text-muted-foreground mx-auto mb-1.5 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
        <p className="text-xs text-muted-foreground">{label}</p>
        <input ref={ref} type="file" multiple className="hidden" accept={accept} onChange={handle} />
      </div>
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f, i) => (
            <div key={f.id || i} className="flex items-center gap-2.5 p-2.5 bg-background border border-border rounded-lg group">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-xs truncate">{f.name}</span>
              <span className="text-[10px] text-muted-foreground">{f.size}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                {f.url && <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><ExternalLink className="w-3.5 h-3.5" /></a>}
                <button onClick={() => onChange(files.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Shared: Comments ────────────────────────────────────────
function CommentsSection({ phaseKey, projectId }) {
  const { updateProjectPhase, projects } = useStore()
  const project = projects.find(p => p.id === projectId)
  const phaseData = project?.phases[phaseKey] || {}
  const comments = phaseData.comments || []
  const [text, setText] = useState('')
  const [asClient, setAsClient] = useState(false)
  const bottomRef = useRef()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [comments.length])

  const send = () => {
    if (!text.trim()) return
    const newComment = {
      id: `cm${Date.now()}`,
      text: text.trim(),
      from: asClient ? (project?.company || 'Cliente') : 'Adrian Caravedo (Nithrox)',
      fromClient: asClient,
      at: new Date().toISOString(),
      pinned: false,
    }
    updateProjectPhase(projectId, phaseKey, { comments: [...comments, newComment] })
    setText('')
    toast.success(asClient ? 'Comentario del cliente enviado' : 'Comentario enviado')
  }

  const togglePin = (id) => {
    updateProjectPhase(projectId, phaseKey, {
      comments: comments.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c)
    })
  }

  const deleteComment = (id) => {
    updateProjectPhase(projectId, phaseKey, { comments: comments.filter(c => c.id !== id) })
  }

  const sorted = [...comments].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">Sin comentarios aún</p>
            <p className="text-xs mt-0.5">Sé el primero en comentar</p>
          </div>
        )}
        {sorted.map(c => (
          <div key={c.id} className={`group rounded-xl p-3.5 border transition-all ${c.pinned ? 'border-foreground/20 bg-accent/30' : c.fromClient ? 'border-border bg-blue-50/30 dark:bg-blue-950/20' : 'border-border bg-background'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${c.fromClient ? 'bg-blue-500' : 'bg-foreground'}`}>
                  {c.fromClient ? 'C' : 'AC'}
                </div>
                <span className="text-xs font-bold">{c.from}</span>
                {c.pinned && <Pin className="w-3 h-3 text-foreground fill-foreground" />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {new Date(c.at).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => togglePin(c.id)} className="text-muted-foreground hover:text-foreground p-0.5">
                    <Pin className={`w-3.5 h-3.5 ${c.pinned ? 'fill-foreground' : ''}`} />
                  </button>
                  <button onClick={() => deleteComment(c.id)} className="text-muted-foreground hover:text-destructive p-0.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed">{c.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border border-border rounded-xl overflow-hidden bg-background shrink-0">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) send() }}
          placeholder="Escribe un comentario... (⌘+Enter para enviar)"
          rows={2}
          className="w-full px-3.5 py-3 text-sm outline-none resize-none bg-transparent"
        />
        <div className="flex items-center justify-between px-3.5 py-2 border-t border-border bg-muted/20">
          <label className="flex items-center gap-2 cursor-pointer">
            <button onClick={() => setAsClient(!asClient)}
              className={`w-8 h-4 rounded-full transition-colors relative ${asClient ? 'bg-blue-500' : 'bg-muted'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${asClient ? 'left-4' : 'left-0.5'}`} style={{ left: asClient ? '18px' : '2px' }} />
            </button>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Como {asClient ? project?.company : 'Nithrox'}</span>
          </label>
          <button onClick={send} disabled={!text.trim()}
            className="flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors">
            <Send className="w-3 h-3" /> Enviar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Shared: Checklist ───────────────────────────────────────
function Checklist({ items, values = {}, onChange }) {
  const done = items.filter(i => values[i.key]).length
  const pct = items.length ? Math.round((done / items.length) * 100) : 0
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-muted rounded-full h-2">
          <div className="bg-foreground h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-bold tabular-nums shrink-0">{done}/{items.length}</span>
      </div>
      <div className="space-y-2.5">
        {items.map(item => (
          <label key={item.key} className="flex items-start gap-2.5 cursor-pointer group">
            <div onClick={() => onChange({ ...values, [item.key]: !values[item.key] })}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${values[item.key] ? 'bg-foreground border-foreground' : 'border-border group-hover:border-foreground/50'}`}>
              {values[item.key] && <Check className="w-2.5 h-2.5 text-background" />}
            </div>
            <div className="flex-1">
              <p className={`text-sm transition-colors ${values[item.key] ? 'line-through text-muted-foreground' : ''}`}>{item.label}</p>
              {item.desc && <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

// ── Payment section ─────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'transfer', label: 'TRANSFERENCIA', sub: 'Bancaria', icon: Building2, color: '#2563eb' },
  { id: 'yape',     label: 'YAPE',          sub: 'QR / Número', icon: Smartphone, color: '#7c3aed' },
  { id: 'crypto',   label: 'CRYPTO',        sub: 'USDT, BTC...', icon: Bitcoin, color: '#f59e0b' },
  { id: 'card_pe',  label: 'DÉB/CRÉD PE',   sub: 'Tarjeta Perú', icon: CreditCard, color: '#16a34a' },
  { id: 'card_us',  label: 'DÉB/CRÉD USA',  sub: 'Tarjeta USA', icon: CreditCard, color: '#dc2626' },
  { id: 'cash',     label: 'EFECTIVO',       sub: 'En persona', icon: Building2, color: '#64748b' },
]

const METHOD_FIELDS = {
  transfer: [
    { key: 'bank', label: 'Banco', placeholder: 'BCP, BBVA, Interbank...' },
    { key: 'account', label: 'Número de cuenta', placeholder: '1234-567890-0-12' },
    { key: 'cci', label: 'CCI', placeholder: '00212300123456789012' },
    { key: 'holder', label: 'Titular', placeholder: 'NTX Labs LLC' },
  ],
  yape: [
    { key: 'phone', label: 'Número Yape', placeholder: '+51 999 000 111' },
    { key: 'holder', label: 'Titular', placeholder: 'Adrian Caravedo' },
  ],
  crypto: [
    { key: 'network', label: 'Red', placeholder: 'TRC20, ERC20, BEP20...' },
    { key: 'address', label: 'Dirección wallet', placeholder: 'TXxxx...' },
    { key: 'currency', label: 'Moneda', placeholder: 'USDT, BTC, ETH...' },
  ],
  card_pe: [
    { key: 'link', label: 'Link de pago (Culqi / Niubiz)', placeholder: 'https://pago.culqi.com/...' },
  ],
  card_us: [
    { key: 'link', label: 'Link de pago (Stripe / PayPal)', placeholder: 'https://buy.stripe.com/...' },
  ],
  cash: [
    { key: 'notes', label: 'Instrucciones', placeholder: 'Lugar y hora para el pago...' },
  ],
}

function PaymentSection({ phaseKey, project, onUpdate }) {
  const phaseData = project.phases[phaseKey]
  const phase = PROJECT_PHASES.find(p => p.id === phaseKey)
  const amount = project.value ? Math.round(project.value * (phase?.pct || 10) / 100) : 0
  const payment = phaseData.payment || {}
  const voucherRef = useRef()
  const invoiceRef = useRef()
  const sunatRef = useRef()

  const update = (data) => onUpdate({ payment: { ...payment, ...data } })

  const handleVoucherUpload = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => update({ voucher: { name: f.name, size: `${(f.size / 1024).toFixed(0)} KB`, url: reader.result } })
    reader.readAsDataURL(f)
  }

  const handleInvoiceUpload = (ref, key) => {
    ref.current?.click()
  }

  const generateInvoice = () => {
    const invoiceHtml = `
      <html><body style="font-family:monospace;padding:40px;max-width:600px;margin:0 auto">
        <h1 style="font-size:24px;border-bottom:2px solid black;padding-bottom:12px">FACTURA</h1>
        <p style="color:#666;font-size:12px">NTX Labs LLC · Lima, Perú · ${new Date().toLocaleDateString('es-PE')}</p>
        <table style="width:100%;margin:24px 0;border-collapse:collapse">
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee"><strong>Cliente:</strong></td><td style="border-bottom:1px solid #eee">${project.company}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee"><strong>Proyecto:</strong></td><td style="border-bottom:1px solid #eee">${project.name}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee"><strong>Fase:</strong></td><td style="border-bottom:1px solid #eee">${phase?.label || phaseKey}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee"><strong>Fecha:</strong></td><td style="border-bottom:1px solid #eee">${new Date().toLocaleDateString('es-PE')}</td></tr>
          <tr><td style="padding:8px 0;font-size:18px"><strong>TOTAL:</strong></td><td style="font-size:18px;font-weight:bold">$${amount.toLocaleString()} ${project.currency || 'USD'}</td></tr>
        </table>
        <p style="font-size:11px;color:#999;margin-top:40px">NTX Labs LLC · admin@nithrox.com · nithrox.com</p>
      </body></html>
    `
    const blob = new Blob([invoiceHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    update({ nithrox_invoice: { name: `Factura-Nithrox-${project.name}-${phaseKey}.html`, url, generated_at: new Date().toISOString() } })
    toast.success('Factura Nithrox generada')
  }

  return (
    <div className="space-y-6">
      {/* Amount */}
      <div className={`rounded-xl p-5 border-2 ${phaseData.paid ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-muted/30 border-border'}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">MONTO DE ESTA FASE</p>
            <p className="text-4xl font-bold tabular-nums">${amount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{phase?.pct}% del total · ${project.value?.toLocaleString()} contrato</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${phaseData.paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {phaseData.paid ? <><Check className="w-3.5 h-3.5" /> PAGADO</> : <><Clock className="w-3.5 h-3.5" /> PENDIENTE</>}
          </div>
        </div>
        {phaseData.paid ? (
          <div className="flex items-center gap-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-green-800 dark:text-green-400">Pago confirmado</p>
              <p className="text-xs text-green-700 dark:text-green-500">{phaseData.paid_date} · Método: {PAYMENT_METHODS.find(m => m.id === payment.method)?.label || payment.method}</p>
            </div>
            <button onClick={() => onUpdate({ paid: false, paid_date: null })} className="text-xs text-green-600 hover:underline">Revertir</button>
          </div>
        ) : (
          <button onClick={() => { onUpdate({ paid: true, paid_date: new Date().toLocaleDateString('es-PE'), paid_amount: amount }); toast.success('Pago confirmado') }}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
            <Check className="w-4 h-4" /> MARCAR COMO PAGADO
          </button>
        )}
      </div>

      {/* Method selector */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">MÉTODO DE PAGO</p>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map(m => {
            const Icon = m.icon
            const sel = payment.method === m.id
            return (
              <button key={m.id} onClick={() => update({ method: m.id })}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${sel ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/30'}`}>
                <Icon className="w-5 h-5" style={{ color: sel ? m.color : '#71717a' }} />
                <p className="text-[10px] font-bold uppercase tracking-widest">{m.label}</p>
                <p className="text-[9px] text-muted-foreground">{m.sub}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Method fields */}
      {payment.method && METHOD_FIELDS[payment.method] && (
        <div className="bg-background border border-border rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">DATOS PARA EL CLIENTE</p>
          {METHOD_FIELDS[payment.method].map(f => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
              <div className="flex gap-2">
                <input value={payment[f.key] || ''} onChange={e => update({ [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-background" />
                {payment[f.key] && (
                  <button onClick={() => { navigator.clipboard?.writeText(payment[f.key]); toast.success('Copiado') }}
                    className="px-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent text-xs flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copiar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Voucher upload */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">CONSTANCIA DE PAGO</p>
        {payment.voucher ? (
          <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl">
            <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{payment.voucher.name}</p>
              <p className="text-xs text-muted-foreground">{payment.voucher.size}</p>
            </div>
            <a href={payment.voucher.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><ExternalLink className="w-4 h-4" /></a>
            <button onClick={() => update({ voucher: null })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
          </div>
        ) : (
          <div onClick={() => voucherRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/20 transition-all">
            <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-xs text-muted-foreground">Subir constancia (yo o el cliente)</p>
            <input ref={voucherRef} type="file" className="hidden" accept="image/*,.pdf" onChange={handleVoucherUpload} />
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">FACTURACIÓN</p>

        {/* Factura Nithrox */}
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold">Factura Nithrox</p>
              <p className="text-xs text-muted-foreground">Se genera con los datos del cliente</p>
            </div>
            {payment.nithrox_invoice && (
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Generada</span>
            )}
          </div>
          {payment.nithrox_invoice ? (
            <div className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-lg mb-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs flex-1 truncate">{payment.nithrox_invoice.name}</span>
              <a href={payment.nithrox_invoice.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><ExternalLink className="w-3.5 h-3.5" /></a>
            </div>
          ) : null}
          <div className="flex gap-2">
            <button onClick={generateInvoice} className="flex-1 py-2 text-xs font-bold border border-border rounded-lg hover:bg-accent transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Generar Factura Nithrox
            </button>
          </div>
        </div>

        {/* Factura SUNAT */}
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold">Factura SUNAT</p>
              <p className="text-xs text-muted-foreground">Solo Nithrox puede subir · El cliente la ve</p>
            </div>
            {payment.sunat_invoice && (
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">Adjuntada</span>
            )}
          </div>
          {payment.sunat_invoice ? (
            <div className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-lg mb-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs flex-1 truncate">{payment.sunat_invoice.name}</span>
              <a href={payment.sunat_invoice.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><ExternalLink className="w-3.5 h-3.5" /></a>
              <button onClick={() => update({ sunat_invoice: null })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ) : null}
          <button onClick={() => sunatRef.current?.click()}
            className="w-full py-2 text-xs font-bold border border-border rounded-lg hover:bg-accent transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Adjuntar Factura SUNAT
          </button>
          <input ref={sunatRef} type="file" className="hidden" accept="image/*,.pdf,.xml"
            onChange={e => {
              const f = e.target.files?.[0]
              if (!f) return
              const reader = new FileReader()
              reader.onload = () => update({ sunat_invoice: { name: f.name, size: `${(f.size / 1024).toFixed(0)} KB`, url: reader.result } })
              reader.readAsDataURL(f)
              toast.success('Factura SUNAT adjuntada')
            }} />
        </div>
      </div>
    </div>
  )
}

// ── Approvals panel ─────────────────────────────────────────
function ApprovalsPanel({ phaseData, project, onApproveAdmin, onApproveClient }) {
  const canAdvance = phaseData.paid && phaseData.approved_admin && phaseData.approved_client
  return (
    <div className="space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        {/* Nithrox */}
        <div className={`rounded-xl p-4 border-2 ${phaseData.approved_admin ? 'bg-green-50 dark:bg-green-950/30 border-green-200' : 'bg-muted/30 border-border'}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">AC</div>
            <div><p className="text-sm font-bold">Nithrox</p><p className="text-xs text-muted-foreground">Adrian Caravedo</p></div>
          </div>
          {phaseData.approved_admin
            ? <p className="text-xs text-green-700 font-bold flex items-center gap-1 uppercase"><Check className="w-3.5 h-3.5" /> Aprobado</p>
            : <button onClick={() => { onApproveAdmin(); toast.success('Aprobado como Nithrox') }} className="w-full py-1.5 bg-foreground text-background text-xs font-bold rounded-lg hover:bg-foreground/90 uppercase tracking-widest">Aprobar</button>
          }
        </div>

        {/* Client */}
        <div className={`rounded-xl p-4 border-2 ${phaseData.approved_client ? 'bg-green-50 dark:bg-green-950/30 border-green-200' : 'bg-muted/30 border-border'}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#7c3aed' }}>
              {project.company?.[0] || 'C'}
            </div>
            <div><p className="text-sm font-bold">{project.company}</p><p className="text-xs text-muted-foreground">Cliente</p></div>
          </div>
          {phaseData.approved_client
            ? <p className="text-xs text-green-700 font-bold flex items-center gap-1 uppercase"><Check className="w-3.5 h-3.5" /> Aprobó</p>
            : (
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground">⏳ Esperando</p>
                <button onClick={() => { onApproveClient(); toast.success(`${project.company} aprobó`) }}
                  className="w-full py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 uppercase tracking-widest">
                  Aprobar como cliente
                </button>
              </div>
            )
          }
        </div>
      </div>

      {!phaseData.paid && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
          <p className="text-xs text-yellow-700 font-medium">Se requiere confirmar el pago antes de aprobar</p>
        </div>
      )}

      {canAdvance && (
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div><p className="text-sm font-bold text-green-800">¡Fase lista para avanzar!</p><p className="text-xs text-green-700">Pago confirmado · Ambas partes aprobaron</p></div>
        </div>
      )}
    </div>
  )
}

// ── PHASE CONTENT ───────────────────────────────────────────

// ── Kickoff ─────────────────────────────────────────────────
function KickoffContent({ project, phaseData, onUpdate }) {
  const b = phaseData.branding || { logo: [], colors: [], fonts: [] }
  const sitemap = phaseData.sitemap || []
  const briefing = phaseData.briefing || {}

  const BRIEFING_FIELDS = [
    { key: 'objective', label: '¿Cuál es el objetivo principal del sitio?', type: 'textarea' },
    { key: 'audience', label: '¿Quién es tu público objetivo?', type: 'textarea' },
    { key: 'competitors', label: 'Competidores o referencias que te gusten', type: 'text' },
    { key: 'social', label: 'Redes sociales de la empresa', type: 'text' },
    { key: 'domain', label: 'Dominio deseado', type: 'text' },
    { key: 'deadline', label: 'Fecha límite deseada', type: 'date' },
    { key: 'extra', label: 'Información adicional', type: 'textarea' },
  ]

  return (
    <div className="space-y-8">
      {/* Branding */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4">🎨 BRANDING</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-widest">Logo</p>
            <FileArea files={b.logo} onChange={v => onUpdate({ branding: { ...b, logo: v } })} label="Subir logo (SVG, PNG, AI)" accept="image/*,.svg,.ai,.eps" />
            {b.logo?.length > 0 && b.logo[0]?.url && (
              <div className="mt-3 p-4 bg-muted/30 rounded-xl flex items-center justify-center min-h-24 border border-border">
                <img src={b.logo[0].url} alt="Logo" className="max-h-20 max-w-full object-contain" />
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-widest">Paleta de colores</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {(b.colors || []).map((c, i) => (
                <div key={i} className="flex items-center gap-2 border border-border rounded-lg px-2.5 py-1.5 group">
                  <div className="w-5 h-5 rounded-full border border-border/50" style={{ backgroundColor: c }} />
                  <span className="text-xs font-mono">{c}</span>
                  <button onClick={() => onUpdate({ branding: { ...b, colors: b.colors.filter((_, j) => j !== i) } })} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                </div>
              ))}
              <input type="color" onChange={e => onUpdate({ branding: { ...b, colors: [...(b.colors || []), e.target.value] } })}
                className="w-8 h-8 rounded-lg cursor-pointer border border-border" title="Agregar color" />
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-widest">Tipografías</p>
            <div className="flex flex-wrap gap-2">
              {(b.fonts || []).map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 border border-border rounded-lg px-2.5 py-1.5 text-xs group">
                  <span>{f}</span>
                  <button onClick={() => onUpdate({ branding: { ...b, fonts: b.fonts.filter((_, j) => j !== i) } })} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                </div>
              ))}
              <input placeholder="+ Agregar tipografía" className="text-xs border-0 outline-none bg-transparent text-muted-foreground w-36"
                onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { onUpdate({ branding: { ...b, fonts: [...(b.fonts || []), e.target.value.trim()] } }); e.target.value = '' } }} />
            </div>
          </div>
        </div>
      </section>

      {/* Briefing form */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4">📋 BRIEFING</h3>
        <div className="space-y-4">
          {BRIEFING_FIELDS.map(f => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea value={briefing[f.key] || ''} onChange={e => onUpdate({ briefing: { ...briefing, [f.key]: e.target.value } })}
                  rows={2} className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-background resize-none" />
              ) : (
                <input type={f.type} value={briefing[f.key] || ''} onChange={e => onUpdate({ briefing: { ...briefing, [f.key]: e.target.value } })}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
              )}
            </div>
          ))}

          {/* Form link */}
          <div className="bg-muted/30 border border-border rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-2">Formulario de briefing del cliente</p>
            <p className="text-xs text-muted-foreground mb-2">Asigna un formulario Typeform para que el cliente lo complete:</p>
            <input value={briefing.form_link || ''} onChange={e => onUpdate({ briefing: { ...briefing, form_link: e.target.value } })}
              placeholder="Pega el link del formulario aquí..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
          </div>
        </div>
      </section>

      {/* Social / Info */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4">📱 REDES SOCIALES</h3>
        <div className="grid grid-cols-2 gap-3">
          {['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'twitter'].map(sn => (
            <div key={sn} className="space-y-1">
              <label className="text-xs text-muted-foreground capitalize">{sn}</label>
              <input value={briefing[`social_${sn}`] || ''} onChange={e => onUpdate({ briefing: { ...briefing, [`social_${sn}`]: e.target.value } })}
                placeholder={`@usuario`} className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary bg-background" />
            </div>
          ))}
        </div>
      </section>

      {/* Sitemap canvas */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-2">🗺️ MAPA DEL SITIO</h3>
        <p className="text-xs text-muted-foreground mb-3">Canvas libre — arrastra nodos, doble click para editar, selecciona y presiona "Conectar"</p>
        <div className="border border-border rounded-xl overflow-hidden" style={{ height: 380 }}>
          <SitemapCanvas nodes={sitemap} onChange={v => onUpdate({ sitemap: v })} />
        </div>
      </section>

      {/* Files */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4">📁 ARCHIVOS DEL KICK-OFF</h3>
        <FileArea files={phaseData.kickoff_files || []} onChange={v => onUpdate({ kickoff_files: v })} label="Contratos, briefs, referencias, cualquier documento" />
      </section>
    </div>
  )
}

// ── Server tab ───────────────────────────────────────────────
function ServerTab({ project, phaseData, onUpdate }) {
  const { servers, addServer } = useStore()
  const [showAddServer, setShowAddServer] = useState(false)
  const [serverForm, setServerForm] = useState({ name: '', type: 'Shared', ip: '', provider: 'Hostinger', cpanel_url: '', domain: '', plan: '', monthly_cost: '' })
  const assigned = phaseData.server_id ? servers.find(s => s.id === phaseData.server_id) : null

  const handleAddServer = () => {
    if (!serverForm.name || !serverForm.ip) return
    addServer({ ...serverForm, status: 'online', cpu: 0, ram: 0, disk: 0, sites: 0, clients: [project.company_id], monthly_cost: parseFloat(serverForm.monthly_cost) || 0 })
    toast.success('Servidor agregado')
    setShowAddServer(false)
  }

  return (
    <div className="space-y-6">
      {/* Assigned server */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">SERVIDOR ASIGNADO</p>
        {assigned ? (
          <div className="bg-background border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${assigned.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <div>
                  <p className="font-bold text-sm">{assigned.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{assigned.ip}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {assigned.cpanel_url && (
                  <a href={assigned.cpanel_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-bold hover:bg-accent transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> cPanel
                  </a>
                )}
                <button onClick={() => onUpdate({ server_id: null })} className="text-muted-foreground hover:text-destructive p-1.5 rounded hover:bg-accent"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
              <div><p className="font-bold text-foreground">{assigned.provider}</p><p>Proveedor</p></div>
              <div><p className="font-bold text-foreground">{assigned.plan || '—'}</p><p>Plan</p></div>
              <div><p className="font-bold text-foreground">{assigned.monthly_cost > 0 ? `$${assigned.monthly_cost}/mo` : '—'}</p><p>Costo</p></div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-xl p-6 space-y-3">
            <p className="text-sm text-muted-foreground text-center">Sin servidor asignado</p>
            <div className="flex gap-2 justify-center">
              <div className="space-y-1 flex-1 max-w-xs">
                <label className="text-xs text-muted-foreground">Seleccionar servidor existente</label>
                <select onChange={e => { if (e.target.value) { onUpdate({ server_id: e.target.value }); toast.success('Servidor asignado') } }}
                  className="w-full border border-border rounded-lg px-2.5 py-2 text-sm bg-background outline-none focus:border-primary">
                  <option value="">Seleccionar...</option>
                  {servers.map(s => <option key={s.id} value={s.id}>{s.name} · {s.ip}</option>)}
                </select>
              </div>
            </div>
            <div className="text-center">
              <button onClick={() => setShowAddServer(true)} className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto">
                <Plus className="w-3.5 h-3.5" /> O agregar nuevo servidor
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add server form */}
      {showAddServer && (
        <div className="bg-background border border-border rounded-xl p-5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest">NUEVO SERVIDOR</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: 'name', l: 'Nombre', placeholder: 'VPS Cliente X' },
              { k: 'ip', l: 'IP', placeholder: '45.67.89.100' },
              { k: 'provider', l: 'Proveedor', placeholder: 'Hostinger, DigitalOcean...' },
              { k: 'plan', l: 'Plan', placeholder: '8GB RAM, 4 vCPU...' },
              { k: 'cpanel_url', l: 'URL cPanel', placeholder: 'https://ip:2083' },
              { k: 'monthly_cost', l: 'Costo mensual', placeholder: '40' },
            ].map(f => (
              <div key={f.k} className="space-y-1">
                <label className="text-xs text-muted-foreground">{f.l}</label>
                <input value={serverForm[f.k] || ''} onChange={e => setServerForm(p => ({ ...p, [f.k]: e.target.value }))}
                  placeholder={f.placeholder} className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background outline-none focus:border-primary" />
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAddServer(false)} className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent">Cancelar</button>
            <button onClick={handleAddServer} disabled={!serverForm.name || !serverForm.ip} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg font-bold uppercase tracking-wider disabled:opacity-40">Agregar</button>
          </div>
        </div>
      )}

      {/* Domain */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">DOMINIO</p>
        <div className="bg-background border border-border rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: 'domain_name', l: 'Dominio', placeholder: 'cliente.pe' },
              { k: 'domain_registrar', l: 'Registrador', placeholder: 'RealTime Register' },
              { k: 'domain_expires', l: 'Vencimiento', placeholder: '2027-04-01', type: 'date' },
              { k: 'domain_ssl', l: 'SSL vence', placeholder: '2026-04-01', type: 'date' },
            ].map(f => (
              <div key={f.k} className="space-y-1">
                <label className="text-xs text-muted-foreground">{f.l}</label>
                <input type={f.type || 'text'} value={phaseData[f.k] || ''} onChange={e => onUpdate({ [f.k]: e.target.value })}
                  placeholder={f.placeholder} className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background outline-none focus:border-primary" />
              </div>
            ))}
          </div>
          {phaseData.domain_name && (
            <a href={`https://${phaseData.domain_name}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline">
              <ExternalLink className="w-3.5 h-3.5" /> Abrir {phaseData.domain_name}
            </a>
          )}
          {/* RealTime Register */}
          <div className="pt-3 border-t border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">REALTIME REGISTER API</p>
            <div className="space-y-2">
              <input value={phaseData.rtr_api_key || ''} onChange={e => onUpdate({ rtr_api_key: e.target.value })}
                placeholder="API Key de RealTime Register..." type="password"
                className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background outline-none focus:border-primary font-mono" />
              <button className="w-full py-2 border border-border rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors flex items-center justify-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Verificar disponibilidad del dominio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Design phase ─────────────────────────────────────────────
function DesignContent({ phaseData, onUpdate, projectId }) {
  const versions = phaseData.versions || { mobile: true, tablet: false, desktop: true }
  const [commentTab, setCommentTab] = useState('comments')

  return (
    <div className="space-y-6">
      {/* Figma embed */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3">🔗 FIGMA</h3>
        <div className="flex gap-2 mb-3">
          <input value={phaseData.figma_url || ''} onChange={e => onUpdate({ figma_url: e.target.value })}
            placeholder="https://figma.com/file/..." className="flex-1 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
          {phaseData.figma_url && (
            <a href={phaseData.figma_url} target="_blank" rel="noopener noreferrer">
              <button className="px-3 py-2 border border-border rounded-xl hover:bg-accent transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Abrir Figma
              </button>
            </a>
          )}
        </div>
        {phaseData.figma_url && (
          <div className="border border-border rounded-xl overflow-hidden bg-muted/10" style={{ height: 400 }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">VISOR FIGMA</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] text-muted-foreground">Link activo</span>
              </div>
            </div>
            <iframe
              src={phaseData.figma_url.replace('figma.com/file', 'www.figma.com/embed?embed_host=nithrox&url=https://figma.com/file').replace('https://figma.com/file', 'https://www.figma.com/embed?embed_host=nithrox&url=https://figma.com/file')}
              className="w-full h-full border-0"
              allowFullScreen
              title="Figma Preview"
            />
          </div>
        )}
      </section>

      {/* Versions */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3">📱 VERSIONES A DISEÑAR</h3>
        <div className="flex gap-3">
          {[{ k: 'mobile', l: '📱 Mobile', sub: '375px' }, { k: 'tablet', l: '💻 Tablet', sub: '768px' }, { k: 'desktop', l: '🖥️ Desktop', sub: '1440px' }].map(v => (
            <label key={v.k} className={`flex-1 flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${versions[v.k] ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/30'}`}>
              <div onClick={() => onUpdate({ versions: { ...versions, [v.k]: !versions[v.k] } })}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${versions[v.k] ? 'bg-foreground border-foreground' : 'border-border'}`}>
                {versions[v.k] && <Check className="w-2.5 h-2.5 text-background" />}
              </div>
              <div><p className="text-sm font-medium">{v.l}</p><p className="text-xs text-muted-foreground">{v.sub}</p></div>
            </label>
          ))}
        </div>
      </section>

      {/* Files */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3">📁 ARCHIVOS DE DISEÑO</h3>
        <FileArea files={phaseData.files || []} onChange={v => onUpdate({ files: v })} label="Subir archivos (.fig, .sketch, PDF, imágenes)" accept=".fig,.sketch,.pdf,image/*" />
      </section>

      {/* Comments */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3">💬 COMENTARIOS</h3>
        <div style={{ height: 400 }}>
          <CommentsSection phaseKey="design" projectId={projectId} />
        </div>
      </section>
    </div>
  )
}

// ── Development phase ────────────────────────────────────────
function DevContent({ phaseData, onUpdate, projectId }) {
  const checks = phaseData.checklist_dev || {}
  const CHECKLIST = [
    { key: 'setup', label: 'Entorno de desarrollo configurado', desc: 'Repo, rama, CI/CD básico' },
    { key: 'html_css', label: 'Maquetado HTML/CSS pixel-perfect', desc: 'Fiel al diseño aprobado' },
    { key: 'responsive', label: 'Responsive en todos los breakpoints', desc: 'Mobile, tablet, desktop' },
    { key: 'cms', label: 'Integración CMS/Framework', desc: 'WordPress, Laravel, React...' },
    { key: 'forms', label: 'Formularios funcionales', desc: 'Con validación y envío real' },
    { key: 'seo', label: 'SEO técnico básico', desc: 'Meta tags, sitemap.xml, robots.txt' },
    { key: 'performance', label: 'Performance optimizado', desc: 'Imágenes, fonts, lazy loading' },
    { key: 'analytics', label: 'Analytics instalado', desc: 'Google Analytics / Tag Manager' },
    { key: 'accessibility', label: 'Accesibilidad básica', desc: 'Alt tags, contraste, ARIA' },
    { key: 'security', label: 'Seguridad básica', desc: 'SSL, headers HTTP, sanitización' },
    { key: 'testing', label: 'Testing cross-browser', desc: 'Chrome, Safari, Firefox, Edge' },
    { key: 'staging_ok', label: 'Staging revisado por el equipo', desc: 'Sin bugs visibles' },
  ]

  return (
    <div className="space-y-6">
      {/* Staging URL */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3">🌐 URL DE STAGING</h3>
        <div className="flex gap-2 mb-3">
          <input value={phaseData.staging_url || ''} onChange={e => onUpdate({ staging_url: e.target.value })}
            placeholder="https://staging.nithrox.com/proyecto" className="flex-1 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
          {phaseData.staging_url && (
            <a href={phaseData.staging_url} target="_blank" rel="noopener noreferrer">
              <button className="px-3 py-2 border border-border rounded-xl hover:bg-accent transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Abrir
              </button>
            </a>
          )}
        </div>
        {phaseData.staging_url && (
          <div className="border border-border rounded-xl overflow-hidden bg-muted/10" style={{ height: 340 }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">VISTA PREVIA STAGING</p>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-green-500" />
                <span className="text-[10px] text-muted-foreground">En vivo</span>
              </div>
            </div>
            <iframe src={phaseData.staging_url} className="w-full h-full border-0" title="Staging Preview" sandbox="allow-same-origin allow-scripts" />
          </div>
        )}
      </section>

      {/* Checklist */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4">✅ CHECKLIST DE DESARROLLO</h3>
        <Checklist items={CHECKLIST} values={checks} onChange={v => onUpdate({ checklist_dev: v })} />
      </section>

      {/* Notes */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3">📝 NOTAS TÉCNICAS</h3>
        <textarea value={phaseData.notes || ''} onChange={e => onUpdate({ notes: e.target.value })}
          placeholder="Decisiones de arquitectura, dependencias, issues conocidos, instrucciones de deploy..."
          rows={4} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary bg-background resize-none" />
      </section>

      {/* Files */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3">📁 ARCHIVOS</h3>
        <FileArea files={phaseData.files || []} onChange={v => onUpdate({ files: v })} label="Subir archivos del desarrollo" />
      </section>

      {/* Comments */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3">💬 COMENTARIOS</h3>
        <div style={{ height: 400 }}>
          <CommentsSection phaseKey="development" projectId={projectId} />
        </div>
      </section>
    </div>
  )
}

// ── Publication phase ────────────────────────────────────────
function PublicationContent({ phaseData, onUpdate }) {
  const checks = phaseData.checklist || {}
  const CHECKLIST = [
    { key: 'client_review', label: 'Revisión final aprobada por el cliente', desc: 'Todas las correcciones aplicadas' },
    { key: 'backup_staging', label: 'Backup del staging creado', desc: 'Por si hay rollback' },
    { key: 'deploy', label: 'Deploy en servidor de producción', desc: 'Sin errores en los logs' },
    { key: 'dns', label: 'DNS configurado y propagado', desc: 'Puede tardar hasta 48h' },
    { key: 'ssl', label: 'SSL activo y forzado (HTTPS)', desc: 'Certificado válido' },
    { key: 'www', label: 'Redirección www configurada', desc: 'www.dominio.com → dominio.com' },
    { key: 'speed', label: 'Test Lighthouse > 70', desc: 'Performance, SEO, Accesibilidad' },
    { key: 'forms_live', label: 'Formularios probados en producción', desc: 'Emails llegan correctamente' },
    { key: 'analytics_live', label: 'Analytics funcionando', desc: 'Datos visibles en GA4' },
    { key: 'sitemap_submitted', label: 'Sitemap enviado a Google', desc: 'Google Search Console' },
    { key: 'backup_live', label: 'Backup inicial del sitio live', desc: 'Primer backup guardado' },
    { key: 'training', label: 'Capacitación al cliente completada', desc: 'Sabe usar el CMS/admin' },
    { key: 'handoff', label: 'Credenciales entregadas', desc: 'Accesos seguros al cliente' },
  ]
  const done = Object.values(checks).filter(Boolean).length
  const allDone = done === CHECKLIST.length

  return (
    <div className="space-y-6">
      {/* Domain */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3">🌐 DOMINIO DE PRODUCCIÓN</h3>
        <div className="flex gap-2">
          <input value={phaseData.domain || ''} onChange={e => onUpdate({ domain: e.target.value })}
            placeholder="www.tudominio.pe" className="flex-1 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
          {phaseData.domain && (
            <a href={`https://${phaseData.domain}`} target="_blank" rel="noopener noreferrer">
              <button className="px-3 py-2 border border-border rounded-xl hover:bg-accent text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Ver sitio
              </button>
            </a>
          )}
        </div>
      </section>

      {/* Checklist */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4">✅ CHECKLIST DE PUBLICACIÓN</h3>
        <Checklist items={CHECKLIST} values={checks} onChange={v => onUpdate({ checklist: v })} />
      </section>

      {/* Google Search Console */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3">🔍 GOOGLE SEARCH CONSOLE</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { k: 'gsc_verified', l: 'Verificación GSC', placeholder: 'google-site-verification=...' },
            { k: 'analytics_id', l: 'GA4 Measurement ID', placeholder: 'G-XXXXXXXXXX' },
          ].map(f => (
            <div key={f.k} className="space-y-1">
              <label className="text-xs text-muted-foreground">{f.l}</label>
              <input value={phaseData[f.k] || ''} onChange={e => onUpdate({ [f.k]: e.target.value })}
                placeholder={f.placeholder} className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs bg-background outline-none focus:border-primary font-mono" />
            </div>
          ))}
        </div>
      </section>

      {/* Notes post-launch */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-3">📝 NOTAS POST-LANZAMIENTO</h3>
        <textarea value={phaseData.post_launch_notes || ''} onChange={e => onUpdate({ post_launch_notes: e.target.value })}
          placeholder="Pendientes, mejoras futuras, acuerdos de mantenimiento..."
          rows={3} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary bg-background resize-none" />
      </section>

      {/* Launch button */}
      {allDone && (
        <button className="w-full py-4 bg-foreground text-background font-bold rounded-xl text-sm uppercase tracking-widest hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2">
          ⚡ PUBLICAR EN PRODUCCIÓN
        </button>
      )}
      {!allDone && (
        <div className="py-3 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
          Completa el checklist ({done}/{CHECKLIST.length}) para habilitar la publicación
        </div>
      )}
    </div>
  )
}

// ── MAIN PROJECT DETAIL ──────────────────────────────────────
const PHASE_INFO = {
  kickoff:     { color: '#3b82f6', label: 'KICK-OFF',    icon: '🚀', pct: 10 },
  design:      { color: '#8b5cf6', label: 'DISEÑO',      icon: '🎨', pct: 40 },
  development: { color: '#f59e0b', label: 'DESARROLLO',  icon: '⚙️',  pct: 40 },
  publication: { color: '#22c55e', label: 'PUBLICACIÓN', icon: '🌐', pct: 10 },
}
const PHASES = ['kickoff', 'design', 'development', 'publication']

const PHASE_SECTIONS = {
  kickoff:     [{ id: 'content', l: 'CONTENIDO' }, { id: 'server', l: 'SERVIDOR' }, { id: 'payment', l: 'PAGO' }, { id: 'approvals', l: 'APROBACIONES' }],
  design:      [{ id: 'content', l: 'CONTENIDO' }, { id: 'payment', l: 'PAGO' }, { id: 'approvals', l: 'APROBACIONES' }],
  development: [{ id: 'content', l: 'CONTENIDO' }, { id: 'payment', l: 'PAGO' }, { id: 'approvals', l: 'APROBACIONES' }],
  publication: [{ id: 'content', l: 'CONTENIDO' }, { id: 'payment', l: 'PAGO' }, { id: 'approvals', l: 'APROBACIONES' }],
}

// ── Timeline / Gantt ──────────────────────────────────────────
const PHASE_COLORS_TL = {
  kickoff:     { bg: '#3b82f6', light: '#eff6ff', border: '#93c5fd', label: 'Kick-off' },
  design:      { bg: '#8b5cf6', light: '#f5f3ff', border: '#c4b5fd', label: 'Diseño' },
  development: { bg: '#f59e0b', light: '#fffbeb', border: '#fcd34d', label: 'Desarrollo' },
  publication: { bg: '#10b981', light: '#ecfdf5', border: '#6ee7b7', label: 'Publicación' },
}

const DEFAULT_DURATIONS = { kickoff: 14, design: 21, development: 30, publication: 7 }

function TimelineView({ project, onClose }) {
  const PHASES_TL = ['kickoff', 'design', 'development', 'publication']

  // Build editable timeline rows from project data
  const buildRows = () => {
    const startDate = new Date(project.start_date || Date.now())
    let cursor = new Date(startDate)
    return PHASES_TL.map(ph => {
      const phData = project.phases?.[ph] || {}
      const duration = phData.timeline_days || DEFAULT_DURATIONS[ph]
      const start = new Date(cursor)
      const end = new Date(cursor.getTime() + duration * 24 * 60 * 60 * 1000)
      cursor = new Date(end)
      return { phase: ph, start, end, duration, status: phData.status || 'locked', paid: phData.paid || false }
    })
  }

  const [rows, setRows] = useState(buildRows)
  const [projectStart, setProjectStart] = useState(
    project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  )
  const [milestones, setMilestones] = useState([
    { id: 'm1', label: 'Kick-off', phase: 'kickoff', icon: '🚀' },
    { id: 'm2', label: 'Entrega diseño', phase: 'design', icon: '🎨' },
    { id: 'm3', label: 'Staging live', phase: 'development', icon: '⚡' },
    { id: 'm4', label: 'Lanzamiento', phase: 'publication', icon: '🎉' },
  ])
  const [newMilestone, setNewMilestone] = useState('')

  const updateDuration = (ph, days) => {
    setRows(prev => {
      const newRows = []
      const startDate = new Date(projectStart)
      let cursor = new Date(startDate)
      prev.forEach(r => {
        const d = r.phase === ph ? Math.max(1, parseInt(days) || DEFAULT_DURATIONS[ph]) : r.duration
        const start = new Date(cursor)
        const end = new Date(cursor.getTime() + d * 24 * 60 * 60 * 1000)
        cursor = new Date(end)
        newRows.push({ ...r, duration: d, start, end })
      })
      return newRows
    })
  }

  const recalcFromStart = (dateStr) => {
    setProjectStart(dateStr)
    const startDate = new Date(dateStr)
    let cursor = new Date(startDate)
    setRows(prev => prev.map(r => {
      const start = new Date(cursor)
      const end = new Date(cursor.getTime() + r.duration * 24 * 60 * 60 * 1000)
      cursor = new Date(end)
      return { ...r, start, end }
    }))
  }

  const totalDays = rows.reduce((s, r) => s + r.duration, 0)
  const projectEnd = rows[rows.length - 1]?.end

  const fmt = (d) => d?.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
  const fmtFull = (d) => d?.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })

  // Build week columns for header
  const weeks = []
  if (rows.length > 0) {
    let cur = new Date(rows[0].start)
    const end = new Date(rows[rows.length - 1].end)
    while (cur <= end) {
      weeks.push(new Date(cur))
      cur = new Date(cur.getTime() + 7 * 24 * 60 * 60 * 1000)
    }
  }

  const pct = (d) => (d / totalDays) * 100
  const offsetPct = (date) => {
    const start = rows[0]?.start
    if (!start) return 0
    const diff = (date - start) / (1000 * 60 * 60 * 24)
    return (diff / totalDays) * 100
  }

  const STATUS_ICON = { approved: '✅', in_progress: '🔄', locked: '🔒' }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* Timeline header controls */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Inicio del proyecto</label>
          <input type="date" value={projectStart} onChange={e => recalcFromStart(e.target.value)}
            className="border border-border rounded-lg px-2 py-1 text-xs bg-background outline-none focus:border-primary" />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span><strong>{totalDays}</strong> días totales</span>
          <span>·</span>
          <span>Finaliza <strong>{fmtFull(projectEnd)}</strong></span>
        </div>
        <div className="ml-auto flex gap-2">
          {PHASES_TL.map(ph => {
            const c = PHASE_COLORS_TL[ph]
            return (
              <span key={ph} className="flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: c.light, color: c.bg }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.bg }} />
                {c.label}
              </span>
            )
          })}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Gantt chart */}
        <div className="bg-background border border-border rounded-2xl overflow-hidden">
          {/* Week header */}
          <div className="flex border-b border-border">
            <div className="w-48 shrink-0 px-4 py-2 border-r border-border bg-muted/10">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">FASE</p>
            </div>
            <div className="flex-1 relative h-8 bg-muted/10">
              <div className="flex h-full">
                {weeks.map((w, i) => (
                  <div key={i} className="flex-1 border-r border-border/30 flex items-center px-1">
                    <p className="text-[8px] text-muted-foreground font-bold">{fmt(w)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Phase rows */}
          {rows.map((row) => {
            const c = PHASE_COLORS_TL[row.phase]
            const barLeft = offsetPct(row.start)
            const barWidth = pct(row.duration)
            const phaseMilestones = milestones.filter(m => m.phase === row.phase)
            return (
              <div key={row.phase} className="flex border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                {/* Phase label */}
                <div className="w-48 shrink-0 px-4 py-3 border-r border-border flex items-center gap-2">
                  <span className="text-base">{STATUS_ICON[row.status] || '🔒'}</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-tight">{c.label}</p>
                    <p className="text-[9px] text-muted-foreground">{fmt(row.start)} → {fmt(row.end)}</p>
                  </div>
                </div>

                {/* Bar area */}
                <div className="flex-1 py-3 px-2 relative" style={{ minHeight: 56 }}>
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {weeks.map((_, i) => (
                      <div key={i} className="flex-1 border-r border-border/20" />
                    ))}
                  </div>

                  {/* Gantt bar */}
                  <div className="relative h-8 flex items-center">
                    <div className="absolute h-7 rounded-xl flex items-center px-3 shadow-sm transition-all"
                      style={{
                        left: `${barLeft}%`, width: `${barWidth}%`,
                        backgroundColor: c.bg,
                        minWidth: 40,
                      }}>
                      <p className="text-[9px] font-bold text-white truncate">{row.duration}d</p>
                      {row.paid && <span className="ml-auto text-[8px] text-white/80 shrink-0">💰</span>}
                    </div>

                    {/* Milestones */}
                    {phaseMilestones.map(m => (
                      <div key={m.id} className="absolute flex flex-col items-center" style={{ left: `${barLeft + barWidth - 2}%`, top: -4 }}>
                        <span className="text-base">{m.icon}</span>
                        <div className="w-px h-3 bg-border" />
                        <p className="text-[8px] text-muted-foreground whitespace-nowrap font-bold">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Duration input */}
                <div className="w-24 shrink-0 px-2 py-3 border-l border-border flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    <input type="number" min="1" max="365" value={row.duration}
                      onChange={e => updateDuration(row.phase, e.target.value)}
                      className="w-12 text-xs text-center border border-border rounded-lg px-1 py-1 outline-none focus:border-primary bg-background" />
                    <span className="text-[9px] text-muted-foreground">d</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3">
          {rows.map(row => {
            const c = PHASE_COLORS_TL[row.phase]
            return (
              <div key={row.phase} className="border border-border rounded-xl p-4" style={{ borderLeftWidth: 4, borderLeftColor: c.bg }}>
                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: c.bg }}>{c.label}</p>
                <p className="text-lg font-black mt-1">{row.duration} días</p>
                <p className="text-[10px] text-muted-foreground">{fmt(row.start)} → {fmt(row.end)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[9px]">{STATUS_ICON[row.status]}</span>
                  <span className="text-[9px] text-muted-foreground capitalize">{row.status === 'approved' ? 'Completada' : row.status === 'in_progress' ? 'En progreso' : 'Pendiente'}</span>
                  {row.paid && <span className="text-[9px] text-green-600 font-bold ml-auto">Pago ✓</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Milestones */}
        <div className="bg-background border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">HITOS DEL PROYECTO</p>
          </div>
          <div className="space-y-2 mb-3">
            {milestones.map((m, i) => {
              const row = rows.find(r => r.phase === m.phase)
              const c = PHASE_COLORS_TL[m.phase]
              return (
                <div key={m.id} className="flex items-center gap-3 p-2.5 border border-border rounded-xl hover:border-foreground/20 transition-colors">
                  <span className="text-xl shrink-0">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <input value={m.label} onChange={e => setMilestones(prev => prev.map(x => x.id === m.id ? { ...x, label: e.target.value } : x))}
                      className="text-xs font-bold outline-none bg-transparent border-b border-transparent focus:border-primary w-full" />
                    <p className="text-[9px] text-muted-foreground">{c?.label} · {row ? fmt(row.end) : '—'}</p>
                  </div>
                  <select value={m.phase} onChange={e => setMilestones(prev => prev.map(x => x.id === m.id ? { ...x, phase: e.target.value } : x))}
                    className="border border-border rounded-lg px-2 py-1 text-[10px] bg-background outline-none">
                    {PHASES_TL.map(ph => <option key={ph} value={ph}>{PHASE_COLORS_TL[ph].label}</option>)}
                  </select>
                  <div className="flex gap-1">
                    {['🚀','🎨','⚡','🎉','✅','📅','🔔','💡'].map(icon => (
                      <button key={icon} onClick={() => setMilestones(prev => prev.map(x => x.id === m.id ? { ...x, icon } : x))}
                        className={`text-sm p-0.5 rounded hover:bg-accent transition-colors ${m.icon === icon ? 'bg-accent' : ''}`}>
                        {icon}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setMilestones(prev => prev.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
          <div className="flex gap-2">
            <input value={newMilestone} onChange={e => setNewMilestone(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newMilestone.trim()) { setMilestones(p => [...p, { id: `m${Date.now()}`, label: newMilestone.trim(), phase: 'kickoff', icon: '📌' }]); setNewMilestone('') } }}
              placeholder="Nuevo hito... (Enter para agregar)"
              className="flex-1 border border-border rounded-xl px-3 py-2 text-xs bg-background outline-none focus:border-primary" />
            <button onClick={() => { if (newMilestone.trim()) { setMilestones(p => [...p, { id: `m${Date.now()}`, label: newMilestone.trim(), phase: 'kickoff', icon: '📌' }]); setNewMilestone('') } }}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Share / export note */}
        <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border border-border rounded-xl">
          <span className="text-lg">📤</span>
          <p className="text-xs text-muted-foreground">El timeline es editable. Puedes ajustar la duración de cada fase y los hitos del proyecto directamente aquí.</p>
        </div>
      </div>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { projects, updateProjectPhase, updateProject, contacts } = useStore()
  const [activePhase, setActivePhase] = useState('kickoff')
  const [activeSection, setActiveSection] = useState('content')
  const [showTimeline, setShowTimeline] = useState(false)
  const [showChangeContact, setShowChangeContact] = useState(false)
  const [pendingContactId, setPendingContactId] = useState('')

  const project = projects.find(p => p.id === id)
  if (!project) return (
    <div className="flex flex-col h-full">
      <Topbar title="PROYECTO" />
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm mb-3">Proyecto no encontrado</p>
          <button onClick={() => navigate('/projects')} className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-accent">← Volver</button>
        </div>
      </div>
    </div>
  )

  const phaseData = project.phases[activePhase] || {}
  const phaseIdx = PHASES.indexOf(activePhase)
  const nextPhase = PHASES[phaseIdx + 1]
  const totalPaid = PHASES.reduce((s, ph) => s + (project.phases[ph]?.paid_amount || 0), 0)
  const totalPct = project.value ? Math.round((totalPaid / project.value) * 100) : 0
  const canAdvance = phaseData.paid && phaseData.approved_admin && phaseData.approved_client && nextPhase

  const onUpdate = (data) => updateProjectPhase(project.id, activePhase, data)

  const handleApproveAdmin = () => onUpdate({ approved_admin: true })
  const handleApproveClient = () => onUpdate({ approved_client: true })

  const handleAdvance = () => {
    if (!nextPhase) return
    updateProjectPhase(project.id, activePhase, { status: 'approved' })
    updateProjectPhase(project.id, nextPhase, { status: 'in_progress' })
    updateProject(project.id, { phase: nextPhase })
    setActivePhase(nextPhase)
    setActiveSection('content')
    toast.success(`Proyecto avanzó a ${PHASE_INFO[nextPhase].label}`)
  }

  const STATUS_ICON = {
    approved:    <CheckCircle2 className="w-4 h-4 text-green-600" />,
    in_progress: <Clock className="w-4 h-4 text-yellow-500" />,
    locked:      <Lock className="w-4 h-4 text-muted-foreground" />,
  }

  const sections = PHASE_SECTIONS[activePhase] || PHASE_SECTIONS.kickoff

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <Topbar
        title={project.name.toUpperCase()}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowTimeline(t => !t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border uppercase tracking-wider transition-all ${showTimeline ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-accent'}`}>
              📅 {showTimeline ? 'Cerrar Timeline' : 'Timeline'}
            </button>
            {canAdvance && (
              <button onClick={handleAdvance}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-full hover:bg-green-700 uppercase tracking-wider">
                Avanzar a {PHASE_INFO[nextPhase]?.label} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => navigate('/projects')} className="text-xs border border-border rounded-full px-3 py-1.5 hover:bg-accent transition-colors uppercase tracking-widest font-bold">
              ← Proyectos
            </button>
          </div>
        }
      />

      {/* TIMELINE VIEW */}
      {showTimeline && <TimelineView project={project} onClose={() => setShowTimeline(false)} />}

      <div className={`flex flex-1 overflow-hidden ${showTimeline ? 'hidden' : ''}`}>
        {/* LEFT SIDEBAR — Phase nav */}
        <div className="w-56 border-r border-border flex flex-col shrink-0 overflow-hidden">
          {/* Project summary */}
          <div className="p-4 border-b border-border shrink-0">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{project.company}</p>
            <p className="text-[10px] text-muted-foreground">{project.framework}</p>
            {/* Contact row */}
            {(() => {
              const linkedContact = contacts?.find(c => c.id === project.contact_id)
              return (
                <div className="flex items-center justify-between mt-1 mb-3">
                  <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                    {linkedContact ? `👤 ${linkedContact.name}` : <span className="text-muted-foreground/50">Sin contacto</span>}
                  </p>
                  <button onClick={() => { setPendingContactId(project.contact_id || ''); setShowChangeContact(true) }}
                    className="text-[9px] text-primary hover:underline shrink-0 ml-1">
                    {linkedContact ? 'cambiar' : '+ asignar'}
                  </button>
                </div>
              )
            })()}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground uppercase tracking-widest text-[9px] font-bold">COBRADO</span>
                <span className="font-bold tabular-nums">{totalPct}%</span>
              </div>
              <div className="bg-muted rounded-full h-1.5">
                <div className="bg-foreground h-1.5 rounded-full transition-all duration-500" style={{ width: `${totalPct}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground tabular-nums">${totalPaid.toLocaleString()} / ${project.value?.toLocaleString()}</p>
            </div>
          </div>

          {/* Phase list */}
          <div className="p-2 space-y-1 overflow-y-auto flex-1">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-2 mt-1">FASES</p>
            {PHASES.map((ph, i) => {
              const pd = project.phases[ph] || {}
              const info = PHASE_INFO[ph]
              const isActive = activePhase === ph
              const phaseAmount = project.value ? Math.round(project.value * (info.pct || 10) / 100) : 0

              return (
                <button key={ph} onClick={() => { setActivePhase(ph); setActiveSection('content') }}
                  className={`w-full text-left p-3 rounded-xl transition-all ${isActive ? 'bg-foreground text-background' : 'hover:bg-accent/70'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest">{info.icon} {info.label}</span>
                    <span>{STATUS_ICON[pd.status || 'locked']}</span>
                  </div>
                  <div className={`text-[9px] ${isActive ? 'text-background/60' : 'text-muted-foreground'} tabular-nums`}>
                    {info.pct}% · ${phaseAmount.toLocaleString()}
                  </div>
                  {(pd.paid_amount || 0) > 0 && (
                    <div className={`text-[9px] mt-0.5 ${isActive ? 'text-green-300' : 'text-green-600'} tabular-nums`}>
                      ✓ Pagado ${pd.paid_amount.toLocaleString()}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* MAIN — Phase content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Section tabs */}
          <div className="flex border-b border-border px-5 shrink-0 bg-background">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`px-4 py-3 text-[10px] font-bold border-b-2 transition-colors uppercase tracking-widest ${activeSection === s.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                {s.l}
                {s.id === 'payment' && (
                  <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full ${phaseData.paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {phaseData.paid ? '✓' : '!'}
                  </span>
                )}
                {s.id === 'approvals' && (
                  <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full ${phaseData.approved_admin && phaseData.approved_client ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                    {[phaseData.approved_admin, phaseData.approved_client].filter(Boolean).length}/2
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeSection === 'content' && (
              <>
                {activePhase === 'kickoff' && <KickoffContent project={project} phaseData={phaseData} onUpdate={onUpdate} />}
                {activePhase === 'design' && <DesignContent phaseData={phaseData} onUpdate={onUpdate} projectId={id} />}
                {activePhase === 'development' && <DevContent phaseData={phaseData} onUpdate={onUpdate} projectId={id} />}
                {activePhase === 'publication' && <PublicationContent phaseData={phaseData} onUpdate={onUpdate} />}
              </>
            )}
            {activeSection === 'server' && <ServerTab project={project} phaseData={phaseData} onUpdate={onUpdate} />}
            {activeSection === 'payment' && <PaymentSection phaseKey={activePhase} project={project} onUpdate={onUpdate} />}
            {activeSection === 'approvals' && (
              <div className="space-y-5">
                <ApprovalsPanel phaseData={phaseData} project={project} onApproveAdmin={handleApproveAdmin} onApproveClient={handleApproveClient} />
                {canAdvance && (
                  <button onClick={handleAdvance}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-xl text-sm uppercase tracking-widest hover:bg-green-700 transition-colors">
                    Avanzar a {PHASE_INFO[nextPhase]?.label} <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change contact dialog */}
      <Dialog open={showChangeContact} onOpenChange={setShowChangeContact}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Asignar contacto al proyecto</DialogTitle></DialogHeader>
          <div className="py-2">
            <p className="text-xs text-muted-foreground mb-3">
              El contacto asignado podrá ver este proyecto en su portal cliente.
            </p>
            <Select value={pendingContactId} onValueChange={setPendingContactId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar contacto..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Sin contacto —</SelectItem>
                {(contacts || []).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}{c.email ? ` · ${c.email}` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowChangeContact(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => {
              const contact = contacts?.find(c => c.id === pendingContactId)
              updateProject(project.id, {
                contact_id: pendingContactId || null,
                contact: contact?.name || '',
              })
              setShowChangeContact(false)
              toast.success(contact ? `Proyecto asignado a ${contact.name}` : 'Contacto removido del proyecto')
            }}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
