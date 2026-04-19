import React from 'react';

interface ButtonProps {
    onClick?: () => void;
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
}

// Bouton principal (vert chartreuse)
export const PrimaryButton: React.FC<ButtonProps> = ({ onClick, children, disabled = false, className = "" }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

// Bouton secondaire (gris)
export const SecondaryButton: React.FC<ButtonProps> = ({ onClick, children, disabled = false, className = "" }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center space-x-2 px-4 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

// Bouton de succès (vert)
export const SuccessButton: React.FC<ButtonProps> = ({ onClick, children, disabled = false, className = "" }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

// Bouton de formulaire (plus grand)
export const FormPrimaryButton: React.FC<ButtonProps> = ({ onClick, children, disabled = false, className = "" }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-6 py-2 bg-[#c6e911] text-slate-800 rounded-lg hover:bg-[#adc40f] focus:outline-none focus:ring-2 focus:ring-[#c6e911] transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

// Bouton de formulaire secondaire
export const FormSecondaryButton: React.FC<ButtonProps> = ({ onClick, children, disabled = false, className = "" }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

// Bouton d'action circulaire (pour les icônes)
export const IconButton: React.FC<ButtonProps & { title?: string }> = ({ onClick, children, disabled = false, className = "", title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-2 text-slate-500 hover:text-green-600 hover:bg-green-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

// Bouton de danger circulaire
export const DangerIconButton: React.FC<ButtonProps & { title?: string }> = ({ onClick, children, disabled = false, className = "", title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

// Bouton d'avertissement circulaire
export const WarningIconButton: React.FC<ButtonProps & { title?: string }> = ({ onClick, children, disabled = false, className = "", title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-2 text-slate-500 hover:text-yellow-600 hover:bg-yellow-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

// Icônes SVG réutilisables
export const PlusIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

export const DownloadIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export const CheckIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const XIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const TrashIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const CloseIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);
