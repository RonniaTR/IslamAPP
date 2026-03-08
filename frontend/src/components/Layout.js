import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, MessageCircle, Heart, Settings } from 'lucide-react';
import { useLang } from '../contexts/LangContext';

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const hideNav = pathname.match(/\/quran\/\d+/);
  const isRtl = lang === 'ar';

  const tabs = [
    { path: '/', icon: Home, label: t.home || 'Ana Sayfa' },
    { path: '/quran', icon: BookOpen, label: t.quran || "Kur'an" },
    { path: '/notes', icon: Heart, label: 'Notlarım' },
    { path: '/chat', icon: MessageCircle, label: t.chat || 'Sohbet' },
    { path: '/settings', icon: Settings, label: t.settings || 'Ayarlar' },
  ];

  return (
    <div className={`min-h-screen bg-[#0A1F14] flex flex-col max-w-[430px] mx-auto relative ${isRtl ? 'rtl' : 'ltr'}`} data-testid="app-layout" dir={isRtl ? 'rtl' : 'ltr'}>
      <main className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
        <Outlet />
      </main>
      {!hideNav && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] glass-dark z-50" data-testid="bottom-nav">
          <div className="flex justify-around items-center h-16 px-1">
            {tabs.map(({ path, icon: Icon, label }) => {
              const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
              return (
                <button key={path} onClick={() => navigate(path)}
                  data-testid={`nav-${path.slice(1) || 'home'}`}
                  aria-label={label}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${active ? 'text-[#D4AF37]' : 'text-[#A8B5A0] hover:text-[#F5F5DC]'}`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                  <span className="text-[10px] font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
