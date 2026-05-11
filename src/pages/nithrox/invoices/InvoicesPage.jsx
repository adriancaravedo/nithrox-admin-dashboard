import Topbar from '../../../components/layout/Topbar'
import { Receipt, Plus, Construction } from 'lucide-react'

export default function InvoicesPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="FACTURAS" actions={
        <button className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-foreground text-background rounded-full hover:bg-foreground/90 uppercase tracking-wider opacity-50 cursor-not-allowed">
          <Plus className="w-3.5 h-3.5" /> Nueva factura
        </button>
      } />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
          <Receipt className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <div>
          <p className="font-black text-base">Facturas — Fase 4</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Crea facturas profesionales con los datos del cliente, envíalas por email o WhatsApp y lleva el control de pagos. Disponible en la próxima actualización.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center mt-2">
          {['Crear factura', 'Enviar por WhatsApp', 'Enviar por email', 'PDF descargable', 'Estado de pago', 'Recordatorios'].map(f => (
            <span key={f} className="text-xs px-3 py-1.5 bg-muted rounded-full text-muted-foreground">{f}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
