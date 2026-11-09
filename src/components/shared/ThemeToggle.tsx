
"use client";

import { useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sun, Moon } from 'lucide-react';

const THEME_STORAGE_KEY = 'quettaAppTheme';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme) {
      setIsDark(storedTheme === 'dark');
    } else {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  const handleCheckedChange = (checked: boolean) => {
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      setIsDark(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="theme-mode-global-toggle" className="cursor-pointer flex items-center">
        {isDark ? <Moon className="h-4 w-4 text-foreground" /> : <Sun className="h-4 w-4 text-foreground" />}
      </Label>
      <Switch
        id="theme-mode-global-toggle"
        checked={isDark}
        onCheckedChange={handleCheckedChange}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        className="w-9 h-5 data-[state=checked]:translate-x-[0.80rem] data-[state=unchecked]:translate-x-px [&>span]:w-3.5 [&>span]:h-3.5" // Adjusted switch size and thumb travel
      />
    </div>
  );
}
