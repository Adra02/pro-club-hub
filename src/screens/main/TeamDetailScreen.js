import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

import { AuthContext } from '../../contexts/AuthContext';
import { teamsService, requestsService, favoritesService, usersService } from '../../services/api';
import { globalStyles, colors } from '../../styles/global';
import { formatDate } from '../../utils/helpers';

const TeamDetailScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const route = useRoute();
  const { user } = useContext(AuthContext);
  
  const { teamId } = route.params;
  
  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [showManageModal, setShowManageModal] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      const [teamResponse, favoritesResponse] = await Promise.all([
        teamsService.getTeam(teamId),
        favoritesService.getFavorites(),
      ]);
      
      setTeam(teamResponse.team);
      setIsFavorite(favoritesResponse.teams?.some(t => t.id === teamId) || false);
      
      // Load team members details
      if (teamResponse.team.members && teamResponse.team.members.length > 0) {
        const membersPromises = teamResponse.team.members.map(memberId => 
          usersService.getUser(memberId)
        );
        const membersResponses = await Promise.all(membersPromises);
        setTeamMembers(membersResponses.map(res => res.user));
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      Alert.alert('Errore', 'Impossibile caricare i dati della squadra');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTeamData();
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await favoritesService.removeFavorite('team', teamId);
        setIsFavorite(false);
      } else {
        await favoritesService.addFavorite('team', teamId);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Errore', 'Impossibile aggiornare i preferiti');
    }
  };

  const sendRequest = async () => {
    if (user.team) {
      Alert.alert('Errore', 'Sei già in una squadra');
      return;
    }

    try {
      await requestsService.sendRequest({
        toTeamId: teamId,
        fromUserId: user.id,
        message: requestMessage,
        type: 'player_to_team',
      });
      
      setShowRequestModal(false);
      setRequestMessage('');
      Alert.alert('Successo', 'Richiesta inviata con successo');
    } catch (error) {
      console.error('Error sending request:', error);
      Alert.alert('Errore', error.message || 'Impossibile inviare la richiesta');
    }
  };

  const kickMember = async (memberId) => {
    Alert.alert(
      'Espelli Membro',
      'Sei sicuro di voler espellere questo membro?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Espelli',
          style: 'destructive',
          onPress: async () => {
            try {
              await teamsService.kickMember(teamId, memberId);
              Alert.alert('Successo', 'Membro espulso');
              loadTeamData();
            } catch (error) {
              Alert.alert('Errore', 'Impossibile espellere il membro');
            }
          },
        },
      ]
    );
  };

  const deleteTeam = async () => {
    Alert.alert(
      'Elimina Squadra',
      'Sei sicuro di voler eliminare questa squadra? Questa azione non può essere annullata.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await teamsService.deleteTeam(teamId);
              Alert.alert('Successo', 'Squadra eliminata', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Errore', 'Impossibile eliminare la squadra');
            }
          },
        },
      ]
    );
  };

  const isOwner = user?.id === team?.owner;
  const isMember = teamMembers.some(member => member.id === user?.id);

  if (isLoading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.text}>Caricamento...</Text>
      </View>
    );
  }

  if (!team) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.text}>Squadra non trovata</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={globalStyles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={[globalStyles.card, { alignItems: 'center', paddingVertical: 24 }]}>
        <View
          style={[
            globalStyles.avatarLarge,
            {
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            },
          ]}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 24 }}>
            {team.name?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={[globalStyles.header, { marginBottom: 4 }]}>{team.name}</Text>
        <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>
          {team.platform} • {teamMembers.length} membri
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Ionicons name="star" size={20} color={colors.warning} />
          <Text style={[globalStyles.text, { marginLeft: 4, fontSize: 18 }]}>
            {team.averageRating || 'N/A'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
          <TouchableOpacity
            style={[globalStyles.button, { margin: 4, flexDirection: 'row', alignItems: 'center' }]}
            onPress={toggleFavorite}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={16} 
              color={colors.textPrimary} 
              style={{ marginRight: 4 }}
            />
            <Text style={globalStyles.buttonText}>
              {isFavorite ? 'Rimuovi' : 'Aggiungi'}
            </Text>
          </TouchableOpacity>

          {!user?.team && team.lookingForPlayers && (
            <TouchableOpacity
              style={[globalStyles.button, { margin: 4 }]}
              onPress={() => setShowRequestModal(true)}
            >
              <Text style={globalStyles.buttonText}>Richiedi di Unirti</Text>
            </TouchableOpacity>
          )}

          {isOwner && (
            <TouchableOpacity
              style={[globalStyles.button, { margin: 4 }]}
              onPress={() => setShowManageModal(true)}
            >
              <Text style={globalStyles.buttonText}>Gestisci Squadra</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Informazioni */}
      <View style={globalStyles.card}>
        <Text style={[globalStyles.subheader, { marginBottom: 12 }]}>Informazioni</Text>
        
        <View style={{ marginBottom: 8 }}>
          <Text style={globalStyles.label}>Piattaforma</Text>
          <Text style={globalStyles.text}>{team.platform}</Text>
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text style={globalStyles.label}>Nazionalità</Text>
          <Text style={globalStyles.text}>{team.nationality}</Text>
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text style={globalStyles.label}>Stato Ricerca</Text>
          <Text style={globalStyles.text}>
            {team.lookingForPlayers ? '🔍 Cerchiamo giocatori' : '❌ Non cerchiamo giocatori'}
          </Text>
        </View>

        {team.description && (
          <View>
            <Text style={globalStyles.label}>Descrizione</Text>
            <Text style={globalStyles.text}>{team.description}</Text>
          </View>
        )}
      </View>

      {/* Social Media */}
      {(team.instagram || team.tiktok || team.liveLink) && (
        <View style={globalStyles.card}>
          <Text style={[globalStyles.subheader, { marginBottom: 12 }]}>Social & Live</Text>
          
          {team.instagram && (
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="logo-instagram" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[globalStyles.text, { color: colors.primary }]}>@{team.instagram}</Text>
            </TouchableOpacity>
          )}
          
          {team.tiktok && (
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="logo-tiktok" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[globalStyles.text, { color: colors.primary }]}>@{team.tiktok}</Text>
            </TouchableOpacity>
          )}
          
          {team.liveLink && (
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="videocam" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[globalStyles.text, { color: colors.primary }]}>{team.liveLink}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Membri */}
      <View style={globalStyles.card}>
        <Text style={[globalStyles.subheader, { marginBottom: 12 }]}>
          Membri ({teamMembers.length})
        </Text>

        {teamMembers.map(member => (
          <View key={member.id} style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginBottom: 12,
            paddingBottom: 12,
            borderBottomWidth: member.id !== teamMembers[teamMembers.length - 1].id ? 1 : 0,
            borderBottomColor: colors.border,
          }}>
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
              <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 14 }}>
                {member.username?.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[globalStyles.text, { fontWeight: '600' }]}>{member.username}</Text>
                {member.id === team.owner && (
                  <View style={[globalStyles.chip, { backgroundColor: colors.warning, marginLeft: 8 }]}>
                    <Text style={[globalStyles.chipText, { color: colors.textPrimary, fontSize: 10 }]}>
                      Owner
                    </Text>
                  </View>
                )}
              </View>
              <Text style={globalStyles.textSecondary}>
                {t(`roles.${member.primaryRole}`)} • Livello {member.level}
              </Text>
            </View>

            {isOwner && member.id !== user.id && (
              <TouchableOpacity
                onPress={() => kickMember(member.id)}
                style={{ padding: 8 }}
              >
                <Ionicons name="close-circle" size={20} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Info Creazione */}
      <View style={[globalStyles.card, { marginBottom: 24 }]}>
        <Text style={[globalStyles.textSecondary, { textAlign: 'center' }]}>
          Squadra creata il {formatDate(team.createdAt)}
        </Text>
      </View>

      {/* Request Modal */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <Text style={[globalStyles.subheader, { marginBottom: 16 }]}>
              Richiedi di unirti a {team.name}
            </Text>

            <Text style={[globalStyles.label, { marginBottom: 8 }]}>Messaggio (opzionale)</Text>
            <TextInput
              style={[globalStyles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Presentati e spiega perché vorresti unirti..."
              placeholderTextColor={colors.textDisabled}
              value={requestMessage}
              onChangeText={setRequestMessage}
              multiline
              maxLength={500}
            />

            <View style={{ flexDirection: 'row', marginTop: 24 }}>
              <TouchableOpacity
                style={[globalStyles.buttonSecondary, { flex: 1, marginRight: 8 }]}
                onPress={() => setShowRequestModal(false)}
              >
                <Text style={globalStyles.buttonSecondaryText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.button, { flex: 1 }]}
                onPress={sendRequest}
              >
                <Text style={globalStyles.buttonText}>Invia Richiesta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Manage Team Modal */}
      <Modal
        visible={showManageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManageModal(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <Text style={[globalStyles.subheader, { marginBottom: 16 }]}>
              Gestisci {team.name}
            </Text>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
              onPress={() => {
                setShowManageModal(false);
                Alert.alert('Info', 'Modifica squadra - Funzionalità in sviluppo');
              }}
            >
              <Ionicons name="create-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
              <Text style={globalStyles.text}>Modifica Informazioni</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
              }}
              onPress={() => {
                setShowManageModal(false);
                deleteTeam();
              }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} style={{ marginRight: 12 }} />
              <Text style={[globalStyles.text, { color: colors.danger }]}>Elimina Squadra</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.buttonSecondary, { marginTop: 24 }]}
              onPress={() => setShowManageModal(false)}
            >
              <Text style={globalStyles.buttonSecondaryText}>Chiudi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default TeamDetailScreen;