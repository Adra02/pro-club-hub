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
import { AuthContext } from '../../contexts/AuthContext';
import { globalStyles, colors } from '../../styles/global';
import { validateEmail } from '../../utils/helpers';

const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Errore', 'Inserisci email e password');
      return;
    }

    if (!validateEmail(formData.email)) {
      Alert.alert('Errore', 'Inserisci una email valida');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        // Navigation is handled by AuthContext
      } else {
        Alert.alert('Errore', result.error || 'Credenziali non valide');
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
        contentContainerStyle={[globalStyles.screenContainer, { paddingVertical: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[globalStyles.header, { marginBottom: 32 }]}>
          ACCEDI
        </Text>

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Email</Text>
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

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Password</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="La tua password"
            placeholderTextColor={colors.textDisabled}
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        <TouchableOpacity
          style={{ alignSelf: 'flex-end', marginBottom: 24 }}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={[globalStyles.textSecondary, { color: colors.primary }]}>
            Password dimenticata?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[globalStyles.button, isLoading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={globalStyles.buttonText}>
            {isLoading ? 'CARICAMENTO...' : 'ACCEDI'}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Text style={globalStyles.textSecondary}>
            Non hai un account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[globalStyles.textSecondary, { color: colors.primary }]}>
              Registrati
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;