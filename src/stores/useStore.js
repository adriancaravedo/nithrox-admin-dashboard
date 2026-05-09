import { create } from 'zustand'
import { db } from '../lib/db'
import { BUSINESSES } from '../lib/utils'

// Shape a conversation row + its messages into the format MessagesPage expects
function shapeConversation(conv) {
  const msgs = (conv.messages || []).map(m => ({
    id: m.id,
    from: m.from_role,
    text: m.text,
    at: m.created_at,
  }))
  const last = msgs[msgs.length - 1]
  return {
    id: conv.id,
    company_id: conv.company_id,
    company: conv.companies?.name || '',
    contact: conv.contacts?.name || '',
    avatar_color: conv.contacts?.avatar_color || '#64748b',
    initials: (conv.contacts?.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
    online: false,
    unread: conv.unread_admin || 0,
    last_message: conv.last_message || '',
    last_at: conv.last_at,
    messages: msgs,
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
      contacts: contacts || [],
      companies: companies || [],
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

    const payload = { ...contact, company_id, avatar_color }
    delete payload.new_company_name

    const { data } = await db.contacts.create(payload)
    if (data) set(s => ({ contacts: [...s.contacts, data] }))
    return data
  },

  updateContact: async (id, updates) => {
    const { data } = await db.contacts.update(id, updates)
    if (data) set(s => ({ contacts: s.contacts.map(c => c.id === id ? data : c) }))
  },

  deleteContact: async (id) => {
    await db.contacts.delete(id)
    set(s => ({ contacts: s.contacts.filter(c => c.id !== id) }))
  },

  addCompany: async (company) => {
    const COLORS = ['#7c3aed','#2563eb','#16a34a','#d97706','#dc2626','#0891b2','#64748b']
    const avatar_color = COLORS[Math.floor(Math.random() * COLORS.length)]

    const payload = { ...company, avatar_color, owner: 'Adrian Caravedo' }
    const contactName = payload.new_contact_name
    const contactId = payload.contact_id
    delete payload.new_contact_name
    delete payload.contact_id

    const { data: co } = await db.companies.create(payload)
    if (!co) return

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
    const { data } = await db.companies.update(id, updates)
    if (data) set(s => ({ companies: s.companies.map(c => c.id === id ? data : c) }))
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
    const { data } = await db.projects.create({ ...project, phases: project.phases || {} })
    if (data) set(s => ({ projects: [...s.projects, data] }))
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

  sendMessage: async (conversationId, text, senderId, fromRole = 'admin') => {
    const { data: msg } = await db.messages.send({
      conversation_id: conversationId,
      sender_id: senderId,
      from_role: fromRole,
      text,
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
            messages: [...m.messages, { id: msg.id, from: fromRole, text, at: msg.created_at }],
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

  // Called by Realtime when a new message arrives
  appendRealtimeMessage: (conversationId, msg) => {
    set(s => ({
      messages: s.messages.map(m => m.id === conversationId
        ? {
            ...m,
            messages: [...m.messages, { id: msg.id, from: msg.from_role, text: msg.text, at: msg.created_at }],
            last_message: msg.text,
            last_at: msg.created_at,
            unread: msg.from_role === 'client' ? (m.unread || 0) + 1 : m.unread,
          }
        : m
      ),
    }))
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
    const { data } = await db.forms.list()
    if (data) set({ forms: data.map(f => ({ ...f, responses: f.form_responses || [] })) })
  },

  addForm: async (form) => {
    const { data } = await db.forms.create({ ...form, status: 'draft', views: 0 })
    if (data) set(s => ({ forms: [...s.forms, { ...data, responses: [] }] }))
    return data
  },

  updateForm: async (id, updates) => {
    const { data } = await db.forms.update(id, updates)
    if (data) set(s => ({ forms: s.forms.map(f => f.id === id ? { ...f, ...data } : f) }))
  },

  deleteForm: async (id) => {
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

  // ── Documents ──────────────────────────────────────────────────
  documents: [],

  fetchDocuments: async () => {
    const { data } = await db.documents.list()
    if (data) set({ documents: data })
  },

  addDocument: async (doc) => {
    const { data } = await db.documents.create(doc)
    if (data) set(s => ({ documents: [...s.documents, data] }))
    return data
  },

  updateDocument: async (id, updates) => {
    const { data } = await db.documents.update(id, updates)
    if (data) set(s => ({ documents: s.documents.map(d => d.id === id ? data : d) }))
  },

  deleteDocument: async (id) => {
    await db.documents.delete(id)
    set(s => ({ documents: s.documents.filter(d => d.id !== id) }))
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
