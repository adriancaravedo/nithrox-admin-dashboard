import { useState } from 'react'
import { useStore } from '../../../stores/useStore'
import Topbar from '../../../components/layout/Topbar'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { ROLES, getInitials } from '../../../lib/utils'
import { LANGUAGES } from '../../../lib/i18n'
import { Plus, Trash2, Globe } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { team, addTeamMember, deleteTeamMember, updateTeamMember, language, setLanguage } = useStore()
  const [activeTab, setActiveTab] = useState('team')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'designer', title: '' })
  const [apiKeys, setApiKeys] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ntx_settings') || '{}').api_keys || { claude: '', figma: '', supabase: '' } } catch { return { claude: '', figma: '', supabase: '' } }
  })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const saveApiKeys = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('ntx_settings') || '{}')
      localStorage.setItem('ntx_settings', JSON.stringify({ ...existing, api_keys: apiKeys }))
      toast.success('API Keys guardadas')
    } catch { toast.error('Error al guardar') }
  }

  const handleAddMember = () => {
    if (!form.name || !form.email) return
    addTeamMember({ ...form, avatar_color: '#64748b', active: true })
    setShowAdd(false)
    setForm({ name:'', email:'', role:'designer', title:'' })
  }

  const TABS = ['team','language','api','billing','notifications']
  const TAB_LABELS = { team:'Equipo', language:'Idioma', api:'API Keys', billing:'Facturación', notifications:'Notificaciones' }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Ajustes" />
      <div className="flex-1 overflow-hidden flex">
        <div className="w-48 border-r border-border p-3 shrink-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors mb-0.5 ${activeTab===t?'bg-accent font-medium':'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}>{TAB_LABELS[t]}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-6 max-w-2xl">
          {activeTab==='language' && (
            <div className="space-y-5 max-w-md">
              <div className="bg-background border border-border rounded-xl p-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> IDIOMA DEL ADMIN
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {LANGUAGES.map(lang => (
                    <button key={lang.id} onClick={() => { setLanguage(lang.id); toast.success(`Idioma cambiado a ${lang.label}`) }}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${language === lang.id ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/30'}`}>
                      <span className="text-2xl">{lang.flag}</span>
                      <div>
                        <p className="text-sm font-bold">{lang.label}</p>
                        <p className="text-[10px] text-muted-foreground">{lang.name}</p>
                      </div>
                      {language === lang.id && <span className="ml-auto text-[9px] bg-foreground text-background px-2 py-0.5 rounded-full font-bold">ACTIVO</span>}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-4">El idioma aplica a todos los textos del sidebar, topbar y páginas del admin. El contenido de los clientes no cambia.</p>
              </div>
            </div>
          )}
          {activeTab==='team' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><h2 className="text-base font-semibold">Miembros del equipo</h2><p className="text-xs text-muted-foreground">{team.length} miembros</p></div>
                <Button size="sm" onClick={()=>setShowAdd(true)}><Plus className="w-4 h-4 mr-1"/>Agregar</Button>
              </div>
              <div className="bg-background border border-border rounded-lg divide-y divide-border overflow-hidden">
                {team.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{backgroundColor:m.avatar_color}}>{getInitials(m.name)}</div>
                    <div className="flex-1"><p className="text-sm font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.email}</p></div>
                    <Select value={m.role} onValueChange={v=>updateTeamMember(m.id,{role:v})}>
                      <SelectTrigger className="w-32 h-8 text-xs"><SelectValue/></SelectTrigger>
                      <SelectContent>{Object.entries(ROLES).map(([k,r])=><SelectItem key={k} value={k}>{r.label}</SelectItem>)}</SelectContent>
                    </Select>
                    {m.id!=='u1'&&<button onClick={()=>deleteTeamMember(m.id)} className="text-muted-foreground hover:text-destructive ml-1"><Trash2 className="w-4 h-4"/></button>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab==='roles' && (
            <div className="space-y-4">
              <div><h2 className="text-base font-semibold">Roles y permisos</h2></div>
              {Object.entries(ROLES).map(([key,role])=>(
                <div key={key} className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">{role.label}</h3>
                    <span className="text-xs text-muted-foreground">{team.filter(m=>m.role===key).length} miembro(s)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(role.pages.includes('*')?['dashboard','crm','projects','messages','contracts','documents','agenda','converter','servers','notifications','settings']:role.pages).map(p=>(
                      <span key={p} className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">{p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab==='api' && (
            <div className="space-y-6">
              <div><h2 className="text-base font-semibold">API Keys</h2></div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Plataforma</p>
                <div className="space-y-3">
                  {[
                    {key:'claude',label:'Claude API (Anthropic)',sub:'Usado por el Converter Figma → Código',placeholder:'sk-ant-api03-...',link:'https://console.anthropic.com'},
                    {key:'figma',label:'Figma Personal Access Token',sub:'Para leer diseños desde Figma',placeholder:'figd_...',link:'https://figma.com/settings'},
                    {key:'supabase',label:'Supabase Anon Key',sub:'Clave pública de la base de datos',placeholder:'eyJ...',link:'https://supabase.com/dashboard'},
                  ].map(api=>(
                    <div key={api.key} className="bg-background border border-border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div><h3 className="text-sm font-semibold">{api.label}</h3><p className="text-xs text-muted-foreground">{api.sub}</p></div>
                        <a href={api.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Obtener →</a>
                      </div>
                      <div className="flex gap-2">
                        <Input type="password" value={apiKeys[api.key]||''} onChange={e=>setApiKeys(p=>({...p,[api.key]:e.target.value}))} placeholder={api.placeholder} className="flex-1 text-xs font-mono"/>
                        <Button size="sm" onClick={saveApiKeys}>Guardar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Redes Sociales</p>
                <div className="space-y-3">
                  {[
                    {key:'facebook_token',  label:'Facebook Page Access Token',  sub:'Meta for Developers → App → Page token',       placeholder:'EAAxxxxxxxxxxxxxxx', link:'https://developers.facebook.com'},
                    {key:'instagram_token', label:'Instagram Access Token',       sub:'Misma app de Meta, permiso instagram_basic',    placeholder:'IGQxxxxxxxxxxxxxxx', link:'https://developers.facebook.com'},
                    {key:'twitter_token',   label:'X (Twitter) Bearer Token',     sub:'Twitter Developer Portal → API v2',            placeholder:'AAAAAAAAAAAAAxx',     link:'https://developer.twitter.com'},
                    {key:'youtube_token',   label:'YouTube Data API Key',         sub:'Google Cloud Console → APIs → YouTube Data v3', placeholder:'AIzaSyxxxxxxxxxx',    link:'https://console.cloud.google.com'},
                    {key:'linkedin_token',  label:'LinkedIn Access Token',        sub:'LinkedIn Developer Portal → OAuth 2.0',        placeholder:'AQxxxxxxxxxxxxxxx', link:'https://developer.linkedin.com'},
                    {key:'tiktok_token',    label:'TikTok Access Token',          sub:'TikTok for Developers → App',                  placeholder:'act.xxxxxxxx',       link:'https://developers.tiktok.com'},
                  ].map(api=>(
                    <div key={api.key} className="bg-background border border-border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div><h3 className="text-sm font-semibold">{api.label}</h3><p className="text-xs text-muted-foreground">{api.sub}</p></div>
                        <a href={api.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Obtener →</a>
                      </div>
                      <div className="flex gap-2">
                        <Input type="password" value={apiKeys[api.key]||''} onChange={e=>setApiKeys(p=>({...p,[api.key]:e.target.value}))} placeholder={api.placeholder} className="flex-1 text-xs font-mono"/>
                        <Button size="sm" onClick={saveApiKeys}>Guardar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Email Marketing</p>
                <div className="space-y-3">
                  {[
                    {key:'resend_key',    label:'Resend API Key',    sub:'Proveedor de email transaccional (recomendado)',  placeholder:'re_xxxxxxxxxxxxxxx', link:'https://resend.com'},
                    {key:'sendgrid_key',  label:'SendGrid API Key',  sub:'Alternativa a Resend para envío masivo',          placeholder:'SG.xxxxxxxxxxxxxxx', link:'https://sendgrid.com'},
                  ].map(api=>(
                    <div key={api.key} className="bg-background border border-border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div><h3 className="text-sm font-semibold">{api.label}</h3><p className="text-xs text-muted-foreground">{api.sub}</p></div>
                        <a href={api.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Obtener →</a>
                      </div>
                      <div className="flex gap-2">
                        <Input type="password" value={apiKeys[api.key]||''} onChange={e=>setApiKeys(p=>({...p,[api.key]:e.target.value}))} placeholder={api.placeholder} className="flex-1 text-xs font-mono"/>
                        <Button size="sm" onClick={saveApiKeys}>Guardar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab==='billing' && (
            <div className="space-y-4">
              <div><h2 className="text-base font-semibold">Estructura de pagos por fase</h2></div>
              <div className="bg-background border border-border rounded-lg p-4 space-y-3">
                {[{l:'Kick off',v:10},{l:'Diseño',v:40},{l:'Desarrollo',v:40},{l:'Publicación',v:10}].map(p=>(
                  <div key={p.l} className="flex items-center gap-3">
                    <span className="text-sm w-28">{p.l}</span>
                    <Input type="number" defaultValue={p.v} className="w-20 h-8 text-sm"/>
                    <span className="text-sm text-muted-foreground">%</span>
                    <div className="flex-1 bg-muted rounded-full h-1.5"><div className="bg-foreground h-1.5 rounded-full" style={{width:`${p.v}%`}}/></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab==='notifications' && (
            <div className="space-y-4">
              <div><h2 className="text-base font-semibold">Preferencias de notificaciones</h2></div>
              <div className="bg-background border border-border rounded-lg divide-y divide-border overflow-hidden">
                {[
                  {label:'Mensajes nuevos',channels:'WhatsApp + Email'},
                  {label:'Pagos recibidos',channels:'Email'},
                  {label:'Aprobaciones de cliente',channels:'WhatsApp'},
                  {label:'Alertas de servidor',channels:'WhatsApp + Email'},
                  {label:'Facturas vencidas',channels:'WhatsApp'},
                ].map(n=>(
                  <div key={n.label} className="flex items-center justify-between px-5 py-3.5">
                    <div><p className="text-sm font-medium">{n.label}</p><p className="text-xs text-muted-foreground">{n.channels}</p></div>
                    <div className="w-10 h-5 rounded-full bg-foreground relative flex items-center px-0.5 cursor-pointer">
                      <div className="w-4 h-4 rounded-full bg-background ml-auto"/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Agregar miembro</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Nombre *</Label><Input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Lucía Torres"/></div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="lucia@nithrox.com"/></div>
            <div className="space-y-1.5"><Label>Cargo</Label><Input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Diseñadora Senior..."/></div>
            <div className="space-y-1.5"><Label>Rol</Label>
              <Select value={form.role} onValueChange={v=>set('role',v)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{Object.entries(ROLES).map(([k,r])=><SelectItem key={k} value={k}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={()=>setShowAdd(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleAddMember} disabled={!form.name||!form.email}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
