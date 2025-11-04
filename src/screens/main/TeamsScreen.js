import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from '../../contexts/AuthContext';
import { teamsService } from '../../services/api';
import { globalStyles, colors } from '../../styles/global';
import { PLATFORMS, NATIONALITIES } from '../../utils/constants';

const TeamsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    platform: '',
    nationality: '',
    lookingForPlayers: false,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [teams, searchQuery, filters]);

  const loadTeams = async () => {
    try {
      const response = await teamsService.getTeams();
      setTeams(response.teams || []);
    } catch (error) {
      console.error('Error loading teams:', error);
      Alert.alert('Errore', 'Impossibile caricare le squadre');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTeams();
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...teams];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(team =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (filters.platform) {
      filtered = filtered.filter(team => team.platform === filters.platform);
    }
    if (filters.nationality) {
      filtered = filtered.filter(team => team.nationality === filters.nationality);
    }
    if (filters.lookingForPlayers) {
      filtered = filtered.filter(team => team.lookingForPlayers);
    }

    setFilteredTeams(filtered);
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
      nationality: '',
      lookingForPlayers: false,
    });
    setSearchQuery('');
  };

  const canCreateTeam = user?.profileCompleted && !user?.team;

  const handleCreateTeam = () => {
    if (!user.profileCompleted) {
      Alert.alert(
        'Profilo Incompleto',
        'Completa il tuo profilo prima di creare una squadra',
        [
          { text: 'Annulla' },
          { 
            text: 'Completa Profilo', 
            onPress: () => navigation.navigate('EditProfile') 
          }
        ]
      );
      return;
    }
    if (user.team) {
      Alert.alert('Errore', 'Sei già in una squadra');
      return;
    }
    navigation.navigate('CreateTeam');
  };

  const renderTeamCard = ({ item }) => (
    <TouchableOpacity
      style={globalStyles.cardElevated}
      onPress={() => navigation.navigate('TeamDetail', { teamId: item.id })}
    >
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[globalStyles.text, { fontWeight: '600' }]}>{item.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="star" size={16} color={colors.warning} />
              <Text style={[globalStyles.text, { marginLeft: 4 }]}>{item.averageRating || 'N/A'}</Text>
            </View>
          </View>

          <Text style={globalStyles.textSecondary}>
            {item.platform} • {item.members?.length || 0} membri
          </Text>

          {item.description && (
            <Text 
              style={[globalStyles.textSecondary, { marginTop: 4 }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}

          <View style={{ flexDirection: 'row', marginTop: 8 }}>
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
          placeholder="Cerca squadre..."
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

          <Text style={globalStyles.label}>Cercano giocatori</Text>
          <View style={globalStyles.filterContainer}>
            <TouchableOpacity
              style={[
                globalStyles.filterChip,
                filters.lookingForPlayers && globalStyles.filterChipActive,
              ]}
              onPress={() => setFilters(prev => ({ ...prev, lookingForPlayers: !prev.lookingForPlayers }))}
            >
              <Text
                style={[
                  globalStyles.filterChipText,
                  filters.lookingForPlayers && globalStyles.filterChipTextActive,
                ]}
              >
                {t('teams.lookingForPlayers')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Teams List */}
      <FlatList
        data={filteredTeams}
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
            <Ionicons name="shield-outline" size={64} color={colors.textDisabled} />
            <Text style={globalStyles.emptyStateText}>
              {teams.length === 0 
                ? 'Nessuna squadra trovata' 
                : 'Nessuna squadra corrisponde ai filtri'
              }
            </Text>
          </View>
        }
      />

      {/* Create Team FAB */}
      {canCreateTeam && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            backgroundColor: colors.primary,
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
          onPress={handleCreateTeam}
        >
          <Ionicons name="add" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default TeamsScreen;