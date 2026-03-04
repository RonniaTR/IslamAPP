import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'tr' | 'en' | 'es';

interface Translations {
  // Navigation
  home: string;
  scholars: string;
  quran: string;
  hadith: string;
  profile: string;
  
  // Common
  loading: string;
  search: string;
  settings: string;
  theme: string;
  language: string;
  darkMode: string;
  lightMode: string;
  
  // Dashboard
  greeting: string;
  nextPrayer: string;
  prayerTimes: string;
  quickAccess: string;
  dailyVerse: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  remaining: string;
  
  // Quran
  quranTitle: string;
  surahs: string;
  verses: string;
  bookmark: string;
  bookmarks: string;
  searchQuran: string;
  juz: string;
  page: string;
  meccan: string;
  medinan: string;
  resultsFound: string;
  
  // Hadith
  hadithTitle: string;
  categories: string;
  source: string;
  narrator: string;
  authentic: string;
  
  // Scholars
  scholarsTitle: string;
  askScholar: string;
  selectScholar: string;
  writeQuestion: string;
  getOpinion: string;
  sampleQuestions: string;
  
  // Profile
  profileTitle: string;
  level: string;
  points: string;
  streak: string;
  longestStreak: string;
  statistics: string;
  badges: string;
  pagesRead: string;
  hadithRead: string;
  focusTime: string;
  
  // AI Chat
  aiAssistant: string;
  askQuestion: string;
  clearChat: string;
  
  // Pomodoro
  pomodoro: string;
  start: string;
  pause: string;
  resume: string;
  stop: string;
  completed: string;
  sessions: string;
  
  // Qibla
  qibla: string;
  qiblaDirection: string;
  compass: string;
}

