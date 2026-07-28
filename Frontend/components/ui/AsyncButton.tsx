import React from 'react';
import { useAsyncAction } from '../../hooks/useAsyncAction';

interface AsyncButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onClick: () => Promise<unknown> | unknown;
  loading?: boolean;
  showSpinner?: boolean;
}

/**
 * Bouton qui protège son propre onClick contre les double-clics via
 * useAsyncAction, et peut aussi refléter un état de chargement externe
 * (ex : mutation.isPending) via la prop `loading`.
 */
const AsyncButton: React.FC<AsyncButtonProps> = ({ onClick, loading, showSpinner = true, disabled, children, className, ...rest }) => {
  const { run, isRunning } = useAsyncAction(onClick);
  const busy = isRunning || !!loading;

  return (
    <button
      {...rest}
      disabled={disabled || busy}
      onClick={() => run()}
      className={className}
    >
      {busy && showSpinner ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : (
        children
      )}
    </button>
  );
};

export default AsyncButton;
