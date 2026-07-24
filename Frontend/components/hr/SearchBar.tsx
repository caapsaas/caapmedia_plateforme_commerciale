import React from 'react';
import IconX from '../icons/IconX';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Rechercher...',
  className = ''
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 pl-4 pr-10 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911] focus:border-transparent"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Clear search"
        >
          <IconX className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
