import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function SignInScreen() {
  const handleGoogleSignIn = () => {
    Linking.openURL(`${API_URL}/auth/google`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Travel Itinerary</Text>
      <Text style={styles.subtitle}>Organize all your trip bookings in one place.</Text>
      <TouchableOpacity style={styles.button} onPress={handleGoogleSignIn}>
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
  button: { backgroundColor: '#4285F4', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
