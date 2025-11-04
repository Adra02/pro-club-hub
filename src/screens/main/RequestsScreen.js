import React, { useState, useEffect, useContext } from 'react';
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
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { AuthContext } from '../../contexts/AuthContext';
import { requestsService } from '../../services/api';
import { globalStyles, colors } from '../../styles/global';
import { formatDateTime } from '../../utils/helpers';

const Tab = createMaterialTopTabNavigator();

const ReceivedRequestsScreen = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  const [receivedRequests, setReceivedRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReceivedRequests();
  }, []);

  const loadReceivedRequests = async () => {
    try {
      const response = await requestsService.getRequests();
      setReceivedRequests(response.received || []);
    } catch (error) {
      console.error('Error loading received requests:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReceivedRequests();
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      await requestsService.updateRequest(requestId, action);
      
      // Update local state
      setReceivedRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: action }
            : req
        )
      );

      Alert.alert(
        'Successo',
        action === 'accepted' ? 'Richiesta accettata' : 'Richiesta rifiutata'
      );
    } catch (error) {
      console.error('Error updating request:', error);
      Alert.alert('Errore', 'Impossibile aggiornare la richiesta');
    }
  };

  const renderRequestCard = ({ item }) => (
    <View style={globalStyles.cardElevated}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View
          style={[
            globalStyles.avatar,
            {
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            },
          ]}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 16 }}>
            {item.fromUser?.username?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={[globalStyles.text, { fontWeight: '600' }]}>
                {item.fromUser?.username || 'Utente sconosciuto'}
              </Text>
              <Text style={globalStyles.textSecondary}>
                {item.type === 'player_to_team' ? 'Vuole unirsi alla tua squadra' : 'Ti vuole nella sua squadra'}
              </Text>
              
              {item.message && (
                <Text style={[globalStyles.text, { marginTop: 8, fontStyle: 'italic' }]}>
                  "{item.message}"
                </Text>
              )}
            </View>

            <Text style={globalStyles.textSmall}>
              {formatDateTime(item.createdAt)}
            </Text>
          </View>

          {item.status === 'pending' && (
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity
                style={[globalStyles.button, { flex: 1, marginRight: 8, paddingVertical: 8 }]}
                onPress={() => handleRequestAction(item.id, 'accepted')}
              >
                <Text style={globalStyles.buttonText}>Accetta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.buttonDanger, { flex: 1, paddingVertical: 8 }]}
                onPress={() => handleRequestAction(item.id, 'rejected')}
              >
                <Text style={globalStyles.buttonDangerText}>Rifiuta</Text>
              </TouchableOpacity>
            </View>
          )}

          {item.status !== 'pending' && (
            <View
              style={[
                globalStyles.chip,
                { 
                  alignSelf: 'flex-start',
                  backgroundColor: item.status === 'accepted' ? colors.success : colors.danger,
                  marginTop: 8,
                },
              ]}
            >
              <Text style={[globalStyles.chipText, { color: colors.textPrimary }]}>
                {item.status === 'accepted' ? 'Accettata' : 'Rifiutata'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.text}>Caricamento...</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <FlatList
        data={receivedRequests}
        renderItem={renderRequestCard}
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
            <Ionicons name="mail-open-outline" size={64} color={colors.textDisabled} />
            <Text style={globalStyles.emptyStateText}>
              Nessuna richiesta ricevuta
            </Text>
          </View>
        }
      />
    </View>
  );
};

const SentRequestsScreen = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  const [sentRequests, setSentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSentRequests();
  }, []);

  const loadSentRequests = async () => {
    try {
      const response = await requestsService.getRequests();
      setSentRequests(response.sent || []);
    } catch (error) {
      console.error('Error loading sent requests:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSentRequests();
  };

  const cancelRequest = async (requestId) => {
    try {
      await requestsService.deleteRequest(requestId);
      setSentRequests(prev => prev.filter(req => req.id !== requestId));
      Alert.alert('Successo', 'Richiesta cancellata');
    } catch (error) {
      console.error('Error cancelling request:', error);
      Alert.alert('Errore', 'Impossibile cancellare la richiesta');
    }
  };

  const renderRequestCard = ({ item }) => (
    <View style={globalStyles.cardElevated}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View
          style={[
            globalStyles.avatar,
            {
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            },
          ]}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 16 }}>
            {item.toTeam?.name?.charAt(0).toUpperCase() || item.toUser?.username?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={[globalStyles.text, { fontWeight: '600' }]}>
                {item.toTeam?.name || item.toUser?.username || 'Destinatario sconosciuto'}
              </Text>
              <Text style={globalStyles.textSecondary}>
                {item.type === 'player_to_team' ? 'Richiesta di unione alla squadra' : 'Richiesta al giocatore'}
              </Text>
              
              {item.message && (
                <Text style={[globalStyles.text, { marginTop: 8, fontStyle: 'italic' }]}>
                  "{item.message}"
                </Text>
              )}
            </View>

            <Text style={globalStyles.textSmall}>
              {formatDateTime(item.createdAt)}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <View
              style={[
                globalStyles.chip,
                { 
                  backgroundColor: 
                    item.status === 'pending' ? colors.warning :
                    item.status === 'accepted' ? colors.success : colors.danger,
                },
              ]}
            >
              <Text style={[globalStyles.chipText, { color: colors.textPrimary }]}>
                {item.status === 'pending' ? 'In attesa' :
                 item.status === 'accepted' ? 'Accettata' : 'Rifiutata'}
              </Text>
            </View>

            {item.status === 'pending' && (
              <TouchableOpacity
                onPress={() => cancelRequest(item.id)}
                style={{ padding: 4 }}
              >
                <Text style={[globalStyles.textSecondary, { color: colors.danger }]}>
                  Annulla
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.text}>Caricamento...</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <FlatList
        data={sentRequests}
        renderItem={renderRequestCard}
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
            <Ionicons name="send-outline" size={64} color={colors.textDisabled} />
            <Text style={globalStyles.emptyStateText}>
              Nessuna richiesta inviata
            </Text>
          </View>
        }
      />
    </View>
  );
};

const RequestsScreen = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIndicatorStyle: {
          backgroundColor: colors.primary,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          textTransform: 'none',
        },
      }}
    >
      <Tab.Screen 
        name="ReceivedRequests" 
        component={ReceivedRequestsScreen}
        options={{ title: 'Ricevute' }}
      />
      <Tab.Screen 
        name="SentRequests" 
        component={SentRequestsScreen}
        options={{ title: 'Inviate' }}
      />
    </Tab.Navigator>
  );
};

export default RequestsScreen;