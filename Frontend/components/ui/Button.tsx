import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 font-medium',
    'rounded-[var(--radius-sm)] select-none cursor-pointer',
    'transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-[var(--ease-out-ui)]',
    'active:scale-[0.97]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        brand:
          'bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-[var(--brand-foreground)] font-semibold border border-transparent shadow-xs',
        primary:
          'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-semibold border border-transparent shadow-xs',
        secondary:
          'bg-[var(--secondary)] hover:bg-slate-200/80 text-[var(--secondary-foreground)] border border-[var(--border)]',
        outline:
          'bg-white hover:bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border-strong)]',
        ghost:
          'bg-transparent hover:bg-[var(--muted)] text-[var(--foreground)] border border-transparent',
        destructive:
          'bg-[var(--destructive)] hover:bg-red-700 text-[var(--destructive-foreground)] font-semibold border border-transparent',
        success:
          'bg-[var(--success)] hover:bg-emerald-700 text-white font-semibold border border-transparent',
        danger:
          'bg-[var(--destructive)] hover:bg-red-700 text-white font-semibold border border-transparent',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'brand',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'brand',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          buttonVariants({ variant, size }),
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { buttonVariants };
export default Button;
