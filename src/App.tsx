import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { ToastProvider } from './components/Toast';

import PublicLayout from './components/PublicLayout';
import HomePage from './pages/public/HomePage';
import DepartmentsPage from './pages/public/DepartmentsPage';
import DoctorsPage from './pages/public/DoctorsPage';
import CmsPageView from './pages/public/CmsPageView';
import BlogPage from './pages/public/BlogPage';
import BlogPostPage from './pages/public/BlogPostPage';
import ContactPage from './pages/public/ContactPage';
import FaqPage from './pages/public/FaqPage';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import DashboardHome from './pages/dashboard/DashboardHome';
import AppointmentsPage from './pages/dashboard/AppointmentsPage';
import PatientsPage from './pages/dashboard/PatientsPage';
import DoctorsMgmtPage from './pages/dashboard/DoctorsPage';
import DepartmentsMgmtPage from './pages/dashboard/DepartmentsPage';
import StaffPage from './pages/dashboard/StaffPage';
import PrescriptionsPage from './pages/dashboard/PrescriptionsPage';
import PharmacyPage from './pages/dashboard/PharmacyPage';
import LaboratoryPage from './pages/dashboard/LaboratoryPage';
import BillingPage from './pages/dashboard/BillingPage';
import RoomsPage from './pages/dashboard/RoomsPage';
import AdmissionsPage from './pages/dashboard/AdmissionsPage';
import ReportsPage from './pages/dashboard/ReportsPage';
import LogsPage from './pages/dashboard/LogsPage';
import CmsPage from './pages/dashboard/CmsPage';
import ProfilePage from './pages/dashboard/ProfilePage';

import type { Role } from './lib/types';

const roleAccess: Record<string, Role[]> = {
  '/dashboard': ['admin', 'doctor', 'receptionist', 'patient', 'pharmacist', 'lab_technician'],
  '/dashboard/appointments': ['admin', 'doctor', 'receptionist', 'patient'],
  '/dashboard/patients': ['admin', 'doctor', 'receptionist', 'lab_technician'],
  '/dashboard/doctors': ['admin', 'receptionist'],
  '/dashboard/departments': ['admin'],
  '/dashboard/staff': ['admin'],
  '/dashboard/prescriptions': ['admin', 'doctor', 'patient', 'pharmacist'],
  '/dashboard/pharmacy': ['admin', 'pharmacist'],
  '/dashboard/laboratory': ['admin', 'lab_technician', 'doctor', 'patient'],
  '/dashboard/billing': ['admin', 'receptionist', 'patient'],
  '/dashboard/rooms': ['admin', 'receptionist'],
  '/dashboard/admissions': ['admin', 'receptionist'],
  '/dashboard/reports': ['admin'],
  '/dashboard/logs': ['admin'],
  '/dashboard/cms': ['admin'],
  '/dashboard/profile': ['admin', 'doctor', 'receptionist', 'patient', 'pharmacist', 'lab_technician'],
};

function ProtectedRoute({ children, path }: { children: ReactNode; path: string }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const allowedRoles = roleAccess[path] ?? [];
  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><CmsPageView slug="about" /></PublicLayout>} />
      <Route path="/departments" element={<PublicLayout><DepartmentsPage /></PublicLayout>} />
      <Route path="/doctors" element={<PublicLayout><DoctorsPage /></PublicLayout>} />
      <Route path="/services" element={<PublicLayout><CmsPageView slug="services" /></PublicLayout>} />
      <Route path="/blog" element={<PublicLayout><BlogPage /></PublicLayout>} />
      <Route path="/blog/:slug" element={<PublicLayout><BlogPostPageWrapper /></PublicLayout>} />
      <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
      <Route path="/faq" element={<PublicLayout><FaqPage /></PublicLayout>} />
      <Route path="/privacy" element={<PublicLayout><CmsPageView slug="privacy" /></PublicLayout>} />
      <Route path="/terms" element={<PublicLayout><CmsPageView slug="terms" /></PublicLayout>} />

      {/* Auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Dashboard routes */}
      <Route path="/dashboard" element={<ProtectedRoute path="/dashboard"><DashboardHome /></ProtectedRoute>} />
      <Route path="/dashboard/appointments" element={<ProtectedRoute path="/dashboard/appointments"><AppointmentsPage /></ProtectedRoute>} />
      <Route path="/dashboard/patients" element={<ProtectedRoute path="/dashboard/patients"><PatientsPage /></ProtectedRoute>} />
      <Route path="/dashboard/doctors" element={<ProtectedRoute path="/dashboard/doctors"><DoctorsMgmtPage /></ProtectedRoute>} />
      <Route path="/dashboard/departments" element={<ProtectedRoute path="/dashboard/departments"><DepartmentsMgmtPage /></ProtectedRoute>} />
      <Route path="/dashboard/staff" element={<ProtectedRoute path="/dashboard/staff"><StaffPage /></ProtectedRoute>} />
      <Route path="/dashboard/prescriptions" element={<ProtectedRoute path="/dashboard/prescriptions"><PrescriptionsPage /></ProtectedRoute>} />
      <Route path="/dashboard/pharmacy" element={<ProtectedRoute path="/dashboard/pharmacy"><PharmacyPage /></ProtectedRoute>} />
      <Route path="/dashboard/laboratory" element={<ProtectedRoute path="/dashboard/laboratory"><LaboratoryPage /></ProtectedRoute>} />
      <Route path="/dashboard/billing" element={<ProtectedRoute path="/dashboard/billing"><BillingPage /></ProtectedRoute>} />
      <Route path="/dashboard/rooms" element={<ProtectedRoute path="/dashboard/rooms"><RoomsPage /></ProtectedRoute>} />
      <Route path="/dashboard/admissions" element={<ProtectedRoute path="/dashboard/admissions"><AdmissionsPage /></ProtectedRoute>} />
      <Route path="/dashboard/reports" element={<ProtectedRoute path="/dashboard/reports"><ReportsPage /></ProtectedRoute>} />
      <Route path="/dashboard/logs" element={<ProtectedRoute path="/dashboard/logs"><LogsPage /></ProtectedRoute>} />
      <Route path="/dashboard/cms" element={<ProtectedRoute path="/dashboard/cms"><CmsPage /></ProtectedRoute>} />
      <Route path="/dashboard/profile" element={<ProtectedRoute path="/dashboard/profile"><ProfilePage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { useParams } from 'react-router-dom';

function BlogPostPageWrapper() {
  const { slug } = useParams();
  return <BlogPostPage slug={slug ?? ''} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
