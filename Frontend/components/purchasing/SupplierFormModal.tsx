import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types/models';

interface SupplierFormModalProps {
    supplier?: Supplier | null;
    onClose: () => void;
    onSave: (data: Omit<Supplier, 'id' | 'subsidiaryId'>) => void;
    isSaving: boolean;
}

const EMPTY: Omit<Supplier, 'id' | 'subsidiaryId'> = {
    supplierName: '', company: '', email: '', phone: '', address: '',
};

const SupplierFormModal: React.FC<SupplierFormModalProps> = ({ supplier, onClose, onSave, isSaving }) => {
    const [form, setForm] = useState(EMPTY);

    useEffect(() => {
        setForm(supplier
            ? { supplierName: supplier.supplierName, company: supplier.company, email: supplier.email, phone: supplier.phone, address: supplier.address }
            : EMPTY
        );
    }, [supplier]);

    const set = (field: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">
                        {supplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <Field label="Nom du fournisseur *" value={form.supplierName} onChange={set('supplierName')} required />
                    <Field label="Société" value={form.company} onChange={set('company')} />
                    <Field label="Email" type="email" value={form.email} onChange={set('email')} />
                    <Field label="Téléphone" type="tel" value={form.phone} onChange={set('phone')} />
                    <Field label="Adresse" value={form.address} onChange={set('address')} />
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                            Annuler
                        </button>
                        <button type="submit" disabled={isSaving || !form.supplierName}
                            className="px-5 py-2 rounded-lg text-sm font-bold bg-[#c6e911] text-slate-800 hover:bg-[#adc40f] disabled:opacity-50 transition-colors">
                            {isSaving ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Field: React.FC<{
    label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string; required?: boolean;
}> = ({ label, value, onChange, type = 'text', required }) => (
    <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
        <input
            type={type} value={value} onChange={onChange} required={required}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
        />
    </div>
);

export default SupplierFormModal;
