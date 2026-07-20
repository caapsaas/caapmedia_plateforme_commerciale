import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useRef,
} from "react";

interface LoadingContextType {
  isLoading: boolean;
  loadingCount: number;
  show: (label?: string) => void;
  hide: () => void;
  reset: () => void;
  label?: string;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);
  const [label, setLabel] = useState<string>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const show = useCallback((newLabel?: string) => {
    setLoadingCount((prev) => prev + 1);
    setIsLoading(true);
    if (newLabel) setLabel(newLabel);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const hide = useCallback(() => {
    setLoadingCount((prev) => Math.max(0, prev - 1));
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setLoadingCount((current) => {
        if (current === 0) {
          setIsLoading(false);
          setLabel(undefined);
        }
        return current;
      });
    }, 300);
  }, []);

  const reset = useCallback(() => {
    setLoadingCount(0);
    setIsLoading(false);
    setLabel(undefined);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingCount,
        show,
        hide,
        reset,
        label,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
