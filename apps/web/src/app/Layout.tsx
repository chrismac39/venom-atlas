import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAtlasRouteSync } from '../hooks/useAtlasRouteSync';
import { defaultOrganismSlug, defaultToxinSlug } from '../services/atlasRouting';

export const Layout = () => {
  const location = useLocation();
  const navRef = useRef<HTMLElement | null>(null);
  useAtlasRouteSync();
  const isOrganismRoute = location.pathname.startsWith('/organisms');

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

  return (
    <>
      <nav ref={navRef} className="primary" aria-label="Main navigation">
        <Link to="/">Venom Atlas</Link>
        <Link to="/organisms">Organisms</Link>
        <Link to={`/toxins/${defaultToxinSlug}`}>Molecules</Link>
        <Link to={`/toxins/${defaultToxinSlug}/physiology`}>Physiology</Link>
        <Link to={`/organisms/${defaultOrganismSlug}/geography`}>Geography</Link>
      </nav>
      <main className={isOrganismRoute ? 'main-organism-route' : undefined}>
        <Outlet />
      </main>
    </>
  );
};
