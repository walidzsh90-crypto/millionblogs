const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:3001";
const API_BASE = `${API_ORIGIN}/api/v1`;

export class SsrFetchError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SsrFetchError";
    this.status = status;
  }
}

export async function ssrFetch<T>(
  path: string,
  options?: { revalidate?: number; tags?: string[] }
): Promise<T | null> {
  const url = `${API_BASE}${path}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: options?.revalidate ?? 900, tags: options?.tags },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new SsrFetchError(`API error: ${res.status} ${res.statusText}`, res.status);
    }

    if (res.status === 204) return null;

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof SsrFetchError) throw err;
    return null;
  }
}

export function buildQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
}
