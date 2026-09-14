import { useState, useEffect, useCallback } from 'react';
import { studentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const StatCard = ({ label, value, sublabel, accent = 'indigo' }) => {
  const accentClasses = {
    indigo: 'text-indigo-900 bg-indigo-50',
    green: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50',
    slate: 'text-slate-700 bg-slate-100',
  };

  return (
    <div className="card p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between">
        <span className="text-2xl font-semibold text-slate-900">{value}</span>
        {sublabel && (
          <span className={`badge ${accentClasses[accent]}`}>{sublabel}</span>
        )}
      </div>
    </div>
  );
};

const typeBadgeColor = {
  internship: 'bg-indigo-50 text-indigo-900',
  job: 'bg-emerald-50 text-emerald-700',
  project: 'bg-amber-50 text-amber-700',
  research: 'bg-slate-100 text-slate-700',
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyingId, setApplyingId] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await studentAPI.getDashboard();
      setStats(data.stats);
      setRecommended(data.recommendedOpportunities || []);
      setRecentActivity(data.recentActivity || []);
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Unable to load your dashboard right now.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleApply = async (opportunityId) => {
    setApplyingId(opportunityId);
    setApplyMessage('');
    try {
      await studentAPI.applyToOpportunity(opportunityId);
      setApplyMessage('Application submitted successfully.');
      fetchDashboard();
    } catch (err) {
      setApplyMessage(
        err?.response?.data?.message || 'Could not submit application. Try again.'
      );
    } finally {
      setApplyingId(null);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here's a snapshot of your progress and opportunities on InternSetu.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-3 w-20 bg-slate-200 rounded mb-3" />
                <div className="h-6 w-12 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Profile Completeness"
                value={`${stats?.profileCompleteness ?? 0}%`}
                sublabel={stats?.profileCompleteness >= 80 ? 'Strong' : 'Improve'}
                accent={stats?.profileCompleteness >= 80 ? 'green' : 'amber'}
              />
              <StatCard
                label="Applications"
                value={stats?.applications?.applied ?? 0}
                sublabel={`${stats?.applications?.selected ?? 0} selected`}
                accent="indigo"
              />
              <StatCard
                label="Courses Enrolled"
                value={stats?.courses?.enrolled ?? 0}
                sublabel={`${stats?.courses?.completed ?? 0} completed`}
                accent="slate"
              />
              <StatCard
                label="Total Points"
                value={stats?.totalPoints ?? 0}
                sublabel={`${stats?.totalBadges ?? 0} badges`}
                accent="green"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              {/* Recommended Opportunities */}
              <div className="lg:col-span-2 card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-slate-900">
                    Recommended Opportunities
                  </h2>
                  <a
                    href="/opportunities"
                    className="text-xs font-medium text-indigo-900 hover:underline"
                  >
                    View all
                  </a>
                </div>

                {applyMessage && (
                  <div className="mb-4 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs text-indigo-900">
                    {applyMessage}
                  </div>
                )}

                {recommended.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">
                    No recommendations yet — complete your profile to get matched
                    opportunities.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {recommended.map((opp) => (
                      <li key={opp._id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-medium text-slate-900 truncate">
                                {opp.title}
                              </h3>
                              <span
                                className={`badge ${
                                  typeBadgeColor[opp.type] || 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {opp.type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {opp.companyName} · {opp.location}
                            </p>
                            {opp.requiredSkills?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {opp.requiredSkills.slice(0, 4).map((skill) => (
                                  <span
                                    key={skill}
                                    className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-slate-400 mt-2">
                              Apply by{' '}
                              {opp.applicationDeadline
                                ? new Date(opp.applicationDeadline).toLocaleDateString()
                                : 'N/A'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleApply(opp._id)}
                            disabled={applyingId === opp._id}
                            className="btn-primary shrink-0 !px-3 !py-2 text-xs"
                          >
                            {applyingId === opp._id ? 'Applying...' : 'Apply'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Recent Activity */}
              <div className="card p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-4">
                  Recent Activity
                </h2>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">
                    No activity yet. Start a course or apply to an opportunity.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {recentActivity.map((activity, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="h-2 w-2 mt-1.5 rounded-full bg-indigo-900 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-slate-800">
                            {activity.description || activity.action}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {activity.skill ? `${activity.skill} · ` : ''}
                            {activity.date
                              ? new Date(activity.date).toLocaleDateString()
                              : ''}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
