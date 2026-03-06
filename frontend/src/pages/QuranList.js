import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, BookOpen } from 'lucide-react';
import api from '../api';

export default function QuranList() {
  const navigate = useNavigate();
  const [surahs, setSurahs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/quran/surahs').then(r => {
      setSurahs(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = surahs.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.arabic?.includes(search) ||
    s.turkish_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.meaning?.toLowerCase().includes(search.toLowerCase()) ||
    String(s.number).includes(search)
  );

  return (
    <div className="animate-fade-in" data-testid="quran-list">
      {/* Header */}
      <div className="bg-gradient-to-b from-emerald-900/30 to-transparent px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen size={24} className="text-emerald-400" />
          <h1 className="text-xl font-bold text-white">Kur'an-\u0131 Kerim</h1>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Sure ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="quran-search-input"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Surah List */}
      <div className="px-4 pb-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Y\u00fckleniyor...</div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map(surah => (
              <button
                key={surah.number}
                onClick={() => navigate(`/quran/${surah.number}`)}
                data-testid={`surah-item-${surah.number}`}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left active:bg-white/10"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                  {surah.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{surah.turkish_name || surah.name}</p>
                    <p className="font-arabic text-base text-emerald-300/80">{surah.arabic}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-gray-500">{surah.meaning}</span>
                    <span className="text-[11px] text-gray-600">\u00b7</span>
                    <span className="text-[11px] text-gray-500">{surah.verses} ayet</span>
                    <span className="text-[11px] text-gray-600">\u00b7</span>
                    <span className="text-[11px] text-gray-500">{surah.revelation}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-600 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
