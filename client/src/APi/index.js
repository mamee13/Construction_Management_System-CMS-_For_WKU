

import axios from 'axios';

// Create axios instance with default config.
// We no longer set a fixed 'Content-Type' header here so it can be defined per request.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Important for CORS with credentials
  timeout: 60000, // 60 seconds timeout
});

// Request interceptor for adding auth token and handling Content-Type for FormData
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('wku_cms_token');
    if (token) {
      console.log('Token found, attaching to header.');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No token found in localStorage.');
    }

    // If the request data is FormData, remove Content-Type header so browser sets it correctly.
    if (config.data instanceof FormData) {
      // Remove the Content-Type header to let the browser add the correct boundary.
      delete config.headers['Content-Type'];
    } else {
      // For non-FormData requests, set Content-Type to application/json if not set.
      config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
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
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response error status:', error.response.status);
      console.error('Response error headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request error (no response):', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    console.error('Error config:', error.config);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('wku_cms_token');
      localStorage.removeItem('wku_cms_user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;
