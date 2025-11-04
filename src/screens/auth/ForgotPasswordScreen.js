import React, { useState } from 'react';
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

import { authService } from '../../services/api';
import { globalStyles, colors } from '../../styles/global';
import { validateEmail } from '../../utils/helpers';

const ForgotPasswordScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Errore', 'Inserisci la tua email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Errore', 'Inserisci una email valida');
      return;
    }

    setIsLoading(true);
    try {
      await authService.recoverPassword(email);
      Alert.alert(
        'Email Inviata',
        'Controlla la tua email per il link di reset password',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Errore', error.message || 'Impossibile inviare il link di reset');
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
          Recupera Password
        </Text>

        <Text style={[globalStyles.text, { marginBottom: 24, textAlign: 'center' }]}>
          Inserisci la tua email e ti invieremo un link per resettare la password.
        </Text>

        <View style={globalStyles.section}>
          <Text style={globalStyles.label}>Email</Text>
          <TextInput
            style={globalStyles.input}
            placeholder="la.tua@email.com"
            placeholderTextColor={colors.textDisabled}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        <TouchableOpacity
          style={[globalStyles.button, isLoading && { opacity: 0.7 }]}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          <Text style={globalStyles.buttonText}>
            {isLoading ? 'INVIO...' : 'INVIA LINK DI RESET'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ alignSelf: 'center', marginTop: 24 }}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[globalStyles.textSecondary, { color: colors.primary }]}>
            Torna al Login
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;