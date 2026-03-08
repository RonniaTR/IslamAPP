import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Send, Trash2 } from 'lucide-react-native';
import api from '../api';

const COLORS = {
  bg: '#0A1F14',
  primary: '#10B981', // Emerald 500
  primaryDark: '#047857', // Emerald 700
  textMain: '#F5F5DC',
  textMuted: '#9CA3AF',
  inputBg: 'rgba(255,255,255,0.05)',
  userBubble: '#059669', // Emerald 600
  botBubble: 'rgba(255,255,255,0.05)',
};

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  
  const scrollViewRef = useRef();

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    
    try {
      const { data } = await api.post('/ai/chat', { session_id: sessionId, message: msg });
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Bir hata oluştu. Lütfen tekrar deneyin.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    api.delete(`/ai/history/${sessionId}`).catch(() => {});
    setMessages([]);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>İslami Danışman</Text>
          <Text style={styles.subtitle}>Dini sorularınızı yapay zekaya sorun</Text>
        </View>
        
        {messages.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearChat}>
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.chatArea} 
        contentContainerStyle={styles.chatContent}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nasıl yardımcı olabilirim?</Text>
          </View>
        )}
        
        {messages.map((msg, i) => (
          <View 
            key={i} 
            style={[
              styles.messageWrapper, 
              msg.role === 'user' ? styles.messageWrapperUser : styles.messageWrapperBot
            ]}
          >
            <View style={[
              styles.bubble, 
              msg.role === 'user' ? styles.bubbleUser : styles.bubbleBot
            ]}>
              <Text style={styles.messageText}>{msg.content}</Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={[styles.messageWrapper, styles.messageWrapperBot]}>
            <View style={styles.bubbleBot}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputArea}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Sorum var..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Send size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(30, 58, 138, 0.2)', // blue-900/20 analogous
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  clearBtn: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperBot: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: COLORS.userBubble,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: COLORS.botBubble,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  messageText: {
    color: COLORS.textMain,
    fontSize: 14,
    lineHeight: 22,
  },
  inputArea: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.inputBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    minHeight: 36,
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.primaryDark,
    opacity: 0.5,
  },
});
