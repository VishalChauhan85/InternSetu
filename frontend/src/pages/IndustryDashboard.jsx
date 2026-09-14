import { useState, useEffect, useCallback } from 'react';
import { industryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const TYPE_OPTIONS = ['internship', 'job', 'project', 'research'];
const WORK_MODE_OPTIONS = ['remote', 'onsite', 'hybrid'];
const STATUS_OPTIONS = ['applied', 'shortlisted', 'selected', 'rejected'];

const statusBadgeColor = {
  applied: 'bg-slate-100 text-slate-700',
  shortlisted: 'bg-amber-50 text-amber-700',
  selected: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
};

const typeBadgeColor = {
  internship: 'bg-indigo-50 text-indigo-900',
  job: 'bg-emerald-50 text-emerald-700',
  project: 'bg-amber-50 text-amber-700',
  research: 'bg-slate-100 text-slate-700',
};

const initialPostForm = {
  title: '',
  companyName: '',
  type: 'internship',
  description: '',
  requiredSkills: '',
  location: '',
  workMode: 'remote',
  duration: '',
  stipendAmount: '',
  isPaid: true,
  openings: 1,
  applicationDeadline: '',
};

const IndustryDashboard = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('postings'); // 'postings' | 'post' | 'applicants'

  const [opportunities, setOpportunities] = useState([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(true);
  const [listError, setListError] = useState('');

  const [postForm, setPostForm] = useState({
    ...initialPostForm,
    companyName: user?.companyName || '',
  });
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [postSuccess, setPostSuccess] = useState('');

  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [applicantsError, setApplicantsError] = useState('');
  const [updatingApplicantId, setUpdatingApplicantId] = useState(null);

  const fetchOpportunities = useCallback(async () => {
    setLoadingOpportunities(true);
    setListError('');
    try {
      const { data } = await industryAPI.listMyOpportunities();
      setOpportunities(data.opportunities || []);
    } catch (err) {
      setListError(
        err?.response?.data?.message || 'Unable to load your postings right now.'
      );
    } finally {
      setLoadingOpportunities(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const fetchApplicants = useCallback(async (opportunityId) => {
    setLoadingApplicants(true);
    setApplicantsError('');
    try {
      const { data } = await industryAPI.getApplicants(opportunityId);
      setApplicants(data.applicants || []);
    } catch (err) {
      setApplicantsError(
        err?.response?.data?.message || 'Unable to load applicants right now.'
      );
    } finally {
      setLoadingApplicants(false);
    }
  }, []);

  const handleViewApplicants = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setActiveTab('applicants');
    fetchApplicants(opportunity._id);
  };

  const handlePostChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPostForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setPostError('');
    setPostSuccess('');

    if (!postForm.title || !postForm.description || !postForm.applicationDeadline) {
      setPostError('Title, description, and application deadline are required.');
      return;
    }

    setPosting(true);
    try {
      const payload = {
        title: postForm.title,
        companyName: postForm.companyName,
        type: postForm.type,
        description: postForm.description,
        requiredSkills: postForm.requiredSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        location: postForm.location || 'Remote',
        workMode: postForm.workMode,
        duration: postForm.duration,
        stipend: {
          amount: Number(postForm.stipendAmount) || 0,
          isPaid: postForm.isPaid,
        },
        openings: Number(postForm.openings) || 1,
        applicationDeadline: postForm.applicationDeadline,
      };

      await industryAPI.createOpportunity(payload);
      setPostSuccess('Opportunity posted successfully.');
      setPostForm({ ...initialPostForm, companyName: user?.companyName || '' });
      fetchOpportunities();
      setActiveTab('postings');
    } catch (err) {
      setPostError(
        err?.response?.data?.message || 'Could not post opportunity. Please try again.'
      );
    } finally {
      setPosting(false);
    }
  };

  const handleStatusChange = async (studentId, newStatus) => {
    if (!selectedOpportunity) return;
    setUpdatingApplicantId(studentId);
    try {
      await industryAPI.updateApplicantStatus(selectedOpportunity._id, studentId, newStatus);
      setApplicants((prev) =>
        prev.map((a) =>
          a.student?._id === studentId ? { ...a, status: newStatus } : a
        )
      );
    } catch (err) {
      setApplicantsError(
        err?.response?.data?.message || 'Could not update applicant status.'
      );
    } finally {
      setUpdatingApplicantId(null);
    }
  };

  const tabs = [
    { key: 'postings', label: 'My Postings' },
    { key: 'post', label: 'Post New Opportunity' },
    { key: 'applicants', label: 'Applicants' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            {user?.companyName || 'Industry'} Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Post opportunities and manage applicants from one place.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-900 text-indigo-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ---------- My Postings ---------- */}
        {activeTab === 'postings' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                Your Posted Opportunities
              </h2>
              <button onClick={() => setActiveTab('post')} className="btn-primary !px-3 !py-2 text-xs">
                + New Opportunity
              </button>
            </div>

            {listError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {listError}
              </div>
            )}

            {loadingOpportunities ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : opportunities.length === 0 ? (
              <p className="text-sm text-slate-500 py-10 text-center">
                You haven't posted any opportunities yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {opportunities.map((opp) => (
                  <li key={opp._id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-medium text-slate-900">{opp.title}</h3>
                          <span className={`badge ${typeBadgeColor[opp.type] || 'bg-slate-100 text-slate-700'}`}>
                            {opp.type}
                          </span>
                          <span className="badge bg-slate-100 text-slate-600 capitalize">
                            {opp.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {opp.location} · {opp.applicants?.length || 0} applicant(s)
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Deadline{' '}
                          {opp.applicationDeadline
                            ? new Date(opp.applicationDeadline).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleViewApplicants(opp)}
                        className="btn-secondary shrink-0 !px-3 !py-2 text-xs"
                      >
                        View Applicants
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ---------- Post New Opportunity ---------- */}
        {activeTab === 'post' && (
          <div className="card p-6 max-w-3xl">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Post a New Opportunity
            </h2>

            <form onSubmit={handlePostSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={postForm.title}
                    onChange={handlePostChange}
                    placeholder="Frontend Developer Intern"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={postForm.companyName}
                    onChange={handlePostChange}
                    placeholder="Acme Corp"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                  <select
                    name="type"
                    value={postForm.type}
                    onChange={handlePostChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent capitalize"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Work Mode</label>
                  <select
                    name="workMode"
                    value={postForm.workMode}
                    onChange={handlePostChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent capitalize"
                  >
                    {WORK_MODE_OPTIONS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Openings</label>
                  <input
                    type="number"
                    min="1"
                    name="openings"
                    value={postForm.openings}
                    onChange={handlePostChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  name="description"
                  value={postForm.description}
                  onChange={handlePostChange}
                  rows={4}
                  placeholder="Describe the role, responsibilities, and what a successful candidate looks like..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Required Skills <span className="text-slate-400">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  name="requiredSkills"
                  value={postForm.requiredSkills}
                  onChange={handlePostChange}
                  placeholder="React, Node.js, MongoDB"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={postForm.location}
                    onChange={handlePostChange}
                    placeholder="Bengaluru / Remote"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Duration</label>
                  <input
                    type="text"
                    name="duration"
                    value={postForm.duration}
                    onChange={handlePostChange}
                    placeholder="3 months"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Stipend Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    name="stipendAmount"
                    value={postForm.stipendAmount}
                    onChange={handlePostChange}
                    placeholder="15000"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2 pb-2.5">
                  <input
                    type="checkbox"
                    id="isPaid"
                    name="isPaid"
                    checked={postForm.isPaid}
                    onChange={handlePostChange}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-900 focus:ring-indigo-900"
                  />
                  <label htmlFor="isPaid" className="text-sm text-slate-600">Paid position</label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Application Deadline</label>
                  <input
                    type="date"
                    name="applicationDeadline"
                    value={postForm.applicationDeadline}
                    onChange={handlePostChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent"
                  />
                </div>
              </div>

              {postError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {postError}
                </div>
              )}
              {postSuccess && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                  {postSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={posting} className="btn-primary">
                  {posting ? 'Posting...' : 'Post Opportunity'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('postings')}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ---------- Applicants ---------- */}
        {activeTab === 'applicants' && (
          <div className="card p-6">
            {!selectedOpportunity ? (
              <p className="text-sm text-slate-500 py-10 text-center">
                Select a posting from "My Postings" to view its applicants.
              </p>
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-slate-900">
                    Applicants for "{selectedOpportunity.title}"
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {applicants.length} applicant(s)
                  </p>
                </div>

                {applicantsError && (
                  <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    {applicantsError}
                  </div>
                )}

                {loadingApplicants ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : applicants.length === 0 ? (
                  <p className="text-sm text-slate-500 py-10 text-center">
                    No applicants yet for this opportunity.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {applicants.map((a) => (
                      <li key={a.student?._id || a._id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                              {a.student?.name || 'Unnamed Student'}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {a.student?.email} · Applied{' '}
                              {a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`badge ${statusBadgeColor[a.status] || 'bg-slate-100 text-slate-700'} capitalize`}>
                              {a.status}
                            </span>
                            <select
                              value={a.status}
                              disabled={updatingApplicantId === a.student?._id}
                              onChange={(e) => handleStatusChange(a.student?._id, e.target.value)}
                              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent capitalize disabled:opacity-60"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default IndustryDashboard;
