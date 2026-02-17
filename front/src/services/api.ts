import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',   // ← confirme que ton backend tourne sur 5000
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('API Error →', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      dataSent: error.config?.data?.password ? { ...error.config.data, password: '***' } : error.config?.data,
      message: error.response?.data?.message || error.message,
    });
    return Promise.reject(error);
  }
);

export default api;