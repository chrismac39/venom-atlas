import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAtlasRouteSync } from '../hooks/useAtlasRouteSync';
import { defaultOrganismSlug, defaultToxinSlug } from '../services/atlasRouting';

const crumbText = (pathname: string): string[] => {
  const sequence: string[] = [];
  if (pathname.includes('/organisms/solenopsis-invicta')) {
    sequence.push('Red imported fire ant');
  }
  if (pathname.includes('/venom')) {
    sequence.push('Fire-ant venom');
  }
  if (pathname.includes('/toxins/solenopsin-a')) {
    sequence.push('Solenopsin A');
  }
  if (pathname.includes('/mechanism')) {
    sequence.push('Mechanism');
  }
  if (pathname.includes('/physiology')) {
    sequence.push('Human effects');
  }
  if (pathname.includes('/geography')) {
    sequence.push('Geography');
  }
  return sequence;
};

export const Layout = () => {
  const location = useLocation();
  useAtlasRouteSync();
  const crumbs = crumbText(location.pathname);

  return (
    <>
      <nav className="primary" aria-label="Main navigation">
        <Link to="/">Venom Atlas</Link>
        <Link to="/organisms">Organisms</Link>
        <Link to={`/toxins/${defaultToxinSlug}`}>Molecules</Link>
        <Link to={`/toxins/${defaultToxinSlug}/physiology`}>Physiology</Link>
        <Link to={`/organisms/${defaultOrganismSlug}/geography`}>Geography</Link>
      </nav>
      <main>
        {crumbs.length > 0 ? <div className="breadcrumb">{crumbs.join(' -> ')}</div> : null}
        <Outlet />
      </main>
    </>
  );
};
