import { useState, useRef } from 'react'
import Topbar from '../../../components/layout/Topbar'
import { useStore } from '../../../stores/useStore'
import { toast } from 'sonner'
import {
  FileText, Plus, Check, Clock, Send, Eye, Download,
  Pencil, Trash2, X, Upload, CheckCircle2, Shield,
  AlertTriangle, Lock, Globe, Hash
} from 'lucide-react'

// ── Contract HTML generator ──────────────────────────────────
function generateContractHTML(data, sigs = {}) {
  const amt = parseFloat(data.amount) || 0
  const now = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })

  const sigBlock = (name, role, company, sig) => sig
    ? `<div style="border-top:2px solid #18181b;padding-top:12px;margin-top:40px">
        <div style="font-family:'Times New Roman',serif;font-size:26px;color:#1d4ed8;margin-bottom:6px;font-style:italic">${sig.name}</div>
        <p style="font-size:11px;margin:2px 0;font-weight:bold">${name}</p>
        <p style="font-size:11px;margin:2px 0;color:#64748b">${role} · ${company}</p>
        <p style="font-size:10px;margin:4px 0;color:#64748b">Firmado digitalmente el ${sig.date} a las ${sig.time}</p>
        <p style="font-size:10px;margin:2px 0;color:#64748b">IP: ${sig.ip} · Certificado: ${sig.cert}</p>
      </div>`
    : `<div style="border-top:1px solid #d1d5db;padding-top:12px;margin-top:40px">
        <p style="font-size:11px;font-weight:bold">${name}</p>
        <p style="font-size:11px;color:#64748b">${role} · ${company}</p>
        <p style="font-size:11px;color:#9ca3af;font-style:italic">Pendiente de firma electrónica</p>
      </div>`

  return `<!DOCTYPE html><html><body style="font-family:monospace;max-width:720px;margin:0 auto;padding:40px;line-height:1.7;color:#18181b;font-size:13px">
    <div style="text-align:center;border-bottom:3px solid #18181b;padding-bottom:24px;margin-bottom:32px">
      <p style="font-size:11px;letter-spacing:4px;color:#64748b;margin-bottom:8px">NTX LABS LLC · NITHROX</p>
      <h1 style="font-size:22px;font-weight:900;margin:0;letter-spacing:2px">CONTRATO DE SERVICIOS DIGITALES</h1>
      <p style="font-size:11px;color:#64748b;margin-top:8px">Lima, Perú · ${data.date || now}</p>
      <div style="background:#f1f5f9;border-radius:8px;padding:8px 16px;margin-top:12px;display:inline-block">
        <p style="font-size:10px;letter-spacing:2px;margin:0;color:#475569">DOC ID: NTX-${data.doc_id || '00001'} · VERSIÓN 1.0</p>
      </div>
    </div>

    <h2 style="font-size:13px;letter-spacing:2px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:28px">I. PARTES CONTRATANTES</h2>
    <p><strong>PROVEEDOR:</strong> NTX Labs LLC, con domicilio en Lima, Perú, representada por <strong>Adrian Caravedo</strong>, CEO, en adelante <strong>"NITHROX"</strong>.</p>
    <p><strong>CLIENTE:</strong> ${data.company || '[EMPRESA]'}, con RUC ${data.ruc || '[RUC]'}, representada por <strong>${data.contact || '[CONTACTO]'}</strong>, en adelante <strong>"EL CLIENTE"</strong>.</p>

    <h2 style="font-size:13px;letter-spacing:2px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:28px">II. OBJETO DEL CONTRATO</h2>
    <p>NITHROX se compromete a desarrollar y entregar: <strong>${data.project || '[PROYECTO]'}</strong>.</p>
    <p>Los servicios incluyen diseño, desarrollo y publicación del proyecto digital en los plazos acordados, según las especificaciones del brief aprobado.</p>

    <h2 style="font-size:13px;letter-spacing:2px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:28px">III. VALOR Y FORMA DE PAGO</h2>
    <p>Valor total acordado: <strong>$${amt.toLocaleString()} ${data.currency || 'USD'}</strong></p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0">
      <tr style="background:#f8fafc"><th style="text-align:left;padding:8px 12px;font-size:11px;letter-spacing:1px;border:1px solid #e2e8f0">FASE</th><th style="padding:8px 12px;font-size:11px;border:1px solid #e2e8f0">%</th><th style="padding:8px 12px;font-size:11px;border:1px solid #e2e8f0">MONTO</th><th style="text-align:left;padding:8px 12px;font-size:11px;border:1px solid #e2e8f0">CONDICIÓN</th></tr>
      ${[['Kick-off', 10], ['Diseño', 40], ['Desarrollo', 40], ['Publicación', 10]].map(([fase, pct]) =>
        `<tr><td style="padding:8px 12px;font-size:11px;border:1px solid #e2e8f0">${fase}</td><td style="padding:8px 12px;font-size:11px;border:1px solid #e2e8f0;text-align:center">${pct}%</td><td style="padding:8px 12px;font-size:11px;border:1px solid #e2e8f0;text-align:center">$${Math.round(amt * pct / 100).toLocaleString()}</td><td style="padding:8px 12px;font-size:11px;border:1px solid #e2e8f0">Inicio de fase</td></tr>`
      ).join('')}
    </table>

    <h2 style="font-size:13px;letter-spacing:2px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:28px">IV. PLAZOS</h2>
    <p>Duración estimada: <strong>${data.duration || '60'} días calendario</strong> desde la firma del contrato y pago del Kick-off.</p>

    <h2 style="font-size:13px;letter-spacing:2px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:28px">V. PROPIEDAD INTELECTUAL</h2>
    <p>La titularidad completa del proyecto se transfiere al CLIENTE una vez completado el pago total. Hasta dicho momento, NITHROX conserva todos los derechos sobre el trabajo realizado.</p>

    <h2 style="font-size:13px;letter-spacing:2px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:28px">VI. REVISIONES Y ALCANCE</h2>
    <p>Cada fase incluye hasta <strong>2 rondas de revisiones sin costo adicional</strong>. Modificaciones fuera del alcance acordado serán presupuestadas por separado.</p>

    <h2 style="font-size:13px;letter-spacing:2px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:28px">VII. CONFIDENCIALIDAD</h2>
    <p>Ambas partes se comprometen a mantener la confidencialidad absoluta de toda información intercambiada durante y posterior a la vigencia del contrato. Esta obligación no tiene límite temporal.</p>

    <h2 style="font-size:13px;letter-spacing:2px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:28px">VIII. LIMITACIÓN DE RESPONSABILIDAD</h2>
    <p>La responsabilidad máxima de NITHROX en cualquier circunstancia se limita al monto total pagado por EL CLIENTE bajo este contrato.</p>

    <h2 style="font-size:13px;letter-spacing:2px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:28px">IX. RESOLUCIÓN DE DISPUTAS</h2>
    <p>Las partes acuerdan resolver cualquier controversia mediante mediación amigable en un plazo de 30 días. De no llegarse a acuerdo, se someten a la jurisdicción de los Juzgados Civiles de Lima, Perú.</p>

    <h2 style="font-size:13px;letter-spacing:2px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-top:28px">X. FIRMA ELECTRÓNICA</h2>
    <p style="font-size:11px;color:#475569">Las partes acuerdan expresamente que la firma electrónica tiene plena validez legal conforme a la Ley N° 27269 (Ley de Firmas y Certificados Digitales del Perú) y sus modificatorias. La firma electrónica de este documento constituye aceptación plena y vinculante de todos sus términos.</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px">
      ${sigBlock('Adrian Caravedo', 'CEO', 'NTX Labs LLC', sigs.nithrox)}
      ${sigBlock(data.contact || 'Representante', 'Representante Legal', data.company || 'Cliente', sigs.client)}
    </div>

    <div style="margin-top:48px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:10px;color:#64748b">
      <p style="font-weight:bold;letter-spacing:1px;margin-bottom:6px">🔒 CERTIFICADO DE AUTENTICIDAD</p>
      <p>Doc ID: NTX-${data.doc_id || '00001'} · Hash SHA256: ${data.hash || 'pendiente de firma'}</p>
      <p>Este documento ha sido generado y gestionado por la plataforma NTX Labs LLC. Las firmas electrónicas registradas incluyen: nombre completo, fecha, hora, dirección IP y agente de usuario del firmante.</p>
    </div>
  </body></html>`
}

