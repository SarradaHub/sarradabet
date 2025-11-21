import { useState, useEffect, useCallback, useRef } from "react";
import { useApi } from "./useApi";
import { ApiResponse, ApiError } from "../interfaces/IService";
import { queryCache } from "./useQueryCache";

export interface UseQueryOptions<T> {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

export interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  apiError: ApiError | null;
  refetch: () => Promise<T | null>;
  isStale: boolean;
  lastFetched: Date | null;
}

export function useQuery<T>(
  queryKey: string,
  queryFn: () => Promise<ApiResponse<T>>,
  options: UseQueryOptions<T> = {},
): UseQueryResult<T> {
  const {
    enabled = true,
    refetchOnMount = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    onSuccess,
    onError,
  } = options;

  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(true);

  const api = useApi(queryFn, { onSuccess, onError });
  // Stabilize execute to avoid refetch identity changes on state updates
  const executeRef = useRef(api.execute);
  useEffect(() => {
    executeRef.current = api.execute;
  }, [api.execute]);

  // Keep refs to avoid stale closures and stabilize refetch
  const queryKeyRef = useRef(queryKey);
  useEffect(() => {
    queryKeyRef.current = queryKey;
  }, [queryKey]);

  const isStaleRef = useRef(isStale);
  useEffect(() => {
    isStaleRef.current = isStale;
  }, [isStale]);

  const refetch = useCallback(async (): Promise<T | null> => {
    const key = queryKeyRef.current;
    const currentlyStale = isStaleRef.current;

    const cached = queryCache.get<T>(key);
    if (cached && !currentlyStale) {
      return cached;
    }

    if (queryCache.isPending(key)) {
      const pending = queryCache.getPending<T>(key);
      if (pending) {
        const result = await pending;
        return queryCache.get<T>(key) ?? result;
      }
    }

    const promise = executeRef.current();
    queryCache.setPending<T>(key, promise);

    try {
      const result = await promise;

      setLastFetched(new Date());
      setIsStale(false);
      queryCache.set<T | null>(key, (result as T | null) ?? null);

      const final = queryCache.get<T | null>(key) as T | null;
      return final;
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    if (
      enabled &&
      (refetchOnMount || lastFetched === null) &&
      (isStale || lastFetched === null)
    ) {
      refetch();
    }
  }, [enabled, refetchOnMount, isStale, lastFetched]);

  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) return;

    const handleFocus = () => {
      if (isStale) {
        refetch();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetchOnWindowFocus, enabled, isStale, refetch]);

  useEffect(() => {
    if (lastFetched && staleTime > 0) {
      const timer = setTimeout(() => {
        setIsStale(true);
      }, staleTime);

      return () => clearTimeout(timer);
    }
  }, [lastFetched, staleTime]);

  return {
    data: api.data,
    loading: api.loading,
    error: api.error,
    apiError: api.apiError,
    refetch,
    isStale,
    lastFetched,
  };
}
