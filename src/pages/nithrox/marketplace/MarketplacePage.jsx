import { useState } from 'react'
import Topbar from '../../../components/layout/Topbar'
import {
  Globe, Smartphone, ShoppingCart, Palette, Search,
  BarChart2, Shield, Zap, Code, Camera, Users, Headphones,
  Star, Check, ArrowRight, Sparkles
} from 'lucide-react'

const SERVICES = [
  {
    id: 'web_corp',
    category: 'Desarrollo',
    name: 'Sitio web corporativo',
    tagline: 'Tu presencia digital, impecable.',
    description: 'Diseño y desarrollo de sitios web profesionales, modernos y rápidos. Totalmente responsivos y optimizados para SEO.',
    icon: Globe,
    color: '#3b82f6',
    bg: '#eff6ff',
    price_from: '$1,500',
    price_to: '$8,000',
    duration: '4–8 semanas',
    popular: false,
    features: ['Diseño personalizado', 'Responsive mobile/tablet/desktop', 'SEO técnico', 'CMS integrado', 'Hosting + dominio 1 año', 'SSL incluido'],
    tags: ['Wordpress', 'React', 'Webflow'],
  },
  {
    id: 'ecommerce',
    category: 'E-commerce',
    name: 'Tienda online',
    tagline: 'Vende 24/7 sin esfuerzo.',
    description: 'E-commerce completo con carrito de compras, pasarela de pago integrada, gestión de inventario y panel de administración.',
    icon: ShoppingCart,
    color: '#10b981',
    bg: '#ecfdf5',
    price_from: '$3,000',
    price_to: '$15,000',
    duration: '6–12 semanas',
    popular: true,
    features: ['Catálogo de productos', 'Carrito + checkout', 'Múltiples pasarelas de pago', 'Gestión de inventario', 'Panel de analytics', 'App móvil opcional'],
    tags: ['WooCommerce', 'Shopify', 'React'],
  },
  {
    id: 'app_web',
    category: 'Desarrollo',
    name: 'Aplicación web',
    tagline: 'Tu idea, convertida en producto.',
    description: 'Desarrollo de aplicaciones web a medida: SaaS, plataformas, dashboards, sistemas internos. Stack moderno y escalable.',
    icon: Code,
    color: '#8b5cf6',
    bg: '#f5f3ff',
    price_from: '$5,000',
    price_to: '$50,000',
    duration: '8–20 semanas',
    popular: false,
    features: ['Arquitectura escalable', 'Autenticación y roles', 'API REST / GraphQL', 'Base de datos', 'Dashboard analytics', 'Documentación técnica'],
    tags: ['React', 'Next.js', 'Node.js', 'Supabase'],
  },
  {
    id: 'app_mobile',
    category: 'Mobile',
    name: 'App móvil',
    tagline: 'iOS y Android, un solo proyecto.',
    description: 'Desarrollo de aplicaciones móviles cross-platform con diseño nativo. Publicación en App Store y Google Play.',
    icon: Smartphone,
    color: '#ec4899',
    bg: '#fdf2f8',
    price_from: '$6,000',
    price_to: '$40,000',
    duration: '10–20 semanas',
    popular: false,
    features: ['iOS + Android', 'Diseño nativo', 'Push notifications', 'Offline mode', 'App Store + Play Store', 'Analytics integrado'],
    tags: ['React Native', 'Flutter', 'Expo'],
  },
  {
    id: 'branding',
    category: 'Diseño',
    name: 'Identidad visual',
    tagline: 'Tu marca, inconfundible.',
    description: 'Diseño de logotipo, paleta de colores, tipografías y manual de marca. Todo lo que necesitas para comunicar con consistencia.',
    icon: Palette,
    color: '#f59e0b',
    bg: '#fffbeb',
    price_from: '$800',
    price_to: '$4,000',
    duration: '2–4 semanas',
    popular: false,
    features: ['Logotipo + variantes', 'Paleta de colores', 'Tipografías', 'Manual de marca', 'Aplicaciones (tarjeta, membrete)', 'Archivos editables'],
    tags: ['Figma', 'Illustrator'],
  },
  {
    id: 'seo',
    category: 'Marketing',
    name: 'SEO y posicionamiento',
    tagline: 'Primero en Google, siempre.',
    description: 'Estrategia integral de SEO: auditoría, optimización técnica, contenido y link building. Resultados medibles.',
    icon: Search,
    color: '#14b8a6',
    bg: '#f0fdfa',
    price_from: '$500',
    price_to: '$3,000',
    duration: 'Mensual',
    popular: false,
    features: ['Auditoría SEO completa', 'Optimización on-page', 'Google Search Console', 'Estrategia de contenido', 'Link building', 'Reporte mensual'],
    tags: ['SEO', 'Analytics', 'Contenido'],
  },
  {
    id: 'figma_code',
    category: 'Desarrollo',
    name: 'Figma → Código',
    tagline: 'Tu diseño, pixel-perfect en código.',
    description: 'Convertimos cualquier diseño de Figma a código limpio y production-ready. React, HTML, WordPress y más. IA-powered.',
    icon: Zap,
    color: '#6366f1',
    bg: '#eef2ff',
    price_from: '$200',
    price_to: '$5,000',
    duration: '1–5 días',
    popular: true,
    badge: '⚡ IA',
    features: ['Pixel-perfect', 'React / HTML / WP', 'Responsive incluido', 'Código limpio', 'Entrega en 24–72h', 'Revisiones incluidas'],
    tags: ['React', 'HTML', 'Tailwind', 'WordPress'],
  },
  {
    id: 'maintenance',
    category: 'Mantenimiento',
    name: 'Mantenimiento mensual',
    tagline: 'Tu web, siempre al día.',
    description: 'Plan de mantenimiento y soporte técnico mensual. Actualizaciones, backups, monitoreo de seguridad y modificaciones.',
    icon: Shield,
    color: '#64748b',
    bg: '#f8fafc',
    price_from: '$150',
    price_to: '$800',
    duration: 'Mensual',
    popular: false,
    features: ['Actualizaciones CMS/plugins', 'Backups automáticos', 'Monitoreo 24/7', 'Soporte prioritario', 'Hasta 4h de modificaciones', 'Reporte mensual'],
    tags: ['Soporte', 'Hosting', 'Seguridad'],
  },
  {
    id: 'analytics',
    category: 'Marketing',
    name: 'Analytics y datos',
    tagline: 'Decisiones basadas en datos.',
    description: 'Implementación y análisis de métricas de negocio. Google Analytics 4, dashboards personalizados, informes de conversión.',
    icon: BarChart2,
    color: '#f97316',
    bg: '#fff7ed',
    price_from: '$400',
    price_to: '$2,000',
    duration: '1–3 semanas',
    popular: false,
    features: ['GA4 configurado', 'Eventos y conversiones', 'Dashboard personalizado', 'Heatmaps', 'A/B testing', 'Informes mensuales'],
    tags: ['GA4', 'Hotjar', 'Looker Studio'],
  },
  {
    id: 'social',
    category: 'Marketing',
    name: 'Community Manager',
    tagline: 'Tu comunidad, activa y comprometida.',
    description: 'Gestión profesional de redes sociales: estrategia de contenido, diseño de posts, publicación y análisis de resultados.',
    icon: Users,
    color: '#a855f7',
    bg: '#faf5ff',
    price_from: '$300',
    price_to: '$1,500',
    duration: 'Mensual',
    popular: false,
    features: ['Estrategia de contenido', 'Diseño de posts', 'Publicación diaria', 'Gestión de comentarios', 'Stories e Instagram', 'Reporte mensual'],
    tags: ['Instagram', 'TikTok', 'LinkedIn', 'Facebook'],
  },
  {
    id: 'fotografia',
    category: 'Contenido',
    name: 'Fotografía y video',
    tagline: 'Contenido que convierte.',
    description: 'Producción profesional de fotografía de producto, corporativa y video para redes sociales. Lima y Perú.',
    icon: Camera,
    color: '#0ea5e9',
    bg: '#f0f9ff',
    price_from: '$300',
    price_to: '$3,000',
    duration: '1–5 días',
    popular: false,
    features: ['Fotografía producto', 'Fotografía corporativa', 'Video para RRSS', 'Edición incluida', 'Entrega en 48h', 'Derechos de uso comercial'],
    tags: ['Foto', 'Video', 'Reels', 'TikTok'],
  },
  {
    id: 'consulting',
    category: 'Consultoría',
    name: 'Consultoría digital',
    tagline: 'La estrategia que tu negocio necesita.',
    description: 'Sesiones 1-on-1 de estrategia digital: qué construir, cómo priorizarlo, cómo medirlo. Para founders y equipos.',
    icon: Headphones,
    color: '#d97706',
    bg: '#fffbeb',
    price_from: '$150',
    price_to: '$500',
    duration: 'Por sesión',
    popular: false,
    features: ['Sesión 1h por Zoom', 'Análisis de tu situación', 'Hoja de ruta clara', 'Recomendaciones priorizadas', 'Grabación incluida', 'Seguimiento post-sesión'],
    tags: ['Estrategia', 'Digital', 'Startups'],
  },
]

