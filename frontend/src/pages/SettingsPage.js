import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, MapPin, LogOut, Globe, ChevronRight, Languages, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import api from '../api';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, lang, setLang, selectedCity, setSelectedCity, defaultCountry, LANGUAGES } = useLang();
  const [cities, setCities] = useState([]);
  const [showCities, setShowCities] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [countryFilter, setCountryFilter] = useState(null);

  useEffect(() => {
    const q = countryFilter ? `?country=${countryFilter}&lang=${lang}` : `?lang=${lang}`;
    api.get(`/cities${q}`).then(r => setCities(r.data)).catch(() => {});
  }, [countryFilter, lang]);

  const cityObj = cities.find(c => c.id === selectedCity);

  return (
    <div className="animate-fade-in" data-testid="settings-page">
      <div className="bg-gradient-to-b from-gray-800/50 to-transparent px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Settings size={24} className="text-gray-400" />
          <h1 className="text-xl font-bold text-white">{t.settings}</h1>
        </div>
      </div>
      <div className="px-4 space-y-3 pb-6">
        {user && (
          <div className="glass rounded-xl p-4" data-testid="user-info">
            <p className="text-sm font-semibold text-white">{user.name}</p>
            {user.is_guest && <span className="inline-block mt-1 text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">{t.guest}</span>}
          </div>
        )}

        {/* Language Selection */}
        <div className="glass rounded-xl p-4">
          <button onClick={() => setShowLang(!showLang)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Languages size={18} className="text-blue-400" />
              <div>
                <p className="text-sm font-medium text-white text-left">{t.language}</p>
                <p className="text-xs text-gray-500">{LANGUAGES.find(l => l.code === lang)?.name}</p>
              </div>
            </div>
            <ChevronRight size={16} className={`text-gray-500 transition-transform ${showLang ? 'rotate-90' : ''}`} />
          </button>
          {showLang && (
            <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => { setLang(l.code); setShowLang(false); }}
                  data-testid={`lang-${l.code}`}
                  className={`w-full text-left text-sm p-2.5 rounded-lg transition-colors flex items-center gap-2 ${l.code === lang ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                  <span>{l.flag}</span> {l.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* City Selection */}
        <div className="glass rounded-xl p-4">
          <button onClick={() => setShowCities(!showCities)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-white text-left">{t.city}</p>
                <p className="text-xs text-gray-500">{cityObj?.name || t.select}</p>
              </div>
            </div>
            <ChevronDown size={16} className={`text-gray-500 transition-transform ${showCities ? 'rotate-180' : ''}`} />
          </button>
          {showCities && (
            <div className="mt-3 pt-3 border-t border-white/5">
              {/* Country filter tabs */}
              <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide pb-1">
                <button onClick={() => setCountryFilter(null)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium ${!countryFilter ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                  {t.all}
                </button>
                <button onClick={() => setCountryFilter('TR')}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium ${countryFilter === 'TR' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                  {t.all_turkey}
                </button>
                {['US','GB','DE','SA','AE'].map(cc => (
                  <button key={cc} onClick={() => setCountryFilter(cc)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium ${countryFilter === cc ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                    {cities.find(c => c.country === cc)?.country_name || cc}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto scrollbar-hide">
                {cities.map(c => (
                  <button key={c.id} onClick={() => { setSelectedCity(c.id); setShowCities(false); }}
                    data-testid={`city-${c.id}`}
                    className={`text-left text-xs p-2 rounded-lg transition-colors ${c.id === selectedCity ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Qibla Direction */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-amber-400" />
            <div>
              <p className="text-sm font-medium text-white">{t.qibla}</p>
              <p className="text-xs text-gray-500">{cityObj?.qibla_direction?.toFixed(1) || '--'}°</p>
            </div>
          </div>
        </div>

        <button onClick={async () => { await logout(); navigate('/login', { replace: true }); }} data-testid="logout-btn"
          className="w-full glass rounded-xl p-4 flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut size={18} />
          <span className="text-sm font-medium">{t.logout}</span>
        </button>
      </div>
    </div>
  );
}
