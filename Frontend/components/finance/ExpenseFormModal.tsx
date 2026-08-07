import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExpenseRecord, ExpenseCategory, ExpenseType } from '../../types';
import { useI18n } from '../../i18n';
import { accumulateCharges } from '../../services/apihr/apiPayroll';

interface ExpenseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<ExpenseRecord, 'id' | 'subsidiaryId'>) => void;
    expense: ExpenseRecord | null;
}

const SALARY_CATEGORIES = [
    ExpenseCategory.SALARY_CASH,
    ExpenseCategory.SALARY_CHECK,
    ExpenseCategory.SALARY_BANK_TRANSFER,
];

const PAYMENT_METHOD_MAP: Record<ExpenseCategory, string> = {
    [ExpenseCategory.SALARY_CASH]: 'CASH',
    [ExpenseCategory.SALARY_CHECK]: 'CHECK',
    [ExpenseCategory.SALARY_BANK_TRANSFER]: 'BANK_TRANSFER',
} as any;

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ isOpen, onClose, onSave, expense }) => {
    const { t, formatCurrency } = useI18n();
    const initialFormState = {
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: ExpenseCategory.OTHER,
        type: ExpenseType.VARIABLE,
        amount: 0,
        period: new Date().toISOString().slice(0, 7),
    };

    const [formData, setFormData] = useState(initialFormState);
    const [isLoadingAmount, setIsLoadingAmount] = useState(false);

    const isSalaryCategory = SALARY_CATEGORIES.includes(formData.category as ExpenseCategory);

    // Récupérer les charges accumulées
    const { data: chargesData, isLoading: isLoadingCharges } = useQuery({
        queryKey: ['accumulatedCharges', formData.period],
        queryFn: () => accumulateCharges(formData.period),
        enabled: !!formData.period && isSalaryCategory,
    });

    // Mettre à jour le montant automatiquement quand on a les données
    useEffect(() => {
        if (isSalaryCategory && chargesData && !expense) {
            const paymentMethod = PAYMENT_METHOD_MAP[formData.category as ExpenseCategory];
            const salaryData = chargesData.salaryDeductions?.byPaymentMethod?.[paymentMethod];

            if (salaryData) {
                setFormData(prev => ({
                    ...prev,
                    amount: salaryData.grossSalary || 0,
                    description: `Salaire ${paymentMethod} - ${formData.period}`,
                }));
            }
        }
    }, [chargesData, isSalaryCategory, expense, formData.category, formData.period]);

    useEffect(() => {
        if (expense) {
            setFormData({
                date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
                description: expense.description,
                category: expense.category,
                type: expense.type,
                amount: expense.amount,
                period: new Date(expense.date).toISOString().slice(0, 7),
            });
        } else {
            setFormData(initialFormState);
        }
    }, [expense, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'amount') {
            const numValue = parseFloat(value);
            setFormData(prev => ({ ...prev, [name]: numValue }));
        } else if (name === 'category' || name === 'period') {
            setFormData(prev => ({ ...prev, [name]: value }));
            // Réinitialiser le montant quand on change de catégorie
            if (name === 'category' && !SALARY_CATEGORIES.includes(value as ExpenseCategory)) {
                setFormData(prev => ({ ...prev, amount: 0 }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { period, ...dataToSave } = formData;
        onSave(dataToSave);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-800">
                            {expense ? t('expenses.modal.editTitle') : t('expenses.modal.addTitle')}
                        </h3>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-700">{t('expenses.table.description')}</label>
                                <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-slate-700">{t('expenses.table.category')}</label>
                                    <select name="category" id="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                        {Object.values(ExpenseCategory).map(cat => <option key={cat} value={cat}>{t(`expenses.categories.${cat}`)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="type" className="block text-sm font-medium text-slate-700">{t('expenses.table.type')}</label>
                                    <select name="type" id="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                        {Object.values(ExpenseType).map(tVal => <option key={tVal} value={tVal}>{t(`expenses.types.${tVal}`)}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Champ période pour les salaires */}
                            {isSalaryCategory && (
                                <div>
                                    <label htmlFor="period" className="block text-sm font-medium text-slate-700">Période</label>
                                    <input type="month" name="period" id="period" value={formData.period} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                                        {t('expenses.table.amount')}
                                        {isSalaryCategory && isLoadingCharges && <span className="text-xs text-blue-600">⏳ Chargement...</span>}
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        name="amount"
                                        id="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        readOnly={isSalaryCategory}
                                        required
                                        className={`mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm ${isSalaryCategory ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                                    />
                                    {isSalaryCategory && formData.amount > 0 && (
                                        <p className="text-xs text-green-600 mt-1">✓ Montant auto-chargé</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium text-slate-700">{t('expenses.table.date')}</label>
                                    <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                        <button type="submit" disabled={isSalaryCategory && formData.amount === 0} className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('common.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseFormModal;