import React, { useState, useEffect } from 'react';
import { Settings, MapPin, Moon, Sun, LogOut, Globe, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('istanbul');
  const [showCities, setShowCities] = useState(false);

  useEffect(() => {
    api.get('/cities').then(r => setCities(r.data)).catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in" data-testid="settings-page">
      <div className="bg-gradient-to-b from-gray-800/50 to-transparent px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Settings size={24} className="text-gray-400" />
          <h1 className="text-xl font-bold text-white">Ayarlar</h1>
        </div>
      </div>

      <div className="px-4 space-y-3 pb-6">
        {/* User info */}
        {user && (
          <div className="glass rounded-xl p-4" data-testid="user-info">
            <p className="text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
            {user.is_guest && <span className="inline-block mt-1 text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Misafir</span>}
          </div>
        )}

        {/* City selection */}
        <div className="glass rounded-xl p-4">
          <button onClick={() => setShowCities(!showCities)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-white text-left">\u015eehir</p>
                <p className="text-xs text-gray-500">{cities.find(c => c.id === selectedCity)?.name || 'Se\u00e7iniz'}</p>
              </div>
            </div>
            <ChevronRight size={16} className={`text-gray-500 transition-transform ${showCities ? 'rotate-90' : ''}`} />
          </button>
          {showCities && (
            <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto scrollbar-hide">
              {cities.map(c => (
                <button key={c.id} onClick={() => { setSelectedCity(c.id); setShowCities(false); }}
                  data-testid={`city-${c.id}`}
                  className={`text-left text-xs p-2 rounded-lg transition-colors ${c.id === selectedCity ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Qibla Direction */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-amber-400" />
            <div>
              <p className="text-sm font-medium text-white">K\u0131ble Y\u00f6n\u00fc</p>
              <p className="text-xs text-gray-500">{cities.find(c => c.id === selectedCity)?.qibla_direction?.toFixed(1) || '--'}\u00b0</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button onClick={logout} data-testid="logout-btn"
          className="w-full glass rounded-xl p-4 flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut size={18} />
          <span className="text-sm font-medium">\u00c7\u0131k\u0131\u015f Yap</span>
        </button>
      </div>
    </div>
  );
}
