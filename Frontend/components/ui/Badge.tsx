import React from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant =
  | 'default'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'
  | 'brand';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--muted)] text-slate-700 border-[var(--border)]',
  neutral: 'bg-[var(--muted)] text-slate-700 border-[var(--border)]',
  success:
    'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success-border)]',
  warning:
    'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning-border)]',
  danger:
    'bg-[var(--destructive-soft)] text-[var(--destructive)] border-[var(--destructive-border)]',
  info: 'bg-[var(--info-soft)] text-[var(--info)] border-[var(--info-border)]',
  primary: 'bg-[var(--brand-soft)] text-[var(--brand-text)] border-[#D9F99D]',
  brand: 'bg-[var(--brand)] text-[var(--brand-foreground)] border-transparent',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-xs',
};

const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  icon,
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold leading-tight whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current shrink-0"
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export type RaciRoleLetter = 'R' | 'A' | 'C' | 'I';

const raciStyles: Record<RaciRoleLetter, { cls: string; title: string }> = {
  R: {
    cls: 'bg-[var(--info-soft)] text-[#1D4ED8] border-[var(--info-border)]',
    title: 'Réalisateur (Responsible)',
  },
  A: {
    cls: 'bg-[var(--primary)] text-[var(--brand)] border-[var(--primary)]',
    title: 'Approbateur unique (Accountable)',
  },
  C: {
    cls: 'bg-[var(--warning-soft)] text-[#B45309] border-[var(--warning-border)]',
    title: 'Consulté (Consulted)',
  },
  I: {
    cls: 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]',
    title: 'Informé (Informed)',
  },
};

export const RaciBadge: React.FC<{ role: RaciRoleLetter; className?: string }> = ({
  role,
  className,
}) => {
  const cfg = raciStyles[role];
  return (
    <span
      title={cfg.title}
      className={cn(
        'inline-flex items-center justify-center w-6 h-6 rounded-[var(--radius-sm)] border text-xs font-bold font-mono-code',
        cfg.cls,
        className,
      )}
    >
      {role}
    </span>
  );
};

export default Badge;
