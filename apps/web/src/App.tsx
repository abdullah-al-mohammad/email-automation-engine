import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import Sidebar from './components/layout/Sidebar';
import Signin from './pages/auth/Signin';
import Signup from './pages/auth/Signup';
import Tenants from './pages/tenant/Tenants';
import Workflows from './pages/workflow/Workflows';
import CreateWorkflow from './pages/workflow/CreateWorkflow';
import EditWorkflow from './pages/workflow/EditWorkflow';
import WorkflowBuilder from './pages/workflow/WorkflowBuilder';
import WorkflowContacts from './pages/workflow/WorkflowContacts';
import ExecutionSummary from './pages/workflow/ExecutionSummary';
import Settings from './pages/settings/Settings';
import EmailTemplates from './pages/email-templates/EmailTemplates';
import Contacts from './pages/contacts/Contacts';
import ContactDetailPage from './pages/contacts/ContactDetail';
import NewContact from './pages/contacts/NewContact';

import CreateEmailTemplate from './pages/email-templates/CreateEmailTemplate';

const appRoutes = [
  { path: '*', element: <Navigate to="/workflows" /> },
  { path: '/workflows', element: <Workflows /> },
  { path: '/workflows/create', element: <CreateWorkflow /> },
  { path: '/workflows/:workflowId', element: <WorkflowBuilder /> },
  { path: '/workflows/:workflowId/edit', element: <EditWorkflow /> },
  { path: '/workflows/:workflowId/summary', element: <ExecutionSummary /> },
  { path: '/workflows/:workflowId/contacts', element: <WorkflowContacts /> },
  { path: '/contacts', element: <Contacts /> },
  { path: '/contacts/new', element: <NewContact /> },
  { path: '/contacts/:contactId', element: <ContactDetailPage /> },
  { path: '/email-templates', element: <EmailTemplates /> },
  { path: '/email-templates/create', element: <CreateEmailTemplate /> },
  { path: '/settings', element: <Settings /> },
];

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/signin" />;

  return children;
}

function TenantRoute({ children }: { children: React.ReactNode }) {
  const { currentTenant, isLoadingTenants } = useTenant();

  if (isLoadingTenants) return <div className="p-8">Loading workspace...</div>;
  if (!currentTenant) return <Navigate to="/" />;

  return children;
}

function MainLayout() {
  const { logout } = useAuth();
  const { currentTenant, tenants, setCurrentTenant } = useTenant();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b h-14 flex items-center px-4 justify-between bg-card">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="hover:opacity-80 transition-opacity flex items-center gap-2 text-indigo-600 dark:text-indigo-400"
          >
            <Mail className="w-5 h-5" />
            <h1 className="font-bold text-lg text-gray-900 dark:text-white">Engine</h1>
          </Link>
          {currentTenant && (
            <select
              className="border rounded p-1 text-sm bg-transparent"
              value={currentTenant.id}
              onChange={(e) => {
                if (e.target.value === 'MANAGE_WORKSPACES') {
                  void navigate('/');
                } else {
                  const t = tenants.find((t) => t.id === e.target.value);
                  if (t) setCurrentTenant(t);
                }
              }}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
              <option value="MANAGE_WORKSPACES">Manage workspaces</option>
            </select>
          )}
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Sign out
        </button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl w-full mx-auto">
            <Routes>
              {appRoutes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TenantProvider>
                  <Tenants />
                </TenantProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <TenantProvider>
                  <TenantRoute>
                    <MainLayout />
                  </TenantRoute>
                </TenantProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
