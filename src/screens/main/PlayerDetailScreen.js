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
import { usersService, requestsService, favoritesService, feedbackService } from '../../services/api';
import { globalStyles, colors, roleColors } from '../../styles/global';
import { formatDate, calculateAverageRating } from '../../utils/helpers';
import { FEEDBACK_TAGS } from '../../utils/constants';

const PlayerDetailScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const route = useRoute();
  const { user } = useContext(AuthContext);
  
  const { playerId } = route.params;
  
  const [player, setPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    tags: [],
    comment: '',
  });
  const [playerFeedbacks, setPlayerFeedbacks] = useState([]);

  useEffect(() => {
    loadPlayerData();
  }, [playerId]);

  const loadPlayerData = async () => {
    try {
      const [playerResponse, favoritesResponse, feedbacksResponse] = await Promise.all([
        usersService.getUser(playerId),
        favoritesService.getFavorites(),
        feedbackService.getFeedbacks(playerId),
      ]);
      
      setPlayer(playerResponse.user);
      setIsFavorite(favoritesResponse.players?.some(p => p.id === playerId) || false);
      setPlayerFeedbacks(feedbacksResponse.feedbacks || []);
    } catch (error) {
      console.error('Error loading player data:', error);
      Alert.alert('Errore', 'Impossibile caricare i dati del giocatore');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPlayerData();
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await favoritesService.removeFavorite('player', playerId);
        setIsFavorite(false);
      } else {
        await favoritesService.addFavorite('player', playerId);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Errore', 'Impossibile aggiornare i preferiti');
    }
  };

  const sendRequest = async () => {
    if (!user.team) {
      Alert.alert('Errore', 'Devi avere una squadra per inviare richieste');
      return;
    }

    try {
      await requestsService.sendRequest({
        toUserId: playerId,
        teamId: user.team,
        message: requestMessage,
        type: 'team_to_player',
      });
      
      setShowRequestModal(false);
      setRequestMessage('');
      Alert.alert('Successo', 'Richiesta inviata con successo');
    } catch (error) {
      console.error('Error sending request:', error);
      Alert.alert('Errore', error.message || 'Impossibile inviare la richiesta');
    }
  };

  const submitFeedback = async () => {
    if (!feedbackData.rating) {
      Alert.alert('Errore', 'Seleziona una valutazione');
      return;
    }

    try {
      await feedbackService.sendFeedback({
        toUserId: playerId,
        rating: feedbackData.rating,
        tags: feedbackData.tags,
        comment: feedbackData.comment,
      });
      
      setShowFeedbackModal(false);
      setFeedbackData({ rating: 5, tags: [], comment: '' });
      Alert.alert('Successo', 'Feedback inviato con successo');
      loadPlayerData(); // Reload to show new feedback
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Errore', error.message || 'Impossibile inviare il feedback');
    }
  };

  const toggleFeedbackTag = (tag) => {
    setFeedbackData(prev => {
      const currentTags = prev.tags || [];
      if (currentTags.includes(tag)) {
        return {
          ...prev,
          tags: currentTags.filter(t => t !== tag),
        };
      } else if (currentTags.length < 5) {
        return {
          ...prev,
          tags: [...currentTags, tag],
        };
      }
      return prev;
    });
  };

  const hasGivenFeedback = playerFeedbacks.some(feedback => feedback.fromUserId === user?.id);

  if (isLoading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.text}>Caricamento...</Text>
      </View>
    );
  }

  if (!player) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.text}>Giocatore non trovato</Text>
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
              backgroundColor: roleColors[player.primaryRole] || colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            },
          ]}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 24 }}>
            {player.username?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={[globalStyles.header, { marginBottom: 4 }]}>{player.username}</Text>
        <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>
          {t(`roles.${player.primaryRole}`)} • Livello {player.level}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Ionicons name="star" size={20} color={colors.warning} />
          <Text style={[globalStyles.text, { marginLeft: 4, fontSize: 18 }]}>
            {player.averageRating || 'N/A'} ({player.feedbackCount || 0} feedback)
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

          {user?.team && user.id !== player.id && (
            <TouchableOpacity
              style={[globalStyles.button, { margin: 4 }]}
              onPress={() => setShowRequestModal(true)}
            >
              <Text style={globalStyles.buttonText}>Invita in Squadra</Text>
            </TouchableOpacity>
          )}

          {user?.id !== player.id && !hasGivenFeedback && (
            <TouchableOpacity
              style={[globalStyles.button, { margin: 4 }]}
              onPress={() => setShowFeedbackModal(true)}
            >
              <Text style={globalStyles.buttonText}>Lascia Feedback</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Informazioni */}
      <View style={globalStyles.card}>
        <Text style={[globalStyles.subheader, { marginBottom: 12 }]}>Informazioni</Text>
        
        <View style={{ marginBottom: 8 }}>
          <Text style={globalStyles.label}>Piattaforma</Text>
          <Text style={globalStyles.text}>{player.platform}</Text>
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text style={globalStyles.label}>Nazionalità</Text>
          <Text style={globalStyles.text}>{player.nationality}</Text>
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text style={globalStyles.label}>Stato</Text>
          <Text style={globalStyles.text}>
            {player.lookingForTeam ? '🔍 Cerco squadra' : '❌ Non cerco squadra'}
          </Text>
        </View>

        {player.secondaryRoles && player.secondaryRoles.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <Text style={globalStyles.label}>Ruoli Secondari</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
              {player.secondaryRoles.map(role => (
                <View 
                  key={role} 
                  style={[globalStyles.chip, { backgroundColor: roleColors[role] }]}
                >
                  <Text style={[globalStyles.chipText, { color: colors.textPrimary }]}>
                    {t(`roles.${role}`)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Social Media */}
      {(player.instagram || player.tiktok) && (
        <View style={globalStyles.card}>
          <Text style={[globalStyles.subheader, { marginBottom: 12 }]}>Social Media</Text>
          
          {player.instagram && (
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="logo-instagram" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[globalStyles.text, { color: colors.primary }]}>@{player.instagram}</Text>
            </TouchableOpacity>
          )}
          
          {player.tiktok && (
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="logo-tiktok" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[globalStyles.text, { color: colors.primary }]}>@{player.tiktok}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Bio */}
      {player.bio && (
        <View style={globalStyles.card}>
          <Text style={[globalStyles.subheader, { marginBottom: 8 }]}>Bio</Text>
          <Text style={globalStyles.text}>{player.bio}</Text>
        </View>
      )}

      {/* Feedback */}
      <View style={globalStyles.card}>
        <Text style={[globalStyles.subheader, { marginBottom: 12 }]}>
          Feedback ({playerFeedbacks.length})
        </Text>

        {playerFeedbacks.length === 0 ? (
          <Text style={[globalStyles.textSecondary, { textAlign: 'center', padding: 16 }]}>
            Nessun feedback ricevuto
          </Text>
        ) : (
          playerFeedbacks.map(feedback => (
            <View key={feedback.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <Text style={[globalStyles.text, { fontWeight: '600' }]}>
                  {feedback.fromUser?.username || 'Utente anonimo'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < feedback.rating ? "star" : "star-outline"}
                      size={16}
                      color={colors.warning}
                      style={{ marginLeft: 2 }}
                    />
                  ))}
                </View>
              </View>

              {feedback.tags && feedback.tags.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                  {feedback.tags.map(tag => (
                    <View key={tag} style={[globalStyles.chip, { marginRight: 4, marginBottom: 4 }]}>
                      <Text style={globalStyles.chipText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {feedback.comment && (
                <Text style={globalStyles.text}>{feedback.comment}</Text>
              )}

              <Text style={[globalStyles.textSmall, { marginTop: 4 }]}>
                {formatDate(feedback.createdAt)}
              </Text>
            </View>
          ))
        )}
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
              Invita {player.username} nella tua squadra
            </Text>

            <Text style={[globalStyles.label, { marginBottom: 8 }]}>Messaggio (opzionale)</Text>
            <TextInput
              style={[globalStyles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Scrivi un messaggio per convincerlo a unirsi..."
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
                <Text style={globalStyles.buttonText}>Invia Invito</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <ScrollView style={globalStyles.modalContent}>
            <Text style={[globalStyles.subheader, { marginBottom: 16 }]}>
              Lascia feedback per {player.username}
            </Text>

            {/* Rating */}
            <Text style={[globalStyles.label, { marginBottom: 8 }]}>Valutazione *</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setFeedbackData(prev => ({ ...prev, rating: star }))}
                  style={{ padding: 4 }}
                >
                  <Ionicons
                    name={star <= feedbackData.rating ? "star" : "star-outline"}
                    size={32}
                    color={colors.warning}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Tags */}
            <Text style={[globalStyles.label, { marginBottom: 8 }]}>
              Tag ({feedbackData.tags.length}/5)
            </Text>
            <View style={globalStyles.filterContainer}>
              {FEEDBACK_TAGS.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    globalStyles.filterChip,
                    feedbackData.tags.includes(tag) && globalStyles.filterChipActive,
                  ]}
                  onPress={() => toggleFeedbackTag(tag)}
                >
                  <Text
                    style={[
                      globalStyles.filterChipText,
                      feedbackData.tags.includes(tag) && globalStyles.filterChipTextActive,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment */}
            <Text style={[globalStyles.label, { marginBottom: 8 }]}>Commento (opzionale)</Text>
            <TextInput
              style={[globalStyles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Condividi la tua esperienza con questo giocatore..."
              placeholderTextColor={colors.textDisabled}
              value={feedbackData.comment}
              onChangeText={(text) => setFeedbackData(prev => ({ ...prev, comment: text }))}
              multiline
              maxLength={500}
            />
            <Text style={[globalStyles.textSmall, { textAlign: 'right' }]}>
              {feedbackData.comment.length}/500
            </Text>

            <View style={{ flexDirection: 'row', marginTop: 24 }}>
              <TouchableOpacity
                style={[globalStyles.buttonSecondary, { flex: 1, marginRight: 8 }]}
                onPress={() => setShowFeedbackModal(false)}
              >
                <Text style={globalStyles.buttonSecondaryText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.button, { flex: 1 }]}
                onPress={submitFeedback}
              >
                <Text style={globalStyles.buttonText}>Invia Feedback</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default PlayerDetailScreen;