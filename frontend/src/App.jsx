import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import IndustryDashboard from './pages/IndustryDashboard';
import EducatorDashboard from './pages/EducatorDashboard';
import GenericDashboard from './pages/GenericDashboard';
import MockInterview from './pages/MockInterview';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';

// Routes to the correct dashboard based on the logged-in user's role
const DashboardRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'student') return <StudentDashboard />;
  if (user?.role === 'industry') return <IndustryDashboard />;
  if (user?.role === 'educator') return <EducatorDashboard />;
  return <GenericDashboard />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={<AuthPage />} />

      {/* Generic dashboard — resolves to the right one based on role.
          Kept as a stable redirect target (e.g. after login). */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />

      {/* Dedicated per-role dashboard routes, used by the navbar's
          role-based "Dashboard" link */}
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/industry-dashboard"
        element={
          <ProtectedRoute allowedRoles={['industry']}>
            <IndustryDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/educator-dashboard"
        element={
          <ProtectedRoute allowedRoles={['educator']}>
            <EducatorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <GenericDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mock-interview"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <MockInterview />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-semibold text-indigo-900">404</p>
              <p className="text-sm text-slate-500 mt-2">Page not found</p>
              <a
                href="/dashboard"
                className="inline-block mt-4 text-sm font-medium text-indigo-900 hover:underline"
              >
                Back to dashboard
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
