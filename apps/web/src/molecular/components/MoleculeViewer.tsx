import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  MoleculeRenderModel,
  MolecularRepresentation,
  MolecularSurfaceColorMode,
  MolecularSurfaceKind,
  StructureInteractionAnnotation,
} from '../types';
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

export const MoleculeViewer = ({
  model,
  interactionAnnotation,
  title,
}: {
  model: MoleculeRenderModel;
  interactionAnnotation?: StructureInteractionAnnotation;
  title?: string;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [representation, setRepresentation] = useState<MolecularRepresentation>(
    model.defaultRepresentation,
  );
  const [surfaceKind, setSurfaceKind] = useState<MolecularSurfaceKind>('ses');
  const [surfaceOpacity, setSurfaceOpacity] = useState<number>(0.55);
  const [surfaceColorMode, setSurfaceColorMode] = useState<MolecularSurfaceColorMode>('element');
  const [uniformSurfaceColor, setUniformSurfaceColor] = useState('#5da9ff');
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(undefined);
  const [showResidueLabels, setShowResidueLabels] = useState<boolean>(true);
  const [showContactHighlights, setShowContactHighlights] = useState<boolean>(true);
  const [isViewerInteractive, setIsViewerInteractive] = useState<boolean>(false);
  const handleRef = useRef<MolecularRendererHandle | null>(null);

  useEffect(() => {
    setRepresentation(model.defaultRepresentation);
  }, [model.defaultRepresentation]);

  useEffect(() => {
    const firstPreset = interactionAnnotation?.cameraPresets[0]?.id;
    setSelectedPresetId(firstPreset);
  }, [interactionAnnotation]);

  useEffect(() => {
    setIsViewerInteractive(false);
  }, [model.entityId]);

  const surfaceEnabled =
    representation === 'molecular_surface' || representation === 'electrostatic_surface';

  const surfaceColorForRepresentation: MolecularSurfaceColorMode =
    representation === 'electrostatic_surface' ? 'electrostatic' : surfaceColorMode;

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
          ...(surfaceEnabled
            ? {
                surface: {
                  enabled: true,
                  kind: surfaceKind,
                  opacity: surfaceOpacity,
                  colorMode: surfaceColorForRepresentation,
                  uniformColor: uniformSurfaceColor,
                },
              }
            : {}),
          ...(interactionAnnotation
            ? {
                interactionView: {
                  annotation: interactionAnnotation,
                  selectedPresetId,
                  showResidueLabels,
                  showContactHighlights,
                },
              }
            : {}),
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
  }, [
    interactionAnnotation,
    model,
    representation,
    selectedPresetId,
    showContactHighlights,
    showResidueLabels,
    surfaceColorForRepresentation,
    surfaceEnabled,
    surfaceKind,
    surfaceOpacity,
    uniformSurfaceColor,
  ]);

  const description = useMemo(() => representationDescriptions[representation], [representation]);

  return (
    <section className="panel" aria-label="Molecular viewer">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>{title ?? '3D viewer'}</h3>
        <button
          type="button"
          onClick={() => {
            setRepresentation(model.defaultRepresentation);
            setSurfaceKind('ses');
            setSurfaceOpacity(0.55);
            setSurfaceColorMode('element');
            setUniformSurfaceColor('#5da9ff');
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

      {surfaceEnabled ? (
        <section className="panel">
          <h4>Surface controls</h4>
          <label htmlFor="surface-kind">Surface type</label>
          <select
            id="surface-kind"
            value={surfaceKind}
            onChange={(event) => setSurfaceKind(event.target.value as MolecularSurfaceKind)}
          >
            <option value="ses">Solvent-excluded surface</option>
            <option value="sas">Solvent-accessible surface</option>
            <option value="vdw">Van der Waals envelope</option>
            <option value="gaussian">Gaussian surface</option>
          </select>

          <label htmlFor="surface-opacity">Surface transparency ({surfaceOpacity.toFixed(2)})</label>
          <input
            id="surface-opacity"
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={surfaceOpacity}
            onChange={(event) => setSurfaceOpacity(Number.parseFloat(event.target.value))}
          />

          <label htmlFor="surface-color-mode">Surface coloring</label>
          <select
            id="surface-color-mode"
            value={surfaceColorForRepresentation}
            onChange={(event) => setSurfaceColorMode(event.target.value as MolecularSurfaceColorMode)}
            disabled={representation === 'electrostatic_surface'}
          >
            <option value="element">Element</option>
            <option value="uniform">Uniform color</option>
            <option value="hydrophobicity">Hydrophobicity (annotation-dependent)</option>
            <option value="electrostatic">Electrostatic potential (precomputed)</option>
          </select>

          {surfaceColorForRepresentation === 'uniform' ? (
            <label htmlFor="surface-uniform-color">
              Uniform color
              <input
                id="surface-uniform-color"
                type="color"
                value={uniformSurfaceColor}
                onChange={(event) => setUniformSurfaceColor(event.target.value)}
              />
            </label>
          ) : null}

          {surfaceColorForRepresentation === 'hydrophobicity' ? (
            <p className="muted">
              Hydrophobicity coloring requires residue-level annotations generated during data prep.
            </p>
          ) : null}
          {surfaceColorForRepresentation === 'electrostatic' ? (
            <p className="muted">
              Electrostatic coloring requires precomputed potential maps (for example DX/CUBE from
              PDB2PQR/APBS). Runtime computation is intentionally out of scope.
            </p>
          ) : null}
        </section>
      ) : null}

      {interactionAnnotation ? (
        <section className="panel">
          <h4>Complex view controls</h4>
          <label htmlFor="camera-preset">Camera preset</label>
          <select
            id="camera-preset"
            value={selectedPresetId}
            onChange={(event) => setSelectedPresetId(event.target.value)}
          >
            {interactionAnnotation.cameraPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
          <label htmlFor="show-residue-labels">
            <input
              id="show-residue-labels"
              type="checkbox"
              checked={showResidueLabels}
              onChange={(event) => setShowResidueLabels(event.target.checked)}
            />
            Show residue labels
          </label>
          <label htmlFor="show-contact-highlights">
            <input
              id="show-contact-highlights"
              type="checkbox"
              checked={showContactHighlights}
              onChange={(event) => setShowContactHighlights(event.target.checked)}
            />
            Highlight annotated contacts
          </label>
        </section>
      ) : null}

      {error ? (
        <p>{error}</p>
      ) : (
        <div
          className="molecule-viewer-interaction-layer"
          onMouseLeave={() => setIsViewerInteractive(false)}
        >
          <div
            ref={containerRef}
            className={`molecule-viewer-canvas-host${isViewerInteractive ? ' molecule-viewer-canvas-host-interactive' : ''}`}
          />

          {!isViewerInteractive ? (
            <button
              type="button"
              className="molecule-viewer-overlay"
              onClick={() => setIsViewerInteractive(true)}
              aria-label="Enable 3D viewer interaction"
            >
              <span className="molecule-viewer-overlay-pill">
                <span className="molecule-viewer-overlay-title">Click to interact with 3D render</span>
                <span className="molecule-viewer-overlay-subtitle">
                  Page scroll stays locked until you activate viewer controls.
                </span>
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="molecule-viewer-lock-button"
              onClick={() => setIsViewerInteractive(false)}
            >
              Lock 3D view
            </button>
          )}
        </div>
      )}
    </section>
  );
};
