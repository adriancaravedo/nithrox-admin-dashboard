import { useState, useRef } from 'react'
import Topbar from '../../../components/layout/Topbar'
import { toast } from 'sonner'
import {
  Zap, Link, Code, Download, Copy, ChevronDown,
  CheckCircle2, AlertTriangle, Loader2, Settings,
  ExternalLink, Plus, X, Eye, FileCode
} from 'lucide-react'

// ── Load API keys from localStorage (saved in Settings page) ─
function getApiKeys() {
  try {
    const s = localStorage.getItem('ntx_settings')
    if (s) {
      const parsed = JSON.parse(s)
      return { claude: parsed.api_keys?.claude || '', figma: parsed.api_keys?.figma || '' }
    }
  } catch {}
  return { claude: '', figma: '' }
}

// ── Framework configs ────────────────────────────────────────
const FRAMEWORKS = [
  { id: 'react_tailwind', label: 'React + Tailwind', icon: '⚛️', desc: 'JSX components con Tailwind CSS v3' },
  { id: 'react_css',      label: 'React + CSS',      icon: '⚛️', desc: 'JSX components con CSS Modules' },
  { id: 'nextjs',         label: 'Next.js 14+',      icon: '▲',  desc: 'App Router, Server Components' },
  { id: 'html_css',       label: 'HTML + CSS',       icon: '🌐', desc: 'HTML5 + CSS3 puro, sin frameworks' },
  { id: 'html_tailwind',  label: 'HTML + Tailwind',  icon: '🌐', desc: 'HTML5 con Tailwind CDN' },
  { id: 'wordpress',      label: 'WordPress',        icon: '📝', desc: 'PHP template + ACF' },
  { id: 'vue',            label: 'Vue 3',            icon: '💚', desc: 'Composition API + <script setup>' },
  { id: 'flutter',        label: 'Flutter',          icon: '💙', desc: 'Dart Widgets' },
]

const CSS_CONVENTIONS = [
  { id: 'tailwind', label: 'Tailwind CSS' },
  { id: 'bem', label: 'BEM (.block__element)' },
  { id: 'modules', label: 'CSS Modules' },
  { id: 'styled', label: 'Styled Components' },
  { id: 'plain', label: 'CSS plano' },
]

const BREAKPOINTS = [
  { id: 'mobile', label: '📱 Mobile', px: '375px' },
  { id: 'tablet', label: '💻 Tablet', px: '768px' },
  { id: 'desktop', label: '🖥️ Desktop', px: '1440px' },
]

const NAMING_CONVENTIONS = [
  { id: 'camelCase', label: 'camelCase', ex: 'heroSection' },
  { id: 'PascalCase', label: 'PascalCase', ex: 'HeroSection' },
  { id: 'kebab-case', label: 'kebab-case', ex: 'hero-section' },
  { id: 'snake_case', label: 'snake_case', ex: 'hero_section' },
]

// ── Generated file card ──────────────────────────────────────
function FileCard({ file, onCopy, onDownload }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <FileCode className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-bold font-mono">{file.name}</span>
          <span className="text-[9px] bg-muted px-2 py-0.5 rounded font-bold uppercase">{file.type}</span>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onCopy(file)}
            className="p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDownload(file)}
            className="p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {expanded && (
        <pre className="p-4 text-[11px] font-mono overflow-x-auto max-h-96 overflow-y-auto bg-zinc-950 text-green-400 leading-relaxed">
          {file.content}
        </pre>
      )}
    </div>
  )
}

