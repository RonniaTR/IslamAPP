import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, Play, Pause, BookMarked, Share2 } from 'lucide-react-native';

const COLORS = {
  bg: '#0A1F14',
  gold: '#D4AF37',
  textMain: '#F5F5DC',
  textMuted: '#A8B5A0',
  cardBg: 'rgba(15,61,46,0.3)',
  cardBgActive: 'rgba(16, 185, 129, 0.1)',
};

export default function SurahDetailScreen({ navigation, route }) {
  // Defensive check since we are using dummy data without an API
  const surahName = route.params?.surahName || "Sure Adı";
  const surahNumber = route.params?.surahNumber || "?";

  const [playingVerse, setPlayingVerse] = useState(null);

  const dummyVerses = [
    {
      number: 1,
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      turkish: "Rahmân ve Rahîm olan Allah'ın adıyla.",
    },
    {
      number: 2,
      arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      turkish: "Hamd, âlemlerin Rabbi olan Allah'a mahsustur.",
    },
    {
      number: 3,
      arabic: "الرَّحْمَٰنِ الرَّحِيمِ",
      turkish: "O, Rahmân'dır, Rahîm'dir.",
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.gold} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
            <Text style={styles.arabicName}>الفاتحة</Text>
            <Text style={styles.title}>{surahName}</Text>
            <Text style={styles.meta}>Açılış · 7 Ayet · Mekke</Text>
        </View>
      </View>

      {/* Verses */}
      <ScrollView contentContainerStyle={styles.list}>
        {dummyVerses.map((verse) => (
          <View 
            key={verse.number} 
            style={[
              styles.verseCard,
              playingVerse === verse.number && styles.verseCardActive
            ]}
          >
            <View style={styles.verseHeader}>
              <View style={styles.verseBadge}>
                <Text style={styles.verseBadgeText}>{verse.number}</Text>
              </View>
              
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.iconBtn}>
                  <BookMarked size={16} color="#FBBF24" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}>
                  <Share2 size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.iconBtn, playingVerse === verse.number && styles.iconBtnActive]}
                  onPress={() => setPlayingVerse(playingVerse === verse.number ? null : verse.number)}
                >
                  {playingVerse === verse.number ? (
                    <Pause size={16} color="#FFF" />
                  ) : (
                    <Play size={16} color={COLORS.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.arabicText}>{verse.arabic}</Text>
            <View style={styles.divider} />
            <Text style={styles.turkishText}>
              <Text style={styles.turkishNum}>{verse.number}. </Text>
              {verse.turkish}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    top: 60,
    padding: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  arabicName: {
    color: 'rgba(16, 185, 129, 0.9)',
    fontSize: 28,
    marginBottom: 4,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  meta: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  verseCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  verseCardActive: {
    backgroundColor: COLORS.cardBgActive,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  verseBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseBadgeText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: '#10B981',
  },
  arabicText: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
    lineHeight: 40,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  turkishText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 24,
  },
  turkishNum: {
    color: '#34D399',
    fontWeight: 'bold',
  },
});
