import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import QuranList from './pages/QuranList';
import SurahDetail from './pages/SurahDetail';
import HadithPage from './pages/HadithPage';
import AiChat from './pages/AiChat';
import ScholarsPage from './pages/ScholarsPage';
import QuizPage from './pages/QuizPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/quran" element={<QuranList />} />
            <Route path="/quran/:surahNumber" element={<SurahDetail />} />
            <Route path="/hadith" element={<HadithPage />} />
            <Route path="/chat" element={<AiChat />} />
            <Route path="/scholars" element={<ScholarsPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
