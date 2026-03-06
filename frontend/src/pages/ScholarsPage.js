import React, { useState, useEffect } from 'react';
import { Users, Send, Loader2, ArrowLeft } from 'lucide-react';
import api from '../api';

export default function ScholarsPage() {
  const [scholars, setScholars] = useState([]);
  const [selected, setSelected] = useState(null);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `scholar_${Date.now()}`);

  useEffect(() => {
    api.get('/scholars').then(r => setScholars(r.data)).catch(() => {});
  }, []);

  const askScholar = async (e) => {
    e.preventDefault();
    if (!question.trim() || !selected || loading) return;
    setLoading(true);
    setResponse(null);
    try {
      const { data } = await api.post('/scholars/ask', {
        session_id: sessionId,
        question: question.trim(),
        scholar_id: selected.id,
      });
      setResponse(data);
    } catch {
      setResponse({ response: 'Bir hata olu\u015ftu. L\u00fctfen tekrar deneyin.', scholar_name: selected.name, sources: [] });
    } finally {
      setLoading(false);
    }
  };

  if (selected) {
    return (
      <div className="animate-fade-in" data-testid="scholar-chat">
        <div className="bg-gradient-to-b from-purple-900/30 to-transparent px-5 pt-10 pb-4">
          <button onClick={() => { setSelected(null); setResponse(null); }} className="flex items-center gap-1 text-purple-400 text-sm mb-3">
            <ArrowLeft size={18} /> Hocalar
          </button>
          <h1 className="text-lg font-bold text-white">{selected.name}</h1>
          <p className="text-xs text-gray-400">{selected.title}</p>
          <p className="text-xs text-gray-500 mt-1">{selected.specialty}</p>
        </div>
        <div className="px-4">
          <form onSubmit={askScholar} className="mb-4">
            <textarea value={question} onChange={e => setQuestion(e.target.value)}
              placeholder={`${selected.name}'a sorunuzu yaz\u0131n...`}
              rows={3}
              data-testid="scholar-question-input"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 resize-none" />
            <button type="submit" disabled={loading || !question.trim()} data-testid="scholar-ask-btn"
              className="mt-2 w-full py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {loading ? 'Yan\u0131tlan\u0131yor...' : 'Sor'}
            </button>
          </form>
          {response && (
            <div className="glass rounded-xl p-4 mb-6" data-testid="scholar-response">
              <p className="text-sm font-semibold text-purple-300 mb-2">{response.scholar_name}</p>
              <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{response.response}</div>
              {response.sources?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-xs text-gray-500">Kaynaklar: {response.sources.join(', ')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" data-testid="scholars-page">
      <div className="bg-gradient-to-b from-purple-900/30 to-transparent px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Users size={24} className="text-purple-400" />
          <h1 className="text-xl font-bold text-white">Hocalar\u0131n G\u00f6r\u00fc\u015f\u00fc</h1>
        </div>
        <p className="text-sm text-gray-400">Farkl\u0131 alimlerin bak\u0131\u015f a\u00e7\u0131lar\u0131n\u0131 ke\u015ffedin</p>
      </div>
      <div className="px-4 space-y-3 pb-6">
        {scholars.map(s => (
          <button key={s.id} onClick={() => setSelected(s)} data-testid={`scholar-${s.id}`}
            className="w-full text-left glass rounded-xl p-4 transition-all hover:border-purple-500/20 active:scale-[0.98]">
            <p className="text-sm font-semibold text-white">{s.name}</p>
            <p className="text-xs text-purple-300 mt-0.5">{s.title}</p>
            <p className="text-xs text-gray-500 mt-1">{s.specialty}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