const CATEGORIES = ['Todos', ...new Set(SERVICES.map(s => s.category))]

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [hovered, setHovered] = useState(null)

  const filtered = activeCategory === 'Todos' ? SERVICES : SERVICES.filter(s => s.category === activeCategory)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="MARKETPLACE" />

      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-800" />
          <div className="relative px-8 py-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">NTX Labs · Nithrox</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
              Servicios digitales para empresas que quieren crecer
            </h1>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto">
              Desde startups hasta empresas consolidadas. Desarrollo web, apps, branding, marketing digital y más.
              Todo bajo un mismo techo.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`text-[10px] px-4 py-2 rounded-full font-bold uppercase tracking-widest transition-all ${
                  activeCategory === cat
                    ? 'bg-foreground text-background'
                    : 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Services grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(service => {
              const Icon = service.icon
              const isHovered = hovered === service.id

              return (
                <div
                  key={service.id}
                  onMouseEnter={() => setHovered(service.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`relative flex flex-col bg-background border rounded-2xl overflow-hidden transition-all duration-200 ${
                    isHovered ? 'border-foreground shadow-lg -translate-y-0.5' : 'border-border hover:border-foreground/30'
                  }`}
                >
                  {/* Popular badge */}
                  {service.popular && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="flex items-center gap-1 px-2 py-1 bg-foreground text-background rounded-full text-[9px] font-bold uppercase tracking-widest">
                        <Star className="w-2.5 h-2.5" /> Popular
                      </div>
                    </div>
                  )}
                  {service.badge && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-white" style={{ backgroundColor: service.color }}>
                        {service.badge}
                      </div>
                    </div>
                  )}

                  {/* Card header */}
                  <div className="p-5" style={{ backgroundColor: service.bg }}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: service.color + '20', border: `2px solid ${service.color}30` }}>
                        <Icon className="w-5 h-5" style={{ color: service.color }} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: service.color }}>{service.category}</span>
                        <h3 className="text-sm font-bold text-zinc-900 leading-tight">{service.name}</h3>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-zinc-700 mb-1">{service.tagline}</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">{service.description}</p>
                  </div>

                  {/* Features */}
                  <div className="flex-1 px-5 py-4 space-y-2">
                    {service.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: service.color + '15' }}>
                          <Check className="w-2.5 h-2.5" style={{ color: service.color }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tech tags */}
                  <div className="px-5 pb-3 flex flex-wrap gap-1.5">
                    {service.tags.map(tag => (
                      <span key={tag} className="text-[9px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-bold uppercase">{tag}</span>
                    ))}
                  </div>

                  {/* Price + CTA */}
                  <div className="px-5 pb-5 pt-3 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Desde</p>
                      <p className="text-lg font-bold tracking-tight">{service.price_from}</p>
                      <p className="text-[10px] text-muted-foreground">hasta {service.price_to} · {service.duration}</p>
                    </div>
                    <button
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white transition-all hover:opacity-90 hover:scale-105"
                      style={{ backgroundColor: service.color }}
                    >
                      Solicitar
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom CTA */}
          <div className="bg-zinc-900 rounded-2xl p-8 text-center text-white">
            <h3 className="text-xl font-bold mb-2">¿No encuentras lo que buscas?</h3>
            <p className="text-zinc-400 text-sm mb-5">Cada proyecto es único. Cuéntanos tu idea y te damos una propuesta personalizada.</p>
            <button className="px-6 py-3 bg-white text-zinc-900 font-bold rounded-full text-sm hover:bg-zinc-100 transition-colors">
              Hablar con un experto →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