const translations: Record<Language, Translations> = {
  tr: {
    home: 'Ana Sayfa',
    scholars: 'Hocalar',
    quran: "Kur'an",
    hadith: 'Hadis',
    profile: 'Profil',
    loading: 'Yükleniyor...',
    search: 'Ara',
    settings: 'Ayarlar',
    theme: 'Tema',
    language: 'Dil',
    darkMode: 'Koyu Mod',
    lightMode: 'Aydınlık Mod',
    greeting: 'Selamün Aleyküm',
    nextPrayer: 'Sonraki Namaz',
    prayerTimes: 'Namaz Vakitleri',
    quickAccess: 'Hızlı Erişim',
    dailyVerse: 'Günün Ayeti',
    fajr: 'İmsak',
    sunrise: 'Güneş',
    dhuhr: 'Öğle',
    asr: 'İkindi',
    maghrib: 'Akşam',
    isha: 'Yatsı',
    remaining: 'kaldı',
    quranTitle: "Kur'an-ı Kerim",
    surahs: 'Sure',
    verses: 'Ayet',
    bookmark: 'Yer İmi',
    bookmarks: 'Yer İmleri',
    searchQuran: "Kur'an'da ara...",
    juz: 'Cüz',
    page: 'Sayfa',
    meccan: 'Mekke',
    medinan: 'Medine',
    resultsFound: 'sonuç bulundu',
    hadithTitle: 'Hadis-i Şerifler',
    categories: 'Kategoriler',
    source: 'Kaynak',
    narrator: 'Ravi',
    authentic: 'Sahih',
    scholarsTitle: 'Hocaların Görüşü',
    askScholar: 'Hocaya Sor',
    selectScholar: 'Hoca Seçin',
    writeQuestion: 'Sorunuzu Yazın',
    getOpinion: 'Görüşünü Al',
    sampleQuestions: 'Örnek Sorular',
    profileTitle: 'Profil',
    level: 'Seviye',
    points: 'Puan',
    streak: 'Seri',
    longestStreak: 'En Uzun Seri',
    statistics: 'İstatistikler',
    badges: 'Rozetler',
    pagesRead: "Kur'an Sayfası",
    hadithRead: 'Hadis Okunan',
    focusTime: 'Odaklanma',
    aiAssistant: 'İslami Danışman',
    askQuestion: 'Bir soru sorun...',
    clearChat: 'Sohbeti Temizle',
    pomodoro: 'İlim Pomodoro',
    start: 'Başla',
    pause: 'Duraklat',
    resume: 'Devam',
    stop: 'Durdur',
    completed: 'Tamamlanan',
    sessions: 'Oturum',
    qibla: 'Kıble',
    qiblaDirection: 'Kıble Yönü',
    compass: 'Pusula',
  },
  en: {
    home: 'Home',
    scholars: 'Scholars',
    quran: 'Quran',
    hadith: 'Hadith',
    profile: 'Profile',
    loading: 'Loading...',
    search: 'Search',
    settings: 'Settings',
    theme: 'Theme',
    language: 'Language',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    greeting: 'Assalamu Alaikum',
    nextPrayer: 'Next Prayer',
    prayerTimes: 'Prayer Times',
    quickAccess: 'Quick Access',
    dailyVerse: 'Daily Verse',
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
    remaining: 'remaining',
    quranTitle: 'Holy Quran',
    surahs: 'Surahs',
    verses: 'Verses',
    bookmark: 'Bookmark',
    bookmarks: 'Bookmarks',
    searchQuran: 'Search in Quran...',
    juz: 'Juz',
    page: 'Page',
    meccan: 'Meccan',
    medinan: 'Medinan',
    resultsFound: 'results found',
    hadithTitle: 'Hadith Collection',
    categories: 'Categories',
    source: 'Source',
    narrator: 'Narrator',
    authentic: 'Authentic',
    scholarsTitle: "Scholars' Opinions",
    askScholar: 'Ask Scholar',
    selectScholar: 'Select Scholar',
    writeQuestion: 'Write Your Question',
    getOpinion: 'Get Opinion',
    sampleQuestions: 'Sample Questions',
    profileTitle: 'Profile',
    level: 'Level',
    points: 'Points',
    streak: 'Streak',
    longestStreak: 'Longest Streak',
    statistics: 'Statistics',
    badges: 'Badges',
    pagesRead: 'Quran Pages',
    hadithRead: 'Hadith Read',
    focusTime: 'Focus Time',
    aiAssistant: 'Islamic Advisor',
    askQuestion: 'Ask a question...',
    clearChat: 'Clear Chat',
    pomodoro: 'Study Pomodoro',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    stop: 'Stop',
    completed: 'Completed',
    sessions: 'Sessions',
    qibla: 'Qibla',
    qiblaDirection: 'Qibla Direction',
    compass: 'Compass',
  },
  es: {
    home: 'Inicio',
    scholars: 'Eruditos',
    quran: 'Corán',
    hadith: 'Hadiz',
    profile: 'Perfil',
    loading: 'Cargando...',
    search: 'Buscar',
    settings: 'Ajustes',
    theme: 'Tema',
    language: 'Idioma',
    darkMode: 'Modo Oscuro',
    lightMode: 'Modo Claro',
    greeting: 'Assalamu Alaikum',
    nextPrayer: 'Próxima Oración',
    prayerTimes: 'Horarios de Oración',
    quickAccess: 'Acceso Rápido',
    dailyVerse: 'Verso del Día',
    fajr: 'Fajr',
    sunrise: 'Amanecer',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
    remaining: 'restante',
    quranTitle: 'Sagrado Corán',
    surahs: 'Suras',
    verses: 'Versículos',
    bookmark: 'Marcador',
    bookmarks: 'Marcadores',
    searchQuran: 'Buscar en el Corán...',
    juz: 'Juz',
    page: 'Página',
    meccan: 'Mequí',
    medinan: 'Medinés',
    resultsFound: 'resultados encontrados',
    hadithTitle: 'Colección de Hadiz',
    categories: 'Categorías',
    source: 'Fuente',
    narrator: 'Narrador',
    authentic: 'Auténtico',
    scholarsTitle: 'Opiniones de Eruditos',
    askScholar: 'Preguntar al Erudito',
    selectScholar: 'Seleccionar Erudito',
    writeQuestion: 'Escribe Tu Pregunta',
    getOpinion: 'Obtener Opinión',
    sampleQuestions: 'Preguntas de Ejemplo',
    profileTitle: 'Perfil',
    level: 'Nivel',
    points: 'Puntos',
    streak: 'Racha',
    longestStreak: 'Racha Más Larga',
    statistics: 'Estadísticas',
    badges: 'Insignias',
    pagesRead: 'Páginas del Corán',
    hadithRead: 'Hadiz Leídos',
    focusTime: 'Tiempo de Enfoque',
    aiAssistant: 'Asesor Islámico',
    askQuestion: 'Haz una pregunta...',
    clearChat: 'Borrar Chat',
    pomodoro: 'Pomodoro de Estudio',
    start: 'Iniciar',
    pause: 'Pausar',
    resume: 'Continuar',
    stop: 'Detener',
    completed: 'Completado',
    sessions: 'Sesiones',
    qibla: 'Qibla',
    qiblaDirection: 'Dirección de Qibla',
    compass: 'Brújula',
  },
};

interface LanguageContextType {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
  languages: { code: Language; name: string; flag: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('tr');

  const languages = [
    { code: 'tr' as Language, name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
    { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  ];

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('app_language');
      if (savedLang === 'tr' || savedLang === 'en' || savedLang === 'es') {
        setLanguageState(savedLang);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('app_language', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, t: translations[language], setLanguage, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
