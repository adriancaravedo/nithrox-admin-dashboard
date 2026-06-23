import { generateContractHTML } from './contractHtml'
import { supabase } from './supabase'

export async function generateAndUploadContractPdf(contract, clientSignature) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })

  // Build signature metadata
  let ip = 'desconocida'
  try {
    const r = await fetch('https://api.ipify.org?format=json')
    const j = await r.json()
    ip = j.ip
  } catch (_) {}

  const cert = `NTX-SIG-${Date.now().toString(36).toUpperCase()}`
  const sigs = {
    client: { name: clientSignature, date: dateStr, time: timeStr, ip, cert },
  }

  const html = generateContractHTML(contract.data || {}, sigs)

  // Render HTML to canvas
  const { default: html2canvas } = await import('html2canvas')
  const { jsPDF } = await import('jspdf')

  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:794px;background:white'
  container.innerHTML = html
  document.body.appendChild(container)

  let pdfBlob
  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * pageWidth) / canvas.width

    let y = 0
    let remaining = imgHeight

    while (remaining > 0) {
      if (y > 0) pdf.addPage()
      const sliceH = Math.min(remaining, pageHeight)
      pdf.addImage(imgData, 'JPEG', 0, y > 0 ? -(pageHeight * (y / pageHeight)) : 0, imgWidth, imgHeight)
      y += pageHeight
      remaining -= pageHeight
    }

    pdfBlob = pdf.output('blob')
  } finally {
    document.body.removeChild(container)
  }

  // Upload to Supabase Storage
  const fileName = `contrato-NTX-${contract.data?.doc_id || contract.id}-${Date.now()}.pdf`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('contracts')
    .upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: true })

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

  const { data: urlData } = supabase.storage.from('contracts').getPublicUrl(uploadData.path)
  return urlData.publicUrl
}
