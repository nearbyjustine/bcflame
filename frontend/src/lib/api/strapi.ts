import axios from 'axios';
import Cookies from 'js-cookie';

export const strapiApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT to all requests
strapiApi.interceptors.request.use(
  (config) => {
    const token = Cookies.get('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
strapiApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('jwt');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
