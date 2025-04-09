// src/api/auth.js
import api from './index';

const authAPI = {
  /**
   * Login user with email and password
   * @param {Object} credentials - User credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise} - Response with token and user data
   */
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Store token and user data in localStorage
      if (response.data.success && response.data.token) {
        localStorage.setItem('wku_cms_token', response.data.token);
        localStorage.setItem('wku_cms_user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the server. Please check your internet connection or contact support.');
      }
      throw error.response ? error.response.data : error;
    }
  },

  getToken: () => {
    return localStorage.getItem('wku_cms_token');
  },
  /**
   * Register a new user (Admin only)
   * @param {Object} userData - New user data
   * @returns {Promise} - Response with created user data
   */
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the server. Please check your internet connection or contact support.');
      }
      throw error.response ? error.response.data : error;
    }
  },
  
  // Other methods remain the same...
  logout: () => {
    localStorage.removeItem('wku_cms_token');
    localStorage.removeItem('wku_cms_user');
    window.location.href = '/login';
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('wku_cms_user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('wku_cms_token');
  },
  
  hasRole: (role) => {
    const user = authAPI.getCurrentUser();
    return user ? user.role === role : false;
  },
  
  isAdmin: () => {
    return authAPI.hasRole('admin');
  }
};

export default authAPI;