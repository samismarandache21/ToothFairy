// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DoctorProvider, useDoctor } from './contexts/DoctorContext';
import { ClinicAdminProvider, useClinicAdmin } from './contexts/ClinicAdminContext';
import LoginPage                 from './pages/LoginPage';
import AuthPage                  from './pages/AuthPage';
import DashboardPage             from './pages/DashboardPage';
import CalendarPage              from './pages/CalendarPage';
import PatientsPage              from './pages/PatientsPage';
import ServicesPage              from './pages/ServicesPage';
import StatisticsPage            from './pages/StatisticsPage';
import PresentationPage          from './pages/PresentationPage';
import SettingsPage              from './pages/SettingsPage';
import ReviewsPage               from './pages/ReviewsPage';
import PendingApprovalPage       from './pages/PendingApprovalPage';
import LandingPage               from './pages/LandingPage';
import PatientAuthPage           from './pages/patient/PatientAuthPage';
import ExplorerPage              from './pages/patient/ExplorerPage';
import DentistProfilePage        from './pages/patient/DentistProfilePage';
import MyBookingsPage            from './pages/patient/MyBookingsPage';
import ClinicProfilePage         from './pages/patient/ClinicProfilePage';
import ClinicGroupPage           from './pages/patient/ClinicGroupPage';
import ClinicAdminAuthPage       from './pages/clinic-admin/ClinicAdminAuthPage';
import ClinicAdminDashboardPage  from './pages/clinic-admin/ClinicAdminDashboardPage';
import ClinicAdminMembersPage    from './pages/clinic-admin/ClinicAdminMembersPage';
import ClinicAdminRequestsPage   from './pages/clinic-admin/ClinicAdminRequestsPage';
import ClinicAdminBillingPage    from './pages/clinic-admin/ClinicAdminBillingPage';
import ClinicAdminSettingsPage   from './pages/clinic-admin/ClinicAdminSettingsPage';

// Waits for DoctorContext to initialize, then redirects based on auth + clinic status
const PrivateRoute = ({ children }) => {
  const { doctor, loading, clinicStatus } = useDoctor();
  if (loading) return null;
  if (!doctor) return <Navigate to="/login" replace />;
  if (clinicStatus === 'pending') return <Navigate to="/pending-approval" replace />;
  return children;
};

// Ruta de așteptare — cere doar autentificare, nu verifică clinicStatus
const AuthOnlyRoute = ({ children }) => {
  const { doctor, loading } = useDoctor();
  if (loading) return null;
  return doctor ? children : <Navigate to="/login" replace />;
};

const ClinicPrivateRoute = ({ children }) => {
  const { clinic, loading } = useClinicAdmin();
  if (loading) return null;
  return clinic ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <Routes>
    {/* Pagina de așteptare pentru doctor cu cerere PENDING */}
    <Route path="/pending-approval" element={
      <AuthOnlyRoute><PendingApprovalPage /></AuthOnlyRoute>
    } />

    {/* Landing */}
    <Route path="/" element={<LandingPage />} />

    {/* Autentificare unificată */}
    <Route path="/login" element={<LoginPage />} />

    {/* Register per tip de cont */}
    <Route path="/register" element={<AuthPage />} />

    {/* Doctor portal — protejat */}
    <Route path="/dashboard"    element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
    <Route path="/calendar"     element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
    <Route path="/patients"     element={<PrivateRoute><PatientsPage /></PrivateRoute>} />
    <Route path="/services"     element={<PrivateRoute><ServicesPage /></PrivateRoute>} />
    <Route path="/statistics"   element={<PrivateRoute><StatisticsPage /></PrivateRoute>} />
    <Route path="/presentation" element={<PrivateRoute><PresentationPage /></PrivateRoute>} />
    <Route path="/settings"     element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
    <Route path="/reviews"      element={<PrivateRoute><ReviewsPage /></PrivateRoute>} />

    {/* Patient portal */}
    <Route path="/patient/login"    element={<Navigate to="/login" replace />} />
    <Route path="/patient/register" element={<PatientAuthPage />} />
    <Route path="/patient/explore"       element={<ExplorerPage />} />
    <Route path="/patient/dentist/:slug" element={<DentistProfilePage />} />
    <Route path="/patient/clinic/:slug"  element={<ClinicProfilePage />} />
    <Route path="/patient/clinic-group"  element={<ClinicGroupPage />} />
    <Route path="/patient/bookings"      element={<MyBookingsPage />} />

    {/* Clinic Admin portal — public */}
    <Route path="/clinic-admin/login"    element={<Navigate to="/login" replace />} />
    <Route path="/clinic-admin/register" element={<ClinicAdminAuthPage />} />

    {/* Clinic Admin portal — protejat */}
    <Route path="/clinic-admin" element={
      <ClinicPrivateRoute><ClinicAdminDashboardPage /></ClinicPrivateRoute>
    } />
    <Route path="/clinic-admin/members" element={
      <ClinicPrivateRoute><ClinicAdminMembersPage /></ClinicPrivateRoute>
    } />
    <Route path="/clinic-admin/requests" element={
      <ClinicPrivateRoute><ClinicAdminRequestsPage /></ClinicPrivateRoute>
    } />
    <Route path="/clinic-admin/billing" element={
      <ClinicPrivateRoute><ClinicAdminBillingPage /></ClinicPrivateRoute>
    } />
    <Route path="/clinic-admin/settings" element={
      <ClinicPrivateRoute><ClinicAdminSettingsPage /></ClinicPrivateRoute>
    } />

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <DoctorProvider>
      <ClinicAdminProvider>
        <AppRoutes />
      </ClinicAdminProvider>
    </DoctorProvider>
  </BrowserRouter>
);

export default App;
