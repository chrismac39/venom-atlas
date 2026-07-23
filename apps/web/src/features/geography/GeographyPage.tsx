import { useEffect, useState } from 'react';
import type { GeographicRange } from '@venom-atlas/domain';
import { atlasApi } from '../../services/apiClient';
import { RangeMapPanel } from '../../visualizations/maps/RangeMapPanel';

export const GeographyPage = () => {
  const [ranges, setRanges] = useState<GeographicRange[]>([]);

  useEffect(() => {
    atlasApi.getOrganismRange('org-solenopsis-invicta').then(setRanges).catch(console.error);
  }, []);

  return (
    <section className="grid">
      <h1>Ecology and geography</h1>
      <RangeMapPanel ranges={ranges} />
      <section className="panel">
        <h3>Layer model</h3>
        <p className="muted">
          Native range, introduced range, confirmed occurrence, habitat context, and uncertain range
          are distinct layer types.
        </p>
      </section>
    </section>
  );
};
