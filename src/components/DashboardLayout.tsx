import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCog, Stethoscope, CalendarDays, FlaskConical,
  Pill, Building2, Receipt, FileBarChart, Settings, LogOut, Menu, X,
  Moon, Sun, Search, Activity, HeartPulse, ChevronDown, UserCircle,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import type { Role } from '../lib/types';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  roles: Role[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin', 'doctor', 'receptionist', 'pharmacist', 'lab_technician', 'patient'] },
  { label: 'Appointments', path: '/dashboard/appointments', icon: <CalendarDays className="w-5 h-5" />, roles: ['admin', 'doctor', 'receptionist', 'patient'] },
  { label: 'Patients', path: '/dashboard/patients', icon: <Users className="w-5 h-5" />, roles: ['admin', 'doctor', 'receptionist', 'lab_technician'] },
  { label: 'Doctors', path: '/dashboard/doctors', icon: <Stethoscope className="w-5 h-5" />, roles: ['admin', 'receptionist'] },
  { label: 'Departments', path: '/dashboard/departments', icon: <Building2 className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Staff', path: '/dashboard/staff', icon: <UserCog className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Prescriptions', path: '/dashboard/prescriptions', icon: <FileBarChart className="w-5 h-5" />, roles: ['admin', 'doctor', 'patient', 'pharmacist'] },
  { label: 'Pharmacy', path: '/dashboard/pharmacy', icon: <Pill className="w-5 h-5" />, roles: ['admin', 'pharmacist'] },
  { label: 'Laboratory', path: '/dashboard/laboratory', icon: <FlaskConical className="w-5 h-5" />, roles: ['admin', 'lab_technician', 'doctor', 'patient'] },
  { label: 'Billing', path: '/dashboard/billing', icon: <Receipt className="w-5 h-5" />, roles: ['admin', 'receptionist', 'patient'] },
  { label: 'Rooms & Beds', path: '/dashboard/rooms', icon: <Building2 className="w-5 h-5" />, roles: ['admin', 'receptionist'] },
  { label: 'Admissions', path: '/dashboard/admissions', icon: <Activity className="w-5 h-5" />, roles: ['admin', 'receptionist'] },
  { label: 'Reports', path: '/dashboard/reports', icon: <FileBarChart className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Activity Logs', path: '/dashboard/logs', icon: <Activity className="w-5 h-5" />, roles: ['admin'] },
  { label: 'CMS Content', path: '/dashboard/cms', icon: <Settings className="w-5 h-5" />, roles: ['admin'] },
  { label: 'My Profile', path: '/dashboard/profile', icon: <UserCircle className="w-5 h-5" />, roles: ['admin', 'doctor', 'receptionist', 'pharmacist', 'lab_technician', 'patient'] },
];

const roleLabels: Record<Role, string> = {
  admin: 'Administrator',
  doctor: 'Doctor',
  receptionist: 'Receptionist',
  patient: 'Patient',
  pharmacist: 'Pharmacist',
  lab_technician: 'Lab Technician',
};

export default function DashboardLayout({ children, title }: { children: ReactNode; title: string }) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);

  const role = profile?.role ?? 'patient';
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 transition-transform duration-300 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="p-2 bg-primary-600 rounded-lg">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-gray-100">MediCare</h1>
            <p className="text-xs text-gray-400">HMS Portal</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <button onClick={handleSignOut} className="nav-link nav-link-inactive w-full text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">{title}</h1>

            <button onClick={toggleTheme} className="btn-ghost p-2">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <Link to="/" className="btn-ghost p-2 hidden sm:flex" title="View Website">
              <Search className="w-5 h-5" />
            </Link>

            <div className="relative">
              <button onClick={() => setProfileMenu(!profileMenu)} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium text-sm">
                  {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{profile?.full_name}</p>
                  <p className="text-xs text-gray-400">{roleLabels[role]}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {profileMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1 animate-slide-up">
                    <Link to="/dashboard/profile" onClick={() => setProfileMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <UserCircle className="w-4 h-4" /> My Profile
                    </Link>
                    <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 text-sm text-error-500 hover:bg-gray-100 dark:hover:bg-gray-700 w-full">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
