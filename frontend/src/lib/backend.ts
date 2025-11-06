import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";
import { refreshSessionFromCookies, ACCESS_TOKEN_COOKIE } from "@/lib/session";

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

function buildHeaders(init?: RequestInit, token?: string): Headers {
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function makeRequest(baseUrl: string, path: string, options?: FetchOptions) {
  const { requireAuth = false, ...init } = options ?? {};
  const requestUrl = `${baseUrl}${path}`;

  const buildInit = (token?: string): RequestInit => ({
    ...init,
    headers: buildHeaders(init, token),
  });

  const cookieStore = await cookies();
  let token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (requireAuth && !token) {
    // Attempt a silent refresh before declaring the request unauthorized.
    const refreshed = await refreshSessionFromCookies();
    token = refreshed?.token;

    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  let requestInit = buildInit(token);
  let response = await fetch(requestUrl, {
    ...requestInit,
    cache: "no-store",
  });

  if (requireAuth && (response.status === 401 || response.status === 403)) {
    // Token might have expired mid-flight; refresh once and retry.
    const refreshed = await refreshSessionFromCookies();

    if (refreshed?.token) {
      token = refreshed.token;
      requestInit = buildInit(token);
      response = await fetch(requestUrl, {
        ...requestInit,
        cache: "no-store",
      });
    }
  }

  return response;
}

const env = () => getServerEnv();

export function authServiceFetch(path: string, options?: FetchOptions) {
  const { AUTH_SERVICE_URL } = env();
  return makeRequest(AUTH_SERVICE_URL, path, options);
}

export function ordersServiceFetch(path: string, options?: FetchOptions) {
  const { ORDERS_SERVICE_URL } = env();
  return makeRequest(ORDERS_SERVICE_URL, path, options);
}
