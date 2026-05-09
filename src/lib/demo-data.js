// ── Demo seed data ────────────────────────────────────────────────────────────

export const DEMO_CONTACTS = [
  {
    id: 'c1', name: 'María Quispe', email: 'maria@fashionco.pe',
    phone: '+51 999 111 222', role: 'CEO', company_id: 'co1',
    lead_status: 'Open Deal', preferred_channels: 'Email', topics: 'Moda, E-commerce',
    created_at: '2026-03-15T10:00:00Z', last_activity: '2026-04-21T14:30:00Z',
    notes: 'Cliente principal de Fashion Co. Muy involucrada en el diseño.',
    deals: ['d1'], avatar_color: '#7c3aed',
  },
  {
    id: 'c2', name: 'Luis Vera', email: 'luis@techpe.com',
    phone: '+51 999 333 444', role: 'CTO', company_id: 'co2',
    lead_status: 'In Progress', preferred_channels: 'Email, Slack', topics: 'SaaS, Tech',
    created_at: '2026-02-10T08:00:00Z', last_activity: '2026-04-20T09:00:00Z',
    notes: 'Muy técnico, prefiere comunicación por email.',
    deals: ['d2'], avatar_color: '#2563eb',
  },
  {
    id: 'c3', name: 'Jorge Mar', email: 'jorge@cevicheria.pe',
    phone: '+51 999 555 666', role: 'Dueño', company_id: 'co3',
    lead_status: 'Connected', preferred_channels: 'WhatsApp', topics: 'Restaurante',
    created_at: '2026-01-20T12:00:00Z', last_activity: '2026-04-18T16:00:00Z',
    notes: 'Prefiere comunicación por WhatsApp. Cliente satisfecho.',
    deals: ['d3'], avatar_color: '#16a34a',
  },
  {
    id: 'c4', name: 'Pedro Salas', email: 'pedro@casasdelsur.pe',
    phone: '+51 999 777 888', role: 'Gerente Comercial', company_id: 'co4',
    lead_status: 'Open', preferred_channels: 'Email', topics: 'Inmobiliaria',
    created_at: '2026-03-01T10:00:00Z', last_activity: '2026-04-15T11:00:00Z',
    notes: 'Pendiente firma de NDA.',
    deals: ['d4'], avatar_color: '#d97706',
  },
  {
    id: 'c5', name: 'Ana García', email: 'ana@casasdelsur.pe',
    phone: '+51 999 777 999', role: 'Asistente', company_id: 'co4',
    lead_status: 'New', preferred_channels: 'Email', topics: 'Inmobiliaria',
    created_at: '2026-03-01T10:00:00Z', last_activity: '2026-04-10T10:00:00Z',
    notes: 'Contacto secundario de Casas del Sur.',
    deals: [], avatar_color: '#d97706',
  },
  {
    id: 'c6', name: 'Carlos Founders', email: 'founders@xyz.io',
    phone: '+51 999 000 111', role: 'Co-founder', company_id: 'co5',
    lead_status: 'New', preferred_channels: 'Email', topics: 'Tech, Startups',
    created_at: '2026-04-01T10:00:00Z', last_activity: '2026-04-21T08:00:00Z',
    notes: 'Lead reciente, evaluar propuesta.',
    deals: ['d5'], avatar_color: '#64748b',
  },
]

