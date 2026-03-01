import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosResponse } from 'axios';

interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

interface UseApiWithFallbackOptions<T> {
  cacheKey?: string;
  fallbackData?: T;
  enabled?: boolean;
}

export const useApiWithFallback = <T = any>(
  apiCall: () => Promise<AxiosResponse<T>>,
  options: UseApiWithFallbackOptions<T> = {}
) => {
  const { cacheKey, fallbackData, enabled = true } = options;

  const [data, setData] = useState<T | undefined>(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      // Try to get from cache first
      if (cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          setData(parsedCache);
        }
      }

      // Fetch fresh data
      const response = await apiCall();
      const freshData = response.data;

      setData(freshData);
      setError(null);

      // Cache the response
      if (cacheKey) {
        localStorage.setItem(cacheKey, JSON.stringify(freshData));
      }

      setRetryCount(0);
    } catch (err) {
      const error = err as Error;
      setError(error);

      // If no cached data and no fallback, keep loading state for retry
      if (!data && !fallbackData) {
        setLoading(false);
      }

      // Auto-retry logic (up to 3 times with exponential backoff)
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchData();
        }, delay);
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall, cacheKey, fallbackData, enabled, retryCount, data]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    setRetryCount(0);
    fetchData();
  }, [fetchData]);

  const clearCache = useCallback(() => {
    if (cacheKey) {
      localStorage.removeItem(cacheKey);
    }
  }, [cacheKey]);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache,
    hasCache: cacheKey ? !!localStorage.getItem(cacheKey) : false,
    retryCount
  };
};