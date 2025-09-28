"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { SessionUser } from "@/lib/session";

type SessionContextValue = {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
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

  const load = async () => {
    setLoading(true);
    const sessionUser = await fetchSession();
    setUser(sessionUser);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await load();
  };

  return (
    <SessionContext.Provider
      value={{
        user,
        loading,
        refresh: load,
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