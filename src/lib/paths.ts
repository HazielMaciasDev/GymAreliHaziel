export const BASE_PATH = '/GymAreliHaziel';

export function withBasePath(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith(BASE_PATH)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${normalized}`;
}