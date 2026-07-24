import React from 'react';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}

const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, helperText, required, options, placeholder, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            block w-full border rounded-lg shadow-sm py-2 px-4
            border-slate-300 focus:border-[#c6e911] focus:ring-2 focus:ring-[#c6e911]/20
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            transition-colors duration-200
            appearance-none bg-white pr-8
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className || ''}
          `}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
        {error && <p className="text-red-500 text-sm mt-1 flex items-center gap-1">✕ {error}</p>}
        {helperText && !error && <p className="text-slate-500 text-sm mt-1">{helperText}</p>}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';

export default FormSelect;
