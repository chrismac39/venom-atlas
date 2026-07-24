import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { AnatomyHighlight } from '@venom-atlas/visualization-contracts';
import type { ToxinMechanismDetail, ToxinPhysiologyDetail } from '../../../services/contracts';
import { atlasApi } from '../../../services/apiClient';
import { isKnownToxinSlug, toxinIdFromSlug } from '../../../services/atlasRouting';

export const localHighlights: AnatomyHighlight[] = [
  {
    systemId: 'anat-skin',
    intensity: 'primary',
    label: 'Skin',
    explanation: 'Primary tissue site of sting and lesion progression.',
  },
  {
    systemId: 'anat-peripheral-nerves',
    intensity: 'primary',
    label: 'Peripheral sensory nerves',
    explanation: 'Associated with immediate pain and burning sensations.',
  },
  {
    systemId: 'anat-immune',
    intensity: 'secondary',
    label: 'Inflammatory/immune response',
    explanation: 'Shapes lesion and inflammatory manifestations.',
  },
  {
    systemId: 'anat-respiratory',
    intensity: 'context',
    label: 'Respiratory system',
    explanation: 'Systemic allergic pathway is possible but not default.',
  },
];

export interface PhysiologyPageProps {
  headingOverride?: string;
  pathwaysTitleOverride?: string;
  timelineTitleOverride?: string;
  timelineSummaryOverride?: string;
}

export interface PhysiologyPageOrchestration {
  toxinSlug: string | undefined;
  unknownSlug: boolean;
  physiology: ToxinPhysiologyDetail | null;
  mechanism: ToxinMechanismDetail | null;
  directEffects: string[];
  immuneEffects: string[];
  headingOverride: string | undefined;
  pathwaysTitleOverride: string | undefined;
  timelineTitleOverride: string | undefined;
  timelineSummaryOverride: string | undefined;
}

export const usePhysiologyPageOrchestration = ({
  headingOverride,
  pathwaysTitleOverride,
  timelineTitleOverride,
  timelineSummaryOverride,
}: PhysiologyPageProps = {}): PhysiologyPageOrchestration => {
  const [physiology, setPhysiology] = useState<ToxinPhysiologyDetail | null>(null);
  const [mechanism, setMechanism] = useState<ToxinMechanismDetail | null>(null);
  const { toxinSlug } = useParams();
  const unknownSlug = toxinSlug ? !isKnownToxinSlug(toxinSlug) : false;

  useEffect(() => {
    if (unknownSlug) {
      setPhysiology(null);
      setMechanism(null);
      return;
    }

    const toxinId = toxinIdFromSlug(toxinSlug);
    atlasApi
      .getToxinPhysiology(toxinId)
      .then(setPhysiology)
      .catch((error: unknown) => console.error(error));
    atlasApi
      .getToxinMechanism(toxinId)
      .then(setMechanism)
      .catch((error: unknown) => console.error(error));
  }, [toxinSlug, unknownSlug]);

  const directEffects = useMemo(
    () => physiology?.physiologicalEffects
      .filter((entry) => entry.pathwayType === 'direct_venom')
      .map((entry) => entry.title) ?? [],
    [physiology],
  );

  const immuneEffects = useMemo(
    () => physiology?.physiologicalEffects
      .filter((entry) => entry.pathwayType !== 'direct_venom')
      .map((entry) => entry.title) ?? [],
    [physiology],
  );

  return {
    toxinSlug,
    unknownSlug,
    physiology,
    mechanism,
    directEffects,
    immuneEffects,
    headingOverride,
    pathwaysTitleOverride,
    timelineTitleOverride,
    timelineSummaryOverride,
  };
};
