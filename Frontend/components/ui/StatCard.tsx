import React from 'react';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'lime' | 'blue' | 'green' | 'orange' | 'red';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const iconStyles: Record<NonNullable<StatCardProps['color']>, string> = {
  lime: 'bg-[var(--brand-soft)] text-[var(--brand-text)] border-[#D9F99D]',
  blue: 'bg-[var(--info-soft)] text-[var(--info)] border-[var(--info-border)]',
  green: 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success-border)]',
  orange: 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning-border)]',
  red: 'bg-[var(--destructive-soft)] text-[var(--destructive)] border-[var(--destructive-border)]',
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'lime',
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-[var(--radius-md)] p-4 border border-[var(--border)] shadow-2xs',
        onClick &&
          'cursor-pointer transition-[border-color,box-shadow] duration-150 ease-[var(--ease-out-ui)] hover:border-[var(--border-strong)] hover:shadow-xs',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--muted-foreground)] truncate">
            {title}
          </p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1.5 tabular-nums tracking-tight">
            {value}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-full',
                  trend.isPositive
                    ? 'bg-[var(--success-soft)] text-[var(--success)]'
                    : 'bg-[var(--destructive-soft)] text-[var(--destructive)]',
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
            {subtitle && (
              <p className="text-xs text-[var(--muted-foreground)] truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {icon && (
          <div
            className={cn(
              'rounded-[var(--radius-sm)] p-2.5 border shrink-0',
              iconStyles[color],
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
