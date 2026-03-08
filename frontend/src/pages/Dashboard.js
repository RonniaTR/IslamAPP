import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Volume2, Moon, Compass, Heart, Share2, ChevronRight, Check, Users, Copy, Play, Pause, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import api from '../api';

// ─── TTS Hook ───
function useTTS() {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);

  const speak = useCallback(async (text) => {
    if (playing && audioRef.current) { audioRef.current.pause(); audioRef.current = null; setPlaying(false); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/tts', { text });
      const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
      audioRef.current = audio;
      audio.onended = () => { setPlaying(false); audioRef.current = null; };
      audio.onerror = () => { setPlaying(false); audioRef.current = null; };
      await audio.play();
      setPlaying(true);
    } catch { setPlaying(false); }
    setLoading(false);
  }, [playing]);

  return { speak, playing, loading };
}

// ─── Share Helper ───
function shareOrCopy(title, text) {
  const full = `${title}\n\n${text}\n\n— İslami Yaşam Asistanı`;
  if (navigator.share) {
    navigator.share({ title, text: full }).catch(() => {});
  } else {
    navigator.clipboard.writeText(full).then(() => {}).catch(() => {});
  }
}

// ─── Mood Section (horizontal scroll) ───
function MoodSection() {
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const tts = useTTS();

  const moods = [
    { id: 'huzur', label: 'Huzur', icon: '☮️', desc: 'İç huzur ve sükûnet' },
    { id: 'motivasyon', label: 'Motivasyon', icon: '🔥', desc: 'Güç ve azim' },
    { id: 'sabir', label: 'Sabır', icon: '🌿', desc: 'Dayanma gücü' },
    { id: 'sukur', label: 'Şükür', icon: '✨', desc: 'Nimete şükretmek' },
  ];

  const handleMood = async (id) => {
    setSelected(id);
    setLoading(true);
    try {
      const { data } = await api.get(`/mood/${id}`);
      setContent(data);
    } catch { setContent(null); }
    setLoading(false);
  };

  return (
    <div className="mb-5 animate-fade-in" data-testid="mood-section">
      <p className="text-sm text-[#D4AF37] mb-3 px-4" style={{ fontFamily: 'Playfair Display, serif' }}>
        Bugün kalbin neye ihtiyaç duyuyor?
      </p>
      {/* Horizontal scroll mood cards */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
        {moods.map(m => (
          <button key={m.id} onClick={() => handleMood(m.id)} data-testid={`mood-${m.id}`}
            className={`shrink-0 w-28 rounded-2xl py-3 px-2 text-center transition-all duration-300 ${selected === m.id ? 'scale-[1.03]' : ''}`}
            style={{ background: selected === m.id ? 'rgba(212,175,55,0.2)' : 'rgba(15,61,46,0.5)', border: `1px solid ${selected === m.id ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.08)'}` }}>
            <span className="text-2xl block mb-1">{m.icon}</span>
            <span className="text-xs font-semibold text-[#F5F5DC] block">{m.label}</span>
            <span className="text-[9px] text-[#A8B5A0] mt-0.5 block">{m.desc}</span>
          </button>
        ))}
      </div>
      {loading && <div className="text-center py-4"><div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" /></div>}
      {content && !loading && (
        <div className="mx-4 mt-3 card-islamic rounded-2xl p-4 animate-fade-in" data-testid="mood-content">
          <p className="arabic-text text-base text-[#F5F5DC]/90 mb-1">{content.ayet.arabic}</p>
          <p className="text-sm text-[#A8B5A0] mb-1">{content.ayet.turkish}</p>
          <p className="text-[10px] text-[#D4AF37] mb-3">— {content.ayet.sure}</p>
          <div className="border-t border-[#D4AF37]/10 pt-3 mb-3">
            <p className="text-sm text-[#F5F5DC]/80 italic">"{content.hadis.turkish}"</p>
            <p className="text-[10px] text-[#A8B5A0] mt-1">— {content.hadis.source}</p>
          </div>
          <div className="border-t border-[#D4AF37]/10 pt-3">
            <p className="text-[10px] text-[#D4AF37] uppercase tracking-wider mb-1">Dua</p>
            <p className="text-sm text-[#F5F5DC]/80">{content.dua}</p>
          </div>
          <div className="flex gap-2 mt-3 pt-3 border-t border-[#D4AF37]/10">
            <button onClick={() => tts.speak(`${content.ayet.turkish}. ${content.hadis.turkish}. ${content.dua}`)} data-testid="mood-tts"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium text-[#D4AF37] transition-colors"
              style={{ background: 'rgba(212,175,55,0.1)' }}>
              {tts.loading ? <Loader size={12} className="animate-spin" /> : tts.playing ? <Pause size={12} /> : <Play size={12} />}
              {tts.loading ? 'Yükleniyor' : tts.playing ? 'Durdur' : 'Dinle'}
            </button>
            <button onClick={() => shareOrCopy(content.label, `${content.ayet.turkish}\n(${content.ayet.sure})\n\n"${content.hadis.turkish}" — ${content.hadis.source}\n\nDua: ${content.dua}`)} data-testid="mood-share"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium text-[#D4AF37] transition-colors"
              style={{ background: 'rgba(212,175,55,0.1)' }}>
              <Share2 size={12} /> Paylaş
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Daily Verse Card ───
function DailyVerse({ verse }) {
  const tts = useTTS();
  if (!verse) return null;
  return (
    <div className="mx-4 mb-4 card-islamic rounded-2xl p-4 animate-fade-in" data-testid="daily-verse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-[#D4AF37]" />
          <span className="text-sm font-semibold text-[#D4AF37]">Günün Ayeti</span>
        </div>
        <span className="text-xs text-[#A8B5A0]">{verse.surah_name} - {verse.verse_number}</span>
      </div>
      <p className="arabic-text text-lg text-[#F5F5DC]/90 mb-3 leading-loose">{verse.arabic}</p>
      <p className="text-sm text-[#A8B5A0] leading-relaxed mb-3">{verse.turkish}</p>
      <div className="flex gap-2 pt-2 border-t border-[#D4AF37]/10">
        <button onClick={() => tts.speak(verse.turkish)} data-testid="verse-listen-btn" aria-label="Ayeti dinle"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium text-[#D4AF37] transition-colors"
          style={{ background: 'rgba(212,175,55,0.1)' }}>
          {tts.loading ? <Loader size={12} className="animate-spin" /> : tts.playing ? <Pause size={12} /> : <Volume2 size={12} />}
          {tts.loading ? 'Yükleniyor...' : tts.playing ? 'Durdur' : 'Dinle'}
        </button>
        <button onClick={() => shareOrCopy('Günün Ayeti', `${verse.arabic}\n\n${verse.turkish}\n— ${verse.surah_name} ${verse.verse_number}`)} data-testid="verse-share-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium text-[#D4AF37] transition-colors"
          style={{ background: 'rgba(212,175,55,0.1)' }}>
          <Share2 size={12} /> Paylaş
        </button>
      </div>
    </div>
  );
}

// ─── Daily Hadith Card ───
function DailyHadith({ hadith }) {
  const tts = useTTS();
  if (!hadith) return null;
  return (
    <div className="mx-4 mb-4 card-islamic rounded-2xl p-4 animate-fade-in" data-testid="daily-hadith">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-[#E8C84A]" />
          <span className="text-sm font-semibold text-[#E8C84A]">Günün Hadisi</span>
        </div>
        <span className="text-xs text-[#A8B5A0]">{hadith.source}</span>
      </div>
      <p className="arabic-text text-base text-[#F5F5DC]/90 mb-2">{hadith.arabic}</p>
      <p className="text-sm text-[#A8B5A0] leading-relaxed mb-3">{hadith.turkish}</p>
      <div className="flex gap-2 pt-2 border-t border-[#D4AF37]/10">
        <button onClick={() => tts.speak(hadith.turkish)} data-testid="hadith-listen-btn" aria-label="Hadisi dinle"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium text-[#E8C84A] transition-colors"
          style={{ background: 'rgba(232,200,74,0.1)' }}>
          {tts.loading ? <Loader size={12} className="animate-spin" /> : tts.playing ? <Pause size={12} /> : <Volume2 size={12} />}
          {tts.loading ? 'Yükleniyor...' : tts.playing ? 'Durdur' : 'Dinle'}
        </button>
        <button onClick={() => shareOrCopy('Günün Hadisi', `${hadith.arabic}\n\n${hadith.turkish}\n— ${hadith.source}`)} data-testid="hadith-share-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium text-[#E8C84A] transition-colors"
          style={{ background: 'rgba(232,200,74,0.1)' }}>
          <Share2 size={12} /> Paylaş
        </button>
      </div>
    </div>
  );
}

// ─── Knowledge Cards (HUGE, horizontal scroll) ───
function KnowledgeCards() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);

  useEffect(() => { api.get('/knowledge-cards').then(r => setCards(r.data)).catch(() => {}); }, []);
  if (!cards.length) return null;

  return (
    <div className="mb-5 animate-fade-in" data-testid="knowledge-cards">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-bold text-[#F5F5DC]" style={{ fontFamily: 'Playfair Display, serif' }}>İslam Bilgi Hazinesi</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full text-[#D4AF37]" style={{ background: 'rgba(212,175,55,0.15)' }}>
          {cards.reduce((s, c) => s + c.items.length, 0)}+ bilgi
        </span>
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-3">
        {cards.map(card => (
          <button key={card.id} onClick={() => navigate(`/knowledge/${card.id}`)} data-testid={`knowledge-${card.id}`}
            className="shrink-0 w-56 rounded-2xl p-5 text-left transition-all active:scale-[0.97]"
            style={{ background: `linear-gradient(135deg, rgba(15,61,46,0.7), rgba(10,31,20,0.9))`, border: `1px solid ${card.color || '#D4AF37'}30`, minHeight: '160px' }}>
            <span className="text-3xl block mb-3">{card.icon || '📖'}</span>
            <p className="text-base font-bold text-[#F5F5DC] mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>{card.title}</p>
            <p className="text-xs text-[#A8B5A0] mb-3">{card.items.length} konu</p>
            <div className="flex items-center gap-1 text-xs font-medium" style={{ color: card.color || '#D4AF37' }}>
              <span>Keşfet</span>
              <ChevronRight size={14} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Dhikr Counter Widget ───
function DhikrWidget() {
  const [dhikrList, setDhikrList] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => { api.get('/dhikr').then(r => setDhikrList(r.data)).catch(() => {}); }, []);
  const current = dhikrList[activeIdx];

  const handleCount = () => {
    setCount(c => c + 1);
    if (navigator.vibrate) navigator.vibrate(30);
  };

  if (!dhikrList.length) return null;

  return (
    <div className="mx-4 mb-5 animate-fade-in" data-testid="dhikr-widget">
      {!open ? (
        <button onClick={() => setOpen(true)} data-testid="dhikr-start-btn"
          className="w-full card-islamic rounded-2xl p-4 flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.15)' }}>
            <span className="text-lg">📿</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#F5F5DC]">Zikir Sayacı</p>
            <p className="text-[11px] text-[#A8B5A0]">Zikir başlat</p>
          </div>
          <ChevronRight size={16} className="text-[#D4AF37] ml-auto" />
        </button>
      ) : (
        <div className="card-islamic rounded-2xl p-5 text-center" data-testid="dhikr-counter">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-4 pb-1 justify-center flex-wrap">
            {dhikrList.map((d, i) => (
              <button key={d.id} onClick={() => { setActiveIdx(i); setCount(0); }}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${i === activeIdx ? 'text-[#0A1F14] bg-[#D4AF37]' : 'text-[#A8B5A0]'}`}
                style={i !== activeIdx ? { background: 'rgba(255,255,255,0.05)' } : {}}>
                {d.turkish}
              </button>
            ))}
          </div>
          {current && (
            <>
              <p className="arabic-text text-xl text-[#F5F5DC] mb-1">{current.arabic}</p>
              <p className="text-xs text-[#A8B5A0] mb-4">{current.meaning}</p>
              <button onClick={handleCount} data-testid="dhikr-tap-btn"
                className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-bold text-[#E8C84A] transition-all active:scale-90 animate-pulse-gold"
                style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))', border: '2px solid rgba(212,175,55,0.3)' }}>
                {count}
              </button>
              {current.recommended > 0 && <p className="text-[10px] text-[#A8B5A0] mt-2">Hedef: {current.recommended}</p>}
              <button onClick={() => { setOpen(false); setCount(0); }} className="text-xs text-[#D4AF37] mt-3 hover:underline">Kapat</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Worship Tracker ───
function WorshipTracker() {
  const [items, setItems] = useState({ namaz: false, kuran: false, sadaka: false, zikir: false });

  useEffect(() => { api.get('/worship/today').then(r => setItems(prev => ({ ...prev, ...r.data }))).catch(() => {}); }, []);

  const toggle = async (key) => {
    const updated = { ...items, [key]: !items[key] };
    setItems(updated);
    api.post('/worship/track', { namaz: updated.namaz, kuran: updated.kuran, sadaka: updated.sadaka, zikir: updated.zikir }).catch(() => {});
  };

  const labels = [
    { key: 'namaz', label: 'Namaz kılındı', icon: '🕌' },
    { key: 'kuran', label: "Kur'an okundu", icon: '📖' },
    { key: 'sadaka', label: 'Sadaka verildi', icon: '💰' },
    { key: 'zikir', label: 'Zikir yapıldı', icon: '📿' },
  ];
  const done = Object.values(items).filter(Boolean).length;

  return (
    <div className="mx-4 mb-5 card-islamic rounded-2xl p-4 animate-fade-in" data-testid="worship-tracker">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>Günlük İbadet Takibi</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>{done}/4</span>
      </div>
      <div className="space-y-2">
        {labels.map(({ key, label, icon }) => (
          <button key={key} onClick={() => toggle(key)} data-testid={`worship-${key}`}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all"
            style={{ background: items[key] ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.02)' }}>
            <span className="text-base">{icon}</span>
            <span className={`text-sm flex-1 text-left ${items[key] ? 'text-[#D4AF37] line-through' : 'text-[#F5F5DC]'}`}>{label}</span>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${items[key] ? 'bg-[#D4AF37]' : ''}`}
              style={!items[key] ? { border: '1.5px solid rgba(212,175,55,0.3)' } : {}}>
              {items[key] && <Check size={12} className="text-[#0A1F14]" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Ramadan Mini Card ───
function RamadanMini({ prayerTimes }) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (!prayerTimes?.maghrib) return;
    const update = () => {
      const now = new Date();
      const [h, m] = prayerTimes.maghrib.split(':').map(Number);
      const iftar = new Date(now); iftar.setHours(h, m, 0, 0);
      if (iftar <= now) { setCountdown(null); return; }
      const diff = iftar - now;
      setCountdown(`${String(Math.floor(diff/3600000)).padStart(2,'0')}:${String(Math.floor((diff%3600000)/60000)).padStart(2,'0')}:${String(Math.floor((diff%60000)/1000)).padStart(2,'0')}`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [prayerTimes]);

  return (
    <button onClick={() => navigate('/ramadan')} data-testid="ramadan-mini"
      className="mx-4 mb-5 w-[calc(100%-2rem)] rounded-2xl p-4 text-left animate-fade-in transition-all active:scale-[0.98]"
      style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))', border: '1px solid rgba(212,175,55,0.25)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon size={18} className="text-[#D4AF37]" />
          <span className="text-sm font-semibold text-[#D4AF37]">Ramazan</span>
        </div>
        {countdown && <span className="text-lg font-bold text-[#E8C84A]" style={{ fontFamily: 'Inter, monospace' }}>{countdown}</span>}
        <ChevronRight size={16} className="text-[#D4AF37]" />
      </div>
      {countdown && <p className="text-[10px] text-[#A8B5A0] mt-1">İftara kalan süre</p>}
    </button>
  );
}

// ─── Scholar CTA ───
function ScholarCTA() {
  const navigate = useNavigate();
  return (
    <div className="mx-4 mb-5 card-islamic rounded-2xl p-4 animate-fade-in" data-testid="scholar-cta">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.15)' }}>
          <Users size={22} className="text-[#D4AF37]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#F5F5DC]">Hocaya Sor</p>
          <p className="text-[11px] text-[#A8B5A0]">12 farklı hocadan görüş al</p>
        </div>
        <button onClick={() => navigate('/scholars')} data-testid="scholar-ask-btn" aria-label="Hocaya sor"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-[#0A1F14] bg-[#D4AF37] hover:bg-[#E8C84A] transition-colors active:scale-95">
          Soru Sor
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───
export default function Dashboard() {
  const { user } = useAuth();
  const { selectedCity } = useLang();
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [randomVerse, setRandomVerse] = useState(null);
  const [randomHadith, setRandomHadith] = useState(null);

  useEffect(() => {
    api.get(`/prayer-times/${selectedCity}`).then(r => setPrayerTimes(r.data)).catch(() => {});
    api.get('/quran/random').then(r => setRandomVerse(r.data)).catch(() => {});
    api.get('/hadith/random').then(r => setRandomHadith(r.data)).catch(() => {});
  }, [selectedCity]);

  const prayerKeys = [
    { key: 'fajr', label: 'İmsak' }, { key: 'sunrise', label: 'Güneş' },
    { key: 'dhuhr', label: 'Öğle' }, { key: 'asr', label: 'İkindi' },
    { key: 'maghrib', label: 'Akşam' }, { key: 'isha', label: 'Yatsı' },
  ];

  return (
    <div className="pb-4" data-testid="dashboard">
      {/* Header */}
      <div className="px-5 pt-10 pb-4" style={{ background: 'linear-gradient(180deg, rgba(15,61,46,0.5) 0%, transparent 100%)' }}>
        <p className="text-[#D4AF37] text-xs tracking-widest uppercase">Bismillahirrahmanirrahim</p>
        <h1 className="text-2xl font-bold mt-1 text-[#F5F5DC]" style={{ fontFamily: 'Playfair Display, serif' }}>
          Selam{user?.name ? `, ${user.name}` : ''}
        </h1>
      </div>

      <MoodSection />
      <DailyVerse verse={randomVerse} />
      <DailyHadith hadith={randomHadith} />
      <KnowledgeCards />
      <DhikrWidget />
      <WorshipTracker />
      <RamadanMini prayerTimes={prayerTimes} />

      {/* Prayer Times */}
      {prayerTimes && (
        <div className="mx-4 mb-5 card-islamic rounded-2xl p-4 animate-fade-in" data-testid="prayer-times-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-[#D4AF37]" />
              <span className="text-sm font-semibold text-[#F5F5DC]">{prayerTimes.city_name}</span>
            </div>
            <span className="text-xs text-[#A8B5A0]">{prayerTimes.date}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {prayerKeys.map(({ key, label }) => (
              <div key={key} className="text-center py-2 rounded-xl" style={{ background: 'rgba(212,175,55,0.06)' }}>
                <p className="text-[10px] text-[#D4AF37] uppercase tracking-wide">{label}</p>
                <p className="text-sm font-bold text-[#F5F5DC] mt-0.5">{prayerTimes[key]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ScholarCTA />
    </div>
  );
}
