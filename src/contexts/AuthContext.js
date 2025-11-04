import React, { createContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, pushService, performanceService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children, expoPushToken }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
    performanceService.logAppStart();
  }, []);

  useEffect(() => {
    if (user && expoPushToken) {
      registerPushToken();
    }
  }, [user, expoPushToken]);

  const checkAuthState = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verifica token in background
        verifyTokenInBackground(storedToken);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTokenInBackground = async (storedToken) => {
    try {
      const userData = await authService.verifyToken(storedToken);
      if (!userData) {
        await logout();
      }
    } catch (error) {
      // Silenzioso, non mostrare errori
    }
  };

  const registerPushToken = async () => {
    if (!expoPushToken || !user) return;
    
    try {
      await pushService.registerToken(user.id, expoPushToken);
      console.log('📱 Push token registrato');
    } catch (error) {
      console.error('Errore registrazione push token:', error);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      if (response.success) {
        setUser(response.user);
        setToken(response.token);
        
        await AsyncStorage.setItem('userToken', response.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.user));
        
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      if (user && expoPushToken) {
        await pushService.unregisterToken(user.id);
      }
      
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUser = async (updatedUser) => {
    try {
      setUser(updatedUser);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating user in context:', error);
    }
  };

  const refreshUserData = async () => {
    if (!user) return;
    
    try {
      const userData = await authService.verifyToken(token);
      if (userData) {
        updateUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};