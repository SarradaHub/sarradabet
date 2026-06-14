import { useState, useCallback } from "react";
import { ApiResponse, ApiError } from "../interfaces/IService";

export interface UseMutationOptions<TData, TVariables, TContext = unknown> {
  onMutate?: (variables: TVariables) => TContext | void | Promise<TContext | void>;
  onRollback?: (
    context: TContext,
    error: ApiError,
    variables: TVariables,
  ) => void;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: ApiError, variables: TVariables) => void;
  onSettled?: (
    data: TData | null,
    error: ApiError | null,
    variables: TVariables,
  ) => void;
}

export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | null>;
  mutateAsync: (variables: TVariables) => Promise<TData | null>;
  data: TData | null;
  loading: boolean;
  error: string | null;
  apiError: ApiError | null;
  reset: () => void;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
}

export function useMutation<TData, TVariables, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options: UseMutationOptions<TData, TVariables, TContext> = {},
): UseMutationResult<TData, TVariables> {
  const { onMutate, onRollback, onSuccess, onError, onSettled } = options;

  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<ApiError | null>(null);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      let context: TContext | void | undefined;

      try {
        setLoading(true);
        setError(null);
        setApiError(null);

        context = await onMutate?.(variables);

        const response = await mutationFn(variables);

        if (response.success) {
          setData(response.data);
          onSuccess?.(response.data, variables);
          onSettled?.(response.data, null, variables);
          return response.data;
        }

        const errorMessage = response.message || "Mutation failed";
        const mutationError: ApiError = {
          success: false,
          message: errorMessage,
        };

        if (context !== undefined && onRollback) {
          onRollback(context as TContext, mutationError, variables);
        }

        setError(errorMessage);
        setApiError(mutationError);
        onError?.(mutationError, variables);
        onSettled?.(null, mutationError, variables);
        return null;
      } catch (err: unknown) {
        const e = err as { message?: string; errors?: ApiError["errors"] };
        const mutationError: ApiError = {
          success: false,
          message: e?.message || "An unexpected error occurred",
          errors: e?.errors,
        };

        if (context !== undefined && onRollback) {
          onRollback(context as TContext, mutationError, variables);
        }

        setError(mutationError.message);
        setApiError(mutationError);
        onError?.(mutationError, variables);
        onSettled?.(null, mutationError, variables);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, onMutate, onRollback, onSuccess, onError, onSettled],
  );

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      return mutate(variables);
    },
    [mutate],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setApiError(null);
    setLoading(false);
  }, []);

  const isSuccess = data !== null && !error && !loading;
  const isError = error !== null && !loading;
  const isIdle = !loading && data === null && error === null;

  return {
    mutate,
    mutateAsync,
    data,
    loading,
    error,
    apiError,
    reset,
    isSuccess,
    isError,
    isIdle,
  };
}
