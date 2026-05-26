import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { DataProvider } from './context/DataContext'
import Layout from './components/layout/Layout'
import CommandPalette from './components/shared/CommandPalette'
import LoginPage from './pages/auth/LoginPage'

// Portal
import PortalLayout from './pages/portal/PortalLayout'
import PortalDashboard from './pages/portal/PortalDashboard'
import PortalProyecto from './pages/portal/PortalProyecto'
import PortalPagos from './pages/portal/PortalPagos'
import PortalDocumentos from './pages/portal/PortalDocumentos'
import PortalMensajes from './pages/portal/PortalMensajes'
import PortalReuniones from './pages/portal/PortalReuniones'
import PortalContratos from './pages/portal/PortalContratos'

// Admin — Core
import Dashboard from './pages/nithrox/dashboard/Dashboard'
import SettingsPage from './pages/nithrox/settings/SettingsPage'
import NotificationsPage from './pages/nithrox/notifications/NotificationsPage'

// Admin — CRM
import ClientsPage from './pages/nithrox/crm/ClientsPage'
import ContactDetail from './pages/nithrox/crm/ContactDetail'
import { CompanyDetail, DealDetail } from './pages/nithrox/crm/CompanyAndDealDetail'
import MessagesPage from './pages/nithrox/messages/MessagesPage'
import DocumentsPage from './pages/nithrox/documents/DocumentsPage'
import CatalogoPage from './pages/nithrox/catalogo/CatalogoPage'
import BillingPage from './pages/nithrox/billing/BillingPage'

// Admin — Servicios
import ProjectsPage from './pages/nithrox/projects/ProjectsPage'
import ProjectDetail from './pages/nithrox/projects/ProjectDetail'
import AgentsPage from './pages/nithrox/agents/AgentsPage'
import ServersPage from './pages/nithrox/servers/ServersPage'
import ServerDetail from './pages/nithrox/servers/ServerDetail'
import DomainsPage from './pages/nithrox/domains/DomainsPage'

// Admin — Herramientas
import ConverterPage from './pages/nithrox/converter/ConverterPage'
import FormsPage from './pages/nithrox/forms/FormsPage'
import OnboardingPage from './pages/nithrox/onboarding/OnboardingPage'
import AgendaPage from './pages/nithrox/agenda/AgendaPage'
import ContractsPage from './pages/nithrox/contracts/ContractsPage'
import InvoicesPage from './pages/nithrox/invoices/InvoicesPage'
import SocialPage from './pages/nithrox/social/SocialPage'
import EmailMarketingPage from './pages/nithrox/email/EmailMarketingPage'
import EmployeesPage from './pages/nithrox/employees/EmployeesPage'

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Cargando...</p>
      </div>
    </div>
  )
}

function RequireAuth({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !profile) return <Loading />
  if (adminOnly && profile.role !== 'admin') return <Navigate to="/portal" replace />
  return children
}

function RequireGuest({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <Loading />
  if (user && profile) {
    return <Navigate to={profile.role === 'admin' ? '/dashboard' : '/portal'} replace />
  }
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <Toaster position="bottom-right"
              toastOptions={{ style: { fontFamily: 'Geist Variable, sans-serif', fontSize: '13px', borderRadius: '12px' } }} />
            <Routes>
              {/* Public */}
              <Route path="/login" element={<RequireGuest><LoginPage /></RequireGuest>} />

              {/* Client portal */}
              <Route path="/portal" element={<RequireAuth><PortalLayout /></RequireAuth>}>
                <Route index element={<PortalDashboard />} />
                <Route path="proyecto" element={<PortalProyecto />} />
                <Route path="pagos" element={<PortalPagos />} />
                <Route path="documentos" element={<PortalDocumentos />} />
                <Route path="mensajes" element={<PortalMensajes />} />
                <Route path="reuniones" element={<PortalReuniones />} />
                <Route path="contratos" element={<PortalContratos />} />
              </Route>

              {/* Admin */}
              <Route element={<RequireAuth adminOnly><CommandPalette /><Layout /></RequireAuth>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Core */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />

                {/* CRM */}
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/clients/contacts/:id" element={<ContactDetail />} />
                <Route path="/clients/companies/:id" element={<CompanyDetail />} />
                <Route path="/clients/deals/:id" element={<DealDetail />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/catalogo" element={<CatalogoPage />} />
                <Route path="/billing" element={<BillingPage />} />

                {/* Servicios */}
                <Route path="/websites" element={<ProjectsPage />} />
                <Route path="/websites/:id" element={<ProjectDetail />} />
                {/* Keep /projects for backward compat (e.g. links from ContactDetail) */}
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/agents" element={<AgentsPage />} />
                <Route path="/servers" element={<ServersPage />} />
                <Route path="/servers/:id" element={<ServerDetail />} />
                <Route path="/domains" element={<DomainsPage />} />

                {/* Herramientas */}
                <Route path="/social" element={<SocialPage />} />
                <Route path="/email-marketing" element={<EmailMarketingPage />} />
                <Route path="/converter" element={<ConverterPage />} />
                <Route path="/forms" element={<FormsPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/proposals" element={<Navigate to="/onboarding" replace />} />
                <Route path="/agenda" element={<AgendaPage />} />
                <Route path="/contracts" element={<ContractsPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
