import { useEffect, useState } from 'react';
import type { StructureInteractionAnnotation } from '../interaction/schema';
import { structureInteractionAnnotationSchema } from '../interaction/schema';

interface InteractionAnnotationState {
  annotation: StructureInteractionAnnotation | null;
  loading: boolean;
  error: string | null;
}

export const useInteractionAnnotation = (
  annotationPath: string | undefined,
): InteractionAnnotationState => {
  const [annotation, setAnnotation] = useState<StructureInteractionAnnotation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!annotationPath) {
      setAnnotation(null);
      setLoading(false);
      setError(null);
      return;
    }

    let canceled = false;

    const load = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(annotationPath);
        if (!response.ok) {
          throw new Error(`Unable to load interaction annotation: ${annotationPath}`);
        }

        const payload = await response.json();
        const parsed = structureInteractionAnnotationSchema.parse(payload);

        if (!canceled) {
          setAnnotation(parsed);
        }
      } catch (loadError) {
        if (!canceled) {
          setAnnotation(null);
          setError((loadError as Error).message);
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      canceled = true;
    };
  }, [annotationPath]);

  return { annotation, loading, error };
};
