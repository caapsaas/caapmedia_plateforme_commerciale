import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'md' | 'lg';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sizeClasses: Record<'md' | 'lg', string> = {
  md: 'max-w-[480px]',
  lg: 'max-w-[640px]',
};

const SlideOverDrawer: React.FC<SlideOverDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 modal-backdrop z-[998]" />
        <Dialog.Content
          className={cn(
            'fixed right-0 top-0 h-full w-full bg-white border-l border-[var(--border)] shadow-xl z-[999] flex flex-col focus:outline-none animate-drawer-in',
            sizeClasses[size],
          )}
        >
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[var(--border)] shrink-0">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold text-[var(--foreground)] truncate">
                {title}
              </Dialog.Title>
              {subtitle && (
                <Dialog.Description className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                  {subtitle}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Fermer"
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors duration-150 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="px-5 py-3.5 bg-[var(--muted)]/60 border-t border-[var(--border)] shrink-0 flex items-center justify-end gap-2">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SlideOverDrawer;
