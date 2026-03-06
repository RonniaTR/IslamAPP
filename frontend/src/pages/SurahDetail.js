import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, SkipForward, SkipBack, Volume2, ChevronDown } from 'lucide-react';
import api from '../api';

const MAZLUM_KIPER_BASE = 'https://www.vavtv.com.tr/podcast/meal-sure/mazlum-kiper';

export default function SurahDetail() {
  const { surahNumber } = useParams();
  const navigate = useNavigate();
  const [surah, setSurah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reciter, setReciter] = useState('alafasy');
  const [reciters, setReciters] = useState([]);
  const [showReciters, setShowReciters] = useState(false);
  const [playingVerse, setPlayingVerse] = useState(null);
  const [playingFull, setPlayingFull] = useState(false);
  const audioRef = useRef(new Audio());
  const fullAudioRef = useRef(new Audio());

  useEffect(() => {
    api.get('/quran/reciters').then(r => setReciters(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get(`/quran/surah/${surahNumber}?reciter=${reciter}`)
      .then(r => { setSurah(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [surahNumber, reciter]);

  useEffect(() => {
    return () => {
      audioRef.current.pause();
      fullAudioRef.current.pause();
    };
  }, []);

  const playVerse = useCallback((verse) => {
    if (playingVerse === verse.number) {
      audioRef.current.pause();
      setPlayingVerse(null);
      return;
    }
    audioRef.current.pause();
    fullAudioRef.current.pause();
    setPlayingFull(false);
    audioRef.current.src = verse.audio_url;
    audioRef.current.play().catch(() => {});
    setPlayingVerse(verse.number);
    audioRef.current.onended = () => setPlayingVerse(null);
  }, [playingVerse]);

  const playFullSurah = () => {
    if (playingFull) {
      fullAudioRef.current.pause();
      setPlayingFull(false);
      return;
    }
    audioRef.current.pause();
    setPlayingVerse(null);
    fullAudioRef.current.src = surah.full_audio_url;
    fullAudioRef.current.play().catch(() => {});
    setPlayingFull(true);
    fullAudioRef.current.onended = () => setPlayingFull(false);
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Y\u00fckleniyor...</div>;
  if (!surah) return <div className="flex items-center justify-center h-screen text-gray-500">Sure bulunamad\u0131</div>;

  return (
    <div className="animate-fade-in pb-4" data-testid="surah-detail">
      {/* Header */}
      <div className="bg-gradient-to-b from-emerald-900/40 to-transparent px-4 pt-10 pb-4">
        <button onClick={() => navigate('/quran')} className="flex items-center gap-1 text-emerald-400 text-sm mb-3" data-testid="back-to-quran">
          <ArrowLeft size={18} /> Sureler
        </button>
        <div className="text-center">
          <p className="font-arabic text-3xl text-emerald-300/90 mb-1">{surah.arabic_name}</p>
          <h1 className="text-lg font-bold text-white">{surah.name}</h1>
          <p className="text-xs text-gray-400 mt-1">{surah.meaning} \u00b7 {surah.total_verses} ayet \u00b7 {surah.revelation}</p>
        </div>

        {/* Audio Controls */}
        <div className="mt-4 glass rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setShowReciters(!showReciters)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
              <Volume2 size={14} />
              <span>{reciters.find(r => r.id === reciter)?.name || reciter}</span>
              <ChevronDown size={12} />
            </button>
            <a href={MAZLUM_KIPER_BASE} target="_blank" rel="noreferrer" className="text-[10px] text-amber-400 hover:text-amber-300">
              T\u00fcrk\u00e7e Meal Sesi
            </a>
          </div>
          {showReciters && (
            <div className="mb-3 grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto scrollbar-hide">
              {reciters.map(r => (
                <button key={r.id} onClick={() => { setReciter(r.id); setShowReciters(false); }}
                  className={`text-left text-xs p-2 rounded-lg transition-colors ${r.id === reciter ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                  {r.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center justify-center gap-6">
            <button onClick={playFullSurah} data-testid="play-full-surah" className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${playingFull ? 'bg-emerald-500 text-white' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}>
              {playingFull ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-500 mt-2">{playingFull ? 'T\u00fcm Sure \u00c7al\u0131n\u0131yor...' : 'T\u00fcm Sureyi Dinle'}</p>
        </div>
      </div>

      {/* Bismillah */}
      {surah.number !== 1 && surah.number !== 9 && (
        <div className="text-center py-4">
          <p className="font-arabic text-xl text-emerald-300/70">\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064e\u0647\u0650 \u0627\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650</p>
        </div>
      )}

      {/* Verses */}
      <div className="px-4 space-y-4">
        {surah.verses.map(verse => (
          <div key={verse.number}
            data-testid={`verse-${verse.number}`}
            className={`rounded-xl p-4 transition-all ${playingVerse === verse.number ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-white/[0.02] border border-white/5'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                {verse.number}
              </div>
              <button onClick={() => playVerse(verse)} data-testid={`play-verse-${verse.number}`}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${playingVerse === verse.number ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                {playingVerse === verse.number ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
              </button>
            </div>
            <p className="arabic-text text-xl text-white/90 mb-4 leading-[2.5]">{verse.arabic}</p>
            {verse.turkish && (
              <p className="text-sm text-gray-300 leading-relaxed border-t border-white/5 pt-3">
                <span className="text-emerald-400 font-medium">{verse.number}.</span> {verse.turkish}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
