import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  primary: 'bg-[#c6e911]/20 text-[#7a8e00]',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

const Badge: React.FC<BadgeProps> = ({ variant = 'default', size = 'md', children, icon, className = '' }) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-semibold
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
