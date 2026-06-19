import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

// ── Theme presets (must match FormsPage) ─────────────────────
const THEMES = [
  { id: 'dark',     bg: '#18181b', text: '#ffffff', accent: '#3b82f6', inputBg: '#27272a', inputBorder: '#3f3f46', btnText: '#18181b' },
  { id: 'midnight', bg: '#0f172a', text: '#f8fafc', accent: '#818cf8', inputBg: '#1e293b', inputBorder: '#334155', btnText: '#0f172a' },
  { id: 'forest',   bg: '#14532d', text: '#f0fdf4', accent: '#4ade80', inputBg: '#166534', inputBorder: '#15803d', btnText: '#14532d' },
  { id: 'ocean',    bg: '#0c4a6e', text: '#f0f9ff', accent: '#38bdf8', inputBg: '#075985', inputBorder: '#0369a1', btnText: '#0c4a6e' },
  { id: 'sunset',   bg: '#7c2d12', text: '#fff7ed', accent: '#fb923c', inputBg: '#9a3412', inputBorder: '#c2410c', btnText: '#7c2d12' },
  { id: 'purple',   bg: '#4c1d95', text: '#f5f3ff', accent: '#a78bfa', inputBg: '#5b21b6', inputBorder: '#6d28d9', btnText: '#4c1d95' },
  { id: 'white',    bg: '#ffffff', text: '#18181b', accent: '#18181b', inputBg: '#f4f4f5', inputBorder: '#e4e4e7', btnText: '#ffffff' },
  { id: 'custom',   bg: '#18181b', text: '#ffffff', accent: '#3b82f6', inputBg: '#27272a', inputBorder: '#3f3f46', btnText: '#18181b' },
]
const FONTS = {
  mono: "'Geist Mono', monospace",
  inter: "'Inter', system-ui, sans-serif",
  serif: 'Georgia, serif',
  rounded: "'Nunito', sans-serif",
  system: 'system-ui, sans-serif',
}

