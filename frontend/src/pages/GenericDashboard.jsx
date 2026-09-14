import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const roleCopy = {
  industry: {
    title: 'Industry Dashboard',
    desc: 'Post opportunities, review applicants, and collaborate with institutions.',
  },
  educator: {
    title: 'Educator Dashboard',
    desc: 'Track student progress, mentor cohorts, and coordinate with industry partners.',
  },
  admin: {
    title: 'Admin Dashboard',
    desc: 'Oversee platform activity, manage users, and moderate content.',
  },
};

const GenericDashboard = () => {
  const { user } = useAuth();
  const copy = roleCopy[user?.role] || {
    title: 'Dashboard',
    desc: 'Welcome to InternSetu.',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-10 text-center">
          <h1 className="text-xl font-semibold text-slate-900">{copy.title}</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            {copy.desc}
          </p>
          <p className="text-xs text-slate-400 mt-6">
            This module is scaffolded and ready for role-specific features.
          </p>
        </div>
      </main>
    </div>
  );
};

export default GenericDashboard;
