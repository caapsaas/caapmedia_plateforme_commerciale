import React from 'react';

interface FormSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

const FormSection: React.FC<FormSectionProps> = ({ title, subtitle, children, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="pb-3 border-b-2 border-[#c6e911]/30">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
};

export default FormSection;