// ── Spinner ───────────────────────────────────────────────────
function Spinner({ color }) {
  return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${color}30`, borderTopColor: color, animation: 'spin 0.8s linear infinite' }} />
  )
}

// ── Public Form Renderer ──────────────────────────────────────
function FormRenderer({ form }) {
  const themeBase = THEMES.find(t => t.id === (form.theme?.preset || 'dark')) || THEMES[0]
  const t = form.theme?.preset === 'custom' ? { ...themeBase, ...form.theme?.custom } : themeBase
  const font = FONTS[form.theme?.font || 'mono']
  const layout = form.layout || 'one_by_one'
  const borderRadius = { none: '0px', sm: '4px', lg: '12px', xl: '16px', full: '9999px' }[form.theme?.radius || 'xl']

  const allQuestions = form.questions || []
  const [current, setCurrent] = useState(-1)
  const [answers, setAnswers] = useState({})
  const [otherValues, setOtherValues] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const visibleQuestions = allQuestions.filter(q => {
    if (!q.logic?.length) return true
    return q.logic.every(rule => {
      if (rule.action !== 'show') return true
      return String(answers[rule.if_question]) === String(rule.if_answer)
    })
  })

  const q = visibleQuestions[current]
  const answer = answers[q?.id] ?? (q?.type === 'multiple' ? [] : q?.type === 'scale' ? (q?.min || 0) : '')
  const setAnswer = val => setAnswers(p => ({ ...p, [q.id]: val }))

  const canNext = !q?.required || (
    q.type === 'multiple' ? (answer?.length > 0) :
    q.type === 'yesno' ? (answer !== '') :
    (answer !== '' && answer !== undefined && answer !== null)
  )

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await supabase.from('form_responses').insert({
        form_id: form.id,
        answers,
        submitted_at: new Date().toISOString(),
      })
    } catch {}
    // Update response count in forms table
    try {
      await supabase.from('forms').update({ views: (form.views || 0) + 1 }).eq('id', form.id)
    } catch {}
    setSubmitted(true)
    setSubmitting(false)

    if (form.outro?.redirect_url) {
      setTimeout(() => { window.location.href = form.outro.redirect_url }, 2500)
    }
  }

  const handleNext = () => {
    if (current === -1) { setCurrent(0); return }
    if (current < visibleQuestions.length - 1) setCurrent(c => c + 1)
    else handleSubmit()
  }

  const introTitle = form.intro?.title || form.name
  const introDesc = form.intro?.description || 'Por favor completa este formulario. Solo tomará unos minutos.'
  const introBtnLabel = form.intro?.button_label || 'Comenzar →'
  const outroTitle = form.outro?.title || '¡Gracias!'
  const outroDesc = form.outro?.description || 'Recibimos tus respuestas. Te contactaremos pronto.'
  const progress = current >= 0 ? ((current + 1) / visibleQuestions.length) * 100 : 0
  const qSize = { lg: '24px', xl: '28px', '2xl': '36px' }[form.theme?.question_size || 'xl']

  const inputStyle = { backgroundColor: t.inputBg, border: `1.5px solid ${t.inputBorder}`, color: t.text, borderRadius, fontFamily: font }
  const btnStyle = { backgroundColor: t.accent, color: t.btnText, borderRadius, fontFamily: font, cursor: 'pointer', border: 'none' }

  const renderInput = () => {
    if (!q) return null
    if (q.type === 'section') return (
      <div className="text-center py-8">
        <div className="w-16 h-px mx-auto mb-6" style={{ backgroundColor: t.text + '30' }} />
        <p className="text-sm font-bold uppercase tracking-widest" style={{ color: t.text + '70' }}>{q.label}</p>
        {q.description && <p className="text-sm mt-2" style={{ color: t.text + '60' }}>{q.description}</p>}
        <button onClick={handleNext} style={{ ...btnStyle, marginTop: '24px', padding: '10px 24px', fontSize: '14px', fontWeight: 'bold' }}>Continuar →</button>
      </div>
    )
    if (q.type === 'statement') return (
      <div className="py-4">
        {q.description && <p className="text-base leading-relaxed" style={{ color: t.text + '80' }}>{q.description}</p>}
        <button onClick={handleNext} style={{ ...btnStyle, marginTop: '24px', padding: '10px 24px', fontSize: '14px', fontWeight: 'bold' }}>Entendido →</button>
      </div>
    )
    if (['short', 'email', 'phone', 'url', 'number'].includes(q.type)) return (
      <input type={q.type === 'number' ? 'number' : q.type === 'email' ? 'email' : 'text'}
        value={answer} onChange={e => setAnswer(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && canNext && handleNext()}
        placeholder={q.placeholder || 'Tu respuesta...'}
        style={{ ...inputStyle, fontSize: '18px', padding: '12px 16px', width: '100%', outline: 'none' }} autoFocus />
    )
    if (q.type === 'long') return (
      <textarea value={answer} onChange={e => setAnswer(e.target.value)}
        placeholder={q.placeholder || 'Tu respuesta...'}
        rows={4} style={{ ...inputStyle, fontSize: '16px', padding: '12px 16px', width: '100%', outline: 'none', resize: 'none' }} autoFocus />
    )
    if (q.type === 'date') return (
      <input type="date" value={answer} onChange={e => setAnswer(e.target.value)}
        style={{ ...inputStyle, fontSize: '16px', padding: '12px 16px', outline: 'none', colorScheme: 'dark' }} autoFocus />
    )
    if (q.type === 'yesno') return (
      <div style={{ display: 'flex', gap: '16px' }}>
        {['Sí', 'No'].map(opt => (
          <button key={opt}
            onClick={() => { setAnswer(opt); layout === 'one_by_one' && setTimeout(handleNext, 300) }}
            style={{ ...inputStyle, padding: '16px 32px', fontSize: '16px', fontWeight: 'bold', flex: 1, cursor: 'pointer', ...(answer === opt ? { borderColor: t.accent, backgroundColor: t.accent + '25' } : {}) }}>
            {opt === 'Sí' ? '👍 Sí' : '👎 No'}
          </button>
        ))}
      </div>
    )
    if (q.type === 'choice') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {(q.options || []).map((opt, i) => (
          <button key={i}
            onClick={() => { setAnswer(opt); layout === 'one_by_one' && setTimeout(handleNext, 300) }}
            style={{ ...inputStyle, padding: '12px 16px', fontSize: '14px', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', ...(answer === opt ? { borderColor: t.accent, backgroundColor: t.accent + '20' } : {}) }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${answer === opt ? t.accent : t.inputBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: answer === opt ? t.accent : 'transparent' }}>
              {answer === opt && <span style={{ color: t.btnText, fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
            </span>
            {String.fromCharCode(65 + i)} — {opt}
          </button>
        ))}
        {q.allow_other && (
          <div style={{ ...inputStyle, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${t.inputBorder}`, flexShrink: 0 }} />
            <input value={otherValues[q.id] || ''}
              onChange={e => { setOtherValues(p => ({ ...p, [q.id]: e.target.value })); setAnswer(`Otro: ${e.target.value}`) }}
              placeholder="Otro..." style={{ background: 'transparent', border: 'none', outline: 'none', color: t.text, fontFamily: font, flex: 1 }} />
          </div>
        )}
      </div>
    )
    if (q.type === 'multiple') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {(q.options || []).map((opt, i) => {
          const sel = (answer || []).includes(opt)
          return (
            <button key={i}
              onClick={() => setAnswer(sel ? (answer || []).filter(x => x !== opt) : [...(answer || []), opt])}
              style={{ ...inputStyle, padding: '12px 16px', fontSize: '14px', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', ...(sel ? { borderColor: t.accent, backgroundColor: t.accent + '20' } : {}) }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${sel ? t.accent : t.inputBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: sel ? t.accent : 'transparent' }}>
                {sel && <span style={{ color: t.btnText, fontSize: '11px' }}>✓</span>}
              </span>
              {opt}
            </button>
          )
        })}
      </div>
    )
    if (['rating', 'nps'].includes(q.type)) return (
      <div>
        {q.label_left && q.label_right && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '8px', color: t.text + '60' }}>
            <span>{q.label_left}</span><span>{q.label_right}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Array.from({ length: (q.max || 10) - (q.min || (q.type === 'nps' ? 0 : 1)) + 1 }, (_, i) => i + (q.min || (q.type === 'nps' ? 0 : 1))).map(n => (
            <button key={n}
              onClick={() => { setAnswer(n); layout === 'one_by_one' && setTimeout(handleNext, 300) }}
              style={{ width: '44px', height: '44px', borderRadius, border: `2px solid ${answer === n ? t.accent : t.inputBorder}`, backgroundColor: answer === n ? t.accent : t.inputBg, color: answer === n ? t.btnText : t.text, fontWeight: 'bold', fontFamily: font, fontSize: '14px', cursor: 'pointer' }}>
              {n}
            </button>
          ))}
        </div>
      </div>
    )
    if (q.type === 'scale') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input type="range" min={q.min || 0} max={q.max || 100} step={q.step || 1}
          value={answer || (q.min || 0)} onChange={e => setAnswer(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: t.accent }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: t.text + '60', fontSize: '13px' }}>{q.min || 0}</span>
          <span style={{ color: t.accent, fontWeight: 'bold', fontSize: '28px' }}>{answer || (q.min || 0)}</span>
          <span style={{ color: t.text + '60', fontSize: '13px' }}>{q.max || 100}</span>
        </div>
      </div>
    )
    if (q.type === 'upload') return (
      <div style={{ ...inputStyle, padding: '32px', textAlign: 'center', border: `2px dashed ${t.inputBorder}` }}>
        <p style={{ color: t.text + '60', fontSize: '14px' }}>📎 Arrastra o haz click para subir</p>
        <p style={{ color: t.text + '40', fontSize: '12px', marginTop: '8px' }}>PNG, JPG, PDF hasta 10MB</p>
      </div>
    )
    return null
  }

  if (layout === 'all_in_one') return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, fontFamily: font }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ color: t.text, fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>{form.name}</h1>
        {introDesc && <p style={{ color: t.text + '70', fontSize: '14px', marginBottom: '40px' }}>{introDesc}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {visibleQuestions.map((qq, i) => {
            const qAns = answers[qq.id] ?? (qq.type === 'multiple' ? [] : '')
            const setQAns = val => setAnswers(p => ({ ...p, [qq.id]: val }))
            return (
              <div key={qq.id}>
                <p style={{ color: t.text, fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {i + 1}. {qq.label} {qq.required && <span style={{ color: '#ef4444' }}>*</span>}
                </p>
                {qq.description && <p style={{ color: t.text + '60', fontSize: '13px', marginBottom: '12px' }}>{qq.description}</p>}
                {/* Input for all-in-one */}
                {['short','email','phone','url','number'].includes(qq.type) && (
                  <input type="text" value={qAns} onChange={e => setQAns(e.target.value)}
                    placeholder={qq.placeholder || 'Tu respuesta...'}
                    style={{ ...inputStyle, fontSize: '14px', padding: '10px 14px', width: '100%', outline: 'none' }} />
                )}
                {qq.type === 'long' && (
                  <textarea value={qAns} onChange={e => setQAns(e.target.value)}
                    rows={3} style={{ ...inputStyle, fontSize: '14px', padding: '10px 14px', width: '100%', outline: 'none', resize: 'none' }} />
                )}
              </div>
            )
          })}
        </div>
        {submitted ? (
          <div style={{ marginTop: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ color: t.text, fontSize: '24px', fontWeight: 'bold' }}>{outroTitle}</h2>
            <p style={{ color: t.text + '70', marginTop: '8px' }}>{outroDesc}</p>
          </div>
        ) : (
          <button onClick={handleSubmit} disabled={submitting}
            style={{ ...btnStyle, marginTop: '40px', padding: '16px 32px', fontSize: '16px', fontWeight: 'bold', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Enviando...' : 'Enviar respuestas'}
          </button>
        )}
      </div>
    </div>
  )

  // One by one
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: t.bg, fontFamily: font }}>
      {/* Progress */}
      {form.settings?.show_progress !== false && current >= 0 && (
        <div style={{ height: '3px', backgroundColor: t.inputBorder }}>
          <div style={{ height: '100%', backgroundColor: t.accent, width: `${progress}%`, transition: 'width 0.5s ease' }} />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', minHeight: 0, overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '600px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
              <h2 style={{ color: t.text, fontSize: '28px', fontWeight: 'bold', marginBottom: '12px' }}>{outroTitle}</h2>
              <p style={{ color: t.text + '70', fontSize: '16px' }}>{outroDesc}</p>
              {form.outro?.redirect_url && <p style={{ color: t.text + '40', fontSize: '12px', marginTop: '16px' }}>Redirigiendo...</p>}
            </div>
          ) : current === -1 ? (
            <div style={{ textAlign: 'center' }}>
              {form.intro?.logo && <img src={form.intro.logo} alt="logo" style={{ maxHeight: '60px', marginBottom: '24px', margin: '0 auto 24px' }} />}
              <h2 style={{ color: t.text, fontSize: qSize, fontWeight: 'bold', marginBottom: '16px', lineHeight: 1.2 }}>{introTitle}</h2>
              <p style={{ color: t.text + '70', fontSize: '16px', marginBottom: '40px', lineHeight: 1.6 }}>{introDesc}</p>
              <button onClick={handleNext} style={{ ...btnStyle, padding: '16px 32px', fontSize: '16px', fontWeight: 'bold' }}>
                {introBtnLabel}
              </button>
              {form.settings?.show_count !== false && (
                <p style={{ color: t.text + '40', fontSize: '12px', marginTop: '24px' }}>
                  {visibleQuestions.length} preguntas · ~{Math.ceil(visibleQuestions.length * 0.5)} min
                </p>
              )}
            </div>
          ) : q ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '32px' }}>
                {form.settings?.show_question_numbers !== false && (
                  <span style={{ color: t.text + '40', fontSize: '14px', fontWeight: 'bold', marginTop: '2px', flexShrink: 0 }}>{current + 1} →</span>
                )}
                <div style={{ flex: 1 }}>
                  <h2 style={{ color: t.text, fontSize: qSize, fontWeight: 'bold', lineHeight: 1.3, marginBottom: '8px' }}>
                    {q.label}
                    {q.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                  </h2>
                  {q.description && <p style={{ color: t.text + '60', fontSize: '14px', lineHeight: 1.5 }}>{q.description}</p>}
                </div>
              </div>

              {renderInput()}

              {!['yesno', 'choice', 'rating', 'nps', 'section', 'statement'].includes(q.type) && (
                <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={handleNext} disabled={!canNext || submitting}
                    style={{ ...btnStyle, padding: '12px 24px', fontSize: '14px', fontWeight: 'bold', opacity: (!canNext || submitting) ? 0.4 : 1, cursor: (!canNext || submitting) ? 'not-allowed' : 'pointer' }}>
                    {submitting ? 'Enviando...' : current < visibleQuestions.length - 1 ? 'Siguiente' : 'Enviar'} →
                  </button>
                  <span style={{ color: t.text + '40', fontSize: '12px' }}>o presiona Enter ↵</span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Nav */}
      {current >= 0 && !submitted && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderTop: `1px solid ${t.inputBorder}` }}>
          <button
            onClick={() => form.settings?.allow_back !== false && current > 0 && setCurrent(c => c - 1)}
            disabled={current === 0 || form.settings?.allow_back === false}
            style={{ color: t.text + '50', fontSize: '13px', background: 'none', border: 'none', cursor: (current === 0 || form.settings?.allow_back === false) ? 'not-allowed' : 'pointer', opacity: (current === 0 || form.settings?.allow_back === false) ? 0.3 : 1, fontFamily: font }}>
            ← Anterior
          </button>
          <span style={{ color: t.text + '30', fontSize: '12px' }}>
            {form.settings?.show_count !== false ? `${current + 1} / ${visibleQuestions.length}` : ''}
          </span>
          <div />
        </div>
      )}

      {/* Powered by */}
      <div style={{ textAlign: 'center', padding: '8px', opacity: 0.3 }}>
        <p style={{ color: t.text, fontSize: '10px', fontFamily: font }}>Powered by Nithrox</p>
      </div>
    </div>
  )
}

