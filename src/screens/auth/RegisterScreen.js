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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '../../contexts/AuthContext';
import { globalStyles, colors } from '../../styles/global';
import { validateEmail, validatePassword } from '../../utils/helpers';
import { ROLES, PLATFORMS, NATIONALITIES } from '../../utils/constants';

const RegisterScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { register } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    primaryRole: '',
    platform: '',
    level: 25,
    nationality: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    // Validazione campi obbligatori
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || 
        !formData.primaryRole || !formData.platform || !formData.nationality) {
      Alert.alert('Errore', 'Compila tutti i campi obbligatori');
      return;
    }

    if (!validateEmail(formData.email)) {
      Alert.alert('Errore', 'Inserisci una email valida');
      return;
    }

    if (!validatePassword(formData.password)) {
      Alert.alert('Errore', 'La password deve essere di almeno 6 caratteri');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Errore', 'Le password non coincidono');
      return;
    }

    if (formData.username.length < 3 || formData.username.length > 20) {
      Alert.alert('Errore', 'Username deve essere tra 3 e 20 caratteri');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(formData);
      if (result.success) {
        Alert.alert(
          'Registrazione Completata!',
          'Controlla la tua email per completare la registrazione',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('Errore', result.error || 'Errore durante la registrazione');
      }
    } catch (error) {
      Alert.alert('Errore', error.message || 'Qualcosa è andato storto');
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
          REGISTRATI
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

        {/* Email */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Email *</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="la.tua@email.com"
            placeholderTextColor={colors.textDisabled}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        {/* Password */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Password *</Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              style={[globalStyles.input, { paddingRight: 40 }]}
              placeholder="Minimo 6 caratteri"
              placeholderTextColor={colors.textDisabled}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry={!showPassword}
              autoComplete="password-new"
            />
            <TouchableOpacity
              style={{
                position: 'absolute',
                right: 12,
                top: 8,
              }}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={{ color: colors.textSecondary }}>
                {showPassword ? 'Nascondi' : 'Mostra'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Conferma Password *</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="Conferma password"
            placeholderTextColor={colors.textDisabled}
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            secureTextEntry={!showPassword}
            autoComplete="password-new"
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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

        {/* Register Button */}
        <TouchableOpacity
          style={[globalStyles.button, isLoading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={globalStyles.buttonText}>
            {isLoading ? 'CARICAMENTO...' : 'REGISTRATI'}
          </Text>
        </TouchableOpacity>

        {/* Login Link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Text style={globalStyles.textSecondary}>
            Hai già un account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[globalStyles.textSecondary, { color: colors.primary }]}>
              Accedi
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;