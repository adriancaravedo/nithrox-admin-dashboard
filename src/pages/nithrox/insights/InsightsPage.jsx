import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../../stores/useStore'
import Topbar from '../../../components/layout/Topbar'
import {
  Heart, TrendingUp, TrendingDown, DollarSign, Repeat,
  BookOpen, Users, Zap, AlertTriangle, CheckCircle2,
  Plus, X, ChevronRight, Star, Clock, ArrowRight,
  BarChart2, Pencil, Trash2, Check
} from 'lucide-react'
import { toast } from 'sonner'

// ── Helpers ──────────────────────────────────────────────────
function ScoreRing({ score, size = 80, strokeWidth = 8 }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 1000) * circ
  const color = score >= 700 ? '#10b981' : score >= 400 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e4e4e7" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-base font-bold tabular-nums" style={{ color }}>{score}</p>
        <p className="text-[9px] text-muted-foreground font-bold uppercase">/ 1000</p>
      </div>
    </div>
  )
}

function calcHealthScore(company, projects, messages, contracts) {
  let score = 500
  const cProjects = projects.filter(p => p.company_id === company.id && !p._deleted)
  const cMessages = messages.filter(m => m.company_id === company.id)
  const cContracts = contracts.filter(c => c.company === company.name)

  // Payment behavior (+/-)
  const allPhases = cProjects.flatMap(p => Object.values(p.phases || {}))
  const paidPhases = allPhases.filter(ph => ph.paid)
  if (allPhases.length > 0) score += (paidPhases.length / allPhases.length) * 200

  // Active projects
  if (cProjects.length > 0) score += 100
  if (cProjects.some(p => p.phase === 'publication')) score += 50

  // Communication
  if (cMessages.length > 0) score += 80
  const lastMsg = cMessages[cMessages.length - 1]
  if (lastMsg) {
    const daysSince = (Date.now() - new Date(lastMsg.last_at)) / (1000 * 60 * 60 * 24)
    if (daysSince < 7) score += 50
    else if (daysSince > 30) score -= 100
  }

  // Has signed contract
  if (cContracts.some(c => c.status === 'both_signed')) score += 70

  return Math.max(0, Math.min(1000, Math.round(score)))
}

