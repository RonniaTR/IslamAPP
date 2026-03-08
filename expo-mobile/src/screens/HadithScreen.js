import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BookOpen, Star } from 'lucide-react-native';
import api from '../api';

const COLORS = {
  bg: '#0A1F14',
  amber: '#F59E0B',
  amberLight: '#FCD34D',
  textMain: '#F5F5DC',
  textMuted: '#9CA3AF',
  cardBg: 'rgba(15,61,46,0.5)',
  cardBorder: 'rgba(245, 158, 11, 0.15)',
};

export default function HadithScreen() {
  const [categories, setCategories] = useState([]);
  const [hadiths, setHadiths] = useState([]);
  const [selected, setSelected] = useState(null);
  const [expandedHadith, setExpandedHadith] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/hadith/categories').catch(() => ({ data: [] })),
      api.get('/hadith/all').catch(() => ({ data: [] }))
    ]).then(([catRes, hadithRes]) => {
      setCategories(catRes.data);
      setHadiths(hadithRes.data);
      setLoading(false);
    });
  }, []);

  const filtered = selected ? hadiths.filter(h => h.category === selected) : hadiths;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.amber} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <BookOpen size={24} color={COLORS.amber} />
          <Text style={styles.title}>Hadis-i Şerifler</Text>
        </View>
        <Text style={styles.subtitle}>Peygamber Efendimiz (s.a.v)'in nurlu sözleri</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterBtn, !selected && styles.filterBtnActive]}
            onPress={() => setSelected(null)}
          >
            <Text style={[styles.filterText, !selected && styles.filterTextActive]}>Tümü</Text>
          </TouchableOpacity>
          
          {categories.map(c => (
            <TouchableOpacity 
              key={c.id} 
              style={[styles.filterBtn, selected === c.id && styles.filterBtnActive]}
              onPress={() => setSelected(c.id)}
            >
              <Text style={[styles.filterText, selected === c.id && styles.filterTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map(h => (
          <TouchableOpacity 
            key={h.id} 
            style={styles.card}
            onPress={() => setExpandedHadith(expandedHadith === h.id ? null : h.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.arabicText}>{h.arabic}</Text>
            <Text style={styles.turkishText}>{h.turkish}</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.sourceInfo}>
                <Star size={12} color={COLORS.amber} />
                <Text style={styles.metaText}>{h.source}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{h.narrator}</Text>
              </View>
              <Text style={styles.authenticity}>{h.authenticity}</Text>
            </View>

            {expandedHadith === h.id && h.explanation && (
              <View style={styles.explanationBox}>
                <Text style={styles.explanationText}>{h.explanation}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <Text style={{ textAlign: 'center', color: COLORS.textMuted, marginTop: 40 }}>
            Bu kategoride henüz hadis bulunmuyor.
          </Text>
        )}
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
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  filterContainer: {
    marginVertical: 16,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  filterText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.amber,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  arabicText: {
    color: 'rgba(252, 211, 77, 0.8)',
    fontSize: 20,
    textAlign: 'right',
    lineHeight: 34,
    marginBottom: 12,
  },
  turkishText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  metaDot: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  authenticity: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '600',
  },
  explanationBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  explanationText: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 20,
  },
});
