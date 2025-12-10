import api from './api';

const authService = {
  // Register new user
  register: async (email, password, fullName) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed',
      };
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { access_token } = response.data;

      // Store token
      localStorage.setItem('token', access_token);

      // Get user info
      const userInfo = await authService.getCurrentUser();

      return { success: true, data: userInfo.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      };
    }
  },

  // Get current user info
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      
      // Store user info
      localStorage.setItem('user', JSON.stringify(response.data));
      
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get user info',
      };
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get stored user
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export default authService;