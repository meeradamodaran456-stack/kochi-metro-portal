import axios from 'axios';

const client = axios.create({
  // Hardcoded correct Railway URL for universal sync
  baseURL: 'https://kochi-metro-portal-production-f4d3.up.railway.app/api',
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
