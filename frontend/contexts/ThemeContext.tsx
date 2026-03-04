import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'dark' | 'light';

interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  border: string;
  card: string;
}

export const darkTheme: ThemeColors = {
  background: '#0a1628',
  surface: '#1e293b',
  surfaceSecondary: '#0f172a',
  text: '#f8fafc',
  textSecondary: '#e2e8f0',
  textMuted: '#64748b',
  primary: '#10b981',
  primaryLight: '#10b98120',
  border: '#334155',
  card: '#1e293b',
};

export const lightTheme: ThemeColors = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceSecondary: '#f1f5f9',
  text: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  primary: '#059669',
  primaryLight: '#05966920',
  border: '#e2e8f0',
  card: '#ffffff',
};

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('dark');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem('app_theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const colors = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