export const DEMO_COMPANIES = [
  {
    id: 'co1', name: 'Fashion Co.', domain: 'fashionco.pe',
    industry: 'Moda', city: 'Lima', country: 'Perú',
    ruc: '20123456789', phone: '+51 999 111 222',
    owner: 'Adrian Caravedo', lifecycle: 'Customer', lead_status: 'Open Deal',
    created_at: '2026-03-15T10:00:00Z', last_activity: '2026-04-21T14:30:00Z',
    contacts: ['c1'], deals: ['d1'], avatar_color: '#7c3aed',
  },
  {
    id: 'co2', name: 'TechPe', domain: 'techpe.com',
    industry: 'Tecnología', city: 'Lima', country: 'Perú',
    ruc: '20987654321', phone: '+51 999 333 444',
    owner: 'Adrian Caravedo', lifecycle: 'Customer', lead_status: 'In Progress',
    created_at: '2026-02-10T08:00:00Z', last_activity: '2026-04-20T09:00:00Z',
    contacts: ['c2'], deals: ['d2'], avatar_color: '#2563eb',
  },
  {
    id: 'co3', name: 'Cevichería Mar', domain: 'cevicheria.pe',
    industry: 'Restaurante', city: 'Miraflores', country: 'Perú',
    ruc: '20111222333', phone: '+51 999 555 666',
    owner: 'Adrian Caravedo', lifecycle: 'Customer', lead_status: 'Connected',
    created_at: '2026-01-20T12:00:00Z', last_activity: '2026-04-18T16:00:00Z',
    contacts: ['c3'], deals: ['d3'], avatar_color: '#16a34a',
  },
  {
    id: 'co4', name: 'Casas del Sur', domain: 'casasdelsur.pe',
    industry: 'Inmobiliaria', city: 'Surco', country: 'Perú',
    ruc: '20444555666', phone: '+51 999 777 888',
    owner: 'Adrian Caravedo', lifecycle: 'Opportunity', lead_status: 'Open',
    created_at: '2026-03-01T10:00:00Z', last_activity: '2026-04-15T11:00:00Z',
    contacts: ['c4', 'c5'], deals: ['d4'], avatar_color: '#d97706',
  },
  {
    id: 'co5', name: 'Startup XYZ', domain: 'xyz.io',
    industry: 'Tecnología', city: 'San Isidro', country: 'Perú',
    ruc: '', phone: '+51 999 000 111',
    owner: 'Adrian Caravedo', lifecycle: 'Lead', lead_status: 'New',
    created_at: '2026-04-01T10:00:00Z', last_activity: '2026-04-21T08:00:00Z',
    contacts: ['c6'], deals: ['d5'], avatar_color: '#64748b',
  },
]

export const DEMO_DEALS = [
  {
    id: 'd1', name: 'Tienda Moda Lima + App',
    amount: 18500, currency: 'USD', stage: 'negotiation',
    close_date: '2026-05-15', pipeline: 'Sales Pipeline',
    owner: 'Adrian Caravedo', type: 'New Business', priority: 'High',
    company_id: 'co1', contacts: ['c1'],
    created_at: '2026-03-15T10:00:00Z', last_activity: '2026-04-21T14:30:00Z',
    activities: [
      { type: 'meeting', label: 'Kick off inicial', date: '2026-03-20T10:00:00Z' },
      { type: 'email', label: 'Propuesta enviada', date: '2026-03-25T09:00:00Z' },
      { type: 'call', label: 'Llamada de seguimiento', date: '2026-04-10T11:00:00Z' },
    ],
  },
  {
    id: 'd2', name: 'Landing SaaS + Integración',
    amount: 9200, currency: 'USD', stage: 'proposal',
    close_date: '2026-04-30', pipeline: 'Sales Pipeline',
    owner: 'Adrian Caravedo', type: 'New Business', priority: 'High',
    company_id: 'co2', contacts: ['c2'],
    created_at: '2026-02-10T08:00:00Z', last_activity: '2026-04-20T09:00:00Z',
    activities: [
      { type: 'email', label: 'Primer contacto', date: '2026-02-12T09:00:00Z' },
      { type: 'meeting', label: 'Demo del producto', date: '2026-02-20T10:00:00Z' },
    ],
  },
  {
    id: 'd3', name: 'App Restaurante',
    amount: 3800, currency: 'USD', stage: 'won',
    close_date: '2026-02-28', pipeline: 'Sales Pipeline',
    owner: 'Adrian Caravedo', type: 'Existing Business', priority: 'Medium',
    company_id: 'co3', contacts: ['c3'],
    created_at: '2026-01-20T12:00:00Z', last_activity: '2026-02-28T16:00:00Z',
    activities: [
      { type: 'call', label: 'Propuesta aceptada', date: '2026-02-28T16:00:00Z' },
    ],
  },
  {
    id: 'd4', name: 'Portal Inmobiliaria',
    amount: 7500, currency: 'USD', stage: 'meeting',
    close_date: '2026-05-30', pipeline: 'Sales Pipeline',
    owner: 'Adrian Caravedo', type: 'New Business', priority: 'Medium',
    company_id: 'co4', contacts: ['c4', 'c5'],
    created_at: '2026-03-01T10:00:00Z', last_activity: '2026-04-15T11:00:00Z',
    activities: [
      { type: 'email', label: 'Propuesta enviada', date: '2026-04-15T11:00:00Z' },
    ],
  },
  {
    id: 'd5', name: 'MVP Startup',
    amount: 5500, currency: 'USD', stage: 'new',
    close_date: '2026-06-15', pipeline: 'Sales Pipeline',
    owner: 'Adrian Caravedo', type: 'New Business', priority: 'Low',
    company_id: 'co5', contacts: ['c6'],
    created_at: '2026-04-01T10:00:00Z', last_activity: '2026-04-21T08:00:00Z',
    activities: [],
  },
]

