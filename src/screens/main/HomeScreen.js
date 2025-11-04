import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from '../../contexts/AuthContext';
import { usersService } from '../../services/api';
import { globalStyles, colors, roleColors } from '../../styles/global';
import { filterPlayers, sortPlayers } from '../../utils/helpers';
import { ROLES, PLATFORMS, NATIONALITIES } from '../../utils/constants';

const HomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    platform: '',
    role: '',
    nationality: '',
    lookingForTeam: undefined,
    minLevel: '',
    maxLevel: '',
  });
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [players, searchQuery, filters, sortBy]);

  const loadPlayers = async () => {
    try {
      const response = await usersService.getUsers();
      setPlayers(response.users || []);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPlayers();
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...players];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(player =>
        player.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    filtered = filterPlayers(filtered, filters);

    // Apply sorting
    filtered = sortPlayers(filtered, sortBy);

    setFilteredPlayers(filtered);
  };

  const toggleFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? '' : value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      platform: '',
      role: '',
      nationality: '',
      lookingForTeam: undefined,
      minLevel: '',
      maxLevel: '',
    });
    setSearchQuery('');
  };

  const renderPlayerCard = ({ item }) => (
    <TouchableOpacity
      style={globalStyles.cardElevated}
      onPress={() => navigation.navigate('PlayerDetail', { playerId: item.id })}
    >
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[globalStyles.text, { fontWeight: '600' }]}>{item.username}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="star" size={16} color={colors.warning} />
              <Text style={[globalStyles.text, { marginLeft: 4 }]}>{item.averageRating || 'N/A'}</Text>
            </View>
          </View>

          <Text style={globalStyles.textSecondary}>
            {t(`roles.${item.primaryRole}`)} • Livello {item.level}
          </Text>

          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <View style={globalStyles.chip}>
              <Text style={globalStyles.chipText}>
                {item.platform}
              </Text>
            </View>
            {item.lookingForTeam && (
              <View style={[globalStyles.chip, { backgroundColor: colors.success }]}>
                <Text style={[globalStyles.chipText, { color: colors.textPrimary }]}>
                  {t('players.lookingForTeam')}
                </Text>
              </View>
            )}
          </View>
        </View>
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
      {/* Search Bar */}
      <View style={[globalStyles.searchBar, { margin: 16 }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={globalStyles.searchInput}
          placeholder="Cerca giocatori..."
          placeholderTextColor={colors.textDisabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <Ionicons 
            name="filter" 
            size={20} 
            color={showFilters ? colors.primary : colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={{ padding: 16, paddingTop: 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={globalStyles.subheader}>Filtri</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={[globalStyles.textSecondary, { color: colors.primary }]}>
                Pulisci
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={globalStyles.label}>Piattaforma</Text>
          <View style={globalStyles.filterContainer}>
            {PLATFORMS.map(platform => (
              <TouchableOpacity
                key={platform}
                style={[
                  globalStyles.filterChip,
                  filters.platform === platform && globalStyles.filterChipActive,
                ]}
                onPress={() => toggleFilter('platform', platform)}
              >
                <Text
                  style={[
                    globalStyles.filterChipText,
                    filters.platform === platform && globalStyles.filterChipTextActive,
                  ]}
                >
                  {platform}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={globalStyles.label}>Ruolo</Text>
          <View style={globalStyles.filterContainer}>
            {ROLES.slice(0, 6).map(role => (
              <TouchableOpacity
                key={role}
                style={[
                  globalStyles.filterChip,
                  filters.role === role && globalStyles.filterChipActive,
                ]}
                onPress={() => toggleFilter('role', role)}
              >
                <Text
                  style={[
                    globalStyles.filterChipText,
                    filters.role === role && globalStyles.filterChipTextActive,
                  ]}
                >
                  {t(`roles.${role}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={globalStyles.label}>Stato</Text>
          <View style={globalStyles.filterContainer}>
            <TouchableOpacity
              style={[
                globalStyles.filterChip,
                filters.lookingForTeam === true && globalStyles.filterChipActive,
              ]}
              onPress={() => toggleFilter('lookingForTeam', true)}
            >
              <Text
                style={[
                  globalStyles.filterChipText,
                  filters.lookingForTeam === true && globalStyles.filterChipTextActive,
                ]}
              >
                {t('players.lookingForTeam')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Players List */}
      <FlatList
        data={filteredPlayers}
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
            <Ionicons name="people-outline" size={64} color={colors.textDisabled} />
            <Text style={globalStyles.emptyStateText}>
              {players.length === 0 
                ? 'Nessun giocatore trovato' 
                : 'Nessun giocatore corrisponde ai filtri'
              }
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default HomeScreen;