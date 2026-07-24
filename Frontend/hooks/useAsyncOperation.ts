import { useState, useCallback } from 'react';
import { useLoading } from '../context/LoadingContext';

interface UseAsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  loadingLabel?: string;
}

interface UseAsyncOperationReturn<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  execute: (fn: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook for managing async operations with integrated loading state
 * Handles loading, error, and data states automatically
 */
export const useAsyncOperation = <T = any>(
  options?: UseAsyncOperationOptions
): UseAsyncOperationReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { show, hide } = useLoading();

  const execute = useCallback(
    async (fn: () => Promise<T>): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      show(options?.loadingLabel);

      try {
        const result = await fn();
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
        hide();
      }
    },
    [show, hide, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    reset,
  };
};

/**
 * Hook for managing multiple async operations in parallel
 */
export const useMultipleAsyncOperations = () => {
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, Error>>({});
  const [loadingOps, setLoadingOps] = useState<Set<string>>(new Set());
  const { show, hide } = useLoading();

  const executeAll = useCallback(
    async (
      operations: Record<string, () => Promise<any>>,
      label?: string
    ): Promise<Record<string, any>> => {
      const opNames = Object.keys(operations);
      setLoadingOps(new Set(opNames));
      show(label);

      try {
        const promises = Object.entries(operations).map(async ([key, fn]) => {
          try {
            const result = await fn();
            return { key, result, error: null };
          } catch (error) {
            return {
              key,
              result: null,
              error: error instanceof Error ? error : new Error(String(error)),
            };
          }
        });

        const allResults = await Promise.all(promises);

        const successResults: Record<string, any> = {};
        const failedErrors: Record<string, Error> = {};

        allResults.forEach(({ key, result, error }) => {
          if (error) {
            failedErrors[key] = error;
          } else {
            successResults[key] = result;
          }
        });

        setResults(successResults);
        setErrors(failedErrors);
        return successResults;
      } finally {
        setLoadingOps(new Set());
        hide();
      }
    },
    [show, hide]
  );

  const isLoading = loadingOps.size > 0;

  return {
    results,
    errors,
    isLoading,
    executeAll,
  };
};

/**
 * Hook for managing form submission with async operations
 */
export const useAsyncForm = <T = any>(
  onSubmit: (data: T) => Promise<void>,
  options?: UseAsyncOperationOptions
) => {
  const { execute, isLoading, error, reset } = useAsyncOperation(options);

  const handleSubmit = useCallback(
    async (data: T) => {
      await execute(() => onSubmit(data));
    },
    [execute, onSubmit]
  );

  return {
    handleSubmit,
    isLoading,
    error,
    reset,
  };
};
