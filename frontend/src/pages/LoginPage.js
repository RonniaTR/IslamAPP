import React from 'react';
import { BookOpen, Star, Moon } from 'lucide-react';

export default function LoginPage() {
  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-[#0c1222] flex flex-col items-center justify-center max-w-[430px] mx-auto px-6 relative overflow-hidden" data-testid="login-page">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-10 right-8 text-emerald-500/10">
          <Star size={120} />
        </div>
        <div className="absolute bottom-20 left-4 text-emerald-500/5">
          <Moon size={160} />
        </div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Logo & Title */}
      <div className="relative z-10 flex flex-col items-center text-center mb-12 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
          <BookOpen size={36} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          İslami Yaşam Asistanı
        </h1>
        <p className="text-gray-400 text-sm mt-3 max-w-[280px] leading-relaxed">
          Namaz vakitleri, Kur'an okuma, tefsir ve daha fazlası
        </p>
      </div>

      {/* Features Preview */}
      <div className="relative z-10 w-full space-y-3 mb-10 animate-fade-in" style={{ animationDelay: '0.15s' }}>
        {[
          { icon: '📖', text: "Kur'an-ı Kerim & Tefsir" },
          { icon: '🕌', text: 'Namaz Vakitleri & Kıble' },
          { icon: '💬', text: 'AI İslami Danışman' },
        ].map((item, i) => (
          <div key={i} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-lg">{item.icon}</span>
            <span className="text-gray-300 text-sm font-medium">{item.text}</span>
          </div>
        ))}
      </div>

      {/* Google Login Button */}
      <div className="relative z-10 w-full space-y-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <button
          onClick={handleGoogleLogin}
          data-testid="google-login-btn"
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.07l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google ile Giriş Yap
        </button>
      </div>

      {/* Footer */}
      <p className="relative z-10 text-gray-600 text-xs mt-8 text-center animate-fade-in" style={{ animationDelay: '0.45s' }}>
        Giriş yaparak kullanım şartlarını kabul etmiş olursunuz
      </p>
    </div>
  );
}
