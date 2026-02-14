import { useState, useEffect, useCallback } from 'react';
import { ThemeContext } from './ThemeContext';

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to 'system'
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('themePreference');
    return saved || 'system';
  });

  // Track theme switches for achievements
  const [themeSwitchCount, setThemeSwitchCount] = useState(() => {
    const saved = localStorage.getItem('themeSwitchCount');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Track which themes have been tried
  const [triedThemes, setTriedThemes] = useState(() => {
    const saved = localStorage.getItem('triedThemes');
    return saved ? JSON.parse(saved) : [];
  });

  // Detect system theme preference
  const getSystemTheme = useCallback(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }, []);

  // Get the actual theme to apply (resolve 'system' to light/dark)
  const getResolvedTheme = useCallback(() => {
    if (theme === 'system') {
      return getSystemTheme();
    }
    return theme;
  }, [theme, getSystemTheme]);

  // Apply theme classes to document
  const applyThemeClasses = useCallback((resolvedTheme) => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-mixed');
    
    // Add the appropriate theme class
    root.classList.add(`theme-${resolvedTheme}`);
    
    // Set data attribute for CSS targeting
    root.setAttribute('data-theme', resolvedTheme);
    
    // Apply dark class for Tailwind
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const resolvedTheme = getResolvedTheme();
    applyThemeClasses(resolvedTheme);
  }, [theme, getResolvedTheme, applyThemeClasses]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const resolvedTheme = getSystemTheme();
      applyThemeClasses(resolvedTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, getSystemTheme, applyThemeClasses]);

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('themePreference', theme);
  }, [theme]);

  // Save theme switch tracking
  useEffect(() => {
    localStorage.setItem('themeSwitchCount', themeSwitchCount.toString());
  }, [themeSwitchCount]);

  useEffect(() => {
    localStorage.setItem('triedThemes', JSON.stringify(triedThemes));
  }, [triedThemes]);

  const switchTheme = (newTheme) => {
    setTheme(newTheme);
    setThemeSwitchCount(prev => prev + 1);
    
    // Track tried themes
    if (!triedThemes.includes(newTheme)) {
      setTriedThemes(prev => [...prev, newTheme]);
    }
  };

  const value = {
    theme,
    setTheme: switchTheme,
    resolvedTheme: getResolvedTheme(),
    themeSwitchCount,
    triedThemes,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
