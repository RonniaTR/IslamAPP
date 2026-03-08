import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff } from 'lucide-react';

const COMMANDS = [
  { keywords: ['kuran', 'quran'], path: '/quran' },
  { keywords: ['hadis', 'hadith'], path: '/hadith' },
  { keywords: ['namaz', 'vakit', 'prayer'], path: '/settings' },
  { keywords: ['ayet', 'verse'], path: '/' },
  { keywords: ['hoca', 'sor', 'scholar'], path: '/scholars' },
  { keywords: ['quiz', 'bilgi', 'test'], path: '/quiz' },
  { keywords: ['ramazan', 'iftar', 'sahur'], path: '/ramadan' },
  { keywords: ['sohbet', 'chat', 'dua'], path: '/chat' },
  { keywords: ['ayar', 'setting'], path: '/settings' },
  { keywords: ['not', 'kayıt', 'favori'], path: '/notes' },
];

export default function VoiceCommand() {
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState('');

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setFeedback('Tarayıcınız sesli komutu desteklemiyor');
      setTimeout(() => setFeedback(''), 2000);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setFeedback('Ses algılanamadı');
      setTimeout(() => setFeedback(''), 2000);
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.toLowerCase();
      setFeedback(`"${text}"`);
      const match = COMMANDS.find(cmd => cmd.keywords.some(kw => text.includes(kw)));
      if (match) {
        setTimeout(() => {
          navigate(match.path);
          setFeedback('');
        }, 800);
      } else {
        setTimeout(() => setFeedback(''), 2000);
      }
    };

    recognition.start();
  }, [navigate]);

  return (
    <div className="fixed bottom-20 right-4 z-40 max-w-[430px]" data-testid="voice-command">
      {feedback && (
        <div className="absolute bottom-16 right-0 glass rounded-xl px-3 py-2 text-xs text-[#F5F5DC] whitespace-nowrap mb-2 animate-fade-in">
          {feedback}
        </div>
      )}
      <button
        onClick={startListening}
        disabled={listening}
        aria-label="Sesli komut"
        data-testid="voice-btn"
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          listening
            ? 'bg-[#D4AF37] animate-pulse-gold'
            : 'bg-[#0F3D2E] border border-[#D4AF37]/30 hover:border-[#D4AF37]/60'
        }`}
      >
        {listening ? <Mic size={20} className="text-[#0A1F14]" /> : <MicOff size={20} className="text-[#D4AF37]" />}
      </button>
    </div>
  );
}
