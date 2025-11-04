import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { usersService } from '../services/api';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Carica notifiche dal localStorage
  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('userNotifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        updateUnreadCount(parsed);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Salva notifiche nel localStorage
  const saveNotifications = async (newNotifications) => {
    try {
      await AsyncStorage.setItem('userNotifications', JSON.stringify(newNotifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  // Aggiungi notifica
  const addNotification = async (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      read: false,
      createdAt: new Date().toISOString(),
    };

    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    await saveNotifications(updatedNotifications);
    updateUnreadCount(updatedNotifications);

    // Mostra notifica push
    await schedulePushNotification(newNotification);
  };

  // Segna come letta
  const markAsRead = async (notificationId) => {
    const updatedNotifications = notifications.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    
    setNotifications(updatedNotifications);
    await saveNotifications(updatedNotifications);
    updateUnreadCount(updatedNotifications);
  };

  // Segna tutte come lette
  const markAllAsRead = async () => {
    const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
    
    setNotifications(updatedNotifications);
    await saveNotifications(updatedNotifications);
    setUnreadCount(0);
  };

  // Elimina notifica
  const deleteNotification = async (notificationId) => {
    const updatedNotifications = notifications.filter(notif => notif.id !== notificationId);
    
    setNotifications(updatedNotifications);
    await saveNotifications(updatedNotifications);
    updateUnreadCount(updatedNotifications);
  };

  // Aggiorna contatore non lette
  const updateUnreadCount = (notifs) => {
    const count = notifs.filter(notif => !notif.read).length;
    setUnreadCount(count);
  };

  // Inizializza
  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        loadNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Funzione per notifiche push
async function schedulePushNotification(notification) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.message,
      data: notification.data,
      sound: 'default',
      badge: 1,
    },
    trigger: null, // Immediato
  });
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};