/**
 * Advanced Loading Manager
 * Provides utility functions for managing global loading state
 * Handles async operations with automatic loading state management
 */

import { useLoading } from "../context/LoadingContext";

export const createLoadingManager = (useLoadingHook: typeof useLoading) => {
  return {
    /**
     * Wrap an async function with automatic loading state
     * @param fn - Async function to wrap
     * @param label - Optional loading label
     * @returns Wrapped function with loading state
     */
    withLoading: async <T extends any[], R>(
      fn: (...args: T) => Promise<R>,
      label?: string
    ) => {
      const { show, hide } = useLoadingHook();

      return async (...args: T): Promise<R> => {
        show(label);
        try {
          const result = await fn(...args);
          return result;
        } finally {
          hide();
        }
      };
    },

    /**
     * Wrap a React component with loading provider
     * Ensures loading state is available throughout the component tree
     */
    withLoadingProvider: (Component: React.ComponentType<any>) => {
      return (props: any) => (
        <>
          <Component {...props} />
        </>
      );
    },
  };
};

/**
 * Custom hook for easy loading state management in components
 */
export const useLoadingState = (useLoadingHook: typeof useLoading) => {
  const { show, hide, reset } = useLoadingHook();

  return {
    startLoading: (label?: string) => show(label),
    stopLoading: () => hide(),
    resetLoading: () => reset(),
    /**
     * Execute an async function with loading state
     */
    executeWithLoading: async <T extends any[], R>(
      fn: (...args: T) => Promise<R>,
      label?: string,
      ...args: T
    ): Promise<R> => {
      show(label);
      try {
        return await fn(...args);
      } finally {
        hide();
      }
    },
  };
};

/**
 * Batch loading manager for coordinating multiple async operations
 */
export class BatchLoadingManager {
  private operations = new Map<string, Promise<any>>();
  private onLoadingChange?: (isLoading: boolean) => void;

  constructor(onLoadingChange?: (isLoading: boolean) => void) {
    this.onLoadingChange = onLoadingChange;
  }

  /**
   * Track a new async operation
   */
  track(id: string, promise: Promise<any>): Promise<any> {
    this.operations.set(id, promise);
    this.notifyLoadingChange();

    return promise
      .finally(() => {
        this.operations.delete(id);
        this.notifyLoadingChange();
      });
  }

  /**
   * Check if any operations are pending
   */
  isLoading(): boolean {
    return this.operations.size > 0;
  }

  /**
   * Get count of pending operations
   */
  getPendingCount(): number {
    return this.operations.size;
  }

  /**
   * Wait for all operations to complete
   */
  async waitForAll(): Promise<void> {
    if (this.operations.size === 0) return;
    await Promise.all(Array.from(this.operations.values()));
  }

  /**
   * Cancel all pending operations
   */
  cancelAll(): void {
    this.operations.clear();
    this.notifyLoadingChange();
  }

  private notifyLoadingChange(): void {
    this.onLoadingChange?.(this.isLoading());
  }
}
