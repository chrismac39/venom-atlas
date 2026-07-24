export type OrganismClassKey = 'insect' | 'fish' | 'unknown';

export type MonopageSectionKind =
  | 'organism-profile'
  | 'geography'
  | 'mechanisms'
  | 'toxin-categorization'
  | 'toxin-charts'
  | 'chemistry'
  | 'human-physiology';

export interface MonopageSectionConfig {
  kind: MonopageSectionKind;
  id: string;
  title: string;
  dedicatedLabel: string;
}

export interface MechanismSectionVariant {
  naturalTitle: string;
  humanTitle: string;
}

export interface GeographySectionVariant {
  heading: string;
  layerModelTitle: string;
  layerModelSummary: string;
}

export interface VenomSectionVariant {
  categorizationTitle: string;
  chartsTitle: string;
  chartsSummary: string;
}

export interface ChemistrySectionVariant {
  identityNote: string;
  structurePanelTitle: string;
}

export interface PhysiologySectionVariant {
  heading: string;
  pathwaysTitle: string;
  timelineTitle: string;
  timelineSummary: string;
}

export interface MonopageSectionContentVariants {
  geography: GeographySectionVariant;
  venom: VenomSectionVariant;
  chemistry: ChemistrySectionVariant;
  physiology: PhysiologySectionVariant;
}

interface MonopageSectionContentOverrides {
  geography?: Partial<GeographySectionVariant>;
  venom?: Partial<VenomSectionVariant>;
  chemistry?: Partial<ChemistrySectionVariant>;
  physiology?: Partial<PhysiologySectionVariant>;
}

interface OrganismFrameworkOverride {
  selectionSubtitle?: string;
  mechanisms?: Partial<MechanismSectionVariant>;
  sectionTitleByKind?: Partial<Record<MonopageSectionKind, string>>;
  content?: MonopageSectionContentOverrides;
}

export interface MonopageFrameworkVariant {
  classKey: OrganismClassKey;
  classLabel: string;
  selectionSubtitle: string;
  mechanisms: MechanismSectionVariant;
  content: MonopageSectionContentVariants;
  sections: MonopageSectionConfig[];
}

const baseSections: MonopageSectionConfig[] = [
  {
    kind: 'organism-profile',
    id: 'section-organism-profile',
    title: 'Organism Profile',
    dedicatedLabel: 'Open dedicated organism page',
  },
  {
    kind: 'geography',
    id: 'section-geography',
    title: 'Geography',
    dedicatedLabel: 'Open dedicated geography page',
  },
  {
    kind: 'mechanisms',
    id: 'section-mechanisms',
    title: 'Mechanisms',
    dedicatedLabel: 'Open dedicated mechanism page',
  },
  {
    kind: 'toxin-categorization',
    id: 'section-toxin-categorization',
    title: 'Toxin Categorization',
    dedicatedLabel: 'Open dedicated categorization page',
  },
  {
    kind: 'toxin-charts',
    id: 'section-toxin-charts',
    title: 'Toxin Charts',
    dedicatedLabel: 'Open dedicated chart page',
  },
  {
    kind: 'chemistry',
    id: 'section-chemistry',
    title: 'Chemistry',
    dedicatedLabel: 'Open dedicated chemistry page',
  },
  {
    kind: 'human-physiology',
    id: 'section-human-physiology',
    title: 'Human Physiology',
    dedicatedLabel: 'Open dedicated physiology page',
  },
];

const baseVariant: MonopageFrameworkVariant = {
  classKey: 'unknown',
  classLabel: 'General',
  selectionSubtitle:
    'This organism uses the shared atlas framework. Section content is adapted to available evidence.',
  mechanisms: {
    naturalTitle: 'Natural mechanism',
    humanTitle: 'Human interaction mechanism',
  },
  content: {
    geography: {
      heading: 'Ecology and geography',
      layerModelTitle: 'Layer model',
      layerModelSummary:
        'Native range, introduced range, confirmed occurrence, habitat context, and uncertain range are distinct layer types.',
    },
    venom: {
      categorizationTitle: 'Toxin categorization',
      chartsTitle: 'Toxin composition overview',
      chartsSummary:
        'Evidence-aware BI charting. Unsourced values are intentionally left unquantified.',
    },
    chemistry: {
      identityNote:
        'Distinction: molecular identity (entity), molecular geometry (structure file), visual representation (rendering mode), and biological effect (separate mechanism pages).',
      structurePanelTitle: '2D structure panel',
    },
    physiology: {
      heading: 'Human physiology effects',
      pathwaysTitle: 'Direct versus immune-mediated pathways',
      timelineTitle: 'Sting progression timeline',
      timelineSummary:
        'Distinguishes direct local effects from inflammatory and separate systemic allergic pathways.',
    },
  },
  sections: baseSections,
};

