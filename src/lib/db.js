import { supabase } from './supabase'

// ── CRM ──────────────────────────────────────────────────────

export const db = {
  // ── Companies ──────────────────────────────────────────────
  companies: {
    list: () => supabase.from('companies').select('*').order('name'),
    get: (id) => supabase.from('companies').select('*, contacts(*)').eq('id', id).single(),
    create: (data) => supabase.from('companies').insert(data).select().single(),
    update: (id, data) => supabase.from('companies').update({ ...data, last_activity: new Date().toISOString() }).eq('id', id).select().single(),
    delete: (id) => supabase.from('companies').delete().eq('id', id),
  },

  // ── Contacts ───────────────────────────────────────────────
  contacts: {
    list: () => supabase.from('contacts').select('*').order('name'),
    get: (id) => supabase.from('contacts').select('*, companies(*)').eq('id', id).single(),
    create: (data) => supabase.from('contacts').insert(data).select().single(),
    update: (id, data) => supabase.from('contacts').update({ ...data, last_activity: new Date().toISOString() }).eq('id', id).select().single(),
    delete: (id) => supabase.from('contacts').delete().eq('id', id),
    findByEmail: (email) => supabase.from('contacts').select('*').eq('email', email).maybeSingle(),
  },

  // ── Deals ──────────────────────────────────────────────────
  deals: {
    list: () => supabase.from('deals').select('*, companies(id,name,avatar_color)').order('created_at', { ascending: false }),
    get: (id) => supabase.from('deals').select('*').eq('id', id).single(),
    create: (data) => supabase.from('deals').insert(data).select().single(),
    update: (id, data) => supabase.from('deals').update({ ...data, last_activity: new Date().toISOString() }).eq('id', id).select().single(),
    delete: (id) => supabase.from('deals').delete().eq('id', id),
  },

  // ── Projects ───────────────────────────────────────────────
  projects: {
    list: () => supabase.from('projects').select('*, companies(id,name,avatar_color), contacts(id,name)').order('created_at', { ascending: false }),
    get: (id) => supabase.from('projects').select('*, companies(*), contacts(*)').eq('id', id).single(),
    create: (data) => supabase.from('projects').insert(data).select().single(),
    update: (id, data) => supabase.from('projects').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single(),
    delete: (id) => supabase.from('projects').delete().eq('id', id),
    forClient: (contactId) => supabase.from('projects').select('*').eq('contact_id', contactId).single(),
  },

  // ── Conversations + Messages ────────────────────────────────
  conversations: {
    create: (data) => supabase.from('conversations').insert(data).select().single(),
    list: () => supabase
      .from('conversations')
      .select('*, contacts(id,name,avatar_color), companies(id,name), profiles(id,name,email), messages(*)')
      .order('last_at', { ascending: false }),
    get: (id) => supabase
      .from('conversations')
      .select('*, contacts(*), companies(*), messages(*)')
      .eq('id', id)
      .single(),
    forClient: (contactId, userId) => {
      if (contactId) {
        return supabase
          .from('conversations')
          .select('*, messages(*)')
          .eq('contact_id', contactId)
          .maybeSingle()
      }
      return supabase
        .from('conversations')
        .select('*, messages(*)')
        .eq('user_id', userId)
        .maybeSingle()
    },
    update: (id, data) => supabase.from('conversations').update(data).eq('id', id).select().single(),
    delete: (id) => supabase.from('conversations').delete().eq('id', id),
    updateLastMessage: (id, text) => supabase
      .from('conversations')
      .update({ last_message: text, last_at: new Date().toISOString() })
      .eq('id', id),
    incrementUnread: (id, field) => supabase.rpc('increment_unread', { conv_id: id, field_name: field }),
    resetUnread: (id, field) => supabase.from('conversations').update({ [field]: 0 }).eq('id', id),
  },

  messages: {
    listByConversation: (convId) => supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at'),
    send: (data) => supabase.from('messages').insert(data).select().single(),
    softDelete: (id, userId) => supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString(), deleted_by: userId })
      .eq('id', id),
    markClientRead: (convId) => supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', convId)
      .eq('from_role', 'client')
      .is('read_at', null),
    markAdminRead: (convId) => supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', convId)
      .eq('from_role', 'admin')
      .is('read_at', null),
  },

  // ── Contracts ──────────────────────────────────────────────
  contracts: {
    list: () => supabase.from('contracts').select('*, companies(id,name), contacts(id,name), projects(id,name)').order('created_at', { ascending: false }),
    get: (id) => supabase.from('contracts').select('*').eq('id', id).single(),
    create: (data) => supabase.from('contracts').insert(data).select().single(),
    update: (id, data) => supabase.from('contracts').update(data).eq('id', id).select().single(),
    delete: (id) => supabase.from('contracts').delete().eq('id', id),
    forClient: async (contactId, userId) => {
      if (contactId) {
        return supabase.from('contracts').select('*').eq('contact_id', contactId).order('created_at', { ascending: false })
      }
      if (userId) {
        return supabase.from('contracts').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      }
      return { data: [], error: null }
    },
  },

  // ── Proposals ──────────────────────────────────────────────
  proposals: {
    list: () => supabase.from('proposals').select('*, companies(id,name), contacts(id,name)').order('created_at', { ascending: false }),
    get: (id) => supabase.from('proposals').select('*').eq('id', id).single(),
    create: (data) => supabase.from('proposals').insert(data).select().single(),
    update: (id, data) => supabase.from('proposals').update(data).eq('id', id).select().single(),
    delete: (id) => supabase.from('proposals').delete().eq('id', id),
    forClient: (contactId) => supabase.from('proposals').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
  },

  // ── Forms ──────────────────────────────────────────────────
  forms: {
    list: () => supabase.from('forms').select('*, form_responses(count)').order('created_at', { ascending: false }),
    get: (id) => supabase.from('forms').select('*, form_responses(*)').eq('id', id).single(),
    create: (data) => supabase.from('forms').insert(data).select().single(),
    update: (id, data) => supabase.from('forms').update(data).eq('id', id).select().single(),
    delete: (id) => supabase.from('forms').delete().eq('id', id),
    addResponse: (formId, data) => supabase.from('form_responses').insert({ form_id: formId, data }).select().single(),
  },

  // ── Employees ─────────────────────────────────────────────
  employees: {
    list: () => supabase.from('employees').select('*').order('name'),
    create: (data) => supabase.from('employees').insert(data).select().single(),
    update: (id, data) => supabase.from('employees').update(data).eq('id', id).select().single(),
    delete: (id) => supabase.from('employees').delete().eq('id', id),
  },

  // ── Documents ──────────────────────────────────────────────
  documents: {
    list: () => supabase.from('documents').select('*').order('created_at', { ascending: false }),
    listByProject: (projectId) => supabase.from('documents').select('*').eq('project_id', projectId),
    create: (data) => supabase.from('documents').insert(data).select().single(),
    update: (id, data) => supabase.from('documents').update(data).eq('id', id).select().single(),
    delete: (id) => supabase.from('documents').delete().eq('id', id),
  },

  // ── Notifications ──────────────────────────────────────────
  notifications: {
    list: (userId) => supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    markRead: (id) => supabase.from('notifications').update({ read: true }).eq('id', id),
    markAllRead: (userId) => supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false),
    create: (data) => supabase.from('notifications').insert(data).select().single(),
  },

  // ── Portals ────────────────────────────────────────────────
  portals: {
    list: () => supabase.from('portals').select('*, contacts(id,name,email), projects(id,name,phase,phases)').order('created_at', { ascending: false }),
    get: (id) => supabase.from('portals').select('*').eq('id', id).single(),
    create: (data) => supabase.from('portals').insert(data).select().single(),
    update: (id, data) => supabase.from('portals').update(data).eq('id', id).select().single(),
    delete: (id) => supabase.from('portals').delete().eq('id', id),
    forClient: (contactId) => supabase.from('portals').select('*, projects(*)').eq('contact_id', contactId).eq('active', true).single(),
  },

  // ── Servers ────────────────────────────────────────────────
  servers: {
    list: () => supabase.from('servers').select('*').order('name'),
    get: (id) => supabase.from('servers').select('*').eq('id', id).single(),
    create: (data) => supabase.from('servers').insert(data).select().single(),
    update: (id, data) => supabase.from('servers').update(data).eq('id', id).select().single(),
    delete: (id) => supabase.from('servers').delete().eq('id', id),
  },

  // ── App Settings ───────────────────────────────────────────
  settings: {
    get: (key) => supabase.from('app_settings').select('value').eq('key', key).single(),
    set: (key, value) => supabase.from('app_settings').upsert({ key, value }).select().single(),
  },

  // ── Meetings ───────────────────────────────────────────────
  meetings: {
    list: () => supabase.from('meetings').select('*, contacts(id,name), companies(id,name)').order('date').order('time'),
    create: (data) => supabase.from('meetings').insert(data).select().single(),
    update: (id, data) => supabase.from('meetings').update(data).eq('id', id).select().single(),
    forContact: (contactId) => supabase.from('meetings').select('*').eq('contact_id', contactId).order('date'),
  },

  // ── Profiles ───────────────────────────────────────────────
  profiles: {
    get: (id) => supabase.from('profiles').select('*').eq('id', id).single(),
    update: (id, data) => supabase.from('profiles').update(data).eq('id', id).select().single(),
    listAll: () => supabase.from('profiles').select('*').order('name'),
    findByEmail: (email) => supabase.from('profiles').select('*').eq('email', email).maybeSingle(),
    linkContact: (email, contactId) =>
      supabase.from('profiles').update({ contact_id: contactId }).eq('email', email).select().single(),
  },
}
