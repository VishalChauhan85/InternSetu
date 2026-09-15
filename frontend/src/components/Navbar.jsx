import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleLabels = {
  student: 'Student',
  industry: 'Industry Partner',
  educator: 'Educator',
  admin: 'Administrator',
};

// Maps a role to its dedicated dashboard route
const roleDashboardPath = {
  student: '/student-dashboard',
  industry: '/industry-dashboard',
  educator: '/educator-dashboard',
  admin: '/admin-dashboard',
};

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const dashboardPath = roleDashboardPath[user?.role] || '/dashboard';

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  // Close the dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    setMenuOpen(false);
    logout();
    navigate('/auth', { replace: true });
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to={isAuthenticated ? dashboardPath : '/'} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-900 flex items-center justify-center">
            <span className="text-white text-sm font-bold">IS</span>
          </div>
          <span className="text-lg font-semibold text-slate-900 tracking-tight">
            InternSetu
          </span>
        </Link>

        {!isAuthenticated ? (
          /* ---------- Logged-out state ---------- */
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="text-sm font-medium text-slate-600 hover:text-indigo-900 transition-colors px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/auth"
              className="text-sm font-medium text-white bg-indigo-900 hover:bg-indigo-800 transition-colors px-4 py-2 rounded-lg"
            >
              Create Account
            </Link>
          </div>
        ) : (
          /* ---------- Logged-in state ---------- */
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to={dashboardPath}
              className="hidden sm:inline-block text-sm font-medium text-slate-600 hover:text-indigo-900 transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Dashboard
            </Link>

            {/* Profile dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-50 transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-900 flex items-center justify-center text-sm font-semibold shrink-0">
                  {initials}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium text-slate-900 leading-tight">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 leading-tight">
                    {roleLabels[user?.role] || user?.role}
                  </p>
                </div>
                <svg
                  className={`h-4 w-4 text-slate-400 transition-transform ${
                    menuOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 sm:hidden">
                    <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500">
                      {roleLabels[user?.role] || user?.role}
                    </p>
                  </div>

                  <Link
                    to={dashboardPath}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    My Dashboard
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
