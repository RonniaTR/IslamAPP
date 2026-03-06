import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Loader2 } from 'lucide-react';
import api from '../api';

export default function AiChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const { data } = await api.post('/ai/chat', { session_id: sessionId, message: msg });
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Bir hata olu\u015ftu. L\u00fctfen tekrar deneyin.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    api.delete(`/ai/history/${sessionId}`).catch(() => {});
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]" data-testid="ai-chat">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-900/30 to-transparent px-5 pt-12 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">\u0130slami Dan\u0131\u015fman</h1>
            <p className="text-xs text-gray-400">Kur'an ve Hadis temelli cevaplar</p>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10" data-testid="clear-chat-btn">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">\u0130slami konularda sorular\u0131n\u0131z\u0131 sorun.</p>
            <p className="text-gray-600 text-xs mt-2">\u00d6rne\u011fin: "Namaz k\u0131lman\u0131n \u00f6nemi nedir?"</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} data-testid={`chat-message-${i}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-emerald-600 text-white rounded-br-md'
                : 'bg-white/5 text-gray-200 rounded-bl-md border border-white/5'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3 border border-white/5">
              <Loader2 size={18} className="animate-spin text-emerald-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="px-4 pb-4 pt-2 shrink-0">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Sorunuzu yaz\u0131n..."
            data-testid="chat-input"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none" />
          <button type="submit" disabled={loading || !input.trim()} data-testid="chat-send-btn"
            className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center disabled:opacity-30 transition-opacity">
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
