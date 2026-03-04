import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Topic {
  id: string;
  name: string;
  name_en: string;
  icon: string;
}

interface ComparativeData {
  topic: string;
  quran: { text: string; reference: string; arabic?: string };
  bible: { text: string; reference: string; original?: string };
  torah: { text: string; reference: string; hebrew?: string };
  hadith: { text: string; reference: string; narrator?: string };
}

export default function ComparativeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language, t } = useLanguage();
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topicData, setTopicData] = useState<ComparativeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/comparative/topics`);
      if (response.ok) {
        const data = await response.json();
        setTopics(data);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicData = async (topicId: string) => {
    setSelectedTopic(topicId);
    setLoadingTopic(true);
    setAiAnalysis(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/comparative/topic/${topicId}`);
      if (response.ok) {
        const data = await response.json();
        setTopicData(data);
      }
    } catch (error) {
      console.error('Error fetching topic:', error);
    } finally {
      setLoadingTopic(false);
    }
  };

  const fetchAIAnalysis = async () => {
    if (!selectedTopic) return;
    
    setLoadingAI(true);
    try {
      const response = await fetch(`${API_BASE}/api/comparative/ai-compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          question: customQuestion || null
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiAnalysis(data.ai_analysis);
      }
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
    } finally {
      setLoadingAI(false);
    }
  };

  const renderSourceCard = (source: string, data: any, icon: string, color: string) => {
    if (!data) return null;
    
    const titles: { [key: string]: string } = {
      quran: "Kur'an-ı Kerim",
      bible: 'İncil',
      torah: 'Tevrat',
      hadith: 'Hadis'
    };
    
    return (
      <View style={[styles.sourceCard, { backgroundColor: colors.surface, borderLeftColor: color }]}>
        <View style={styles.sourceHeader}>
          <View style={[styles.sourceIcon, { backgroundColor: color + '20' }]}>
            <Text style={{ fontSize: 20 }}>{icon}</Text>
          </View>
          <Text style={[styles.sourceTitle, { color: colors.text }]}>{titles[source]}</Text>
        </View>
        
        <Text style={[styles.sourceText, { color: colors.text }]}>
          "{data.text}"
        </Text>
        
        <Text style={[styles.sourceReference, { color }]}>
          {data.reference}
        </Text>
        
        {data.narrator && (
          <Text style={[styles.sourceNarrator, { color: colors.textSecondary }]}>
            Ravi: {data.narrator}
          </Text>
        )}
        
        {data.arabic && (
          <Text style={[styles.sourceOriginal, { color: colors.textMuted }]}>
            {data.arabic}
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Karşılaştırmalı Vahiyler</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Topic Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Konu Seçin</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicsScroll}>
            {topics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.topicChip,
                  { backgroundColor: colors.surface },
                  selectedTopic === topic.id && { backgroundColor: colors.primary }
                ]}
                onPress={() => fetchTopicData(topic.id)}
              >
                <Text style={styles.topicIcon}>{topic.icon}</Text>
                <Text style={[
                  styles.topicName,
                  { color: selectedTopic === topic.id ? '#fff' : colors.text }
                ]}>
                  {language === 'en' ? topic.name_en : topic.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Loading */}
        {loadingTopic && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.topicLoader} />
        )}

        {/* Comparative Data */}
        {topicData && !loadingTopic && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {topicData.topic}
            </Text>
            
            {renderSourceCard('quran', topicData.quran, '📖', '#10b981')}
            {renderSourceCard('bible', topicData.bible, '✝️', '#3b82f6')}
            {renderSourceCard('torah', topicData.torah, '✡️', '#f59e0b')}
            {renderSourceCard('hadith', topicData.hadith, '📜', '#8b5cf6')}
          </View>
        )}

        {/* AI Analysis Section */}
        {selectedTopic && topicData && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Analizi</Text>
            
            <TextInput
              style={[styles.questionInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Özel sorunuzu yazın (opsiyonel)"
              placeholderTextColor={colors.textMuted}
              value={customQuestion}
              onChangeText={setCustomQuestion}
              multiline
            />
            
            <TouchableOpacity
              style={[styles.aiButton, { backgroundColor: colors.primary }]}
              onPress={fetchAIAnalysis}
              disabled={loadingAI}
            >
              {loadingAI ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.aiButtonText}>AI ile Karşılaştır</Text>
                </>
              )}
            </TouchableOpacity>
            
            {aiAnalysis && (
              <View style={[styles.aiAnalysisBox, { backgroundColor: colors.surface }]}>
                <View style={styles.aiHeader}>
                  <Ionicons name="sparkles" size={20} color={colors.primary} />
                  <Text style={[styles.aiHeaderText, { color: colors.text }]}>AI Analizi</Text>
                </View>
                <Text style={[styles.aiAnalysisText, { color: colors.textSecondary }]}>
                  {aiAnalysis}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Bu bölüm, farklı dinlerin kutsal metinlerinden benzer konulardaki 
            görüşleri karşılaştırmalı olarak sunar. AI destekli analiz 
            özelliği ile daha derin içgörüler elde edebilirsiniz.
          </Text>
        </View>

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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  topicsScroll: {
    marginBottom: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    gap: 8,
  },
  topicIcon: {
    fontSize: 18,
  },
  topicName: {
    fontSize: 14,
    fontWeight: '600',
  },
  topicLoader: {
    marginVertical: 20,
  },
  sourceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sourceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sourceText: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  sourceReference: {
    fontSize: 13,
    fontWeight: '600',
  },
  sourceNarrator: {
    fontSize: 12,
    marginTop: 4,
  },
  sourceOriginal: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'right',
    fontFamily: 'serif',
  },
  questionInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 80,
    borderWidth: 1,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  aiAnalysisBox: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiHeaderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  aiAnalysisText: {
    fontSize: 14,
    lineHeight: 22,
  },
  infoBox: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});
