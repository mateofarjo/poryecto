"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/session";

type SessionContextValue = {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: (options?: { redirectTo?: string }) => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

async function fetchSession(): Promise<SessionUser | null> {
  try {
    const response = await fetch("/api/session", { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}

type Props = {
  children: ReactNode;
};

export function SessionProvider({ children }: Props) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const hadSessionRef = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Pulls the latest session snapshot from the server.
  const load = async (options?: { suppressLoading?: boolean }) => {
    if (!options?.suppressLoading) {
      setLoading(true);
    }
    try {
      const sessionUser = await fetchSession();
      setUser(sessionUser);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const handleSessionEvent = (event: Event) => {
      const message = event as MessageEvent<string>;
      try {
        const payload = JSON.parse(message.data ?? "{}") as {
          user: SessionUser | null;
          stale?: boolean;
        };

        if (payload.stale) {
          // Tokens likely rotated: pull fresh data through the REST endpoint.
          void load({ suppressLoading: true });
          return;
        }

        setUser(payload.user ?? null);
      } catch {
        // Ignore malformed payloads
      } finally {
        setLoading(false);
      }
    };

    const connect = () => {
      if (!isMounted || typeof window === "undefined") {
        return;
      }

      // Attempt to restore the stream after transient network failures.
      const scheduleReconnect = () => {
        if (reconnectTimeoutRef.current !== null) {
          window.clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectTimeoutRef.current = null;
          if (isMounted) {
            connect();
          }
        }, 5000);
      };

      eventSourceRef.current?.close();

      try {
        const source = new EventSource("/api/session/stream");
        eventSourceRef.current = source;

        source.addEventListener("session", handleSessionEvent);
        source.onerror = () => {
          if (!isMounted) {
            return;
          }
          source.close();
          setLoading(false);
          scheduleReconnect();
        };
      } catch {
        scheduleReconnect();
      }
    };

    void load();
    connect();

    return () => {
      isMounted = false;
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (user) {
      hadSessionRef.current = true;
      return;
    }
    if (hadSessionRef.current) {
      // Session expired after the initial mount; redirect to login.
      hadSessionRef.current = false;
      router.push("/login");
      router.refresh();
    }
  }, [user, loading, router]);

  const logout = async (options?: { redirectTo?: string }) => {
    // Ask backend to clear the cookies and then reset local state.
    await fetch("/api/auth/logout", { method: "POST" });
    hadSessionRef.current = false;
    await load();
    const redirectTo = options?.redirectTo ?? "/login";
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <SessionContext.Provider
      value={{
        user,
        loading,
        refresh: () => load(),
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }

  return context;
}
