import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectFormPage from './pages/ProjectFormPage';
import ServicesPage from './pages/ServicesPage';
import ServiceFormPage from './pages/ServiceFormPage';
import InsightsPage from './pages/InsightsPage';
import InsightFormPage from './pages/InsightFormPage';
import PartnersPage from './pages/PartnersPage';
import FaqPage from './pages/FaqPage';
import ContactsPage from './pages/ContactsPage';
import ProjectRequestsPage from './pages/ProjectRequestsPage';
import SettingsPage from './pages/SettingsPage';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Featured Projects */}
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/new" element={<ProjectFormPage />} />
          <Route path="/projects/:id/edit" element={<ProjectFormPage />} />

          {/* Services */}
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/new" element={<ServiceFormPage />} />
          <Route path="/services/:id/edit" element={<ServiceFormPage />} />

          {/* Project Insights */}
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/insights/new" element={<InsightFormPage />} />
          <Route path="/insights/:id/edit" element={<InsightFormPage />} />

          {/* Trusted Partners */}
          <Route path="/partners" element={<PartnersPage />} />

          {/* FAQ */}
          <Route path="/faqs" element={<FaqPage />} />

          {/* Contact Submissions */}
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/project-requests" element={<ProjectRequestsPage />} />

          {/* Settings */}
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
