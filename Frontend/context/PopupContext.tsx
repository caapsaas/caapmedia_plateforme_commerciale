import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useI18n } from '../i18n';

interface PopupOptions {
  title?: string;
  isDangerous?: boolean;
}

interface PopupRequest extends PopupOptions {
  message: string;
  resolve?: (accepted: boolean) => void;
}

const PopupContext = createContext<{
  showMessage: (message: string, title?: string) => void;
  confirmAction: (message: string, options?: PopupOptions) => Promise<boolean>;
} | null>(null);

export function usePopup() {
  const popup = useContext(PopupContext);
  if (!popup) throw new Error('usePopup must be used within a PopupProvider');
  return popup;
}

export function PopupProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [requests, setRequests] = useState<PopupRequest[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const request = requests[0];
  const isOpen = Boolean(request);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, [isOpen]);

  const finish = (accepted: boolean) => {
    if (!request) return;
    setRequests(current => current.slice(1));
    request.resolve?.(accepted);
  };

  return (
    <PopupContext.Provider value={{
      showMessage: (message, title) => setRequests(current => [...current, { message, title }]),
      confirmAction: (message, options) => new Promise<boolean>(resolve => {
        setRequests(current => [...current, { ...options, message, resolve }]);
      }),
    }}>
      {children}
      {createPortal(
        <dialog
          ref={dialogRef}
          aria-label={request?.title ?? t(request?.resolve ? 'popups.confirmTitle' : 'popups.messageTitle')}
          className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-transparent"
          onCancel={event => {
            event.preventDefault();
            finish(false);
          }}
        >
          {request && (
            <ConfirmationModal
              isOpen
              embedded
              acknowledgeOnly={!request.resolve}
              title={request.title ?? t(request.resolve ? 'popups.confirmTitle' : 'popups.messageTitle')}
              message={request.message}
              onClose={() => finish(false)}
              onConfirm={() => finish(true)}
              isDangerous={request.isDangerous}
              confirmButtonText={t(request.resolve ? (request.isDangerous ? 'common.confirmDelete' : 'common.confirm') : 'common.close')}
            />
          )}
        </dialog>,
        document.body,
      )}
    </PopupContext.Provider>
  );
}
