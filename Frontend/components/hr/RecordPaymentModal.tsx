import React, { useState } from 'react';
import { PayrollRecord } from '../../types';
import { useI18n } from '../../i18n';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (recordId: string, paymentDate: string) => void;
    record: PayrollRecord;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, onConfirm, record }) => {
    const { t, formatCurrency } = useI18n();
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    const handleConfirm = () => {
        onConfirm(record.id, paymentDate);
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-md" 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-slate-900">{t('hr.payroll.recordPaymentTitle')}</h3>
                    <p className="text-slate-600">{t('hr.payroll.recordPaymentSubtitle', { employeeName: record.employeeName, amount: formatCurrency(record.netSalary) })}</p>
                </div>

                <div className="p-6">
                    <label htmlFor="paymentDate" className="block text-sm font-medium text-slate-700">{t('hr.payroll.paymentDate')}</label>
                    <input 
                        type="date" 
                        id="paymentDate" 
                        value={paymentDate} 
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                    />
                </div>
                
                <div className="px-6 py-4 bg-slate-50 border-t flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                    <button onClick={handleConfirm} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors">{t('common.confirm')}</button>
                </div>
            </div>
        </div>
    );
};

export default RecordPaymentModal;