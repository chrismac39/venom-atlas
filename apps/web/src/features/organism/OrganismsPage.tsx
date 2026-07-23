import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GeographicLayerType, Organism } from '@venom-atlas/domain';
import { atlasApi } from '../../services/apiClient';
import { organismSlugFromId } from '../../services/atlasRouting';

type GroupMode =
  | 'nameScientific'
  | 'nameCommon'
  | 'geography'
  | 'classification'
  | 'animalGroup';

interface OrganismDirectoryEntry {
  organism: Organism;
  geographyFolders: string[];
  scientificAzFolder: string;
  commonAzFolder: string;
  classificationFolders: string[];
  animalGroupFolder: string;
}

const geographyLabelByLayer: Record<string, string> = {
  native_range: 'Native range',
  introduced_range: 'Introduced range',
  confirmed_occurrence: 'Confirmed occurrence',
  habitat_context: 'Habitat context',
  uncertain_range: 'Uncertain range',
};

const groupModeLabels: Record<GroupMode, string> = {
  nameScientific: 'A-Z (Latin scientific names)',
  nameCommon: 'A-Z (English common names)',
  geography: 'By geography',
  classification: 'By venom/toxin classification',
  animalGroup: 'By animal family/group',
};

const groupModeOptions: GroupMode[] = [
  'nameScientific',
  'nameCommon',
  'geography',
  'classification',
  'animalGroup',
];

const geographyCountryHintsByOrganismId: Record<
  string,
  Partial<Record<GeographicLayerType, string[]>>
> = {
  'org-solenopsis-invicta': {
    native_range: ['Argentina'],
    introduced_range: ['United States', 'China', 'Australia'],
  },
};

const formatCountryList = (countries: string[]): string => {
  if (countries.length === 1) {
    return countries[0] ?? '';
  }
  if (countries.length === 2) {
    return `${countries[0] ?? ''} and ${countries[1] ?? ''}`;
  }
  return `${countries.slice(0, 2).join(', ')} and others`;
};

const geographyFolderLabel = (organismId: string, layerType: GeographicLayerType): string => {
  const baseLabel = geographyLabelByLayer[layerType] ?? 'Other range data';
  const hintedCountries = geographyCountryHintsByOrganismId[organismId]?.[layerType] ?? [];

  if (hintedCountries.length === 0) {
    return baseLabel;
  }

  return `${baseLabel}: ${formatCountryList(hintedCountries)}`;
};

const resolveAnimalGroupLabel = (
  className: string | undefined,
  family: string | undefined,
): string => {
  if (className) {
    if (className.toLowerCase() === 'insecta') {
      return 'Insects (Insecta)';
    }
    return `Class: ${className}`;
  }
  if (family) {
    return `Family: ${family}`;
  }
  return 'Unspecified animal group';
};

const getFirstLetterFolder = (displayName: string): string => {
  const normalizedName = displayName.trim();
  const firstChar = normalizedName.charAt(0).toUpperCase();
  if (!firstChar || !/[A-Z]/.test(firstChar)) {
    return '#';
  }
  return firstChar;
};

const groupEntries = (
  entries: OrganismDirectoryEntry[],
  mode: GroupMode,
): Array<{ folder: string; entries: OrganismDirectoryEntry[] }> => {
  const grouped = new Map<string, OrganismDirectoryEntry[]>();

  if (mode === 'nameScientific' || mode === 'nameCommon') {
    for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      grouped.set(letter, []);
    }
  }

  for (const entry of entries) {
    const folderKeys =
      mode === 'geography'
        ? entry.geographyFolders
        : mode === 'nameScientific'
          ? [entry.scientificAzFolder]
          : mode === 'nameCommon'
            ? [entry.commonAzFolder]
          : mode === 'classification'
            ? entry.classificationFolders
            : [entry.animalGroupFolder];

    for (const key of folderKeys) {
      const existing = grouped.get(key) ?? [];
      existing.push(entry);
      grouped.set(key, existing);
    }
  }

  return Array.from(grouped.entries())
    .map(([folder, groupedEntries]) => ({
      folder,
      entries: groupedEntries.sort((a, b) => {
        if (mode === 'nameCommon') {
          return a.organism.commonName.localeCompare(b.organism.commonName);
        }
        return a.organism.scientificName.localeCompare(b.organism.scientificName);
      }),
    }))
    .sort((a, b) => a.folder.localeCompare(b.folder));
};

