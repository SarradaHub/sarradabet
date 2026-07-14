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
  // Stabilize execute/setData to avoid refetch identity changes on state updates
  const executeRef = useRef(api.execute);
  const setDataRef = useRef(api.setData);
  useEffect(() => {
    executeRef.current = api.execute;
    setDataRef.current = api.setData;
  }, [api.execute, api.setData]);

  // Keep refs to avoid stale closures and stabilize refetch
  const queryKeyRef = useRef(queryKey);
  useEffect(() => {
    queryKeyRef.current = queryKey;
  }, [queryKey]);

  const isStaleRef = useRef(isStale);
  useEffect(() => {
    isStaleRef.current = isStale;
  }, [isStale]);

  const applyResult = useCallback((result: T | null) => {
    setDataRef.current(result);
    setLastFetched(new Date());
    setIsStale(false);
    return result;
  }, []);

  const refetch = useCallback(async (): Promise<T | null> => {
    const key = queryKeyRef.current;
    const currentlyStale = isStaleRef.current;

    const cached = queryCache.get<T>(key);
    if (cached && !currentlyStale) {
      // Sync this hook instance (important under React Strict Mode /
      // multiple subscribers sharing the same query key).
      return applyResult(cached);
    }

    if (queryCache.isPending(key)) {
      const pending = queryCache.getPending<T>(key);
      if (pending) {
        const result = await pending;
        const final = queryCache.get<T>(key) ?? result;
        return applyResult(final);
      }
    }

    const promise = executeRef.current();
    queryCache.setPending<T>(key, promise);

    try {
      const result = await promise;

      queryCache.set<T | null>(key, (result as T | null) ?? null);
      const final = queryCache.get<T | null>(key) as T | null;
      // execute() already wrote api.data for the caller instance; still
      // refresh fetch metadata for subscribers that awaited the pending path.
      setLastFetched(new Date());
      setIsStale(false);
      return final;
    } catch (error) {
      throw error;
    }
  }, [applyResult]);

  useEffect(() => {
    if (
      enabled &&
      (refetchOnMount || lastFetched === null) &&
      (isStale || lastFetched === null)
    ) {
      refetch();
    }
  }, [enabled, refetchOnMount, isStale, lastFetched, refetch]);

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
        if (enabled) {
          void refetch();
        }
      }, staleTime);

      return () => clearTimeout(timer);
    }
  }, [lastFetched, staleTime, enabled, refetch]);

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
