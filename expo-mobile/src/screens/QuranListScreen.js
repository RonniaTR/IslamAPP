import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { BookOpen, Search, Youtube, ChevronRight } from 'lucide-react-native';

const COLORS = {
  bg: '#0A1F14',
  gold: '#D4AF37',
  textMain: '#F5F5DC',
  textMuted: '#A8B5A0',
  inputBg: 'rgba(15,61,46,0.5)',
  rowBg: 'rgba(15,61,46,0.3)',
};

export default function QuranListScreen({ navigation }) {
  const dummySurahs = [
    { number: 1, name: "Fatiha", arabic: "الفاتحة", meaning: "Açılış", verses: 7, revelation: "Mekke" },
    { number: 2, name: "Bakara", arabic: "البقرة", meaning: "İnek", verses: 286, revelation: "Medine" },
    { number: 36, name: "Yasin", arabic: "يس", meaning: "Ya-Sin", verses: 83, revelation: "Mekke" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <BookOpen size={24} color={COLORS.gold} />
          <Text style={styles.title}>Kur'an-ı Kerim</Text>
        </View>

        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Sure veya ayet ara..."
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <TouchableOpacity style={styles.mealBtn}>
          <Youtube size={20} color="#EF4444" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.mealBtnTitle}>Türkçe Meal Dinle</Text>
            <Text style={styles.mealBtnDesc}>Mazlum Kiper · 30 Cüz</Text>
          </View>
          <ChevronRight size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list}>
        {dummySurahs.map(surah => (
          <TouchableOpacity 
            key={surah.number} 
            style={styles.surahRow}
            onPress={() => navigation.navigate('SurahDetail', { surahNumber: surah.number, surahName: surah.name })}
          >
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>{surah.number}</Text>
            </View>
            <View style={styles.surahInfo}>
              <View style={styles.surahHeader}>
                <Text style={styles.surahName}>{surah.name}</Text>
                <Text style={styles.arabicName}>{surah.arabic}</Text>
              </View>
              <Text style={styles.surahMeta}>
                {surah.meaning} · {surah.verses} ayet · {surah.revelation}
              </Text>
            </View>
          </TouchableOpacity>
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
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textMain,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 12 },
  searchInput: {
    flex: 1,
    color: COLORS.textMain,
    fontSize: 16,
  },
  mealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 16,
    padding: 16,
  },
  mealBtnTitle: { color: COLORS.textMain, fontSize: 14, fontWeight: '600' },
  mealBtnDesc: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  list: { paddingHorizontal: 16 },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.rowBg,
    borderRadius: 16,
    marginBottom: 8,
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  numberText: {
    color: COLORS.gold,
    fontWeight: 'bold',
    fontSize: 14,
  },
  surahInfo: { flex: 1 },
  surahHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  surahName: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '600',
  },
  arabicName: {
    color: COLORS.gold,
    fontSize: 18,
  },
  surahMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});
