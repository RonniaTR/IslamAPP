import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Share2, Volume2, Play, Pause, Loader, RefreshCw } from 'lucide-react';
import api from '../api';

function useTTS() {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = React.useRef(null);

  const speak = useCallback(async (text) => {
    if (playing && audioRef.current) { audioRef.current.pause(); audioRef.current = null; setPlaying(false); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/tts', { text });
      const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
      audioRef.current = audio;
      audio.onended = () => { setPlaying(false); audioRef.current = null; };
      await audio.play();
      setPlaying(true);
    } catch { setPlaying(false); }
    setLoading(false);
  }, [playing]);

  return { speak, playing, loading };
}

function shareOrCopy(title, text) {
  const full = `${title}\n\n${text}\n\n— İslami Yaşam Asistanı`;
  if (navigator.share) {
    navigator.share({ title, text: full }).catch(() => {});
  } else {
    navigator.clipboard.writeText(full).then(() => {}).catch(() => {});
  }
}

export default function KnowledgeDetail() {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [shuffled, setShuffled] = useState([]);
  const tts = useTTS();

  useEffect(() => {
    api.get(`/knowledge-cards/${cardId}`).then(r => {
      setCard(r.data);
      // Shuffle items for variety each visit
      const items = [...r.data.items];
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      setShuffled(items);
    }).catch(() => navigate('/'));
  }, [cardId, navigate]);

  const reshuffle = () => {
    if (!card) return;
    const items = [...card.items];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    setShuffled(items);
  };

  if (!card) return (
    <div className="min-h-screen bg-[#0A1F14] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-fade-in" data-testid="knowledge-detail">
      <div className="px-4 pt-10 pb-4" style={{ background: 'linear-gradient(180deg, rgba(15,61,46,0.5) 0%, transparent 100%)' }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#D4AF37]" aria-label="Geri">
            <ArrowLeft size={18} />
            <span className="text-sm">Geri</span>
          </button>
          <button onClick={reshuffle} className="flex items-center gap-1.5 text-xs text-[#D4AF37] px-3 py-1.5 rounded-lg" style={{ background: 'rgba(212,175,55,0.1)' }} data-testid="shuffle-btn">
            <RefreshCw size={14} />
            Karıştır
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{card.icon || '📖'}</span>
          <div>
            <h1 className="text-xl font-bold text-[#F5F5DC]" style={{ fontFamily: 'Playfair Display, serif' }}>{card.title}</h1>
            <p className="text-xs text-[#A8B5A0]">{card.items.length} konu</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 pb-6">
        {shuffled.map((item, i) => (
          <div key={i} className="card-islamic rounded-2xl p-5 animate-fade-in" style={{ animationDelay: `${Math.min(i * 0.05, 0.5)}s` }}>
            <h3 className="text-base font-semibold text-[#D4AF37] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>{item.title}</h3>
            <p className="text-sm text-[#F5F5DC]/85 leading-relaxed mb-3">{item.content}</p>
            <div className="flex gap-2 pt-2 border-t border-[#D4AF37]/10">
              <button onClick={() => tts.speak(item.content)} data-testid={`listen-${i}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium text-[#D4AF37] transition-colors"
                style={{ background: 'rgba(212,175,55,0.1)' }}>
                {tts.loading ? <Loader size={12} className="animate-spin" /> : tts.playing ? <Pause size={12} /> : <Volume2 size={12} />}
                Dinle
              </button>
              <button onClick={() => shareOrCopy(item.title, item.content)} data-testid={`share-${i}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium text-[#D4AF37] transition-colors"
                style={{ background: 'rgba(212,175,55,0.1)' }}>
                <Share2 size={12} /> Paylaş
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
