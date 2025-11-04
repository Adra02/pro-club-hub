import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { AuthContext } from '../../contexts/AuthContext';
import { favoritesService } from '../../services/api';
import { globalStyles, colors, roleColors } from '../../styles/global';

const Tab = createMaterialTopTabNavigator();

const FavoritePlayersScreen = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  const [favoritePlayers, setFavoritePlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavoritePlayers();
  }, []);

  const loadFavoritePlayers = async () => {
    try {
      const response = await favoritesService.getFavorites();
      setFavoritePlayers(response.players || []);
    } catch (error) {
      console.error('Error loading favorite players:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavoritePlayers();
  };

  const removeFromFavorites = async (playerId) => {
    try {
      await favoritesService.removeFavorite('player', playerId);
      setFavoritePlayers(prev => prev.filter(player => player.id !== playerId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const renderPlayerCard = ({ item }) => (
    <TouchableOpacity style={globalStyles.cardElevated}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={[
            globalStyles.avatar,
            {
              backgroundColor: roleColors[item.primaryRole] || colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            },
          ]}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 16 }}>
            {item.username?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[globalStyles.text, { fontWeight: '600' }]}>{item.username}</Text>
          <Text style={globalStyles.textSecondary}>
            {t(`roles.${item.primaryRole}`)} • Livello {item.level}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 4 }}>
            <View style={globalStyles.chip}>
              <Text style={globalStyles.chipText}>
                {item.platform}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => removeFromFavorites(item.id)}
          style={{ padding: 8 }}
        >
          <Ionicons name="heart" size={24} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
        data={favoritePlayers}
        renderItem={renderPlayerCard}
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
            <Ionicons name="heart-outline" size={64} color={colors.textDisabled} />
            <Text style={globalStyles.emptyStateText}>
              Nessun giocatore nei preferiti
            </Text>
          </View>
        }
      />
    </View>
  );
};

const FavoriteTeamsScreen = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavoriteTeams();
  }, []);

  const loadFavoriteTeams = async () => {
    try {
      const response = await favoritesService.getFavorites();
      setFavoriteTeams(response.teams || []);
    } catch (error) {
      console.error('Error loading favorite teams:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavoriteTeams();
  };

  const removeFromFavorites = async (teamId) => {
    try {
      await favoritesService.removeFavorite('team', teamId);
      setFavoriteTeams(prev => prev.filter(team => team.id !== teamId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const renderTeamCard = ({ item }) => (
    <TouchableOpacity style={globalStyles.cardElevated}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
            {item.name?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[globalStyles.text, { fontWeight: '600' }]}>{item.name}</Text>
          <Text style={globalStyles.textSecondary}>
            {item.platform} • {item.members?.length || 0} membri
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 4 }}>
            <View style={globalStyles.chip}>
              <Text style={globalStyles.chipText}>
                {item.nationality}
              </Text>
            </View>
            {item.lookingForPlayers && (
              <View style={[globalStyles.chip, { backgroundColor: colors.success }]}>
                <Text style={[globalStyles.chipText, { color: colors.textPrimary }]}>
                  {t('teams.lookingForPlayers')}
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => removeFromFavorites(item.id)}
          style={{ padding: 8 }}
        >
          <Ionicons name="heart" size={24} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
        data={favoriteTeams}
        renderItem={renderTeamCard}
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
            <Ionicons name="heart-outline" size={64} color={colors.textDisabled} />
            <Text style={globalStyles.emptyStateText}>
              Nessuna squadra nei preferiti
            </Text>
          </View>
        }
      />
    </View>
  );
};

const FavoritesScreen = () => {
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
        name="FavoritePlayers" 
        component={FavoritePlayersScreen}
        options={{ title: 'Giocatori' }}
      />
      <Tab.Screen 
        name="FavoriteTeams" 
        component={FavoriteTeamsScreen}
        options={{ title: 'Squadre' }}
      />
    </Tab.Navigator>
  );
};

export default FavoritesScreen;