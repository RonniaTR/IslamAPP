import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SurahDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Surah Detail Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1F14', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#FFF', fontSize: 20 },
});
