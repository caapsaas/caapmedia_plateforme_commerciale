import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TreasuryAccount, FinancialTransaction, TransactionType } from '../../types';
import { useI18n } from '../../i18n';
import {getTreasuryAccounts} from '../../services/apiFinance/apiTreasury';
export type TransactionFormData = Omit<FinancialTransaction, 'id' | 'subsidiaryId' | 'financialTransactionType' | 'date'> & { transactionDate: string; description: string; providerName?: string; providerPhone?: string };

interface TransactionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: TransactionFormData, type: TransactionType) => void;
    transactionType: TransactionType;
    subsidiaryId: string;
}

const TransactionFormModal: React.FC<TransactionFormModalProps> = ({ isOpen, onClose, onSave, transactionType, subsidiaryId }) => {
    const { t, formatCurrency } = useI18n();

    const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery<TreasuryAccount[]>({
        queryKey: ['treasuryAccounts', subsidiaryId],
        queryFn: () => getTreasuryAccounts(subsidiaryId),
        enabled: isOpen && !!subsidiaryId,
    });
    

    const initialFormState: TransactionFormData = {
        transactionDate: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        treasuryAccountId: '',
        relatedDocumentId: '',
        providerName: '',
        providerPhone: '',
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormState);
        }
    }, [isOpen]);

    // Met à jour le compte sélectionné si la liste des comptes change (chargement asynchrone) et qu'aucun compte n'est sélectionné
    useEffect(() => {
        if (isOpen && accounts.length > 0 && !formData.treasuryAccountId) {
            setFormData(prev => ({ ...prev, treasuryAccountId: accounts[0].id }));
        }
    }, [accounts, isOpen, formData.treasuryAccountId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let finalValue: any = value;
        
        // Gérer la conversion du montant en nombre
        if (name === 'amount') {
            const numValue = parseFloat(value);
            finalValue = isNaN(numValue) ? 0 : numValue;
        }
        
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Valider que le montant est un nombre positif
        const amount = Number(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            alert('Le montant doit être un nombre positif valide');
            return;
        }
        
        // S'assurer que le montant est bien un nombre
        const finalFormData = {
            ...formData,
            amount: amount
        };
        
        onSave(finalFormData, transactionType);
    };

    if (!isOpen) return null;

    const title = transactionType === 'RECETTE' ? t('treasury.modal.addIncome') : t('treasury.modal.addExpense');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-700">{t('treasury.description')}</label>
                                <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-slate-700">{t('treasury.amount')}</label>
                                    <input 
                                    type="number" 
                                    step="0.01" 
                                    min="0.01" 
                                    name="amount" 
                                    id="amount" 
                                    value={formData.amount !== undefined && formData.amount !== null ? formData.amount : ''} 
                                    onChange={handleChange} 
                                    required 
                                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                                    placeholder="0.00"
                                />
                                </div>
                                <div>
                                    <label htmlFor="transactionDate" className="block text-sm font-medium text-slate-700">{t('treasury.date')}</label>
                                    <input type="date" name="transactionDate" id="transactionDate" value={formData.transactionDate} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="providerName" className="block text-sm font-medium text-slate-700">Nom du prestataire</label>
                                    <input 
                                        type="text" 
                                        name="providerName" 
                                        id="providerName" 
                                        value={formData.providerName || ''} 
                                        onChange={handleChange} 
                                        className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                                        placeholder="Nom du prestataire"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="providerPhone" className="block text-sm font-medium text-slate-700">Téléphone du prestataire</label>
                                    <input 
                                        type="tel" 
                                        name="providerPhone" 
                                        id="providerPhone" 
                                        value={formData.providerPhone || ''} 
                                        onChange={handleChange} 
                                        className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                                        placeholder="Numéro de téléphone"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="treasuryAccountId" className="block text-sm font-medium text-slate-700">{t('treasury.account')}</label>
                                    <select name="treasuryAccountId" id="treasuryAccountId" value={formData.treasuryAccountId} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm " disabled={isLoadingAccounts || accounts.length === 0}>
                                        {isLoadingAccounts ? (
                                            <option>{t('common.loading')}</option>
                                        ) : (
                                            accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.accountName} - {formatCurrency(acc.balance)}
                                                </option>
                                            ))
                                        )}
                                    </select>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f]">{t('common.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionFormModal;
