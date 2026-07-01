"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type AuthUser = { token: string; email: string; displayName: string };

type AuthContextValue = {
  user: AuthUser | null;
  login: (u: AuthUser) => void;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "url_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // corrupt storage — ignore
    }
    setLoading(false);
  }, []);

  function login(u: AuthUser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
}