export const DEMO_PROJECTS = [
  {
    id: 'pr1', name: 'Tienda Moda Lima', phase: 'design',
    framework: 'WordPress', value: 6500, currency: 'USD',
    company_id: 'co1', company: 'Fashion Co.', contact: 'María Quispe',
    server_id: 'sv1',
    phases: {
      kickoff: {
        status: 'approved', approved_admin: true, approved_client: true,
        paid: true, paid_amount: 650, paid_date: '2026-04-01',
        branding: { logo: [{ name: 'logo-fashion.svg', size: '24 KB', url: '#' }], colors: ['#18181b', '#ffffff', '#c9a96e'], fonts: ['Playfair Display', 'DM Sans'] },
        brief: 'Tienda de moda femenina enfocada en el mercado peruano premium. Necesitamos catálogo de productos, carrito de compras y blog de moda.',
        sitemap: [
          { id: 'home', label: 'Home', children: [
            { id: 'hero', label: 'Hero', children: [] },
            { id: 'featured', label: 'Productos destacados', children: [] },
          ]},
          { id: 'shop', label: 'Tienda', children: [
            { id: 'catalog', label: 'Catálogo', children: [] },
            { id: 'product', label: 'Producto individual', children: [] },
          ]},
          { id: 'about', label: 'Nosotros', children: [] },
          { id: 'contact', label: 'Contacto', children: [] },
        ],
        accesses: { cpanel: 'https://server.nithrox.com:2083', ftp: 'ftp://45.67.89.101', db: 'mysql://fashion_db', notes: 'Credenciales enviadas por email seguro.' },
      },
      design: {
        status: 'in_progress', approved_admin: true, approved_client: false,
        paid: false, paid_amount: 0,
        figma_url: 'https://figma.com/file/ABC123/Tienda-Moda-Lima',
        versions: { mobile: true, tablet: true, desktop: true },
        files: [{ name: 'design-v2.fig', size: '8.4 MB', url: '#' }],
      },
      development: { status: 'locked', approved_admin: false, approved_client: false, paid: false, paid_amount: 0, staging_url: '', notes: '' },
      publication: { status: 'locked', approved_admin: false, approved_client: false, paid: false, paid_amount: 0, domain: 'tiendamodalima.pe', checklist: { final_review: false, deploy: false, dns: false, ssl: false, speed: false } },
    },
  },
  {
    id: 'pr2', name: 'Landing SaaS Perú', phase: 'development',
    framework: 'React', value: 9200, currency: 'USD',
    company_id: 'co2', company: 'TechPe', contact: 'Luis Vera',
    server_id: 'sv1',
    phases: {
      kickoff: { status: 'approved', approved_admin: true, approved_client: true, paid: true, paid_amount: 920, paid_date: '2026-03-20', branding: { logo: [], colors: ['#2563eb', '#ffffff'], fonts: ['Inter'] }, brief: 'Landing page para producto SaaS B2B.', sitemap: [], accesses: {} },
      design: { status: 'approved', approved_admin: true, approved_client: true, paid: true, paid_amount: 3680, paid_date: '2026-04-01', figma_url: 'https://figma.com/file/XYZ/Landing', versions: { mobile: true, tablet: false, desktop: true }, files: [] },
      development: { status: 'in_progress', approved_admin: false, approved_client: false, paid: false, paid_amount: 0, staging_url: 'https://staging.nithrox.com/techpe', notes: 'Maquetado al 65%', files: [] },
      publication: { status: 'locked', approved_admin: false, approved_client: false, paid: false, paid_amount: 0, domain: 'landing.techpe.com', checklist: { final_review: false, deploy: false, dns: false, ssl: false, speed: false } },
    },
  },
  {
    id: 'pr3', name: 'App Restaurante', phase: 'kickoff',
    framework: 'React Native', value: 3800, currency: 'USD',
    company_id: 'co3', company: 'Cevichería Mar', contact: 'Jorge Mar',
    server_id: null,
    phases: {
      kickoff: { status: 'in_progress', approved_admin: false, approved_client: false, paid: true, paid_amount: 380, paid_date: '2026-04-14', branding: { logo: [], colors: [], fonts: [] }, brief: '', sitemap: [], accesses: {} },
      design: { status: 'locked', approved_admin: false, approved_client: false, paid: false, paid_amount: 0, figma_url: '', versions: { mobile: true, tablet: false, desktop: false }, files: [] },
      development: { status: 'locked', approved_admin: false, approved_client: false, paid: false, paid_amount: 0, staging_url: '', notes: '', files: [] },
      publication: { status: 'locked', approved_admin: false, approved_client: false, paid: false, paid_amount: 0, domain: '', checklist: { final_review: false, deploy: false, dns: false, ssl: false, speed: false } },
    },
  },
  {
    id: 'pr4', name: 'Portal Inmobiliaria', phase: 'publication',
    framework: 'Next.js', value: 7500, currency: 'USD',
    company_id: 'co4', company: 'Casas del Sur', contact: 'Pedro Salas',
    server_id: 'sv2',
    phases: {
      kickoff: { status: 'approved', approved_admin: true, approved_client: true, paid: true, paid_amount: 750, paid_date: '2026-03-01', branding: {}, brief: 'Portal inmobiliario con listado de propiedades.', sitemap: [], accesses: {} },
      design: { status: 'approved', approved_admin: true, approved_client: true, paid: true, paid_amount: 3000, paid_date: '2026-03-20', figma_url: '', versions: {}, files: [] },
      development: { status: 'approved', approved_admin: true, approved_client: true, paid: true, paid_amount: 3000, paid_date: '2026-04-05', staging_url: 'https://staging.nithrox.com/casas', notes: '', files: [] },
      publication: { status: 'in_progress', approved_admin: true, approved_client: false, paid: false, paid_amount: 0, domain: 'casasdelsur.pe', checklist: { final_review: true, deploy: false, dns: false, ssl: false, speed: false } },
    },
  },
]

