import { Link } from 'react-router-dom';

export const LandingPage = () => {
  return (
    <section className="grid">
      <header className="panel">
        <h1>Venom Atlas</h1>
        <p>
          A connected scientific atlas linking organism biology, venom composition, molecular
          representation, mechanism hypotheses, human physiology, and geography.
        </p>
        <p className="muted">Educational resource. Not medical advice.</p>
      </header>

      <div className="grid grid-2">
        <Link className="panel" to="/organisms">
          Browse organisms
        </Link>
        <Link className="panel" to="/toxins/solenopsin-a">
          Explore molecules
        </Link>
        <Link className="panel" to="/toxins/solenopsin-a/physiology">
          Explore physiological effects
        </Link>
        <Link className="panel" to="/organisms/solenopsis-invicta/geography">
          Explore geography
        </Link>
      </div>
    </section>
  );
};
