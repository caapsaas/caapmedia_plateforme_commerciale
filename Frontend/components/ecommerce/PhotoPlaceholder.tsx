import React from 'react';

interface PhotoPlaceholderProps {
  label: string;
  className?: string;
}

const PhotoPlaceholder: React.FC<PhotoPlaceholderProps> = ({ label, className = '' }) => (
  <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 via-white to-lime-50/70 ${className}`} role="img" aria-label={label}>
    <div aria-hidden="true" className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(#94a3b8 0.7px, transparent 0.7px)', backgroundSize: '18px 18px' }} />
    <div className="relative flex flex-col items-center px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5h3l1.5-2.25h7.5l1.5 2.25h3A1.75 1.75 0 0 1 22 9.25v9A1.75 1.75 0 0 1 20.25 20h-16A1.75 1.75 0 0 1 2.5 18.25v-9A1.75 1.75 0 0 1 4.25 7.5Z" />
          <circle cx="12.25" cy="13.25" r="3.75" />
        </svg>
      </span>
      <span className="mt-3 max-w-52 text-sm font-semibold text-slate-600">{label}</span>
    </div>
  </div>
);

export default PhotoPlaceholder;
