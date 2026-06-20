import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import JsBarcode from 'jsbarcode'
import Topbar from '../../../components/layout/Topbar'
import {
  Plus, Search, Grid3x3, List, BarChart3, Package,
  Tag, Boxes, Link2, Upload, Trash2, Pencil, X,
  ChevronDown, Download, AlertTriangle, ArrowUpDown,
  TrendingUp, TrendingDown, Copy, RefreshCw, Eye,
  Webhook, Key, FileDown, FileUp, ExternalLink,
  MoreVertical, Camera, Palette, SlidersHorizontal,
  PackagePlus, PackageMinus, RotateCcw, Info, Check,
  Store, ShoppingCart
} from 'lucide-react'

// ── Constants ──────────────────────────────────────────────────
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const TALLAS_EXTRA = ['Único', '4', '6', '8', '10', '12', '28', '30', '32', '34', '36', '38']

const QUICK_COLORS = [
  { name: 'Negro', hex: '#1a1a1a' },
  { name: 'Blanco', hex: '#f5f5f5' },
  { name: 'Gris', hex: '#9ca3af' },
  { name: 'Azul marino', hex: '#1e3a5f' },
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Rojo', hex: '#ef4444' },
  { name: 'Verde', hex: '#22c55e' },
  { name: 'Amarillo', hex: '#eab308' },
  { name: 'Rosa', hex: '#f472b6' },
  { name: 'Morado', hex: '#8b5cf6' },
  { name: 'Naranja', hex: '#f97316' },
  { name: 'Café', hex: '#78350f' },
  { name: 'Beige', hex: '#d2b48c' },
  { name: 'Camel', hex: '#c19a6b' },
  { name: 'Crema', hex: '#fef3c7' },
  { name: 'Coral', hex: '#fb7185' },
]

const DEFAULT_CATEGORIES = [
  { id: 'cat_tops',     name: 'Tops',       emoji: '👕', color: '#3b82f6', count: 0 },
  { id: 'cat_pants',    name: 'Pantalones', emoji: '👖', color: '#8b5cf6', count: 0 },
  { id: 'cat_dresses',  name: 'Vestidos',   emoji: '👗', color: '#ec4899', count: 0 },
  { id: 'cat_outer',    name: 'Abrigos',    emoji: '🧥', color: '#6b7280', count: 0 },
  { id: 'cat_acc',      name: 'Accesorios', emoji: '👜', color: '#f59e0b', count: 0 },
  { id: 'cat_shoes',    name: 'Calzado',    emoji: '👠', color: '#ef4444', count: 0 },
  { id: 'cat_inner',    name: 'Ropa Interior', emoji: '🩱', color: '#a78bfa', count: 0 },
  { id: 'cat_swim',     name: 'Ropa de Baño',  emoji: '👙', color: '#06b6d4', count: 0 },
]

const SEASONS = ['Primavera 2025', 'Verano 2025', 'Otoño 2025', 'Invierno 2025', 'Todo el año', 'Edición limitada']

const PLATFORMS = [
  { id: 'shopify',    name: 'Shopify',       logo: '🟢', color: '#96bf48', desc: 'Sincroniza productos y stock con tu tienda Shopify' },
  { id: 'woo',        name: 'WooCommerce',   logo: '🟣', color: '#7f54b3', desc: 'Conecta con tu tienda WordPress/WooCommerce' },
  { id: 'meli',       name: 'Mercado Libre', logo: '🟡', color: '#ffe600', desc: 'Publica automáticamente en Mercado Libre' },
  { id: 'tiendanube', name: 'Tiendanube',    logo: '☁️', color: '#00b1e1', desc: 'Sincroniza con tu tienda Tiendanube' },
  { id: 'rappi',      name: 'Rappi',         logo: '🔴', color: '#ff441f', desc: 'Vende en Rappi Store' },
  { id: 'instagram',  name: 'Instagram Shop',logo: '📸', color: '#e1306c', desc: 'Catálogo de productos en Instagram' },
]

// ── Helpers ────────────────────────────────────────────────────
function load(key, def) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? def } catch { return def }
}
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }

function genSKU(name = '', categoryId = '') {
  const prefix = name.slice(0, 3).toUpperCase().replace(/\s/g, '') || 'PRD'
  const catCode = categoryId.replace('cat_', '').slice(0, 3).toUpperCase() || 'GEN'
  const num = String(Math.floor(Math.random() * 9000) + 1000)
  return `${prefix}-${catCode}-${num}`
}

function genEAN13() {
  const d = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10))
  let check = 0
  d.forEach((n, i) => { check += (i % 2 === 0 ? 1 : 3) * n })
  check = (10 - (check % 10)) % 10
  return [...d, check].join('')
}

function totalStock(product) {
  return (product.variants || []).reduce((sum, v) => {
    return sum + SIZES.reduce((s, sz) => s + (v.stock?.[sz] || 0), 0) +
      (TALLAS_EXTRA.reduce((s, sz) => s + (v.stock?.[sz] || 0), 0))
  }, 0)
}

function lowStockCount(product) {
  return (product.variants || []).reduce((c, v) => {
    return c + SIZES.filter(sz => (v.stock?.[sz] ?? 0) > 0 && (v.stock?.[sz] ?? 0) <= 3).length
  }, 0)
}

