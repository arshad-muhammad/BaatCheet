import React, { useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { appearance } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    
    console.log('ThemeProvider: Dark mode state changed to:', appearance.darkMode);
    
    // Apply dark mode
    if (appearance.darkMode) {
      root.classList.add('dark');
      console.log('ThemeProvider: Added dark class to root');
    } else {
      root.classList.remove('dark');
      console.log('ThemeProvider: Removed dark class from root');
    }

    // Apply accent color
    root.style.setProperty('--accent-color', appearance.accentColor);

    // Apply compact mode
    if (appearance.compactMode) {
      root.classList.add('compact');
    } else {
      root.classList.remove('compact');
    }
  }, [appearance]);

  return <>{children}</>;
};

export default ThemeProvider; 