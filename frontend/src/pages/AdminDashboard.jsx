import { useState } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const ROLE_CARDS = [
  {
    value: 'educator',
    label: 'Educator',
    desc: 'Mentors students, tracks progress, publishes courses',
  },
  {
    value: 'industry',
    label: 'Industry',
    desc: 'Posts opportunities, reviews and manages applicants',
  },
];

const initialForm = {
  role: 'educator',
  name: '',
  email: '',
  password: '',
  institutionName: '',
  companyName: '',
  designation: '',
  phone: '',
};

// Generates a strong, readable temporary password the admin can hand off.
const generatePassword = () => {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let pwd = '';
  for (let i = 0; i < 14; i += 1) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
};

const roleBadgeColor = {
  educator: 'bg-violet-50 text-violet-700',
  industry: 'bg-indigo-50 text-indigo-900',
};

const AdminDashboard = () => {
  const { user } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdAccounts, setCreatedAccounts] = useState([]); // session-only log
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (role) => {
    setForm((prev) => ({ ...prev, role }));
  };

  const handleGeneratePassword = () => {
    setForm((prev) => ({ ...prev, password: generatePassword() }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.password) {
      setError('Name, email, and password are required.');
      return;
    }
    if (form.role === 'educator' && !form.institutionName) {
      setError('Institution name is required for educator accounts.');
      return;
    }
    if (form.role === 'industry' && !form.companyName) {
      setError('Company name is required for industry accounts.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await adminAPI.createUser(form);

      setCreatedAccounts((prev) => [
        {
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          password: form.password, // shown once, for the admin to hand off
          createdAt: new Date(),
        },
        ...prev,
      ]);

      setForm({ ...initialForm, role: form.role });
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Could not create the account. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async (account, idx) => {
    const text = `Email: ${account.email}\nTemporary Password: ${account.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 1800);
    } catch {
      // Clipboard API may be unavailable — fail silently, credentials are
      // still visible on screen for manual copy.
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Signed in as <span className="font-medium text-slate-700">{user?.name}</span> ·
            Provision Educator and Industry accounts below.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* ---------------- Create account form ---------------- */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-5 text-base font-semibold text-slate-900">
              Provision a New Account
            </h2>

            {/* Role selector cards */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              {ROLE_CARDS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => handleRoleSelect(r.value)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    form.role === r.value
                      ? 'border-indigo-900 bg-indigo-50/60 ring-1 ring-indigo-900'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      form.role === r.value ? 'text-indigo-900' : 'text-slate-800'
                    }`}
                  >
                    {r.label}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{r.desc}</p>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jane@example.com"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  />
                </div>
              </div>

              {form.role === 'educator' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Institution Name
                  </label>
                  <input
                    type="text"
                    name="institutionName"
                    value={form.institutionName}
                    onChange={handleChange}
                    placeholder="ABC Institute of Technology"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  />
                </div>
              )}

              {form.role === 'industry' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    placeholder="Acme Corp"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  />
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Designation <span className="text-slate-400 normal-case">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    placeholder="Head of Placements"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Phone <span className="text-slate-400 normal-case">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Temporary Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Set or generate a password"
                    className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="shrink-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-900"
                  >
                    Generate
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  Share this with the new user securely — it's shown only once below after creation.
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-indigo-900 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Creating account...' : `Create ${form.role === 'educator' ? 'Educator' : 'Industry'} Account`}
              </button>
            </form>
          </div>

          {/* ---------------- Recently created accounts ---------------- */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-1 text-base font-semibold text-slate-900">
              Recently Created
            </h2>
            <p className="mb-5 text-xs text-slate-400">
              Visible for this session only — credentials aren't stored or shown again.
            </p>

            {createdAccounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 text-center">
                <p className="text-sm text-slate-400">
                  Accounts you create will appear here.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {createdAccounts.map((acc, idx) => (
                  <li
                    key={`${acc.email}-${idx}`}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">{acc.name}</p>
                          <span className={`badge ${roleBadgeColor[acc.role]} capitalize`}>
                            {acc.role}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{acc.email}</p>
                        <p className="mt-1.5 font-mono text-xs text-slate-600">
                          {acc.password}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopy(acc, idx)}
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-900"
                      >
                        {copiedIndex === idx ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
