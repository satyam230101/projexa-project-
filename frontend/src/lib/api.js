const rawApiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const API_BASE =
  rawApiBase === "/api" || rawApiBase.endsWith("/api") ? rawApiBase : `${rawApiBase}/api`;

function toApiUrl(path) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch(path, options = {}) {
  const url = toApiUrl(path);

  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      message = data?.detail || data?.message || message;
    } catch {}
    throw new Error(message);
  }

  // For endpoints returning empty body
  if (res.status === 204) return null;
  return res.json();
}