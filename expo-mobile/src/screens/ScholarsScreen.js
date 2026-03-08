import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Users, Send, ArrowLeft, Share2, MessageCircle } from 'lucide-react-native';
import api from '../api';

const COLORS = {
  bg: '#0A1F14',
  textMain: '#F5F5DC',
  textMuted: '#A8B5A0',
  cardBg: 'rgba(15,61,46,0.5)',
};

const SCHOLAR_COLORS = {
  nihat_hatipoglu: { bg: '#1a3a5c', accent: '#5b9bd5' },
  hayrettin_karaman: { bg: '#2d1b3d', accent: '#9b59b6' },
  mustafa_islamoglu: { bg: '#1a3d2e', accent: '#2ecc71' },
  diyanet: { bg: '#0f3d2e', accent: '#D4AF37' },
  omer_nasuhi: { bg: '#3d2d1a', accent: '#e67e22' },
  elmalili: { bg: '#1a2d3d', accent: '#3498db' },
  said_nursi: { bg: '#3d1a2d', accent: '#e74c3c' },
  mehmet_okuyan: { bg: '#2d3d1a', accent: '#27ae60' },
  suleyman_ates: { bg: '#3d3d1a', accent: '#f1c40f' },
  yasar_nuri: { bg: '#1a3d3d', accent: '#1abc9c' },
  'cübbeli_ahmet': { bg: '#2d1a3d', accent: '#8e44ad' },
  ali_erbas: { bg: '#1a2d2d', accent: '#16a085' },
  default: { bg: '#0f3d2e', accent: '#D4AF37' }
};

function ScholarAvatar({ scholar, size = 48 }) {
  const colors = SCHOLAR_COLORS[scholar.id] || SCHOLAR_COLORS.default;
  const initials = scholar.name.split(' ').filter(w => w.length > 2).slice(-2).map(w => w[0]).join('');

  return (
    <View style={{ width: size, height: size }}>
      <View style={{
        width: '100%', height: '100%', borderRadius: size * 0.3,
        backgroundColor: colors.bg,
        borderWidth: 2, borderColor: colors.accent + '40',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <Text style={{ color: colors.accent, fontSize: size * 0.35, fontWeight: 'bold' }}>
          {initials}
        </Text>
      </View>
      <View style={{
        position: 'absolute', bottom: -2, right: -2,
        width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15,
        backgroundColor: colors.accent,
        borderWidth: 2, borderColor: '#0A1F14',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <MessageCircle size={size * 0.18} color="#0A1F14" />
      </View>
    </View>
  );
}

export default function ScholarsScreen({ navigation }) {
  const [scholars, setScholars] = useState([]);
  const [selected, setSelected] = useState(null);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `scholar_${Date.now()}`);

  useEffect(() => {
    api.get('/scholars').then(r => setScholars(r.data)).catch(() => {});
  }, []);

  const askScholar = async () => {
    if (!question.trim() || !selected || loading) return;
    const q = question.trim();
    setMessages(prev => [...prev, { type: 'user', text: q }]);
    setQuestion('');
    setLoading(true);
    try {
      const { data } = await api.post('/scholars/ask', { session_id: sessionId, question: q, scholar_id: selected.id });
      setMessages(prev => [...prev, { type: 'scholar', text: data.response, name: data.scholar_name, sources: data.sources }]);
    } catch {
      setMessages(prev => [...prev, { type: 'scholar', text: 'Hata oluştu, tekrar deneyin.', name: selected.name }]);
    }
    setLoading(false);
  };

  if (selected) {
    const colors = SCHOLAR_COLORS[selected.id] || SCHOLAR_COLORS.default;
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.accent + '40' }}>
          <TouchableOpacity onPress={() => { setSelected(null); setMessages([]); }} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <ArrowLeft size={18} color={colors.accent} />
            <Text style={{ color: colors.accent, marginLeft: 4 }}>Geri</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ScholarAvatar scholar={selected} size={44} />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.textMain }}>{selected.name}</Text>
              <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{selected.specialty}</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {messages.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <ScholarAvatar scholar={selected} size={64} />
              <Text style={{ color: COLORS.textMuted, marginTop: 16 }}>"{selected.name}" hocaya sorunuzu sorun</Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 4 }}>Anlatım tarzı: {selected.style?.split(',')[0]}</Text>
            </View>
          )}

          {messages.map((msg, i) => (
            <View key={i} style={{ alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              {msg.type === 'user' ? (
                <View style={{ maxWidth: '80%', padding: 12, borderRadius: 16, borderTopRightRadius: 4, backgroundColor: colors.accent + '25', borderWidth: 1, borderColor: colors.accent + '30' }}>
                  <Text style={{ color: COLORS.textMain, fontSize: 14 }}>{msg.text}</Text>
                </View>
              ) : (
                <View style={{ width: '90%', padding: 16, borderRadius: 16, borderTopLeftRadius: 4, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: colors.accent + '40' }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.accent, marginBottom: 8 }}>{msg.name}</Text>
                  <Text style={{ color: COLORS.textMain, fontSize: 14, lineHeight: 22 }}>{msg.text}</Text>
                </View>
              )}
            </View>
          ))}
          {loading && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={{ color: COLORS.textMuted, fontSize: 12, marginLeft: 8 }}>Yanıt hazırlanıyor...</Text>
            </View>
          )}
        </ScrollView>

        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', alignItems: 'flex-end' }}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Sorunuzu yazın..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 12, color: COLORS.textMain, fontSize: 14, maxHeight: 100, minHeight: 44 }}
          />
          <TouchableOpacity 
            onPress={askScholar} 
            disabled={loading || !question.trim()}
            style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginLeft: 8, opacity: (!question.trim() || loading) ? 0.5 : 1 }}
          >
            <Send size={20} color="#0A1F14" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'rgba(212, 175, 55, 0.05)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Users size={24} color="#D4AF37" />
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.textMain, marginLeft: 12 }}>Hocalara Sor</Text>
        </View>
        <Text style={{ fontSize: 12, color: COLORS.textMuted }}>12 farklı İslam aliminin bakış açısından cevap alın</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {scholars.map(s => {
          const colors = SCHOLAR_COLORS[s.id] || SCHOLAR_COLORS.default;
          return (
            <TouchableOpacity 
              key={s.id} 
              onPress={() => setSelected(s)}
              style={{ padding: 16, borderRadius: 16, backgroundColor: colors.bg + '60', borderWidth: 1, borderColor: colors.accent + '20', marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}
            >
              <ScholarAvatar scholar={s} size={48} />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.textMain }}>{s.name}</Text>
                <Text style={{ fontSize: 12, color: colors.accent, marginTop: 2 }}>{s.title}</Text>
                <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }} numberOfLines={1}>{s.specialty}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
