import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AuthTokensResponse, UserPublic } from "@sarradabet/types";
import {
  authApiClient,
  logoutRequest,
  refreshAccessTokenRequest,
  registerAuthHandlers,
} from "../services/apiClient";
import { setSocketAuthToken } from "../core/hooks/useSocket";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  user: UserPublic | null;
  accessToken: string | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<UserPublic>;
  register: (data: {
    username: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<UserPublic>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const accessTokenRef = useRef<string | null>(null);

  const setSession = useCallback(
    (token: string | null, nextUser: UserPublic | null) => {
      accessTokenRef.current = token;
      setAccessToken(token);
      setUser(nextUser);
      setStatus(token && nextUser ? "authenticated" : "unauthenticated");
    },
    [],
  );

  const refreshSession = useCallback(async (): Promise<string | null> => {
    const result = await refreshAccessTokenRequest();
    if (!result) {
      setSession(null, null);
      return null;
    }

    setSession(result.accessToken, result.user as UserPublic);
    return result.accessToken;
  }, [setSession]);

  const clearSession = useCallback(() => {
    setSession(null, null);
  }, [setSession]);

  useEffect(() => {
    registerAuthHandlers({
      getAccessToken: () => accessTokenRef.current,
      refreshSession,
      onUnauthorized: clearSession,
    });
  }, [refreshSession, clearSession]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    setSocketAuthToken(accessToken);
  }, [accessToken]);

  const login = useCallback(
    async (username: string, password: string): Promise<UserPublic> => {
      const response = await authApiClient.post<{ data: AuthTokensResponse }>(
        "/login",
        { username, password },
      );
      const payload = response.data.data;
      setSession(payload.accessToken.token, payload.user);
      return payload.user;
    },
    [setSession],
  );

  const register = useCallback(
    async (data: {
      username: string;
      email: string;
      phone: string;
      password: string;
    }): Promise<UserPublic> => {
      const response = await authApiClient.post<{ data: AuthTokensResponse }>(
        "/register",
        data,
      );
      const payload = response.data.data;
      setSession(payload.accessToken.token, payload.user);
      return payload.user;
    },
    [setSession],
  );

  const logout = useCallback(async (): Promise<void> => {
    const token = accessTokenRef.current;
    await logoutRequest(token);
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      status,
      isAuthenticated: status === "authenticated",
      isAdmin: user?.role === "ADMIN",
      login,
      register,
      logout,
      refreshSession,
    }),
    [user, accessToken, status, login, register, logout, refreshSession],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
