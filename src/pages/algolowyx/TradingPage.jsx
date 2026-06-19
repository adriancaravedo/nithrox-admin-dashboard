import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  TrendingUp, TrendingDown, Plus, X, Search, Filter,
  BarChart3, Target, AlertTriangle, ChevronDown,
  Trash2, Pencil, Copy, Download, RefreshCw, Eye,
  ArrowUpRight, ArrowDownRight, Minus, Calendar,
  DollarSign, Percent, Activity, BookOpen, Clock,
  MoreVertical, CheckCircle, XCircle, Circle
} from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────
function load(k, d) { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d } catch { return d } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }
function fmt(n, dec = 2) { return typeof n === 'number' ? n.toFixed(dec) : '—' }
function fmtUSD(n) { if (typeof n !== 'number') return '—'; return (n >= 0 ? '+$' : '-$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtPct(n) { if (typeof n !== 'number') return '—'; return (n >= 0 ? '+' : '') + n.toFixed(2) + '%' }
function randomId() { return `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }

const PAIRS = ['EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','USD/CAD','NZD/USD','EUR/GBP','EUR/JPY','GBP/JPY','BTC/USD','ETH/USD','XAU/USD','XAG/USD','SPX500','NAS100','US30','OIL/USD','AAPL','TSLA','MSFT','NVDA','META','AMZN']
const STRATEGIES = ['Breakout','Scalping','Swing','Trend Following','Mean Reversion','News Trade','SMC / ICT','Supply & Demand','Price Action','MACD Cross','RSI Divergence','Grid']
const SESSIONS = ['London','New York','Asian','London-NY Overlap','Pre-Market','After-Market']
const TIMEFRAMES = ['1M','5M','15M','1H','4H','D1','W1']
const EMOTIONS = ['Disciplinado','Confiado','Ansioso','FOMO','Revenge Trade','Neutro','Cansado']

// ── Mini charts (ASCII sparkline style) ───────────────────────
function Sparkline({ values, color, height = 32 }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 120, h = height
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

// ── Badge ──────────────────────────────────────────────────────
function Badge({ value }) {
  if (typeof value !== 'number') return <span className="text-muted-foreground">—</span>
  const pos = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${pos ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
      {pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {fmtPct(value)}
    </span>
  )
}

// ── Trade Form Modal ───────────────────────────────────────────
const EMPTY_TRADE = () => ({
  id: randomId(), pair: '', direction: 'long', status: 'closed',
  entry_price: '', exit_price: '', size: '', stop_loss: '', take_profit: '',
  pnl: '', pnl_pct: '', rr: '',
  strategy: '', session: '', timeframe: '1H', emotion: 'Neutro',
  date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5),
  notes: '', screenshot: '', tags: '',
  fees: '', account: 'Principal',
})

function TradeModal({ trade: initial, onSave, onClose }) {
  const [form, setForm] = useState(() => initial || EMPTY_TRADE())
  const isNew = !initial

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Auto-calculate P&L when entry/exit/size change
  useEffect(() => {
    const entry = parseFloat(form.entry_price)
    const exit = parseFloat(form.exit_price)
    const size = parseFloat(form.size)
    const sl = parseFloat(form.stop_loss)
    const tp = parseFloat(form.take_profit)
    if (entry && exit && size && form.status === 'closed') {
      const diff = form.direction === 'long' ? exit - entry : entry - exit
      const pnl = diff * size
      const pnl_pct = (diff / entry) * 100 * (form.direction === 'short' ? -1 : 1)
      setForm(f => ({ ...f, pnl: pnl.toFixed(2), pnl_pct: pnl_pct.toFixed(3) }))
    }
    if (entry && sl && tp) {
      const risk = Math.abs(entry - sl)
      const reward = Math.abs(tp - entry)
      if (risk > 0) setForm(f => ({ ...f, rr: (reward / risk).toFixed(2) }))
    }
  }, [form.entry_price, form.exit_price, form.size, form.direction, form.stop_loss, form.take_profit, form.status])

  const handleSave = () => {
    if (!form.pair) return toast.error('Selecciona un par')
    if (!form.entry_price) return toast.error('Ingresa precio de entrada')
    onSave({ ...form, updated_at: new Date().toISOString() })
    onClose()
    toast.success(isNew ? 'Trade registrado' : 'Trade actualizado')
  }

  const isMobile = false
  const inp = "w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-foreground bg-background"

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-bold">{isNew ? 'Registrar trade' : 'Editar trade'}</h2>
            {form.pair && <p className="text-[10px] text-muted-foreground">{form.pair} · {form.direction.toUpperCase()}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="px-4 py-1.5 bg-foreground text-background text-xs font-bold rounded-full hover:opacity-90">
              Guardar
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          {/* Core info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Par / Activo *</label>
              <input value={form.pair} onChange={e => set('pair', e.target.value)} list="pairs-list"
                placeholder="EUR/USD, BTC/USD, AAPL..." className={inp} />
              <datalist id="pairs-list">{PAIRS.map(p => <option key={p} value={p} />)}</datalist>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Dirección</label>
              <div className="grid grid-cols-2 gap-1.5">
                {['long','short'].map(d => (
                  <button key={d} onClick={() => set('direction', d)}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-1.5
                      ${form.direction === d ? d === 'long' ? 'bg-green-500 text-white border-green-500' : 'bg-red-500 text-white border-red-500' : 'border-border hover:border-foreground/30'}`}>
                    {d === 'long' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estado</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[['closed','Cerrado'],['open','Abierto'],['pending','Pendiente']].map(([v,l]) => (
                  <button key={v} onClick={() => set('status', v)}
                    className={`py-2.5 text-[10px] font-bold rounded-xl border transition-colors ${form.status === v ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground/30'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Precio Entrada *</label>
              <input type="number" step="any" value={form.entry_price} onChange={e => set('entry_price', e.target.value)}
                placeholder="1.08450" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {form.status === 'closed' ? 'Precio Salida' : 'Precio Actual'}
              </label>
              <input type="number" step="any" value={form.exit_price} onChange={e => set('exit_price', e.target.value)}
                placeholder="1.09120" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tamaño (lotes/unidades)</label>
              <input type="number" step="any" value={form.size} onChange={e => set('size', e.target.value)}
                placeholder="0.10" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Comisiones ($)</label>
              <input type="number" step="any" value={form.fees} onChange={e => set('fees', e.target.value)}
                placeholder="0.00" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stop Loss</label>
              <input type="number" step="any" value={form.stop_loss} onChange={e => set('stop_loss', e.target.value)}
                placeholder="1.08100" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Take Profit</label>
              <input type="number" step="any" value={form.take_profit} onChange={e => set('take_profit', e.target.value)}
                placeholder="1.09500" className={inp} />
            </div>
          </div>

          {/* Auto-calculated results */}
          {(form.pnl || form.rr) && (
            <div className="grid grid-cols-3 gap-2 bg-muted/20 rounded-xl p-3">
              {form.pnl && (
                <div className="text-center">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">P&L</p>
                  <p className={`text-sm font-bold ${parseFloat(form.pnl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {parseFloat(form.pnl) >= 0 ? '+' : ''}${parseFloat(form.pnl).toFixed(2)}
                  </p>
                </div>
              )}
              {form.pnl_pct && (
                <div className="text-center">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">%</p>
                  <p className={`text-sm font-bold ${parseFloat(form.pnl_pct) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {parseFloat(form.pnl_pct) >= 0 ? '+' : ''}{parseFloat(form.pnl_pct).toFixed(2)}%
                  </p>
                </div>
              )}
              {form.rr && (
                <div className="text-center">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">R:R</p>
                  <p className="text-sm font-bold">1:{form.rr}</p>
                </div>
              )}
            </div>
          )}

          {/* Context */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fecha</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hora</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)} className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estrategia</label>
              <select value={form.strategy} onChange={e => set('strategy', e.target.value)} className={inp}>
                <option value="">Seleccionar...</option>
                {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sesión</label>
              <select value={form.session} onChange={e => set('session', e.target.value)} className={inp}>
                <option value="">Seleccionar...</option>
                {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Timeframe</label>
              <select value={form.timeframe} onChange={e => set('timeframe', e.target.value)} className={inp}>
                {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estado emocional</label>
              <select value={form.emotion} onChange={e => set('emotion', e.target.value)} className={inp}>
                {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Notas / Análisis</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="¿Por qué entraste? ¿Qué viste en el gráfico? Lecciones aprendidas..."
              rows={3} className={`${inp} resize-none`} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Screenshot / URL del chart</label>
            <input value={form.screenshot} onChange={e => set('screenshot', e.target.value)}
              placeholder="https://..." className={inp} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tags (coma separados)</label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)}
              placeholder="confluencia, tendencia, gap..." className={inp} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Trade Row ──────────────────────────────────────────────────
function TradeRow({ trade, onEdit, onDelete }) {
  const [menu, setMenu] = useState(false)
  const pnl = parseFloat(trade.pnl) || 0
  const win = pnl > 0
  const open = trade.status === 'open'
  const pending = trade.status === 'pending'

  return (
    <div className="group flex items-center gap-3 px-5 py-3 border-b border-border/50 last:border-0 hover:bg-accent/20 transition-colors">
      {/* Status dot */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${open ? 'bg-blue-400 animate-pulse' : pending ? 'bg-yellow-400' : win ? 'bg-green-500' : 'bg-red-500'}`} />

      {/* Pair + direction */}
      <div className="w-28 shrink-0">
        <p className="text-sm font-bold">{trade.pair || '—'}</p>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${trade.direction === 'long' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {trade.direction?.toUpperCase()}
        </span>
      </div>

      {/* Entry / Exit */}
      <div className="flex-1 min-w-0 hidden sm:block">
        <p className="text-xs text-muted-foreground">
          {trade.entry_price} → {trade.exit_price || (open ? 'abierto' : '—')}
        </p>
        <p className="text-[10px] text-muted-foreground">{trade.strategy || ''} {trade.timeframe ? `· ${trade.timeframe}` : ''}</p>
      </div>

      {/* P&L */}
      <div className="w-24 text-right shrink-0">
        {trade.status === 'closed' ? (
          <>
            <p className={`text-sm font-bold ${win ? 'text-green-500' : 'text-red-500'}`}>
              {win ? '+' : ''}${Math.abs(pnl).toFixed(2)}
            </p>
            {trade.pnl_pct && <p className={`text-[10px] ${win ? 'text-green-500' : 'text-red-500'}`}>{fmtPct(parseFloat(trade.pnl_pct))}</p>}
          </>
        ) : (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${open ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-700'}`}>
            {open ? 'ABIERTO' : 'PENDIENTE'}
          </span>
        )}
      </div>

      {/* R:R */}
      <div className="w-12 text-center shrink-0 hidden md:block">
        {trade.rr ? <p className="text-xs font-mono font-bold">1:{trade.rr}</p> : <p className="text-xs text-muted-foreground">—</p>}
      </div>

      {/* Date */}
      <p className="text-[10px] text-muted-foreground w-16 text-right shrink-0 hidden lg:block">
        {trade.date ? new Date(trade.date + 'T00:00:00').toLocaleDateString('es-PE', { day:'2-digit', month:'short' }) : '—'}
      </p>

      {/* Menu */}
      <div className="relative shrink-0" onClick={e => { e.stopPropagation(); setMenu(m => !m) }}>
        <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-accent rounded-lg transition-all">
          <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
            <div className="absolute right-0 top-7 w-32 bg-popover border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden">
              <button onClick={() => { onEdit(); setMenu(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent"><Eye className="w-3.5 h-3.5" /> Ver / Editar</button>
              <button onClick={() => { onDelete(); setMenu(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Stats card ─────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, trend }) {
  return (
    <div className="bg-background border border-border rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        {Icon && <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${color || 'bg-muted/40'}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>}
      </div>
      <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
      {sub && <p className={`text-[11px] mt-1 ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>{sub}</p>}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────
export default function TradingPage() {
  const [trades, setTrades] = useState(() => load('ntx_algo_trades', []))
  const [accounts, setAccounts] = useState(() => load('ntx_algo_accounts', [
    { id: 'acc_1', name: 'Principal', balance: 10000, currency: 'USD', broker: 'MT4/MT5' }
  ]))
  const [activeTab, setActiveTab] = useState('journal')
  const [showNewTrade, setShowNewTrade] = useState(false)
  const [editTrade, setEditTrade] = useState(null)
  const [search, setSearch] = useState('')
  const [filterDir, setFilterDir] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPair, setFilterPair] = useState('all')

  useEffect(() => { save('ntx_algo_trades', trades) }, [trades])
  useEffect(() => { save('ntx_algo_accounts', accounts) }, [accounts])

  const saveTrade = (t) => {
    setTrades(prev => {
      const exists = prev.find(x => x.id === t.id)
      return exists ? prev.map(x => x.id === t.id ? t : x) : [t, ...prev]
    })
  }
  const deleteTrade = (id) => { setTrades(p => p.filter(t => t.id !== id)); toast.success('Trade eliminado') }

  // Stats
  const closed = trades.filter(t => t.status === 'closed')
  const open = trades.filter(t => t.status === 'open')
  const wins = closed.filter(t => parseFloat(t.pnl) > 0)
  const losses = closed.filter(t => parseFloat(t.pnl) <= 0)
  const totalPnL = closed.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0
  const avgWin = wins.length ? wins.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0) / wins.length : 0
  const avgLoss = losses.length ? losses.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0) / losses.length : 0
  const profitFactor = Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : 0
  const avgRR = closed.filter(t => t.rr).length ? closed.filter(t => t.rr).reduce((s, t) => s + parseFloat(t.rr), 0) / closed.filter(t => t.rr).length : 0

  // Equity curve (running P&L)
  const equityCurve = (() => {
    let running = 0
    return [...closed].reverse().map(t => { running += parseFloat(t.pnl) || 0; return running })
  })()

  // P&L by pair (top 5)
  const pnlByPair = (() => {
    const map = {}
    closed.forEach(t => {
      if (!t.pair) return
      map[t.pair] = (map[t.pair] || 0) + (parseFloat(t.pnl) || 0)
    })
    return Object.entries(map).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 6)
  })()

  // P&L by strategy
  const pnlByStrat = (() => {
    const map = {}
    closed.forEach(t => {
      if (!t.strategy) return
      map[t.strategy] = (map[t.strategy] || 0) + (parseFloat(t.pnl) || 0)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
  })()

  // Filtered trades
  const uniquePairs = [...new Set(trades.map(t => t.pair).filter(Boolean))]
  const filteredTrades = trades.filter(t => {
    const matchSearch = !search || t.pair?.toLowerCase().includes(search.toLowerCase()) || t.strategy?.toLowerCase().includes(search.toLowerCase()) || t.notes?.toLowerCase().includes(search.toLowerCase())
    const matchDir = filterDir === 'all' || t.direction === filterDir
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    const matchPair = filterPair === 'all' || t.pair === filterPair
    return matchSearch && matchDir && matchStatus && matchPair
  })

  const exportCSV = () => {
    const header = ['Fecha','Par','Dirección','Entrada','Salida','Tamaño','P&L','%','R:R','Estrategia','Sesión','TF','Notas']
    const rows = trades.map(t => [t.date, t.pair, t.direction, t.entry_price, t.exit_price, t.size, t.pnl, t.pnl_pct, t.rr, t.strategy, t.session, t.timeframe, (t.notes||'').replace(/,/g,' ')])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'trading-journal.csv'; a.click()
    toast.success('CSV exportado')
  }

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'journal',   label: 'Journal',   icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'accounts',  label: 'Cuentas',   icon: DollarSign },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-widest">AlgoLowyx</p>
            <p className="text-[10px] text-muted-foreground">Trading Journal & Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-full hover:bg-accent transition-colors">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={() => setShowNewTrade(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-foreground text-background rounded-full hover:opacity-90 transition-opacity">
            <Plus className="w-3.5 h-3.5" /> Nuevo trade
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-background shrink-0 px-4">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${activeTab === t.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <div className="h-full overflow-y-auto p-5 space-y-5">
            {/* KPI grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
              <StatCard label="P&L Total" value={`${totalPnL >= 0 ? '+' : ''}$${Math.abs(totalPnL).toFixed(2)}`} color={totalPnL >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'} icon={totalPnL >= 0 ? TrendingUp : TrendingDown} trend={totalPnL >= 0 ? 'up' : 'down'} />
              <StatCard label="Win Rate" value={`${winRate.toFixed(1)}%`} icon={Target} color="bg-blue-100 text-blue-600" sub={`${wins.length}W / ${losses.length}L`} />
              <StatCard label="Trades" value={trades.length} icon={BookOpen} color="bg-purple-100 text-purple-600" sub={`${open.length} abierto${open.length !== 1 ? 's' : ''}`} />
              <StatCard label="Profit Factor" value={profitFactor.toFixed(2)} icon={BarChart3} color="bg-amber-100 text-amber-600" sub={profitFactor >= 1.5 ? '✓ Sólido' : profitFactor >= 1 ? 'Positivo' : '⚠ Negativo'} trend={profitFactor >= 1.5 ? 'up' : profitFactor >= 1 ? undefined : 'down'} />
              <StatCard label="Avg R:R" value={avgRR ? `1:${avgRR.toFixed(2)}` : '—'} icon={Activity} color="bg-cyan-100 text-cyan-600" />
              <StatCard label="Avg Ganancia" value={`$${Math.abs(avgWin).toFixed(2)}`} icon={ArrowUpRight} color="bg-green-100 text-green-600" sub={`Avg pérd: $${Math.abs(avgLoss).toFixed(2)}`} />
            </div>

            {/* Equity curve + Open positions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Equity curve */}
              <div className="lg:col-span-2 bg-background border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest">Curva de Equity</p>
                  <Badge value={totalPnL} />
                </div>
                {equityCurve.length > 1 ? (
                  <div className="overflow-hidden">
                    <Sparkline values={equityCurve} color={totalPnL >= 0 ? '#22c55e' : '#ef4444'} height={80} />
                  </div>
                ) : (
                  <div className="h-20 flex items-center justify-center text-muted-foreground text-xs">
                    Registra más trades para ver la curva
                  </div>
                )}
              </div>

              {/* Open positions */}
              <div className="bg-background border border-border rounded-2xl p-5">
                <p className="text-xs font-bold uppercase tracking-widest mb-3">Posiciones abiertas</p>
                {open.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Circle className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-xs">Sin posiciones abiertas</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {open.map(t => (
                      <div key={t.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold">{t.pair}</p>
                          <span className={`text-[9px] font-bold ${t.direction === 'long' ? 'text-green-600' : 'text-red-500'}`}>{t.direction?.toUpperCase()}</span>
                        </div>
                        <p className="text-xs font-mono">{t.entry_price}</p>
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* P&L by pair + by strategy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background border border-border rounded-2xl p-5">
                <p className="text-xs font-bold uppercase tracking-widest mb-4">P&L por Par</p>
                {pnlByPair.length === 0 ? <p className="text-xs text-muted-foreground text-center py-6">Sin datos</p> : (
                  <div className="space-y-2.5">
                    {pnlByPair.map(([pair, pnl]) => {
                      const max = Math.max(...pnlByPair.map(([,v]) => Math.abs(v)))
                      const pct = (Math.abs(pnl) / max) * 100
                      return (
                        <div key={pair}>
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-xs font-bold">{pair}</p>
                            <p className={`text-xs font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</p>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="bg-background border border-border rounded-2xl p-5">
                <p className="text-xs font-bold uppercase tracking-widest mb-4">P&L por Estrategia</p>
                {pnlByStrat.length === 0 ? <p className="text-xs text-muted-foreground text-center py-6">Sin datos</p> : (
                  <div className="space-y-2.5">
                    {pnlByStrat.map(([strat, pnl]) => {
                      const max = Math.max(...pnlByStrat.map(([,v]) => Math.abs(v)))
                      const pct = (Math.abs(pnl) / max) * 100
                      return (
                        <div key={strat}>
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-xs font-medium truncate">{strat}</p>
                            <p className={`text-xs font-bold shrink-0 ml-2 ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</p>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent trades */}
            <div className="bg-background border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <p className="text-xs font-bold uppercase tracking-widest">Últimos trades</p>
                <button onClick={() => setActiveTab('journal')} className="text-xs text-muted-foreground hover:text-foreground">Ver todos →</button>
              </div>
              {trades.slice(0, 8).map(t => (
                <TradeRow key={t.id} trade={t} onEdit={() => setEditTrade(t)} onDelete={() => deleteTrade(t.id)} />
              ))}
              {trades.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <BookOpen className="w-10 h-10 opacity-20 mx-auto mb-2" />
                  <p className="text-sm font-bold">Sin trades registrados</p>
                  <p className="text-xs mt-1 opacity-60">Empieza registrando tu primer trade</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── JOURNAL ── */}
        {activeTab === 'journal' && (
          <div className="flex flex-col h-full">
            {/* Filters */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-background shrink-0 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar par, estrategia..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-muted/30 border border-border rounded-xl outline-none focus:border-foreground w-44" />
              </div>
              <select value={filterDir} onChange={e => setFilterDir(e.target.value)} className="border border-border rounded-xl px-2.5 py-1.5 text-xs bg-background outline-none">
                <option value="all">Long + Short</option>
                <option value="long">Solo Long</option>
                <option value="short">Solo Short</option>
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-border rounded-xl px-2.5 py-1.5 text-xs bg-background outline-none">
                <option value="all">Todos</option>
                <option value="closed">Cerrados</option>
                <option value="open">Abiertos</option>
                <option value="pending">Pendientes</option>
              </select>
              <select value={filterPair} onChange={e => setFilterPair(e.target.value)} className="border border-border rounded-xl px-2.5 py-1.5 text-xs bg-background outline-none">
                <option value="all">Todos los pares</option>
                {uniquePairs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <p className="text-[10px] text-muted-foreground ml-auto">{filteredTrades.length} trades</p>
            </div>

            {/* Trades list */}
            <div className="flex-1 overflow-y-auto">
              {filteredTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <BookOpen className="w-14 h-14 opacity-20 mb-4" />
                  <p className="text-sm font-bold">
                    {search || filterDir !== 'all' || filterStatus !== 'all' || filterPair !== 'all' ? 'Sin resultados' : 'Journal vacío'}
                  </p>
                  <p className="text-xs mt-1 opacity-60">
                    {search ? 'Prueba con otros filtros' : 'Registra tu primer trade'}
                  </p>
                  {!search && (
                    <button onClick={() => setShowNewTrade(true)} className="mt-4 px-4 py-2 bg-foreground text-background text-xs font-bold rounded-full hover:opacity-90">
                      <Plus className="w-3.5 h-3.5 inline mr-1.5" /> Nuevo trade
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  {/* Header */}
                  <div className="flex items-center gap-3 px-5 py-2 bg-muted/20 border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="w-2 shrink-0" />
                    <div className="w-28 shrink-0">Par</div>
                    <div className="flex-1 hidden sm:block">Entrada → Salida</div>
                    <div className="w-24 text-right shrink-0">P&L</div>
                    <div className="w-12 text-center hidden md:block shrink-0">R:R</div>
                    <div className="w-16 text-right hidden lg:block shrink-0">Fecha</div>
                    <div className="w-8 shrink-0" />
                  </div>
                  {filteredTrades.map(t => (
                    <TradeRow key={t.id} trade={t} onEdit={() => setEditTrade(t)} onDelete={() => deleteTrade(t.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {activeTab === 'analytics' && (
          <div className="h-full overflow-y-auto p-5 space-y-5">
            {/* Metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total trades', v: trades.length },
                { label: 'Trades cerrados', v: closed.length },
                { label: 'Ganadores', v: wins.length },
                { label: 'Perdedores', v: losses.length },
                { label: 'Win rate', v: `${winRate.toFixed(1)}%` },
                { label: 'Profit factor', v: profitFactor.toFixed(2) },
                { label: 'P&L bruto', v: `$${totalPnL.toFixed(2)}` },
                { label: 'Avg ganancia', v: `$${avgWin.toFixed(2)}` },
                { label: 'Avg pérdida', v: `-$${Math.abs(avgLoss).toFixed(2)}` },
                { label: 'Avg R:R', v: avgRR ? `1:${avgRR.toFixed(2)}` : '—' },
                { label: 'Mejor trade', v: closed.length ? `+$${Math.max(...closed.map(t => parseFloat(t.pnl)||0)).toFixed(2)}` : '—' },
                { label: 'Peor trade', v: closed.length ? `-$${Math.abs(Math.min(...closed.map(t => parseFloat(t.pnl)||0))).toFixed(2)}` : '—' },
              ].map(s => (
                <div key={s.label} className="bg-background border border-border rounded-xl p-4">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-lg font-bold tabular-nums">{s.v}</p>
                </div>
              ))}
            </div>

            {/* P&L breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background border border-border rounded-2xl p-5">
                <p className="text-xs font-bold uppercase tracking-widest mb-4">Performance por Par</p>
                {pnlByPair.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">Sin datos</p> : (
                  <div className="space-y-3">
                    {pnlByPair.map(([pair, pnl]) => {
                      const tradesForPair = closed.filter(t => t.pair === pair)
                      const winRate = tradesForPair.length ? (tradesForPair.filter(t => parseFloat(t.pnl) > 0).length / tradesForPair.length * 100) : 0
                      return (
                        <div key={pair} className="flex items-center gap-3">
                          <p className="text-xs font-bold w-20 shrink-0">{pair}</p>
                          <div className="flex-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                              <span>{tradesForPair.length} trades · WR {winRate.toFixed(0)}%</span>
                              <span className={pnl >= 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${winRate}%` }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="bg-background border border-border rounded-2xl p-5">
                <p className="text-xs font-bold uppercase tracking-widest mb-4">Distribution Long vs Short</p>
                <div className="space-y-4">
                  {['long','short'].map(dir => {
                    const dirTrades = closed.filter(t => t.direction === dir)
                    const dirWins = dirTrades.filter(t => parseFloat(t.pnl) > 0)
                    const dirPnL = dirTrades.reduce((s,t) => s + (parseFloat(t.pnl)||0), 0)
                    const dirWR = dirTrades.length ? (dirWins.length / dirTrades.length * 100) : 0
                    return (
                      <div key={dir} className={`border rounded-xl p-4 ${dir === 'long' ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {dir === 'long' ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                            <p className="text-sm font-bold capitalize">{dir}</p>
                          </div>
                          <p className={`text-sm font-bold ${dirPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>{dirPnL >= 0 ? '+' : ''}${dirPnL.toFixed(2)}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div><p className="text-[9px] text-muted-foreground">TRADES</p><p className="text-sm font-bold">{dirTrades.length}</p></div>
                          <div><p className="text-[9px] text-muted-foreground">WIN RATE</p><p className="text-sm font-bold">{dirWR.toFixed(0)}%</p></div>
                          <div><p className="text-[9px] text-muted-foreground">GANADORES</p><p className="text-sm font-bold">{dirWins.length}</p></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Notes / Tips */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-5">
              <p className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-2">💡 Reglas del sistema</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground">
                <p>✓ Profit factor &gt; 1.5 = sistema rentable</p>
                <p>✓ Win rate &gt; 50% con R:R &gt; 1:1 = consistente</p>
                <p>✓ Registrar emociones ayuda a detectar revenge trades</p>
              </div>
            </div>
          </div>
        )}

        {/* ── ACCOUNTS ── */}
        {activeTab === 'accounts' && (
          <div className="h-full overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cuentas de trading</p>
              <button onClick={() => {
                const name = prompt('Nombre de la cuenta:')
                if (!name) return
                const broker = prompt('Broker / Plataforma:') || 'MT5'
                const balance = parseFloat(prompt('Balance inicial ($):') || '0') || 0
                setAccounts(prev => [...prev, { id: `acc_${Date.now()}`, name, broker, balance, currency: 'USD' }])
                toast.success('Cuenta creada')
              }} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-foreground text-background rounded-full hover:opacity-90">
                <Plus className="w-3.5 h-3.5" /> Nueva cuenta
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {accounts.map(acc => {
                const accTrades = closed.filter(t => t.account === acc.name)
                const accPnL = accTrades.reduce((s,t) => s + (parseFloat(t.pnl)||0), 0)
                return (
                  <div key={acc.id} className="bg-background border border-border rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm font-bold">{acc.name}</p>
                        <p className="text-[10px] text-muted-foreground">{acc.broker}</p>
                      </div>
                      <button onClick={() => { setAccounts(p => p.filter(a => a.id !== acc.id)); toast.success('Cuenta eliminada') }}
                        className="p-1 hover:text-red-500 text-muted-foreground">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Balance inicial</span>
                        <span className="text-xs font-bold">${acc.balance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">P&L registrado</span>
                        <span className={`text-xs font-bold ${accPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>{accPnL >= 0 ? '+' : ''}${accPnL.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Balance estimado</span>
                        <span className="text-xs font-bold">${(acc.balance + accPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Trades</span>
                        <span className="text-xs font-bold">{accTrades.length}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Risk calculator */}
            <div className="bg-background border border-border rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest mb-4">Calculadora de riesgo</p>
              <RiskCalc accounts={accounts} />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewTrade && <TradeModal onSave={saveTrade} onClose={() => setShowNewTrade(false)} />}
      {editTrade && <TradeModal trade={editTrade} onSave={saveTrade} onClose={() => setEditTrade(null)} />}
    </div>
  )
}

// ── Risk Calculator ────────────────────────────────────────────
function RiskCalc({ accounts }) {
  const [balance, setBalance] = useState(accounts[0]?.balance || 10000)
  const [riskPct, setRiskPct] = useState(1)
  const [entryPrice, setEntryPrice] = useState('')
  const [slPrice, setSlPrice] = useState('')
  const [pipValue, setPipValue] = useState(10) // USD per pip (standard lot)

  const riskAmount = balance * (riskPct / 100)
  const slPips = entryPrice && slPrice ? Math.abs(parseFloat(entryPrice) - parseFloat(slPrice)) * 10000 : null
  const lotSize = slPips && pipValue ? (riskAmount / (slPips * pipValue)).toFixed(2) : null

  const inp = "border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-foreground bg-background"

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Balance ($)</label>
        <input type="number" value={balance} onChange={e => setBalance(parseFloat(e.target.value)||0)} className={inp} />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Riesgo %</label>
        <input type="number" step="0.1" min="0.1" max="10" value={riskPct} onChange={e => setRiskPct(parseFloat(e.target.value)||1)} className={inp} />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Entrada</label>
        <input type="number" step="any" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} placeholder="1.08450" className={inp} />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stop Loss</label>
        <input type="number" step="any" value={slPrice} onChange={e => setSlPrice(e.target.value)} placeholder="1.08100" className={inp} />
      </div>
      {riskAmount > 0 && (
        <div className="col-span-2 md:col-span-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Riesgo $</p>
              <p className="text-xl font-bold text-red-500">${riskAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Pips de riesgo</p>
              <p className="text-xl font-bold">{slPips ? slPips.toFixed(1) : '—'}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Tamaño sugerido</p>
              <p className="text-xl font-bold text-purple-600">{lotSize || '—'} lots</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
