import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    // تطبيق الثيم على body
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
      document.body.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
    if (language === 'ar') {
      document.documentElement.dir = 'ltr';
    } else {
      document.documentElement.dir = 'rtl';
    }
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <ThemeContext.Provider value={{ theme, language, toggleTheme, changeLanguage, setTheme, setLanguage }}>
      {children}
    </ThemeContext.Provider>
  );
};