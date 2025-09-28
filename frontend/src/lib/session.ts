import { cookies } from "next/headers";
import { authServiceFetch } from "@/lib/backend";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "inactive";
}

export interface SessionPayload {
  token: string;
  user: SessionUser;
}

const TOKEN_COOKIE = "auth_token";

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const response = await authServiceFetch("/api/auth/me", {
    method: "GET",
    requireAuth: true,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      await clearSessionCookies();
    }
    return null;
  }

  const payload = await response.json().catch(() => ({}));
  if (!payload.user) {
    return null;
  }

  return { token, user: payload.user as SessionUser };
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
}

export async function setSessionCookies(session: SessionPayload): Promise<void> {
  const store = await cookies();
  store.set(TOKEN_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
}
