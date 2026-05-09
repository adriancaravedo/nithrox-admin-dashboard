import { useState } from 'react'
import Topbar from '../../../components/layout/Topbar'
import { Button } from '../../../components/ui/button'
import ContactsTab from './ContactsTab'
import CompaniesTab from './CompaniesTab'
import DealsTab from './DealsTab'
import { AddContactDialog, AddCompanyDialog, AddDealDialog } from './AddForms'

const TABS = [
  { id: 'contacts', label: 'Contactos' },
  { id: 'companies', label: 'Empresas' },
  { id: 'deals', label: 'Negocios' },
]

export default function ClientsPage() {
  const [activeTab, setActiveTab] = useState('contacts')
  const [showAdd, setShowAdd] = useState(false)
  const [showAddSection, setShowAddSection] = useState(false)

  const ADD_LABELS = { contacts: '+ Agregar Contacto', companies: '+ Agregar Empresa', deals: '+ Agregar Deal' }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Clientes"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowAdd(true)} className="text-xs rounded-full px-4">
              {ADD_LABELS[activeTab]}
            </Button>
            {(activeTab === 'contacts' || activeTab === 'companies') && (
              <Button size="sm" variant="outline" className="text-xs rounded-full px-4" onClick={() => setShowAddSection(true)}>
                + Agregar Sección
              </Button>
            )}
            {activeTab === 'deals' && (
              <Button size="sm" variant="outline" className="text-xs rounded-full px-4" onClick={() => setShowAddSection(true)}>
                + Agregar Sección
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs row */}
      <div className="flex items-center border-b border-border px-4">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'contacts' && <ContactsTab showAddSection={showAddSection} onCloseAddSection={() => setShowAddSection(false)} />}
      {activeTab === 'companies' && <CompaniesTab showAddSection={showAddSection} onCloseAddSection={() => setShowAddSection(false)} />}
      {activeTab === 'deals' && <DealsTab showAddSection={showAddSection} onCloseAddSection={() => setShowAddSection(false)} />}

      {activeTab === 'contacts' && <AddContactDialog open={showAdd} onClose={() => setShowAdd(false)} />}
      {activeTab === 'companies' && <AddCompanyDialog open={showAdd} onClose={() => setShowAdd(false)} />}
      {activeTab === 'deals' && <AddDealDialog open={showAdd} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