// ── Main: load form from Supabase ─────────────────────────────
export default function PublicForm() {
  const { formId } = useParams()
  const [form, setForm] = useState(null)
  const [status, setStatus] = useState('loading') // loading | not_found | error | closed | ok

  useEffect(() => {
    if (!formId) { setStatus('not_found'); return }
    const load = async () => {
      try {
        // Try Supabase first
        const { data, error } = await supabase
          .from('forms')
          .select('*, form_responses(*)')
          .eq('id', formId)
          .single()

        if (data) {
          if (data.status === 'draft') { setStatus('closed'); return }
          if (data.settings?.close_at && new Date(data.settings.close_at) < new Date()) { setStatus('closed'); return }
          if (data.settings?.max_responses && (data.form_responses?.length || 0) >= data.settings.max_responses) { setStatus('closed'); return }
          // Map form_responses into form.responses
          setForm({ ...data, responses: data.form_responses || [] })
          setStatus('ok')
          return
        }

        // Fallback: try localStorage (same browser as admin)
        try {
          const local = JSON.parse(localStorage.getItem('ntx_forms') || '[]')
          const found = local.find(f => f.id === formId)
          if (found) {
            if (found.status === 'draft') { setStatus('closed'); return }
            setForm(found)
            setStatus('ok')
            return
          }
        } catch {}

        setStatus(error?.code === 'PGRST116' ? 'not_found' : 'error')
      } catch {
        setStatus('error')
      }
    }
    load()
  }, [formId])

  if (status === 'loading') return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Spinner color="#3b82f6" />
    </div>
  )

  if (status === 'not_found') return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', color: '#ffffff' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</p>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Formulario no encontrado</h1>
        <p style={{ color: '#71717a', fontSize: '14px' }}>Este enlace no es válido o ha sido eliminado.</p>
      </div>
    </div>
  )

  if (status === 'closed') return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', color: '#ffffff' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</p>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Formulario cerrado</h1>
        <p style={{ color: '#71717a', fontSize: '14px' }}>Este formulario ya no está disponible.</p>
      </div>
    </div>
  )

  if (status === 'error') return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', color: '#ffffff' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</p>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Error al cargar</h1>
        <p style={{ color: '#71717a', fontSize: '14px' }}>No se pudo cargar el formulario. Intenta más tarde.</p>
      </div>
    </div>
  )

  return <FormRenderer form={form} />
}
