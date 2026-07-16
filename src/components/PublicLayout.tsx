import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Menu, X, Moon, Sun, Phone, LogIn } from 'lucide-react';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Departments', path: '/departments' },
  { label: 'Doctors', path: '/doctors' },
  { label: 'Services', path: '/services' },
  { label: 'Blog', path: '/blog' },
  { label: 'Contact', path: '/contact' },
  { label: 'FAQ', path: '/faq' },
];

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="bg-primary-700 text-white text-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> +1 (555) 123-4567
            </span>
            <span>24/7 Emergency Care</span>
          </div>
          <div className="flex items-center gap-4">
            <span>contact@medicare-hospital.com</span>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 bg-primary-600 rounded-lg">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-gray-100 text-lg">MediCare</h1>
              <p className="text-xs text-gray-400 -mt-0.5">Hospital Management</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="btn-ghost p-2">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            {profile ? (
              <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm">
                Dashboard
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="btn-primary text-sm hidden sm:flex">
                <LogIn className="w-4 h-4" /> Sign In
              </button>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden btn-ghost p-2">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-slide-up">
            <nav className="flex flex-col p-3 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                >
                  {link.label}
                </Link>
              ))}
              {!profile && (
                <button
                  onClick={() => { setMenuOpen(false); navigate('/login'); }}
                  className="btn-primary text-sm mt-2"
                >
                  <LogIn className="w-4 h-4" /> Sign In
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary-600 rounded-lg">
                <HeartPulse className="w-6 h-6 text-white" />
              </div>
              <h2 className="font-bold text-white text-lg">MediCare</h2>
            </div>
            <p className="text-sm text-gray-400">
              Providing compassionate, quality healthcare to our community since 1995. Your health is our priority.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {navLinks.slice(0, 5).map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-gray-400 hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Emergency Care</li>
              <li>Outpatient Services</li>
              <li>Diagnostic Imaging</li>
              <li>Telemedicine</li>
              <li>Pharmacy</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>123 Healthcare Ave, Medical City</li>
              <li>+1 (555) 123-4567</li>
              <li>contact@medicare-hospital.com</li>
              <li>Open 24/7</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 py-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} MediCare Hospital. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
