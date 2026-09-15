import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';

const ROLES = [
  { value: 'student', label: 'Student', desc: 'Explore internships & build your career' },
  { value: 'industry', label: 'Industry', desc: 'Post opportunities & find talent' },
  { value: 'educator', label: 'Educator', desc: 'Mentor students & track outcomes' },
  { value: 'admin', label: 'Admin', desc: 'Manage the platform' },
];

const initialFormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  institutionName: '',
  designation: '',
  phone: '',
};

const AuthPage = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState('student');
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const { login, register, authError, clearAuthError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    // Clear errors when switching modes or roles
    setLocalError('');
    clearAuthError();
  }, [mode, selectedRole, clearAuthError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.email || !formData.password) {
      return 'Email and password are required';
    }
    if (mode === 'register') {
      if (!formData.name) return 'Full name is required';
      if (formData.password.length < 6) return 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
      if (selectedRole === 'industry' && !formData.companyName) {
        return 'Company name is required for industry accounts';
      }
      if (selectedRole === 'educator' && !formData.institutionName) {
        return 'Institution name is required for educator accounts';
      }
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setSubmitting(true);

    let result;
    if (mode === 'login') {
      result = await login({
        email: formData.email,
        password: formData.password,
        role: selectedRole,
      });
    } else {
      result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: selectedRole,
        companyName: formData.companyName,
        institutionName: formData.institutionName,
        designation: formData.designation,
        phone: formData.phone,
      });
    }

    setSubmitting(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        {/* Left panel — branding */}
        <div className="hidden md:flex flex-col justify-between bg-indigo-900 text-white p-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">InternSetu</h1>
            <p className="mt-2 text-indigo-200 text-sm">
              Bridging Academia &amp; Industry
            </p>
          </div>
          <div className="space-y-4 mt-10">
            <p className="text-lg font-medium leading-relaxed">
              One platform for internships, mentorship, and career growth.
            </p>
            <ul className="space-y-2 text-sm text-indigo-200">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
                Verified internship & job opportunities
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
                Skill-building courses & progress tracking
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
                Direct academia-industry collaboration
              </li>
            </ul>
          </div>
          <p className="text-xs text-indigo-300">
            &copy; {new Date().getFullYear()} InternSetu. All rights reserved.
          </p>
        </div>

        {/* Right panel — form */}
        <div className="bg-white p-8 sm:p-10">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {mode === 'login'
                ? 'Sign in to continue to your dashboard'
                : 'Join InternSetu as a student, industry partner, or educator'}
            </p>
          </div>

          {/* Role selector */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-slate-600 mb-2">
              I am signing in as
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    selectedRole === role.value
                      ? 'border-indigo-900 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-900'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-medium">{role.label}</span>
                  <span className="block text-xs text-slate-400 mt-0.5 leading-tight">
                    {role.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Input
                label="Full Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            )}

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />

            {mode === 'register' && selectedRole === 'industry' && (
              <Input
                label="Company Name"
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Acme Corp"
                autoComplete="organization"
              />
            )}

            {mode === 'register' && selectedRole === 'educator' && (
              <Input
                label="Institution Name"
                type="text"
                name="institutionName"
                value={formData.institutionName}
                onChange={handleChange}
                placeholder="ABC Institute of Technology"
                autoComplete="organization"
              />
            )}

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />

            {mode === 'register' && (
              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            )}

            {displayError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {displayError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-medium text-sm py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setFormData(initialFormState);
              }}
              className="text-indigo-900 font-medium hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
