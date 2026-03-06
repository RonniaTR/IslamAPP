import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, MessageCircle, Award, Settings } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: 'Ana Sayfa' },
  { path: '/quran', icon: BookOpen, label: 'Kur\'an' },
  { path: '/chat', icon: MessageCircle, label: 'Sohbet' },
  { path: '/quiz', icon: Award, label: 'Quiz' },
  { path: '/settings', icon: Settings, label: 'Ayarlar' },
];

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const hideNav = pathname.match(/\/quran\/\d+/);

  return (
    <div className="min-h-screen bg-[#0c1222] flex flex-col max-w-[430px] mx-auto relative" data-testid="app-layout">
      <main className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
        <Outlet />
      </main>
      {!hideNav && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] glass border-t border-white/5 z-50" data-testid="bottom-nav">
          <div className="flex justify-around items-center h-16 px-1">
            {tabs.map(({ path, icon: Icon, label }) => {
              const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  data-testid={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${
                    active ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
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
