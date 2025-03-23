// src/api/index.js
import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
  timeout: 60000, // 30 seconds timeout
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wku_cms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error information for debugging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error data:', error.response.data);
      console.error('Response error status:', error.response.status);
      console.error('Response error headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser
      console.error('Request error (no response):', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    console.error('Error config:', error.config);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.removeItem('wku_cms_token');
      localStorage.removeItem('wku_cms_user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;