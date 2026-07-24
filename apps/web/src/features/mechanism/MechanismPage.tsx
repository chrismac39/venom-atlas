import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ExposureRoute } from '@venom-atlas/domain';
import type { ToxinMechanismDetail } from '../../services/contracts';
import { atlasApi } from '../../services/apiClient';
import { RouteEntityNotFound } from '../../components/RouteEntityNotFound';
import { DeliveryMechanismDiagram } from '../../visualizations/svg/DeliveryMechanismDiagram';
import {
  defaultOrganismSlug,
  defaultToxinSlug,
  isKnownOrganismSlug,
  organismIdFromSlug,
  isKnownToxinSlug,
  toxinIdFromSlug,
} from '../../services/atlasRouting';

interface MechanismPageProps {
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

export const MechanismPage = ({
  organismSlugOverride,
  naturalTitleOverride,
  humanTitleOverride,
}: MechanismPageProps = {}) => {
  const [data, setData] = useState<ToxinMechanismDetail | null>(null);
  const [organismRoute, setOrganismRoute] = useState<ExposureRoute>('unknown');
  const [organismName, setOrganismName] = useState<string>('this organism');
  const { toxinSlug, organismSlug: routeOrganismSlug } = useParams();
  const mechanismOrganismSlug = organismSlugOverride ?? routeOrganismSlug ?? defaultOrganismSlug;
  const unknownSlug = toxinSlug ? !isKnownToxinSlug(toxinSlug) : false;
  const unknownOrganismSlug = mechanismOrganismSlug
    ? !isKnownOrganismSlug(mechanismOrganismSlug)
    : false;

  useEffect(() => {
    if (unknownSlug) {
      setData(null);
      return;
    }
    atlasApi.getToxinMechanism(toxinIdFromSlug(toxinSlug)).then((payload) => {
      setData(payload);
    });
  }, [toxinSlug, unknownSlug]);

  useEffect(() => {
    if (unknownOrganismSlug) {
      setOrganismRoute('unknown');
      setOrganismName('this organism');
      return;
    }

    atlasApi
      .getOrganism(organismIdFromSlug(mechanismOrganismSlug))
      .then((payload) => {
        setOrganismRoute(payload.deliveryMechanism?.route ?? 'unknown');
        setOrganismName(payload.organism.commonName.toLowerCase());
      })
      .catch((error: unknown) => {
        console.error(error);
        setOrganismRoute('unknown');
        setOrganismName('this organism');
      });
  }, [mechanismOrganismSlug, unknownOrganismSlug]);

  if (unknownSlug) {
    return (
      <RouteEntityNotFound
        title="Mechanism page unavailable"
        message={`No toxin is mapped to slug "${toxinSlug}".`}
        fallbackHref={`/toxins/${defaultToxinSlug}/mechanism`}
        fallbackLabel="Open Solenopsin A mechanism"
      />
    );
  }

  if (unknownOrganismSlug) {
    return (
      <RouteEntityNotFound
        title="Mechanism page unavailable"
        message={`No organism is mapped to slug "${mechanismOrganismSlug}".`}
        fallbackHref={`/organisms/${defaultOrganismSlug}`}
        fallbackLabel="Open default organism"
      />
    );
  }

  if (!data) {
    return <section className="panel">Loading mechanism...</section>;
  }

  const naturalSteps = getNaturalSteps(organismRoute, data.mechanismSteps.map((step) => step.title));
  const humanSteps = getHumanSteps(organismRoute);

  return (
    <section className="grid">
      <section className="panel">
        <h1>Delivery mechanism schematics</h1>
        <p className="muted">
          Two reusable views for {organismName}: ecological interaction flow and human interaction
          flow.
        </p>
      </section>

      <section className="grid">
        <DeliveryMechanismDiagram
          title={naturalTitleOverride ?? 'Natural mechanism: prey subduing'}
          ariaLabel={`Schematic of ${organismName} delivering toxin in ecological interactions`}
          steps={naturalSteps}
        />

        <DeliveryMechanismDiagram
          title={humanTitleOverride ?? 'Human interaction mechanism'}
          ariaLabel={`Schematic of ${organismName} interaction leading to human exposure`}
          steps={humanSteps}
        />
      </section>
    </section>
  );
};
