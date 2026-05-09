import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { useStore } from '../../../stores/useStore'
import { FRAMEWORKS } from '../../../lib/utils'

export function AddProjectDialog({ open, onClose }) {
  const { addProject, companies, contacts } = useStore()
  const [form, setForm] = useState({ name: '', framework: '', value: '', currency: 'USD', company_id: '', contact_id: '', server_id: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!form.name || !form.company_id) return
    const company = companies.find(c => c.id === form.company_id)
    const contact = contacts.find(c => c.id === form.contact_id)
    addProject({
      ...form,
      value: parseFloat(form.value) || 0,
      company: company?.name || '',
      contact: contact?.name || '',
      phases: {
        kickoff:     { status: 'in_progress', approved_admin: false, approved_client: false, paid: false, paid_amount: 0, branding: { logo: [], colors: [], fonts: [] }, brief: '', sitemap: [], accesses: {} },
        design:      { status: 'locked', approved_admin: false, approved_client: false, paid: false, paid_amount: 0, figma_url: '', versions: { mobile: true, tablet: false, desktop: true }, files: [] },
        development: { status: 'locked', approved_admin: false, approved_client: false, paid: false, paid_amount: 0, staging_url: '', notes: '', files: [] },
        publication: { status: 'locked', approved_admin: false, approved_client: false, paid: false, paid_amount: 0, domain: '', checklist: { final_review: false, deploy: false, dns: false, ssl: false, speed: false } },
      }
    })
    setForm({ name: '', framework: '', value: '', currency: 'USD', company_id: '', contact_id: '', server_id: '' })
    onClose()
  }

  const companyContacts = contacts.filter(c => c.company_id === form.company_id)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nuevo proyecto</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>Nombre del proyecto *</Label>
              <Input placeholder="Tienda Online Fashion Co." value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Empresa *</Label>
              <Select value={form.company_id} onValueChange={v => { set('company_id', v); set('contact_id', '') }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Contacto</Label>
              <Select value={form.contact_id} onValueChange={v => set('contact_id', v)} disabled={!form.company_id}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>{companyContacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Framework</Label>
              <Select value={form.framework} onValueChange={v => set('framework', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>{FRAMEWORKS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Valor del proyecto</Label>
              <div className="flex gap-1.5">
                <Select value={form.currency} onValueChange={v => set('currency', v)}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="PEN">PEN</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="0" value={form.value} onChange={e => set('value', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={handleSubmit} disabled={!form.name || !form.company_id}>Crear proyecto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
