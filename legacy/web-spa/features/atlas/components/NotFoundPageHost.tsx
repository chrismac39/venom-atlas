import { Link } from 'react-router-dom';
import type { NotFoundPageOrchestration } from '../hooks/useNotFoundPageOrchestration';

type NotFoundPageHostProps = {
  orchestration: NotFoundPageOrchestration;
};

const NotFoundPageHost = ({ orchestration }: NotFoundPageHostProps) => {
  return (
    <section className="panel">
      <h1>Atlas page not found</h1>
      <p>
        No route matches <strong>{orchestration.pathname}</strong>.
      </p>
      <p className="muted">
        Try returning to the landing page or continue with the Solenopsis invicta organism profile.
      </p>
      <div className="grid grid-2">
        <Link to={orchestration.homeHref}>Return to atlas home</Link>
        <Link to={orchestration.defaultOrganismHref}>Open Solenopsis invicta</Link>
      </div>
    </section>
  );
};

export default NotFoundPageHost;
