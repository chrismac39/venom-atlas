import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAtlasRouteSync } from '../hooks/useAtlasRouteSync';

type AtlasTheme = 'light' | 'dark' | 'neon-dark';

const THEME_STORAGE_KEY = 'venom-atlas-theme';

const normalizeTheme = (savedTheme: string | null): AtlasTheme => {
  if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'neon-dark') {
    return savedTheme;
  }

  if (savedTheme === 'modern-light') {
    return 'light';
  }

  if (savedTheme === 'modern-dark') {
    return 'dark';
  }

  if (savedTheme === 'neon-night') {
    return 'neon-dark';
  }

  if (savedTheme === 'deep-ocean') {
    return 'dark';
  }

  if (savedTheme === 'field-notes') {
    return 'light';
  }

  if (savedTheme === 'ember') {
    return 'neon-dark';
  }

  return 'dark';
};

export const Layout = () => {
  const location = useLocation();
  const navRef = useRef<HTMLElement | null>(null);
  const [theme, setTheme] = useState<AtlasTheme>('dark');
  useAtlasRouteSync();
  const isOrganismRoute = location.pathname.startsWith('/organisms');

  useEffect(() => {
    setTheme(normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY)));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const setNavHeight = () => {
      const navHeight = Math.ceil(nav.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--top-ribbon-height', `${navHeight}px`);
    };

    setNavHeight();
    const observer = new ResizeObserver(setNavHeight);
    observer.observe(nav);
    window.addEventListener('resize', setNavHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', setNavHeight);
    };
  }, []);

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) {
      return;
    }

    const targetId = decodeURIComponent(location.hash.replace('#', '').trim());
    if (!targetId) {
      return;
    }

    const runScroll = () => {
      const targetElement = document.getElementById(targetId);
      if (!targetElement) {
        return;
      }

      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

      if (targetElement instanceof HTMLElement) {
        targetElement.focus({ preventScroll: true });
      }
    };

    window.requestAnimationFrame(runScroll);
  }, [location.hash, location.pathname]);

  return (
    <>
      <nav ref={navRef} className="primary" aria-label="Main navigation">
        <Link to="/">Venom Atlas</Link>
        <Link to="/#section-organism-profile">Profile</Link>
        <Link to="/#section-geography">Geography</Link>
        <Link to="/#section-mechanisms">Mechanisms</Link>
        <Link to="/#section-toxin-categorization">Categorization</Link>
        <Link to="/#section-toxin-charts">Charts</Link>
        <Link to="/#section-chemistry">Chemistry</Link>
        <Link to="/#section-human-physiology">Human Physiology</Link>

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
      </nav>
      <main className={isOrganismRoute ? 'main-organism-route' : undefined}>
        <Outlet />
      </main>
    </>
  );
};
