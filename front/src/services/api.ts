import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,           // ← évite les attentes infinies
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If sending FormData (multipart), remove Content-Type so browser sets the boundary automatically
    if (config.data instanceof FormData) {
      if (config.headers && 'Content-Type' in config.headers) {
        delete config.headers['Content-Type'];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse utile pour debug
api.interceptors.response.use(
  response => response,
  error => {
    console.error('Erreur API :', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;