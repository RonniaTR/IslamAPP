import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Moon, Sun, BookOpen, Heart, Volume2, Star } from 'lucide-react-native';
import api from '../api';

const COLORS = {
  bg: '#0A1F14',
  gold: '#D4AF37',
  goldLight: '#E8C84A',
  textMain: '#F5F5DC',
  textMuted: '#A8B5A0',
  cardBg: 'rgba(15,61,46,0.5)',
};

const DAILY_DUAS = [
  'Allahım, orucumu senin rızan için tuttum, senin verdiğin rızıkla açtım.',
  'Rabbim! Bana ve ana-babama verdiğin nimete şükretmemi ve senin razı olacağın yararlı iş yapmamı bana ilham et.',
  'Allahım! Senden hidayet, takva, iffet ve gönül zenginliği isterim.',
  'Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi ateş azabından koru.',
  'Allahım! Kalbimi, gözümü, kulağımı ve bedenimi haramlardan koru.',
];

export default function RamadanScreen() {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [randomVerse, setRandomVerse] = useState(null);
  const [randomHadith, setRandomHadith] = useState(null);
  const [iftarCountdown, setIftarCountdown] = useState(null);
  const [sahurCountdown, setSahurCountdown] = useState(null);

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const todayDua = DAILY_DUAS[dayOfYear % DAILY_DUAS.length];

  // We use a default city for dummy purposes until Language Context is migrated
  useEffect(() => {
    api.get(`/prayer-times/Istanbul`).then(r => setPrayerTimes(r.data)).catch(() => {});
    api.get('/quran/random').then(r => setRandomVerse(r.data)).catch(() => {});
    api.get('/hadith/random').then(r => setRandomHadith(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!prayerTimes) return;
    const update = () => {
      const now = new Date();
      if (prayerTimes.maghrib) {
        const [h, m] = prayerTimes.maghrib.split(':').map(Number);
        const iftar = new Date(now); iftar.setHours(h, m, 0, 0);
        if (iftar > now) {
          const diff = iftar - now;
          setIftarCountdown({ h: Math.floor(diff/3600000), m: Math.floor((diff%3600000)/60000), s: Math.floor((diff%60000)/1000) });
        } else { setIftarCountdown(null); }
      }
      if (prayerTimes.fajr) {
        const [h, m] = prayerTimes.fajr.split(':').map(Number);
        const sahur = new Date(now); sahur.setHours(h, m, 0, 0);
        if (sahur > now) {
          const diff = sahur - now;
          setSahurCountdown({ h: Math.floor(diff/3600000), m: Math.floor((diff%3600000)/60000), s: Math.floor((diff%60000)/1000) });
        } else { setSahurCountdown(null); }
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  const pad = n => String(n).padStart(2, '0');

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Moon size={20} color={COLORS.gold} />
          <Text style={styles.headerSub}>Ramazan Mübarek</Text>
        </View>
        <Text style={styles.headerTitle}>Ramazan</Text>
      </View>

      {/* Iftar Countdown */}
      {iftarCountdown && (
        <View style={styles.iftarCard}>
          <Moon size={32} color={COLORS.gold} style={{ alignSelf: 'center', marginBottom: 8 }} />
          <Text style={styles.iftarLabel}>İFTARA KALAN SÜRE</Text>
          <View style={styles.countdownRow}>
            <View style={styles.timeBox}>
              <Text style={styles.timeVal}>{pad(iftarCountdown.h)}</Text>
              <Text style={styles.timeLabel}>Saat</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeVal}>{pad(iftarCountdown.m)}</Text>
              <Text style={styles.timeLabel}>Dk</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeVal}>{pad(iftarCountdown.s)}</Text>
              <Text style={styles.timeLabel}>Sn</Text>
            </View>
          </View>
        </View>
      )}

      {/* Sahur Time */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Sun size={16} color={COLORS.goldLight} />
          <Text style={[styles.cardTitle, { color: COLORS.goldLight }]}>Sahur Vakti</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.textMain }}>{prayerTimes?.fajr || '--:--'}</Text>
        {sahurCountdown && <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4 }}>Kalan: {pad(sahurCountdown.h)}:{pad(sahurCountdown.m)}:{pad(sahurCountdown.s)}</Text>}
      </View>

      {/* Today's Dua */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Star size={16} color={COLORS.gold} />
          <Text style={styles.cardTitle}>Bugünün Duası</Text>
        </View>
        <Text style={{ color: COLORS.textMain, fontSize: 14, fontStyle: 'italic', lineHeight: 22 }}>"{todayDua}"</Text>
      </View>

      {/* Today's Verse */}
      {randomVerse && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <BookOpen size={16} color={COLORS.gold} />
            <Text style={styles.cardTitle}>Bugünün Ayeti</Text>
          </View>
          <Text style={{ color: COLORS.textMain, fontSize: 16, lineHeight: 28, textAlign: 'right', marginBottom: 8 }}>{randomVerse.arabic}</Text>
          <Text style={{ color: COLORS.textMuted, fontSize: 14, lineHeight: 22 }}>{randomVerse.turkish}</Text>
        </View>
      )}

      {/* Today's Hadith */}
      {randomHadith && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Volume2 size={16} color={COLORS.goldLight} />
            <Text style={[styles.cardTitle, { color: COLORS.goldLight }]}>Bugünün Hadisi</Text>
          </View>
          <Text style={{ color: COLORS.textMain, fontSize: 14, lineHeight: 24, textAlign: 'right', marginBottom: 8 }}>{randomHadith.arabic}</Text>
          <Text style={{ color: COLORS.textMuted, fontSize: 14, lineHeight: 22 }}>{randomHadith.turkish}</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
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
  },
  iftarCard: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
  },
  iftarLabel: {
    color: COLORS.gold,
    fontSize: 10,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  countdownRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  timeBox: {
    alignItems: 'center',
  },
  timeVal: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.goldLight,
  },
  timeLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