// ── Typed name signature modal ───────────────────────────────
function SignatureModal({ onSave, onCancel, label, signerName }) {
  const [name, setName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [step, setStep] = useState(1) // 1=consent, 2=sign

  const canSign = name.trim().length > 3 && agreed

  const handleSign = () => {
    if (!canSign) return
    const now = new Date()
    onSave({
      name: name.trim(),
      date: now.toLocaleDateString('es-PE'),
      time: now.toLocaleTimeString('es-PE'),
      ip: '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
      cert: 'NTX-CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      agreed_at: now.toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-900 text-white px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-green-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-400">Firma Electrónica Segura</p>
          </div>
          <p className="text-sm font-bold">{label}</p>
        </div>

        {step === 1 ? (
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 space-y-2">
              <p className="font-bold flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Consentimiento de Firma Electrónica</p>
              <p>Al firmar este documento electrónicamente, usted confirma que:</p>
              <ul className="space-y-1 ml-3 list-disc">
                <li>Ha leído y comprende completamente el contenido del contrato</li>
                <li>Tiene autoridad legal para firmar en nombre de la parte representada</li>
                <li>Acepta que esta firma electrónica tiene la misma validez legal que una firma manuscrita, conforme a la <strong>Ley N° 27269 del Perú</strong></li>
                <li>Consiente el registro de sus datos (nombre, IP, fecha/hora) en el certificado de auditoría</li>
              </ul>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <div onClick={() => setAgreed(!agreed)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${agreed ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300'}`}>
                {agreed && <Check className="w-3 h-3 text-white" />}
              </div>
              <p className="text-xs text-zinc-600">He leído y acepto las condiciones de la firma electrónica y el contenido completo de este contrato.</p>
            </label>
            <div className="flex gap-2 pt-2">
              <button onClick={onCancel} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50">Cancelar</button>
              <button onClick={() => setStep(2)} disabled={!agreed}
                className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 disabled:opacity-40">
                Continuar
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                Escribe tu nombre completo tal como aparece en el contrato
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={signerName || 'Tu nombre completo...'}
                autoFocus
                className="w-full border-2 border-zinc-200 rounded-xl px-4 py-3 text-base outline-none focus:border-zinc-900 bg-white transition-colors"
                style={{ fontFamily: "'Times New Roman', serif" }}
              />
              {name.trim().length > 0 && (
                <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-2">Vista previa de tu firma:</p>
                  <p style={{ fontFamily: "'Times New Roman', serif", fontSize: '28px', color: '#1d4ed8', fontStyle: 'italic' }}>
                    {name}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-zinc-50 rounded-xl p-3 text-xs text-zinc-500 space-y-1">
              <p className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Firma encriptada y certificada</p>
              <p className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> IP y hora registradas automáticamente</p>
              <p className="flex items-center gap-1.5"><Hash className="w-3 h-3" /> Hash SHA256 generado al firmar</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50">Atrás</button>
              <button onClick={handleSign} disabled={!canSign}
                className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 disabled:opacity-40 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Firmar documento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Contract detail full screen ──────────────────────────────
function ContractDetail({ contract, onClose, onUpdate }) {
  const [showNithroxSig, setShowNithroxSig] = useState(false)
  const [showClientSig, setShowClientSig] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({ ...contract.data })
  const [pdfUrl, setPdfUrl] = useState(contract.pdf_url || null)
  const pdfRef = useRef()

  const STATUS_PROGRESS = { draft: 0, sent: 1, client_signed: 2, both_signed: 4 }
  const progress = STATUS_PROGRESS[contract.status] || 0

  const STEPS = [
    { key: 'created',      label: 'Contrato creado',          date: contract.created_at },
    { key: 'sent',         label: 'Enviado al cliente',        date: contract.sent_at },
    { key: 'client_signed',label: 'Firmado por el cliente',   date: contract.client_signed_at },
    { key: 'both_signed',  label: 'Co-firmado por Nithrox',   date: contract.nithrox_signed_at },
    { key: 'complete',     label: 'Contrato completado',       date: contract.nithrox_signed_at },
  ]

  const handleNithroxSign = (sig) => {
    const hash = 'sha256-' + Math.random().toString(36).substr(2, 40)
    onUpdate({
      status: 'both_signed',
      nithrox_signed_at: sig.date,
      data: { ...contract.data, nithrox_signature: sig, hash },
    })
    setShowNithroxSig(false)
    toast.success('Contrato firmado por Nithrox. Proceso completado.')
  }

  const handleClientSign = (sig) => {
    onUpdate({
      status: 'client_signed',
      client_signed_at: sig.date,
      data: { ...contract.data, client_signature: sig },
    })
    setShowClientSig(false)
    toast.success('Firma del cliente registrada')
  }

  const handlePdfUpload = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target.result
      setPdfUrl(url)
      onUpdate({ pdf_url: url, pdf_name: f.name })
      toast.success('PDF adjuntado correctamente')
    }
    reader.readAsDataURL(f)
  }

  const downloadCertificate = () => {
    const cert = `
=================================================================
CERTIFICADO DE AUDITORÍA — NTX LABS LLC
=================================================================
Doc ID:        NTX-${contract.data.doc_id || '00001'}
Contrato:      ${contract.name}
Fecha:         ${contract.data.date || contract.created_at}

PARTES:
Proveedor:     Adrian Caravedo — NTX Labs LLC
Cliente:       ${contract.data.contact} — ${contract.data.company}

ESTADO:        ${contract.status === 'both_signed' ? 'COMPLETAMENTE FIRMADO' : 'EN PROCESO'}

FIRMAS REGISTRADAS:
${contract.data.nithrox_signature ? `
✅ NITHROX — Adrian Caravedo
   Nombre firmado:  ${contract.data.nithrox_signature.name}
   Fecha:           ${contract.data.nithrox_signature.date}
   Hora:            ${contract.data.nithrox_signature.time}
   IP:              ${contract.data.nithrox_signature.ip}
   Certificado:     ${contract.data.nithrox_signature.cert}
` : '⏳ Nithrox: Pendiente de firma'}

${contract.data.client_signature ? `
✅ CLIENTE — ${contract.data.contact}
   Nombre firmado:  ${contract.data.client_signature.name}
   Fecha:           ${contract.data.client_signature.date}
   Hora:            ${contract.data.client_signature.time}
   IP:              ${contract.data.client_signature.ip}
   Certificado:     ${contract.data.client_signature.cert}
` : '⏳ Cliente: Pendiente de firma'}

Hash SHA256:   ${contract.data.hash || 'pendiente'}

=================================================================
Este certificado ha sido generado por NTX Labs LLC
Ley N° 27269 — Ley de Firmas y Certificados Digitales del Perú
=================================================================`
    const blob = new Blob([cert], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `Certificado-NTX-${contract.id}.txt`; a.click()
    toast.success('Certificado de auditoría descargado')
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-tight">{contract.name}</h2>
            <p className="text-xs text-muted-foreground">{contract.company}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {!editing && <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent font-bold uppercase tracking-wider"><Pencil className="w-3.5 h-3.5" /> Editar</button>}
          {editing && <button onClick={() => { onUpdate({ data: editData }); setEditing(false); toast.success('Datos guardados') }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg font-bold uppercase tracking-wider"><Check className="w-3.5 h-3.5" /> Guardar</button>}
          {editing && <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent">Cancelar</button>}
          {contract.status === 'draft' && <button onClick={() => { onUpdate({ status: 'sent', sent_at: new Date().toLocaleDateString('es-PE') }); toast.success('Contrato enviado al cliente') }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg font-bold uppercase tracking-wider"><Send className="w-3.5 h-3.5" /> Enviar al cliente</button>}
          {contract.status === 'sent' && <button onClick={() => setShowClientSig(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-bold uppercase tracking-wider">✍️ Firma cliente</button>}
          {contract.status === 'client_signed' && <button onClick={() => setShowNithroxSig(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg font-bold uppercase tracking-wider">✍️ Firmar Nithrox</button>}
          {contract.status === 'both_signed' && <button onClick={downloadCertificate} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-green-500 text-green-700 rounded-lg font-bold uppercase tracking-wider"><Shield className="w-3.5 h-3.5" /> Certificado</button>}
          {/* Upload PDF */}
          <button onClick={() => pdfRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent font-bold uppercase tracking-wider"><Upload className="w-3.5 h-3.5" /> {pdfUrl ? 'Cambiar PDF' : 'Adjuntar PDF'}</button>
          <input ref={pdfRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Contract / PDF preview */}
        <div className="flex-1 overflow-y-auto p-8 bg-zinc-50">
          {editing ? (
            <div className="max-w-xl mx-auto bg-white rounded-xl border border-border p-6 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest mb-4">Editar datos del contrato</p>
              {[
                { k: 'company', l: 'Empresa cliente' },
                { k: 'contact', l: 'Contacto / Representante' },
                { k: 'ruc', l: 'RUC' },
                { k: 'project', l: 'Nombre del proyecto' },
                { k: 'amount', l: 'Monto total' },
                { k: 'currency', l: 'Moneda' },
                { k: 'duration', l: 'Duración estimada (días)' },
              ].map(f => (
                <div key={f.k} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{f.l}</label>
                  <input value={editData[f.k] || ''} onChange={e => setEditData(p => ({ ...p, [f.k]: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-background" />
                </div>
              ))}
            </div>
          ) : pdfUrl ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl border border-border shadow-sm p-4 mb-3 flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-bold">{contract.pdf_name || 'Contrato.pdf'}</p>
                  <p className="text-xs text-muted-foreground">PDF adjunto</p>
                </div>
                <button onClick={() => { setPdfUrl(null); onUpdate({ pdf_url: null }) }} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
              </div>
              <iframe src={pdfUrl} className="w-full rounded-xl border border-border shadow-sm" style={{ height: 700 }} title="PDF Contract" />

              {/* Signature blocks on PDF */}
              {(contract.data?.nithrox_signature || contract.data?.client_signature) && (
                <div className="bg-white rounded-xl border border-border mt-4 p-6">
                  <p className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" /> Firmas registradas en este documento
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { sig: contract.data?.nithrox_signature, label: 'NITHROX', sub: 'Adrian Caravedo · CEO' },
                      { sig: contract.data?.client_signature, label: contract.data?.company || 'CLIENTE', sub: contract.data?.contact || 'Representante' },
                    ].map((s, i) => (
                      <div key={i} className={`p-4 rounded-xl border-2 ${s.sig ? 'border-green-200 bg-green-50' : 'border-dashed border-zinc-200'}`}>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">{s.label}</p>
                        <p className="text-xs text-zinc-500 mb-3">{s.sub}</p>
                        {s.sig ? (
                          <>
                            <p style={{ fontFamily: "'Times New Roman', serif", fontSize: '22px', color: '#1d4ed8', fontStyle: 'italic', marginBottom: '8px' }}>{s.sig.name}</p>
                            <p className="text-[10px] text-zinc-500">{s.sig.date} · {s.sig.time}</p>
                            <p className="text-[9px] text-zinc-400 font-mono">{s.sig.cert}</p>
                          </>
                        ) : (
                          <p className="text-xs text-zinc-400 italic">Pendiente de firma</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              <div dangerouslySetInnerHTML={{
                __html: generateContractHTML(
                  { ...contract.data, doc_id: contract.id.slice(-5).toUpperCase() },
                  { nithrox: contract.data?.nithrox_signature, client: contract.data?.client_signature }
                )
              }} />
            </div>
          )}
        </div>

        {/* Right panel — timeline */}
        <div className="w-72 border-l border-border overflow-y-auto shrink-0 p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-5">PROCESO DE FIRMA</h3>

          <div className="space-y-0">
            {STEPS.map((step, i) => {
              const done = i <= progress
              const current = i === progress + 1
              return (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-green-100' : current ? 'bg-primary' : 'bg-muted'}`}>
                      {done ? <Check className="w-3.5 h-3.5 text-green-600" /> : <span className="text-[10px] text-muted-foreground">{i + 1}</span>}
                    </div>
                    {i < STEPS.length - 1 && <div className="w-px flex-1 bg-border my-1 min-h-5" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className={`text-xs font-bold ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                    {step.date && <p className="text-[10px] text-muted-foreground mt-0.5">{step.date}</p>}
                    {step.key === 'sent' && contract.status === 'sent' && (
                      <button onClick={() => setShowClientSig(true)} className="mt-1.5 text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-200 font-bold uppercase tracking-wider">
                        Simular firma cliente
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legal info */}
          <div className="mt-4 p-3 bg-muted/30 rounded-xl space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-widest">INFORMACIÓN LEGAL</p>
            {[
              { icon: Shield, text: 'Ley N° 27269 — Perú' },
              { icon: Lock, text: 'Encriptación SSL/TLS' },
              { icon: Hash, text: 'Integridad SHA256' },
              { icon: Globe, text: 'IP registrada en firma' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Icon className="w-3 h-3 shrink-0" /> {item.text}
                </div>
              )
            })}
          </div>

          {contract.status === 'both_signed' && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Completado</p>
              </div>
              <p className="text-[10px] text-green-700">Ambas partes firmaron. El contrato tiene plena validez legal.</p>
            </div>
          )}
        </div>
      </div>

      {showNithroxSig && <SignatureModal onSave={handleNithroxSign} onCancel={() => setShowNithroxSig(false)} label="Firma de Nithrox — Adrian Caravedo" signerName="Adrian Caravedo" />}
      {showClientSig && <SignatureModal onSave={handleClientSign} onCancel={() => setShowClientSig(false)} label={`Firma del cliente — ${contract.data.contact || 'Cliente'}`} signerName={contract.data.contact} />}
    </div>
  )
}

// ── Status map ───────────────────────────────────────────────
const ST = {
  draft:         { l: 'Borrador',              c: 'bg-zinc-100 text-zinc-600' },
  sent:          { l: 'Enviado',               c: 'bg-blue-100 text-blue-700' },
  client_signed: { l: 'Firmado x cliente',     c: 'bg-amber-100 text-amber-700' },
  both_signed:   { l: '✓ Completado',          c: 'bg-green-100 text-green-700' },
  expired:       { l: '⚠ Vencido',             c: 'bg-red-100 text-red-700' },
}

const CONTRACT_TYPES = [
  { id: 'Contrato',      label: 'Contrato de servicios', icon: '📋', color: '#3b82f6' },
  { id: 'NDA',           label: 'NDA / Confidencialidad', icon: '🔒', color: '#8b5cf6' },
  { id: 'Propuesta',     label: 'Propuesta comercial',   icon: '📄', color: '#f59e0b' },
  { id: 'Colaborador',   label: 'Colaborador / Staff',   icon: '👤', color: '#10b981' },
  { id: 'Proveedor',     label: 'Proveedor',             icon: '🏭', color: '#f97316' },
  { id: 'Locador',       label: 'Locador / Arrendador',  icon: '🏠', color: '#ec4899' },
]

function daysUntilExpiry(expiry_date) {
  if (!expiry_date) return null
  const diff = new Date(expiry_date) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function ExpiryBadge({ expiry_date }) {
  const days = daysUntilExpiry(expiry_date)
  if (days === null) return null
  if (days < 0) return <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">VENCIDO</span>
  if (days <= 7) return <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold animate-pulse">⚠ {days}d</span>
  if (days <= 30) return <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">⚡ {days}d</span>
  return <span className="text-[9px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold">✓ {days}d</span>
}

const DEMO = [
  { id:'ct1', name:'Contrato servicios web — Fashion Co.', company:'Fashion Co.', party_type:'Contrato', status:'both_signed', type:'Contrato', created_at:'01 Abr 2026', sent_at:'01 Abr 2026', client_signed_at:'02 Abr 2026', nithrox_signed_at:'02 Abr 2026', expiry_date:'2027-04-01', data:{ company:'Fashion Co.', contact:'María Quispe', ruc:'20123456789', project:'Tienda Moda Lima', amount:'18500', currency:'USD', duration:'90', date:'01 Abr 2026', client_signature:{ name:'María Quispe', date:'02 Abr 2026', time:'10:23 AM', ip:'192.168.1.45', cert:'NTX-CERT-ABC123' }, nithrox_signature:{ name:'Adrian Caravedo', date:'02 Abr 2026', time:'11:05 AM', ip:'192.168.1.1', cert:'NTX-CERT-XYZ789' }, hash:'sha256-a1b2c3d4e5f6' } },
  { id:'ct2', name:'Contrato SaaS — TechPe', company:'TechPe', party_type:'Contrato', status:'client_signed', type:'Contrato', created_at:'20 Mar 2026', sent_at:'20 Mar 2026', client_signed_at:'21 Mar 2026', nithrox_signed_at:null, expiry_date:'2027-03-20', data:{ company:'TechPe', contact:'Luis Vera', ruc:'20987654321', project:'Landing SaaS', amount:'9200', currency:'USD', duration:'60', date:'20 Mar 2026', client_signature:{ name:'Luis Vera', date:'21 Mar 2026', time:'3:45 PM', ip:'192.168.2.100', cert:'NTX-CERT-LV456' } } },
  { id:'ct3', name:'NDA — Casas del Sur', company:'Casas del Sur', party_type:'NDA', status:'sent', type:'NDA', created_at:'15 Abr 2026', sent_at:'15 Abr 2026', client_signed_at:null, nithrox_signed_at:null, expiry_date:'2026-10-15', data:{ company:'Casas del Sur', contact:'Pedro Salas', ruc:'20444555666', project:'Portal Inmobiliaria', amount:'7500', currency:'USD', duration:'60', date:'15 Abr 2026' } },
  { id:'ct4', name:'Contrato colaborador — Lucía Torres', company:'NTX Labs LLC', party_type:'Colaborador', status:'both_signed', type:'Colaborador', created_at:'01 Ene 2026', sent_at:'01 Ene 2026', client_signed_at:'02 Ene 2026', nithrox_signed_at:'02 Ene 2026', expiry_date:'2026-12-31', data:{ company:'NTX Labs LLC', contact:'Lucía Torres', ruc:'', project:'Diseñadora Senior — Contrato de servicios', amount:'1500', currency:'USD', duration:'365', date:'01 Ene 2026', client_signature:{ name:'Lucía Torres', date:'02 Ene 2026', time:'9:00 AM', ip:'192.168.1.50', cert:'NTX-CERT-LT001' }, nithrox_signature:{ name:'Adrian Caravedo', date:'02 Ene 2026', time:'10:00 AM', ip:'192.168.1.1', cert:'NTX-CERT-AC001' }, hash:'sha256-b2c3d4e5f6a1' } },
  { id:'ct5', name:'Contrato proveedor — Hosting CloudPe', company:'CloudPe SAC', party_type:'Proveedor', status:'both_signed', type:'Proveedor', created_at:'15 Feb 2026', sent_at:'15 Feb 2026', client_signed_at:'16 Feb 2026', nithrox_signed_at:'16 Feb 2026', expiry_date:'2026-05-05', data:{ company:'CloudPe SAC', contact:'Roberto Campos', ruc:'20555666777', project:'Servicios de hosting y CDN', amount:'2400', currency:'USD', duration:'365', date:'15 Feb 2026', client_signature:{ name:'Roberto Campos', date:'16 Feb 2026', time:'2:00 PM', ip:'192.168.3.10', cert:'NTX-CERT-RC001' }, nithrox_signature:{ name:'Adrian Caravedo', date:'16 Feb 2026', time:'3:00 PM', ip:'192.168.1.1', cert:'NTX-CERT-AC002' }, hash:'sha256-c3d4e5f6a1b2' } },
  { id:'ct6', name:'Contrato locador — Oficina Miraflores', company:'Inmobiliaria Lima', party_type:'Locador', status:'both_signed', type:'Locador', created_at:'01 Mar 2026', sent_at:'01 Mar 2026', client_signed_at:'02 Mar 2026', nithrox_signed_at:'02 Mar 2026', expiry_date:'2027-03-01', data:{ company:'Inmobiliaria Lima', contact:'Ana Paredes', ruc:'20777888999', project:'Oficina Av. Larco 345, Miraflores', amount:'800', currency:'USD', duration:'365', date:'01 Mar 2026', client_signature:{ name:'Ana Paredes', date:'02 Mar 2026', time:'11:00 AM', ip:'192.168.4.20', cert:'NTX-CERT-AP001' }, nithrox_signature:{ name:'Adrian Caravedo', date:'02 Mar 2026', time:'12:00 PM', ip:'192.168.1.1', cert:'NTX-CERT-AC003' }, hash:'sha256-d4e5f6a1b2c3' } },
  { id:'ct7', name:'Propuesta — Startup XYZ', company:'Startup XYZ', party_type:'Propuesta', status:'draft', type:'Propuesta', created_at:'16 Abr 2026', sent_at:null, client_signed_at:null, nithrox_signed_at:null, expiry_date:'2026-05-16', data:{ company:'Startup XYZ', contact:'Carlos Founders', ruc:'', project:'MVP Startup', amount:'5500', currency:'USD', duration:'45', date:'16 Abr 2026' } },
]

export default function ContractsPage() {
  const { companies } = useStore()
  const [contracts, setContracts] = useState(DEMO)
  const [viewContract, setViewContract] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [nf, setNf] = useState({ company_id: '', project: '', amount: '', currency: 'USD', duration: '60', party_type: 'Contrato', expiry_date: '' })

  const filtered = filter === 'all' ? contracts : contracts.filter(c =>
    c.status === filter || c.type === filter || c.party_type === filter
  )
  const update = (id, data) => {
    setContracts(p => p.map(c => c.id === id ? { ...c, ...data } : c))
    if (viewContract?.id === id) setViewContract(p => ({ ...p, ...data }))
  }

  const createContract = () => {
    const co = companies.find(c => c.id === nf.company_id)
    const today = new Date().toLocaleDateString('es-PE')
    const id = `ct${Date.now()}`
    const typeInfo = CONTRACT_TYPES.find(t => t.id === nf.party_type)
    const nc = {
      id, name: `${typeInfo?.label || 'Contrato'} — ${co?.name || 'Nuevo'}`,
      company: co?.name || '', status: 'draft',
      type: nf.party_type, party_type: nf.party_type,
      created_at: today, sent_at: null, client_signed_at: null, nithrox_signed_at: null,
      expiry_date: nf.expiry_date || null,
      data: { company: co?.name || '', contact: '', ruc: co?.ruc || '', project: nf.project, amount: nf.amount, currency: nf.currency, duration: nf.duration, date: today, doc_id: id.slice(-5).toUpperCase() }
    }
    setContracts(p => [...p, nc])
    setShowNew(false)
    setViewContract(nc)
  }

  // Expiry alerts
  const expiring = contracts.filter(c => {
    const d = daysUntilExpiry(c.expiry_date)
    return d !== null && d >= 0 && d <= 30 && c.status === 'both_signed'
  })
  const expired = contracts.filter(c => {
    const d = daysUntilExpiry(c.expiry_date)
    return d !== null && d < 0
  })

  const stats = {
    completed: contracts.filter(c => c.status === 'both_signed').length,
    pending: contracts.filter(c => ['sent', 'client_signed'].includes(c.status)).length,
    drafts: contracts.filter(c => c.status === 'draft').length,
    expiring: expiring.length,
  }

  const FILTERS = [
    { id: 'all', l: 'Todos' },
    { id: 'draft', l: 'Borradores' },
    { id: 'sent', l: 'Enviados' },
    { id: 'client_signed', l: 'Firmados x cliente' },
    { id: 'both_signed', l: '✓ Completados' },
    ...CONTRACT_TYPES.map(t => ({ id: t.id, l: t.label, icon: t.icon })),
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="CONTRATOS" actions={
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" /> Nuevo contrato
        </button>
      } />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Expiry alerts */}
        {(expiring.length > 0 || expired.length > 0) && (
          <div className="space-y-2">
            {expired.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-red-800">{expired.length} contrato{expired.length > 1 ? 's' : ''} vencido{expired.length > 1 ? 's' : ''}</p>
                  <p className="text-[10px] text-red-600">{expired.map(c => c.name).join(', ')}</p>
                </div>
              </div>
            )}
            {expiring.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-800">{expiring.length} contrato{expiring.length > 1 ? 's' : ''} por vencer en menos de 30 días</p>
                  <p className="text-[10px] text-amber-600">{expiring.map(c => `${c.name} (${daysUntilExpiry(c.expiry_date)}d)`).join(', ')}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { l: 'COMPLETADOS', v: stats.completed, c: 'text-green-600' },
            { l: 'PENDIENTES', v: stats.pending, c: 'text-amber-600' },
            { l: 'BORRADORES', v: stats.drafts, c: 'text-zinc-500' },
            { l: 'POR VENCER', v: stats.expiring, c: stats.expiring > 0 ? 'text-red-600' : 'text-zinc-400' },
          ].map(s => (
            <div key={s.l} className="bg-background border border-border rounded-xl p-4">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.l}</p>
              <p className={`text-3xl font-bold mt-1 ${s.c}`}>{s.v}</p>
            </div>
          ))}
        </div>

        {/* Party type summary */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {CONTRACT_TYPES.map(ct => {
            const count = contracts.filter(c => c.party_type === ct.id).length
            return (
              <button key={ct.id} onClick={() => setFilter(ct.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${filter === ct.id ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/20'}`}>
                <span className="text-xl">{ct.icon}</span>
                <p className="text-[9px] font-bold uppercase tracking-widest leading-tight">{ct.label.split('/')[0]}</p>
                <p className="text-lg font-bold">{count}</p>
              </button>
            )
          })}
        </div>

        {/* Status filters */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.slice(0, 5).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`text-[10px] px-3 py-1.5 rounded-full border font-bold uppercase tracking-wider transition-colors ${filter === f.id ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              {f.l}
            </button>
          ))}
          <button onClick={() => setFilter('all')} className={`text-[10px] px-3 py-1.5 rounded-full border font-bold uppercase tracking-wider transition-colors ${filter === 'all' ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}>
            Todos
          </button>
        </div>

        {/* Table */}
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['DOCUMENTO', 'PARTE', 'EMPRESA', 'VENCIMIENTO', 'ESTADO', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(c => {
                const st = ST[c.status] || ST.draft
                const typeInfo = CONTRACT_TYPES.find(t => t.id === (c.party_type || c.type))
                return (
                  <tr key={c.id} className="hover:bg-accent/30 cursor-pointer transition-colors" onClick={() => setViewContract(c)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{typeInfo?.icon || '📋'}</span>
                        <span className="text-xs font-bold">{c.name}</span>
                        {c.pdf_url && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">PDF</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: (typeInfo?.color || '#64748b') + '15', color: typeInfo?.color || '#64748b' }}>
                        {typeInfo?.label || c.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{c.company}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        {c.expiry_date && <p className="text-[10px] text-muted-foreground">{new Date(c.expiry_date).toLocaleDateString('es-PE')}</p>}
                        <ExpiryBadge expiry_date={c.expiry_date} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${st.c}`}>{st.l}</span>
                    </td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setContracts(p => p.filter(x => x.id !== c.id))}
                        className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New contract modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-5">Nuevo contrato</h3>
            <div className="space-y-4">
              {/* Party type */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tipo de contrato</label>
                <div className="grid grid-cols-3 gap-2">
                  {CONTRACT_TYPES.map(ct => (
                    <button key={ct.id} onClick={() => setNf(p => ({ ...p, party_type: ct.id }))}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-center transition-all ${nf.party_type === ct.id ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/20'}`}>
                      <span className="text-lg">{ct.icon}</span>
                      <p className="text-[9px] font-bold uppercase tracking-wider leading-tight">{ct.label.split('/')[0]}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Empresa / Parte *</label>
                <select value={nf.company_id} onChange={e => setNf(p => ({ ...p, company_id: e.target.value }))}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary">
                  <option value="">Seleccionar...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Proyecto / Descripción</label>
                <input value={nf.project} onChange={e => setNf(p => ({ ...p, project: e.target.value }))} placeholder="Descripción del contrato..."
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Monto</label>
                  <input type="number" value={nf.amount} onChange={e => setNf(p => ({ ...p, amount: e.target.value }))}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Duración (d)</label>
                  <input type="number" value={nf.duration} onChange={e => setNf(p => ({ ...p, duration: e.target.value }))}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Vence el</label>
                  <input type="date" value={nf.expiry_date} onChange={e => setNf(p => ({ ...p, expiry_date: e.target.value }))}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background outline-none focus:border-primary" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-accent font-bold">Cancelar</button>
              <button onClick={createContract} disabled={!nf.company_id}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-primary/90">
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {viewContract && <ContractDetail contract={viewContract} onClose={() => setViewContract(null)} onUpdate={(data) => update(viewContract.id, data)} />}
    </div>
  )
}

