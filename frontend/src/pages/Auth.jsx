import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialFormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

// Small inline icon set — keeps this file dependency-free (no icon package).
const IconMail = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 12 13l9-5.5M4.5 5h15A1.5 1.5 0 0 1 21 6.5v11A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-11A1.5 1.5 0 0 1 4.5 5Z" />
  </svg>
);

const IconLock = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 10.5V7.5a4.5 4.5 0 1 1 9 0v3M5.5 10.5h13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />
  </svg>
);

const IconUser = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
  </svg>
);

const IconEye = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconEyeOff = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.7a2.75 2.75 0 0 0 3.9 3.9M9.4 5.8A10.6 10.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a13.4 13.4 0 0 1-3.2 3.9M6.3 7.3A13.6 13.6 0 0 0 2.5 12S6 18.5 12 18.5a10.3 10.3 0 0 0 3.4-.58" />
  </svg>
);

const IconAlert = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A1.5 1.5 0 0 0 3.4 20.5h17.2a1.5 1.5 0 0 0 1.29-2.46L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z" />
  </svg>
);

const FeatureRow = ({ children }) => (
  <li className="flex items-start gap-3">
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
      <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
    <span className="text-sm text-indigo-100 leading-relaxed">{children}</span>
  </li>
);

const Auth = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState(initialFormState);
  const [showPassword, setShowPassword] = useState(false);
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
    setLocalError('');
    clearAuthError();
  }, [mode, clearAuthError]);

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

    // NOTE: no `role` is ever sent from this form. Public sign-up always
    // creates a student account — the backend hardcodes this regardless of
    // what's sent, but we don't even offer the option here. Educator and
    // Industry accounts are provisioned by an admin.
    let result;
    if (mode === 'login') {
      result = await login({ email: formData.email, password: formData.password });
    } else {
      result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
    }

    setSubmitting(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ---------------- Left: Branding panel ---------------- */}
      <div className="relative hidden lg:flex lg:w-[45%] xl:w-2/5 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 px-12 py-14 text-white">
        {/* Decorative blurred shapes */}
        <div className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <span className="text-base font-bold tracking-tight">IS</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">InternSetu</span>
          </div>
        </div>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
              Where academic talent meets real industry opportunity.
            </h1>
            <p className="text-sm text-indigo-200 leading-relaxed max-w-sm">
              One platform for internships, mentorship, and career growth —
              built for students, employers, and educators alike.
            </p>
          </div>

          <ul className="space-y-3.5">
            <FeatureRow>Verified internship & job opportunities from real companies</FeatureRow>
            <FeatureRow>Skill-building courses with live progress tracking</FeatureRow>
            <FeatureRow>AI-powered mock interviews & resume feedback</FeatureRow>
            <FeatureRow>Direct academia-industry collaboration tools</FeatureRow>
          </ul>
        </div>

        <p className="relative text-xs text-indigo-300/80">
          &copy; {new Date().getFullYear()} InternSetu. All rights reserved.
        </p>
      </div>

      {/* ---------------- Right: Form panel ---------------- */}
      <div className="flex w-full lg:w-[55%] xl:w-3/5 items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          {/* Mobile-only brand mark */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-900">
              <span className="text-sm font-bold text-white">IS</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">InternSetu</span>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-md shadow-slate-200/50 sm:p-10">
            {/* Mode toggle */}
            <div className="mb-7 flex rounded-full bg-slate-100 p-1">
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setFormData(initialFormState);
                  }}
                  className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
                    mode === m
                      ? 'bg-white text-indigo-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                {mode === 'login' ? 'Welcome back' : "Let's get you started"}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {mode === 'login'
                  ? 'Sign in to continue to your InternSetu dashboard.'
                  : 'Create your free student account in under a minute.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Full Name
                  </label>
                  <div className="relative">
                    <IconUser className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Email Address
                </label>
                <div className="relative">
                  <IconMail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Password
                </label>
                <div className="relative">
                  <IconLock className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <IconEyeOff className="h-4.5 w-4.5" /> : <IconEye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <IconLock className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                    />
                  </div>
                </div>
              )}

              {displayError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <IconAlert className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                  <span>{displayError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-900 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-800 hover:shadow-md active:bg-indigo-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
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
                className="font-semibold text-indigo-900 transition-colors hover:text-indigo-700 hover:underline"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-slate-400">
            Looking to hire interns or manage students? Educator and Industry
            accounts are provisioned by an InternSetu administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
