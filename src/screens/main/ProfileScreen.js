import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from '../../contexts/AuthContext';
import { usersService, teamsService } from '../../services/api';
import { globalStyles, colors, roleColors } from '../../styles/global';
import { formatDate } from '../../utils/helpers';

const ProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, logout, updateUser } = useContext(AuthContext);

  const [refreshing, setRefreshing] = useState(false);
  const [userTeam, setUserTeam] = useState(null);
  const [lookingForTeam, setLookingForTeam] = useState(user?.lookingForTeam || false);

  useEffect(() => {
    if (user?.team) {
      loadUserTeam();
    }
  }, [user?.team]);

  const loadUserTeam = async () => {
    try {
      const response = await teamsService.getTeam(user.team);
      setUserTeam(response.team);
    } catch (error) {
      console.error('Error loading user team:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Ricarica dati utente
    setRefreshing(false);
  };

  const handleToggleLookingForTeam = async (value) => {
    try {
      setLookingForTeam(value);
      await usersService.toggleLookingForTeam(user.id);
      updateUser({ ...user, lookingForTeam: value });
    } catch (error) {
      console.error('Error toggling looking for team:', error);
      setLookingForTeam(!value);
      Alert.alert('Errore', 'Impossibile aggiornare lo stato');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Sei sicuro di voler uscire?',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const handleLeaveTeam = () => {
    Alert.alert(
      'Lascia Squadra',
      'Sei sicuro di voler lasciare la squadra?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Lascia', 
          onPress: async () => {
            try {
              await teamsService.leaveTeam(userTeam.id);
              updateUser({ ...user, team: null });
              setUserTeam(null);
              Alert.alert('Successo', 'Hai lasciato la squadra');
            } catch (error) {
              Alert.alert('Errore', 'Impossibile lasciare la squadra');
            }
          },
          style: 'destructive' 
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.text}>Caricamento...</Text>
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
      {/* Header Profilo */}
      <View style={[globalStyles.card, { alignItems: 'center', paddingVertical: 24 }]}>
        <View
          style={[
            globalStyles.avatarLarge,
            {
              backgroundColor: roleColors[user.primaryRole] || colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            },
          ]}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 24 }}>
            {user.username?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={[globalStyles.header, { marginBottom: 4 }]}>{user.username}</Text>
        <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>
          {t(`roles.${user.primaryRole}`)} • Livello {user.level}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="star" size={16} color={colors.warning} />
          <Text style={[globalStyles.text, { marginLeft: 4 }]}>
            {user.averageRating || 'N/A'} ({user.feedbackCount || 0} feedback)
          </Text>
        </View>
      </View>

      {/* Cerco Squadra Toggle */}
      <View style={globalStyles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={[globalStyles.text, { fontWeight: '600' }]}>
              {lookingForTeam ? t('players.lookingForTeam') : t('players.notLookingForTeam')}
            </Text>
            <Text style={globalStyles.textSecondary}>
              {lookingForTeam 
                ? 'Le squadre possono vederti e contattarti' 
                : 'Non sei visibile alle squadre che cercano giocatori'
              }
            </Text>
          </View>
          <Switch
            value={lookingForTeam}
            onValueChange={handleToggleLookingForTeam}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.textPrimary}
          />
        </View>
      </View>

      {/* La Mia Squadra */}
      {userTeam && (
        <View style={globalStyles.card}>
          <Text style={[globalStyles.subheader, { marginBottom: 12 }]}>
            {t('profile.myTeam')}
          </Text>
          
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceVariant,
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
            }}
            onPress={() => navigation.navigate('TeamDetail', { teamId: userTeam.id })}
          >
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
                {userTeam.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[globalStyles.text, { fontWeight: '600' }]}>{userTeam.name}</Text>
              <Text style={globalStyles.textSecondary}>
                {userTeam.platform} • {userTeam.members?.length || 0} membri
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {userTeam.owner === user.id && (
            <TouchableOpacity
              style={[globalStyles.button, { marginBottom: 8 }]}
              onPress={() => navigation.navigate('TeamDetail', { teamId: userTeam.id })}
            >
              <Text style={globalStyles.buttonText}>Gestisci Squadra</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[globalStyles.buttonDanger, { paddingVertical: 8 }]}
            onPress={handleLeaveTeam}
          >
            <Text style={globalStyles.buttonDangerText}>Lascia Squadra</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* I Miei Social */}
      <View style={globalStyles.card}>
        <Text style={[globalStyles.subheader, { marginBottom: 12 }]}>
          {t('profile.mySocial')}
        </Text>

        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <Ionicons name="logo-instagram" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <Text style={globalStyles.text}>
            {user.instagram ? `@${user.instagram}` : 'Non impostato'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <Ionicons name="logo-tiktok" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <Text style={globalStyles.text}>
            {user.tiktok ? `@${user.tiktok}` : 'Non impostato'}
          </Text>
        </View>
      </View>

      {/* Bio */}
      {user.bio && (
        <View style={globalStyles.card}>
          <Text style={[globalStyles.subheader, { marginBottom: 8 }]}>Bio</Text>
          <Text style={globalStyles.text}>{user.bio}</Text>
        </View>
      )}

      {/* Azioni */}
      <View style={globalStyles.card}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="create-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
          <Text style={globalStyles.text}>{t('profile.editProfile')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
          onPress={() => Alert.alert('Info', 'Funzionalità in sviluppo')}
        >
          <Ionicons name="language-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
          <Text style={globalStyles.text}>{t('profile.changeLanguage')}</Text>
        </TouchableOpacity>

        {user.isAdmin && (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
            onPress={() => navigation.navigate('AdminPanel')}
          >
            <Ionicons name="shield-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
            <Text style={globalStyles.text}>{t('profile.adminPanel')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
          }}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} style={{ marginRight: 12 }} />
          <Text style={[globalStyles.text, { color: colors.danger }]}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </View>

      {/* Info Account */}
      <View style={[globalStyles.card, { marginBottom: 24 }]}>
        <Text style={[globalStyles.textSecondary, { textAlign: 'center' }]}>
          Membro dal {formatDate(user.createdAt)}
        </Text>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;