// ── Build the prompt for Claude ──────────────────────────────
function buildPrompt(config, figmaData) {
  const fw = FRAMEWORKS.find(f => f.id === config.framework)
  const bps = config.breakpoints.map(b => BREAKPOINTS.find(x => x.id === b)?.px).filter(Boolean)

  return `You are an expert frontend developer converting a Figma design to ${fw?.label} code.

## PROJECT CONFIGURATION
- Framework: ${fw?.label} (${fw?.desc})
- CSS approach: ${config.css_convention}
- Naming convention: ${config.naming_convention}
- Breakpoints to implement: ${bps.join(', ')}
- Language: ${config.language || 'Spanish (UI text should stay as-is from design)'}
- Pixel-perfect: YES — match exact measurements, colors, spacing from Figma
- Dark mode: ${config.dark_mode ? 'YES — implement dark mode variants' : 'NO'}
- Animations: ${config.animations ? 'YES — add smooth CSS transitions' : 'Minimal only'}
- Accessibility: WCAG 2.1 AA — proper aria labels, semantic HTML, keyboard nav

## CUSTOM INSTRUCTIONS FROM DEVELOPER
${config.custom_instructions || 'None'}

## DESIGN TOKENS (extracted from Figma)
Colors: ${figmaData?.colors?.join(', ') || 'Extract from design'}
Typography: ${figmaData?.fonts?.join(', ') || 'Extract from design'}
Spacing: ${figmaData?.spacing || '4px base unit grid'}

## FIGMA STRUCTURE
${figmaData?.structure || 'Analyze the Figma link provided and extract all layers, components, and layout information.'}

## YOUR TASK
1. Generate COMPLETE, production-ready code — no placeholders, no TODOs
2. Each component/section as a SEPARATE file
3. Use EXACT colors, fonts, spacing from the design
4. Implement ALL breakpoints specified
5. Add proper comments for developer reference
6. Export a complete file structure

## OUTPUT FORMAT
Respond with a JSON array of files:
[
  {
    "name": "filename.ext",
    "type": "component|page|style|config",
    "content": "FULL file content here",
    "description": "What this file does"
  }
]

IMPORTANT: Return ONLY the JSON array. No markdown, no explanations outside the JSON.`
}

