import React from 'react';
import LoadingOverlay from './LoadingOverlay';
import { LoadingProvider, useLoading } from '../../context/LoadingContext';
import './LoadingPage.css';

interface LoadingPageProps {
  /**
   * The main content to show when loading is complete
   */
  children: React.ReactNode;

  /**
   * Whether to show the loading state on initial mount
   */
  showInitialLoading?: boolean;

  /**
   * Label to display on the loading overlay
   */
  initialLoadingLabel?: string;

  /**
   * Callback when loading should be hidden
   */
  onLoadingComplete?: () => void;

  /**
   * CSS class for the container
   */
  className?: string;
}

/**
 * Component for displaying a loading page on initial mount
 * Useful for auth pages, initial data loading, etc.
 */
export const LoadingPage: React.FC<LoadingPageProps> = ({
  children,
  showInitialLoading = false,
  initialLoadingLabel = 'Loading...',
  onLoadingComplete,
  className,
}) => {
  const [shouldShowInitialLoading, setShouldShowInitialLoading] = React.useState(
    showInitialLoading
  );

  React.useEffect(() => {
    if (shouldShowInitialLoading) {
      // Optional: automatically hide after a certain time or callback
      const handleLoadingComplete = () => {
        setShouldShowInitialLoading(false);
        onLoadingComplete?.();
      };

      // You can call this from within the children or set a timeout
      window.__completeLoading = handleLoadingComplete;

      return () => {
        delete window.__completeLoading;
      };
    }
  }, [shouldShowInitialLoading, onLoadingComplete]);

  return (
    <div className={`loading-page ${className || ''}`}>
      {shouldShowInitialLoading && (
        <LoadingProvider>
          <LoadingPageContent label={initialLoadingLabel} />
        </LoadingProvider>
      )}
      {children}
    </div>
  );
};

interface LoadingPageContentProps {
  label: string;
}

/**
 * Internal component for loading page content
 */
const LoadingPageContent: React.FC<LoadingPageContentProps> = ({ label }) => {
  const { show } = useLoading();

  React.useEffect(() => {
    show(label);
  }, [label, show]);

  return <LoadingOverlay />;
};

/**
 * Hook to control the loading page from within children
 */
export const useLoadingPageControl = () => {
  return {
    complete: () => {
      (window as any).__completeLoading?.();
    },
  };
};

// Extend Window interface for the control function
declare global {
  interface Window {
    __completeLoading?: () => void;
  }
}