export const DEMO_SERVERS = [
  {
    id: 'sv1', name: 'VPS Principal Nithrox', type: 'VPS',
    ip: '45.67.89.100', plan: '8 GB RAM / 4 vCPU / 200 GB SSD',
    provider: 'Hostinger', status: 'online',
    cpu: 23, ram: 45, disk: 31, sites: 12,
    monthly_cost: 40, currency: 'USD',
    cpanel_url: 'https://45.67.89.100:2083',
    projects: ['pr1', 'pr2'],
    clients: ['co1', 'co2'],
    ssl_expiry: '2027-01-15',
    domain: 'server1.nithrox.com',
  },
  {
    id: 'sv2', name: 'Shared Casas del Sur', type: 'Shared',
    ip: '45.67.89.101', plan: '10 GB / Shared',
    provider: 'Hostinger', status: 'online',
    cpu: 8, ram: 22, disk: 23, sites: 3,
    monthly_cost: 15, currency: 'USD',
    cpanel_url: 'https://45.67.89.101:2083',
    projects: ['pr4'],
    clients: ['co4'],
    ssl_expiry: '2026-12-01',
    domain: 'casasdelsur.pe',
  },
]

export const DEMO_MESSAGES = [
  {
    id: 'm1', company_id: 'co1', company: 'Fashion Co.', contact: 'María Quispe',
    avatar_color: '#7c3aed', initials: 'MQ', online: true, unread: 2,
    last_message: 'necesito cambio urgente en el hero', last_at: new Date(Date.now() - 2 * 60000).toISOString(),
    messages: [
      { id: '1', from: 'client', text: 'Hola Adrian, revisé el diseño y me encanta pero quisiera cambiar el hero.', at: new Date(Date.now() - 30 * 60000).toISOString() },
      { id: '2', from: 'admin', text: 'Claro María, ¿tienes algún color específico o te propongo opciones?', at: new Date(Date.now() - 25 * 60000).toISOString() },
      { id: '3', from: 'client', text: 'necesito cambio urgente en el hero, y el menú tampoco me convence 🙈', at: new Date(Date.now() - 2 * 60000).toISOString() },
    ],
  },
  {
    id: 'm2', company_id: 'co2', company: 'TechPe', contact: 'Luis Vera',
    avatar_color: '#2563eb', initials: 'LV', online: true, unread: 1,
    last_message: '¿cuándo estará lista la integración?', last_at: new Date(Date.now() - 60 * 60000).toISOString(),
    messages: [
      { id: '1', from: 'client', text: '¿cuándo estará lista la integración con el CRM?', at: new Date(Date.now() - 60 * 60000).toISOString() },
    ],
  },
  {
    id: 'm3', company_id: 'co3', company: 'Cevichería Mar', contact: 'Jorge Mar',
    avatar_color: '#16a34a', initials: 'JM', online: false, unread: 0,
    last_message: 'todo ok, gracias Adrian 🙏', last_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    messages: [
      { id: '1', from: 'client', text: 'todo ok, gracias Adrian 🙏', at: new Date(Date.now() - 3 * 3600000).toISOString() },
    ],
  },
]

