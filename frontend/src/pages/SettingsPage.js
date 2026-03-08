import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, MapPin, LogOut, Globe, ChevronRight, Languages, ChevronDown, Bell, BellOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import api from '../api';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, lang, setLang, selectedCity, setSelectedCity, LANGUAGES } = useLang();
  const [cities, setCities] = useState([]);
  const [showCities, setShowCities] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [countryFilter, setCountryFilter] = useState(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifSupported, setNotifSupported] = useState(false);

  useEffect(() => {
    setNotifSupported('Notification' in window && 'serviceWorker' in navigator);
    if ('Notification' in window) setNotifEnabled(Notification.permission === 'granted');
  }, []);

  const toggleNotifications = async () => {
    if (!notifSupported) return;
    if (notifEnabled) { setNotifEnabled(false); return; }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setNotifEnabled(true);
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js');
          new Notification('Bildirimler Açıldı', { body: 'Günlük İslami bilgi bildirimleri aktif!', icon: '/favicon.ico' });
        } catch {}
      }
    }
  };

  useEffect(() => {
    const q = countryFilter ? `?country=${countryFilter}&lang=${lang}` : `?lang=${lang}`;
    api.get(`/cities${q}`).then(r => setCities(r.data)).catch(() => {});
  }, [countryFilter, lang]);

  const cityObj = cities.find(c => c.id === selectedCity);

  return (
    <div className="animate-fade-in" data-testid="settings-page">
      <div className="px-5 pt-10 pb-4" style={{ background: 'linear-gradient(180deg, rgba(15,61,46,0.4) 0%, transparent 100%)' }}>
        <div className="flex items-center gap-3 mb-2">
          <Settings size={24} className="text-[#D4AF37]" />
          <h1 className="text-xl font-bold text-[#F5F5DC]" style={{ fontFamily: 'Playfair Display, serif' }}>{t.settings || 'Ayarlar'}</h1>
        </div>
      </div>
      <div className="px-4 space-y-3 pb-6">
        {user && (
          <div className="card-islamic rounded-xl p-4" data-testid="user-info">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img src={user.picture} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>
                  {(user.name || '?')[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-[#F5F5DC]">{user.name}</p>
                {user.is_guest && <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>Misafir</span>}
              </div>
            </div>
          </div>
        )}

        {/* Language Selection */}
        <div className="card-islamic rounded-xl p-4">
          <button onClick={() => setShowLang(!showLang)} className="w-full flex items-center justify-between" aria-label="Dil seçimi">
            <div className="flex items-center gap-3">
              <Languages size={18} className="text-[#D4AF37]" />
              <div>
                <p className="text-sm font-medium text-[#F5F5DC] text-left">{t.language || 'Dil'}</p>
                <p className="text-xs text-[#A8B5A0]">{LANGUAGES.find(l => l.code === lang)?.name}</p>
              </div>
            </div>
            <ChevronRight size={16} className={`text-[#A8B5A0] transition-transform ${showLang ? 'rotate-90' : ''}`} />
          </button>
          {showLang && (
            <div className="mt-3 pt-3 border-t border-[#D4AF37]/10 space-y-1.5">
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => { setLang(l.code); setShowLang(false); }}
                  data-testid={`lang-${l.code}`}
                  className={`w-full text-left text-sm p-2.5 rounded-lg transition-colors flex items-center gap-2 ${l.code === lang ? 'text-[#D4AF37]' : 'text-[#A8B5A0] hover:text-[#F5F5DC]'}`}
                  style={{ background: l.code === lang ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)' }}>
                  <span>{l.flag}</span> {l.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* City Selection */}
        <div className="card-islamic rounded-xl p-4">
          <button onClick={() => setShowCities(!showCities)} className="w-full flex items-center justify-between" aria-label="Şehir seçimi">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-[#D4AF37]" />
              <div>
                <p className="text-sm font-medium text-[#F5F5DC] text-left">{t.city || 'Şehir'}</p>
                <p className="text-xs text-[#A8B5A0]">{cityObj?.name || t.select || 'Seçiniz'}</p>
              </div>
            </div>
            <ChevronDown size={16} className={`text-[#A8B5A0] transition-transform ${showCities ? 'rotate-180' : ''}`} />
          </button>
          {showCities && (
            <div className="mt-3 pt-3 border-t border-[#D4AF37]/10">
              <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide pb-1">
                {[{ label: t.all || 'Tümü', val: null }, { label: t.all_turkey || 'Türkiye', val: 'TR' }].map(({ label, val }) => (
                  <button key={label} onClick={() => setCountryFilter(val)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium ${countryFilter === val ? 'text-[#D4AF37]' : 'text-[#A8B5A0]'}`}
                    style={{ background: countryFilter === val ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)' }}>
                    {label}
                  </button>
                ))}
                {['US','GB','DE','SA','AE'].map(cc => (
                  <button key={cc} onClick={() => setCountryFilter(cc)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium ${countryFilter === cc ? 'text-[#D4AF37]' : 'text-[#A8B5A0]'}`}
                    style={{ background: countryFilter === cc ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)' }}>
                    {cities.find(c => c.country === cc)?.country_name || cc}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto scrollbar-hide">
                {cities.map(c => (
                  <button key={c.id} onClick={() => { setSelectedCity(c.id); setShowCities(false); }}
                    data-testid={`city-${c.id}`}
                    className={`text-left text-xs p-2 rounded-lg transition-colors ${c.id === selectedCity ? 'text-[#D4AF37]' : 'text-[#A8B5A0] hover:text-[#F5F5DC]'}`}
                    style={{ background: c.id === selectedCity ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)' }}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Qibla */}
        <div className="card-islamic rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-[#D4AF37]" />
            <div>
              <p className="text-sm font-medium text-[#F5F5DC]">{t.qibla || 'Kıble'}</p>
              <p className="text-xs text-[#A8B5A0]">{cityObj?.qibla_direction?.toFixed(1) || '--'}°</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notifSupported && (
          <div className="card-islamic rounded-xl p-4" data-testid="notif-settings">
            <button onClick={toggleNotifications} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                {notifEnabled ? <Bell size={18} className="text-[#D4AF37]" /> : <BellOff size={18} className="text-[#A8B5A0]" />}
                <div>
                  <p className="text-sm font-medium text-[#F5F5DC] text-left">Günlük Bildirimler</p>
                  <p className="text-xs text-[#A8B5A0]">{notifEnabled ? 'Açık' : 'Kapalı'}</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full flex items-center p-0.5 transition-colors ${notifEnabled ? 'bg-[#D4AF37]' : 'bg-white/10'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${notifEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        )}

        <button onClick={async () => { await logout(); navigate('/login', { replace: true }); }} data-testid="logout-btn"
          aria-label="Çıkış yap"
          className="w-full card-islamic rounded-xl p-4 flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut size={18} />
          <span className="text-sm font-medium">{t.logout || 'Çıkış Yap'}</span>
        </button>
      </div>
    </div>
  );
}
