import React from 'react';

const ConfigurationSearch: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}> = ({ value, onChange, placeholder }) => (
  <div className="mb-4">
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm focus:border-[#c6e911] focus:outline-none focus:ring-1 focus:ring-[#c6e911] md:max-w-sm"
    />
  </div>
);

export default ConfigurationSearch;
