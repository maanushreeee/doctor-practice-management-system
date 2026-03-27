import axios from 'axios';

const apiBaseUrl = ('http://localhost:8000');

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// attach token to every request automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// handle token expiry globally
api.interceptors.response.use(
  (response) => {
    console.log(`[API Success] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[Auth Error] Token expired or invalid - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      window.location.href = '/login/patient';
    } else {
      console.error(`[API Error] ${error.response?.status || 'Network Error'} - ${error.message}`);
    }
    return Promise.reject(error);
  }
);

export default api;
