import React, { useState, useMemo } from 'react';
import { PurchaseOrder } from '../../types';
import { useI18n } from '../../i18n';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    purchaseOrder: PurchaseOrder;
    onRecordPayment: (poId: string, paymentAmount: number) => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, purchaseOrder, onRecordPayment }) => {
    const { t, formatCurrency } = useI18n();
    const [amount, setAmount] = useState(0);
    
    const remainingBalance = useMemo(() => {
        return purchaseOrder.totalAmount - purchaseOrder.amountPaid;
    }, [purchaseOrder]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        const newAmount = isNaN(value) ? 0 : Math.max(0, Math.min(value, remainingBalance));
        setAmount(newAmount);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0) return;
        onRecordPayment(purchaseOrder.id, amount);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-bold text-slate-900">{t('purchasing.paymentModal.title')}</h3>
                        <p className="text-sm text-slate-500">{t('purchasing.poNumber')}: {purchaseOrder.id}</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="p-4 bg-slate-100 rounded-lg text-center">
                            <p className="text-sm text-slate-600">{t('purchasing.paymentModal.totalAmount')}</p>
                            <p className="text-2xl font-bold">{formatCurrency(purchaseOrder.totalAmount)}</p>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-slate-500">{t('purchasing.paymentModal.amountPaid')}</span>
                            <span className="font-semibold text-green-600">{formatCurrency(purchaseOrder.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                            <span className="text-slate-600">{t('purchasing.paymentModal.remainingBalance')}</span>
                            <span className="text-red-600">{formatCurrency(remainingBalance)}</span>
                        </div>
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-slate-700">{t('purchasing.paymentModal.amountToPay')}</label>
                            <input 
                                type="number" 
                                id="amount" 
                                name="amount"
                                value={amount}
                                onChange={handleAmountChange}
                                max={remainingBalance}
                                min="0"
                                required 
                                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" 
                            />
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

export default RecordPaymentModal;