import { useState, useEffect } from 'react'
import Topbar from '../../../components/layout/Topbar'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import {
  CheckCircle2, XCircle, Image, Calendar, Send,
  BarChart2, Clock, Trash2, Settings, RefreshCw,
  TrendingUp, Heart, MessageCircle, Share2, Eye
} from 'lucide-react'
import { toast } from 'sonner'

const PLATFORMS = [
  { id: 'facebook',  name: 'Facebook',    color: '#1877F2', bg: '#EBF3FF', keyName: 'facebook_token',  icon: '/icons/facebook.svg',  charLimit: 63206 },
  { id: 'instagram', name: 'Instagram',   color: '#E4405F', bg: '#FFF0F3', keyName: 'instagram_token', icon: '/icons/instagram.svg', charLimit: 2200  },
  { id: 'twitter',   name: 'X (Twitter)', color: '#000000', bg: '#F7F7F7', keyName: 'twitter_token',   icon: '/icons/x.svg',         charLimit: 280   },
  { id: 'youtube',   name: 'YouTube',     color: '#FF0000', bg: '#FFF0F0', keyName: 'youtube_token',   icon: '/icons/youtube.svg',   charLimit: 5000  },
  { id: 'linkedin',  name: 'LinkedIn',    color: '#0A66C2', bg: '#EEF4FB', keyName: 'linkedin_token',  icon: '/icons/linkedin.svg',  charLimit: 3000  },
  { id: 'tiktok',    name: 'TikTok',      color: '#010101', bg: '#F0F0F0', keyName: 'tiktok_token',    icon: '/icons/tiktok.svg',    charLimit: 2200  },
]

const TABS = [
  { id: 'compose',   label: 'Publicar' },
  { id: 'scheduled', label: 'Programados' },
  { id: 'analytics', label: 'Analíticas' },
]

function PlatformIcon({ id, size = 18 }) {
  const icons = {
    facebook:  <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z"/></svg>,
    instagram: <svg width={size} height={size} viewBox="0 0 24 24"><defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FFDC80"/><stop offset="25%" stopColor="#FCAF45"/><stop offset="50%" stopColor="#F77737"/><stop offset="75%" stopColor="#F56040"/><stop offset="100%" stopColor="#C13584"/></linearGradient></defs><path fill="url(#ig)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
    twitter:   <svg width={size} height={size} viewBox="0 0 24 24" fill="#000"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.254 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    youtube:   <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF0000"><path d="M23.499 6.203a3.008 3.008 0 00-2.089-2.089c-1.87-.501-9.4-.501-9.4-.501s-7.509-.01-9.399.501A3.008 3.008 0 00.5 6.203a31.5 31.5 0 00-.5 5.798 31.5 31.5 0 00.501 5.797 3.008 3.008 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.008 3.008 0 002.089-2.088 31.5 31.5 0 00.5-5.797 31.5 31.5 0 00-.471-5.798zM9.609 15.601V8.408l6.264 3.602z"/></svg>,
    linkedin:  <svg width={size} height={size} viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
    tiktok:    <svg width={size} height={size} viewBox="0 0 24 24" fill="#000"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z"/></svg>,
  }
  return icons[id] || null
}

function getApiKeys() {
  try { return JSON.parse(localStorage.getItem('ntx_settings') || '{}').api_keys || {} } catch { return {} }
}

function getScheduled() {
  try { return JSON.parse(localStorage.getItem('ntx_scheduled_posts') || '[]') } catch { return [] }
}

function saveScheduled(posts) {
  localStorage.setItem('ntx_scheduled_posts', JSON.stringify(posts))
}

