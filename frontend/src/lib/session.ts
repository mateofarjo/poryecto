import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "inactive";
}

export interface SessionPayload {
  token: string;
  refreshToken: string;
  user: SessionUser;
}

export interface SessionLookupOptions {
  /**
   * When false the helper avoids hitting the refresh endpoint.
   * Useful for read-only contexts such as SSE streams.
   */
  refresh?: boolean;
  /**
   * When false the helper does not mutate cookies.
   * Required for responses that already flushed headers.
   */
  mutateCookies?: boolean;
}

const ACCESS_TOKEN_COOKIE = "auth_token";
const REFRESH_TOKEN_COOKIE = "auth_refresh_token";
const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

const shouldClearSession = (status: number) => status === 401 || status === 403;

function buildHeaders(init: RequestInit = {}, token?: string): Headers {
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function callAuthService(path: string, init: RequestInit = {}, token?: string) {
  const { AUTH_SERVICE_URL } = getServerEnv();
  const headers = buildHeaders(init, token);

  return fetch(`${AUTH_SERVICE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function getSessionFromCookies(options: SessionLookupOptions = {}): Promise<SessionPayload | null> {
  const { refresh = true, mutateCookies = true } = options;

  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value ?? "";

  if (!token) {
    if (!refresh || !mutateCookies || !refreshToken) {
      return null;
    }
    // No access token, but refresh is allowed and available.
    return refreshSessionFromCookies();
  }

  let response: Response;
  try {
    response = await callAuthService("/api/auth/me", { method: "GET" }, token);
  } catch {
    return null;
  }

  if (!response.ok) {
    if (refresh && mutateCookies && refreshToken && shouldClearSession(response.status)) {
      const refreshed = await refreshSessionFromCookies();
      if (refreshed) {
        return refreshed;
      }
    }

    if (mutateCookies && shouldClearSession(response.status)) {
      // Auth service rejected the token; make sure cookies are dropped.
      await clearSessionCookies();
    }

    return null;
  }

  const payload = await response.json().catch(() => ({}));
  if (!payload.user) {
    return null;
  }

  return {
    token,
    refreshToken,
    user: payload.user as SessionUser,
  };
}

export async function refreshSessionFromCookies(): Promise<SessionPayload | null> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return null;
  }

  let response: Response;
  try {
    response = await callAuthService("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    if (shouldClearSession(response.status)) {
      await clearSessionCookies();
    }
    return null;
  }

  const payload = await response.json().catch(() => ({}));
  if (!payload.token || !payload.refreshToken || !payload.user) {
    await clearSessionCookies();
    return null;
  }

  const session: SessionPayload = {
    token: payload.token as string,
    refreshToken: payload.refreshToken as string,
    user: payload.user as SessionUser,
  };

  // Persist the new pair so subsequent requests use the fresh credentials.
  await setSessionCookies(session);

  return session;
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

export async function setSessionCookies(session: SessionPayload): Promise<void> {
  const store = await cookies();

  store.set(ACCESS_TOKEN_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  store.set(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE };
