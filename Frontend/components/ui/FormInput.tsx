import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, required, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">{icon}</div>}
          <input
            ref={ref}
            className={`
              block w-full border rounded-lg shadow-sm py-2 px-4
              border-slate-300 focus:border-[#c6e911] focus:ring-2 focus:ring-[#c6e911]/20
              disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
              transition-colors duration-200
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
              ${className || ''}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-red-500 text-sm mt-1 flex items-center gap-1">✕ {error}</p>}
        {helperText && !error && <p className="text-slate-500 text-sm mt-1">{helperText}</p>}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export default FormInput;
