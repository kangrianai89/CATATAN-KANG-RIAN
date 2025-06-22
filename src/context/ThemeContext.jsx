import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Ambil tema dari localStorage jika ada, jika tidak, default ke 'light'
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Simpan pilihan tema ke localStorage
    localStorage.setItem('theme', theme);
    // Kirim event agar komponen lain (seperti editor) tahu tema berubah
    window.dispatchEvent(new Event('themeChanged'));
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook custom untuk mempermudah penggunaan context
export const useTheme = () => {
  return useContext(ThemeContext);
};