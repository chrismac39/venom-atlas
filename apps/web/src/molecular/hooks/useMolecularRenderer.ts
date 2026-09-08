import { useEffect, useRef, useState } from 'react';
import { pickMolecularRenderer } from '../adapters/selectRenderer';
import type { MoleculeRenderModel, MolecularRendererHandle, MolecularRenderOptions } from '../types';

export const useMolecularRenderer = (model: MoleculeRenderModel, options: MolecularRenderOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<MolecularRendererHandle | null>(null);
  const optionsRef = useRef(options);
  const updateRef = useRef<((options: MolecularRenderOptions) => void) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    optionsRef.current = options;
    updateRef.current?.(options);
  }, [options]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const abort = new AbortController();
    // Each mount owns its DOM, even if a previous import settles after cleanup.
    const mountPoint = document.createElement('div');
    container.replaceChildren(mountPoint);
    let handle: MolecularRendererHandle | undefined;
    let observer: ResizeObserver | undefined;
    let updates = Promise.resolve();
    setError(null);
    setIsLoading(true);
    const failed = (reason: unknown) => {
      if (abort.signal.aborted) return;
      setError(reason instanceof Error ? reason.message : String(reason));
      setIsLoading(false);
      observer?.disconnect();
      handle?.dispose();
      handleRef.current = null;
      updateRef.current = null;
    };
    const mount = async () => {
      const adapter = pickMolecularRenderer(model);
      if (!adapter || adapter.rendererId !== '3dmol') {
        throw new Error('Interactive 3D rendering is not available for this structure.');
      }
      const initialOptions = optionsRef.current;
      handle = await adapter.mount(mountPoint, model, { ...initialOptions, signal: abort.signal });
      if (abort.signal.aborted) { handle.dispose(); return; }
      handleRef.current = handle;
      observer = new ResizeObserver(() => handle?.resize());
      observer.observe(container);
      handle.resize();
      updateRef.current = (nextOptions) => {
        // Surface generation is asynchronous: serialize updates, never let old
        // work overwrite a newer representation or render after unmount.
        updates = updates.then(async () => {
          if (abort.signal.aborted || !handleRef.current) return;
          setIsLoading(true);
          await handle?.update(model, nextOptions);
          if (!abort.signal.aborted) setIsLoading(false);
        }).catch(failed);
      };
      setIsLoading(false);
      if (optionsRef.current !== initialOptions) updateRef.current(optionsRef.current);
    };
    void mount().catch(failed);
    return () => {
      abort.abort();
      observer?.disconnect();
      updateRef.current = null;
      handle?.dispose();
      handleRef.current = null;
      mountPoint.remove();
    };
  }, [model, attempt]);

  return { containerRef, handleRef, error, isLoading, retry: () => setAttempt((value) => value + 1) };
};