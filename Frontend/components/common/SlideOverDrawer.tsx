import React from 'react';

interface SlideOverDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

// Panneau latéral générique (Chantier 5 Builder) — reprend le pattern déjà
// utilisé par le panier du site vitrine (ShoppingCart.tsx), pas de dépendance
// Radix/shadcn pour rester cohérent avec le reste de l'application (Tailwind pur).
const SlideOverDrawer: React.FC<SlideOverDrawerProps> = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[999]" onClick={onClose}>
            <div
                className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
                    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-4">{children}</div>
                {footer && <div className="p-4 bg-slate-50 border-t flex-shrink-0">{footer}</div>}
            </div>
        </div>
    );
};

export default SlideOverDrawer;