export const OrganismsPage = () => {
  const [entries, setEntries] = useState<OrganismDirectoryEntry[]>([]);
  const [groupMode, setGroupMode] = useState<GroupMode>('nameScientific');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      const organisms = await atlasApi.listOrganisms();
      const enriched = await Promise.all(
        organisms.map(async (organism) => {
          const [organismDetail, ranges, venoms] = await Promise.all([
            atlasApi.getOrganism(organism.id),
            atlasApi.getOrganismRange(organism.id),
            atlasApi.getOrganismVenoms(organism.id),
          ]);

          const venomDetails = await Promise.all(venoms.map((venom) => atlasApi.getVenom(venom.id)));

          const toxinFamilies = Array.from(
            new Set(
              venomDetails
                .flatMap((detail) => detail.toxins)
                .map((toxin) => toxin.family)
                .filter((family): family is string => Boolean(family?.trim()))
                .map((family) => family.trim()),
            ),
          );

          const classificationFolders: string[] = [];
          if (venoms.length > 0) {
            classificationFolders.push('Venomous organisms');
          } else {
            classificationFolders.push('No venom profile yet');
          }

          if (toxinFamilies.length > 0) {
            classificationFolders.push(
              ...toxinFamilies.map((family) => `Toxin family: ${family}`),
            );
          } else {
            classificationFolders.push('Toxin family: Unclassified');
          }

          const mappedRangeLabels = Array.from(
            new Set(ranges.map((range) => geographyFolderLabel(organism.id, range.layerType))),
          );

          return {
            organism,
            geographyFolders:
              mappedRangeLabels.length > 0 ? mappedRangeLabels : ['Geography not yet classified'],
            scientificAzFolder: getFirstLetterFolder(organism.scientificName),
            commonAzFolder: getFirstLetterFolder(organism.commonName),
            classificationFolders,
            animalGroupFolder: resolveAnimalGroupLabel(
              organismDetail.taxonomy?.className,
              organismDetail.taxonomy?.family,
            ),
          } satisfies OrganismDirectoryEntry;
        }),
      );

      setEntries(
        enriched.sort((a, b) => a.organism.scientificName.localeCompare(b.organism.scientificName)),
      );
    };

    void load().catch((loadError: unknown) => {
      console.error(loadError);
      setError('Failed to load organism directory. Please try again.');
    });
  }, []);

  const groupedFolders = groupEntries(entries, groupMode);

  return (
    <section className="grid organisms-page">
      <header className="panel">
        <h1>Organisms</h1>
        <p>Browse organism records using folderized views that you can switch between.</p>
        <label className="organism-group-slicer">
          <span className="muted">Organize folders</span>
          <select
            aria-label="Organize organism folders"
            value={groupMode}
            onChange={(event) => setGroupMode(event.target.value as GroupMode)}
          >
            {groupModeOptions.map((mode) => (
              <option key={mode} value={mode}>
                {groupModeLabels[mode]}
              </option>
            ))}
          </select>
        </label>
      </header>

      {error ? <section className="panel">{error}</section> : null}
      {!error && entries.length === 0 ? <section className="panel">Loading organisms...</section> : null}

      {!error && entries.length > 0 ? (
        <section className="panel organism-folder-listing organism-page-scroll-region">
          {groupedFolders.map((group) => (
            <div className="organism-folder-section" key={group.folder}>
              <h2>{group.folder}</h2>
              <ul className="organism-folder-list">
                {group.entries.length > 0 ? (
                  group.entries.map((entry) => (
                    <li className="organism-entry-line" key={`${group.folder}-${entry.organism.id}`}>
                      <Link to={`/organisms/${organismSlugFromId(entry.organism.id)}`}>
                        {entry.organism.scientificName}
                      </Link>
                      <span className="muted"> ({entry.organism.commonName})</span>
                    </li>
                  ))
                ) : (
                  <li className="muted organism-folder-empty">No organisms in this folder yet.</li>
                )}
              </ul>
            </div>
          ))}
        </section>
      ) : null}
    </section>
  );
};
