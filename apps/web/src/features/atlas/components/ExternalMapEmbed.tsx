import { useRef, useState } from 'react';
import type { GeographyVisualization } from '../atlas-types';

export const ExternalMapEmbed = ({ visualization }: { visualization: GeographyVisualization }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const loadButtonRef = useRef<HTMLButtonElement | null>(null);

  const unloadMap = () => {
    setIsLoaded(false);
    window.requestAnimationFrame(() => loadButtonRef.current?.focus());
  };

  return (
    <section className="panel organism-antmaps-wrap">
      <div className="atlas-map-heading">
        <div>
          <p className="atlas-section-eyebrow">External distribution data</p>
          <h3>{visualization.label}</h3>
        </div>
        {isLoaded ? (
          <button type="button" onClick={unloadMap}>Unload map</button>
        ) : null}
      </div>

      {isLoaded ? (
        <iframe
          className="organism-antmaps-embed organism-antmaps-embed-interactive"
          src={visualization.url}
          title={`${visualization.provider} species distribution explorer`}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="atlas-map-consent">
          <p>
            Load the interactive map from {visualization.provider}. This contacts an external service and may
            download additional data.
          </p>
          <div className="atlas-map-actions">
            <button ref={loadButtonRef} type="button" onClick={() => setIsLoaded(true)}>
              Load interactive map
            </button>
            <a href={visualization.url} target="_blank" rel="noreferrer">Open on {visualization.provider}</a>
          </div>
        </div>
      )}
    </section>
  );
};