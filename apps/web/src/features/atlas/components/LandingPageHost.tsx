import { Link } from 'react-router-dom';
import type { LandingPageOrchestration } from '../hooks/useLandingPageOrchestration';

type LandingPageHostProps = {
  orchestration: LandingPageOrchestration;
};

const LandingPageHost = ({ orchestration }: LandingPageHostProps) => {
  return (
    <section className="grid">
      <header className="panel">
        <h1>{orchestration.title}</h1>
        <p>{orchestration.summary}</p>
        <p className="muted">{orchestration.disclaimer}</p>
      </header>

      <div className="grid grid-2">
        {orchestration.tiles.map((tile) => (
          <Link className="panel" to={tile.href} key={tile.href}>
            {tile.label}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default LandingPageHost;
