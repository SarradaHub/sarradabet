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
let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string | null> | null = null;

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

function isMutatingMethod(method: string | undefined): boolean {
  return MUTATING_METHODS.has((method ?? "get").toLowerCase());
}

export function clearCsrfToken(): void {
  csrfToken = null;
  csrfTokenPromise = null;
}

export async function fetchCsrfToken(): Promise<string | null> {
  if (csrfToken) {
    return csrfToken;
  }

  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  csrfTokenPromise = (async () => {
    try {
      const response = await axios.get(
        `${getApiRootUrl()}/api/v1/auth/csrf-token`,
        {
          withCredentials: true,
          timeout: 10000,
        },
      );
      const token = response.data?.data?.csrfToken;
      csrfToken = typeof token === "string" ? token : null;
      return csrfToken;
    } catch {
      csrfToken = null;
      return null;
    } finally {
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
}

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
  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = authHandlers.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (isMutatingMethod(config.method)) {
      const csrf = csrfToken ?? (await fetchCsrfToken());
      if (csrf) {
        config.headers["X-CSRF-Token"] = csrf;
      }
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        _csrfRetry?: boolean;
      };

      if (
        error.response?.status === 403 &&
        originalRequest &&
        !originalRequest._csrfRetry &&
        isMutatingMethod(originalRequest.method)
      ) {
        const message = (error.response.data as { message?: string } | undefined)
          ?.message;
        if (message?.toLowerCase().includes("csrf")) {
          originalRequest._csrfRetry = true;
          clearCsrfToken();
          const csrf = await fetchCsrfToken();
          if (csrf) {
            originalRequest.headers["X-CSRF-Token"] = csrf;
          }
          return client(originalRequest);
        }
      }

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

export async function uploadMultipart(
  endpoint: string,
  formData: FormData,
  timeoutMs = 30000,
): Promise<unknown> {
  const token = authHandlers.getAccessToken();
  const csrf = csrfToken ?? (await fetchCsrfToken());

  const response = await axios.post(
    `${getApiRootUrl()}/api/v1/${endpoint}`,
    formData,
    {
      withCredentials: true,
      timeout: timeoutMs,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      },
    },
  );

  return response.data?.data;
}

export const authApiClient = createApiClient("auth");

export async function refreshAccessTokenRequest(): Promise<{
  accessToken: string;
  user: unknown;
} | null> {
  try {
    const csrf = csrfToken ?? (await fetchCsrfToken());
    const response = await axios.post(
      `${getApiRootUrl()}/api/v1/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        },
        timeout: 10000,
      },
    );

    const data = response.data?.data;
    if (!data?.accessToken?.token) {
      return null;
    }

    clearCsrfToken();
    await fetchCsrfToken();

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
    const csrf = csrfToken ?? (await fetchCsrfToken());
    await axios.post(
      `${getApiRootUrl()}/api/v1/auth/logout`,
      {},
      {
        withCredentials: true,
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        },
      },
    );
    clearCsrfToken();
  } catch {
    // ignore logout network errors
  }
}
