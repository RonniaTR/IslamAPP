import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

// Mock user state for now until AuthContext is moved
export default function App() {
  const [user, setUser] = useState(null); // Set to true to test logged in state

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator user={user} />
    </SafeAreaProvider>
  );
}
