import { ApiError, ApiResponse } from "../core/interfaces/IService";

const RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504]);

function isRetryableApiError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const apiError = error as ApiError;
  if (apiError.statusCode && RETRYABLE_STATUS_CODES.has(apiError.statusCode)) {
    return true;
  }

  const message = apiError.message?.toLowerCase() ?? "";
  return (
    message.includes("banco de dados") ||
    message.includes("database") ||
    message.includes("cannot connect to the api server")
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function retryApiCall<T>(
  fn: () => Promise<ApiResponse<T>>,
  options: { maxRetries?: number; baseDelayMs?: number } = {},
): Promise<ApiResponse<T>> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    if (attempt > 0) {
      await wait(baseDelayMs * attempt);
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableApiError(error) || attempt === maxRetries) {
        throw error;
      }
    }
  }

  throw lastError;
}