// ── Main Converter ───────────────────────────────────────────
export default function ConverterPage() {
  const [step, setStep] = useState('config') // config | analyzing | results
  const [config, setConfig] = useState({
    figma_url: '',
    framework: 'react_tailwind',
    css_convention: 'tailwind',
    naming_convention: 'PascalCase',
    breakpoints: ['mobile', 'desktop'],
    dark_mode: false,
    animations: true,
    language: 'es',
    custom_instructions: '',
    component_name: '',
  })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState(null)
  const [analysisLog, setAnalysisLog] = useState([])
  const set = (k, v) => setConfig(p => ({ ...p, [k]: v }))

  const keys = getApiKeys()
  const hasClaude = !!keys.claude
  const hasFigma = !!keys.figma

  const addLog = (msg, type = 'info') => {
    setAnalysisLog(p => [...p, { msg, type, ts: new Date().toLocaleTimeString('es-PE') }])
  }

  // ── Simulate Figma analysis (in real app, call Figma API) ──
  const analyzeFigma = async (url) => {
    addLog('Conectando con Figma API...', 'info')
    await new Promise(r => setTimeout(r, 800))

    if (!hasFigma) {
      addLog('⚠️ Sin Figma token — usando análisis simulado', 'warning')
      return {
        colors: ['#18181b', '#3b82f6', '#f4f4f5', '#ffffff', '#ef4444'],
        fonts: ['Inter', 'Geist Mono'],
        spacing: '4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px',
        structure: `Frame: ${url.includes('figma.com') ? 'Detected Figma URL' : 'Design file'}
Components detected: Hero, Navigation, Cards, Footer
Layers: 48 layers analyzed
Auto-layout: Active on 32 elements
Text styles: 6 defined
Color styles: 12 defined`,
      }
    }

    // Real Figma API call
    addLog('Extrayendo datos del diseño...', 'info')
    const fileId = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/)?.[1]
    if (!fileId) throw new Error('URL de Figma inválida. Formato: figma.com/file/ID o figma.com/design/ID')

    try {
      const res = await fetch(`https://api.figma.com/v1/files/${fileId}`, {
        headers: { 'X-Figma-Token': keys.figma }
      })
      if (!res.ok) throw new Error(`Figma API error: ${res.status}`)
      const data = await res.json()

      addLog(`✓ Archivo: "${data.name}"`, 'success')
      addLog(`✓ ${data.document?.children?.length || 0} páginas encontradas`, 'success')

      return {
        colors: ['extracted from figma'],
        fonts: ['extracted from figma'],
        spacing: '4px base unit',
        structure: `Figma file: ${data.name}\nPages: ${data.document?.children?.map(c => c.name).join(', ')}\nLast modified: ${data.lastModified}`,
        raw: data
      }
    } catch (e) {
      addLog(`⚠️ ${e.message} — usando simulación`, 'warning')
      return { colors: ['#18181b','#3b82f6'], fonts: ['Inter'], spacing: '4px unit', structure: 'Simulated analysis' }
    }
  }

  // ── Call Claude API ────────────────────────────────────────
  const callClaude = async (prompt) => {
    if (!hasClaude) {
      // Return simulated response
      addLog('⚠️ Sin Claude API key — usando respuesta simulada', 'warning')
      await new Promise(r => setTimeout(r, 1500))

      const fw = FRAMEWORKS.find(f => f.id === config.framework)
      const compName = config.component_name || 'HeroSection'

      if (config.framework === 'react_tailwind' || config.framework === 'nextjs') {
        return [
          {
            name: `${compName}.jsx`,
            type: 'component',
            description: `Componente principal — ${compName}`,
            content: `import { useState } from 'react'\n\nexport default function ${compName}() {\n  return (\n    <section className="relative min-h-screen flex items-center justify-center bg-zinc-900 overflow-hidden">\n      {/* Background gradient */}\n      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />\n      \n      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">\n        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-6">\n          Tu diseño convertido\n          <span className="block text-blue-400 mt-2">a código limpio</span>\n        </h1>\n        \n        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-zinc-400 mb-10">\n          Este componente fue generado automáticamente desde tu diseño en Figma\n          con las especificaciones exactas de colores, tipografía y espaciado.\n        </p>\n        \n        <div className="flex flex-col sm:flex-row gap-4 justify-center">\n          <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl transition-all duration-200 hover:scale-105">\n            Comenzar ahora\n          </button>\n          <button className="px-8 py-4 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-semibold rounded-2xl transition-all duration-200">\n            Ver más\n          </button>\n        </div>\n      </div>\n    </section>\n  )\n}`
          },
          {
            name: 'index.js',
            type: 'config',
            description: 'Barrel export',
            content: `export { default } from './${compName}'`
          },
          {
            name: 'README.md',
            type: 'config',
            description: 'Instrucciones de uso',
            content: `# ${compName}\n\nComponente generado desde Figma por NTX Converter.\n\n## Uso\n\n\`\`\`jsx\nimport ${compName} from './${compName}'\n\nexport default function App() {\n  return <${compName} />\n}\n\`\`\`\n\n## Stack\n- ${fw?.label}\n- Tailwind CSS v3\n- Responsive: Mobile (375px) → Desktop (1440px)\n\n## Generado por\nNTX Labs Converter — nithrox.com`
          }
        ]
      }

      return [
        {
          name: 'index.html',
          type: 'page',
          description: 'Página principal',
          content: `<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${compName}</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <section class="hero">\n    <div class="hero__container">\n      <h1 class="hero__title">Tu diseño, hecho código</h1>\n      <p class="hero__subtitle">Generado automáticamente desde Figma</p>\n      <a href="#" class="hero__cta">Comenzar</a>\n    </div>\n  </section>\n  <script src="main.js"></script>\n</body>\n</html>`
        },
        {
          name: 'styles.css',
          type: 'style',
          description: 'Estilos CSS',
          content: `/* ${compName} — NTX Converter */\n*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n\n:root {\n  --color-primary: #3b82f6;\n  --color-bg: #18181b;\n  --color-text: #ffffff;\n  --color-muted: #71717a;\n  --font-main: 'Inter', system-ui, sans-serif;\n  --spacing-unit: 4px;\n}\n\nbody { font-family: var(--font-main); background: var(--color-bg); color: var(--color-text); }\n\n.hero {\n  min-height: 100vh;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: calc(var(--spacing-unit) * 8);\n}\n\n.hero__container { max-width: 800px; text-align: center; }\n.hero__title { font-size: clamp(2rem, 5vw, 4rem); font-weight: 700; margin-bottom: calc(var(--spacing-unit) * 6); }\n.hero__subtitle { font-size: 1.125rem; color: var(--color-muted); margin-bottom: calc(var(--spacing-unit) * 10); }\n.hero__cta { display: inline-block; padding: 1rem 2rem; background: var(--color-primary); color: white; border-radius: 12px; text-decoration: none; font-weight: 600; transition: opacity 0.2s; }\n.hero__cta:hover { opacity: 0.85; }`
        }
      ]
    }

    // Real Claude API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': keys.claude,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message || `API error ${response.status}`)
    }

    const data = await response.json()
    const text = data.content[0]?.text || ''

    // Parse JSON response
    const clean = text.replace(/```json|```/g, '').trim()
    const startIdx = clean.indexOf('[')
    const endIdx = clean.lastIndexOf(']')
    if (startIdx === -1) throw new Error('La respuesta no contiene código generado válido')

    return JSON.parse(clean.slice(startIdx, endIdx + 1))
  }

  // ── Main conversion flow ────────────────────────────────────
  const handleConvert = async () => {
    if (!config.figma_url) { toast.error('Ingresa el link de Figma'); return }
    if (!config.figma_url.includes('figma.com')) { toast.error('El link debe ser de figma.com'); return }

    setLoading(true)
    setError(null)
    setResults([])
    setAnalysisLog([])
    setStep('analyzing')

    try {
      // Step 1: Analyze Figma
      setLoadingMsg('Analizando diseño en Figma...')
      addLog('Iniciando análisis del diseño', 'info')
      const figmaData = await analyzeFigma(config.figma_url)
      addLog('✓ Diseño analizado correctamente', 'success')

      // Step 2: Build prompt
      setLoadingMsg('Construyendo instrucciones para Claude...')
      addLog('Preparando contexto para conversión', 'info')
      const prompt = buildPrompt(config, figmaData)
      addLog(`✓ Prompt construido (${prompt.length} chars)`, 'success')

      // Step 3: Call Claude
      setLoadingMsg('Claude está convirtiendo el diseño a código...')
      addLog('Enviando a Claude API...', 'info')
      const files = await callClaude(prompt)
      addLog(`✓ ${files.length} archivos generados`, 'success')

      setResults(files)
      setStep('results')
      toast.success(`¡Conversión completa! ${files.length} archivos generados`)
    } catch (e) {
      setError(e.message)
      setStep('config')
      addLog(`✗ Error: ${e.message}`, 'error')
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadAll = () => {
    results.forEach(file => {
      const blob = new Blob([file.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = file.name; a.click()
    })
    toast.success('Archivos descargados')
  }

  const copyFile = (file) => {
    navigator.clipboard?.writeText(file.content)
    toast.success(`${file.name} copiado`)
  }

  const downloadFile = (file) => {
    const blob = new Blob([file.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = file.name; a.click()
  }

  // ── API key warning ─────────────────────────────────────────
  const ApiWarning = () => (!hasClaude || !hasFigma) ? (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-5">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 text-xs text-amber-700 dark:text-amber-400">
        <p className="font-bold mb-1">Configuración incompleta</p>
        {!hasClaude && <p>• Falta Claude API key — ve a <strong>Ajustes</strong> para agregarla</p>}
        {!hasFigma && <p>• Falta Figma token — ve a <strong>Ajustes</strong> para agregarlo</p>}
        <p className="mt-1 opacity-70">Sin las keys, se usarán respuestas simuladas para demostración.</p>
      </div>
    </div>
  ) : null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="CONVERTER" actions={
        step === 'results' ? (
          <div className="flex gap-2">
            <button onClick={() => setStep('config')}
              className="px-3 py-1.5 text-xs font-bold border border-border rounded-full hover:bg-accent uppercase tracking-wider">
              ← Nueva conversión
            </button>
            <button onClick={downloadAll}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 uppercase tracking-wider">
              <Download className="w-3.5 h-3.5" /> Descargar todo ({results.length} archivos)
            </button>
          </div>
        ) : null
      } />

      <div className="flex-1 overflow-y-auto">

        {/* ── CONFIG ───────────────────────────────────────── */}
        {step === 'config' && (
          <div className="max-w-2xl mx-auto p-6 space-y-6">
            <ApiWarning />

            {/* Figma URL */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Link de Figma *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={config.figma_url}
                    onChange={e => set('figma_url', e.target.value)}
                    placeholder="https://figma.com/file/... o https://figma.com/design/..."
                    className="w-full pl-9 pr-3 py-3 border border-border rounded-xl text-sm outline-none focus:border-primary bg-background"
                  />
                </div>
                {config.figma_url && (
                  <a href={config.figma_url} target="_blank" rel="noopener noreferrer"
                    className="px-3 border border-border rounded-xl hover:bg-accent flex items-center text-muted-foreground hover:text-foreground">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Asegúrate de que el archivo sea público o hayas configurado el Figma token en Ajustes.</p>
            </div>

            {/* Component name */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nombre del componente / página</label>
              <input value={config.component_name} onChange={e => set('component_name', e.target.value)}
                placeholder="HeroSection, ProductCard, LandingPage..."
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm outline-none focus:border-primary bg-background" />
            </div>

            {/* Framework */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Framework de salida</label>
              <div className="grid grid-cols-2 gap-2">
                {FRAMEWORKS.map(fw => (
                  <button key={fw.id} onClick={() => set('framework', fw.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${config.framework === fw.id ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/30'}`}>
                    <span className="text-lg shrink-0">{fw.icon}</span>
                    <div>
                      <p className="text-xs font-bold">{fw.label}</p>
                      <p className="text-[10px] text-muted-foreground">{fw.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Breakpoints */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Breakpoints a generar</label>
              <div className="flex gap-2">
                {BREAKPOINTS.map(bp => {
                  const selected = config.breakpoints.includes(bp.id)
                  return (
                    <button key={bp.id}
                      onClick={() => set('breakpoints', selected ? config.breakpoints.filter(x => x !== bp.id) : [...config.breakpoints, bp.id])}
                      className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${selected ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/30'}`}>
                      <p className="text-sm">{bp.label.split(' ')[0]}</p>
                      <p className="text-xs font-bold">{bp.label.split(' ')[1]}</p>
                      <p className="text-[10px] text-muted-foreground">{bp.px}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* CSS + Naming */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Convención CSS</label>
                <div className="space-y-1.5">
                  {CSS_CONVENTIONS.map(c => (
                    <label key={c.id} className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-accent/50 transition-colors">
                      <div onClick={() => set('css_convention', c.id)}
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.css_convention === c.id ? 'border-foreground bg-foreground' : 'border-border'}`}>
                        {config.css_convention === c.id && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                      </div>
                      <span className="text-xs">{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nombres de clases/vars</label>
                <div className="space-y-1.5">
                  {NAMING_CONVENTIONS.map(c => (
                    <label key={c.id} className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-accent/50 transition-colors">
                      <div onClick={() => set('naming_convention', c.id)}
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.naming_convention === c.id ? 'border-foreground bg-foreground' : 'border-border'}`}>
                        {config.naming_convention === c.id && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                      </div>
                      <div>
                        <p className="text-xs">{c.label}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{c.ex}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: 'dark_mode', l: 'Dark mode', sub: 'Generar variante oscura' },
                { k: 'animations', l: 'Animaciones CSS', sub: 'Hover, transiciones suaves' },
              ].map(opt => (
                <button key={opt.k} onClick={() => set(opt.k, !config[opt.k])}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${config[opt.k] ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/20'}`}>
                  <div className={`w-9 h-5 rounded-full transition-colors relative ${config[opt.k] ? 'bg-foreground' : 'bg-muted'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${config[opt.k] ? 'left-4.5' : 'left-0.5'}`}
                      style={{ left: config[opt.k] ? '18px' : '2px' }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold">{opt.l}</p>
                    <p className="text-[10px] text-muted-foreground">{opt.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom instructions */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Instrucciones adicionales (opcional)</label>
              <textarea value={config.custom_instructions} onChange={e => set('custom_instructions', e.target.value)}
                placeholder="Ej: Usa Geist Mono como fuente principal. Todos los botones deben tener border-radius: 12px. El header debe ser sticky..."
                rows={3} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm outline-none focus:border-primary bg-background resize-none" />
            </div>

            {/* Convert button */}
            <button onClick={handleConvert} disabled={!config.figma_url || loading}
              className="w-full py-4 bg-foreground text-background font-bold rounded-2xl text-sm hover:bg-foreground/90 disabled:opacity-40 transition-all uppercase tracking-widest flex items-center justify-center gap-3">
              <Zap className="w-5 h-5" />
              {hasClaude ? 'Convertir diseño con Claude AI' : 'Convertir (modo demo)'}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ── ANALYZING ────────────────────────────────────── */}
        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <div className="w-full max-w-md space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-background animate-spin" />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest">{loadingMsg}</p>
                <p className="text-xs text-muted-foreground mt-1">Esto puede tomar 10-30 segundos</p>
              </div>

              {/* Progress log */}
              <div className="bg-zinc-950 rounded-xl p-4 font-mono text-xs space-y-1.5 max-h-56 overflow-y-auto">
                {analysisLog.map((log, i) => (
                  <div key={i} className={`flex items-start gap-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-zinc-400'}`}>
                    <span className="text-zinc-600 shrink-0">{log.ts}</span>
                    <span>{log.msg}</span>
                  </div>
                ))}
                {analysisLog.length === 0 && <div className="text-zinc-600">Iniciando...</div>}
              </div>
            </div>
          </div>
        )}

        {/* ── RESULTS ──────────────────────────────────────── */}
        {step === 'results' && (
          <div className="p-6 space-y-4">
            {/* Summary */}
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-800 dark:text-green-400">
                  ¡Conversión exitosa! {results.length} archivos generados
                </p>
                <p className="text-xs text-green-700 dark:text-green-500 mt-0.5">
                  {FRAMEWORKS.find(f => f.id === config.framework)?.label} ·
                  Breakpoints: {config.breakpoints.join(', ')} ·
                  {hasClaude ? 'Generado con Claude API' : 'Modo demo'}
                </p>
              </div>
            </div>

            {/* Analysis log */}
            {analysisLog.length > 0 && (
              <details className="group">
                <summary className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground">
                  Ver log de análisis ({analysisLog.length} pasos)
                </summary>
                <div className="mt-2 bg-zinc-950 rounded-xl p-4 font-mono text-xs space-y-1 max-h-40 overflow-y-auto">
                  {analysisLog.map((log, i) => (
                    <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-zinc-400'}`}>
                      <span className="text-zinc-600 shrink-0">{log.ts}</span>
                      <span>{log.msg}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Files */}
            <div className="space-y-3">
              {results.map((file, i) => (
                <FileCard key={i} file={file} onCopy={copyFile} onDownload={downloadFile} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
