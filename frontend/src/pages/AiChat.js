import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Loader2, Sparkles, BookOpen, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

const QUICK_QUESTIONS = [
  { q: "Namaz nasıl kılınır?", icon: "🕌" },
  { q: "Oruç kimlere farzdır?", icon: "🌙" },
  { q: "Zekat nasıl hesaplanır?", icon: "💰" },
  { q: "Abdest nasıl alınır?", icon: "💧" },
  { q: "Hac ibadeti nedir?", icon: "🕋" },
  { q: "Dua etmenin adabı nedir?", icon: "🤲" },
];

export default function AiChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (msg) => {
    const text = msg || input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const { data } = await api.post('/ai/chat', { session_id: sessionId, message: text });
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Bağlantı hatası oluştu. Lütfen tekrar deneyin.' }]);
    } finally { setLoading(false); }
  };

  const clearChat = () => {
    api.delete(`/ai/history/${sessionId}`).catch(() => {});
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]" data-testid="ai-chat">
      {/* Header */}
      <div className="px-5 pt-10 pb-3 shrink-0" style={{ background: 'linear-gradient(180deg, rgba(15,61,46,0.5) 0%, transparent 100%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#F5F5DC]" data-testid="chat-title">İslami Danışman</h1>
              <p className="text-[10px] text-[#A8B5A0]">Kur'an ve Sünnet rehberliğinde</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} data-testid="clear-chat-btn"
              className="p-2 rounded-lg text-[#A8B5A0] hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center py-6" data-testid="chat-empty">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <MessageCircle size={28} className="text-emerald-400" />
            </div>
            <h2 className="text-base font-bold text-[#F5F5DC] mb-1">Selam, {user?.name?.split(' ')[0] || 'Kardeşim'}</h2>
            <p className="text-xs text-[#A8B5A0] mb-5">İslami konularda soru sorabilirsiniz</p>

            <div className="grid grid-cols-2 gap-2">
              {QUICK_QUESTIONS.map((qq, i) => (
                <button key={i} onClick={() => sendMessage(qq.q)} data-testid={`quick-q-${i}`}
                  className="text-left p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-colors">
                  <span className="text-sm">{qq.icon}</span>
                  <p className="text-[11px] text-[#F5F5DC]/80 mt-1 leading-tight">{qq.q}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`} data-testid={`chat-msg-${i}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-emerald-600 text-white rounded-br-md'
                : 'bg-white/[0.04] text-[#F5F5DC]/90 rounded-bl-md border border-white/5'
            }`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles size={10} className="text-emerald-400" />
                  <span className="text-[9px] font-medium text-emerald-400">İslami Danışman</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white/[0.04] rounded-2xl rounded-bl-md px-4 py-3 border border-white/5">
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-emerald-400" />
                <span className="text-xs text-[#A8B5A0]">Düşünüyorum...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="px-4 pb-4 pt-2 shrink-0">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 focus-within:border-emerald-500/30 transition-colors">
          <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
            placeholder="Sorunuzu yazın..."
            data-testid="chat-input"
            className="flex-1 bg-transparent text-sm text-[#F5F5DC] placeholder:text-[#A8B5A0]/50 focus:outline-none" />
          <button type="submit" disabled={loading || !input.trim()} data-testid="chat-send-btn"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-20"
            style={{ background: input.trim() ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.05)' }}>
            <Send size={14} className="text-white" />
          </button>
        </div>
      </form>
    </div>
  );
}
