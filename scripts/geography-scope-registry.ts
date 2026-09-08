export type GeographyScope =
  | { type: 'country'; id: string; label: string; countryCodes: string[] }
  | { type: 'macroregion'; id: string; label: string; countryCodes: string[] };

const scopes: GeographyScope[] = [
  {
    type: 'macroregion',
    id: 'western_europe',
    label: 'Western Europe',
    countryCodes: ['AUT', 'BEL', 'CHE', 'DEU', 'DNK', 'ESP', 'FIN', 'FRA', 'GBR', 'IRL', 'ISL', 'ITA', 'LUX', 'NLD', 'NOR', 'PRT', 'SWE'],
  },
];

export const getGeographyScope = (type: GeographyScope['type'], id: string): GeographyScope => {
  if (type === 'country') {
    return { type, id, label: id, countryCodes: [id] };
  }

  const scope = scopes.find((candidate) => candidate.type === type && candidate.id === id);
  if (!scope) {
    throw new Error(`Unknown geography scope: ${type}:${id}`);
  }
  return scope;
};