export const DEMO_TEAM = [
  { id: 'u1', name: 'Adrian Caravedo', email: 'adrian@nithrox.com', role: 'admin', title: 'CEO', avatar_color: '#18181b', active: true },
  { id: 'u2', name: 'Lucía Torres', email: 'lucia@nithrox.com', role: 'designer', title: 'Diseñadora Senior', avatar_color: '#7c3aed', active: true },
  { id: 'u3', name: 'Carlos Mendoza', email: 'carlos@nithrox.com', role: 'developer', title: 'Frontend Dev', avatar_color: '#2563eb', active: true },
]

export const DEMO_NOTIFICATIONS = [
  { id: 'n1', type: 'message', icon: '💬', title: 'Fashion Co. respondió tu mensaje', body: 'Tienda Moda Lima · Diseño', at: new Date(Date.now() - 2 * 60000).toISOString(), read: false, link: '/messages' },
  { id: 'n2', type: 'approval', icon: '✅', title: 'Cliente aprobó fase de Diseño', body: 'TechPe · Landing SaaS', at: new Date(Date.now() - 60 * 60000).toISOString(), read: false, link: '/projects' },
  { id: 'n3', type: 'payment', icon: '💳', title: 'Pago recibido $920', body: 'TechPe · Factura NTX-003', at: new Date(Date.now() - 2 * 3600000).toISOString(), read: false, link: '/contracts' },
  { id: 'n4', type: 'contract', icon: '✍️', title: 'Contrato firmado', body: 'Cevichería Mar', at: new Date(Date.now() - 3 * 3600000).toISOString(), read: false, link: '/contracts' },
  { id: 'n5', type: 'warning', icon: '⚠️', title: 'Factura vencida hace 3 días', body: 'TechPe · $3,680', at: new Date(Date.now() - 24 * 3600000).toISOString(), read: true, link: '/contracts' },
  { id: 'n6', type: 'server', icon: '🖥️', title: 'SSL renovado automáticamente', body: 'tiendamodalima.pe', at: new Date(Date.now() - 48 * 3600000).toISOString(), read: true, link: '/servers' },
]
