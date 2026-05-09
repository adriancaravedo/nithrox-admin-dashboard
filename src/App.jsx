import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/layout/Layout'
import CommandPalette from './components/shared/CommandPalette'
import LoginPage from './pages/auth/LoginPage'

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

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50"
      style={{ fontFamily: "'Geist Mono', monospace" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-400 uppercase tracking-widest">Cargando...</p>
      </div>
    </div>
  )
}

function RequireAuth({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/portal" replace />
  return children
}

function RequireGuest({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to={profile?.role === 'admin' ? '/dashboard' : '/portal'} replace />
  return children
}

function PortalPlaceholder() {
  const { profile, logout } = useAuth()
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4"
      style={{ fontFamily: "'Geist Mono', monospace" }}>
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-black text-lg">NTX</span>
        </div>
        <h1 className="text-xl font-bold mb-2">Hola, {profile?.name || profile?.email} 👋</h1>
        <p className="text-zinc-500 text-sm mb-6">Tu portal está en construcción.<br />Pronto podrás ver tus proyectos aquí.</p>
        <button onClick={logout}
          className="w-full py-2.5 border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-100 transition-colors uppercase tracking-widest">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="bottom-right"
            toastOptions={{ style: { fontFamily: 'Geist Mono, monospace', fontSize: '13px', borderRadius: '12px' } }} />
          <Routes>
            <Route path="/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
            <Route path="/portal" element={<RequireAuth><PortalPlaceholder /></RequireAuth>} />
            <Route element={<RequireAuth adminOnly><CommandPalette /><Layout /></RequireAuth>}>
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