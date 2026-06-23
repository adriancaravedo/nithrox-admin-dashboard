export function generateContractHTML(data, sigs = {}) {
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
      <p style="font-weight:bold;letter-spacing:1px;margin-bottom:6px">CERTIFICADO DE AUTENTICIDAD</p>
      <p>Doc ID: NTX-${data.doc_id || '00001'} · Hash SHA256: ${data.hash || 'pendiente de firma'}</p>
      <p>Este documento ha sido generado y gestionado por la plataforma NTX Labs LLC. Las firmas electrónicas registradas incluyen: nombre completo, fecha, hora, dirección IP y agente de usuario del firmante.</p>
    </div>
  </body></html>`
}
