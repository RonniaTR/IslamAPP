import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Trophy, Zap, Star, Target, Crown, ChevronRight, Flame, ArrowLeft, RotateCw } from 'lucide-react-native';
import api from '../api';

const COLORS = {
  bg: '#0A1F14',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  emerald: '#10B981',
  textMain: '#F5F5DC',
  textMuted: '#A8B5A0',
  cardBg: 'rgba(15,61,46,0.5)',
};

export default function QuizScreen({ navigation }) {
  const [view, setView] = useState('home');
  const [categories, setCategories] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  
  // Timer
  const [timer, setTimer] = useState(15);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get('/quiz/categories').then(r => setCategories(r.data)).catch(() => {});
    api.get('/quiz/leaderboard').then(r => setLeaderboard(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (view !== 'game' || selected !== null) return;
    setTimer(15);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); submitAnswer(-1); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [view, qi, selected]);

  const startQuiz = async (categoryId) => {
    setLoading(true);
    try {
      const endpoint = categoryId === 'mixed'
        ? `/quiz/solo/start-mixed?user_id=guest&question_count=15`
        : `/quiz/solo/start?user_id=guest&category=${categoryId}&question_count=10`;
      const { data } = await api.post(endpoint);
      setSession(data); setQi(0); setScore(0); setCorrect(0);
      setSelected(null); setResult(null); setView('game');
    } catch {} finally { setLoading(false); }
  };

  const submitAnswer = async (idx) => {
    if (selected !== null || !session) return;
    clearInterval(timerRef.current);
    setSelected(idx);
    try {
      const timeTaken = 15 - timer;
      const { data } = await api.post(`/quiz/solo/${session.session_id}/answer?question_index=${qi}&answer=${idx}&time_taken=${timeTaken}`);
      setResult(data);
      const earned = data.points_earned || 0;
      setScore(prev => prev + earned);
      if (data.correct) setCorrect(prev => prev + 1);
    } catch {}
  };

  const nextQuestion = () => {
    if (qi + 1 >= session.questions.length) {
      api.post(`/quiz/solo/${session.session_id}/finish`).catch(() => {});
      setView('result');
      return;
    }
    setQi(prev => prev + 1); setSelected(null); setResult(null);
  };

  if (view === 'game' && session) {
    const q = session.questions[qi];
    const letters = ['A', 'B', 'C', 'D'];
    
    return (
      <View style={styles.container}>
        <View style={{ paddingTop: 60, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => { setView('home'); setSession(null); }}>
             <ArrowLeft size={24} color={COLORS.textMain} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Star size={16} color={COLORS.gold} />
            <Text style={{ color: COLORS.gold, fontSize: 16, fontWeight: 'bold', marginLeft: 4 }}>{score}</Text>
          </View>
        </View>

        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
             <Text style={{ color: timer > 5 ? COLORS.emerald : '#ef4444', fontSize: 16, fontWeight: 'bold' }}>Süre: {timer} sn</Text>
             <Text style={{ color: COLORS.textMuted, fontSize: 14, marginLeft: 'auto' }}>Soru {qi + 1}/{session.questions.length}</Text>
          </View>

          <View style={{ backgroundColor: COLORS.cardBg, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: COLORS.gold + '20', marginBottom: 20 }}>
             <Text style={{ color: COLORS.textMain, fontSize: 16, lineHeight: 24, fontWeight: '500' }}>{q.question}</Text>
          </View>

          <View>
             {q.options.map((opt, i) => {
               let bgColor = 'rgba(255,255,255,0.05)';
               let borderColor = 'rgba(255,255,255,0.1)';
               let textColor = COLORS.textMain;

               if (selected !== null) {
                 if (i === result?.correct_answer) {
                   bgColor = 'rgba(16, 185, 129, 0.2)';
                   borderColor = 'rgba(16, 185, 129, 0.5)';
                   textColor = COLORS.emerald;
                 } else if (i === selected && !result?.correct) {
                   bgColor = 'rgba(239, 68, 68, 0.2)';
                   borderColor = 'rgba(239, 68, 68, 0.5)';
                   textColor = '#ef4444';
                 } else {
                   opacity = 0.5;
                 }
               }

               return (
                 <TouchableOpacity 
                   key={i} 
                   disabled={selected !== null}
                   onPress={() => submitAnswer(i)}
                   style={{ backgroundColor: bgColor, borderColor: borderColor, borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}
                 >
                   <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                     <Text style={{ color: textColor, fontWeight: 'bold' }}>{letters[i]}</Text>
                   </View>
                   <Text style={{ color: textColor, fontSize: 14, flex: 1 }}>{opt}</Text>
                 </TouchableOpacity>
               );
             })}
          </View>

          {selected !== null && (
            <TouchableOpacity onPress={nextQuestion} style={{ backgroundColor: COLORS.gold, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 10 }}>
              <Text style={{ color: '#0A1F14', fontSize: 16, fontWeight: 'bold' }}>
                {qi + 1 >= session.questions.length ? 'Sonuçları Gör' : 'Sonraki Soru'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (view === 'result' && session) {
    const pct = Math.round((correct / session.questions.length) * 100);
    return (
       <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>{pct >= 70 ? '🎉' : '👏'}</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 8 }}>Oyun Bitti!</Text>
          <Text style={{ fontSize: 16, color: COLORS.textMuted, marginBottom: 30 }}>{correct} doğru cevap</Text>
          
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 40 }}>
            <View style={{ backgroundColor: COLORS.cardBg, padding: 20, borderRadius: 16, alignItems: 'center', flex: 1 }}>
               <Star size={24} color={COLORS.gold} />
               <Text style={{ color: COLORS.gold, fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>{score}</Text>
               <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>Puan</Text>
            </View>
            <View style={{ backgroundColor: COLORS.cardBg, padding: 20, borderRadius: 16, alignItems: 'center', flex: 1 }}>
               <Target size={24} color={COLORS.emerald} />
               <Text style={{ color: COLORS.emerald, fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>%{pct}</Text>
               <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>Başarı</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => startQuiz(session.category)} style={{ backgroundColor: COLORS.gold, width: '100%', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#0A1F14', fontWeight: 'bold', fontSize: 16 }}>Tekrar Oyna</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setView('home')} style={{ backgroundColor: 'rgba(255,255,255,0.05)', width: '100%', padding: 16, borderRadius: 16, alignItems: 'center' }}>
            <Text style={{ color: COLORS.textMain, fontWeight: 'bold', fontSize: 16 }}>Ana Menü</Text>
          </TouchableOpacity>
       </View>
    );
  }

  // Home View
  return (
    <ScrollView style={styles.container}>
      <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'rgba(212, 175, 55, 0.05)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={20} color="#0A1F14" />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.textMain }}>İslam Quiz</Text>
            <Text style={{ fontSize: 12, color: COLORS.textMuted }}>300+ soru ile bilgini test et!</Text>
          </View>
        </View>
      </View>

      <View style={{ padding: 20 }}>
        <TouchableOpacity onPress={() => startQuiz('mixed')} disabled={loading} style={{ backgroundColor: COLORS.gold, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <View>
             <Text style={{ color: '#0A1F14', fontSize: 18, fontWeight: 'bold' }}>Hızlı Oyun</Text>
             <Text style={{ color: 'rgba(10,31,20,0.7)', fontSize: 12, marginTop: 4 }}>Karışık 15 soru ile yarış!</Text>
          </View>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' }}>
             <Zap size={24} color="#0A1F14" />
          </View>
        </TouchableOpacity>

        <Text style={{ color: COLORS.textMain, fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Kategoriler</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
           {categories.map(c => (
              <TouchableOpacity key={c.id} onPress={() => startQuiz(c.id)} disabled={loading} style={{ width: '48%', backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                 <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: c.color + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Target size={16} color={c.color} />
                 </View>
                 <Text style={{ color: COLORS.textMain, fontSize: 14, fontWeight: 'bold' }}>{c.name}</Text>
                 <Text style={{ color: COLORS.textMuted, fontSize: 10, marginTop: 4 }}>{c.question_count} soru</Text>
              </TouchableOpacity>
           ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
});
