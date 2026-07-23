import { Link, useLocation } from 'react-router-dom';
import { defaultOrganismSlug } from '../../services/atlasRouting';

export const NotFoundPage = () => {
  const location = useLocation();

  return (
    <section className="panel">
      <h1>Atlas page not found</h1>
      <p>
        No route matches <strong>{location.pathname}</strong>.
      </p>
      <p className="muted">
        Try returning to the landing page or continue with the Solenopsis invicta organism profile.
      </p>
      <div className="grid grid-2">
        <Link to="/">Return to atlas home</Link>
        <Link to={`/organisms/${defaultOrganismSlug}`}>Open Solenopsis invicta</Link>
      </div>
    </section>
  );
};
