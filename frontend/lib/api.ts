const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error ?? "Request failed");
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as T;
}

// ─── Auth ───────────────────────────────────────────────

export type AuthPayload = { token: string; email: string; displayName: string };

export const auth = {
  register: (body: { email: string; password: string; displayName: string }) =>
    request<AuthPayload>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<AuthPayload>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),

  me: (token: string) =>
    request<{ email: string; displayName: string }>("/api/auth/me", {}, token),
};

// ─── URLs ─────────────────────────────────────────────────────────────────────

export type UrlEntry = {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  clickCount: number;
  createdAt: string;
  expiresAt: string | null;
  ownedByUser: boolean;
};

export const urls = {
  shorten: (
    body: { originalUrl: string; customCode?: string; expiresAt?: string },
    token?: string | null
  ) =>
    request<UrlEntry>("/api/urls/shorten", { method: "POST", body: JSON.stringify(body) }, token),

  list: (token: string) =>
    request<UrlEntry[]>("/api/urls", {}, token),

  delete: (code: string, token: string) =>
    request<void>(`/api/urls/${code}`, { method: "DELETE" }, token),

  extendExpiry: (code: string, days: number, token: string) =>
    request<UrlEntry>(`/api/urls/${code}/extend`, {
      method: "PATCH",
      body: JSON.stringify({ days }),
    }, token),

  customize: (code: string, newCode: string, token: string) =>
    request<UrlEntry>(`/api/urls/${code}/customize`, {
      method: "PATCH",
      body: JSON.stringify({ newCode }),
    }, token),
};
