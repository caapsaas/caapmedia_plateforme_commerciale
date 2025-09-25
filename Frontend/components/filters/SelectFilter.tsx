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
                className="w-full bg-white border border-slate-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-[#c6e911] focus:border-[#c6e911] sm:text-sm"
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