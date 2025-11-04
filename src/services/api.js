import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showMessage } from 'react-native-flash-message';
import { Platform } from 'react-native';

const API_BASE_URL = 'https://your-vercel-domain.vercel.app/api';

// Cache setup per performance
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Aumentato timeout
});

// Request interceptor con cache
api.interceptors.request.use(
  async (config) => {
    // Controlla cache per richieste GET
    if (config.method === 'get') {
      const cacheKey = JSON.stringify(config);
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('📦 Serving from cache:', cacheKey);
        return Promise.reject({
          __CACHED__: true,
          data: cached.data
        });
      }
    }

    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Aggiungi timestamp per evitare cache del browser
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor con gestione cache e errori
api.interceptors.response.use(
  (response) => {
    // Salva in cache le risposte GET
    if (response.config.method === 'get') {
      const cacheKey = JSON.stringify(response.config);
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    
    return response;
  },
  (error) => {
    // Gestione risposta cache
    if (error.__CACHED__) {
      return Promise.resolve({ data: error.data });
    }

    if (error.response?.status === 401) {
      AsyncStorage.removeItem('userToken');
      showMessage({
        message: 'Sessione scaduta',
        description: 'Effettua nuovamente il login',
        type: 'warning',
      });
    } else if (error.response?.status >= 500) {
      showMessage({
        message: 'Errore del server',
        description: 'Riprova più tardi',
        type: 'danger',
      });
    } else if (error.code === 'NETWORK_ERROR') {
      showMessage({
        message: 'Errore di rete',
        description: 'Controlla la connessione internet',
        type: 'danger',
      });
    }

    return Promise.reject(error);
  }
);

// Funzione per invalidare cache
export const invalidateCache = (pattern) => {
  if (pattern) {
    for (const [key] of cache.entries()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
  console.log('🗑️ Cache invalidated for:', pattern || 'all');
};

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  verifyToken: async (token) => {
    try {
      const response = await api.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.user;
    } catch (error) {
      return null;
    }
  },

  recoverPassword: async (email) => {
    try {
      const response = await api.post('/auth/recover', { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Password recovery failed');
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
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
      const response = await api.get(`/users?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  getUser: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
  },

  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  },

  uploadAvatar: async (id, imageUri) => {
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      });

      const response = await api.post(`/users/${id}/upload-avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload avatar');
    }
  },

  toggleLookingForTeam: async (id) => {
    try {
      const response = await api.patch(`/users/${id}/toggle-looking-for-team`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to toggle looking for team');
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
      const response = await api.get(`/teams?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch teams');
    }
  },

  getTeam: async (id) => {
    try {
      const response = await api.get(`/teams/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch team');
    }
  },

  createTeam: async (teamData) => {
    try {
      const response = await api.post('/teams', teamData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create team');
    }
  },

  updateTeam: async (id, teamData) => {
    try {
      const response = await api.put(`/teams/${id}`, teamData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update team');
    }
  },

  deleteTeam: async (id) => {
    try {
      const response = await api.delete(`/teams/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete team');
    }
  },

  uploadLogo: async (id, imageUri) => {
    try {
      const formData = new FormData();
      formData.append('logo', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'logo.jpg',
      });

      const response = await api.post(`/teams/${id}/upload-logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload logo');
    }
  },

  kickMember: async (id, memberId) => {
    try {
      const response = await api.post(`/teams/${id}/kick-member`, { memberId });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to kick member');
    }
  },

  leaveTeam: async (id) => {
    try {
      const response = await api.post(`/teams/${id}/leave`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to leave team');
    }
  },
};

export const requestsService = {
  getRequests: async () => {
    try {
      const response = await api.get('/requests');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch requests');
    }
  },

  sendRequest: async (requestData) => {
    try {
      const response = await api.post('/requests', requestData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send request');
    }
  },

  updateRequest: async (id, status) => {
    try {
      const response = await api.patch(`/requests/${id}`, { status });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update request');
    }
  },

  deleteRequest: async (id) => {
    try {
      const response = await api.delete(`/requests/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete request');
    }
  },
};

export const feedbackService = {
  getFeedbacks: async (userId) => {
    try {
      const response = await api.get(`/feedbacks?userId=${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch feedbacks');
    }
  },

  sendFeedback: async (feedbackData) => {
    try {
      const response = await api.post('/feedbacks', feedbackData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send feedback');
    }
  },
};

export const favoritesService = {
  getFavorites: async () => {
    try {
      const response = await api.get('/favorites');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch favorites');
    }
  },

  addFavorite: async (type, id) => {
    try {
      const response = await api.post('/favorites/add', { type, id });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add favorite');
    }
  },

  removeFavorite: async (type, id) => {
    try {
      const response = await api.delete('/favorites/remove', { data: { type, id } });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove favorite');
    }
  },
};

export const adminService = {
  getStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch stats');
    }
  },

  getUsers: async () => {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  suspendUser: async (id) => {
    try {
      const response = await api.patch(`/admin/users/${id}/suspend`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to suspend user');
    }
  },

  promoteUser: async (id) => {
    try {
      const response = await api.patch(`/admin/users/${id}/promote`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to promote user');
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  },

  getTeams: async () => {
    try {
      const response = await api.get('/admin/teams');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch teams');
    }
  },

  deleteTeam: async (id) => {
    try {
      const response = await api.delete(`/admin/teams/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete team');
    }
  },

  sendNewsletter: async (newsletterData) => {
    try {
      const response = await api.post('/admin/newsletter', newsletterData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send newsletter');
    }
  },
};

// AGGIUNTA: Servizio Notifiche Push
export const pushService = {
  registerToken: async (userId, token) => {
    try {
      const response = await api.post('/notifications/register-token', {
        userId,
        token,
        platform: Platform.OS,
      });
      return response.data;
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  },

  unregisterToken: async (userId) => {
    try {
      const response = await api.post('/notifications/unregister-token', { userId });
      return response.data;
    } catch (error) {
      console.error('Error unregistering push token:', error);
      throw error;
    }
  },
};

// AGGIUNTA: Servizio Performance
export const performanceService = {
  logAppStart: async () => {
    try {
      await api.post('/performance/app-start', {
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        version: '1.0.0',
      });
    } catch (error) {
      // Silenzioso, non blocca l'app
    }
  },

  logScreenView: async (screenName) => {
    try {
      await api.post('/performance/screen-view', {
        screenName,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Silenzioso
    }
  },
};

export default api;