import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ExposureRoute } from '@venom-atlas/domain';
import { atlasApi } from '../../../services/apiClient';
import {
  defaultOrganismSlug,
  isKnownOrganismSlug,
  organismIdFromSlug,
  isKnownToxinSlug,
} from '../../../services/atlasRouting';

export interface MechanismPageProps {
  organismSlugOverride?: string;
  naturalTitleOverride?: string;
  humanTitleOverride?: string;
}

const fallbackNaturalStepsByRoute: Record<ExposureRoute, [string, string, string, string]> = {
  sting: ['Target is contacted', 'Body aligns for delivery', 'Stinger penetrates target', 'Venom acts on target'],
  contact: ['Surface contact occurs', 'Secretion is transferred', 'Toxin reaches exposed tissue', 'Local effects begin'],
  ingestion: ['Material is consumed by target', 'Toxin enters digestive tract', 'Compounds are absorbed', 'Effects propagate systemically'],
  inhalation: ['Particles become airborne', 'Target inhales particles', 'Compounds contact airway tissue', 'Respiratory effects begin'],
  unknown: ['Initial contact occurs', 'Delivery pathway begins', 'Toxin reaches target tissue', 'Observable effects follow'],
};

const fallbackHumanStepsByRoute: Record<ExposureRoute, [string, string, string, string]> = {
  sting: ['Human encounter triggers defense', 'Organism anchors to skin', 'Stinger penetrates skin', 'Venom is delivered to tissue'],
  contact: ['Human touches organism or secretion', 'Toxin transfers to skin', 'Local penetration/irritation occurs', 'Symptoms emerge at contact site'],
  ingestion: ['Material is accidentally ingested', 'Toxin enters the gut', 'Absorption into circulation begins', 'Systemic effects may develop'],
  inhalation: ['Aerosolized material is inhaled', 'Compounds reach airway surfaces', 'Irritation/inflammation may occur', 'Respiratory symptoms can escalate'],
  unknown: ['Human contact occurs', 'Likely exposure pathway initiates', 'Toxin reaches vulnerable tissue', 'Clinical effects may follow'],
};

const toFourSteps = (steps: string[]): [string, string, string, string] | null => {
  const normalized = steps.map((step) => step.trim()).filter((step) => step.length > 0);
  const [first, second, third, fourth] = normalized;
  if (!first || !second || !third || !fourth) {
    return null;
  }

  return [first, second, third, fourth];
};

const getNaturalSteps = (route: ExposureRoute, deliverySequence: string[] | undefined) => {
  return toFourSteps(deliverySequence ?? []) ?? fallbackNaturalStepsByRoute[route];
};

const getHumanSteps = (route: ExposureRoute) => {
  return fallbackHumanStepsByRoute[route];
};

export interface MechanismPageOrchestration {
  toxinSlug: string | undefined;
  mechanismOrganismSlug: string;
  unknownToxinSlug: boolean;
  unknownOrganismSlug: boolean;
  organismName: string;
  naturalSteps: [string, string, string, string];
  humanSteps: [string, string, string, string];
  naturalTitleOverride: string | undefined;
  humanTitleOverride: string | undefined;
}

export const useMechanismPageOrchestration = ({
  organismSlugOverride,
  naturalTitleOverride,
  humanTitleOverride,
}: MechanismPageProps = {}): MechanismPageOrchestration => {
  const [organismRoute, setOrganismRoute] = useState<ExposureRoute>('unknown');
  const [organismName, setOrganismName] = useState<string>('this organism');
  const [naturalSequence, setNaturalSequence] = useState<string[]>([]);
  const { toxinSlug, organismSlug: routeOrganismSlug } = useParams();
  const mechanismOrganismSlug = organismSlugOverride ?? routeOrganismSlug ?? defaultOrganismSlug;
  const unknownToxinSlug = toxinSlug ? !isKnownToxinSlug(toxinSlug) : false;
  const unknownOrganismSlug = mechanismOrganismSlug
    ? !isKnownOrganismSlug(mechanismOrganismSlug)
    : false;

  useEffect(() => {
    if (unknownOrganismSlug) {
      setOrganismRoute('unknown');
      setOrganismName('this organism');
      setNaturalSequence([]);
      return;
    }

    atlasApi
      .getOrganism(organismIdFromSlug(mechanismOrganismSlug))
      .then((payload) => {
        setOrganismRoute(payload.deliveryMechanism?.route ?? 'unknown');
        setOrganismName(payload.organism.commonName.toLowerCase());
        setNaturalSequence(payload.deliveryMechanism?.sequence ?? []);
      })
      .catch((error: unknown) => {
        console.error(error);
        setOrganismRoute('unknown');
        setOrganismName('this organism');
        setNaturalSequence([]);
      });
  }, [mechanismOrganismSlug, unknownOrganismSlug]);

  const naturalSteps = useMemo(
    () => getNaturalSteps(organismRoute, naturalSequence),
    [organismRoute, naturalSequence],
  );
  const humanSteps = useMemo(() => getHumanSteps(organismRoute), [organismRoute]);

  return {
    toxinSlug,
    mechanismOrganismSlug,
    unknownToxinSlug,
    unknownOrganismSlug,
    organismName,
    naturalSteps,
    humanSteps,
    naturalTitleOverride,
    humanTitleOverride,
  };
};
