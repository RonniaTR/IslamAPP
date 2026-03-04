import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface QuizCategory {
  id: string;
  name: string;
  name_en: string;
  description: string;
  icon: string;
  color: string;
}

interface QuizRoom {
  id: string;
  name: string;
  category: string;
  host_name: string;
  player_count: number;
  max_players: number;
  question_count: number;
  status: string;
}

export default function QuizScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'lobby' | 'solo' | 'leaderboard'>('lobby');
  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [rooms, setRooms] = useState<QuizRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [roomName, setRoomName] = useState('');
  const [username, setUsername] = useState('Oyuncu' + Math.floor(Math.random() * 1000));
  const [userId] = useState('user_' + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, roomsRes] = await Promise.all([
        fetch(`${API_BASE}/api/quiz/categories`),
        fetch(`${API_BASE}/api/quiz/rooms?status=waiting`),
      ]);
      
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
        if (catData.length > 0 && !selectedCategory) {
          setSelectedCategory(catData[0].id);
        }
      }
      
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(roomsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const createRoom = async () => {
    if (!roomName.trim() || !selectedCategory) {
      Alert.alert('Hata', 'Lütfen oda adı ve kategori seçin');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/quiz/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          username: username,
          category: selectedCategory,
          room_name: roomName,
          question_count: 10,
          time_per_question: 20,
        }),
      });

      if (response.ok) {
        const room = await response.json();
        setShowCreateModal(false);
        setRoomName('');
        router.push({
          pathname: '/quiz-game',
          params: { 
            roomId: room.id, 
            isHost: 'true',
            userId: userId,
            username: username
          }
        });
      } else {
        Alert.alert('Hata', 'Oda oluşturulamadı');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('Hata', 'Bağlantı hatası');
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/quiz/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          username: username,
        }),
      });

      if (response.ok) {
        router.push({
          pathname: '/quiz-game',
          params: { 
            roomId: roomId, 
            isHost: 'false',
            userId: userId,
            username: username
          }
        });
      } else {
        const error = await response.json();
        Alert.alert('Hata', error.detail || 'Odaya katılınamadı');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      Alert.alert('Hata', 'Bağlantı hatası');
    }
  };

  const startSoloQuiz = (categoryId: string) => {
    router.push({
      pathname: '/quiz-solo',
      params: { 
        category: categoryId,
        userId: userId,
        username: username
      }
    });
  };

  const getIconName = (iconName: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      'moon': 'moon',
      'hand-left': 'hand-left',
      'book': 'book',
      'library': 'library',
      'scale': 'scale',
    };
    return iconMap[iconName] || 'help-circle';
  };

  const getCategoryColor = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#10b981';
  };

  const renderLobby = () => (
    <View style={styles.tabContent}>
      <View style={styles.usernameContainer}>
        <Text style={styles.usernameLabel}>Kullanıcı Adınız:</Text>
        <TextInput
          style={styles.usernameInput}
          value={username}
          onChangeText={setUsername}
          placeholder="Kullanıcı adı"
          placeholderTextColor="#64748b"
        />
      </View>

      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.createButtonText}>Yeni Oda Oluştur</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Açık Odalar</Text>
      
      {rooms.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="game-controller-outline" size={48} color="#64748b" />
          <Text style={styles.emptyText}>Henüz açık oda yok</Text>
          <Text style={styles.emptySubtext}>İlk odayı sen oluştur!</Text>
        </View>
      ) : (
        rooms.map(room => (
          <TouchableOpacity
            key={room.id}
            style={styles.roomCard}
            onPress={() => joinRoom(room.id)}
          >
            <View style={styles.roomInfo}>
              <Text style={styles.roomName}>{room.name}</Text>
              <View style={styles.roomMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(room.category) + '30' }]}>
                  <Text style={[styles.categoryText, { color: getCategoryColor(room.category) }]}>
                    {categories.find(c => c.id === room.category)?.name || room.category}
                  </Text>
                </View>
                <Text style={styles.hostText}>Host: {room.host_name}</Text>
              </View>
            </View>
            <View style={styles.roomStats}>
              <View style={styles.playerCount}>
                <Ionicons name="people" size={16} color="#64748b" />
                <Text style={styles.playerText}>{room.player_count}/{room.max_players}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748b" />
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderSolo = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Tek Başına Oyna</Text>
      <Text style={styles.sectionSubtitle}>Kategori seç ve bilgini test et!</Text>
      
      <View style={styles.categoriesGrid}>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryCard, { borderColor: category.color }]}
            onPress={() => startSoloQuiz(category.id)}
          >
            <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '20' }]}>
              <Ionicons name={getIconName(category.icon)} size={32} color={category.color} />
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categoryDesc} numberOfLines={2}>{category.description}</Text>
            <View style={styles.playButton}>
              <Text style={[styles.playButtonText, { color: category.color }]}>Oyna</Text>
              <Ionicons name="play" size={16} color={category.color} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderLeaderboard = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Liderlik Tablosu</Text>
      <Text style={styles.sectionSubtitle}>En yüksek puanlı oyuncular</Text>
      
      <LeaderboardList userId={userId} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#10b981" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İslami Bilgi Yarışması</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'lobby' && styles.activeTab]}
          onPress={() => setActiveTab('lobby')}
        >
          <Ionicons 
            name="people" 
            size={20} 
            color={activeTab === 'lobby' ? '#10b981' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'lobby' && styles.activeTabText]}>
            Çok Oyunculu
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'solo' && styles.activeTab]}
          onPress={() => setActiveTab('solo')}
        >
          <Ionicons 
            name="person" 
            size={20} 
            color={activeTab === 'solo' ? '#10b981' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'solo' && styles.activeTabText]}>
            Tek Oyuncu
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Ionicons 
            name="trophy" 
            size={20} 
            color={activeTab === 'leaderboard' ? '#10b981' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
            Sıralama
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
        }
      >
        {activeTab === 'lobby' && renderLobby()}
        {activeTab === 'solo' && renderSolo()}
        {activeTab === 'leaderboard' && renderLeaderboard()}
      </ScrollView>

      {/* Create Room Modal */}
      {showCreateModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Oda Oluştur</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Oda Adı</Text>
            <TextInput
              style={styles.input}
              value={roomName}
              onChangeText={setRoomName}
              placeholder="Oda adı girin"
              placeholderTextColor="#64748b"
            />
            
            <Text style={styles.inputLabel}>Kategori</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color }
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === cat.id && { color: '#fff' }
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity style={styles.createRoomButton} onPress={createRoom}>
              <Text style={styles.createRoomButtonText}>Oda Oluştur</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Leaderboard Component with Filters
