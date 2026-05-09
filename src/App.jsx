import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/layout/Layout'
import CommandPalette from './components/shared/CommandPalette'

import Dashboard from './pages/nithrox/dashboard/Dashboard'
import ClientsPage from './pages/nithrox/crm/ClientsPage'
import ContactDetail from './pages/nithrox/crm/ContactDetail'
import { CompanyDetail, DealDetail } from './pages/nithrox/crm/CompanyAndDealDetail'
import ProjectsPage from './pages/nithrox/projects/ProjectsPage'
import ProjectDetail from './pages/nithrox/projects/ProjectDetail'
import FormsPage from './pages/nithrox/forms/FormsPage'
import MessagesPage from './pages/nithrox/messages/MessagesPage'
import ContractsPage from './pages/nithrox/contracts/ContractsPage'
import DocumentsPage from './pages/nithrox/documents/DocumentsPage'
import AgendaPage from './pages/nithrox/agenda/AgendaPage'
import ConverterPage from './pages/nithrox/converter/ConverterPage'
import ServersPage from './pages/nithrox/servers/ServersPage'
import ServerDetail from './pages/nithrox/servers/ServerDetail'
import MarketplacePage from './pages/nithrox/marketplace/MarketplacePage'
import InsightsPage from './pages/nithrox/insights/InsightsPage'
import ProposalsPage from './pages/nithrox/proposals/ProposalsPage'
import PortalsPage from './pages/nithrox/portals/PortalsPage'
import NotificationsPage from './pages/nithrox/notifications/NotificationsPage'
import SettingsPage from './pages/nithrox/settings/SettingsPage'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <CommandPalette />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { fontFamily: 'Geist Mono, monospace', fontSize: '13px', borderRadius: '12px' }
            }}
          />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/contacts/:id" element={<ContactDetail />} />
              <Route path="/clients/companies/:id" element={<CompanyDetail />} />
              <Route path="/clients/deals/:id" element={<DealDetail />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/forms" element={<FormsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/contracts" element={<ContractsPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/converter" element={<ConverterPage />} />
              <Route path="/servers" element={<ServersPage />} />
              <Route path="/servers/:id" element={<ServerDetail />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/proposals" element={<ProposalsPage />} />
              <Route path="/portals" element={<PortalsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
