import { useEffect, useState } from 'react';

type AtlasTheme = 'light' | 'dark' | 'neon-dark';

const THEME_STORAGE_KEY = 'venom-atlas-theme';

export const ThemeSwitcher = () => {
  const [theme, setTheme] = useState<AtlasTheme>('dark');

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'neon-dark') {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <label className="theme-switcher" htmlFor="theme-select">
      Theme
      <select
        id="theme-select"
        value={theme}
        onChange={(event) => setTheme(event.target.value as AtlasTheme)}
        aria-label="Select color theme"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="neon-dark">Neon Dark</option>
      </select>
    </label>
  );
};
