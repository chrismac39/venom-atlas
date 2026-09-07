export const appPath = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

  return `${basePath}${normalizedPath}` || '/';
};