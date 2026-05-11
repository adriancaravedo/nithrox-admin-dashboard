import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../../stores/useStore'
import { formatRelative, formatCurrency } from '../../../lib/utils'
import Topbar from '../../../components/layout/Topbar'
import { TrendingUp, TrendingDown, ArrowRight, CheckCircle2, Circle, AlertTriangle, Clock, Plus } from 'lucide-react'

// Tiny sparkline SVG
function Sparkline({ data, color = '#18181b', height = 32 }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80, h = height
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Metric card
function MetricCard({ label, value, sub, trend, sparkData, color, onClick }) {
  const up = trend >= 0
  return (
    <div onClick={onClick} className={`bg-background border border-border rounded-xl p-5 ${onClick ? 'cursor-pointer hover:shadow-sm hover:border-foreground/20 transition-all' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        {sparkData && <Sparkline data={sparkData} color={color || '#18181b'} />}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
          {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {Math.abs(trend)}% vs mes anterior
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { projects, contacts, companies, deals, messages, notifications } = useStore()
  const navigate = useNavigate()
  const activeProjects = projects.filter(p => !p._deleted)
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')

  // Remove clock interval - no more time tracking
  const greet = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }
  const totalRevenue = activeProjects.reduce((s, p) => s + (p.value || 0), 0)
  const totalCollected = activeProjects.reduce((s, p) =>
    s + Object.values(p.phases || {}).reduce((ps, ph) => ps + (ph.paid_amount || 0), 0), 0)
  const pendingPayments = activeProjects.filter(p => {
    const pd = p.phases[p.phase]
    return pd && !pd.paid
  })
  const unreadMessages = messages.reduce((s, m) => s + (m.unread || 0), 0)
  const unreadNotifs = notifications.filter(n => !n.read).length

  const revenueByMonth = totalRevenue > 0 ? [0, 0, 0, 0, 0, totalRevenue] : null
  const projectsByMonth = activeProjects.length > 0 ? [0, 0, 0, 0, 0, activeProjects.length] : null

  const pendingApprovals = activeProjects.filter(p => {
    const pd = p.phases[p.phase]
    return pd?.paid && (!pd.approved_admin || !pd.approved_client)
  })

  const toggleTask = (id) => setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t))
  const addTask = () => {
    if (!newTask.trim()) return
    setTasks(p => [...p, { id: Date.now(), text: newTask.trim(), done: false, priority: 'medium' }])
    setNewTask('')
  }

  const PRIORITY_DOT = { high: 'bg-red-500', medium: 'bg-yellow-500', low: 'bg-green-500' }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="DASHBOARD" />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold tracking-tight">{greet()}, Adrian.</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Alert banners */}
        {(pendingPayments.length > 0 || pendingApprovals.length > 0 || unreadMessages > 0) && (
          <div className="space-y-2">
            {pendingPayments.length > 0 && (
              <div onClick={() => navigate('/projects')} className="flex items-center gap-3 px-4 py-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl cursor-pointer hover:shadow-sm transition-all">
                <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400 flex-1">
                  {pendingPayments.length} proyecto{pendingPayments.length > 1 ? 's' : ''} con pago pendiente
                </p>
                <ArrowRight className="w-4 h-4 text-yellow-600" />
              </div>
            )}
            {pendingApprovals.length > 0 && (
              <div onClick={() => navigate('/projects')} className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl cursor-pointer hover:shadow-sm transition-all">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-sm font-medium text-blue-800 dark:text-blue-400 flex-1">
                  {pendingApprovals.length} fase{pendingApprovals.length > 1 ? 's' : ''} esperando aprobación
                </p>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </div>
            )}
            {unreadMessages > 0 && (
              <div onClick={() => navigate('/messages')} className="flex items-center gap-3 px-4 py-3 bg-muted border border-border rounded-xl cursor-pointer hover:shadow-sm transition-all">
                <span className="text-base">💬</span>
                <p className="text-sm font-medium flex-1">{unreadMessages} mensaje{unreadMessages > 1 ? 's' : ''} sin leer</p>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Revenue total"
            value={`$${totalRevenue.toLocaleString()}`}
            sub={`$${totalCollected.toLocaleString()} cobrado`}
            sparkData={revenueByMonth}
            color="#16a34a"
            onClick={() => navigate('/projects')}
          />
          <MetricCard
            label="Proyectos activos"
            value={activeProjects.length}
            sub={`${activeProjects.filter(p => p.phase === 'publication').length} en publicación`}
            sparkData={projectsByMonth}
            onClick={() => navigate('/projects')}
          />
          <MetricCard
            label="Clientes CRM"
            value={contacts.length}
            sub={`${companies.length} empresas`}
            sparkData={contacts.length > 0 ? [0, 0, 0, 0, 0, contacts.length] : null}
            onClick={() => navigate('/clients')}
          />
          <MetricCard
            label="Deals pipeline"
            value={`$${deals.reduce((s, d) => s + (d.amount || 0), 0).toLocaleString()}`}
            sub={`${deals.length} deals activos`}
            sparkData={deals.length > 0 ? [0, 0, 0, 0, 0, deals.reduce((s, d) => s + (d.amount || 0), 0)] : null}
            onClick={() => navigate('/clients')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Tasks del día */}
          <div className="lg:col-span-1 bg-background border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="text-xs font-bold uppercase tracking-widest">Tareas del día</p>
              <span className="text-xs text-muted-foreground">
                {tasks.filter(t => t.done).length}/{tasks.length}
              </span>
            </div>
            <div className="divide-y divide-border/50">
              {tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <CheckCircle2 className="w-6 h-6 mb-1.5 opacity-30" />
                  <p className="text-xs">Sin tareas. Agrega una abajo.</p>
                </div>
              )}
              {tasks.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/30 transition-colors">
                  <button onClick={() => toggleTask(t.id)} className="shrink-0">
                    {t.done
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : <Circle className="w-4 h-4 text-muted-foreground" />
                    }
                  </button>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[t.priority]}`} />
                  <span className={`text-xs flex-1 ${t.done ? 'line-through text-muted-foreground' : ''}`}>{t.text}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  placeholder="+ Nueva tarea..."
                  className="flex-1 text-xs outline-none bg-transparent text-muted-foreground placeholder:text-muted-foreground/50"
                />
                {newTask && <button onClick={addTask} className="text-primary text-xs font-medium">Add</button>}
              </div>
            </div>
          </div>

          {/* Proyectos por fase */}
          <div className="bg-background border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="text-xs font-bold uppercase tracking-widest">Proyectos por fase</p>
              <button onClick={() => navigate('/projects')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Ver todos <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-border/50">
              {[
                { id: 'kickoff', label: 'KICK-OFF', num: 'FASE 1' },
                { id: 'design', label: 'DISEÑO', num: 'FASE 2' },
                { id: 'development', label: 'DESARROLLO', num: 'FASE 3' },
                { id: 'publication', label: 'PUBLICACIÓN', num: 'FASE 4' },
              ].map(phase => {
                const count = activeProjects.filter(p => p.phase === phase.id).length
                const value = activeProjects.filter(p => p.phase === phase.id).reduce((s, p) => s + (p.value || 0), 0)
                const pct = activeProjects.length ? Math.round((count / activeProjects.length) * 100) : 0
                return (
                  <div key={phase.id} className="px-5 py-3 cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => navigate('/projects')}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-[9px] text-muted-foreground font-bold tracking-widest">{phase.num} · </span>
                        <span className="text-xs font-bold tracking-tight">{phase.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold">{count}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">${value.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Últimos deals */}
          <div className="bg-background border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="text-xs font-bold uppercase tracking-widest">Últimos deals</p>
              <button onClick={() => navigate('/clients')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Ver todos <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-border/50">
              {deals.slice(0, 5).map(deal => {
                const stageColors = { new: '#64748b', qualified: '#2563eb', proposal: '#d97706', won: '#16a34a', lost: '#dc2626' }
                const color = stageColors[deal.stage] || '#64748b'
                return (
                  <div key={deal.id} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => navigate('/clients')}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{deal.name}</p>
                      <p className="text-[10px] text-muted-foreground">{deal.owner}</p>
                    </div>
                    <p className="text-xs font-bold shrink-0">${(deal.amount || 0).toLocaleString()}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs font-bold uppercase tracking-widest">Actividad reciente</p>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Clock className="w-7 h-7 mb-2 opacity-30" />
            <p className="text-xs">La actividad aparecerá aquí conforme uses la plataforma</p>
          </div>
        </div>

      </div>
    </div>
  )
}
