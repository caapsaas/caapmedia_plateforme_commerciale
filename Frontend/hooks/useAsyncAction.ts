import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Encapsule une action asynchrone pour empêcher les exécutions concurrentes
 * (protection anti double-clic) et exposer un état de chargement.
 *
 * Le verrou est porté par une ref synchrone : même des clics très rapprochés,
 * avant le prochain rendu, sont ignorés tant que l'action est en cours.
 */
export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult> | TResult,
) {
  const [isRunning, setIsRunning] = useState(false);
  const runningRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      if (runningRef.current) return undefined;
      runningRef.current = true;
      setIsRunning(true);
      try {
        return await action(...args);
      } finally {
        runningRef.current = false;
        if (mountedRef.current) setIsRunning(false);
      }
    },
    [action],
  );

  return { run, isRunning };
}