const variants: Record<OrganismClassKey, MonopageFrameworkVariant> = {
  unknown: baseVariant,
  insect: {
    ...baseVariant,
    classKey: 'insect',
    classLabel: 'Insect',
    selectionSubtitle:
      'Insect profile loaded. The same monopage framework is applied with insect-oriented mechanism context.',
    mechanisms: {
      naturalTitle: 'Natural mechanism: ecological interaction',
      humanTitle: 'Human interaction mechanism: defensive contact',
    },
  },
  fish: {
    ...baseVariant,
    classKey: 'fish',
    classLabel: 'Fish',
    selectionSubtitle:
      'Fish profile loaded. The same monopage framework is applied with fish-oriented interaction context.',
    mechanisms: {
      naturalTitle: 'Natural mechanism: predation or defense',
      humanTitle: 'Human interaction mechanism: handling or encounter exposure',
    },
    content: {
      ...baseVariant.content,
      physiology: {
        ...baseVariant.content.physiology,
        timelineTitle: 'Exposure progression timeline',
      },
    },
    sections: baseSections.map((section) => {
      if (section.kind === 'geography') {
        return {
          ...section,
          title: 'Ecology and Range',
        };
      }

      return section;
    }),
  },
};

const organismOverrides: Record<string, OrganismFrameworkOverride> = {
  'solenopsis-invicta': {
    selectionSubtitle:
      'Ant profile loaded. Uses the shared framework with fire-ant specific interaction language.',
    mechanisms: {
      naturalTitle: 'Natural mechanism: colony defense and prey subduing',
      humanTitle: 'Human interaction mechanism: defensive stinging event',
    },
    content: {
      venom: {
        categorizationTitle: 'Venom and toxin categorization',
      },
      physiology: {
        timelineTitle: 'Sting progression timeline',
      },
    },
  },
};

export const classifyOrganismClass = (className: string | null | undefined): OrganismClassKey => {
  const normalized = className?.trim().toLowerCase();

  if (!normalized) {
    return 'unknown';
  }

  if (normalized === 'insecta') {
    return 'insect';
  }

  if (['actinopterygii', 'chondrichthyes', 'pisces'].includes(normalized)) {
    return 'fish';
  }

  return 'unknown';
};

const applySectionTitleOverride = (
  sections: MonopageSectionConfig[],
  sectionTitleByKind: Partial<Record<MonopageSectionKind, string>> | undefined,
): MonopageSectionConfig[] => {
  if (!sectionTitleByKind) {
    return sections;
  }

  return sections.map((section) => {
    const titleOverride = sectionTitleByKind[section.kind];
    if (!titleOverride) {
      return section;
    }

    return {
      ...section,
      title: titleOverride,
    };
  });
};

export const getMonopageFrameworkVariant = (
  classKey: OrganismClassKey,
  organismSlug?: string,
): MonopageFrameworkVariant => {
  const classVariant = variants[classKey] ?? variants.unknown;
  const organismOverride = organismSlug ? organismOverrides[organismSlug] : undefined;

  if (!organismOverride) {
    return classVariant;
  }

  return {
    ...classVariant,
    selectionSubtitle: organismOverride.selectionSubtitle ?? classVariant.selectionSubtitle,
    mechanisms: {
      ...classVariant.mechanisms,
      ...organismOverride.mechanisms,
    },
    content: {
      geography: {
        ...classVariant.content.geography,
        ...organismOverride.content?.geography,
      },
      venom: {
        ...classVariant.content.venom,
        ...organismOverride.content?.venom,
      },
      chemistry: {
        ...classVariant.content.chemistry,
        ...organismOverride.content?.chemistry,
      },
      physiology: {
        ...classVariant.content.physiology,
        ...organismOverride.content?.physiology,
      },
    },
    sections: applySectionTitleOverride(classVariant.sections, organismOverride.sectionTitleByKind),
  };
};
