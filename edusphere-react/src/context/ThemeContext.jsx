import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTheme, getCardStyle, getInputStyle, btnStyle, navItemStyle, badge, rgba } from '../styles/portalTheme';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('edvance_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (_) {}
    return 'light';
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    try {
      localStorage.setItem('edvance_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      if (isDark) {
        document.body.style.backgroundColor = '#0f172a';
        document.body.style.color = '#f8fafc';
      } else {
        document.body.style.backgroundColor = '#f5f3ef';
        document.body.style.color = '#1a1a1a';
      }
    } catch (_) {}
  }, [theme, isDark]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const T = getTheme(isDark);
  const cardStyle = getCardStyle(isDark);
  const inputStyle = getInputStyle(isDark);

  return (
    <ThemeContext.Provider value={{
      theme,
      isDark,
      toggleTheme,
      T,
      cardStyle,
      inputStyle,
      btnStyle,
      navItemStyle,
      badge,
      rgba
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    const isDark = false;
    return {
      theme: 'light',
      isDark: false,
      toggleTheme: () => {},
      T: getTheme(isDark),
      cardStyle: getCardStyle(isDark),
      inputStyle: getInputStyle(isDark),
      btnStyle,
      navItemStyle,
      badge,
      rgba
    };
  }
  return context;
}
