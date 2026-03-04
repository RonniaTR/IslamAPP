import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Verse {
  number: number;
  arabic: string;
  turkish: string;
  english: string;
  page?: number;
  juz?: number;
  audio_url?: string;
}

interface SurahData {
  number: number;
  name: string;
  arabic_name: string;
  meaning: string;
  revelation: string;
  total_verses: number;
  verses: Verse[];
  full_audio_url?: string;
}

export default function SurahScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const surahNumber = parseInt(params.number as string) || 1;
  const { colors } = useTheme();
  const { language, t } = useLanguage();

  const [surah, setSurah] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);
  const [playMode, setPlayMode] = useState<'arabic' | 'tts-ar' | 'tts-tr' | 'tts-en'>('arabic');
  const [showTranslation, setShowTranslation] = useState(true);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchSurah();
    setupAudio();
    
    return () => {
      stopPlayback();
    };
  }, [surahNumber]);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const fetchSurah = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/quran/surah/${surahNumber}?lang=${language}`);
      if (response.ok) {
        const data = await response.json();
        setSurah(data);
      }
    } catch (error) {
      console.error('Error fetching surah:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopPlayback = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      await Speech.stop();
      setIsPlaying(false);
      setCurrentVerse(null);
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  const playVerseAudio = async (verse: Verse) => {
    if (!verse.audio_url) return;
    
    await stopPlayback();
    setIsPlaying(true);
    setCurrentVerse(verse.number);
    setPlayMode('arabic');

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: verse.audio_url },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            setCurrentVerse(null);
          }
        }
      );
      soundRef.current = sound;
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setCurrentVerse(null);
    }
  };

  const playAllVerses = async (mode: 'arabic' | 'tts-ar' | 'tts-tr' | 'tts-en') => {
    if (!surah) return;
    
    await stopPlayback();
    setIsPlaying(true);
    setPlayMode(mode);

    if (mode === 'arabic') {
      // Play from audio API
      playVerseSequence(0);
    } else {
      // Use TTS
      playTTSSequence(0, mode);
    }
  };

  const playVerseSequence = async (index: number) => {
    if (!surah || index >= surah.verses.length) {
      setIsPlaying(false);
      setCurrentVerse(null);
      return;
    }

    const verse = surah.verses[index];
    setCurrentVerse(verse.number);

    if (!verse.audio_url) {
      playVerseSequence(index + 1);
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: verse.audio_url },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setTimeout(() => playVerseSequence(index + 1), 300);
          }
        }
      );
      soundRef.current = sound;
    } catch (error) {
      console.error('Error playing verse:', error);
      playVerseSequence(index + 1);
    }
  };

  const playTTSSequence = async (index: number, mode: string) => {
    if (!surah || index >= surah.verses.length || !isPlaying) {
      setIsPlaying(false);
      setCurrentVerse(null);
      return;
    }

    const verse = surah.verses[index];
    setCurrentVerse(verse.number);

    let text = '';
    let lang = '';

    switch (mode) {
      case 'tts-ar':
        text = verse.arabic;
        lang = 'ar';
        break;
      case 'tts-tr':
        text = verse.turkish;
        lang = 'tr-TR';
        break;
      case 'tts-en':
        text = verse.english || verse.turkish;
        lang = 'en-US';
        break;
    }

    Speech.speak(text, {
      language: lang,
      rate: mode === 'tts-ar' ? 0.75 : 0.9,
      onDone: () => {
        setTimeout(() => playTTSSequence(index + 1, mode), 500);
      },
      onError: () => {
        playTTSSequence(index + 1, mode);
      },
    });
  };

  const speakVerse = (verse: Verse, lang: 'ar' | 'tr' | 'en') => {
    Speech.stop();
    setCurrentVerse(verse.number);
    
    let text = '';
    let speechLang = '';

    switch (lang) {
      case 'ar':
        text = verse.arabic;
        speechLang = 'ar';
        break;
      case 'tr':
        text = verse.turkish;
        speechLang = 'tr-TR';
        break;
      case 'en':
        text = verse.english || verse.turkish;
        speechLang = 'en-US';
        break;
    }

    Speech.speak(text, {
      language: speechLang,
      rate: lang === 'ar' ? 0.75 : 0.9,
      onDone: () => setCurrentVerse(null),
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!surah) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Sure bulunamadı</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.surahName, { color: colors.text }]}>{surah.name}</Text>
          <Text style={[styles.surahArabic, { color: colors.primary }]}>{surah.arabic_name}</Text>
        </View>
        <TouchableOpacity 
          style={styles.translateToggle}
          onPress={() => setShowTranslation(!showTranslation)}
        >
          <Ionicons 
            name={showTranslation ? "eye" : "eye-off"} 
            size={22} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      {/* Audio Controls */}
      <View style={[styles.audioControls, { backgroundColor: colors.surface }]}>
        {!isPlaying ? (
          <View style={styles.audioButtons}>
            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: colors.primary }]}
              onPress={() => playAllVerses('arabic')}
            >
              <Ionicons name="headset" size={18} color="#fff" />
              <Text style={styles.playButtonText}>Hafız</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: '#8b5cf6' }]}
              onPress={() => playAllVerses('tts-ar')}
            >
              <Ionicons name="volume-high" size={18} color="#fff" />
              <Text style={styles.playButtonText}>Arapça</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: '#3b82f6' }]}
              onPress={() => playAllVerses('tts-tr')}
            >
              <Ionicons name="chatbubble" size={18} color="#fff" />
              <Text style={styles.playButtonText}>Türkçe</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: '#f59e0b' }]}
              onPress={() => playAllVerses('tts-en')}
            >
              <Ionicons name="globe" size={18} color="#fff" />
              <Text style={styles.playButtonText}>English</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.playingControls}>
            <TouchableOpacity
              style={[styles.stopButton, { backgroundColor: colors.error }]}
              onPress={stopPlayback}
            >
              <Ionicons name="stop" size={20} color="#fff" />
              <Text style={styles.playButtonText}>Durdur</Text>
            </TouchableOpacity>
            <View style={styles.nowPlayingInfo}>
              <Ionicons name="musical-notes" size={16} color={colors.primary} />
              <Text style={[styles.nowPlayingText, { color: colors.textSecondary }]}>
                Ayet {currentVerse} • {playMode === 'arabic' ? 'Hafız' : playMode === 'tts-ar' ? 'Arapça TTS' : playMode === 'tts-tr' ? 'Türkçe' : 'English'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Surah Info */}
      <View style={[styles.surahInfo, { backgroundColor: colors.surface }]}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={14} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{surah.revelation}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="list" size={14} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{surah.total_verses} Ayet</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={14} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{surah.meaning}</Text>
          </View>
        </View>
      </View>

      {/* Bismillah */}
      {surahNumber !== 9 && surahNumber !== 1 && (
        <View style={[styles.bismillah, { backgroundColor: colors.surface }]}>
          <Text style={[styles.bismillahText, { color: colors.primary }]}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
        </View>
      )}

      {/* Verses */}
      <ScrollView style={styles.versesContainer}>
        {surah.verses.map((verse) => (
          <View 
            key={verse.number} 
            style={[
              styles.verseCard, 
              { backgroundColor: colors.surface },
              currentVerse === verse.number && { borderColor: colors.primary, borderWidth: 2 }
            ]}
          >
            <View style={styles.verseHeader}>
              <View style={[styles.verseNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.verseNumberText}>{verse.number}</Text>
              </View>
              <View style={styles.verseActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.surfaceLight }]}
                  onPress={() => playVerseAudio(verse)}
                >
                  <Ionicons name="headset" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.surfaceLight }]}
                  onPress={() => speakVerse(verse, 'ar')}
                >
                  <Ionicons name="volume-high" size={16} color="#8b5cf6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.surfaceLight }]}
                  onPress={() => speakVerse(verse, 'tr')}
                >
                  <Ionicons name="chatbubble" size={16} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={[styles.arabicText, { color: colors.text }]}>
              {verse.arabic}
            </Text>
            
            {showTranslation && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.translationText, { color: colors.textSecondary }]}>
                  {verse.turkish}
                </Text>
                {verse.english && language === 'en' && (
                  <Text style={[styles.englishText, { color: colors.textMuted }]}>
                    {verse.english}
                  </Text>
                )}
              </>
            )}
          </View>
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  surahName: {
    fontSize: 18,
    fontWeight: '700',
  },
  surahArabic: {
    fontSize: 14,
    marginTop: 2,
  },
  translateToggle: {
    padding: 8,
  },
  audioControls: {
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  audioButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  playButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  playingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 6,
  },
  nowPlayingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nowPlayingText: {
    fontSize: 13,
  },
  surahInfo: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
  },
  bismillah: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bismillahText: {
    fontSize: 26,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'serif',
  },
  versesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  verseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  verseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseNumberText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  verseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabicText: {
    fontSize: 24,
    lineHeight: 42,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'serif',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  translationText: {
    fontSize: 15,
    lineHeight: 24,
  },
  englishText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: 40,
  },
});
