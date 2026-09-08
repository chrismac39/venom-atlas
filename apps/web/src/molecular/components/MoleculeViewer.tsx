import { useEffect, useId, useMemo, useState } from 'react';
import type { MoleculeRenderModel, MolecularRenderOptions, MolecularRepresentation, StructureInteractionAnnotation } from '../types';
import { useMolecularRenderer } from '../hooks/useMolecularRenderer';

const supported = new Set<MolecularRepresentation>([
  'ball_and_stick', 'stick', 'space_filling', 'molecular_surface', 'cartoon', 'ribbon', 'target_complex',
]);
const descriptions: Partial<Record<MolecularRepresentation, string>> = {
  ball_and_stick: 'Ball-and-stick emphasizes bonding and relative atom positions.',
  stick: 'Stick representation emphasizes connectivity and stereochemical arrangement.',
  space_filling: 'Space-filling approximates occupied volume and steric envelope.',
  molecular_surface: 'Geometric molecular contour, not an electrostatic or hydrophobicity analysis.',
  cartoon: 'Cartoon views summarize protein backbone structure.',
  ribbon: 'Ribbon views summarize protein backbone structure.',
  target_complex: 'Spatial context from a supplied structure; not an inferred binding mechanism.',
};

export const MoleculeViewer = ({ model, interactionAnnotation, title }: {
  model: MoleculeRenderModel;
  interactionAnnotation?: StructureInteractionAnnotation;
  title?: string;
}) => {
  const id = useId();
  const defaultRepresentation = supported.has(model.defaultRepresentation) ? model.defaultRepresentation : 'ball_and_stick';
  const [representation, setRepresentation] = useState<MolecularRepresentation>(defaultRepresentation);
  const [surfaceKind, setSurfaceKind] = useState<'ses' | 'sas' | 'vdw'>('ses');
  const [surfaceOpacity, setSurfaceOpacity] = useState(0.55);
  const [surfaceColorMode, setSurfaceColorMode] = useState<'element' | 'uniform'>('element');
  const [uniformColor, setUniformColor] = useState('#5da9ff');
  const [selectedPresetId, setSelectedPresetId] = useState(interactionAnnotation?.cameraPresets[0]?.id);
  const [showContactHighlights, setShowContactHighlights] = useState(true);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    setRepresentation(defaultRepresentation);
    setSelectedPresetId(interactionAnnotation?.cameraPresets[0]?.id);
  }, [model.entityId, defaultRepresentation, interactionAnnotation]);

  const options = useMemo<MolecularRenderOptions>(() => ({
    representation,
    backgroundColor: '#171818',
    surface: { enabled: representation === 'molecular_surface', kind: surfaceKind, opacity: surfaceOpacity, colorMode: surfaceColorMode, uniformColor },
    ...(interactionAnnotation ? { interactionView: { annotation: interactionAnnotation, selectedPresetId, showContactHighlights, showResidueLabels: false } } : {}),
  }), [representation, surfaceKind, surfaceOpacity, surfaceColorMode, uniformColor, interactionAnnotation, selectedPresetId, showContactHighlights]);
  const { containerRef, handleRef, error, isLoading, retry } = useMolecularRenderer(model, options);
  const reset = () => {
    setRepresentation(defaultRepresentation);
    setSurfaceKind('ses');
    setSurfaceOpacity(0.55);
    setSurfaceColorMode('element');
    setUniformColor('#5da9ff');
    setSelectedPresetId(interactionAnnotation?.cameraPresets[0]?.id);
    setShowContactHighlights(true);
    handleRef.current?.resetView?.();
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Stop the renderer's wheel listener BEFORE it prevents page scrolling.
    // An unfocused viewer leaves the browser's default scroll intact.
    const wheel = (event: WheelEvent) => {
      if (document.activeElement !== container) event.stopPropagation();
    };
    container.addEventListener('wheel', wheel, { capture: true, passive: true });
    return () => container.removeEventListener('wheel', wheel, true);
  }, [containerRef]);

  return (
    <section className="panel" aria-label="Molecular viewer" data-state={error ? 'error' : isLoading ? 'loading' : 'ready'}>
      <div className="molecule-viewer-heading">
        <h3>{title ?? '3D viewer'}</h3>
        <button type="button" onClick={reset} disabled={isLoading || !!error}>Reset view</button>
      </div>
      <label htmlFor={`${id}-representation`}>Representation</label>
      <select id={`${id}-representation`} value={representation} disabled={!!error}
        onChange={(event) => setRepresentation(event.target.value as MolecularRepresentation)}>
        {model.supportedRepresentations.filter((entry) => supported.has(entry)).map((entry) => (
          <option key={entry} value={entry}>{entry}</option>
        ))}
      </select>
      <p className="muted">{descriptions[representation]}</p>
      <details>
        <summary>Advanced display controls</summary>
        <p className="muted">Gaussian surfaces, hydrophobicity, electrostatic analysis, and residue-contact labels are unavailable; no substitute analysis is displayed. The 2D skeletal formula is a separate image.</p>
        {representation === 'molecular_surface' ? (
          <fieldset disabled={!!error}>
            <legend>Geometric surface controls</legend>
            <label htmlFor={`${id}-surface`}>Surface type</label>
            <select id={`${id}-surface`} value={surfaceKind} onChange={(event) => setSurfaceKind(event.target.value as typeof surfaceKind)}>
              <option value="ses">Solvent-excluded surface</option>
              <option value="sas">Solvent-accessible surface</option>
              <option value="vdw">Van der Waals envelope</option>
            </select>
            <label htmlFor={`${id}-opacity`}>Surface opacity ({surfaceOpacity.toFixed(2)})</label>
            <input id={`${id}-opacity`} type="range" min={0.05} max={1} step={0.05} value={surfaceOpacity}
              onChange={(event) => setSurfaceOpacity(Number.parseFloat(event.target.value))} />
            <label htmlFor={`${id}-color`}>Surface coloring</label>
            <select id={`${id}-color`} value={surfaceColorMode} onChange={(event) => setSurfaceColorMode(event.target.value as typeof surfaceColorMode)}>
              <option value="element">Element</option><option value="uniform">Uniform color</option>
            </select>
            {surfaceColorMode === 'uniform' ? <label>Uniform color <input type="color" value={uniformColor} onChange={(event) => setUniformColor(event.target.value)} /></label> : null}
          </fieldset>
        ) : null}
        {interactionAnnotation ? (
          <fieldset disabled={!!error}>
            <legend>Complex view controls</legend>
            <label htmlFor={`${id}-preset`}>Camera preset</label>
            <select id={`${id}-preset`} value={selectedPresetId} onChange={(event) => setSelectedPresetId(event.target.value)}>
              {interactionAnnotation.cameraPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
            </select>
            <label><input type="checkbox" checked={showContactHighlights} onChange={(event) => setShowContactHighlights(event.target.checked)} />Highlight annotated contacts</label>
          </fieldset>
        ) : null}
      </details>
      <p id={`${id}-help`} className="muted">{focused ? 'Scroll to zoom; press Escape to return to page scrolling.' : 'Focus or click the structure to enable scroll zoom.'} Drag to rotate. Arrow keys rotate; +/− zoom; Home resets. Tab leaves the viewer.</p>
      <div className="molecule-viewer-interaction-layer" hidden={!!error}>
        <div ref={containerRef} className="molecule-viewer-canvas-host" tabIndex={0} role="group"
          aria-label={`${model.displayName} interactive molecular structure`} aria-describedby={`${id}-help`} aria-busy={isLoading}
          onPointerDown={(event) => event.currentTarget.focus({ preventScroll: true })}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            const handle = handleRef.current;
            if (!handle) return;
            switch (event.key) {
              case 'ArrowLeft': handle.rotate?.(-15, 'y'); break;
              case 'ArrowRight': handle.rotate?.(15, 'y'); break;
              case 'ArrowUp': handle.rotate?.(-15, 'x'); break;
              case 'ArrowDown': handle.rotate?.(15, 'x'); break;
              case '+': case '=': handle.zoom?.(1.15); break;
              case '-': handle.zoom?.(1 / 1.15); break;
              case 'Home': reset(); break;
              case 'Escape': event.currentTarget.blur(); break;
              default: return;
            }
            event.preventDefault();
          }} />
        {isLoading ? <p className="molecule-viewer-status" role="status">Loading molecular structure...</p> : null}
      </div>
      {error ? (
        <div>
          <p role="alert">Unable to render this structure: {error}</p>
          <p>{model.displayName}: interactive 3D is unavailable. Molecular identity and sources remain readable; a 2D formula does not replace 3D geometry.</p>
          {model.structure2dUrl ? <img className="molecule-viewer-fallback" src={model.structure2dUrl} alt={`2D skeletal structure for ${model.displayName}`} /> : <p>No 2D structure asset is available.</p>}
          <button type="button" onClick={retry}>Retry 3D viewer</button>
          <p className="muted">If the renderer module still cannot load, reload the page to clear the failed browser import.</p>
        </div>
      ) : null}
    </section>
  );
};
