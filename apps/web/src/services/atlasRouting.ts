const organismSlugToIdMap: Record<string, string> = {
  'solenopsis-invicta': 'org-solenopsis-invicta',
};

const organismIdToSlugMap: Record<string, string> = {
  'org-solenopsis-invicta': 'solenopsis-invicta',
};

const toxinSlugToIdMap: Record<string, string> = {
  'solenopsin-a': 'tox-solenopsin-a',
};

const toxinIdToSlugMap: Record<string, string> = {
  'tox-solenopsin-a': 'solenopsin-a',
};

export const defaultOrganismSlug = 'solenopsis-invicta';
export const defaultOrganismId = 'org-solenopsis-invicta';
export const defaultToxinSlug = 'solenopsin-a';
export const defaultToxinId = 'tox-solenopsin-a';

export const organismIdFromSlug = (slug: string | undefined): string => {
  if (!slug) {
    return defaultOrganismId;
  }

  return organismSlugToIdMap[slug] ?? defaultOrganismId;
};

export const organismSlugFromId = (id: string | undefined): string => {
  if (!id) {
    return defaultOrganismSlug;
  }

  return organismIdToSlugMap[id] ?? defaultOrganismSlug;
};

export const toxinIdFromSlug = (slug: string | undefined): string => {
  if (!slug) {
    return defaultToxinId;
  }

  return toxinSlugToIdMap[slug] ?? defaultToxinId;
};

export const toxinSlugFromId = (id: string | undefined): string => {
  if (!id) {
    return defaultToxinSlug;
  }

  return toxinIdToSlugMap[id] ?? defaultToxinSlug;
};

export const isKnownOrganismSlug = (slug: string | undefined): boolean => {
  if (!slug) {
    return false;
  }

  return Object.hasOwn(organismSlugToIdMap, slug);
};

export const isKnownToxinSlug = (slug: string | undefined): boolean => {
  if (!slug) {
    return false;
  }

  return Object.hasOwn(toxinSlugToIdMap, slug);
};
