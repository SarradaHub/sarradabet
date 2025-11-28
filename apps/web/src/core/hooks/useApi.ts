import { useState, useCallback, useEffect, useRef } from "react";
import { ApiResponse, ApiError } from "../interfaces/IService";

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  apiError: ApiError | null;
}

export interface UseApiActions<T> {
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

export type UseApiReturn<T> = UseApiState<T> & UseApiActions<T>;

export function useApi<T>(
  apiFunction: (...args: unknown[]) => Promise<ApiResponse<T>>,
  options: {
    immediate?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
  } = {},
): UseApiReturn<T> {
  const { immediate = false, onSuccess, onError } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    apiError: null,
  });

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      try {
        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
          apiError: null,
        }));

        const response = await apiFunction(...args);

        if (response.success) {
          setState((prev) => ({
            ...prev,
            data: response.data,
            loading: false,
          }));
          onSuccess?.(response.data);
          return response.data;
        } else {
          const errorMessage = response.message || "Request failed";

          setState((prev) => ({
            ...prev,
            error: errorMessage,
            loading: false,
            data: null,
          }));
          return null;
        }
      } catch (error: unknown) {
        const e = error as ApiError & {
          message?: string;
          errors?: ApiError["errors"];
        };
        const apiError: ApiError = {
          success: false,
          message: e?.message || "An unexpected error occurred",
          errors: e?.errors,
          url: e?.url,
          method: e?.method,
          requestId: e?.requestId,
        };

        setState((prev) => ({
          ...prev,
          error: apiError.message,
          apiError,
          loading: false,
          data: null,
        }));

        onError?.(apiError);
        return null;
      }
    },
    [apiFunction, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      apiError: null,
    });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  const executeRef = useRef(execute);
  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  useEffect(() => {
    if (immediate) {
      executeRef.current();
    }
  }, [immediate]);

  return {
    ...state,
    execute,
    reset,
    setData,
  };
}
