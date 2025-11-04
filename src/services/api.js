import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ⚠️ IMPORTANTE: Sostituisci con il TUO URL Vercel dopo il deploy!
const API_BASE_URL = 'https://your-vercel-url.vercel.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  verifyToken: async (token) => {
    try {
      const response = await api.get('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.user;
    } catch (error) {
      return null;
    }
  },

  recoverPassword: async (email) => {
    try {
      const response = await api.post('/api/auth/recover', { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Password recovery failed');
    }
  },
};

export const usersService = {
  getUsers: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      const response = await api.get(`/api/users?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  getUser: async (id) => {
    try {
      const response = await api.get(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
  },

  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/api/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  },

  toggleLookingForTeam: async (id) => {
    try {
      const response = await api.patch(`/api/users/${id}/toggle-looking-for-team`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to toggle');
    }
  },
};

export const teamsService = {
  getTeams: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      const response = await api.get(`/api/teams?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch teams');
    }
  },

  getTeam: async (id) => {
    try {
      const response = await api.get(`/api/teams/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch team');
    }
  },

  createTeam: async (teamData) => {
    try {
      const response = await api.post('/api/teams', teamData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create team');
    }
  },

  updateTeam: async (id, teamData) => {
    try {
      const response = await api.put(`/api/teams/${id}`, teamData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update team');
    }
  },

  deleteTeam: async (id) => {
    try {
      const response = await api.delete(`/api/teams/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete team');
    }
  },

  kickMember: async (id, memberId) => {
    try {
      const response = await api.post(`/api/teams/${id}/kick-member`, { memberId });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to kick member');
    }
  },

  leaveTeam: async (id) => {
    try {
      const response = await api.post(`/api/teams/${id}/leave`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to leave team');
    }
  },
};

export const requestsService = {
  getRequests: async () => {
    try {
      const response = await api.get('/api/requests');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch requests');
    }
  },

  sendRequest: async (requestData) => {
    try {
      const response = await api.post('/api/requests', requestData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send request');
    }
  },

  updateRequest: async (id, status) => {
    try {
      const response = await api.patch(`/api/requests/${id}`, { status });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update request');
    }
  },

  deleteRequest: async (id) => {
    try {
      const response = await api.delete(`/api/requests/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete request');
    }
  },
};

export const feedbackService = {
  getFeedbacks: async (userId) => {
    try {
      const response = await api.get(`/api/feedbacks?userId=${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch feedbacks');
    }
  },

  sendFeedback: async (feedbackData) => {
    try {
      const response = await api.post('/api/feedbacks', feedbackData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send feedback');
    }
  },
};

export const favoritesService = {
  getFavorites: async () => {
    try {
      const response = await api.get('/api/favorites');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch favorites');
    }
  },

  addFavorite: async (type, id) => {
    try {
      const response = await api.post('/api/favorites/add', { type, id });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add favorite');
    }
  },

  removeFavorite: async (type, id) => {
    try {
      const response = await api.delete('/api/favorites/remove', { data: { type, id } });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove favorite');
    }
  },
};

export const adminService = {
  getStats: async () => {
    try {
      const response = await api.get('/api/admin/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch stats');
    }
  },
};

export default api;
