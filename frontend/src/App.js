import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LangProvider } from './contexts/LangContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import QuranList from './pages/QuranList';
import SurahDetail from './pages/SurahDetail';
import HadithPage from './pages/HadithPage';
import AiChat from './pages/AiChat';
import ScholarsPage from './pages/ScholarsPage';
import MealAudioPage from './pages/MealAudioPage';
import QuizPage from './pages/QuizPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c1222] flex items-center justify-center max-w-[430px] mx-auto">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRouter() {
  const location = useLocation();

  // CRITICAL: Check URL fragment for session_id synchronously during render
  // This prevents race conditions - useEffect runs AFTER first render, too late!
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/quran" element={<QuranList />} />
        <Route path="/quran/:surahNumber" element={<SurahDetail />} />
        <Route path="/hadith" element={<HadithPage />} />
        <Route path="/chat" element={<AiChat />} />
        <Route path="/scholars" element={<ScholarsPage />} />
        <Route path="/meal-audio" element={<MealAudioPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LangProvider>
          <AppRouter />
        </LangProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
