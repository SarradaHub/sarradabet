import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { vi, beforeEach, describe, expect, it } from "vitest";
import { AuthProvider } from "../../context/AuthProvider";
import { useAuth } from "../useAuth";

vi.mock("../../services/apiClient", () => ({
  authApiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
  refreshAccessTokenRequest: vi.fn(),
  logoutRequest: vi.fn(),
  registerAuthHandlers: vi.fn(),
}));

vi.mock("../../core/hooks/useSocket", () => ({
  setSocketAuthToken: vi.fn(),
}));

import {
  authApiClient,
  refreshAccessTokenRequest,
  logoutRequest,
} from "../../services/apiClient";

const mockAuthApiClient = authApiClient as unknown as {
  post: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
};
const mockRefresh = refreshAccessTokenRequest as ReturnType<typeof vi.fn>;
const mockLogout = logoutRequest as ReturnType<typeof vi.fn>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefresh.mockResolvedValue(null);
  });

  it("starts unauthenticated when refresh fails", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe("unauthenticated");
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("restores session from refresh cookie on boot", async () => {
    mockRefresh.mockResolvedValue({
      accessToken: "boot-token",
      user: {
        id: 1,
        username: "bootuser",
        email: "boot@example.com",
        phone: "5511999990000",
        role: "USER",
        coinBalance: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe("authenticated");
    });

    expect(result.current.user?.username).toBe("bootuser");
    expect(result.current.accessToken).toBe("boot-token");
  });

  it("logs in and stores user in memory", async () => {
    mockAuthApiClient.post.mockResolvedValue({
      data: {
        data: {
          user: {
            id: 2,
            username: "loginuser",
            email: "login@example.com",
            phone: "5511999991111",
            role: "USER",
            coinBalance: 10,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
          accessToken: { token: "login-token", expiresIn: "15m" },
        },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe("unauthenticated");
    });

    await act(async () => {
      await result.current.login("loginuser", "password123");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.accessToken).toBe("login-token");
    expect(result.current.user?.username).toBe("loginuser");
  });

  it("logs out and clears session", async () => {
    mockRefresh.mockResolvedValue({
      accessToken: "session-token",
      user: {
        id: 3,
        username: "logoutuser",
        email: "logout@example.com",
        phone: "5511999992222",
        role: "USER",
        coinBalance: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalledWith("session-token");
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.accessToken).toBeNull();
  });
});
