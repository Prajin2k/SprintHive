/**
 * Axios base instance — no interceptors here.
 * Interceptors are configured in store/axiosSetup.js after the Redux store is ready.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,  // sends httpOnly refresh token cookie
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

export default api;
