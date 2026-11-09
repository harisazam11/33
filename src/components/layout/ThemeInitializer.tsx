
"use client";

import { useEffect } from 'react';

const THEME_STORAGE_KEY = 'quettaAppTheme';

export default function ThemeInitializer() {
  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return null; // This component does not render any visible UI
}
