import axios from 'axios';

/** Same origin as all axios calls — import this anywhere you need the raw API base (e.g. export link). */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://kochi-metro-portal-production-f4d3.up.railway.app/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('km_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally → redirect to login
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('km_token');
      localStorage.removeItem('km_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