export default function SocialPage() {
  const [tab, setTab] = useState('compose')
  const [apiKeys, setApiKeys] = useState(getApiKeys)
  const [selected, setSelected] = useState([])
  const [content, setContent] = useState('')
  const [mediaPreview, setMediaPreview] = useState(null)
  const [scheduled, setScheduled] = useState(getScheduled)
  const [scheduleDate, setScheduleDate] = useState('')
  const [isScheduling, setIsScheduling] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setApiKeys(getApiKeys()), 2000)
    return () => clearInterval(interval)
  }, [])

  const connected = PLATFORMS.filter(p => apiKeys[p.keyName])
  const connectedIds = connected.map(p => p.id)

  const togglePlatform = (id) => {
    if (!connectedIds.includes(id)) return toast.error('Conecta esta plataforma en Configuración → API Keys')
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  const handleMedia = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setMediaPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handlePost = () => {
    if (!content.trim()) return toast.error('Escribe algo para publicar')
    if (selected.length === 0) return toast.error('Selecciona al menos una plataforma')
    if (isScheduling && !scheduleDate) return toast.error('Selecciona una fecha y hora')

    const post = {
      id: Date.now().toString(),
      content,
      platforms: selected,
      media: mediaPreview,
      status: isScheduling ? 'scheduled' : 'published',
      date: isScheduling ? scheduleDate : new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    if (isScheduling) {
      const newScheduled = [post, ...scheduled]
      setScheduled(newScheduled)
      saveScheduled(newScheduled)
      toast.success('Post programado correctamente')
    } else {
      toast.success(`Post publicado en ${selected.length} plataforma${selected.length > 1 ? 's' : ''} (simulado — conecta tokens reales en Configuración)`)
    }

    setContent('')
    setMediaPreview(null)
    setSelected([])
    setScheduleDate('')
    setIsScheduling(false)
  }

  const deleteScheduled = (id) => {
    const updated = scheduled.filter(p => p.id !== id)
    setScheduled(updated)
    saveScheduled(updated)
    toast.success('Post eliminado')
  }

  const charCount = content.length
  const minLimit = selected.length > 0
    ? Math.min(...selected.map(id => PLATFORMS.find(p => p.id === id)?.charLimit || 9999))
    : 280
  const overLimit = charCount > minLimit

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Redes Sociales"
        actions={
          <Button size="sm" variant="outline" className="text-xs rounded-full px-4"
            onClick={() => { setApiKeys(getApiKeys()); toast.success('Actualizado') }}>
            <RefreshCw className="w-3 h-3 mr-1.5" /> Actualizar conexiones
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-4 space-y-4">

        {/* Platform cards */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {PLATFORMS.map(p => {
            const isConnected = !!apiKeys[p.keyName]
            return (
              <div key={p.id}
                className={`rounded-xl border p-3 flex flex-col items-center gap-2 transition-all ${
                  isConnected ? 'border-green-200 bg-green-50' : 'border-border bg-background'
                }`}>
                <div className="w-8 h-8 flex items-center justify-center">
                  <PlatformIcon id={p.id} size={22} />
                </div>
                <span className="text-xs font-semibold text-center">{p.name}</span>
                {isConnected
                  ? <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-medium"><CheckCircle2 className="w-3 h-3" /> Conectado</span>
                  : <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground"><XCircle className="w-3 h-3" /> Sin token</span>
                }
              </div>
            )
          })}
        </div>

        {connected.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
            <Settings className="w-4 h-4 shrink-0" />
            <span>Conecta tus plataformas en <strong>Configuración → API Keys</strong> para empezar a publicar.</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Compose */}
        {tab === 'compose' && (
          <div className="rounded-xl border border-border bg-background p-5 space-y-4 shadow-sm">
            {/* Platform selector */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Plataformas</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => {
                  const isConn = connectedIds.includes(p.id)
                  const isSel = selected.includes(p.id)
                  return (
                    <button key={p.id} onClick={() => togglePlatform(p.id)}
                      disabled={!isConn}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isSel ? 'border-foreground bg-foreground text-background'
                          : isConn ? 'border-border hover:border-foreground/50'
                          : 'border-border opacity-40 cursor-not-allowed'
                      }`}>
                      <PlatformIcon id={p.id} size={12} />
                      {p.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Text area */}
            <div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="¿Qué quieres publicar hoy?"
                rows={5}
                className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-background outline-none resize-none focus:border-foreground transition-colors ${
                  overLimit ? 'border-red-400' : 'border-border'
                }`}
              />
              <div className={`text-right text-xs mt-1 ${overLimit ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                {charCount} / {minLimit}
              </div>
            </div>

            {/* Media */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 px-3 py-2 text-xs border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                <Image className="w-3.5 h-3.5" /> Adjuntar imagen/video
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMedia} />
              </label>
              {mediaPreview && (
                <div className="relative">
                  <img src={mediaPreview} alt="" className="h-12 w-12 object-cover rounded-lg border border-border" />
                  <button onClick={() => setMediaPreview(null)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-foreground text-background rounded-full flex items-center justify-center">
                    <XCircle className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Schedule toggle */}
            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => setIsScheduling(s => !s)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                  isScheduling ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/50'
                }`}>
                <Clock className="w-3.5 h-3.5" /> Programar
              </button>
              {isScheduling && (
                <input type="datetime-local"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  className="text-xs border border-border rounded-lg px-3 py-1.5 outline-none focus:border-foreground bg-background"
                />
              )}
              <Button size="sm" onClick={handlePost} disabled={!content || selected.length === 0 || overLimit}
                className="ml-auto rounded-full px-5 text-xs gap-1.5">
                {isScheduling ? <><Calendar className="w-3.5 h-3.5" /> Programar</> : <><Send className="w-3.5 h-3.5" /> Publicar ahora</>}
              </Button>
            </div>
          </div>
        )}

        {/* Scheduled */}
        {tab === 'scheduled' && (
          <div className="space-y-2">
            {scheduled.length === 0 ? (
              <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold">No hay posts programados</p>
                <p className="text-xs mt-1">Usa la pestaña "Publicar" para programar contenido</p>
              </div>
            ) : scheduled.map(post => (
              <div key={post.id}
                className="flex items-start gap-4 rounded-xl border border-border bg-background p-4 hover:shadow-sm transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {post.platforms.map(id => (
                      <span key={id} className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-muted rounded-full font-medium">
                        <PlatformIcon id={id} size={10} /> {PLATFORMS.find(p => p.id === id)?.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(post.date).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                {post.media && <img src={post.media} alt="" className="h-14 w-14 object-cover rounded-lg border border-border shrink-0" />}
                <button onClick={() => deleteScheduled(post.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Analytics */}
        {tab === 'analytics' && (
          <div>
            {connected.length === 0 ? (
              <div className="rounded-xl border border-border p-14 text-center text-muted-foreground">
                <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold">Conecta plataformas para ver analíticas</p>
                <p className="text-xs mt-1">Ve a Configuración → API Keys</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Alcance total', value: '—', icon: Eye, color: 'text-blue-500' },
                  { label: 'Me gusta',       value: '—', icon: Heart, color: 'text-red-500' },
                  { label: 'Comentarios',    value: '—', icon: MessageCircle, color: 'text-green-500' },
                  { label: 'Compartidos',    value: '—', icon: Share2, color: 'text-purple-500' },
                  { label: 'Seguidores',     value: '—', icon: TrendingUp, color: 'text-amber-500' },
                  { label: 'Posts publicados', value: scheduled.filter(p => p.status === 'published').length, icon: Send, color: 'text-foreground' },
                ].map(m => (
                  <div key={m.label} className="rounded-xl border border-border bg-background p-4 space-y-1">
                    <m.icon className={`w-4 h-4 ${m.color}`} />
                    <p className="text-2xl font-bold">{m.value}</p>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                  </div>
                ))}
                <div className="col-span-2 md:col-span-4 rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-muted-foreground text-sm">
                  Las analíticas reales se cargarán cuando las APIs estén conectadas con tokens válidos.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
