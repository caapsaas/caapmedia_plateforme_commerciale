import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  shadow?: 'sm' | 'md' | 'lg';
}

const shadowStyles = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

const Card: React.FC<CardProps> = ({ children, className = '', hover = false, shadow = 'md' }) => {
  return (
    <div
      className={`
        bg-white rounded-lg border border-slate-200
        ${shadowStyles[shadow]}
        ${hover ? 'hover:shadow-lg hover:border-slate-300 transition-all duration-200 cursor-pointer' : ''}
        ${className}
      `}
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

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', gradient = false }) => {
  return (
    <div
      className={`
        px-6 py-4 border-b border-slate-200
        ${gradient ? 'bg-gradient-to-r from-[#c6e911]/10 to-[#c6e911]/5' : 'bg-slate-50'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-lg flex justify-end gap-2 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
