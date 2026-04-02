const rawApiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
export const API_BASE =
  rawApiBase === "/api" || rawApiBase.endsWith("/api") ? rawApiBase : `${rawApiBase}/api`;

export function apiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
