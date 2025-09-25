import React, { useState, useEffect } from 'react';
import { ExpenseRecord, ExpenseCategory, ExpenseType } from '../../types';
import { useI18n } from '../../i18n';

interface ExpenseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<ExpenseRecord, 'id' | 'subsidiaryId'>) => void;
    expense: ExpenseRecord | null;
}

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ isOpen, onClose, onSave, expense }) => {
    const { t } = useI18n();
    const initialFormState = {
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: ExpenseCategory.OTHER,
        type: ExpenseType.VARIABLE,
        amount: 0,
    };
    
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (expense) {
            setFormData({
                date: expense.date,
                description: expense.description,
                category: expense.category,
                type: expense.type,
                amount: expense.amount,
            });
        } else {
            setFormData(initialFormState);
        }
    }, [expense, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const numValue = name === 'amount' ? parseFloat(value) : value;
        setFormData(prev => ({ ...prev, [name]: numValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-900">
                            {expense ? t('expenses.modal.editTitle') : t('expenses.modal.addTitle')}
                        </h3>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-700">{t('expenses.table.description')}</label>
                                <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-slate-700">{t('expenses.table.category')}</label>
                                    <select name="category" id="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                        {Object.values(ExpenseCategory).map(cat => <option key={cat} value={cat}>{t(`expenses.categories.${cat}`)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="type" className="block text-sm font-medium text-slate-700">{t('expenses.table.type')}</label>
                                    <select name="type" id="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                        {Object.values(ExpenseType).map(tVal => <option key={tVal} value={tVal}>{t(`expenses.types.${tVal}`)}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-slate-700">{t('expenses.table.amount')}</label>
                                    <input type="number" step="any" name="amount" id="amount" value={formData.amount} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium text-slate-700">{t('expenses.table.date')}</label>
                                    <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors">{t('common.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseFormModal;