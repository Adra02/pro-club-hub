import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { globalStyles, colors } from '../../styles/global';
import { layout } from '../../styles/global';

const WelcomeScreen = ({ navigation }) => {
  const { t } = useTranslation();

  return (
    <View style={[globalStyles.container, { padding: 24 }]}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Logo/Icon */}
        <View
          style={{
            width: 120,
            height: 120,
            backgroundColor: colors.primary,
            borderRadius: 60,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <Text style={{ fontSize: 48, color: colors.textPrimary, fontWeight: 'bold' }}>
            ⚽
          </Text>
        </View>

        {/* Title */}
        <Text style={[globalStyles.header, { textAlign: 'center', marginBottom: 8 }]}>
          PRO CLUB HUB
        </Text>
        <Text
          style={[
            globalStyles.textSecondary,
            { textAlign: 'center', marginBottom: 48, fontSize: 16 },
          ]}
        >
          La piattaforma definitiva per i club di calcio virtuali
        </Text>

        {/* Features */}
        <View style={{ width: '100%', marginBottom: 48 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 24,
                height: 24,
                backgroundColor: colors.primary,
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: 'bold' }}>✓</Text>
            </View>
            <Text style={[globalStyles.text, { flex: 1 }]}>
              Trova giocatori e squadre
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 24,
                height: 24,
                backgroundColor: colors.primary,
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: 'bold' }}>✓</Text>
            </View>
            <Text style={[globalStyles.text, { flex: 1 }]}>
              Gestisci le tue richieste
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 24,
                height: 24,
                backgroundColor: colors.primary,
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: 'bold' }}>✓</Text>
            </View>
            <Text style={[globalStyles.text, { flex: 1 }]}>
              Lascia e ricevi feedback
            </Text>
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View style={{ width: '100%' }}>
        <TouchableOpacity
          style={globalStyles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={globalStyles.buttonText}>
            ACCEDI
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[globalStyles.buttonSecondary, { marginTop: 12 }]}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={globalStyles.buttonSecondaryText}>
            REGISTRATI
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WelcomeScreen;