import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

type AuthHandlers = {
  getAccessToken: () => string | null;
  refreshSession: () => Promise<string | null>;
  onUnauthorized: () => void;
};

let authHandlers: AuthHandlers = {
  getAccessToken: () => null,
  refreshSession: async () => null,
  onUnauthorized: () => {},
};

let refreshPromise: Promise<string | null> | null = null;

export function registerAuthHandlers(handlers: AuthHandlers): void {
  authHandlers = handlers;
}

export function getApiRootUrl(): string {
  const directApiUrl = import.meta.env.VITE_API_URL as string | undefined;

  // Dev: use Vite proxy (/api -> localhost:8000) unless explicitly bypassed.
  // Avoids WSL/Windows "timeout" when the browser cannot reach :8000 directly.
  if (import.meta.env.DEV && import.meta.env.VITE_API_DIRECT !== "true") {
    return "";
  }

  if (directApiUrl) {
    return directApiUrl;
  }

  return import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8000";
}

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  return url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout");
}

function attachAuthInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = authHandlers.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      if (
        error.response?.status !== 401 ||
        !originalRequest ||
        originalRequest._retry ||
        isAuthEndpoint(originalRequest.url)
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = authHandlers
          .refreshSession()
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;

      if (!newToken) {
        authHandlers.onUnauthorized();
        return Promise.reject(error);
      }

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return client(originalRequest);
    },
  );
}

export function createApiClient(endpoint: string): AxiosInstance {
  const client = axios.create({
    baseURL: `${getApiRootUrl()}/api/v1/${endpoint}`,
    timeout: 10000,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  attachAuthInterceptors(client);
  return client;
}

export const authApiClient = createApiClient("auth");

export async function refreshAccessTokenRequest(): Promise<{
  accessToken: string;
  user: unknown;
} | null> {
  try {
    const response = await axios.post(
      `${getApiRootUrl()}/api/v1/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      },
    );

    const data = response.data?.data;
    if (!data?.accessToken?.token) {
      return null;
    }

    return {
      accessToken: data.accessToken.token as string,
      user: data.user,
    };
  } catch {
    return null;
  }
}

export async function logoutRequest(accessToken: string | null): Promise<void> {
  try {
    await axios.post(
      `${getApiRootUrl()}/api/v1/auth/logout`,
      {},
      {
        withCredentials: true,
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
      },
    );
  } catch {
    // ignore logout network errors
  }
}
