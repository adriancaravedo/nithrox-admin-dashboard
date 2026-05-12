import { useState, useRef, useCallback } from 'react'
import Topbar from '../../../components/layout/Topbar'
import { Button } from '../../../components/ui/button'
import EmailEditor from 'react-email-editor'
import {
  Plus, ArrowLeft, Send, Download, Eye,
  BarChart2, Mail, Users, MousePointerClick,
  Trash2, ChevronLeft, ChevronRight, Search, Clock
} from 'lucide-react'
import { toast } from 'sonner'

function load() { try { return JSON.parse(localStorage.getItem('ntx_campaigns') || '[]') } catch { return [] } }
function save(d) { localStorage.setItem('ntx_campaigns', JSON.stringify(d)) }

const STATUS_STYLES = {
  draft:     'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-100 text-blue-700',
  sent:      'bg-green-100 text-green-700',
}
const STATUS_LABELS = { draft: 'Borrador', scheduled: 'Programado', sent: 'Enviado' }

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-1">
      <Icon className={`w-4 h-4 ${color}`} />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export default function EmailMarketingPage() {
  const [campaigns, setCampaigns] = useState(load)
  const [view, setView] = useState('list')        // 'list' | 'builder' | 'preview'
  const [editing, setEditing] = useState(null)    // campaign being edited
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const editorRef = useRef(null)
  const PER_PAGE = 10

  const mutate = (data) => { setCampaigns(data); save(data) }

  const newCampaign = () => {
    const c = {
      id: Date.now().toString(),
      name: 'Nueva campaña',
      subject: '',
      status: 'draft',
      design: null,
      html: '',
      recipients: 0,
      open_rate: 0,
      click_rate: 0,
      created_at: new Date().toISOString(),
      sent_at: null,
    }
    setEditing(c)
    setView('builder')
  }

  const openEditor = (c) => { setEditing(c); setView('builder') }

  const saveCampaign = useCallback(() => {
    if (!editorRef.current) return
    editorRef.current.exportHtml((data) => {
      const { design, html } = data
      const updated = { ...editing, design, html, updated_at: new Date().toISOString() }
      const exists = campaigns.find(c => c.id === editing.id)
      const newList = exists
        ? campaigns.map(c => c.id === editing.id ? updated : c)
        : [updated, ...campaigns]
      mutate(newList)
      setEditing(updated)
      toast.success('Campaña guardada')
    })
  }, [editing, campaigns])

  const sendCampaign = useCallback(() => {
    saveCampaign()
    setTimeout(() => {
      const updated = campaigns.map(c => c.id === editing?.id
        ? { ...c, status: 'sent', sent_at: new Date().toISOString() }
        : c
      )
      mutate(updated)
      toast.success('Campaña enviada (simulado — conecta un proveedor de email en Configuración → API Keys)')
      setView('list')
      setEditing(null)
    }, 500)
  }, [editing, campaigns, saveCampaign])

  const deleteCampaign = (id) => {
    mutate(campaigns.filter(c => c.id !== id))
    toast.success('Campaña eliminada')
  }

  const onEditorLoad = useCallback(() => {
    if (editing?.design && editorRef.current) {
      editorRef.current.loadDesign(editing.design)
    }
  }, [editing])

  const filtered = campaigns.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageCampaigns = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const sent = campaigns.filter(c => c.status === 'sent').length
  const avgOpen = sent > 0 ? Math.round(campaigns.filter(c => c.status === 'sent').reduce((s, c) => s + c.open_rate, 0) / sent) : 0

  /* ── Builder view ───────────────────────────────────────── */
  if (view === 'builder') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Builder topbar */}
        <div className="flex items-center gap-3 h-12 px-4 border-b border-border bg-background shrink-0">
          <button onClick={() => { setView('list'); setEditing(null) }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <div className="h-4 w-px bg-border" />
          <input
            value={editing?.name || ''}
            onChange={e => setEditing(p => ({ ...p, name: e.target.value }))}
            placeholder="Nombre de campaña"
            className="text-sm font-semibold outline-none bg-transparent flex-1"
          />
          <input
            value={editing?.subject || ''}
            onChange={e => setEditing(p => ({ ...p, subject: e.target.value }))}
            placeholder="Asunto del email..."
            className="text-sm text-muted-foreground outline-none bg-transparent w-64 border border-border rounded-lg px-3 py-1"
          />
          <div className="flex items-center gap-2 ml-2">
            <Button size="sm" variant="outline" className="text-xs" onClick={saveCampaign}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Guardar
            </Button>
            <Button size="sm" className="text-xs" onClick={sendCampaign}>
              <Send className="w-3.5 h-3.5 mr-1.5" /> Enviar campaña
            </Button>
          </div>
        </div>

        {/* Unlayer editor — takes all remaining height */}
        <div className="flex-1 overflow-hidden">
          <EmailEditor
            ref={editorRef}
            onLoad={onEditorLoad}
            style={{ height: '100%', width: '100%' }}
            options={{
              version: 'latest',
              appearance: { theme: 'modern_light' },
              locale: 'es-ES',
              features: { textEditor: { spellChecker: true } },
            }}
          />
        </div>
      </div>
    )
  }

  /* ── List view ──────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Email Marketing"
        actions={
          <Button size="sm" onClick={newCampaign} className="text-xs rounded-full px-4">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Nueva campaña
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Mail}             label="Campañas totales" value={campaigns.length} color="text-blue-500" />
          <StatCard icon={Send}             label="Enviadas"          value={sent}             color="text-green-500" />
          <StatCard icon={Eye}              label="Tasa apertura avg" value={`${avgOpen}%`}    color="text-amber-500" />
          <StatCard icon={MousePointerClick} label="Clicks avg"       value="—"               color="text-purple-500" />
        </div>

        {/* Campaigns table */}
        <div className="rounded-xl border border-border bg-background overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Buscar campaña..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-background outline-none focus:border-foreground" />
            </div>
          </div>

          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-[#f8f8f9] border-b border-border text-[11px] font-semibold text-muted-foreground">
                <th className="px-4 py-2.5 text-left">Nombre</th>
                <th className="px-4 py-2.5 text-left" style={{ width: 160 }}>Asunto</th>
                <th className="px-4 py-2.5 text-left" style={{ width: 100 }}>Estado</th>
                <th className="px-4 py-2.5 text-right" style={{ width: 80 }}>Aperturas</th>
                <th className="px-4 py-2.5 text-right" style={{ width: 80 }}>Clicks</th>
                <th className="px-4 py-2.5 text-left" style={{ width: 130 }}>Fecha</th>
                <th className="px-4 py-2.5 text-left" style={{ width: 80 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageCampaigns.map(c => (
                <tr key={c.id} className="group border-b border-border/50 hover:bg-[#f8f9fa] transition-colors">
                  <td className="px-4 py-2.5">
                    <button onClick={() => openEditor(c)}
                      className="text-sm font-semibold hover:underline text-left truncate block max-w-full">
                      {c.name}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground truncate">{c.subject || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-right tabular-nums">{c.open_rate > 0 ? `${c.open_rate}%` : '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-right tabular-nums">{c.click_rate > 0 ? `${c.click_rate}%` : '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(c.sent_at || c.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditor(c)}
                        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteCampaign(c.id)}
                        className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageCampaigns.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <Mail className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-semibold">No hay campañas aún</p>
                    <p className="text-xs text-muted-foreground mt-1">Crea tu primera campaña con el editor drag & drop</p>
                    <Button size="sm" onClick={newCampaign} className="mt-4 text-xs rounded-full px-5">
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Nueva campaña
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="px-4 py-2.5 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {filtered.length === 0 ? '0' : `${(safePage - 1) * PER_PAGE + 1}–${Math.min(safePage * PER_PAGE, filtered.length)}`} de {filtered.length}
            </span>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-medium">{safePage}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
