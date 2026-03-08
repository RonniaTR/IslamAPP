import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, MessageCircle, Users, Award, ChevronRight, Volume2, Compass } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import api from '../api';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, setUser, checkAuth } = useAuth();
  const { t, selectedCity } = useLang();
  const location = useLocation();
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [randomVerse, setRandomVerse] = useState(null);

  // If user data passed from AuthCallback via location state, set it
  useEffect(() => {
    if (location.state?.user && !user) {
      setUser(location.state.user);
      // Clear state
      window.history.replaceState({}, '', location.pathname);
    } else if (!user) {
      checkAuth();
    }
  }, [location.state, user, setUser, checkAuth]);

  useEffect(() => {
    api.get(`/prayer-times/${selectedCity}`).then(r => setPrayerTimes(r.data)).catch(() => {});
    api.get('/quran/random').then(r => setRandomVerse(r.data)).catch(() => {});
  }, [selectedCity]);

  const prayerKeys = [
    { key: 'fajr', label: t.prayer_fajr },
    { key: 'sunrise', label: t.prayer_sunrise },
    { key: 'dhuhr', label: t.prayer_dhuhr },
    { key: 'asr', label: t.prayer_asr },
    { key: 'maghrib', label: t.prayer_maghrib },
    { key: 'isha', label: t.prayer_isha },
  ];

  const features = [
    { icon: BookOpen, label: t.quran, desc: t.quran_desc, path: '/quran', color: 'from-emerald-500/20 to-emerald-900/10' },
    { icon: Volume2, label: t.hadith, desc: t.hadith_desc, path: '/hadith', color: 'from-amber-500/20 to-amber-900/10' },
    { icon: MessageCircle, label: t.advisor, desc: t.advisor_desc, path: '/chat', color: 'from-blue-500/20 to-blue-900/10' },
    { icon: Users, label: t.scholars, desc: t.scholars_desc, path: '/scholars', color: 'from-purple-500/20 to-purple-900/10' },
    { icon: Award, label: t.quiz, desc: t.quiz_desc, path: '/quiz', color: 'from-rose-500/20 to-rose-900/10' },
  ];

  return (
    <div className="animate-fade-in" data-testid="dashboard">
      <div className="bg-gradient-to-b from-emerald-900/40 to-transparent px-5 pt-12 pb-6">
        <p className="text-emerald-400 text-sm font-medium">{t.bismillah}</p>
        <h1 className="text-2xl font-bold mt-1 text-white">{t.app_title}</h1>
        <p className="text-gray-400 text-sm mt-1">{t.greeting}{user?.name ? `, ${user.name}` : ''}</p>
      </div>

      {prayerTimes && (
        <div className="mx-4 -mt-1 glass rounded-2xl p-4 mb-5" data-testid="prayer-times-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-emerald-400" />
              <span className="text-sm font-semibold text-white">{prayerTimes.city_name}</span>
            </div>
            <span className="text-xs text-gray-500">{prayerTimes.date}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {prayerKeys.map(({ key, label }) => (
              <div key={key} className="text-center py-2 rounded-xl bg-white/5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-bold text-white mt-0.5">{prayerTimes[key]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {randomVerse && (
        <div className="mx-4 mb-5 glass rounded-2xl p-4" data-testid="daily-verse">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-[#d4a373]" />
            <span className="text-sm font-semibold text-[#d4a373]">{t.daily_verse}</span>
            <span className="text-xs text-gray-500 ml-auto">{randomVerse.surah_name} - {randomVerse.verse_number}</span>
          </div>
          <p className="arabic-text text-lg text-white/90 mb-3 leading-loose">{randomVerse.arabic}</p>
          <p className="text-sm text-gray-300 leading-relaxed">{randomVerse.turkish}</p>
        </div>
      )}

      <div className="px-4 mb-6">
        <h2 className="text-base font-semibold text-white mb-3">{t.explore}</h2>
        <div className="space-y-3">
          {features.map(({ icon: Icon, label, desc, path, color }) => (
            <button key={path} onClick={() => navigate(path)} data-testid={`feature-${path.slice(1)}`}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${color} border border-white/5 text-left transition-transform active:scale-[0.98]`}>
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
