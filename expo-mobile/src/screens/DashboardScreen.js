import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BookOpen, Volume2, Moon, Compass, Share2, ChevronRight, Check, Users, Play, Pause } from 'lucide-react-native';
import api from '../api';

// ─── Constants & Colors ───
const COLORS = {
  bg: '#0A1F14',
  gold: '#D4AF37',
  lightGold: '#E8C84A',
  textMain: '#F5F5DC',
  textMuted: '#A8B5A0',
  cardBg: 'rgba(15,61,46,0.5)',
  cardBorder: 'rgba(212,175,55,0.1)',
};

// ─── Header Component ───
function DashboardHeader({ userName }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerSub}>BİSMİLLAHİRRAHMANİRRAHİM</Text>
      <Text style={styles.headerTitle}>Selam{userName ? `, ${userName}` : ''}</Text>
    </View>
  );
}

// ─── Mood Section ───
function MoodSection() {
  const moods = [
    { id: 'huzur', label: 'Huzur', icon: '☮️', desc: 'İç huzur ve sükûnet' },
    { id: 'motivasyon', label: 'Motivasyon', icon: '🔥', desc: 'Güç ve azim' },
    { id: 'sabir', label: 'Sabır', icon: '🌿', desc: 'Dayanma gücü' },
    { id: 'sukur', label: 'Şükür', icon: '✨', desc: 'Nimete şükretmek' },
  ];

  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMood = async (id) => {
    setSelected(id);
    setLoading(true);
    try {
      const { data } = await api.get(`/mood/${id}`);
      setContent(data);
    } catch {
      setContent(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Bugün kalbin neye ihtiyaç duyuyor?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {moods.map((m) => (
          <TouchableOpacity 
            key={m.id} 
            style={[styles.moodCard, selected === m.id && { backgroundColor: 'rgba(212,175,55,0.2)' }]}
            onPress={() => handleMood(m.id)}
          >
            <Text style={styles.moodIcon}>{m.icon}</Text>
            <Text style={styles.moodLabel}>{m.label}</Text>
            <Text style={styles.moodDesc}>{m.desc}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {loading && <ActivityIndicator size="small" color={COLORS.gold} style={{ marginTop: 16 }} />}
      {content && !loading && (
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.arabicText}>{content.ayet.arabic}</Text>
          <Text style={styles.turkishText}>{content.ayet.turkish}</Text>
          <Text style={styles.cardMeta}>— {content.ayet.sure}</Text>
          
          <View style={[styles.actionRow, { marginTop: 12 }]}>
            <Text style={[styles.turkishText, {fontStyle: 'italic', marginBottom: 4}]}>"{content.hadis.turkish}"</Text>
            <Text style={styles.cardMeta}>— {content.hadis.source}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Daily Verse Card ───
function DailyVerse({ verse }) {
  if (!verse) return <ActivityIndicator color={COLORS.gold} />;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.iconRow}>
          <BookOpen size={16} color={COLORS.gold} />
          <Text style={styles.cardTitleGold}>Günün Ayeti</Text>
        </View>
        <Text style={styles.cardMeta}>{verse.surah_name} - {verse.verse_number}</Text>
      </View>
      <Text style={styles.arabicText}>{verse.arabic}</Text>
      <Text style={styles.turkishText}>{verse.turkish}</Text>
      
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <Volume2 size={12} color={COLORS.gold} />
          <Text style={styles.actionBtnText}>Dinle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Share2 size={12} color={COLORS.gold} />
          <Text style={styles.actionBtnText}>Paylaş</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Dhikr Widget ───
function DhikrWidget() {
  return (
    <TouchableOpacity style={styles.dhikrCollapsedCard}>
      <View style={styles.dhikrIconBg}>
        <Text style={{ fontSize: 18 }}>📿</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.dhikrTitle}>Zikir Sayacı</Text>
        <Text style={styles.dhikrSub}>Zikir başlat</Text>
      </View>
      <ChevronRight size={16} color={COLORS.gold} />
    </TouchableOpacity>
  );
}

// ─── Main Dashboard Screen ───
export default function DashboardScreen({ navigation }) {
  const [randomVerse, setRandomVerse] = useState(null);

  useEffect(() => {
    api.get('/quran/random').then(r => setRandomVerse(r.data)).catch((err) => console.log('API Error:', err));
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <DashboardHeader userName="" />
      <MoodSection />
      {randomVerse ? <DailyVerse verse={randomVerse} /> : <ActivityIndicator size="large" color={COLORS.gold} />}
      
      <View style={{ paddingHorizontal: 16, flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: COLORS.cardBg, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder }} onPress={() => navigation.navigate('Quiz')}>
           <Text style={{ fontSize: 24, marginBottom: 8 }}>🏆</Text>
           <Text style={{ color: COLORS.textMain, fontSize: 14, fontWeight: 'bold' }}>İslam Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, backgroundColor: COLORS.cardBg, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder }} onPress={() => navigation.navigate('Scholars')}>
           <Text style={{ fontSize: 24, marginBottom: 8 }}>💡</Text>
           <Text style={{ color: COLORS.textMain, fontSize: 14, fontWeight: 'bold' }}>Hocalara Sor</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, backgroundColor: COLORS.cardBg, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder }} onPress={() => navigation.navigate('Ramadan')}>
           <Text style={{ fontSize: 24, marginBottom: 8 }}>🌙</Text>
           <Text style={{ color: COLORS.textMain, fontSize: 14, fontWeight: 'bold' }}>Ramazan</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding: 16 }}>
        <DhikrWidget />
      </View>
    </ScrollView>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerSub: {
    color: COLORS.gold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textMain,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.gold,
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  moodCard: {
    width: 110,
    backgroundColor: 'rgba(15,61,46,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.08)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  moodIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  moodDesc: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitleGold: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gold,
    marginLeft: 6,
  },
  cardMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  arabicText: {
    fontSize: 20,
    color: COLORS.textMain,
    marginBottom: 12,
    textAlign: 'right',
    lineHeight: 32,
  },
  turkishText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 12,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212,175,55,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.gold,
  },
  dhikrCollapsedCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dhikrIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dhikrTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  dhikrSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
