import { create } from 'zustand'
import { db } from '../lib/db'
import { supabase } from '../lib/supabase'
import { BUSINESSES } from '../lib/utils'

// Map custom_fields from DB → custom in the store (so components use contact.custom consistently)
const withCustom = (obj) => obj ? { ...obj, custom: obj.custom_fields || {} } : null

function shapeMsg(m) {
  return {
    id: m.id,
    from: m.from_role,
    text: m.text,
    at: m.created_at,
    read_at: m.read_at || null,
    deleted_at: m.deleted_at || null,
    attachment_url: m.attachment_url || null,
    attachment_name: m.attachment_name || null,
    attachment_type: m.attachment_type || null,
    is_voice_note: m.is_voice_note || false,
    duration_sec: m.duration_sec || 0,
  }
}

function shapeConversation(conv) {
  const displayName = conv.contacts?.name || conv.profiles?.name || conv.client_name || ''
  return {
    id: conv.id,
    company_id: conv.company_id,
    contact_id: conv.contact_id,
    company: conv.companies?.name || '',
    contact: displayName,
    avatar_color: conv.contacts?.avatar_color || '#64748b',
    initials: displayName ? displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?',
    online: false,
    unread: conv.unread_admin || 0,
    last_message: conv.last_message || '',
    last_at: conv.last_at,
    allow_attachments: conv.allow_attachments !== false,
    allow_voice_notes: conv.allow_voice_notes || false,
    messages: (conv.messages || []).map(shapeMsg),
  }
}

