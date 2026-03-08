import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function LoginScreen({ navigation, onLogin }) {
  const handleLogin = () => {
    // Navigate immediately for demo purposes
    if (onLogin) onLogin();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IslamAPP</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1F14', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#D4AF37', fontSize: 32, fontWeight: 'bold', marginBottom: 40 },
  button: { backgroundColor: '#D4AF37', padding: 15, borderRadius: 8, width: 200, alignItems: 'center' },
  buttonText: { color: '#0A1F14', fontSize: 18, fontWeight: 'bold' },
});
