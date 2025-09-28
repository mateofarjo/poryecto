import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";

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
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (requireAuth && !token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const headers = buildHeaders(init, token);

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
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