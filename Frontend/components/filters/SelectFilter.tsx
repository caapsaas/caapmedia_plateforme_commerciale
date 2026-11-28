import React from 'react';

interface SelectFilterProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
    placeholder: string;
}

const SelectFilter: React.FC<SelectFilterProps> = ({ label, name, value, onChange, options, placeholder }) => {
    return (
        <div>
            <label htmlFor={label} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <select
                id={label}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full h-9 bg-white border border-[var(--border-strong)] rounded-[var(--radius-sm)] shadow-2xs pl-3 pr-9 text-left text-sm text-slate-700 cursor-pointer hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c6e911]/40 focus:border-slate-400"
            >
                <option value="">{placeholder}</option>
                {options.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </div>
    );
};

export default SelectFilter;