import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

import * as authApi from "../api/auth";
import { clearToken, getToken, setToken } from "../api/client";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// The backend only issues a token; it doesn't have a "whoami" endpoint, so
// we keep the last-known user alongside the token in secure storage.
const USER_CACHE_KEY = "auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        const cached = await SecureStore.getItemAsync(USER_CACHE_KEY);
        if (cached) setUser(JSON.parse(cached));
      }
      setIsLoading(false);
    })();
  }, []);

  async function persistUser(u: User) {
    await SecureStore.setItemAsync(USER_CACHE_KEY, JSON.stringify(u));
    setUser(u);
  }

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password);
    await setToken(res.token);
    await persistUser(res.user);
  }

  async function register(email: string, password: string) {
    const res = await authApi.register(email, password);
    await setToken(res.token);
    await persistUser(res.user);
  }

  async function logout() {
    await clearToken();
    await SecureStore.deleteItemAsync(USER_CACHE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
