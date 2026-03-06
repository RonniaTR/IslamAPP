import React, { useState, useEffect } from 'react';
import { BookOpen, Search, ChevronRight, Star } from 'lucide-react';
import api from '../api';

export default function HadithPage() {
  const [categories, setCategories] = useState([]);
  const [hadiths, setHadiths] = useState([]);
  const [selected, setSelected] = useState(null);
  const [expandedHadith, setExpandedHadith] = useState(null);

  useEffect(() => {
    api.get('/hadith/categories').then(r => setCategories(r.data)).catch(() => {});
    api.get('/hadith/all').then(r => setHadiths(r.data)).catch(() => {});
  }, []);

  const filtered = selected ? hadiths.filter(h => h.category === selected) : hadiths;

  return (
    <div className="animate-fade-in" data-testid="hadith-page">
      <div className="bg-gradient-to-b from-amber-900/30 to-transparent px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={24} className="text-amber-400" />
          <h1 className="text-xl font-bold text-white">Hadis-i \u015eerif</h1>
        </div>
        <p className="text-sm text-gray-400">Sahih hadisler ve a\u00e7\u0131klamalar\u0131</p>
      </div>

      {/* Categories */}
      <div className="px-4 mb-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-2">
          <button onClick={() => setSelected(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!selected ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
            T\u00fcm\u00fc
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setSelected(c.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selected === c.id ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Hadiths */}
      <div className="px-4 space-y-3 pb-6">
        {filtered.map(h => (
          <div key={h.id} className="glass rounded-xl p-4 cursor-pointer" onClick={() => setExpandedHadith(expandedHadith === h.id ? null : h.id)} data-testid={`hadith-${h.id}`}>
            <p className="arabic-text text-base text-amber-200/80 mb-2">{h.arabic}</p>
            <p className="text-sm text-white font-medium mb-2">{h.turkish}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Star size={10} className="text-amber-400" />
              <span>{h.source}</span>
              <span>\u00b7</span>
              <span>{h.narrator}</span>
              <span className="ml-auto text-emerald-400 text-[10px]">{h.authenticity}</span>
            </div>
            {expandedHadith === h.id && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-sm text-gray-300 leading-relaxed">{h.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
