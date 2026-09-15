import axios from 'axios';

/**
 * ---------------------------------------------------------------------------
 * API base URL resolution
 * ---------------------------------------------------------------------------
 * VITE_API_BASE_URL should normally be set on Vercel to something like:
 *   https://internsetu-backend.onrender.com/api
 *
 * If it's ever misconfigured (e.g. someone sets it to just the bare Render
 * domain without the `/api` suffix), the request interceptor below detects
 * that and repairs every outgoing request path — so the app degrades
 * gracefully instead of throwing "Route not found" 404s in production.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Allows cookies to flow if the backend ever needs them; harmless for pure
  // JWT-header auth, but keeps credentialed CORS requests working either way.
  withCredentials: true,
});

// ---------- Request Interceptor ----------
api.interceptors.request.use(
  (config) => {
    // --- 1. Guarantee the `/api` prefix on every relative request URL ---
    // This is the actual fix for "Route /auth/register not found": it
    // protects us even if `baseURL` was configured WITHOUT the `/api`
    // suffix on Vercel. Absolute URLs (http://...) are left untouched.
    if (config.url && !/^https?:\/\//i.test(config.url)) {
      const baseHasApiSuffix = /\/api\/?$/.test(config.baseURL || '');
      const urlAlreadyHasApiPrefix = /^\/?api(\/|$)/.test(config.url);

      if (!baseHasApiSuffix && !urlAlreadyHasApiPrefix) {
        const cleanPath = config.url.startsWith('/') ? config.url : `/${config.url}`;
        config.url = `/api${cleanPath}`;
      }
    }

    // --- 2. Attach the JWT, if we have one ---
    const token = localStorage.getItem('internsetu_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- Response Interceptor: handle auth errors globally ----------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      localStorage.removeItem('internsetu_token');
      localStorage.removeItem('internsetu_user');

      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }

    return Promise.reject(error);
  }
);

// ---------- Convenience API groups ----------

export const authAPI = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  // One-time ops helper — call manually (curl/Postman) with the
  // ADMIN_SEED_SECRET header. Intentionally NOT wired to any UI button.
  seedAdmin: (seedSecret) =>
    api.post('/auth/seed-admin', {}, { headers: { 'x-seed-secret': seedSecret } }),
};

export const adminAPI = {
  createUser: (payload) => api.post('/auth/admin/create-user', payload),
};

export const studentAPI = {
  getProfile: () => api.get('/student/profile'),
  updateProfile: (payload) => api.put('/student/profile', payload),
  getDashboard: () => api.get('/student/dashboard'),
  listOpportunities: (params) => api.get('/student/opportunities', { params }),
  applyToOpportunity: (id) => api.post(`/student/opportunities/${id}/apply`),
  getProgress: () => api.get('/student/progress'),
  listCourses: (params) => api.get('/student/courses', { params }),
};

export const industryAPI = {
  listMyOpportunities: () => api.get('/industry/opportunities'),
  createOpportunity: (payload) => api.post('/industry/opportunities', payload),
  updateOpportunity: (id, payload) => api.put(`/industry/opportunities/${id}`, payload),
  getApplicants: (opportunityId) => api.get(`/industry/opportunities/${opportunityId}/applicants`),
  updateApplicantStatus: (opportunityId, studentId, status) =>
    api.patch(`/industry/opportunities/${opportunityId}/applicants/${studentId}`, { status }),
};

export const educatorAPI = {
  listStudents: () => api.get('/educator/students'),
  getStudentDetail: (id) => api.get(`/educator/students/${id}`),
  listMyCourses: () => api.get('/educator/courses'),
  createCourse: (payload) => api.post('/educator/courses', payload),
  updateCourse: (courseId, payload) => api.put(`/educator/courses/${courseId}`, payload),
  deleteCourse: (courseId) => api.delete(`/educator/courses/${courseId}`),
};

export const aiAPI = {
  analyzeResume: (payload) => api.post('/ai/resume-analysis', payload),
  suggestSkillGap: (payload) => api.post('/ai/skill-gap', payload),
  chat: (payload) => api.post('/ai/chat', payload),
  evaluateInterview: (payload) => api.post('/ai/mock-interview/evaluate', payload),
};

export default api;
