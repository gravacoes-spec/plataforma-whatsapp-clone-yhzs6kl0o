import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import Layout from './components/Layout'
import Index from './pages/Index'
import Login from './pages/Login'
import Register from './pages/Register'
import ConnectionSetup from './pages/ConnectionSetup'
import Inbox from './pages/Inbox'
import Agents from './pages/Agents'
import Pipeline from './pages/Pipeline'
import Leads from './pages/Leads'
import Tasks from './pages/Tasks'
import Users from './pages/Users'
import CrmPipeline from './pages/CrmPipeline'
import NotFound from './pages/NotFound'
import Cadastro from './pages/Cadastro'
import HotmartLogs from './pages/HotmartLogs'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <Routes>
          <Route path="/cadastro" element={<Cadastro />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/connection-setup" element={<ConnectionSetup />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/crm/leads" element={<Leads />} />
            <Route path="/crm/pipeline" element={<CrmPipeline />} />
            <Route path="/crm/tasks" element={<Tasks />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/hotmart" element={<HotmartLogs />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
