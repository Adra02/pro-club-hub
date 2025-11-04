import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from '../../contexts/AuthContext';
import { usersService } from '../../services/api';
import { globalStyles, colors } from '../../styles/global';
import { ROLES, PLATFORMS, NATIONALITIES } from '../../utils/constants';

const EditProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, updateUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    username: '',
    primaryRole: '',
    secondaryRoles: [],
    platform: '',
    level: 25,
    nationality: '',
    instagram: '',
    tiktok: '',
    bio: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        primaryRole: user.primaryRole || '',
        secondaryRoles: user.secondaryRoles || [],
        platform: user.platform || '',
        level: user.level || 25,
        nationality: user.nationality || '',
        instagram: user.instagram || '',
        tiktok: user.tiktok || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!formData.username || !formData.primaryRole || !formData.platform || !formData.nationality) {
      Alert.alert('Errore', 'Compila tutti i campi obbligatori');
      return;
    }

    if (formData.username.length < 3 || formData.username.length > 20) {
      Alert.alert('Errore', 'Username deve essere tra 3 e 20 caratteri');
      return;
    }

    if (formData.bio && formData.bio.length > 500) {
      Alert.alert('Errore', 'La bio non può superare 500 caratteri');
      return;
    }

    setIsLoading(true);
    try {
      const response = await usersService.updateUser(user.id, formData);
      updateUser({ ...user, ...formData });
      Alert.alert('Successo', 'Profilo aggiornato con successo', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Errore', error.message || 'Impossibile aggiornare il profilo');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSecondaryRole = (role) => {
    setFormData(prev => {
      const currentRoles = prev.secondaryRoles || [];
      if (currentRoles.includes(role)) {
        return {
          ...prev,
          secondaryRoles: currentRoles.filter(r => r !== role),
        };
      } else {
        return {
          ...prev,
          secondaryRoles: [...currentRoles, role],
        };
      }
    });
  };

  const isProfileComplete = () => {
    return formData.secondaryRoles.length > 0 && (formData.instagram || formData.tiktok);
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
          {t('profile.editProfile')}
        </Text>

        {/* Username */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Username *</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Il tuo username"
            placeholderTextColor={colors.textDisabled}
            value={formData.username}
            onChangeText={(text) => setFormData({ ...formData, username: text })}
            autoCapitalize="none"
            maxLength={20}
          />
        </View>

        {/* Primary Role */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Ruolo Principale *</Text>
          <View style={[globalStyles.input, { paddingHorizontal: 0 }]}>
            <Picker
              selectedValue={formData.primaryRole}
              onValueChange={(value) => setFormData({ ...formData, primaryRole: value })}
              style={{ color: colors.textPrimary }}
              dropdownIconColor={colors.textPrimary}
            >
              <Picker.Item label="Seleziona ruolo principale" value="" />
              {ROLES.map((role) => (
                <Picker.Item key={role} label={t(`roles.${role}`)} value={role} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Secondary Roles */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>
            Ruoli Secondari {formData.secondaryRoles.length === 0 && ' *'}
          </Text>
          <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>
            Seleziona i ruoli che sai ricoprire (almeno 1 richiesto)
          </Text>
          <View style={globalStyles.filterContainer}>
            {ROLES.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  globalStyles.filterChip,
                  formData.secondaryRoles.includes(role) && globalStyles.filterChipActive,
                ]}
                onPress={() => toggleSecondaryRole(role)}
              >
                <Text
                  style={[
                    globalStyles.filterChipText,
                    formData.secondaryRoles.includes(role) && globalStyles.filterChipTextActive,
                  ]}
                >
                  {t(`roles.${role}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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

        {/* Level */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>
            Livello: {formData.level}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[globalStyles.textSecondary, { marginRight: 12 }]}>1</Text>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  height: 4,
                  backgroundColor: colors.primary,
                  width: `${((formData.level - 1) / 49) * 100}%`,
                  borderRadius: 2,
                }}
              />
            </View>
            <Text style={[globalStyles.textSecondary, { marginLeft: 12 }]}>50</Text>
          </View>
          <TextInput
            style={globalStyles.input}
            value={formData.level.toString()}
            onChangeText={(text) => {
              const level = parseInt(text) || 1;
              if (level >= 1 && level <= 50) {
                setFormData({ ...formData, level });
              }
            }}
            keyboardType="numeric"
          />
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

        {/* Social Media */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>
            Social Media {!formData.instagram && !formData.tiktok && ' *'}
          </Text>
          <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>
            Inserisci almeno un social (Instagram o TikTok)
          </Text>

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

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
        </View>

        {/* Bio */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Bio</Text>
          <TextInput
            style={[globalStyles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Raccontaci qualcosa di te (max 500 caratteri)"
            placeholderTextColor={colors.textDisabled}
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            multiline
            maxLength={500}
          />
          <Text style={[globalStyles.textSmall, { textAlign: 'right' }]}>
            {formData.bio.length}/500
          </Text>
        </View>

        {/* Profile Completion Status */}
        <View style={[globalStyles.card, { marginBottom: 16 }]}>
          <Text style={[globalStyles.subheader, { marginBottom: 8 }]}>
            Stato Profilo
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons 
              name={formData.secondaryRoles.length > 0 ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={formData.secondaryRoles.length > 0 ? colors.success : colors.danger} 
              style={{ marginRight: 8 }}
            />
            <Text style={globalStyles.text}>
              Almeno 1 ruolo secondario: {formData.secondaryRoles.length > 0 ? 'Completato' : 'Mancante'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons 
              name={(formData.instagram || formData.tiktok) ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={(formData.instagram || formData.tiktok) ? colors.success : colors.danger} 
              style={{ marginRight: 8 }}
            />
            <Text style={globalStyles.text}>
              Almeno 1 social: {(formData.instagram || formData.tiktok) ? 'Completato' : 'Mancante'}
            </Text>
          </View>

          {isProfileComplete() && (
            <View style={[globalStyles.chip, { backgroundColor: colors.success, alignSelf: 'flex-start', marginTop: 8 }]}>
              <Text style={[globalStyles.chipText, { color: colors.textPrimary }]}>
                ✓ Profilo Completo
              </Text>
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[globalStyles.button, isLoading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={globalStyles.buttonText}>
            {isLoading ? 'SALVATAGGIO...' : t('common.save')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;