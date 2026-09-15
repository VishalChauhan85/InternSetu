import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------- Request Interceptor: attach JWT ----------
api.interceptors.request.use(
  (config) => {
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
      // Token invalid/expired — clear session and redirect to login
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
  getApplicants: (opportunityId) =>
    api.get(`/industry/opportunities/${opportunityId}/applicants`),
  updateApplicantStatus: (opportunityId, studentId, status) =>
    api.put(`/industry/opportunities/${opportunityId}/applicants/${studentId}`, {
      status,
    }),
};

export const educatorAPI = {
  listStudents: (params) => api.get('/educator/students', { params }),
  createCourse: (payload) => api.post('/educator/courses', payload),
  listMyCourses: () => api.get('/educator/courses'),
  updateCourse: (id, payload) => api.put(`/educator/courses/${id}`, payload),
};

export const aiAPI = {
  analyzeResume: (payload) => api.post('/ai/resume-analysis', payload),
  suggestSkillGap: (payload) => api.post('/ai/skill-gap', payload),
  chat: (payload) => api.post('/ai/chat', payload),
  evaluateInterview: (payload) => api.post('/ai/evaluate-interview', payload),
};

export default api;
