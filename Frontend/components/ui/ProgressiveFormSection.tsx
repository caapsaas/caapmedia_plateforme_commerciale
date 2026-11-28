import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ProgressiveFormSectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}

const ProgressiveFormSection: React.FC<ProgressiveFormSectionProps> = ({
  title,
  description,
  defaultOpen = false,
  badge,
  children,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        'border border-[var(--border)] rounded-[var(--radius-md)] bg-white overflow-hidden',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-[var(--muted)]/50 hover:bg-[var(--muted)] transition-colors duration-150 cursor-pointer"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {title}
            </span>
            {badge && (
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-200 text-slate-700">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-[var(--muted-foreground)] shrink-0 transition-transform duration-200 ease-[var(--ease-out-ui)]',
            isOpen && 'rotate-180',
          )}
        />
      </button>
      {isOpen && <div className="p-4 border-t border-[var(--border)] space-y-4">{children}</div>}
    </div>
  );
};

export default ProgressiveFormSection;
