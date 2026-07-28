import React from 'react';

export interface TabItem<T extends string = string> {
    value: T;
    label: string;
    icon?: React.ReactNode;
}

interface TabBarProps<T extends string = string> {
    tabs: TabItem<T>[];
    active: T;
    onChange: (value: T) => void;
    className?: string;
}

function TabBar<T extends string>({ tabs, active, onChange, className = '' }: TabBarProps<T>) {
    return (
        <div className={`flex items-center gap-1 p-1.5 bg-slate-100 border border-slate-200 rounded-xl overflow-x-auto no-scrollbar ${className}`}>
            {tabs.map(({ value, label, icon }) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => onChange(value)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm whitespace-nowrap shrink-0 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e911] focus-visible:ring-offset-1 ${
                        active === value
                            ? 'bg-[#c6e911] text-slate-800 font-semibold shadow-sm'
                            : 'font-medium text-slate-500 hover:text-slate-700 hover:bg-white'
                    }`}
                >
                    {icon && (
                        <span className={active === value ? 'text-slate-700' : 'text-slate-400'}>
                            {icon}
                        </span>
                    )}
                    {label}
                </button>
            ))}
        </div>
    );
}

export default TabBar;
