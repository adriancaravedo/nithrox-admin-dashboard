import { useState } from 'react'
import Topbar from '../../../components/layout/Topbar'
import { Button } from '../../../components/ui/button'
import ContactsTab from './ContactsTab'
import CompaniesTab from './CompaniesTab'
import DealsTab from './DealsTab'
import ServicesTab from './ServicesTab'
import { AddContactDialog, AddCompanyDialog, AddDealDialog } from './AddForms'

const TABS = [
  { id: 'contacts',  label: 'Contactos' },
  { id: 'companies', label: 'Empresas' },
  { id: 'deals',     label: 'Negocios' },
  { id: 'services',  label: 'Servicios' },
]

const ADD_LABELS = {
  contacts:  '+ Agregar Contacto',
  companies: '+ Agregar Empresa',
  deals:     '+ Agregar Deal',
  services:  '',
}

export default function ClientsPage() {
  const [activeTab, setActiveTab] = useState('contacts')
  const [showAdd, setShowAdd] = useState(false)
  const [showAddSection, setShowAddSection] = useState(false)

  const tabSelector = (
    <div className="flex items-center border border-border rounded-lg overflow-hidden bg-muted/30">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Clientes"
        leftContent={tabSelector}
        actions={
          <div className="flex items-center gap-2">
            {activeTab !== 'services' && (
              <Button size="sm" onClick={() => setShowAdd(true)} className="text-xs rounded-full px-4">
                {ADD_LABELS[activeTab]}
              </Button>
            )}
            {(activeTab === 'contacts' || activeTab === 'companies' || activeTab === 'deals') && (
              <Button size="sm" variant="outline" className="text-xs rounded-full px-4 hidden sm:flex" onClick={() => setShowAddSection(true)}>
                + Agregar Sección
              </Button>
            )}
          </div>
        }
      />

      {/* Mobile tab selector — visible only on small screens */}
      <div className="lg:hidden px-4 pt-3 shrink-0">
        <div className="flex items-center border border-border rounded-lg overflow-hidden bg-muted/30 w-full">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content with padding */}
      <div className="flex-1 overflow-hidden p-4 pt-3">
        <div className="h-full rounded-xl border border-border bg-background overflow-hidden flex flex-col shadow-sm">
          {activeTab === 'contacts' && <ContactsTab showAddSection={showAddSection} onCloseAddSection={() => setShowAddSection(false)} />}
          {activeTab === 'companies' && <CompaniesTab showAddSection={showAddSection} onCloseAddSection={() => setShowAddSection(false)} />}
          {activeTab === 'deals' && <DealsTab showAddSection={showAddSection} onCloseAddSection={() => setShowAddSection(false)} />}
          {activeTab === 'services' && <ServicesTab />}
        </div>
      </div>

      {activeTab === 'contacts' && <AddContactDialog open={showAdd} onClose={() => setShowAdd(false)} />}
      {activeTab === 'companies' && <AddCompanyDialog open={showAdd} onClose={() => setShowAdd(false)} />}
      {activeTab === 'deals' && <AddDealDialog open={showAdd} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
