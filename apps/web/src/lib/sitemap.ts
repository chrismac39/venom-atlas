const escapeXml = (value: string): string => value.replace(/[<>&"']/g, (character) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
})[character]!);

/** Without a configured deployment origin, omit URLs rather than publish localhost. */
export const buildSitemap = (routes: string[], site: URL | undefined, base: string): string => {
  const prefix = base.replace(/^\/+|\/+$/g, '');
  const urls = site ? [...new Set(routes)].map((route) => {
    const pathname = `${prefix ? `/${prefix}` : ''}${route}`;
    return `<url><loc>${escapeXml(new URL(pathname, site).href)}</loc></url>`;
  }).join('') : '';
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`;
};