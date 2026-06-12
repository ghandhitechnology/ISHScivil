"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { SessionState } from "@/lib/types";

type Ctx = {
  session: SessionState;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (id: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<Ctx | null>(null);

async function fetchSession(): Promise<SessionState> {
  const res = await fetch("/api/auth/session", { cache: "no-store" });
  return (await res.json()) as SessionState;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>({ authenticated: false });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await fetchSession();
    setSession(data);
    setLoading(false);
  }, []);

  const login = useCallback(
    async (id: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });
      if (!res.ok) {
        const { message } = await res.json().catch(() => ({ message: "로그인 실패" }));
        throw new Error(message ?? "로그인 실패");
      }
      await refresh();
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
  }, [refresh]);

  useEffect(() => {
    fetchSession()
      .then((data) => setSession(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading, refresh, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
