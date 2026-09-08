import type { APIRoute } from 'astro';
import { getAllRoutes, getPublicCitations } from '../lib/content';
import { buildSitemap } from '../lib/sitemap';

export const GET: APIRoute = ({ site }) => {
  const aliases = new Set(getPublicCitations().flatMap((citation) =>
    (citation.aliases ?? []).map((alias) => `/sources/${alias}`)));
  const routes = getAllRoutes().filter((route) =>
    route !== '/404' && route !== '/atlas' && !route.endsWith('/venom') && !aliases.has(route));
  return new Response(buildSitemap(routes, site, import.meta.env.BASE_URL), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};