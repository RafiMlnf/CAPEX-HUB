// ── Core API Client & URL Resolver ──────────────────────────────────────────

export const STORAGE_KEY_USER = "capex_current_user";

export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8080/api/v1`;
  }
  return "http://127.0.0.1:8080/api/v1";
};

export const getUploadFileUrl = (filename: string): string => {
  const base = getApiBaseUrl().replace(/\/api\/v1\/?$/, "");
  return `${base}/uploads/${encodeURIComponent(filename.trim())}`;
};

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {})
      },
      cache: "no-store"
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || err.error || `HTTP error ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (error) {
    console.error(`[API Service Error] ${path}:`, error);
    throw error;
  }
}
