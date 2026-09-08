import type { ContentRecords } from './content';

/** Keep duplicates: a Set here would conceal publication collisions. */
export const buildRouteInventory = (content: ContentRecords): string[] => [
  '/', '/404', '/about', '/atlas', '/effects', '/explore', '/organisms', '/sources', '/toxins',
  ...content.organisms.flatMap((organism) => {
    const slug = organism.slug;
    const material = content.toxicMaterials.find((entry) => entry.organismSlug === slug);
    return [
      `/atlas/${slug}`,
      `/organisms/${slug}`,
      ...(material ? [`/organisms/${slug}/toxic-material`] : []),
      ...(material?.biologicalMaterial.kind === 'venom' ? [`/organisms/${slug}/venom`] : []),
      ...(content.geography.some((entry) => entry.organismSlug === slug) ? [`/organisms/${slug}/geography`] : []),
    ];
  }),
  ...content.toxins.flatMap(({ slug }) => [
    `/toxins/${slug}`,
    ...(['mechanisms', 'physiology'] as const).flatMap((kind) =>
      content[kind].some((entry) => entry.subject.kind === 'isolated_compound' && entry.subject.slug === slug)
        ? [`/toxins/${slug}/${kind === 'mechanisms' ? 'mechanism' : kind}`] : [],
    ),
  ]),
  ...content.citations.filter((entry) => entry.visibility !== 'internal').flatMap((entry) =>
    [entry.slug, ...entry.aliases].map((slug) => `/sources/${slug}`),
  ),
];

/** Compare the plan to actual HTML output, including redirects and 404.html. */
export const compareBuiltRoutes = (planned: string[], built: string[]) => ({
  missing: planned.filter((route) => !built.includes(route)),
  unexpected: built.filter((route) => !planned.includes(route)),
  collisions: planned.filter((route, index) => planned.indexOf(route) !== index),
});