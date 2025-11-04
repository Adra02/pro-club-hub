import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { globalStyles, colors } from '../../styles/global';

const LoadingScreen = () => {
  return (
    <View style={globalStyles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[globalStyles.text, { marginTop: 16 }]}>Caricamento...</Text>
    </View>
  );
};

export default LoadingScreen;