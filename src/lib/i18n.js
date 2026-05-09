// ── NTX Admin i18n ────────────────────────────────────────────
// Usage: import { t } from '../lib/i18n'; t('dashboard.greeting', lang)

export const LANGUAGES = [
  { id: 'es', label: 'Español', flag: '🇵🇪', name: 'Spanish' },
  { id: 'en', label: 'English', flag: '🇺🇸', name: 'Inglés' },
]

export const TRANSLATIONS = {
  // ── Nav ───────────────────────────────────────────────────
  nav: {
    dashboard:     { es: 'Dashboard',      en: 'Dashboard' },
    clients:       { es: 'Clientes',       en: 'Clients' },
    projects:      { es: 'Proyectos',      en: 'Projects' },
    forms:         { es: 'Formularios',    en: 'Forms' },
    messages:      { es: 'Mensajes',       en: 'Messages' },
    contracts:     { es: 'Contratos',      en: 'Contracts' },
    documents:     { es: 'Documentos',     en: 'Documents' },
    agenda:        { es: 'Agenda',         en: 'Agenda' },
    converter:     { es: 'Converter',      en: 'Converter' },
    insights:      { es: 'Insights',       en: 'Insights' },
    marketplace:   { es: 'Marketplace',    en: 'Marketplace' },
    servers:       { es: 'Servidores',     en: 'Servers' },
    proposals:     { es: 'Propuestas',     en: 'Proposals' },
    portals:       { es: 'Portales',       en: 'Portals' },
    notifications: { es: 'Notificaciones', en: 'Notifications' },
    settings:      { es: 'Ajustes',        en: 'Settings' },
  },

  // ── Dashboard ─────────────────────────────────────────────
  dashboard: {
    good_morning:  { es: 'Buenos días',    en: 'Good morning' },
    good_afternoon:{ es: 'Buenas tardes',  en: 'Good afternoon' },
    good_evening:  { es: 'Buenas noches',  en: 'Good evening' },
    revenue:       { es: 'Revenue total',  en: 'Total revenue' },
    active_projects:{ es: 'Proyectos activos', en: 'Active projects' },
    clients:       { es: 'Clientes CRM',   en: 'CRM Clients' },
    pipeline:      { es: 'Deals pipeline', en: 'Deals pipeline' },
    tasks_today:   { es: 'Tareas del día', en: "Today's tasks" },
    recent_activity:{ es: 'Actividad reciente', en: 'Recent activity' },
    add_task:      { es: '+ Nueva tarea...', en: '+ New task...' },
    projects_by_phase:{ es: 'Proyectos por fase', en: 'Projects by phase' },
    latest_deals:  { es: 'Últimos deals',  en: 'Latest deals' },
    see_all:       { es: 'Ver todos',      en: 'See all' },
    pending_payments:{ es: 'proyecto(s) con pago pendiente', en: 'project(s) with pending payment' },
    pending_approvals:{ es: 'fase(s) esperando aprobación', en: 'phase(s) awaiting approval' },
  },

  // ── Common actions ────────────────────────────────────────
  actions: {
    save:          { es: 'Guardar',        en: 'Save' },
    cancel:        { es: 'Cancelar',       en: 'Cancel' },
    delete:        { es: 'Eliminar',       en: 'Delete' },
    edit:          { es: 'Editar',         en: 'Edit' },
    create:        { es: 'Crear',          en: 'Create' },
    send:          { es: 'Enviar',         en: 'Send' },
    copy:          { es: 'Copiar',         en: 'Copy' },
    download:      { es: 'Descargar',      en: 'Download' },
    upload:        { es: 'Subir',          en: 'Upload' },
    preview:       { es: 'Preview',        en: 'Preview' },
    back:          { es: '← Volver',       en: '← Back' },
    new:           { es: 'Nuevo',          en: 'New' },
    add:           { es: 'Agregar',        en: 'Add' },
    close:         { es: 'Cerrar',         en: 'Close' },
    confirm:       { es: 'Confirmar',      en: 'Confirm' },
    search:        { es: 'Buscar...',      en: 'Search...' },
    loading:       { es: 'Cargando...',    en: 'Loading...' },
    no_results:    { es: 'Sin resultados', en: 'No results' },
    optional:      { es: 'opcional',       en: 'optional' },
    required:      { es: 'requerido',      en: 'required' },
  },

  // ── Projects ──────────────────────────────────────────────
  projects: {
    title:         { es: 'PROYECTOS',      en: 'PROJECTS' },
    new:           { es: 'Nuevo proyecto', en: 'New project' },
    phase_1:       { es: 'KICK-OFF',       en: 'KICK-OFF' },
    phase_2:       { es: 'DISEÑO',         en: 'DESIGN' },
    phase_3:       { es: 'DESARROLLO',     en: 'DEVELOPMENT' },
    phase_4:       { es: 'PUBLICACIÓN',    en: 'PUBLICATION' },
    approved:      { es: 'APROBADO',       en: 'APPROVED' },
    pending:       { es: 'PAGO PENDIENTE', en: 'PAYMENT PENDING' },
    in_review:     { es: 'EN REVISIÓN',    en: 'IN REVIEW' },
    locked:        { es: 'BLOQUEADO',      en: 'LOCKED' },
    total:         { es: 'MONTO TOTAL',    en: 'TOTAL AMOUNT' },
    drag_here:     { es: 'Arrastra aquí',  en: 'Drag here' },
    content:       { es: 'CONTENIDO',      en: 'CONTENT' },
    payment:       { es: 'PAGO',           en: 'PAYMENT' },
    approvals:     { es: 'APROBACIONES',   en: 'APPROVALS' },
    server:        { es: 'SERVIDOR',       en: 'SERVER' },
    advance_to:    { es: 'Avanzar a',      en: 'Advance to' },
    paid:          { es: 'PAGADO',         en: 'PAID' },
    pending_lc:    { es: 'PENDIENTE',      en: 'PENDING' },
    confirm_payment:{ es: 'MARCAR COMO PAGADO', en: 'MARK AS PAID' },
    payment_confirmed:{ es: 'Pago confirmado', en: 'Payment confirmed' },
    approve_as_nithrox:{ es: 'Aprobar como Nithrox', en: 'Approve as Nithrox' },
    approve_as_client:{ es: 'Aprobar como cliente', en: 'Approve as client' },
  },

  // ── Contracts ─────────────────────────────────────────────
  contracts: {
    title:         { es: 'CONTRATOS',      en: 'CONTRACTS' },
    new:           { es: 'Nuevo contrato', en: 'New contract' },
    draft:         { es: 'Borrador',       en: 'Draft' },
    sent:          { es: 'Enviado',        en: 'Sent' },
    signed_client: { es: 'Firmado x cliente', en: 'Signed by client' },
    completed:     { es: '✓ Completado',   en: '✓ Completed' },
    send_to_client:{ es: 'Enviar al cliente', en: 'Send to client' },
    sign_nithrox:  { es: 'Firmar Nithrox', en: 'Sign as Nithrox' },
    sign_client:   { es: 'Firma cliente',  en: 'Client signature' },
    certificate:   { es: 'Certificado',    en: 'Certificate' },
    expiry:        { es: 'Vencimiento',    en: 'Expiry' },
    expires_in:    { es: 'Vence en',       en: 'Expires in' },
    expired:       { es: 'VENCIDO',        en: 'EXPIRED' },
  },

  // ── Clients ───────────────────────────────────────────────
  clients: {
    title:         { es: 'CLIENTES',       en: 'CLIENTS' },
    contacts:      { es: 'Contactos',      en: 'Contacts' },
    companies:     { es: 'Empresas',       en: 'Companies' },
    deals:         { es: 'Deals',          en: 'Deals' },
    new_contact:   { es: 'Nuevo contacto', en: 'New contact' },
    new_company:   { es: 'Nueva empresa',  en: 'New company' },
    new_deal:      { es: 'Nuevo deal',     en: 'New deal' },
  },

  // ── Proposals ─────────────────────────────────────────────
  proposals: {
    title:         { es: 'PROPUESTAS',     en: 'PROPOSALS' },
    new:           { es: 'Nueva propuesta',en: 'New proposal' },
    total:         { es: 'Total estimado', en: 'Estimated total' },
    accepted:      { es: 'Aceptada',       en: 'Accepted' },
    sent:          { es: 'Enviada',        en: 'Sent' },
    draft:         { es: 'Borrador',       en: 'Draft' },
    expired:       { es: 'Expirada',       en: 'Expired' },
    services:      { es: 'Servicios',      en: 'Services' },
    add_service:   { es: 'Agregar servicio', en: 'Add service' },
    send_to_client:{ es: 'Enviar al cliente', en: 'Send to client' },
    accept:        { es: 'Aceptar propuesta', en: 'Accept proposal' },
    valid_until:   { es: 'Válida hasta',   en: 'Valid until' },
  },

  // ── Portals ───────────────────────────────────────────────
  portals: {
    title:         { es: 'PORTALES',       en: 'PORTALS' },
    new:           { es: 'Nuevo portal',   en: 'New portal' },
    subdomain:     { es: 'Subdominio',     en: 'Subdomain' },
    branding:      { es: 'Branding',       en: 'Branding' },
    primary_color: { es: 'Color primario', en: 'Primary color' },
    logo:          { es: 'Logo',           en: 'Logo' },
    welcome_message:{ es: 'Mensaje de bienvenida', en: 'Welcome message' },
    active:        { es: 'Activo',         en: 'Active' },
    inactive:      { es: 'Inactivo',       en: 'Inactive' },
    open_portal:   { es: 'Abrir portal',   en: 'Open portal' },
    copy_link:     { es: 'Copiar link',    en: 'Copy link' },
    client:        { es: 'Cliente',        en: 'Client' },
    login_email:   { es: 'Email de acceso',en: 'Login email' },
    login_password:{ es: 'Contraseña',     en: 'Password' },
  },

  // ── Messages ──────────────────────────────────────────────
  messages: {
    title:         { es: 'MENSAJES',       en: 'MESSAGES' },
    new_conversation:{ es: 'Nueva conversación', en: 'New conversation' },
    typing:        { es: 'escribiendo...',  en: 'typing...' },
    online:        { es: 'En línea',       en: 'Online' },
    offline:       { es: 'Offline',        en: 'Offline' },
    send:          { es: 'Enviar',         en: 'Send' },
    schedule:      { es: 'Agendar reunión',en: 'Schedule meeting' },
    view_contact:  { es: 'Ver ficha',      en: 'View contact' },
    call:          { es: 'Llamar',         en: 'Call' },
  },

  // ── Agenda ────────────────────────────────────────────────
  agenda: {
    title:         { es: 'AGENDA',         en: 'AGENDA' },
    new_type:      { es: '+ Nuevo tipo',   en: '+ New type' },
    meeting_types: { es: 'TIPOS DE REUNIÓN', en: 'MEETING TYPES' },
    bookings:      { es: 'RESERVAS',       en: 'BOOKINGS' },
    settings:      { es: 'CONFIGURACIÓN',  en: 'SETTINGS' },
    duration:      { es: 'min',            en: 'min' },
    online:        { es: 'Online',         en: 'Online' },
    phone:         { es: 'Llamada',        en: 'Phone call' },
    physical:      { es: 'Presencial',     en: 'In person' },
    bookings_count:{ es: 'reservas',       en: 'bookings' },
  },

  // ── Settings ──────────────────────────────────────────────
  settings: {
    title:         { es: 'AJUSTES',        en: 'SETTINGS' },
    language:      { es: 'Idioma',         en: 'Language' },
    theme:         { es: 'Apariencia',     en: 'Appearance' },
    dark_mode:     { es: 'Modo oscuro',    en: 'Dark mode' },
    api_keys:      { es: 'API Keys',       en: 'API Keys' },
    profile:       { es: 'Perfil',         en: 'Profile' },
    company:       { es: 'Empresa',        en: 'Company' },
    notifications: { es: 'Notificaciones', en: 'Notifications' },
    save_changes:  { es: 'Guardar cambios',en: 'Save changes' },
  },
}

// ── Translation function ────────────────────────────────────
export function t(key, lang = 'es') {
  const parts = key.split('.')
  let obj = TRANSLATIONS
  for (const part of parts) {
    if (!obj[part]) return key
    obj = obj[part]
  }
  return obj[lang] || obj['es'] || key
}

// ── Hook-compatible getter ──────────────────────────────────
export function useT(lang) {
  return (key) => t(key, lang)
}
