import { useEffect } from 'react';
import { ThemeContext } from './ThemeContext';

export const ThemeProvider = ({ children }) => {
  // Always apply dark mode
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply dark mode classes
    root.classList.add('dark', 'theme-dark');
    root.setAttribute('data-theme', 'dark');
    
    // Remove light theme classes if present
    root.classList.remove('theme-light', 'theme-mixed');
  }, []);

  const value = {
    theme: 'dark',
    resolvedTheme: 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
