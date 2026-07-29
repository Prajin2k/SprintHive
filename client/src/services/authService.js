/**
 * Auth Service — API call functions
 * All calls go through the base api instance (which has the interceptors),
 * EXCEPT refresh — that uses the single-flight raw helper so it never
 * re-enters the 401 interceptor and concurrent callers share one network call.
 */
import api from './api';
import { refreshSession } from './sessionRefresh';

const authService = {
  register: async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data; // { success, user, accessToken }
  },

  /** Uses single-flight refresh — safe under React StrictMode double-mount. */
  refresh: async () => {
    return refreshSession(); // { success, accessToken, user }
  },

  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  verifyEmail: async (token) => {
    const res = await api.get(`/auth/verify-email/${token}`);
    return res.data;
  },

  resendVerification: async (email) => {
    const res = await api.post('/auth/resend-verification', { email });
    return res.data;
  },

  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (token, data) => {
    const res = await api.post(`/auth/reset-password/${token}`, data);
    return res.data;
  },

  changePassword: async (data) => {
    const res = await api.post('/auth/change-password', data);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  updateMe: async (data) => {
    const res = await api.patch('/auth/me', data);
    return res.data;
  },

  uploadAvatar: async (formData) => {
    const res = await api.post('/auth/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export default authService;
