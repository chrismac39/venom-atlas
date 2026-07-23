import { Link } from 'react-router-dom';

export const LandingPage = () => {
  return (
    <section className="grid">
      <header className="panel">
        <h1>Venom Atlas</h1>
        <p>
          A connected scientific atlas linking organism biology, venom composition, molecular
          representation, mechanism hypotheses, human physiology, and range mapping.
        </p>
        <p className="muted">Educational resource. Not medical advice.</p>
      </header>

      <div className="grid grid-2">
        <Link className="panel" to="/#section-organism-profile">
          Organism profile
        </Link>
        <Link className="panel" to="/#section-geography">
          Geography and range map
        </Link>
        <Link className="panel" to="/#section-mechanisms">
          Exposure mechanisms
        </Link>
        <Link className="panel" to="/#section-toxin-charts">
          Toxin charts and chemistry
        </Link>
      </div>
    </section>
  );
};