// ── Views ─────────────────────────────────────────────────────
function HealthScoreView() {
  const { companies, projects, messages } = useStore()
  const navigate = useNavigate()
  const DEMO_CONTRACTS = [
    { company: 'Fashion Co.', status: 'both_signed' },
    { company: 'TechPe', status: 'client_signed' },
    { company: 'Cevichería Mar', status: 'both_signed' },
  ]

  const scored = companies.map(c => ({
    ...c,
    score: calcHealthScore(c, projects, messages, DEMO_CONTRACTS),
    projectCount: projects.filter(p => p.company_id === c.id && !p._deleted).length,
  })).sort((a, b) => b.score - a.score)

  const getLabel = (score) => {
    if (score >= 800) return { l: 'EXCELENTE', c: 'text-green-600 bg-green-50' }
    if (score >= 600) return { l: 'BUENO', c: 'text-blue-600 bg-blue-50' }
    if (score >= 400) return { l: 'REGULAR', c: 'text-amber-600 bg-amber-50' }
    return { l: 'EN RIESGO', c: 'text-red-600 bg-red-50' }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { l: 'Excelente (800+)', v: scored.filter(c => c.score >= 800).length, c: 'text-green-600' },
          { l: 'Bueno (600+)', v: scored.filter(c => c.score >= 600 && c.score < 800).length, c: 'text-blue-600' },
          { l: 'Regular (400+)', v: scored.filter(c => c.score >= 400 && c.score < 600).length, c: 'text-amber-600' },
          { l: 'En riesgo (<400)', v: scored.filter(c => c.score < 400).length, c: 'text-red-600' },
        ].map(s => (
          <div key={s.l} className="bg-background border border-border rounded-xl p-4">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.l}</p>
            <p className={`text-3xl font-bold mt-1 ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="bg-background border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">SALUD DE CLIENTES</p>
        </div>
        {scored.map(c => {
          const { l, col } = { l: getLabel(c.score).l, col: getLabel(c.score).c }
          return (
            <div key={c.id} className="flex items-center gap-5 px-5 py-4 border-b border-border/50 hover:bg-accent/30 cursor-pointer transition-colors last:border-0"
              onClick={() => navigate(`/clients/companies/${c.id}`)}>
              <ScoreRing score={c.score} size={60} strokeWidth={6} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold">{c.name}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getLabel(c.score).c}`}>{l}</span>
                </div>
                <p className="text-xs text-muted-foreground">{c.industry || 'Sin industria'} · {c.projectCount} proyecto{c.projectCount !== 1 ? 's' : ''}</p>
                {/* Score factors */}
                <div className="flex gap-3 mt-2">
                  {[
                    { l: 'Pagos', v: c.score > 600 },
                    { l: 'Comunicación', v: c.score > 400 },
                    { l: 'Proyectos activos', v: c.projectCount > 0 },
                    { l: 'Contrato firmado', v: c.score > 700 },
                  ].map(f => (
                    <div key={f.l} className="flex items-center gap-1">
                      {f.v ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <AlertTriangle className="w-3 h-3 text-amber-500" />}
                      <span className="text-[10px] text-muted-foreground">{f.l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProfitabilityView() {
  const { projects } = useStore()
  const active = projects.filter(p => !p._deleted)

  const calcProfit = (p) => {
    const revenue = Object.values(p.phases || {}).reduce((s, ph) => s + (ph.paid_amount || 0), 0)
    const hours = Math.floor(Math.random() * 80 + 40)
    const rate = 25
    const cost = hours * rate
    const profit = revenue - cost
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0
    return { revenue, cost, profit, margin, hours }
  }

  const profitData = active.map(p => ({ ...p, ...calcProfit(p) })).sort((a, b) => b.margin - a.margin)
  const totalRevenue = profitData.reduce((s, p) => s + p.revenue, 0)
  const totalProfit = profitData.reduce((s, p) => s + p.profit, 0)
  const avgMargin = profitData.length ? Math.round(totalProfit / totalRevenue * 100) : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'INGRESOS COBRADOS', v: `$${totalRevenue.toLocaleString()}`, c: 'text-foreground' },
          { l: 'UTILIDAD ESTIMADA', v: `$${totalProfit.toLocaleString()}`, c: totalProfit > 0 ? 'text-green-600' : 'text-red-600' },
          { l: 'MARGEN PROMEDIO', v: `${avgMargin}%`, c: avgMargin > 40 ? 'text-green-600' : avgMargin > 20 ? 'text-amber-600' : 'text-red-600' },
        ].map(s => (
          <div key={s.l} className="bg-background border border-border rounded-xl p-4">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.l}</p>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="bg-background border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">RENTABILIDAD POR PROYECTO</p>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border">
            {['PROYECTO','COBRADO','COSTO EST.','UTILIDAD','MARGEN','HORAS'].map(h=><th key={h} className="text-left px-5 py-2.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {profitData.map(p => (
              <tr key={p.id} className="hover:bg-accent/30 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="font-bold">{p.name}</p>
                  <p className="text-muted-foreground text-[10px]">{p.company}</p>
                </td>
                <td className="px-5 py-3.5 font-bold tabular-nums">${p.revenue.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-muted-foreground tabular-nums">${p.cost.toLocaleString()}</td>
                <td className={`px-5 py-3.5 font-bold tabular-nums ${p.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>${p.profit.toLocaleString()}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${p.margin > 40 ? 'bg-green-500' : p.margin > 20 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.abs(p.margin)}%` }} />
                    </div>
                    <span className={`font-bold ${p.margin > 40 ? 'text-green-600' : p.margin > 20 ? 'text-amber-600' : 'text-red-600'}`}>{p.margin}%</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground tabular-nums">{p.hours}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RecurringView() {
  const [clients, setClients] = useState([
    { id: 'r1', company: 'Fashion Co.', service: 'Mantenimiento web', amount: 350, currency: 'USD', frequency: 'monthly', next_billing: '2026-05-01', status: 'active', months_active: 8 },
    { id: 'r2', company: 'TechPe', service: 'Hosting + soporte', amount: 180, currency: 'USD', frequency: 'monthly', next_billing: '2026-05-05', status: 'active', months_active: 5 },
    { id: 'r3', company: 'Cevichería Mar', service: 'Community Manager', amount: 420, currency: 'USD', frequency: 'monthly', next_billing: '2026-05-10', status: 'active', months_active: 3 },
    { id: 'r4', company: 'Casas del Sur', service: 'SEO mensual', amount: 600, currency: 'USD', frequency: 'monthly', next_billing: '2026-04-30', status: 'at_risk', months_active: 12 },
  ])
  const [showNew, setShowNew] = useState(false)
  const [nf, setNf] = useState({ company:'', service:'', amount:'', currency:'USD', next_billing:'' })

  const totalMRR = clients.filter(c => c.status === 'active').reduce((s, c) => s + c.amount, 0)
  const totalARR = totalMRR * 12

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'MRR (Ingreso mensual recurrente)', v: `$${totalMRR.toLocaleString()}` },
          { l: 'ARR (Proyección anual)', v: `$${totalARR.toLocaleString()}` },
          { l: 'Clientes recurrentes', v: clients.filter(c => c.status === 'active').length },
        ].map(s => (
          <div key={s.l} className="bg-background border border-border rounded-xl p-4">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-tight mb-1">{s.l}</p>
            <p className="text-2xl font-bold tabular-nums">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" /> Agregar recurrente
        </button>
      </div>

      {showNew && (
        <div className="bg-background border border-border rounded-xl p-5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest">Nuevo ingreso recurrente</p>
          <div className="grid grid-cols-2 gap-3">
            {[{k:'company',l:'Cliente',pl:'Nombre empresa'},{k:'service',l:'Servicio',pl:'Mantenimiento web...'},{k:'amount',l:'Monto mensual',pl:'0'},{k:'next_billing',l:'Próxima facturación',type:'date'}].map(f=>(
              <div key={f.k} className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{f.l}</label>
                <input type={f.type||'text'} value={nf[f.k]||''} onChange={e=>setNf(p=>({...p,[f.k]:e.target.value}))} placeholder={f.pl}
                  className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-background outline-none focus:border-primary"/>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={()=>setShowNew(false)} className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent">Cancelar</button>
            <button onClick={()=>{setClients(p=>[...p,{id:`r${Date.now()}`,...nf,amount:parseFloat(nf.amount)||0,currency:'USD',frequency:'monthly',status:'active',months_active:0}]);setShowNew(false);toast.success('Ingreso recurrente agregado')}} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg font-bold">Agregar</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {clients.map(c => {
          const daysUntil = Math.ceil((new Date(c.next_billing) - new Date()) / (1000*60*60*24))
          return (
            <div key={c.id} className={`bg-background border rounded-xl p-4 flex items-center gap-4 ${c.status==='at_risk'?'border-amber-200':'border-border'}`}>
              <div className={`w-1.5 self-stretch rounded-full shrink-0 ${c.status==='active'?'bg-green-500':'bg-amber-500'}`}/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold">{c.company}</p>
                  {c.status==='at_risk'&&<span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase">⚠ En riesgo</span>}
                </div>
                <p className="text-xs text-muted-foreground">{c.service} · {c.months_active} mes{c.months_active!==1?'es':''} activo</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold tabular-nums">${c.amount}<span className="text-xs text-muted-foreground">/mo</span></p>
                <p className={`text-[10px] font-bold ${daysUntil<=3?'text-red-600':daysUntil<=7?'text-amber-600':'text-muted-foreground'}`}>
                  Facturar en {daysUntil}d
                </p>
              </div>
              <button onClick={()=>setClients(p=>p.filter(x=>x.id!==c.id))} className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-accent">
                <Trash2 className="w-4 h-4"/>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WikiView() {
  const [articles, setArticles] = useState([
    { id: 'w1', title: 'Proceso de onboarding de clientes', category: 'Procesos', content: 'Paso 1: Firma del contrato...\nPaso 2: Pago del kick-off...\nPaso 3: Reunión de briefing...', updated: '2026-04-20', author: 'Adrian' },
    { id: 'w2', title: 'Stack tecnológico Nithrox', category: 'Técnico', content: 'Frontend: React + Tailwind\nBackend: Node.js + Supabase\nDeploy: VPS Hostinger + Nginx...', updated: '2026-04-15', author: 'Adrian' },
    { id: 'w3', title: 'Política de revisiones y cambios', category: 'Procesos', content: 'Cada proyecto incluye 2 rondas de revisiones sin costo...', updated: '2026-04-10', author: 'Adrian' },
    { id: 'w4', title: 'Tarifas y precios 2026', category: 'Negocio', content: 'Landing page: $800 - $2,000\nSitio corporativo: $1,500 - $5,000...', updated: '2026-04-01', author: 'Adrian' },
    { id: 'w5', title: 'Credenciales y accesos del equipo', category: 'Interno', content: 'Anthropic API: ver 1Password\nFigma: admin@nithrox.com...', updated: '2026-03-20', author: 'Adrian' },
  ])
  const [editing, setEditing] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [nw, setNw] = useState({ title:'', category:'Procesos', content:'' })
  const [selectedArticle, setSelectedArticle] = useState(null)

  const CATEGORIES = ['Procesos','Técnico','Negocio','Interno','Clientes']

  return (
    <div className="flex gap-4 h-full">
      {/* Article list */}
      <div className="w-64 shrink-0 space-y-2">
        <button onClick={()=>setShowNew(true)} className="w-full flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5"/> Nuevo artículo
        </button>
        {CATEGORIES.map(cat=>{
          const catArticles = articles.filter(a=>a.category===cat)
          if(catArticles.length===0) return null
          return (
            <div key={cat}>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1">{cat}</p>
              {catArticles.map(a=>(
                <button key={a.id} onClick={()=>{setSelectedArticle(a);setEditing(null)}}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all mb-0.5 ${selectedArticle?.id===a.id?'bg-foreground text-background':'hover:bg-accent/50'}`}>
                  <p className="text-xs font-medium truncate">{a.title}</p>
                  <p className={`text-[10px] mt-0.5 ${selectedArticle?.id===a.id?'text-background/60':'text-muted-foreground'}`}>{a.updated}</p>
                </button>
              ))}
            </div>
          )
        })}
      </div>

      {/* Article content */}
      <div className="flex-1 bg-background border border-border rounded-xl overflow-hidden">
        {showNew ? (
          <div className="p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest">Nuevo artículo</p>
            <input value={nw.title} onChange={e=>setNw(p=>({...p,title:e.target.value}))} placeholder="Título del artículo..." className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-background font-bold"/>
            <select value={nw.category} onChange={e=>setNw(p=>({...p,category:e.target.value}))} className="border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary">
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
            <textarea value={nw.content} onChange={e=>setNw(p=>({...p,content:e.target.value}))} placeholder="Contenido del artículo..." rows={10} className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-background resize-none font-mono"/>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setShowNew(false)} className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-accent">Cancelar</button>
              <button onClick={()=>{setArticles(p=>[...p,{id:`w${Date.now()}`,...nw,updated:new Date().toLocaleDateString('es-PE'),author:'Adrian'}]);setShowNew(false);toast.success('Artículo creado')}} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl font-bold">Guardar</button>
            </div>
          </div>
        ) : selectedArticle ? (
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{selectedArticle.category}</span>
                <h2 className="text-lg font-bold mt-0.5">{selectedArticle.title}</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">Actualizado {selectedArticle.updated} · por {selectedArticle.author}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setEditing(selectedArticle)} className="p-1.5 border border-border rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5"/></button>
                <button onClick={()=>{setArticles(p=>p.filter(a=>a.id!==selectedArticle.id));setSelectedArticle(null);toast.success('Artículo eliminado')}} className="p-1.5 border border-border rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            </div>
            {editing?.id===selectedArticle.id ? (
              <div className="space-y-3">
                <input value={editing.title} onChange={e=>setEditing(p=>({...p,title:e.target.value}))} className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary font-bold"/>
                <textarea value={editing.content} onChange={e=>setEditing(p=>({...p,content:e.target.value}))} rows={12} className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary font-mono resize-none"/>
                <div className="flex gap-2 justify-end">
                  <button onClick={()=>setEditing(null)} className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-accent">Cancelar</button>
                  <button onClick={()=>{setArticles(p=>p.map(a=>a.id===editing.id?{...editing,updated:new Date().toLocaleDateString('es-PE')}:a));setSelectedArticle(editing);setEditing(null);toast.success('Guardado')}} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl font-bold">Guardar</button>
                </div>
              </div>
            ) : (
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{selectedArticle.content}</pre>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20"/>
              <p className="text-sm font-bold uppercase tracking-widest">Selecciona un artículo</p>
              <p className="text-xs mt-1">o crea uno nuevo</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function OnboardingView() {
  const { companies } = useStore()
  const STEPS = [
    { id: 1, title: 'Contrato firmado', desc: 'El cliente firma el contrato digitalmente', icon: '📝', auto: false },
    { id: 2, title: 'Pago kick-off recibido', desc: 'Se confirma el 10% inicial', icon: '💳', auto: false },
    { id: 3, title: 'Formulario de briefing enviado', desc: 'El cliente recibe y completa el formulario', icon: '📋', auto: true },
    { id: 4, title: 'Reunión de kick-off agendada', desc: 'Se agenda la primera reunión', icon: '📅', auto: false },
    { id: 5, title: 'Accesos al proyecto compartidos', desc: 'El cliente accede a su portal', icon: '🔑', auto: true },
    { id: 6, title: 'Proyecto creado en el admin', desc: 'Se crea en Proyectos del dashboard', icon: '📁', auto: false },
    { id: 7, title: 'Presentación del equipo', desc: 'Email presentando al equipo de trabajo', icon: '👥', auto: true },
  ]

  const [activeFlows, setActiveFlows] = useState([
    { id: 'f1', company: 'Cevichería Mar', started: '2026-04-14', steps_done: [1, 2, 3] },
    { id: 'f2', company: 'Startup XYZ', started: '2026-04-16', steps_done: [1] },
  ])

  return (
    <div className="space-y-5">
      {/* Template */}
      <div className="bg-background border border-border rounded-xl p-5">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">FLUJO DE ONBOARDING ESTÁNDAR</p>
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-base">{step.icon}</div>
                {i < STEPS.length - 1 && <div className="w-px h-6 bg-border mt-1" />}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">{step.title}</p>
                  {step.auto && <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">⚡ Auto</span>}
                </div>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active flows */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">ONBOARDINGS ACTIVOS</p>
        <div className="space-y-3">
          {activeFlows.map(flow => {
            const pct = Math.round((flow.steps_done.length / STEPS.length) * 100)
            return (
              <div key={flow.id} className="bg-background border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold">{flow.company}</p>
                    <p className="text-[10px] text-muted-foreground">Iniciado {flow.started}</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums">{pct}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {STEPS.map(step => {
                    const done = flow.steps_done.includes(step.id)
                    return (
                      <button key={step.id} onClick={() => setActiveFlows(p => p.map(f => f.id === flow.id
                        ? { ...f, steps_done: done ? f.steps_done.filter(s => s !== step.id) : [...f.steps_done, step.id] }
                        : f))}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${done ? 'border-green-500 bg-green-50 text-green-700' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
                        {done ? <Check className="w-3 h-3" /> : <span>{step.icon}</span>}
                        {step.title.split(' ')[0]}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <button onClick={() => {
          const co = companies[Math.floor(Math.random() * companies.length)]
          setActiveFlows(p => [...p, { id: `f${Date.now()}`, company: co?.name || 'Nuevo cliente', started: new Date().toLocaleDateString('es-PE'), steps_done: [] }])
          toast.success('Onboarding iniciado')
        }} className="mt-3 flex items-center gap-1.5 px-4 py-2 text-xs font-bold border border-border rounded-full hover:bg-accent uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" /> Iniciar nuevo onboarding
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
const VIEWS = [
  { id: 'health',      label: 'CLIENT HEALTH',    icon: Heart,    color: '#ef4444' },
  { id: 'profit',      label: 'RENTABILIDAD',     icon: TrendingUp, color: '#10b981' },
  { id: 'recurring',   label: 'RECURRENTE (MRR)', icon: Repeat,   color: '#3b82f6' },
  { id: 'wiki',        label: 'WIKI INTERNA',     icon: BookOpen, color: '#8b5cf6' },
  { id: 'onboarding',  label: 'ONBOARDING',       icon: Zap,      color: '#f59e0b' },
]

export default function InsightsPage() {
  const [view, setView] = useState('health')
  const current = VIEWS.find(v => v.id === view)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="INSIGHTS" />
      <div className="flex border-b border-border px-5 shrink-0 overflow-x-auto">
        {VIEWS.map(v => {
          const Icon = v.icon
          return (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[9px] font-bold border-b-2 transition-colors uppercase tracking-widest whitespace-nowrap ${view === v.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-3.5 h-3.5" style={{ color: view === v.id ? v.color : undefined }} />
              {v.label}
            </button>
          )
        })}
      </div>
      <div className={`flex-1 overflow-y-auto p-5 ${view === 'wiki' ? 'overflow-hidden flex flex-col' : ''}`}>
        {view === 'health'     && <HealthScoreView />}
        {view === 'profit'     && <ProfitabilityView />}
        {view === 'recurring'  && <RecurringView />}
        {view === 'wiki'       && <div className="flex-1"><WikiView /></div>}
        {view === 'onboarding' && <OnboardingView />}
      </div>
    </div>
  )
}