export const useStore = create((set, get) => ({
  // ── CRM ──────────────────────────────────────────────────────
  contacts: [],
  companies: [],
  deals: [],

  fetchCRM: async () => {
    const [{ data: contacts }, { data: companies }, { data: deals }] = await Promise.all([
      db.contacts.list(),
      db.companies.list(),
      db.deals.list(),
    ])
    set({
      contacts: (contacts || []).map(withCustom),
      companies: (companies || []).map(withCustom),
      deals: deals || [],
    })
  },

  addContact: async (contact) => {
    const COLORS = ['#7c3aed','#2563eb','#16a34a','#d97706','#dc2626','#0891b2','#64748b']
    const avatar_color = COLORS[Math.floor(Math.random() * COLORS.length)]

    let company_id = contact.company_id

    // Auto-create company if requested
    if (contact.new_company_name && !company_id) {
      const { data: co } = await db.companies.create({
        name: contact.new_company_name, avatar_color,
        owner: 'Adrian Caravedo', lifecycle: 'Lead', lead_status: 'New',
      })
      if (co) {
        company_id = co.id
        set(s => ({ companies: [...s.companies, co] }))
      }
    } else if (company_id) {
      // Touch last_activity on existing company
      db.companies.update(company_id, {})
    }

    // Only send columns that exist in the contacts table
    const payload = {
      name: contact.name,
      email: contact.email || null,
      phone: contact.phone || null,
      role: contact.role || null,
      company_id: company_id || null,
      lead_status: contact.lead_status || 'New',
      preferred_channels: contact.preferred_channels || null,
      topics: contact.topics || null,
      notes: contact.notes || null,
      avatar_color,
      custom_fields: contact.custom || {},
    }

    const { data } = await db.contacts.create(payload)
    const shaped = withCustom(data)
    if (shaped) {
      set(s => ({ contacts: [...s.contacts, shaped] }))
      // Auto-link any portal profile that has this email but no contact_id yet
      if (shaped.email) {
        db.profiles.linkContact(shaped.email, shaped.id).catch(() => {})
      }
    }
    return shaped
  },

  updateContact: async (id, updates) => {
    const dbUpdates = { ...updates }
    if ('custom' in dbUpdates) { dbUpdates.custom_fields = dbUpdates.custom; delete dbUpdates.custom }
    const { data } = await db.contacts.update(id, dbUpdates)
    const shaped = withCustom(data)
    if (shaped) set(s => ({ contacts: s.contacts.map(c => c.id === id ? shaped : c) }))
  },

  deleteContact: async (id) => {
    await db.contacts.delete(id)
    set(s => ({ contacts: s.contacts.filter(c => c.id !== id) }))
  },

  addCompany: async (company) => {
    const COLORS = ['#7c3aed','#2563eb','#16a34a','#d97706','#dc2626','#0891b2','#64748b']
    const avatar_color = COLORS[Math.floor(Math.random() * COLORS.length)]

    const contactName = company.new_contact_name
    const contactId = company.contact_id

    // Only send columns that exist in the companies table
    const payload = {
      name: company.name,
      domain: company.domain || null,
      industry: company.industry || null,
      city: company.city || null,
      country: company.country || 'Perú',
      ruc: company.ruc || null,
      phone: company.phone || null,
      owner: company.owner || 'Adrian Caravedo',
      lifecycle: company.lifecycle || 'Lead',
      lead_status: company.lead_status || 'New',
      avatar_color,
      custom_fields: company.custom || {},
    }

    const { data: rawCo } = await db.companies.create(payload)
    if (!rawCo) return
    const co = withCustom(rawCo)

    set(s => ({ companies: [...s.companies, co] }))

    if (contactName) {
      const { data: ct } = await db.contacts.create({
        name: contactName, company_id: co.id, avatar_color,
        lead_status: 'New',
      })
      if (ct) set(s => ({ contacts: [...s.contacts, ct] }))
    } else if (contactId) {
      await db.contacts.update(contactId, { company_id: co.id })
      set(s => ({ contacts: s.contacts.map(c => c.id === contactId ? { ...c, company_id: co.id } : c) }))
    }
    return co
  },

  updateCompany: async (id, updates) => {
    const dbUpdates = { ...updates }
    if ('custom' in dbUpdates) { dbUpdates.custom_fields = dbUpdates.custom; delete dbUpdates.custom }
    const { data } = await db.companies.update(id, dbUpdates)
    const shaped = withCustom(data)
    if (shaped) set(s => ({ companies: s.companies.map(c => c.id === id ? shaped : c) }))
  },

  deleteCompany: async (id) => {
    await db.companies.delete(id)
    set(s => ({ companies: s.companies.filter(c => c.id !== id) }))
  },

  addDeal: async (deal) => {
    const { data } = await db.deals.create(deal)
    if (data) set(s => ({ deals: [...s.deals, data] }))
    return data
  },

  updateDeal: async (id, updates) => {
    const { data } = await db.deals.update(id, updates)
    if (data) set(s => ({ deals: s.deals.map(d => d.id === id ? data : d) }))
  },

  moveDeal: async (dealId, newStage) => {
    set(s => ({ deals: s.deals.map(d => d.id === dealId ? { ...d, stage: newStage } : d) }))
    await db.deals.update(dealId, { stage: newStage })
  },

  deleteDeal: async (id) => {
    await db.deals.delete(id)
    set(s => ({ deals: s.deals.filter(d => d.id !== id) }))
  },

  // ── Projects ────────────────────────────────────────────────
  projects: [],

  fetchProjects: async () => {
    const { data } = await db.projects.list()
    if (data) set({ projects: data.map(p => ({
      ...p,
      company: p.companies?.name || '',
      contact: p.contacts?.name || '',
    })) })
  },

  addProject: async (project) => {
    const { data } = await db.projects.create({
      name: project.name,
      framework: project.framework || null,
      value: project.value || 0,
      currency: project.currency || 'USD',
      company_id: project.company_id || null,
      contact_id: project.contact_id || null,
      server_id: project.server_id || null,
      phase: 'kickoff',
      phases: project.phases || {},
      tags: project.tags || [],
    })
    if (data) set(s => ({ projects: [...s.projects, { ...data, company: project.company || '', contact: project.contact || '' }] }))
    return data
  },

  updateProject: async (id, updates) => {
    const { data } = await db.projects.update(id, updates)
    if (data) set(s => ({ projects: s.projects.map(p => p.id === id ? { ...p, ...data } : p) }))
  },

  moveProject: async (projectId, newPhase) => {
    set(s => ({ projects: s.projects.map(p => p.id === projectId ? { ...p, phase: newPhase } : p) }))
    await db.projects.update(projectId, { phase: newPhase })
  },

  updateProjectPhase: async (projectId, phaseKey, phaseData) => {
    const project = get().projects.find(p => p.id === projectId)
    if (!project) return
    const updatedPhases = { ...(project.phases || {}), [phaseKey]: { ...(project.phases?.[phaseKey] || {}), ...phaseData } }
    set(s => ({
      projects: s.projects.map(p => p.id === projectId ? { ...p, phases: updatedPhases } : p),
    }))
    await db.projects.update(projectId, { phases: updatedPhases })
  },

  deleteProject: async (id) => {
    await db.projects.delete(id)
    set(s => ({ projects: s.projects.filter(p => p.id !== id) }))
  },

  // ── Servers ──────────────────────────────────────────────────
  servers: [],

  fetchServers: async () => {
    const { data } = await db.servers.list()
    if (data) set({ servers: data })
  },

  addServer: async (server) => {
    const { data } = await db.servers.create(server)
    if (data) set(s => ({ servers: [...s.servers, data] }))
    return data
  },

  updateServer: async (id, updates) => {
    const { data } = await db.servers.update(id, updates)
    if (data) set(s => ({ servers: s.servers.map(sv => sv.id === id ? data : sv) }))
  },

  // ── Messages (conversations) ──────────────────────────────────
  messages: [],

  fetchMessages: async () => {
    const { data } = await db.conversations.list()
    if (data) set({ messages: data.map(shapeConversation) })
  },

  sendMessage: async (conversationId, text, senderId, fromRole = 'admin', extra = {}) => {
    const { data: msg } = await db.messages.send({
      conversation_id: conversationId,
      sender_id: senderId,
      from_role: fromRole,
      text,
      ...extra,
    })
    if (!msg) return

    await db.conversations.updateLastMessage(conversationId, text)
    if (fromRole === 'admin') {
      await db.conversations.resetUnread(conversationId, 'unread_admin')
    }

    set(s => ({
      messages: s.messages.map(m => m.id === conversationId
        ? {
            ...m,
            messages: [...m.messages, shapeMsg(msg)],
            last_message: text,
            last_at: msg.created_at,
            unread: fromRole === 'admin' ? 0 : m.unread,
          }
        : m
      ),
    }))
    return msg
  },

  markRead: async (conversationId) => {
    await db.conversations.resetUnread(conversationId, 'unread_admin')
    set(s => ({ messages: s.messages.map(m => m.id === conversationId ? { ...m, unread: 0 } : m) }))
  },

  createConversation: async (contact, company) => {
    const { data: conv } = await db.conversations.create({
      contact_id: contact.id,
      company_id: contact.company_id || null,
      last_message: 'Conversación iniciada',
      last_at: new Date().toISOString(),
    })
    if (!conv) return null
    const { data: full } = await db.conversations.get(conv.id)
    if (!full) return null
    const shaped = shapeConversation({ ...full, contacts: contact, companies: company })
    set(s => ({ messages: [shaped, ...s.messages] }))
    return shaped
  },

  fetchAndAppendConversation: async (convId) => {
    const { data } = await db.conversations.get(convId)
    if (!data) return
    const shaped = shapeConversation(data)
    set(s => {
      if (s.messages.find(m => m.id === convId)) return s
      return { messages: [shaped, ...s.messages] }
    })
  },

  addOrRefreshConversation: (rawConv) => {
    const shaped = shapeConversation(rawConv)
    set(s => {
      const exists = s.messages.find(m => m.id === shaped.id)
      if (exists) {
        return { messages: s.messages.map(m => m.id === shaped.id ? { ...m, ...shaped } : m) }
      }
      return { messages: [shaped, ...s.messages] }
    })
  },

  appendRealtimeMessage: (conversationId, msg) => {
    set(s => ({
      messages: s.messages.map(m => m.id === conversationId
        ? {
            ...m,
            messages: [...m.messages, shapeMsg(msg)],
            last_message: msg.text,
            last_at: msg.created_at,
            unread: msg.from_role === 'client' ? (m.unread || 0) + 1 : m.unread,
          }
        : m
      ),
    }))
  },

  updateMessageReadAt: (conversationId, msgId, readAt) => {
    set(s => ({
      messages: s.messages.map(m => m.id === conversationId
        ? { ...m, messages: m.messages.map(msg => msg.id === msgId ? { ...msg, read_at: readAt } : msg) }
        : m
      ),
    }))
  },

  deleteMessage: async (msgId, userId, conversationId) => {
    await db.messages.softDelete(msgId, userId)
    const now = new Date().toISOString()
    set(s => ({
      messages: s.messages.map(m => m.id === conversationId
        ? { ...m, messages: m.messages.map(msg => msg.id === msgId ? { ...msg, deleted_at: now } : msg) }
        : m
      ),
    }))
  },

  updateConversationSettings: async (convId, settings) => {
    await db.conversations.update(convId, settings)
    set(s => ({
      messages: s.messages.map(m => m.id === convId ? { ...m, ...settings } : m),
    }))
  },

  deleteConversation: async (convId) => {
    await db.conversations.delete(convId)
    set(s => ({ messages: s.messages.filter(m => m.id !== convId) }))
  },

  // ── Chat settings (admin profile + global config) ─────────────
  chatSettings: {},

  fetchChatSettings: async () => {
    const { data } = await db.settings.get('chat')
    if (data?.value) set({ chatSettings: data.value })
  },

  saveChatSettings: async (settings) => {
    await db.settings.set('chat', settings)
    set({ chatSettings: settings })
  },

  // ── Meetings ──────────────────────────────────────────────────
  meetings: [],

  fetchMeetings: async () => {
    const { data } = await db.meetings.list()
    if (data) set({ meetings: data })
  },

  addMeeting: async (meeting) => {
    const { data } = await db.meetings.create(meeting)
    if (data) set(s => ({ meetings: [...s.meetings, data] }))
    return data
  },

  updateMeeting: async (id, updates) => {
    const { data } = await db.meetings.update(id, updates)
    if (data) set(s => ({ meetings: s.meetings.map(m => m.id === id ? data : m) }))
    return data
  },

  // ── Notifications ─────────────────────────────────────────────
  notifications: [],

  fetchNotifications: async (userId) => {
    const { data } = await db.notifications.list(userId)
    if (data) set({ notifications: data.map(n => ({ ...n, at: n.created_at })) })
  },

  markNotifRead: async (id) => {
    await db.notifications.markRead(id)
    set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) }))
  },

  markAllRead: async (userId) => {
    await db.notifications.markAllRead(userId)
    set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) }))
  },

  // ── Forms ──────────────────────────────────────────────────────
  forms: [],

  fetchForms: async () => {
    let localForms = []
    try { localForms = JSON.parse(localStorage.getItem('ntx_forms') || '[]') } catch {}
    const { data } = await db.forms.list()
    const remoteForms = data ? data.map(f => ({ ...f, responses: f.form_responses || [] })) : []
    // Merge: remote forms take priority; local-only forms are appended
    const remoteIds = new Set(remoteForms.map(f => f.id))
    const localOnly = localForms.filter(f => !remoteIds.has(f.id))
    set({ forms: [...remoteForms, ...localOnly] })
  },

  addForm: async (form) => {
    const { data } = await db.forms.create({ ...form, status: 'draft', views: 0 })
    if (data) {
      set(s => ({ forms: [...s.forms, { ...data, responses: [] }] }))
      return data
    }
    // Supabase unavailable — fall back to localStorage
    const localForm = {
      ...form,
      id: `local_${Date.now()}`,
      status: 'draft',
      views: 0,
      responses: [],
      created_at: new Date().toISOString(),
    }
    set(s => ({ forms: [...s.forms, localForm] }))
    try {
      const stored = JSON.parse(localStorage.getItem('ntx_forms') || '[]')
      localStorage.setItem('ntx_forms', JSON.stringify([...stored, localForm]))
    } catch {}
    return localForm
  },

  updateForm: async (id, updates) => {
    if (String(id).startsWith('local_')) {
      set(s => {
        const updatedForms = s.forms.map(f => f.id === id ? { ...f, ...updates } : f)
        try { localStorage.setItem('ntx_forms', JSON.stringify(updatedForms.filter(f => String(f.id).startsWith('local_')))) } catch {}
        return { forms: updatedForms }
      })
      return
    }
    const { data } = await db.forms.update(id, updates)
    if (data) set(s => ({ forms: s.forms.map(f => f.id === id ? { ...f, ...data } : f) }))
    else set(s => ({ forms: s.forms.map(f => f.id === id ? { ...f, ...updates } : f) }))
  },

  deleteForm: async (id) => {
    if (String(id).startsWith('local_')) {
      set(s => {
        const updatedForms = s.forms.filter(f => f.id !== id)
        try { localStorage.setItem('ntx_forms', JSON.stringify(updatedForms.filter(f => String(f.id).startsWith('local_')))) } catch {}
        return { forms: updatedForms }
      })
      return
    }
    await db.forms.delete(id)
    set(s => ({ forms: s.forms.filter(f => f.id !== id) }))
  },

  addFormResponse: async (formId, response) => {
    const { data } = await db.forms.addResponse(formId, response)
    if (data) {
      set(s => ({
        forms: s.forms.map(f => f.id === formId
          ? { ...f, responses: [...(f.responses || []), data], views: f.views + 1 }
          : f
        ),
      }))
    }
    return data
  },

  // ── Employees ─────────────────────────────────────────────────
  employees: (() => { try { return JSON.parse(localStorage.getItem('ntx_employees') || '[]') } catch { return [] } })(),

  fetchEmployees: async () => {
    let local = []
    try { local = JSON.parse(localStorage.getItem('ntx_employees') || '[]') } catch {}
    const { data } = await db.employees.list()
    if (data && data.length > 0) {
      set({ employees: data })
      localStorage.setItem('ntx_employees', JSON.stringify(data))
    } else if (local.length > 0) {
      set({ employees: local })
    }
  },

  addEmployee: async (emp) => {
    const { data } = await db.employees.create(emp)
    if (data) {
      set(s => {
        const next = [...s.employees, data]
        localStorage.setItem('ntx_employees', JSON.stringify(next))
        return { employees: next }
      })
      return data
    }
    const local = { ...emp, id: `local_${Date.now()}`, created_at: new Date().toISOString() }
    set(s => {
      const next = [local, ...s.employees]
      localStorage.setItem('ntx_employees', JSON.stringify(next))
      return { employees: next }
    })
    return local
  },

  updateEmployee: async (id, updates) => {
    if (!String(id).startsWith('local_')) {
      const { data } = await db.employees.update(id, updates)
      if (data) {
        set(s => {
          const next = s.employees.map(e => e.id === id ? data : e)
          localStorage.setItem('ntx_employees', JSON.stringify(next))
          return { employees: next }
        })
        return
      }
    }
    set(s => {
      const next = s.employees.map(e => e.id === id ? { ...e, ...updates } : e)
      localStorage.setItem('ntx_employees', JSON.stringify(next))
      return { employees: next }
    })
  },

  deleteEmployee: async (id) => {
    if (!String(id).startsWith('local_')) await db.employees.delete(id)
    set(s => {
      const next = s.employees.filter(e => e.id !== id)
      localStorage.setItem('ntx_employees', JSON.stringify(next))
      return { employees: next }
    })
  },

  // ── Documents ──────────────────────────────────────────────────
  documents: (() => { try { return JSON.parse(localStorage.getItem('ntx_documents') || '[]') } catch { return [] } })(),

  fetchDocuments: async () => {
    let local = []
    try { local = JSON.parse(localStorage.getItem('ntx_documents') || '[]') } catch {}
    const { data } = await db.documents.list()
    if (data && data.length > 0) {
      set({ documents: data })
      localStorage.setItem('ntx_documents', JSON.stringify(data))
    } else if (local.length > 0) {
      set({ documents: local })
    }
  },

  addDocument: async (doc) => {
    const { data } = await db.documents.create(doc)
    if (data) {
      set(s => {
        const next = [...s.documents, data]
        localStorage.setItem('ntx_documents', JSON.stringify(next))
        return { documents: next }
      })
      return data
    }
    const local = { ...doc, id: `local_${Date.now()}`, created_at: new Date().toISOString() }
    set(s => {
      const next = [...s.documents, local]
      localStorage.setItem('ntx_documents', JSON.stringify(next))
      return { documents: next }
    })
    return local
  },

  updateDocument: async (id, updates) => {
    if (!String(id).startsWith('local_')) {
      const { data } = await db.documents.update(id, updates)
      if (data) {
        set(s => {
          const next = s.documents.map(d => d.id === id ? data : d)
          localStorage.setItem('ntx_documents', JSON.stringify(next))
          return { documents: next }
        })
        return
      }
    }
    set(s => {
      const next = s.documents.map(d => d.id === id ? { ...d, ...updates } : d)
      localStorage.setItem('ntx_documents', JSON.stringify(next))
      return { documents: next }
    })
  },

  deleteDocument: async (id) => {
    if (!String(id).startsWith('local_')) await db.documents.delete(id)
    set(s => {
      const next = s.documents.filter(d => d.id !== id)
      localStorage.setItem('ntx_documents', JSON.stringify(next))
      return { documents: next }
    })
  },

  // ── Proposals ──────────────────────────────────────────────────
  proposals: [],

  fetchProposals: async () => {
    const { data } = await db.proposals.list()
    if (data) set({ proposals: data })
  },

  addProposal: async (p) => {
    const { data } = await db.proposals.create({ ...p, status: 'draft', views: 0, accepted: false })
    if (data) set(s => ({ proposals: [...s.proposals, data] }))
    return data
  },

  updateProposal: async (id, updates) => {
    const { data } = await db.proposals.update(id, updates)
    if (data) set(s => ({ proposals: s.proposals.map(prop => prop.id === id ? data : prop) }))
  },

  deleteProposal: async (id) => {
    await db.proposals.delete(id)
    set(s => ({ proposals: s.proposals.filter(p => p.id !== id) }))
  },

  // ── Contracts ──────────────────────────────────────────────────
  contracts: [],

  fetchContracts: async () => {
    const { data } = await db.contracts.list()
    if (data) set({ contracts: data })
  },

  addContract: async (contract) => {
    const { data } = await db.contracts.create({ ...contract, status: 'draft' })
    if (data) set(s => ({ contracts: [...s.contracts, data] }))
    return data
  },

  updateContract: async (id, updates) => {
    const { data } = await db.contracts.update(id, updates)
    if (data) set(s => ({ contracts: s.contracts.map(c => c.id === id ? data : c) }))
  },

  deleteContract: async (id) => {
    await db.contracts.delete(id)
    set(s => ({ contracts: s.contracts.filter(c => c.id !== id) }))
  },

  // ── Orders (from store) ─────────────────────────────────────
  orders: [],

  fetchOrders: async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, plan_id, plan_name, total_pen, status, payment_method, client_name, client_email, client_phone, payment_id, created_at, validated_at, items')
      .order('created_at', { ascending: false })
      .limit(500)
    if (data) set({ orders: data })
  },

  // ── Portals ────────────────────────────────────────────────────
  portals: [],

  fetchPortals: async () => {
    const { data } = await db.portals.list()
    if (data) set({ portals: data })
  },

  addPortal: async (p) => {
    const { data } = await db.portals.create({ ...p, active: true })
    if (data) set(s => ({ portals: [...s.portals, data] }))
    return data
  },

  updatePortal: async (id, updates) => {
    const { data } = await db.portals.update(id, updates)
    if (data) set(s => ({ portals: s.portals.map(pt => pt.id === id ? data : pt) }))
  },

  deletePortal: async (id) => {
    await db.portals.delete(id)
    set(s => ({ portals: s.portals.filter(p => p.id !== id) }))
  },

  // ── Team (profiles) ────────────────────────────────────────────
  team: [],

  fetchTeam: async () => {
    const { data } = await db.profiles.listAll()
    if (data) set({ team: data })
  },

  addTeamMember: (member) => set(s => ({ team: [...s.team, { ...member, id: `u${Date.now()}` }] })),
  updateTeamMember: (id, data) => set(s => ({ team: s.team.map(m => m.id === id ? { ...m, ...data } : m) })),
  deleteTeamMember: (id) => set(s => ({ team: s.team.filter(m => m.id !== id) })),

  // ── Language ───────────────────────────────────────────────────
  language: localStorage.getItem('ntx_lang') || 'es',
  setLanguage: (lang) => { localStorage.setItem('ntx_lang', lang); set({ language: lang }) },

  // ── Business switcher ──────────────────────────────────────────
  currentBusiness: 'nithrox',
  setBusiness: (biz) => set({ currentBusiness: biz }),
}))