function inventoryValue(products) {
  return products.reduce((sum, p) => sum + (p.price_cost || 0) * totalStock(p), 0)
}

// ── Barcode component ──────────────────────────────────────────
function Barcode({ value, small }) {
  const ref = useRef()
  useEffect(() => {
    if (!ref.current || !value) return
    try {
      JsBarcode(ref.current, value, {
        format: 'CODE128', width: small ? 1.5 : 2, height: small ? 40 : 60,
        displayValue: true, fontSize: small ? 10 : 12, margin: 8,
        background: '#ffffff', lineColor: '#000000',
      })
    } catch (e) {
      // invalid barcode value — clear
      if (ref.current) ref.current.innerHTML = ''
    }
  }, [value, small])
  if (!value) return null
  return <svg ref={ref} className="max-w-full" />
}

// ── Product Card (grid) ────────────────────────────────────────
function ProductCard({ product, categories, onClick, onDelete }) {
  const [menu, setMenu] = useState(false)
  const stock = totalStock(product)
  const low = lowStockCount(product)
  const cat = categories.find(c => c.id === product.category_id)
  const hasPhoto = product.photos?.[0]

  return (
    <div className="group bg-background border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-foreground/20 transition-all cursor-pointer relative"
      onClick={onClick}>
      {/* Photo */}
      <div className="aspect-[3/4] bg-muted/30 overflow-hidden relative">
        {hasPhoto ? (
          <img src={hasPhoto} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        {/* Stock badge */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold
          ${stock === 0 ? 'bg-red-100 text-red-600' : low > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
          {stock === 0 ? 'Sin stock' : low > 0 ? `⚠ ${stock} uds` : `${stock} uds`}
        </div>
        {/* Color dots */}
        {(product.variants || []).length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {product.variants.slice(0, 5).map(v => (
              <div key={v.id} className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: v.color_hex }} title={v.color_name} />
            ))}
            {product.variants.length > 5 && (
              <div className="w-4 h-4 rounded-full bg-muted border-2 border-white flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                +{product.variants.length - 5}
              </div>
            )}
          </div>
        )}
        {/* 3-dot menu */}
        <div className="absolute top-2 right-2" onClick={e => { e.stopPropagation(); setMenu(m => !m) }}>
          <button className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all">
            <MoreVertical className="w-3.5 h-3.5 text-zinc-700" />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
              <div className="absolute right-0 top-8 w-36 bg-popover border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                <button onClick={e => { e.stopPropagation(); onClick(); setMenu(false) }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors">
                  <Eye className="w-3.5 h-3.5" /> Ver / Editar
                </button>
                <button onClick={e => { e.stopPropagation(); onDelete(); setMenu(false) }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        {cat && (
          <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: cat.color + '20', color: cat.color }}>
            {cat.emoji} {cat.name}
          </span>
        )}
        <p className="text-sm font-bold mt-1.5 leading-tight line-clamp-2">{product.name}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{product.sku}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm font-bold">S/ {product.price_sale?.toFixed(2) || '0.00'}</p>
          {product.price_cost > 0 && (
            <p className="text-[10px] text-muted-foreground">Costo: S/ {product.price_cost?.toFixed(2)}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Product Row (list) ─────────────────────────────────────────
function ProductRow({ product, categories, onClick, onDelete }) {
  const stock = totalStock(product)
  const cat = categories.find(c => c.id === product.category_id)
  const hasPhoto = product.photos?.[0]
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-accent/30 transition-colors cursor-pointer border-b border-border/50 last:border-0"
      onClick={onClick}>
      <div className="w-10 h-10 rounded-xl bg-muted/30 overflow-hidden shrink-0">
        {hasPhoto ? <img src={hasPhoto} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-muted-foreground/30 m-auto mt-2.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{product.name}</p>
        <p className="text-[10px] text-muted-foreground">{product.sku}</p>
      </div>
      {cat && <span className="text-[10px] px-2 py-0.5 rounded-full hidden sm:block shrink-0" style={{ backgroundColor: cat.color + '20', color: cat.color }}>{cat.emoji} {cat.name}</span>}
      <div className="flex gap-1.5 hidden md:flex shrink-0">
        {(product.variants || []).slice(0, 4).map(v => (
          <div key={v.id} className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: v.color_hex }} title={v.color_name} />
        ))}
        {(product.variants || []).length > 4 && <span className="text-[10px] text-muted-foreground">+{product.variants.length - 4}</span>}
      </div>
      <p className="text-sm font-bold shrink-0">S/ {product.price_sale?.toFixed(2)}</p>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
        ${stock === 0 ? 'bg-red-100 text-red-600' : stock <= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
        {stock} uds
      </span>
      <button onClick={e => { e.stopPropagation(); onDelete() }}
        className="text-muted-foreground hover:text-red-500 p-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ── Product Modal ──────────────────────────────────────────────
function ProductModal({ product: initial, categories, onSave, onClose }) {
  const isNew = !initial?.id
  const photoRef = useRef()
  const [form, setForm] = useState(() => initial || {
    id: `prod_${Date.now()}`,
    name: '', sku: '', barcode: '', category_id: '', description: '',
    price_sale: '', price_cost: '', currency: 'PEN',
    photos: [], tags: '', season: '', brand: 'Lowis', status: 'active',
    variants: [{ id: `var_${Date.now()}`, color_name: 'Negro', color_hex: '#1a1a1a', stock: {} }],
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  })
  const [tab, setTab] = useState('info')
  const [showColorPicker, setShowColorPicker] = useState(null)

  const set = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), [])

  const margin = form.price_sale && form.price_cost
    ? ((form.price_sale - form.price_cost) / form.price_sale * 100).toFixed(1) : null

  const handlePhotoUpload = (files) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => setForm(f => ({ ...f, photos: [...(f.photos || []), e.target.result] }))
      reader.readAsDataURL(file)
    })
  }

  const addVariant = () => {
    const color = QUICK_COLORS[form.variants?.length % QUICK_COLORS.length] || QUICK_COLORS[0]
    setForm(f => ({ ...f, variants: [...(f.variants || []), {
      id: `var_${Date.now()}`, color_name: color.name, color_hex: color.hex, stock: {}
    }]}))
  }

  const updateVariant = (vid, updates) => {
    setForm(f => ({ ...f, variants: f.variants.map(v => v.id === vid ? { ...v, ...updates } : v) }))
  }

  const updateStock = (vid, size, val) => {
    setForm(f => ({ ...f, variants: f.variants.map(v =>
      v.id === vid ? { ...v, stock: { ...v.stock, [size]: Math.max(0, parseInt(val) || 0) } } : v
    )}))
  }

  const handleSave = () => {
    if (!form.name.trim()) return toast.error('El nombre es obligatorio')
    const prod = {
      ...form,
      sku: form.sku || genSKU(form.name, form.category_id),
      barcode: form.barcode || genEAN13(),
      price_sale: parseFloat(form.price_sale) || 0,
      price_cost: parseFloat(form.price_cost) || 0,
      tags: typeof form.tags === 'string' ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : form.tags || [],
      updated_at: new Date().toISOString(),
    }
    onSave(prod)
    onClose()
    toast.success(isNew ? 'Producto creado' : 'Producto guardado')
  }

  const TABS = [
    { id: 'info',     label: 'Info' },
    { id: 'fotos',    label: 'Fotos' },
    { id: 'variantes',label: 'Variantes & Stock' },
    { id: 'barcode',  label: 'Código de barras' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-bold">{isNew ? 'Nuevo producto' : 'Editar producto'}</h2>
            {!isNew && <p className="text-[10px] text-muted-foreground">{form.sku}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="px-4 py-1.5 bg-foreground text-background text-xs font-bold rounded-full hover:opacity-90 transition-opacity">
              Guardar
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0 px-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nombre *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Camiseta Oversize Basic..."
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-foreground bg-background" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">SKU</label>
                  <div className="flex gap-1.5">
                    <input value={form.sku} onChange={e => set('sku', e.target.value)}
                      placeholder="Auto-generado"
                      className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-foreground bg-background" />
                    <button onClick={() => set('sku', genSKU(form.name, form.category_id))}
                      title="Generar SKU" className="px-2.5 border border-border rounded-xl hover:bg-accent transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Categoría</label>
                  <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-foreground bg-background">
                    <option value="">Seleccionar...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Marca</label>
                  <input value={form.brand} onChange={e => set('brand', e.target.value)}
                    placeholder="Lowis"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-foreground bg-background" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Temporada</label>
                  <select value={form.season} onChange={e => set('season', e.target.value)}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-foreground bg-background">
                    <option value="">Sin temporada</option>
                    {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Precio venta (S/)</label>
                  <input type="number" min="0" step="0.01" value={form.price_sale} onChange={e => set('price_sale', e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-foreground bg-background" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Precio costo (S/)</label>
                    {margin && <span className={`text-[10px] font-bold ${parseFloat(margin) > 30 ? 'text-green-600' : 'text-yellow-600'}`}>Margen {margin}%</span>}
                  </div>
                  <input type="number" min="0" step="0.01" value={form.price_cost} onChange={e => set('price_cost', e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-foreground bg-background" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Descripción</label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)}
                    placeholder="Material, corte, características..."
                    rows={3} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-foreground bg-background resize-none" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tags (separados por coma)</label>
                  <input value={typeof form.tags === 'string' ? form.tags : (form.tags || []).join(', ')} onChange={e => set('tags', e.target.value)}
                    placeholder="verano, básico, oversize..."
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-foreground bg-background" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estado</label>
                  <div className="flex gap-2 mt-1.5">
                    {[['active','Activo'],['draft','Borrador'],['discontinued','Descontinuado']].map(([v,l]) => (
                      <button key={v} onClick={() => set('status', v)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${form.status === v ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground/30'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'fotos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {(form.photos || []).map((src, i) => (
                  <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-border">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                    {i === 0 && <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-full">PRINCIPAL</span>}
                  </div>
                ))}
                <button onClick={() => photoRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-accent/20 transition-all">
                  <Camera className="w-7 h-7 opacity-40" />
                  <span className="text-[10px] font-medium">Agregar foto</span>
                </button>
              </div>
              <input ref={photoRef} type="file" multiple accept="image/*" className="hidden"
                onChange={e => handlePhotoUpload(e.target.files)} />
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handlePhotoUpload(e.dataTransfer.files) }}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center text-muted-foreground hover:border-primary/40 hover:bg-accent/10 transition-all">
                <Upload className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Arrastra imágenes aquí</p>
                <p className="text-xs mt-1 opacity-60">JPG, PNG, WEBP · Máx 5MB por foto</p>
              </div>
            </div>
          )}

          {tab === 'variantes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Colores y stock por talla</p>
                <button onClick={addVariant}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-foreground text-background rounded-full hover:opacity-90">
                  <Plus className="w-3.5 h-3.5" /> Color
                </button>
              </div>

              {(form.variants || []).map((variant, vi) => (
                <div key={variant.id} className="border border-border rounded-xl overflow-hidden">
                  {/* Variant header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-muted/20 border-b border-border">
                    {/* Color preview */}
                    <div className="relative">
                      <button
                        className="w-8 h-8 rounded-full border-2 border-border shadow-sm cursor-pointer"
                        style={{ backgroundColor: variant.color_hex }}
                        onClick={() => setShowColorPicker(showColorPicker === variant.id ? null : variant.id)}
                      />
                      {showColorPicker === variant.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(null)} />
                          <div className="absolute left-0 top-10 z-50 bg-background border border-border rounded-2xl p-3 shadow-2xl w-56">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Color rápido</p>
                            <div className="grid grid-cols-8 gap-1 mb-2">
                              {QUICK_COLORS.map(c => (
                                <button key={c.hex}
                                  className="w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform"
                                  style={{ backgroundColor: c.hex, borderColor: variant.color_hex === c.hex ? '#000' : 'transparent' }}
                                  onClick={() => { updateVariant(variant.id, { color_hex: c.hex, color_name: c.name }); setShowColorPicker(null) }}
                                  title={c.name}
                                />
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input type="color" value={variant.color_hex}
                                onChange={e => updateVariant(variant.id, { color_hex: e.target.value })}
                                className="w-8 h-8 rounded cursor-pointer border-0" />
                              <input value={variant.color_name}
                                onChange={e => updateVariant(variant.id, { color_name: e.target.value })}
                                placeholder="Nombre del color"
                                className="flex-1 border border-border rounded-lg px-2 py-1 text-xs outline-none" />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-sm font-semibold flex-1">{variant.color_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Total: {SIZES.reduce((s, sz) => s + (variant.stock?.[sz] || 0), 0)} uds
                    </p>
                    {(form.variants || []).length > 1 && (
                      <button onClick={() => setForm(f => ({ ...f, variants: f.variants.filter(v => v.id !== variant.id) }))}
                        className="text-muted-foreground hover:text-red-500 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Size grid */}
                  <div className="p-4">
                    <div className="grid grid-cols-6 gap-2">
                      {SIZES.map(size => (
                        <div key={size} className="text-center">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{size}</p>
                          <input type="number" min="0"
                            value={variant.stock?.[size] ?? ''}
                            onChange={e => updateStock(variant.id, size, e.target.value)}
                            placeholder="0"
                            className={`w-full text-center border rounded-lg py-2 text-sm font-bold outline-none transition-colors
                              ${(variant.stock?.[size] || 0) === 0 ? 'border-border text-muted-foreground bg-muted/20' :
                                (variant.stock?.[size] || 0) <= 3 ? 'border-yellow-300 bg-yellow-50 text-yellow-700' :
                                'border-green-200 bg-green-50/50 text-green-700'}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <p className="text-[10px] text-muted-foreground text-center">Los colores en amarillo tienen stock ≤ 3 · Vacío = 0 unidades</p>
            </div>
          )}

          {tab === 'barcode' && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Código de barras (EAN-13 / Code 128)</label>
                <div className="flex gap-2">
                  <input value={form.barcode} onChange={e => set('barcode', e.target.value)}
                    placeholder="7501234567890"
                    className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-foreground bg-background" />
                  <button onClick={() => set('barcode', genEAN13())}
                    className="px-3 border border-border rounded-xl hover:bg-accent text-xs font-medium transition-colors whitespace-nowrap">
                    Generar
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(form.barcode); toast.success('Copiado') }}
                    className="px-2.5 border border-border rounded-xl hover:bg-accent transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Barcode preview */}
              <div className="bg-white rounded-2xl p-6 border border-border flex flex-col items-center gap-3">
                <Barcode value={form.barcode} />
                {!form.barcode && <p className="text-sm text-muted-foreground">Ingresa o genera un código</p>}
              </div>

              {/* Print hint */}
              <div className="bg-muted/30 rounded-xl p-4 flex gap-3">
                <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold mb-1">Formato recomendado</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">EAN-13 para etiquetas internacionales · Code 128 para uso interno · Para imprimir, usa "Herramientas → Imprimir etiquetas"</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Category Card ──────────────────────────────────────────────
function CategoryCard({ cat, count, onEdit, onDelete }) {
  const [menu, setMenu] = useState(false)
  return (
    <div className="relative border border-border rounded-2xl p-5 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: cat.color + '20' }}>
          {cat.emoji}
        </div>
        <div onClick={e => { e.stopPropagation(); setMenu(m => !m) }}>
          <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded-lg transition-all">
            <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
              <div className="absolute right-3 top-12 w-32 bg-popover border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                <button onClick={() => { onEdit(); setMenu(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent"><Pencil className="w-3 h-3" /> Editar</button>
                <button onClick={() => { onDelete(); setMenu(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /> Eliminar</button>
              </div>
            </>
          )}
        </div>
      </div>
      <p className="text-sm font-bold">{cat.name}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{count} producto{count !== 1 ? 's' : ''}</p>
      <div className="h-1 mt-3 rounded-full" style={{ backgroundColor: cat.color + '30' }}>
        <div className="h-full rounded-full transition-all" style={{ backgroundColor: cat.color, width: `${Math.min(100, count * 10)}%` }} />
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────
export default function InventoryPage({ activeTab: activeTabProp, setActiveTab: setActiveTabProp } = {}) {
  const [products, setProducts] = useState(() => load('ntx_inv_products', []))
  const [categories, setCategories] = useState(() => load('ntx_inv_categories', DEFAULT_CATEGORIES))
  const [movements, setMovements] = useState(() => load('ntx_inv_movements', []))
  const [settings, setSettings] = useState(() => load('ntx_inv_settings', { webhooks: [], apiKey: '' }))

  const [activeTabInternal, setActiveTabInternal] = useState('products')
  const activeTab = activeTabProp || activeTabInternal
  const setActiveTab = setActiveTabProp || setActiveTabInternal
  const [viewMode, setViewMode] = useState('grid')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [filterStock, setFilterStock] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showNewProduct, setShowNewProduct] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [editCategory, setEditCategory] = useState(null)
  const [showMovement, setShowMovement] = useState(false)
  const [movForm, setMovForm] = useState({ product_id: '', variant_id: '', size: 'M', type: 'in', quantity: '', note: '' })

  // Persist on change
  useEffect(() => { save('ntx_inv_products', products) }, [products])
  useEffect(() => { save('ntx_inv_categories', categories) }, [categories])
  useEffect(() => { save('ntx_inv_movements', movements) }, [movements])
  useEffect(() => { save('ntx_inv_settings', settings) }, [settings])

  const saveProduct = (prod) => {
    setProducts(prev => {
      const exists = prev.find(p => p.id === prod.id)
      return exists ? prev.map(p => p.id === prod.id ? prod : p) : [prod, ...prev]
    })
  }

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id))
    toast.success('Producto eliminado')
  }

  const saveCategory = (cat) => {
    setCategories(prev => {
      const exists = prev.find(c => c.id === cat.id)
      return exists ? prev.map(c => c.id === cat.id ? cat : c) : [...prev, cat]
    })
    setShowNewCategory(false); setEditCategory(null)
    toast.success(editCategory ? 'Categoría actualizada' : 'Categoría creada')
  }

  const deleteCategory = (id) => {
    setCategories(prev => prev.filter(c => c.id !== id))
    toast.success('Categoría eliminada')
  }

  const addMovement = () => {
    const product = products.find(p => p.id === movForm.product_id)
    if (!product) return toast.error('Selecciona un producto')
    const qty = parseInt(movForm.quantity)
    if (!qty || qty <= 0) return toast.error('Ingresa una cantidad válida')

    const mov = {
      id: `mov_${Date.now()}`, ...movForm, quantity: qty,
      product_name: product.name, at: new Date().toISOString(),
    }
    setMovements(prev => [mov, ...prev])

    // Update stock
    setProducts(prev => prev.map(p => {
      if (p.id !== movForm.product_id) return p
      return {
        ...p,
        variants: p.variants.map(v => {
          if (movForm.variant_id && v.id !== movForm.variant_id) return v
          const delta = movForm.type === 'in' ? qty : movForm.type === 'out' ? -qty : qty - (v.stock?.[movForm.size] || 0)
          return { ...v, stock: { ...v.stock, [movForm.size]: Math.max(0, (v.stock?.[movForm.size] || 0) + (movForm.type === 'adjustment' ? (qty - (v.stock?.[movForm.size] || 0)) : delta)) } }
        }),
      }
    }))

    setShowMovement(false)
    setMovForm({ product_id: '', variant_id: '', size: 'M', type: 'in', quantity: '', note: '' })
    toast.success('Movimiento registrado')
  }

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search)
    const matchCat = filterCat === 'all' || p.category_id === filterCat
    const stock = totalStock(p)
    const matchStock = filterStock === 'all' || (filterStock === 'low' && stock > 0 && stock <= 5) || (filterStock === 'out' && stock === 0) || (filterStock === 'ok' && stock > 5)
    return matchSearch && matchCat && matchStock
  })

  // Stats
  const totalItems = products.reduce((s, p) => s + totalStock(p), 0)
  const lowStockProducts = products.filter(p => { const s = totalStock(p); return s > 0 && s <= 5 }).length
  const outOfStock = products.filter(p => totalStock(p) === 0).length
  const invValue = inventoryValue(products)

  const exportCSV = () => {
    const rows = [
      ['SKU', 'Nombre', 'Categoría', 'Precio Venta', 'Precio Costo', 'Stock Total', 'Temporada', 'Estado'],
      ...products.map(p => {
        const cat = categories.find(c => c.id === p.category_id)
        return [p.sku, p.name, cat?.name || '', p.price_sale, p.price_cost, totalStock(p), p.season, p.status]
      })
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'inventario-lowis.csv'; a.click()
    toast.success('CSV exportado')
  }

  const TABS = [
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'categories', label: 'Categorías', icon: Tag },
    { id: 'stock', label: 'Stock & Movimientos', icon: BarChart3 },
    { id: 'integrations', label: 'Integraciones', icon: Link2 },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="INVENTARIO LOWIS"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-full hover:bg-accent transition-colors">
              <FileDown className="w-3.5 h-3.5" /> Exportar CSV
            </button>
            {activeTab === 'products' && (
              <button onClick={() => setShowNewProduct(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-foreground text-background rounded-full hover:opacity-90 transition-opacity">
                <Plus className="w-3.5 h-3.5" /> Nuevo producto
              </button>
            )}
            {activeTab === 'categories' && (
              <button onClick={() => setShowNewCategory(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-foreground text-background rounded-full hover:opacity-90 transition-opacity">
                <Plus className="w-3.5 h-3.5" /> Nueva categoría
              </button>
            )}
            {activeTab === 'stock' && (
              <button onClick={() => setShowMovement(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-foreground text-background rounded-full hover:opacity-90 transition-opacity">
                <PackagePlus className="w-3.5 h-3.5" /> Movimiento
              </button>
            )}
          </div>
        }
      />

      {/* Stats bar */}
      <div className="grid grid-cols-4 border-b border-border bg-background shrink-0">
        {[
          { label: 'Productos', value: products.length, icon: Package, color: 'text-blue-500' },
          { label: 'Unidades', value: totalItems.toLocaleString(), icon: Boxes, color: 'text-green-500' },
          { label: 'Stock bajo', value: lowStockProducts + outOfStock, icon: AlertTriangle, color: outOfStock + lowStockProducts > 0 ? 'text-yellow-500' : 'text-muted-foreground' },
          { label: 'Valor inventario', value: `S/ ${invValue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-purple-500' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="flex items-center gap-3 px-5 py-3 border-r border-border last:border-r-0">
              <div className={`w-8 h-8 rounded-xl bg-muted/40 flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                <p className="text-sm font-bold tabular-nums">{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Internal tab bar — only shown when not controlled by sidebar */}
      {!activeTabProp && (
        <div className="flex border-b border-border bg-background shrink-0 px-4">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${activeTab === t.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                <Icon className="w-3.5 h-3.5" />{t.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">

        {/* ── PRODUCTS TAB ── */}
        {activeTab === 'products' && (
          <div className="flex flex-col h-full">
            {/* Filter bar */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-background shrink-0">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, SKU, código..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-muted/30 border border-border rounded-xl outline-none focus:border-foreground" />
              </div>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                className="border border-border rounded-xl px-3 py-2 text-xs bg-background outline-none">
                <option value="all">Todas las categorías</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
              <select value={filterStock} onChange={e => setFilterStock(e.target.value)}
                className="border border-border rounded-xl px-3 py-2 text-xs bg-background outline-none">
                <option value="all">Todo el stock</option>
                <option value="ok">Stock OK</option>
                <option value="low">Stock bajo (≤5)</option>
                <option value="out">Sin stock</option>
              </select>
              <div className="flex items-center border border-border rounded-xl overflow-hidden ml-auto">
                <button onClick={() => setViewMode('grid')} className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-foreground text-background' : 'hover:bg-accent'}`}>
                  <Grid3x3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`px-3 py-2 transition-colors ${viewMode === 'list' ? 'bg-foreground text-background' : 'hover:bg-accent'}`}>
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Products */}
            <div className="flex-1 overflow-y-auto p-5">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                  <Package className="w-16 h-16 opacity-20 mb-4" />
                  <p className="text-sm font-semibold">
                    {search || filterCat !== 'all' || filterStock !== 'all' ? 'Sin resultados' : 'Sin productos aún'}
                  </p>
                  <p className="text-xs mt-1 opacity-60">
                    {search || filterCat !== 'all' || filterStock !== 'all' ? 'Prueba con otros filtros' : 'Agrega tu primer producto'}
                  </p>
                  {!search && filterCat === 'all' && filterStock === 'all' && (
                    <button onClick={() => setShowNewProduct(true)}
                      className="mt-4 flex items-center gap-2 px-4 py-2 bg-foreground text-background text-xs font-bold rounded-full hover:opacity-90">
                      <Plus className="w-3.5 h-3.5" /> Nuevo producto
                    </button>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} categories={categories}
                      onClick={() => setSelectedProduct(product)}
                      onDelete={() => deleteProduct(product.id)} />
                  ))}
                </div>
              ) : (
                <div className="border border-border rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-4 px-5 py-2.5 bg-muted/30 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="w-10 shrink-0" />
                    <div className="flex-1">Producto</div>
                    <div className="hidden sm:block w-24 shrink-0">Categoría</div>
                    <div className="hidden md:block w-20 shrink-0">Colores</div>
                    <div className="w-16 shrink-0 text-right">Precio</div>
                    <div className="w-20 shrink-0 text-right">Stock</div>
                    <div className="w-6 shrink-0" />
                  </div>
                  {filteredProducts.map(product => (
                    <div key={product.id} className="group">
                      <ProductRow product={product} categories={categories}
                        onClick={() => setSelectedProduct(product)}
                        onDelete={() => deleteProduct(product.id)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CATEGORIES TAB ── */}
        {activeTab === 'categories' && (
          <div className="overflow-y-auto h-full p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {categories.map(cat => {
                const count = products.filter(p => p.category_id === cat.id).length
                return (
                  <CategoryCard key={cat.id} cat={cat} count={count}
                    onEdit={() => setEditCategory(cat)}
                    onDelete={() => deleteCategory(cat.id)} />
                )
              })}
              <button onClick={() => setShowNewCategory(true)}
                className="border-2 border-dashed border-border rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-foreground/30 hover:bg-accent/20 transition-all min-h-[120px]">
                <Plus className="w-6 h-6 opacity-40" />
                <span className="text-xs font-medium">Nueva categoría</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STOCK TAB ── */}
        {activeTab === 'stock' && (
          <div className="overflow-y-auto h-full p-5 space-y-5">
            {/* Low stock alerts */}
            {(lowStockProducts > 0 || outOfStock > 0) && (
              <div className="border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">Alertas de stock</p>
                </div>
                <div className="space-y-2">
                  {products.filter(p => totalStock(p) === 0).map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded-full">Sin stock</span>
                    </div>
                  ))}
                  {products.filter(p => { const s = totalStock(p); return s > 0 && s <= 5 }).map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-yellow-700 font-bold bg-yellow-100 px-2 py-0.5 rounded-full">{totalStock(p)} uds</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Movements log */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Historial de movimientos</h3>
              {movements.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 opacity-20 mx-auto mb-3" />
                  <p className="text-sm">Sin movimientos registrados</p>
                </div>
              ) : (
                <div className="border border-border rounded-2xl overflow-hidden">
                  {movements.map(mov => (
                    <div key={mov.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-border/50 last:border-0 hover:bg-accent/20 transition-colors">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                        ${mov.type === 'in' ? 'bg-green-100 text-green-600' : mov.type === 'out' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {mov.type === 'in' ? <PackagePlus className="w-4 h-4" /> : mov.type === 'out' ? <PackageMinus className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{mov.product_name}</p>
                        <p className="text-[10px] text-muted-foreground">{mov.size} · {mov.note || (mov.type === 'in' ? 'Entrada' : mov.type === 'out' ? 'Salida' : 'Ajuste')}</p>
                      </div>
                      <span className={`text-sm font-bold ${mov.type === 'in' ? 'text-green-600' : mov.type === 'out' ? 'text-red-500' : 'text-blue-500'}`}>
                        {mov.type === 'in' ? '+' : mov.type === 'out' ? '-' : '→'}{mov.quantity}
                      </span>
                      <p className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(mov.at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── INTEGRATIONS TAB ── */}
        {activeTab === 'integrations' && (
          <div className="overflow-y-auto h-full p-5 space-y-6">
            {/* Platform connectors */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Plataformas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PLATFORMS.map(p => (
                  <div key={p.id} className="border border-border rounded-2xl p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{p.logo}</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                      </div>
                    </div>
                    <button className="w-full py-2 text-xs font-bold border border-border rounded-xl hover:bg-accent transition-colors">
                      Próximamente
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Webhooks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Webhooks</h3>
                <button onClick={() => {
                  const url = prompt('URL del webhook:')
                  if (url) setSettings(s => ({ ...s, webhooks: [...(s.webhooks || []), { id: `wh_${Date.now()}`, url, events: ['product.created', 'stock.updated'], active: true }] }))
                }} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Agregar
                </button>
              </div>
              {(settings.webhooks || []).length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground">
                  <Webhook className="w-8 h-8 opacity-30 mx-auto mb-2" />
                  <p className="text-sm">Sin webhooks configurados</p>
                  <p className="text-xs mt-1 opacity-60">Recibe notificaciones automáticas en tu sistema externo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(settings.webhooks || []).map(wh => (
                    <div key={wh.id} className="flex items-center gap-3 border border-border rounded-xl px-4 py-3">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${wh.active ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                      <span className="text-xs font-mono flex-1 truncate text-muted-foreground">{wh.url}</span>
                      <button onClick={() => setSettings(s => ({ ...s, webhooks: s.webhooks.filter(w => w.id !== wh.id) }))}
                        className="text-muted-foreground hover:text-red-500 p-0.5 shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* API Key */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">API Key</h3>
              <div className="border border-border rounded-2xl p-5">
                <p className="text-xs text-muted-foreground mb-3">Usa esta clave para integrar el inventario con tus sistemas o aplicaciones externas.</p>
                <div className="flex gap-2">
                  <input
                    value={settings.apiKey || 'Genera una clave API primero'}
                    readOnly
                    className="flex-1 border border-border rounded-xl px-3 py-2 text-xs font-mono bg-muted/20 outline-none" />
                  <button onClick={() => {
                    const key = `ntx_inv_${Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('')}`
                    setSettings(s => ({ ...s, apiKey: key }))
                    toast.success('API key generada')
                  }} className="px-3 py-2 border border-border rounded-xl text-xs font-bold hover:bg-accent transition-colors">
                    Generar
                  </button>
                  {settings.apiKey && (
                    <button onClick={() => { navigator.clipboard.writeText(settings.apiKey); toast.success('Copiado') }}
                      className="px-3 py-2 border border-border rounded-xl hover:bg-accent transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="mt-4 bg-muted/30 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Endpoints disponibles</p>
                  {[
                    { method: 'GET', path: '/api/inventory/products', desc: 'Listar productos' },
                    { method: 'GET', path: '/api/inventory/products/:id', desc: 'Obtener producto' },
                    { method: 'GET', path: '/api/inventory/stock', desc: 'Resumen de stock' },
                    { method: 'POST', path: '/api/inventory/movement', desc: 'Registrar movimiento' },
                  ].map(e => (
                    <div key={e.path} className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${e.method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{e.method}</span>
                      <span className="text-[11px] font-mono text-muted-foreground flex-1">{e.path}</span>
                      <span className="text-[10px] text-muted-foreground hidden sm:block">{e.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Export / Import */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Importar / Exportar</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={exportCSV} className="flex items-center gap-3 border border-border rounded-2xl p-4 hover:shadow-md transition-all text-left">
                  <FileDown className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-bold">Exportar CSV</p>
                    <p className="text-[10px] text-muted-foreground">Catálogo completo en Excel</p>
                  </div>
                </button>
                <label className="flex items-center gap-3 border border-border rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer">
                  <FileUp className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-bold">Importar CSV</p>
                    <p className="text-[10px] text-muted-foreground">Carga masiva de productos</p>
                  </div>
                  <input type="file" accept=".csv" className="hidden" onChange={e => toast.info('Importación en desarrollo')} />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {(showNewProduct || selectedProduct) && (
        <ProductModal
          product={selectedProduct}
          categories={categories}
          onSave={saveProduct}
          onClose={() => { setShowNewProduct(false); setSelectedProduct(null) }}
        />
      )}

      {/* Category dialog */}
      {(showNewCategory || editCategory) && (
        <CategoryDialog
          initial={editCategory}
          onSave={saveCategory}
          onClose={() => { setShowNewCategory(false); setEditCategory(null) }}
        />
      )}

      {/* Movement dialog */}
      {showMovement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setShowMovement(false)}>
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">Registrar movimiento</h3>
              <button onClick={() => setShowMovement(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tipo</label>
                <div className="flex gap-2 mt-1.5">
                  {[['in','Entrada','text-green-600'],['out','Salida','text-red-500'],['adjustment','Ajuste','text-blue-500']].map(([v,l,c]) => (
                    <button key={v} onClick={() => setMovForm(f => ({ ...f, type: v }))}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-colors ${movForm.type === v ? `bg-foreground text-background border-foreground` : 'border-border hover:border-foreground/30'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Producto</label>
                <select value={movForm.product_id} onChange={e => setMovForm(f => ({ ...f, product_id: e.target.value, variant_id: '' }))}
                  className="mt-1.5 w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none bg-background">
                  <option value="">Seleccionar...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {movForm.product_id && (
                <>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Color (opcional)</label>
                    <select value={movForm.variant_id} onChange={e => setMovForm(f => ({ ...f, variant_id: e.target.value }))}
                      className="mt-1.5 w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none bg-background">
                      <option value="">Todos los colores</option>
                      {(products.find(p => p.id === movForm.product_id)?.variants || []).map(v => (
                        <option key={v.id} value={v.id}>{v.color_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Talla</label>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {SIZES.map(sz => (
                        <button key={sz} onClick={() => setMovForm(f => ({ ...f, size: sz }))}
                          className={`w-10 h-10 text-xs font-bold rounded-xl border transition-colors ${movForm.size === sz ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground/30'}`}>
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cantidad</label>
                <input type="number" min="1" value={movForm.quantity} onChange={e => setMovForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="0" className="mt-1.5 w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none bg-background" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nota (opcional)</label>
                <input value={movForm.note} onChange={e => setMovForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Entrada de mercadería, venta, etc."
                  className="mt-1.5 w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none bg-background" />
              </div>
              <button onClick={addMovement}
                className="w-full py-2.5 bg-foreground text-background text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">
                Registrar movimiento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Category Dialog ────────────────────────────────────────────
function CategoryDialog({ initial, onSave, onClose }) {
  const [form, setForm] = useState(() => initial || { id: `cat_${Date.now()}`, name: '', emoji: '📁', color: '#3b82f6' })
  const EMOJIS = ['👕','👖','👗','🧥','👜','👠','🩱','👙','🧣','🧤','🧦','💍','👒','🎩','🪖','🥻','🩴','👟','👞','👢']
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold">{initial ? 'Editar categoría' : 'Nueva categoría'}</h3>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nombre</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Tops, Pantalones..."
              className="mt-1.5 w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none bg-background" autoFocus />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Emoji</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className={`w-8 h-8 rounded-lg text-base flex items-center justify-center hover:bg-accent transition-colors ${form.emoji === e ? 'bg-accent ring-2 ring-foreground' : ''}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Color</label>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {['#3b82f6','#8b5cf6','#ec4899','#ef4444','#f59e0b','#22c55e','#06b6d4','#6b7280','#1a1a1a'].map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className="w-7 h-7 rounded-full cursor-pointer border-0 p-0" title="Color personalizado" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 text-xs font-bold border border-border rounded-xl hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={() => { if (!form.name.trim()) return toast.error('Nombre requerido'); onSave(form) }}
              className="flex-1 py-2.5 text-xs font-bold bg-foreground text-background rounded-xl hover:opacity-90 transition-opacity">
              {initial ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
