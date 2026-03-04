import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const { login, loginAsGuest, isLoading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const handleGoogleLogin = () => {
    login();
  };

  const handleGuestLogin = async () => {
    await loginAsGuest();
    router.replace('/(tabs)');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e3a5f', '#0f172a']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.content}>
          {/* Logo & Title */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="moon" size={64} color="#10b981" />
            </View>
            <Text style={styles.title}>İslami Yaşam Asistanı</Text>
            <Text style={styles.subtitle}>Dijital İlim ve İbadet Rehberiniz</Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <Ionicons name="book" size={24} color="#10b981" />
                <Text style={styles.featureText}>Kur'an-ı Kerim</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="time" size={24} color="#f59e0b" />
                <Text style={styles.featureText}>Namaz Vakitleri</Text>
              </View>
            </View>
            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <Ionicons name="chatbubbles" size={24} color="#8b5cf6" />
                <Text style={styles.featureText}>AI Danışman</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="game-controller" size={24} color="#ec4899" />
                <Text style={styles.featureText}>Bilgi Yarışması</Text>
              </View>
            </View>
          </View>

          {/* Login Buttons */}
          <View style={styles.loginButtons}>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
            >
              <Image
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Google ile Giriş Yap</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestLogin}
            >
              <Ionicons name="person-outline" size={20} color="#94a3b8" />
              <Text style={styles.guestButtonText}>Misafir Olarak Devam Et</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Giriş yaparak tüm özelliklere erişin{"\n"}
              Puanlarınızı kaydedin, yarışmalara katılın
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  features: {
    marginBottom: 48,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  featureItem: {
    alignItems: 'center',
    width: '40%',
  },
  featureText: {
    color: '#cbd5e1',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  loginButtons: {
    gap: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  guestButtonText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
