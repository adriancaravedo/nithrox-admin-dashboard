import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../../../stores/useStore'
import { formatRelative, formatDate, getInitials } from '../../../lib/utils'
import Topbar from '../../../components/layout/Topbar'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import {
  ChevronDown, Plus, ExternalLink, Mail, Phone,
  ListTodo, Calendar, MoreHorizontal, Pencil, Trash2,
  Check, X, Building2, FileText
} from 'lucide-react'

function QuickAction({ icon, label, onClick, href }) {
  const cls = "flex flex-col items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-accent transition-colors"
  if (href) return <a href={href} className={cls}>{icon}<span>{label}</span></a>
  return <button onClick={onClick} className={cls}>{icon}<span>{label}</span></button>
}

const CONTRACT_STATUS = {
  signed: { label: 'Firmado', color: 'bg-green-100 text-green-700' },
  sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-700' },
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-600' },
}

export function CompanyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { companies, contacts, deals, updateCompany } = useStore()
  const [editField, setEditField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [contracts, setContracts] = useState([
    { id: 'ct1', name: 'Contrato de servicios', status: 'signed', date: '01 Abr 2026' },
  ])

  const company = companies.find(c => c.id === id)
  if (!company) return (
    <div className="flex flex-col h-full">
      <Topbar title="Empresa no encontrada" />
      <div className="flex-1 flex items-center justify-center text-muted-foreground">Empresa no encontrada</div>
    </div>
  )

  const companyContacts = contacts.filter(c => company.contacts?.includes(c.id))
  const companyDeals = deals.filter(d => company.deals?.includes(d.id))

  const startEdit = (field, value) => { setEditField(field); setEditValue(value || '') }
  const saveEdit = () => { if (editField) updateCompany(id, { [editField]: editValue }); setEditField(null) }

  const INFO_FIELDS = [
    { key: 'owner', label: 'Company owner' },
    { key: 'city', label: 'Ciudad' },
    { key: 'lifecycle', label: 'Lifecycle Stage' },
    { key: 'lead_status', label: 'Lead Status' },
    { key: 'industry', label: 'Industria' },
    { key: 'ruc', label: 'RUC' },
    { key: 'last_activity', label: 'Último contacto' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title={`Clientes | ${company.name}`}
        actions={<Button size="sm" variant="outline" onClick={() => navigate(-1)} className="text-xs">← Volver</Button>}
      />

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* LEFT */}
        <div className="w-full md:w-[240px] border-b md:border-b-0 md:border-r border-border overflow-y-auto shrink-0 p-5">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3" style={{ backgroundColor: company.avatar_color }}>
              {getInitials(company.name)}
            </div>
            <h2 className="font-semibold text-sm">{company.name}</h2>
            {company.domain && (
              <a href={`https://${company.domain}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-0.5 flex items-center gap-1">
                {company.domain} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex justify-center gap-1 mb-5">
            {company.phone && <QuickAction href={`tel:${company.phone}`} icon={<Phone className="w-4 h-4" />} label="Llamar" />}
            <QuickAction icon={<Mail className="w-4 h-4" />} label="Email" onClick={() => {}} />
            <QuickAction icon={<ListTodo className="w-4 h-4" />} label="Task" onClick={() => {}} />
            <QuickAction icon={<Calendar className="w-4 h-4" />} label="Reunión" onClick={() => {}} />
          </div>

          <div>
            <h3 className="text-xs font-semibold mb-3">Key information</h3>
            <div className="space-y-3">
              {INFO_FIELDS.map(field => (
                <div key={field.key}>
                  <p className="text-[10px] text-muted-foreground mb-0.5">{field.label}</p>
                  {editField === field.key ? (
                    <div className="flex gap-1">
                      <Input value={editValue} onChange={e => setEditValue(e.target.value)} className="h-7 text-xs flex-1"
                        autoFocus onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditField(null) }} />
                      <button onClick={saveEdit} className="text-green-600 px-1"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditField(null)} className="text-muted-foreground px-1"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <button className="text-sm text-left w-full hover:text-primary transition-colors"
                      onClick={() => startEdit(field.key, company[field.key])}>
                      {company[field.key] || <span className="text-muted-foreground">—</span>}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER */}
        <div className="flex-1 overflow-y-auto border-r border-border p-5 space-y-4">
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border">
              <h3 className="text-sm font-medium">Company insights</h3>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">+ AI</span>
            </div>
            <div className="p-4">
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>• <strong className="text-foreground">Próximo:</strong> Reunión de seguimiento programada.</li>
                <li>• <strong className="text-foreground">Actividad reciente:</strong> Alto interés detectado en las últimas interacciones.</li>
              </ul>
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border">
              <h3 className="text-sm font-medium">Recent interactions</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <div className="border border-border rounded-md p-3 text-center">
                <p className="text-xs font-medium mb-2 text-muted-foreground">Inbound</p>
                <p className="text-xs text-muted-foreground py-3">Sin actividad inbound.</p>
              </div>
              <div className="border border-border rounded-md p-3">
                <p className="text-xs font-medium mb-2 text-muted-foreground">Outbound</p>
                {companyDeals.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex gap-2"><span>📅</span><div><p className="text-primary cursor-pointer hover:underline">Reunión — Kick off</p><p className="text-muted-foreground">{formatDate(company.last_activity)}</p></div></div>
                    <div className="flex gap-2"><span>📞</span><div><p className="text-primary cursor-pointer hover:underline">Llamada registrada</p><p className="text-muted-foreground">{formatDate(company.created_at)}</p></div></div>
                  </div>
                ) : <p className="text-xs text-muted-foreground text-center py-2">Sin actividad</p>}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full md:w-[240px] overflow-y-auto shrink-0 p-4 space-y-5">
          {/* Contacts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold">Contacts ({companyContacts.length})</h3>
              <button className="text-xs text-primary hover:underline flex items-center gap-0.5"><Plus className="w-3 h-3" /> Add</button>
            </div>
            {companyContacts.map(contact => (
              <div key={contact.id} className="border border-border rounded-lg p-3 mb-2">
                <button className="text-sm text-primary hover:underline font-medium block" onClick={() => navigate(`/clients/contacts/${contact.id}`)}>
                  {contact.name}
                </button>
                <p className="text-xs text-muted-foreground">{contact.role}</p>
                {contact.email && <p className="text-xs text-primary hover:underline cursor-pointer">{contact.email}</p>}
              </div>
            ))}
            {companyContacts.length === 0 && (
              <div className="border border-dashed border-border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Sin contactos</p>
              </div>
            )}
          </div>

          {/* Deals */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold">Deals ({companyDeals.length})</h3>
              <button className="text-xs text-primary hover:underline flex items-center gap-0.5"><Plus className="w-3 h-3" /> Add</button>
            </div>
            {companyDeals.map(deal => (
              <div key={deal.id} className="border border-border rounded-lg p-3 mb-2">
                <p className="text-sm font-medium mb-1">{deal.name}</p>
                <p className="text-xs text-muted-foreground">${deal.amount?.toLocaleString()}</p>
                <button onClick={() => navigate(`/clients/deals/${deal.id}`)} className="text-xs text-primary hover:underline mt-1.5 flex items-center gap-1">
                  Ver Deal <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
            {companyDeals.length === 0 && (
              <div className="border border-dashed border-border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Sin deals</p>
              </div>
            )}
          </div>

          {/* Contracts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold">Contratos ({contracts.length})</h3>
              <button className="text-xs text-primary hover:underline flex items-center gap-0.5"><Plus className="w-3 h-3" /> Add</button>
            </div>
            {contracts.map(ct => {
              const st = CONTRACT_STATUS[ct.status]
              return (
                <div key={ct.id} className="border border-border rounded-lg p-3 mb-2">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <p className="text-xs font-medium flex-1">{ct.name}</p>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${st?.color}`}>{st?.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-1.5">{ct.date}</p>
                  <div className="flex gap-2">
                    <button className="text-[10px] text-primary hover:underline">Ver</button>
                    <select value={ct.status} onChange={e => setContracts(p => p.map(c => c.id === ct.id ? { ...c, status: e.target.value } : c))}
                      className="text-[10px] border border-border rounded px-1 bg-background text-muted-foreground">
                      {Object.entries(CONTRACT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <button onClick={() => setContracts(p => p.filter(c => c.id !== ct.id))} className="text-[10px] text-destructive ml-auto">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function DealDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { deals, companies, contacts, updateDeal } = useStore()
  const [editField, setEditField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [contracts, setContracts] = useState([
    { id: 'ct1', name: 'Contrato de servicios', status: 'signed', date: '01 Abr 2026' },
  ])

  const deal = deals.find(d => d.id === id)
  if (!deal) return (
    <div className="flex flex-col h-full">
      <Topbar title="Deal no encontrado" />
      <div className="flex-1 flex items-center justify-center text-muted-foreground">Deal no encontrado</div>
    </div>
  )

  const company = companies.find(c => c.id === deal.company_id)
  const dealContacts = contacts.filter(c => deal.contacts?.includes(c.id))

  const startEdit = (field, value) => { setEditField(field); setEditValue(value || '') }
  const saveEdit = () => { if (editField) updateDeal(id, { [editField]: editValue }); setEditField(null) }

  const INFO_FIELDS = [
    { key: 'owner', label: 'Deal owner' },
    { key: 'type', label: 'Deal Type' },
    { key: 'priority', label: 'Prioridad' },
    { key: 'close_date', label: 'Fecha de cierre' },
    { key: 'pipeline', label: 'Pipeline' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Clientes | Deal"
        actions={<Button size="sm" variant="outline" onClick={() => navigate(-1)} className="text-xs">← Volver</Button>}
      />

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* LEFT */}
        <div className="w-full md:w-[240px] border-b md:border-b-0 md:border-r border-border overflow-y-auto shrink-0 p-5">
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-semibold text-base leading-tight">{deal.name}</h2>
            </div>
            <p className="text-xl font-bold">${deal.amount?.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Cierre: {deal.close_date}</p>
            <span className="inline-block mt-2 text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">{deal.stage}</span>
          </div>

          <div className="flex justify-center gap-1 mb-5">
            <QuickAction icon={<Mail className="w-4 h-4" />} label="Email" onClick={() => {}} />
            <QuickAction icon={<Phone className="w-4 h-4" />} label="Call" onClick={() => {}} />
            <QuickAction icon={<ListTodo className="w-4 h-4" />} label="Task" onClick={() => {}} />
            <QuickAction icon={<Calendar className="w-4 h-4" />} label="Reunión" onClick={() => {}} />
          </div>

          <div>
            <h3 className="text-xs font-semibold mb-3">About this deal</h3>
            <div className="space-y-3">
              {INFO_FIELDS.map(field => (
                <div key={field.key}>
                  <p className="text-[10px] text-muted-foreground mb-0.5">{field.label}</p>
                  {editField === field.key ? (
                    <div className="flex gap-1">
                      <Input value={editValue} onChange={e => setEditValue(e.target.value)} className="h-7 text-xs flex-1"
                        autoFocus onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditField(null) }} />
                      <button onClick={saveEdit} className="text-green-600 px-1"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditField(null)} className="text-muted-foreground px-1"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <button className="text-sm text-left w-full hover:text-primary transition-colors"
                      onClick={() => startEdit(field.key, deal[field.key])}>
                      {deal[field.key] || <span className="text-muted-foreground">—</span>}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER */}
        <div className="flex-1 overflow-y-auto border-r border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Activities</h3>
          <div className="space-y-2">
            {deal.activities?.map((a, i) => (
              <div key={i} className="border border-border rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-base">{a.type === 'meeting' ? '📅' : a.type === 'email' ? '📧' : '📞'}</span>
                  <div>
                    <p className="text-sm font-medium">{a.label}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.date)}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="border border-border rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span>📋</span>
                <div>
                  <p className="text-sm font-medium">Deal creado</p>
                  <p className="text-xs text-muted-foreground">{formatDate(deal.created_at)} · {deal.owner}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full md:w-[240px] overflow-y-auto shrink-0 p-4 space-y-5">
          {/* Contacts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold">Contacts ({dealContacts.length})</h3>
              <button className="text-xs text-primary hover:underline flex items-center gap-0.5"><Plus className="w-3 h-3" /> Add</button>
            </div>
            {dealContacts.map(contact => (
              <div key={contact.id} className="border border-border rounded-lg p-3 mb-2">
                <button className="text-sm text-primary hover:underline font-medium" onClick={() => navigate(`/clients/contacts/${contact.id}`)}>
                  {contact.name}
                </button>
                <p className="text-xs text-muted-foreground">{contact.role}</p>
              </div>
            ))}
            {dealContacts.length === 0 && <div className="border border-dashed border-border rounded-lg p-3 text-center"><p className="text-xs text-muted-foreground">Sin contactos</p></div>}
          </div>

          {/* Company */}
          {company && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold">Companies (1)</h3>
              </div>
              <div className="border border-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: company.avatar_color }}>
                    {getInitials(company.name)}
                  </div>
                  <button className="text-sm text-primary hover:underline font-medium" onClick={() => navigate(`/clients/companies/${company.id}`)}>
                    {company.name}
                  </button>
                  <span className="text-[10px] bg-secondary text-secondary-foreground px-1 py-0.5 rounded ml-auto">Primary</span>
                </div>
                {company.domain && <p className="text-xs text-muted-foreground">{company.domain}</p>}
              </div>
            </div>
          )}

          {/* Contracts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold">Contratos ({contracts.length})</h3>
              <button className="text-xs text-primary hover:underline flex items-center gap-0.5"><Plus className="w-3 h-3" /> Add</button>
            </div>
            {contracts.map(ct => {
              const st = CONTRACT_STATUS[ct.status]
              return (
                <div key={ct.id} className="border border-border rounded-lg p-3 mb-2">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <p className="text-xs font-medium flex-1">{ct.name}</p>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${st?.color}`}>{st?.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-1.5">{ct.date}</p>
                  <div className="flex gap-2 items-center">
                    <button className="text-[10px] text-primary hover:underline">Ver</button>
                    <select value={ct.status} onChange={e => setContracts(p => p.map(c => c.id === ct.id ? { ...c, status: e.target.value } : c))}
                      className="text-[10px] border border-border rounded px-1 bg-background text-muted-foreground">
                      {Object.entries(CONTRACT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <button onClick={() => setContracts(p => p.filter(c => c.id !== ct.id))} className="text-[10px] text-destructive ml-auto">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