function LeaderboardList({ userId }: { userId: string }) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'weekly' | 'monthly'>('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const response = await fetch(`${baseUrl}/api/quiz/leaderboard?limit=20&period=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCountryFlag = (index: number): string => {
    const flags = ['🇹🇷', '🇸🇦', '🇪🇬', '🇮🇩', '🇵🇰', '🇲🇾', '🇦🇪', '🇶🇦'];
    return flags[index % flags.length];
  };

  if (loading) {
    return <ActivityIndicator size="small" color="#10b981" />;
  }

  return (
    <View>
      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            Tümü
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'weekly' && styles.filterTabActive]}
          onPress={() => setFilter('weekly')}
        >
          <Text style={[styles.filterTabText, filter === 'weekly' && styles.filterTabTextActive]}>
            Bu Hafta
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'monthly' && styles.filterTabActive]}
          onPress={() => setFilter('monthly')}
        >
          <Text style={[styles.filterTabText, filter === 'monthly' && styles.filterTabTextActive]}>
            Bu Ay
          </Text>
        </TouchableOpacity>
      </View>

      {leaderboard.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={48} color="#64748b" />
          <Text style={styles.emptyText}>Henüz sıralama yok</Text>
          <Text style={styles.emptySubtext}>İlk quiz'i tamamlayan sen ol!</Text>
        </View>
      ) : (
        <>
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <View style={styles.podiumContainer}>
              {/* 2nd Place */}
              <View style={styles.podiumItem}>
                <View style={[styles.podiumAvatar, styles.podiumSecond]}>
                  <Text style={styles.podiumAvatarText}>🥈</Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {leaderboard[1]?.user_id?.substring(0, 6)}
                </Text>
                <Text style={styles.podiumPoints}>{leaderboard[1]?.total_points || 0}</Text>
                <View style={[styles.podiumBar, styles.podiumBarSecond]} />
              </View>
              
              {/* 1st Place */}
              <View style={styles.podiumItem}>
                <View style={[styles.podiumAvatar, styles.podiumFirst]}>
                  <Text style={styles.podiumAvatarText}>👑</Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {leaderboard[0]?.user_id?.substring(0, 6)}
                </Text>
                <Text style={styles.podiumPoints}>{leaderboard[0]?.total_points || 0}</Text>
                <View style={[styles.podiumBar, styles.podiumBarFirst]} />
              </View>
              
              {/* 3rd Place */}
              <View style={styles.podiumItem}>
                <View style={[styles.podiumAvatar, styles.podiumThird]}>
                  <Text style={styles.podiumAvatarText}>🥉</Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {leaderboard[2]?.user_id?.substring(0, 6)}
                </Text>
                <Text style={styles.podiumPoints}>{leaderboard[2]?.total_points || 0}</Text>
                <View style={[styles.podiumBar, styles.podiumBarThird]} />
              </View>
            </View>
          )}

          {/* Rest of leaderboard */}
          {leaderboard.slice(3).map((player, index) => (
            <View 
              key={player.user_id} 
              style={[
                styles.leaderboardItem,
                player.user_id === userId && styles.currentUserItem
              ]}
            >
              <View style={styles.rankContainer}>
                <Text style={styles.rankText}>{index + 4}</Text>
              </View>
              <Text style={styles.countryFlag}>{getCountryFlag(index)}</Text>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.user_id.substring(0, 8)}...</Text>
                <Text style={styles.playerStats}>
                  {player.games_won || 0} galibiyet • %{player.accuracy || 0} doğruluk
                </Text>
              </View>
              <View style={styles.pointsContainer}>
                <Text style={styles.pointsText}>{player.total_points || 0}</Text>
                <Text style={styles.pointsLabel}>puan</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#0f172a',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#10b981',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  usernameContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  usernameLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  usernameInput: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  roomCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  roomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hostText: {
    fontSize: 12,
    color: '#64748b',
  },
  roomStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playerText: {
    fontSize: 14,
    color: '#64748b',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  categoryDesc: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 16,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  inputLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  categoryScroll: {
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  createRoomButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createRoomButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  leaderboardItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentUserItem: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748b',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  playerStats: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  // New Leaderboard Styles
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#10b981',
  },
  filterTabText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 24,
    paddingTop: 20,
  },
  podiumItem: {
    alignItems: 'center',
    width: '30%',
  },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  podiumFirst: {
    backgroundColor: '#fbbf24',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  podiumSecond: {
    backgroundColor: '#94a3b8',
  },
  podiumThird: {
    backgroundColor: '#cd7f32',
  },
  podiumAvatarText: {
    fontSize: 24,
  },
  podiumName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  podiumPoints: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  podiumBar: {
    width: '80%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  podiumBarFirst: {
    height: 80,
    backgroundColor: '#fbbf2440',
  },
  podiumBarSecond: {
    height: 60,
    backgroundColor: '#94a3b840',
  },
  podiumBarThird: {
    height: 50,
    backgroundColor: '#cd7f3240',
  },
  countryFlag: {
    fontSize: 18,
    marginRight: 8,
  },
});
