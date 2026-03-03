import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

interface Surah {
  number: number;
  name: string;
  arabic: string;
  turkish_name?: string;
  meaning: string;
  verses: number;
  revelation: string;
}

interface Verse {
  number: number;
  arabic: string;
  turkish: string;
  page?: number;
  juz?: number;
}

interface SurahDetail {
  number: number;
  name: string;
  arabic_name: string;
  meaning: string;
  revelation: string;
  total_verses: number;
  verses: Verse[];
}

export default function QuranScreen() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurah, setSelectedSurah] = useState<SurahDetail | null>(null);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [userId, setUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [dailyVerse, setDailyVerse] = useState<any>(null);

  useEffect(() => {
    initUser();
    fetchSurahs();
    fetchDailyVerse();
  }, []);

  const initUser = async () => {
    let storedUserId = await AsyncStorage.getItem('user_id');
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('user_id', storedUserId);
    }
    setUserId(storedUserId);
    loadBookmarks(storedUserId);
  };

  const fetchSurahs = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/quran/surahs`);
      setSurahs(res.data);
    } catch (error) {
      console.error('Error fetching surahs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyVerse = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/quran/random`);
      setDailyVerse(res.data);
    } catch (error) {
      console.error('Error fetching daily verse:', error);
    }
  };

  const loadBookmarks = async (uid: string) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/quran/bookmarks/${uid}`);
      setBookmarks(res.data);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const openSurah = async (surahNumber: number) => {
    setShowModal(true);
    setLoadingVerses(true);
    
    try {
      const res = await axios.get(`${BACKEND_URL}/api/quran/surah/${surahNumber}`);
      setSelectedSurah(res.data);
    } catch (error) {
      console.error('Error fetching surah:', error);
      setSelectedSurah(null);
    } finally {
      setLoadingVerses(false);
    }
  };

  const addBookmark = async (surah: number, verse: number) => {
    try {
      await axios.post(`${BACKEND_URL}/api/quran/bookmark?user_id=${userId}&surah=${surah}&verse=${verse}`);
      loadBookmarks(userId);
      // Log activity for gamification
      await axios.post(`${BACKEND_URL}/api/gamification/activity`, {
        user_id: userId,
        activity_type: 'quran_read',
        details: `Surah ${surah}, Verse ${verse}`,
      });
    } catch (error) {
      console.error('Error adding bookmark:', error);
    }
  };

  const searchQuran = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;
    
    setSearching(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/quran/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data.results || []);
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSurah(null);
  };

  const renderSurahItem = ({ item }: { item: Surah }) => (
    <TouchableOpacity
      style={styles.surahItem}
      onPress={() => openSurah(item.number)}
    >
      <View style={styles.surahNumber}>
        <Text style={styles.surahNumberText}>{item.number}</Text>
      </View>
      <View style={styles.surahInfo}>
        <View style={styles.surahNameRow}>
          <Text style={styles.surahName}>{item.name}</Text>
          <Text style={styles.surahArabic}>{item.arabic}</Text>
        </View>
        <Text style={styles.surahDetails}>
          {item.meaning} • {item.verses} Ayet • {item.revelation}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#64748b" />
    </TouchableOpacity>
  );

  const renderVerseItem = ({ item, index }: { item: Verse; index: number }) => (
    <View style={styles.verseCard}>
      <View style={styles.verseHeader}>
        <View style={styles.verseNumberBadge}>
          <Text style={styles.verseNumberText}>{item.number}</Text>
        </View>
        <View style={styles.verseActions}>
          {item.juz && (
            <View style={styles.juzBadge}>
              <Text style={styles.juzText}>Cüz {item.juz}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => addBookmark(selectedSurah?.number || 0, item.number)}
            style={styles.bookmarkButton}
          >
            <Ionicons name="bookmark-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.verseArabic}>{item.arabic}</Text>
      <View style={styles.verseDivider} />
      <Text style={styles.verseTurkish}>{item.turkish}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Kur'an-ı Kerim yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Kur'an-ı Kerim</Text>
            <Text style={styles.headerSubtitle}>114 Sure • 6236 Ayet</Text>
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name={showSearch ? "close" : "search"} size={24} color="#10b981" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#64748b" />
              <TextInput
                style={styles.searchInput}
                placeholder="Kur'an'da ara..."
                placeholderTextColor="#64748b"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchQuran}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                  <Ionicons name="close-circle" size={20} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.searchSubmit} onPress={searchQuran}>
              <Text style={styles.searchSubmitText}>Ara</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Search Results */}
      {showSearch && searchResults.length > 0 ? (
        <ScrollView style={styles.searchResults}>
          <Text style={styles.searchResultsTitle}>{searchResults.length} sonuç bulundu</Text>
          {searchResults.map((result, index) => (
            <TouchableOpacity
              key={index}
              style={styles.searchResultItem}
              onPress={() => {
                setShowSearch(false);
                openSurah(result.surah_number);
              }}
            >
              <View style={styles.searchResultHeader}>
                <Text style={styles.searchResultSurah}>{result.surah_name}</Text>
                <Text style={styles.searchResultVerse}>Ayet {result.verse_number}</Text>
              </View>
              <Text style={styles.searchResultArabic} numberOfLines={1}>{result.arabic}</Text>
              <Text style={styles.searchResultTurkish} numberOfLines={2}>{result.turkish}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={surahs}
          renderItem={renderSurahItem}
          keyExtractor={(item) => item.number.toString()}
          contentContainerStyle={styles.surahList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <>
              {/* Daily Verse */}
              {dailyVerse && (
                <View style={styles.dailyVerse}>
                  <View style={styles.dailyVerseHeader}>
                    <Ionicons name="sparkles" size={20} color="#f59e0b" />
                    <Text style={styles.dailyVerseTitle}>Günün Ayeti</Text>
                  </View>
                  <Text style={styles.dailyVerseArabic}>{dailyVerse.arabic}</Text>
                  <Text style={styles.dailyVerseTurkish}>{dailyVerse.turkish}</Text>
                  <Text style={styles.dailyVerseSource}>
                    {dailyVerse.surah_name}, {dailyVerse.verse_number}. Ayet
                  </Text>
                </View>
              )}

              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Ionicons name="book" size={20} color="#10b981" />
                  <Text style={styles.statValue}>114</Text>
                  <Text style={styles.statLabel}>Sure</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="document-text" size={20} color="#3b82f6" />
                  <Text style={styles.statValue}>6236</Text>
                  <Text style={styles.statLabel}>Ayet</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="bookmark" size={20} color="#f59e0b" />
                  <Text style={styles.statValue}>{bookmarks.length}</Text>
                  <Text style={styles.statLabel}>Yer İmi</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Sureler</Text>
            </>
          )}
        />
      )}

      {/* Surah Detail Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.modalClose}>
              <Ionicons name="close" size={24} color="#f8fafc" />
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              {selectedSurah && (
                <>
                  <Text style={styles.modalTitle}>{selectedSurah.name}</Text>
                  <Text style={styles.modalSubtitle}>{selectedSurah.arabic_name}</Text>
                </>
              )}
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Surah Info */}
          {selectedSurah && (
            <View style={styles.surahInfoBar}>
              <Text style={styles.surahInfoText}>
                {selectedSurah.meaning} • {selectedSurah.total_verses} Ayet • {selectedSurah.revelation}
              </Text>
            </View>
          )}

          {/* Verses */}
          {loadingVerses ? (
            <View style={styles.versesLoading}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.loadingText}>Ayetler yükleniyor...</Text>
            </View>
          ) : selectedSurah?.verses ? (
            <FlatList
              data={selectedSurah.verses}
              renderItem={renderVerseItem}
              keyExtractor={(item) => item.number.toString()}
              contentContainerStyle={styles.versesList}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          ) : (
            <View style={styles.noVerses}>
              <Ionicons name="book-outline" size={48} color="#64748b" />
              <Text style={styles.noVersesText}>
                Ayetler yüklenemedi.
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 16,
    paddingVertical: 12,
  },
  searchSubmit: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  searchSubmitText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  searchResults: {
    flex: 1,
    padding: 16,
  },
  searchResultsTitle: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 12,
  },
  searchResultItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  searchResultSurah: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  searchResultVerse: {
    color: '#64748b',
    fontSize: 12,
  },
  searchResultArabic: {
    color: '#f8fafc',
    fontSize: 18,
    textAlign: 'right',
    marginBottom: 8,
  },
  searchResultTurkish: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  dailyVerse: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  dailyVerseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dailyVerseTitle: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  dailyVerseArabic: {
    color: '#f8fafc',
    fontSize: 20,
    textAlign: 'right',
    lineHeight: 32,
    marginBottom: 12,
  },
  dailyVerseTurkish: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  dailyVerseSource: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  surahList: {
    padding: 16,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  surahNumber: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  surahNumberText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  surahInfo: {
    flex: 1,
  },
  surahNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  surahName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  surahArabic: {
    color: '#10b981',
    fontSize: 18,
  },
  surahDetails: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalClose: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleContainer: {
    alignItems: 'center',
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
  },
  modalSubtitle: {
    color: '#10b981',
    fontSize: 20,
    marginTop: 4,
  },
  surahInfoBar: {
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  surahInfoText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  versesList: {
    padding: 16,
  },
  versesLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  verseNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b98120',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseNumberText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  verseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  juzBadge: {
    backgroundColor: '#3b82f620',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  juzText: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '500',
  },
  bookmarkButton: {
    padding: 4,
  },
  verseArabic: {
    color: '#f8fafc',
    fontSize: 24,
    textAlign: 'right',
    lineHeight: 42,
  },
  verseDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 16,
  },
  verseTurkish: {
    color: '#e2e8f0',
    fontSize: 16,
    lineHeight: 26,
  },
  noVerses: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVersesText: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
});
