import { useEffect, useMemo, useRef, useState } from 'react';
import type { MoleculeRenderModel, MolecularRepresentation } from '../types';
import { pickMolecularRenderer } from '../adapters/selectRenderer';
import type { MolecularRendererHandle } from '../types';

const representationDescriptions: Record<MolecularRepresentation, string> = {
  two_dimensional_skeletal:
    '2D skeletal formulas emphasize atom connectivity and functional groups.',
  ball_and_stick: 'Ball-and-stick emphasizes both bonding and relative atom positions.',
  stick: 'Stick representation emphasizes connectivity and stereochemical arrangement.',
  space_filling: 'Space-filling approximates occupied volume and steric envelope.',
  molecular_surface: 'Molecular surfaces convey accessible contour and interaction envelope.',
  electrostatic_surface: 'Electrostatic surfaces convey charge distribution hypotheses.',
  ribbon: 'Ribbon representations summarize protein backbone and secondary structure.',
  cartoon: 'Cartoon views simplify higher-order structure for proteins and complexes.',
  amino_acid_sequence: 'Sequence representation emphasizes residue ordering.',
  target_complex: 'Target complex view emphasizes spatial context with a molecular target.',
};

export const MoleculeViewer = ({ model }: { model: MoleculeRenderModel }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [representation, setRepresentation] = useState<MolecularRepresentation>(
    model.defaultRepresentation,
  );
  const handleRef = useRef<MolecularRendererHandle | null>(null);

  useEffect(() => {
    setRepresentation(model.defaultRepresentation);
  }, [model.defaultRepresentation]);

  useEffect(() => {
    const mount = async (): Promise<void> => {
      if (!containerRef.current) {
        return;
      }
      const adapter = pickMolecularRenderer(model);
      if (!adapter) {
        setError('No compatible molecular renderer for this entity/class combination.');
        return;
      }
      try {
        setError(null);
        handleRef.current?.dispose();
        handleRef.current = await adapter.mount(containerRef.current, model, {
          representation,
          backgroundColor: '#171818',
        });
      } catch (mountError) {
        setError((mountError as Error).message);
      }
    };

    void mount();

    return () => {
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [model, representation]);

  const description = useMemo(() => representationDescriptions[representation], [representation]);

  return (
    <section className="panel" aria-label="Molecular viewer">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>3D viewer</h3>
        <button
          type="button"
          onClick={() => {
            setRepresentation(model.defaultRepresentation);
          }}
        >
          Reset view
        </button>
      </div>
      <label htmlFor="representation">Representation</label>
      <select
        id="representation"
        value={representation}
        onChange={(event) => setRepresentation(event.target.value as MolecularRepresentation)}
      >
        {model.supportedRepresentations.map((entry) => (
          <option key={entry} value={entry}>
            {entry}
          </option>
        ))}
      </select>
      <p className="muted">{description}</p>
      {error ? <p>{error}</p> : <div ref={containerRef} style={{ minHeight: 320 }} />}
    </section>
  );
};
