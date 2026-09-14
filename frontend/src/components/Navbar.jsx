import { useAuth } from '../context/AuthContext';

const roleLabels = {
  student: 'Student',
  industry: 'Industry Partner',
  educator: 'Educator',
  admin: 'Administrator',
};

const Navbar = () => {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-900 flex items-center justify-center">
            <span className="text-white text-sm font-bold">IS</span>
          </div>
          <span className="text-lg font-semibold text-slate-900 tracking-tight">
            InternSetu
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900 leading-tight">
              {user?.name}
            </p>
            <p className="text-xs text-slate-500 leading-tight">
              {roleLabels[user?.role] || user?.role}
            </p>
          </div>
          <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-900 flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
          <button
            onClick={logout}
            className="text-sm text-slate-500 hover:text-indigo-900 font-medium transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
