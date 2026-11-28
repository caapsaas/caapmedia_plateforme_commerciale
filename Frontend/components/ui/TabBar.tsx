import React from 'react';
import { cn } from '../../utils/cn';

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

interface TabBarProps<T extends string = string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (value: T) => void;
  className?: string;
}

function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: TabBarProps<T>) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 bg-[var(--muted)] border border-[var(--border)] rounded-[var(--radius-md)] overflow-x-auto no-scrollbar',
        className,
      )}
    >
      {tabs.map(({ value, label, icon, badge }) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--radius-sm)] text-[13px] whitespace-nowrap shrink-0 cursor-pointer',
              'transition-[background-color,color,box-shadow] duration-150 ease-[var(--ease-out-ui)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
              isActive
                ? 'bg-[var(--brand)] text-[var(--brand-foreground)] font-semibold shadow-2xs'
                : 'font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/80',
            )}
          >
            {icon && (
              <span className={isActive ? 'text-[var(--brand-foreground)]' : 'text-slate-400'}>
                {icon}
              </span>
            )}
            <span>{label}</span>
            {badge !== undefined && badge !== null && (
              <span
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-bold rounded-full tabular-nums',
                  isActive
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-slate-200 text-slate-700',
                )}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TabBar;
