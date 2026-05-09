import { create } from 'zustand'
import {
  DEMO_CONTACTS, DEMO_COMPANIES, DEMO_DEALS,
  DEMO_PROJECTS, DEMO_SERVERS, DEMO_MESSAGES,
  DEMO_NOTIFICATIONS, DEMO_TEAM
} from '../lib/demo-data'

export const useStore = create((set, get) => ({
  // ── CRM ──────────────────────────────────────────────
  contacts: DEMO_CONTACTS,
  companies: DEMO_COMPANIES,
  deals: DEMO_DEALS,

  // addContact — if company_name provided but no company_id, auto-create the company
  addContact: (contact) => {
    const newId = `c${Date.now()}`
    const COLORS = ['#7c3aed','#2563eb','#16a34a','#d97706','#dc2626','#0891b2','#7c3aed','#64748b']
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    set(s => {
      let companyId = contact.company_id
      let newCompanies = s.companies

      // Auto-create company if new_company_name provided
      if (contact.new_company_name && !companyId) {
        const coId = `co${Date.now()}`
        companyId = coId
        const newCo = {
          id: coId, name: contact.new_company_name, domain: '', industry: '',
          city: '', country: 'Perú', ruc: '', phone: '',
          owner: 'Adrian Caravedo', lifecycle: 'Lead', lead_status: 'New',
          created_at: new Date().toISOString(), last_activity: new Date().toISOString(),
          contacts: [newId], deals: [], avatar_color: color,
        }
        newCompanies = [...s.companies, newCo]
      } else if (companyId) {
        // Link contact to existing company
        newCompanies = s.companies.map(co =>
          co.id === companyId ? { ...co, contacts: [...(co.contacts || []), newId] } : co
        )
      }

      const newContact = {
        ...contact, id: newId, company_id: companyId,
        created_at: new Date().toISOString(), last_activity: new Date().toISOString(),
        deals: [], avatar_color: color,
      }
      delete newContact.new_company_name
      return { contacts: [...s.contacts, newContact], companies: newCompanies }
    })
  },
  updateContact: (id, data) => set(s => ({ contacts: s.contacts.map(c => c.id === id ? { ...c, ...data } : c) })),
  deleteContact: (id) => set(s => ({ contacts: s.contacts.filter(c => c.id !== id) })),

  // addCompany — if new_contact_name provided, auto-create the contact
  addCompany: (company) => {
    const newId = `co${Date.now()}`
    const COLORS = ['#7c3aed','#2563eb','#16a34a','#d97706','#dc2626','#0891b2','#64748b']
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    set(s => {
      let newContacts = s.contacts
      let contactIds = []

      // Link existing contact
      if (company.contact_id) {
        contactIds = [company.contact_id]
        newContacts = s.contacts.map(c =>
          c.id === company.contact_id ? { ...c, company_id: newId } : c
        )
      }

      // Auto-create new contact
      if (company.new_contact_name) {
        const cId = `c${Date.now() + 1}`
        contactIds = [cId]
        const newContact = {
          id: cId, name: company.new_contact_name, email: '', phone: '', role: '',
          company_id: newId, lead_status: 'New', preferred_channels: '', topics: '',
          created_at: new Date().toISOString(), last_activity: new Date().toISOString(),
          deals: [], avatar_color: color, notes: '',
        }
        newContacts = [...s.contacts, newContact]
      }

      const newCompany = {
        ...company, id: newId, contacts: contactIds, deals: [],
        created_at: new Date().toISOString(), last_activity: new Date().toISOString(),
        avatar_color: color, owner: 'Adrian Caravedo',
      }
      delete newCompany.new_contact_name
      delete newCompany.contact_id
      return { companies: [...s.companies, newCompany], contacts: newContacts }
    })
  },
  updateCompany: (id, data) => set(s => ({ companies: s.companies.map(c => c.id === id ? { ...c, ...data } : c) })),
  deleteCompany: (id) => set(s => ({ companies: s.companies.filter(c => c.id !== id) })),

  addDeal: (deal) => set(s => ({ deals: [...s.deals, { ...deal, id: `d${Date.now()}`, created_at: new Date().toISOString(), last_activity: new Date().toISOString(), activities: [] }] })),
  updateDeal: (id, data) => set(s => ({ deals: s.deals.map(d => d.id === id ? { ...d, ...data } : d) })),
  moveDeal: (dealId, newStage) => set(s => ({ deals: s.deals.map(d => d.id === dealId ? { ...d, stage: newStage, last_activity: new Date().toISOString() } : d) })),
  deleteDeal: (id) => set(s => ({ deals: s.deals.filter(d => d.id !== id) })),

  // ── Projects ──────────────────────────────────────────
  projects: DEMO_PROJECTS,
  addProject: (project) => set(s => ({ projects: [...s.projects, { ...project, id: `pr${Date.now()}`, phase: 'kickoff' }] })),
  updateProject: (id, data) => set(s => ({ projects: s.projects.map(p => p.id === id ? { ...p, ...data } : p) })),
  moveProject: (projectId, newPhase) => set(s => ({ projects: s.projects.map(p => p.id === projectId ? { ...p, phase: newPhase } : p) })),
  updateProjectPhase: (projectId, phaseKey, data) => set(s => ({
    projects: s.projects.map(p => p.id === projectId
      ? { ...p, phases: { ...p.phases, [phaseKey]: { ...p.phases[phaseKey], ...data } } }
      : p
    )
  })),

  // ── Servers ──────────────────────────────────────────
  servers: DEMO_SERVERS,
  addServer: (server) => set(s => ({ servers: [...s.servers, { ...server, id: `sv${Date.now()}` }] })),
  updateServer: (id, data) => set(s => ({ servers: s.servers.map(sv => sv.id === id ? { ...sv, ...data } : sv) })),

  // ── Messages ─────────────────────────────────────────
  messages: DEMO_MESSAGES,
  sendMessage: (conversationId, text) => set(s => ({
    messages: s.messages.map(m => m.id === conversationId
      ? { ...m, messages: [...m.messages, { id: Date.now().toString(), from: 'admin', text, at: new Date().toISOString() }], last_message: text, last_at: new Date().toISOString() }
      : m
    )
  })),
  markRead: (conversationId) => set(s => ({ messages: s.messages.map(m => m.id === conversationId ? { ...m, unread: 0 } : m) })),

  // ── Notifications ─────────────────────────────────────
  notifications: DEMO_NOTIFICATIONS,
  markNotifRead: (id) => set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
  markAllRead: () => set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) })),

  // ── Team ─────────────────────────────────────────────
  team: DEMO_TEAM,
  addTeamMember: (member) => set(s => ({ team: [...s.team, { ...member, id: `u${Date.now()}` }] })),
  updateTeamMember: (id, data) => set(s => ({ team: s.team.map(m => m.id === id ? { ...m, ...data } : m) })),
  deleteTeamMember: (id) => set(s => ({ team: s.team.filter(m => m.id !== id) })),

  // ── Forms (Typeform-like) ─────────────────────────────
  forms: [],
  addForm: (form) => set(s => ({ forms: [...s.forms, { ...form, id: `frm${Date.now()}`, created_at: new Date().toISOString(), responses: [], views: 0, status: 'draft' }] })),
  updateForm: (id, data) => set(s => ({ forms: s.forms.map(f => f.id === id ? { ...f, ...data } : f) })),
  deleteForm: (id) => set(s => ({ forms: s.forms.filter(f => f.id !== id) })),
  addFormResponse: (formId, response) => set(s => ({
    forms: s.forms.map(f => f.id === formId
      ? { ...f, responses: [...f.responses, { ...response, id: `r${Date.now()}`, submitted_at: new Date().toISOString() }], views: f.views + 1 }
      : f
    )
  })),

  // ── Documents (Google Drive style) ────────────────────
  documents: [],
  addDocument: (doc) => set(s => ({ documents: [...s.documents, { ...doc, id: `doc${Date.now()}`, created_at: new Date().toISOString() }] })),
  updateDocument: (id, data) => set(s => ({ documents: s.documents.map(d => d.id === id ? { ...d, ...data } : d) })),
  deleteDocument: (id) => set(s => ({ documents: s.documents.filter(d => d.id !== id) })),


  // ── Proposals ─────────────────────────────────────────────
  proposals: [],
  addProposal: (p) => set(s => ({ proposals: [...s.proposals, { ...p, id: `prop${Date.now()}`, created_at: new Date().toISOString(), status: 'draft', views: 0, accepted: false }] })),
  updateProposal: (id, data) => set(s => ({ proposals: s.proposals.map(prop => prop.id === id ? { ...prop, ...data } : prop) })),
  deleteProposal: (id) => set(s => ({ proposals: s.proposals.filter(p => p.id !== id) })),

  // ── Client Portals ─────────────────────────────────────────
  portals: [],
  addPortal: (p) => set(s => ({ portals: [...s.portals, { ...p, id: `portal${Date.now()}`, created_at: new Date().toISOString(), active: true }] })),
  updatePortal: (id, data) => set(s => ({ portals: s.portals.map(pt => pt.id === id ? { ...pt, ...data } : pt) })),
  deletePortal: (id) => set(s => ({ portals: s.portals.filter(p => p.id !== id) })),

  // ── Language ───────────────────────────────────────────────
  language: localStorage.getItem('ntx_lang') || 'es',
  setLanguage: (lang) => { localStorage.setItem('ntx_lang', lang); set({ language: lang }) },

  // ── Business switcher ────────────────────────────────────
  currentBusiness: 'nithrox',
  setBusiness: (biz) => set({ currentBusiness: biz }),
}))
