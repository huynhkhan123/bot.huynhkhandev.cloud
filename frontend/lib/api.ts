import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // sends httpOnly cookie automatically
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

// Attach access token to every request
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await api.post('/auth/refresh');
        const newToken = res.data.accessToken;
        setAccessToken(newToken);
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        setAccessToken(null);
        refreshQueue = [];
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ── Auth API ──────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post('/auth/register', data),

  login: async (data: { email: string; password: string }) => {
    const res = await api.post('/auth/login', data);
    setAccessToken(res.data.accessToken);
    return res.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    setAccessToken(null);
  },

  me: () => api.get('/auth/me').then((r) => r.data),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

// ── Chat API ─────────────────────────────────────────────────────
export const chatApi = {
  send: (data: { content: string; conversationId?: string; modelName?: string; provider?: string }) =>
    api.post('/chat/send', data).then((r) => r.data),
};

// ── Conversations API ────────────────────────────────────────────
export const conversationsApi = {
  list: () => api.get('/conversations').then((r) => r.data),
  getMessages: (id: string) => api.get(`/conversations/${id}/messages`).then((r) => r.data),
  delete: (id: string) => api.delete(`/conversations/${id}`).then((r) => r.data),
};

// ── Admin API ────────────────────────────────────────────────────
export const adminApi = {
  listUsers: (page = 1, limit = 20, search?: string) =>
    api.get('/admin/users', { params: { page, limit, search } }).then((r) => r.data),
  updateUserStatus: (id: string, isActive: boolean) =>
    api.patch(`/admin/users/${id}/status`, { isActive }).then((r) => r.data),
  getStats: () => api.get('/admin/stats').then((r) => r.data),
};

export default api;
