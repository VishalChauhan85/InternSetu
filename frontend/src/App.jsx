import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import GenericDashboard from './pages/GenericDashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Routes to the correct dashboard based on the logged-in user's role
const DashboardRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'student') return <StudentDashboard />;
  return <GenericDashboard />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />

      {/* Example of a role-restricted route for future expansion */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
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
