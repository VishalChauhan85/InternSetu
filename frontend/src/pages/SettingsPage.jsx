import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-xl font-semibold text-slate-900 mb-6">Account Settings</h1>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
            <p className="text-sm text-slate-900">{user?.name}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
            <p className="text-sm text-slate-900">{user?.email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
            <p className="text-sm text-slate-900 capitalize">{user?.role}</p>
          </div>
          <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
            Editable profile settings aren't wired up yet — this is a placeholder so the
            navbar's "Settings" link has somewhere real to go.
          </p>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
