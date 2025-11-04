import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from '../../contexts/AuthContext';
import { teamsService } from '../../services/api';
import { globalStyles, colors } from '../../styles/global';
import { PLATFORMS, NATIONALITIES } from '../../utils/constants';

const CreateTeamScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, updateUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    platform: user?.platform || '',
    nationality: user?.nationality || '',
    instagram: '',
    tiktok: '',
    liveLink: '',
    lookingForPlayers: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateTeam = async () => {
    if (!formData.name || !formData.platform || !formData.nationality) {
      Alert.alert('Errore', 'Compila tutti i campi obbligatori');
      return;
    }

    if (formData.name.length < 3 || formData.name.length > 30) {
      Alert.alert('Errore', 'Il nome della squadra deve essere tra 3 e 30 caratteri');
      return;
    }

    if (formData.description && formData.description.length > 500) {
      Alert.alert('Errore', 'La descrizione non può superare 500 caratteri');
      return;
    }

    setIsLoading(true);
    try {
      const response = await teamsService.createTeam(formData);
      updateUser({ ...user, team: response.team.id });
      Alert.alert('Successo', 'Squadra creata con successo!', [
        { 
          text: 'OK', 
          onPress: () => navigation.navigate('TeamDetail', { teamId: response.team.id }) 
        },
      ]);
    } catch (error) {
      console.error('Error creating team:', error);
      Alert.alert('Errore', error.message || 'Impossibile creare la squadra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={globalStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[globalStyles.screenContainer, { paddingVertical: 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[globalStyles.header, { marginBottom: 24 }]}>
          Crea la tua Squadra
        </Text>

        {/* Team Name */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Nome Squadra *</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Il nome della tua squadra"
            placeholderTextColor={colors.textDisabled}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            autoCapitalize="words"
            maxLength={30}
          />
          <Text style={globalStyles.textSmall}>
            {formData.name.length}/30 caratteri
          </Text>
        </View>

        {/* Platform */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Piattaforma *</Text>
          <View style={[globalStyles.input, { paddingHorizontal: 0 }]}>
            <Picker
              selectedValue={formData.platform}
              onValueChange={(value) => setFormData({ ...formData, platform: value })}
              style={{ color: colors.textPrimary }}
              dropdownIconColor={colors.textPrimary}
            >
              <Picker.Item label="Seleziona piattaforma" value="" />
              {PLATFORMS.map((platform) => (
                <Picker.Item key={platform} label={platform} value={platform} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Nationality */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Nazionalità *</Text>
          <View style={[globalStyles.input, { paddingHorizontal: 0 }]}>
            <Picker
              selectedValue={formData.nationality}
              onValueChange={(value) => setFormData({ ...formData, nationality: value })}
              style={{ color: colors.textPrimary }}
              dropdownIconColor={colors.textPrimary}
            >
              <Picker.Item label="Seleziona nazionalità" value="" />
              {NATIONALITIES.map((nationality) => (
                <Picker.Item key={nationality} label={nationality} value={nationality} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Description */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Descrizione</Text>
          <TextInput
            style={[globalStyles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Descrivi la tua squadra, i vostri obiettivi, stile di gioco..."
            placeholderTextColor={colors.textDisabled}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            maxLength={500}
          />
          <Text style={[globalStyles.textSmall, { textAlign: 'right' }]}>
            {formData.description.length}/500
          </Text>
        </View>

        {/* Looking for Players */}
        <View style={globalStyles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={[globalStyles.label, { marginBottom: 4 }]}>Cerchiamo giocatori</Text>
              <Text style={globalStyles.textSecondary}>
                {formData.lookingForPlayers 
                  ? 'La squadra sarà visibile ai giocatori che cercano team' 
                  : 'La squadra non accetterà nuove richieste'
                }
              </Text>
            </View>
            <Switch
              value={formData.lookingForPlayers}
              onValueChange={(value) => setFormData({ ...formData, lookingForPlayers: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>
        </View>

        {/* Social Media */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Social Media (opzionali)</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="logo-instagram" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[globalStyles.input, { flex: 1 }]}
              placeholder="username (senza @)"
              placeholderTextColor={colors.textDisabled}
              value={formData.instagram}
              onChangeText={(text) => setFormData({ ...formData, instagram: text })}
              autoCapitalize="none"
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="logo-tiktok" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[globalStyles.input, { flex: 1 }]}
              placeholder="username"
              placeholderTextColor={colors.textDisabled}
              value={formData.tiktok}
              onChangeText={(text) => setFormData({ ...formData, tiktok: text })}
              autoCapitalize="none"
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="videocam" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[globalStyles.input, { flex: 1 }]}
              placeholder="Link Twitch/YouTube"
              placeholderTextColor={colors.textDisabled}
              value={formData.liveLink}
              onChangeText={(text) => setFormData({ ...formData, liveLink: text })}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[globalStyles.button, isLoading && { opacity: 0.7 }]}
          onPress={handleCreateTeam}
          disabled={isLoading}
        >
          <Text style={globalStyles.buttonText}>
            {isLoading ? 'CREAZIONE...' : 'CREA SQUADRA'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateTeamScreen;