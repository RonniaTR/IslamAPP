import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, Copy, Share2, Sparkles, BookOpen, Loader2, Check } from 'lucide-react';
import api from '../api';

export default function NotesPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [copied, setCopied] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notes');
      setNotes(data);
    } catch { setNotes([]); }
    setLoading(false);
  };

  const deleteNote = async (noteId) => {
    setDeleting(noteId);
    try {
      await api.delete(`/notes/${encodeURIComponent(noteId)}`);
      setNotes(prev => prev.filter(n => n.created_at !== noteId));
    } catch {}
    setDeleting(null);
  };

  const copyNote = (note) => {
    const text = `${note.title}\n\n${note.content}${note.scholar_name ? `\n\n— ${note.scholar_name}` : ''}\n\n— İslami Yaşam Asistanı`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(note.created_at);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareNote = (note) => {
    const text = `${note.title}\n\n${note.content}${note.scholar_name ? `\n\n— ${note.scholar_name}` : ''}\n\n— İslami Yaşam Asistanı`;
    if (navigator.share) navigator.share({ title: note.title, text }).catch(() => {});
    else copyNote(note);
  };

  const filtered = filter === 'all' ? notes : notes.filter(n => n.type === filter);

  return (
    <div className="animate-fade-in" data-testid="notes-page">
      <div className="px-5 pt-10 pb-4" style={{ background: 'linear-gradient(180deg, rgba(15,61,46,0.5) 0%, transparent 100%)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Heart size={20} className="text-[#D4AF37]" />
          <h1 className="text-xl font-bold text-[#F5F5DC]" style={{ fontFamily: 'Playfair Display, serif' }}>Notlarım</h1>
        </div>
        <p className="text-xs text-[#A8B5A0]">Kaydettiğiniz ayetler ve kıssalar</p>

        <div className="flex gap-2 mt-3">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'ayah', label: 'Ayetler' },
            { id: 'kissa', label: 'Kıssalar' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} data-testid={`filter-${f.id}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f.id ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30' : 'bg-white/5 text-[#A8B5A0] border border-white/10'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 size={24} className="animate-spin text-[#D4AF37] mx-auto" />
            <p className="text-xs text-[#A8B5A0] mt-2">Yükleniyor...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Heart size={40} className="text-[#A8B5A0]/30 mx-auto mb-3" />
            <p className="text-sm text-[#A8B5A0]">Henüz kayıtlı notunuz yok</p>
            <p className="text-xs text-[#A8B5A0]/60 mt-1">Kur'an okurken favori ayetlerinizi kaydedin</p>
            <button onClick={() => navigate('/quran')} data-testid="go-to-quran"
              className="mt-4 px-4 py-2 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] text-sm font-medium hover:bg-[#D4AF37]/25 transition-colors">
              <BookOpen size={14} className="inline mr-1" /> Kur'an'a Git
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((note, i) => (
              <div key={note.created_at || i} data-testid={`note-item-${i}`}
                className="card-islamic rounded-xl p-4 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {note.type === 'kissa' ? (
                      <Sparkles size={14} className="text-[#D4AF37] shrink-0" />
                    ) : (
                      <BookOpen size={14} className="text-emerald-400 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[#F5F5DC]">{note.title}</p>
                      {note.scholar_name && (
                        <p className="text-[10px] text-[#D4AF37]/80 mt-0.5">{note.scholar_name}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    note.type === 'kissa' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'bg-emerald-500/15 text-emerald-400'
                  }`}>
                    {note.type === 'kissa' ? 'Kıssa' : 'Ayet'}
                  </span>
                </div>

                <p className="text-xs text-[#F5F5DC]/75 leading-relaxed line-clamp-4 whitespace-pre-wrap">{note.content}</p>

                {note.surah_number && (
                  <button onClick={() => navigate(`/quran/${note.surah_number}`)} data-testid={`note-go-surah-${i}`}
                    className="mt-2 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors">
                    Sure {note.surah_number}, Ayet {note.verse_number} →
                  </button>
                )}

                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#D4AF37]/10">
                  <button onClick={() => copyNote(note)} data-testid={`copy-note-${i}`}
                    className="flex items-center gap-1 text-[10px] text-[#D4AF37] px-2 py-1 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 transition-colors">
                    {copied === note.created_at ? <Check size={10} /> : <Copy size={10} />}
                    {copied === note.created_at ? 'Kopyalandı' : 'Kopyala'}
                  </button>
                  <button onClick={() => shareNote(note)} data-testid={`share-note-${i}`}
                    className="flex items-center gap-1 text-[10px] text-[#D4AF37] px-2 py-1 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 transition-colors">
                    <Share2 size={10} /> Paylaş
                  </button>
                  <button onClick={() => deleteNote(note.created_at)} data-testid={`delete-note-${i}`}
                    className="flex items-center gap-1 text-[10px] text-red-400 px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors ml-auto"
                    disabled={deleting === note.created_at}>
                    {deleting === note.created_at ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
