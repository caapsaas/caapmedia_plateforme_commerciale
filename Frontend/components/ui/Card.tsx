import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const shadowStyles = {
  none: 'shadow-none',
  sm: 'shadow-2xs',
  md: 'shadow-xs',
  lg: 'shadow-sm',
};

const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  shadow = 'sm',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[var(--card)] text-[var(--card-foreground)] rounded-[var(--radius-md)] border border-[var(--border)]',
        shadowStyles[shadow],
        hover &&
          'transition-[border-color,box-shadow] duration-150 ease-[var(--ease-out-ui)] hover:border-[var(--border-strong)] hover:shadow-xs cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
  gradient = false,
}) => {
  return (
    <div
      className={cn(
        'px-5 py-3.5 border-b border-[var(--border)] rounded-t-[var(--radius-md)]',
        gradient ? 'bg-[var(--brand-soft)]' : 'bg-white',
        className,
      )}
    >
      {children}
    </div>
  );
};

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className }) => {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'px-5 py-3.5 border-t border-[var(--border)] bg-[var(--muted)]/60 rounded-b-[var(--radius-md)] flex justify-end gap-2',
        className,
      )}
    >
      {children}
    </div>
  );
};

export default Card;
