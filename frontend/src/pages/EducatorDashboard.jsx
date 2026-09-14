import { useState, useEffect, useCallback, useMemo } from 'react';
import { educatorAPI } from '../services/api';
import Navbar from '../components/Navbar';

const LEVEL_OPTIONS = ['beginner', 'intermediate', 'advanced'];

const initialCourseForm = {
  title: '',
  description: '',
  category: '',
  level: 'beginner',
  durationHours: '',
  skillsCovered: '',
  isPublished: false,
};

const StatCard = ({ label, value, accent = 'indigo' }) => {
  const accentClasses = {
    indigo: 'text-indigo-900 bg-indigo-50',
    green: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50',
  };
  return (
    <div className="card p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <span className={`inline-block mt-2 text-2xl font-semibold px-2 py-0.5 rounded-lg ${accentClasses[accent]}`}>
        {value}
      </span>
    </div>
  );
};

const EducatorDashboard = () => {
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'create' | 'courses'

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState('');

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState('');

  const [courseForm, setCourseForm] = useState(initialCourseForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoadingStudents(true);
    setStudentsError('');
    try {
      const { data } = await educatorAPI.listStudents();
      setStudents(data.students || []);
    } catch (err) {
      setStudentsError(
        err?.response?.data?.message || 'Unable to load student cohort right now.'
      );
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    setCoursesError('');
    try {
      const { data } = await educatorAPI.listMyCourses();
      setCourses(data.courses || []);
    } catch (err) {
      setCoursesError(
        err?.response?.data?.message || 'Unable to load your courses right now.'
      );
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, [fetchStudents, fetchCourses]);

  const cohortStats = useMemo(() => {
    if (students.length === 0) {
      return { total: 0, avgCompleteness: 0, avgCgpa: 'N/A' };
    }
    const total = students.length;
    const completenessSum = students.reduce(
      (sum, s) => sum + (s.profileCompleteness || 0),
      0
    );
    const cgpaValues = students.filter((s) => typeof s.cgpa === 'number').map((s) => s.cgpa);
    const avgCgpa =
      cgpaValues.length > 0
        ? (cgpaValues.reduce((sum, c) => sum + c, 0) / cgpaValues.length).toFixed(2)
        : 'N/A';

    return {
      total,
      avgCompleteness: Math.round(completenessSum / total),
      avgCgpa,
    };
  }, [students]);

  const handleCourseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCourseForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    if (!courseForm.title || !courseForm.description) {
      setCreateError('Course title and description are required.');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        title: courseForm.title,
        description: courseForm.description,
        category: courseForm.category,
        level: courseForm.level,
        durationHours: Number(courseForm.durationHours) || 0,
        skillsCovered: courseForm.skillsCovered
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        isPublished: courseForm.isPublished,
      };

      await educatorAPI.createCourse(payload);
      setCreateSuccess('Course created successfully.');
      setCourseForm(initialCourseForm);
      fetchCourses();
      setActiveTab('courses');
    } catch (err) {
      setCreateError(
        err?.response?.data?.message || 'Could not create course. Please try again.'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePublish = async (course) => {
    setTogglingId(course._id);
    try {
      await educatorAPI.updateCourse(course._id, { isPublished: !course.isPublished });
      setCourses((prev) =>
        prev.map((c) => (c._id === course._id ? { ...c, isPublished: !c.isPublished } : c))
      );
    } catch (err) {
      setCoursesError(
        err?.response?.data?.message || 'Could not update course status.'
      );
    } finally {
      setTogglingId(null);
    }
  };

  const tabs = [
    { key: 'students', label: 'Student Cohorts' },
    { key: 'create', label: 'Create Course' },
    { key: 'courses', label: 'My Courses' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Educator Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor your students and build learning content for InternSetu.
          </p>
        </div>

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

        {/* ---------- Student Cohorts ---------- */}
        {activeTab === 'students' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard label="Total Students" value={cohortStats.total} accent="indigo" />
              <StatCard
                label="Avg. Profile Completeness"
                value={`${cohortStats.avgCompleteness}%`}
                accent="amber"
              />
              <StatCard label="Avg. CGPA" value={cohortStats.avgCgpa} accent="green" />
            </div>

            <div className="card p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Your Students</h2>

              {studentsError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {studentsError}
                </div>
              )}

              {loadingStudents ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : students.length === 0 ? (
                <p className="text-sm text-slate-500 py-10 text-center">
                  No students found in your cohort yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide border-b border-slate-200">
                        <th className="py-2.5 pr-4">Name</th>
                        <th className="py-2.5 pr-4">Branch / Year</th>
                        <th className="py-2.5 pr-4">CGPA</th>
                        <th className="py-2.5 pr-4">Profile</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((s) => (
                        <tr key={s._id}>
                          <td className="py-3 pr-4">
                            <p className="font-medium text-slate-900">{s.user?.name || 'Unnamed'}</p>
                            <p className="text-xs text-slate-500">{s.user?.email}</p>
                          </td>
                          <td className="py-3 pr-4 text-slate-600">
                            {s.branch || '—'} {s.yearOfStudy ? `· Year ${s.yearOfStudy}` : ''}
                          </td>
                          <td className="py-3 pr-4 text-slate-600">{s.cgpa ?? '—'}</td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2 w-32">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full bg-indigo-900 rounded-full"
                                  style={{ width: `${s.profileCompleteness || 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500 w-9">
                                {s.profileCompleteness || 0}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ---------- Create Course ---------- */}
        {activeTab === 'create' && (
          <div className="card p-6 max-w-3xl">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Create a New Course</h2>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Course Title</label>
                <input
                  type="text"
                  name="title"
                  value={courseForm.title}
                  onChange={handleCourseChange}
                  placeholder="Introduction to Data Structures"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  name="description"
                  value={courseForm.description}
                  onChange={handleCourseChange}
                  rows={4}
                  placeholder="What will students learn in this course?"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={courseForm.category}
                    onChange={handleCourseChange}
                    placeholder="Web Development"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Level</label>
                  <select
                    name="level"
                    value={courseForm.level}
                    onChange={handleCourseChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent capitalize"
                  >
                    {LEVEL_OPTIONS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Duration (hours)</label>
                  <input
                    type="number"
                    min="0"
                    name="durationHours"
                    value={courseForm.durationHours}
                    onChange={handleCourseChange}
                    placeholder="12"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Skills Covered <span className="text-slate-400">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  name="skillsCovered"
                  value={courseForm.skillsCovered}
                  onChange={handleCourseChange}
                  placeholder="Arrays, Linked Lists, Recursion"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  name="isPublished"
                  checked={courseForm.isPublished}
                  onChange={handleCourseChange}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-900 focus:ring-indigo-900"
                />
                <label htmlFor="isPublished" className="text-sm text-slate-600">
                  Publish immediately (otherwise saved as draft)
                </label>
              </div>

              {createError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {createError}
                </div>
              )}
              {createSuccess && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                  {createSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating} className="btn-primary">
                  {creating ? 'Creating...' : 'Create Course'}
                </button>
                <button
                  type="button"
                  onClick={() => setCourseForm(initialCourseForm)}
                  className="btn-secondary"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ---------- My Courses ---------- */}
        {activeTab === 'courses' && (
          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Your Courses</h2>

            {coursesError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {coursesError}
              </div>
            )}

            {loadingCourses ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <p className="text-sm text-slate-500 py-10 text-center">
                You haven't created any courses yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {courses.map((c) => (
                  <li key={c._id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-medium text-slate-900">{c.title}</h3>
                          <span
                            className={`badge ${
                              c.isPublished
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {c.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {c.category || 'General'} · {c.level} · {c.durationHours || 0}h
                        </p>
                      </div>
                      <button
                        onClick={() => handleTogglePublish(c)}
                        disabled={togglingId === c._id}
                        className="btn-secondary shrink-0 !px-3 !py-2 text-xs"
                      >
                        {togglingId === c._id
                          ? 'Updating...'
                          : c.isPublished
                          ? 'Unpublish'
                          : 'Publish'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default EducatorDashboard;
