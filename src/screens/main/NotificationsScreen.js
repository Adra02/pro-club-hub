import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useNotification } from '../../contexts/NotificationContext';
import { globalStyles, colors } from '../../styles/global';
import { formatDateTime } from '../../utils/helpers';

const NotificationsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadNotifications,
  } = useNotification();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification) => {
    // Segna come letta
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Naviga in base al tipo di notifica
    switch (notification.type) {
      case 'new_request':
        navigation.navigate('Requests');
        break;
      case 'request_accepted':
        navigation.navigate('Teams');
        break;
      case 'new_feedback':
        navigation.navigate('Profile');
        break;
      case 'team_invite':
        navigation.navigate('Requests');
        break;
      default:
        // Nessuna navigazione specifica
        break;
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Elimina Tutte',
      'Sei sicuro di voler eliminare tutte le notifiche?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            notifications.forEach(async (notif) => {
              await deleteNotification(notif.id);
            });
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_request':
        return 'mail';
      case 'request_accepted':
        return 'checkmark-circle';
      case 'new_feedback':
        return 'star';
      case 'team_invite':
        return 'shield';
      case 'login_success':
        return 'log-in';
      case 'registration_success':
        return 'person-add';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_request':
        return colors.primary;
      case 'request_accepted':
        return colors.success;
      case 'new_feedback':
        return colors.warning;
      case 'team_invite':
        return colors.secondary;
      default:
        return colors.textSecondary;
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        globalStyles.card,
        { 
          opacity: item.read ? 0.7 : 1,
          borderLeftWidth: 4,
          borderLeftColor: getNotificationColor(item.type),
        },
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ marginRight: 12 }}>
          <Ionicons 
            name={getNotificationIcon(item.type)} 
            size={24} 
            color={getNotificationColor(item.type)} 
          />
          {!item.read && (
            <View style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: colors.danger,
            }} />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[globalStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
            {item.title}
          </Text>
          <Text style={globalStyles.textSecondary}>
            {item.message}
          </Text>
          <Text style={[globalStyles.textSmall, { marginTop: 8 }]}>
            {formatDateTime(item.createdAt)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => deleteNotification(item.id)}
          style={{ padding: 4 }}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={globalStyles.container}>
      {/* Header con azioni */}
      <View style={[globalStyles.card, { margin: 16 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={globalStyles.subheader}>Notifiche</Text>
            <Text style={globalStyles.textSecondary}>
              {unreadCount} non lette
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row' }}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={{ marginRight: 16 }}
                onPress={markAllAsRead}
              >
                <Ionicons name="checkmark-done" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
            
            {notifications.length > 0 && (
              <TouchableOpacity onPress={handleDeleteAll}>
                <Ionicons name="trash" size={24} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Lista notifiche */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={globalStyles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textDisabled} />
            <Text style={globalStyles.emptyStateText}>
              Nessuna notifica
            </Text>
            <Text style={[globalStyles.emptyStateText, { marginTop: 8 }]}>
              Le tue notifiche appariranno qui
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default NotificationsScreen;