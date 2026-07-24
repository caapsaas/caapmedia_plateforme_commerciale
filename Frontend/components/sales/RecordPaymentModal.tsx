import React, { useState, useMemo } from 'react';
import { Order, CustomerPaymentMethod } from '../../types';
import { useI18n } from '../../i18n';
import IconCreditCard from '../icons/IconCreditCard';
import IconMobilePayment from '../icons/IconMobilePayment';
import IconOrangeMoney from '../icons/IconOrangeMoney';
import IconWave from '../icons/IconWave';
import IconPaycaap from '../icons/IconPaycaap';
import IconTruckCoins from '../icons/IconTruckCoins';
import IconUserClock from '../icons/IconUserClock';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    onRecordPayment: (orderId: string, amount: number, paymentMethod: CustomerPaymentMethod) => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, order, onRecordPayment }) => {
    const { t, formatCurrency } = useI18n();
    
    const remainingBalance = useMemo(() => {
        return order.totalAmount - order.amountPaid;
    }, [order]);
    
    const [amount, setAmount] = useState(remainingBalance);
    const [paymentMethod, setPaymentMethod] = useState<CustomerPaymentMethod | null>(null);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        const newAmount = isNaN(value) ? 0 : Math.max(0, Math.min(value, remainingBalance));
        setAmount(newAmount);
    };
    
    const paymentOptions: { id: CustomerPaymentMethod; label: string; icon: React.ReactNode }[] = [
        { id: CustomerPaymentMethod.CARD, label: t('payment.CARD'), icon: <IconCreditCard className="h-6 w-6" /> },
        { id: CustomerPaymentMethod.ORANGE_MONEY, label: t('payment.ORANGE_MONEY'), icon: <IconOrangeMoney className="h-6 w-6" /> },
        { id: CustomerPaymentMethod.WAVE, label: t('payment.WAVE'), icon: <IconWave className="h-6 w-6" /> },
        { id: CustomerPaymentMethod.MOBILE_MONEY, label: t('payment.MOBILE_MONEY'), icon: <IconMobilePayment className="h-6 w-6" /> },
        { id: CustomerPaymentMethod.PAYCAAP, label: t('payment.PAYCAAP'), icon: <IconPaycaap className="h-5" /> },
        { id: CustomerPaymentMethod.PAY_ON_DELIVERY, label: t('payment.PAY_ON_DELIVERY'), icon: <IconTruckCoins className="h-6 w-6" /> },
        { id: CustomerPaymentMethod.CUSTOMER_CREDIT, label: t('payment.CUSTOMER_CREDIT'), icon: <IconUserClock className="h-6 w-6" /> },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0 || !paymentMethod) return;
        onRecordPayment(order.id, amount, paymentMethod);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-bold text-slate-900">{t('sales.recordPaymentModal.title')}</h3>
                        <p className="text-sm text-slate-500">{t('order.orderId')}: {order.id}</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="p-4 bg-slate-100 rounded-lg text-center">
                            <p className="text-sm text-slate-600">{t('order.total')}</p>
                            <p className="text-2xl font-bold">{formatCurrency(order.totalAmount)}</p>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">{t('order.amountPaid')}</span>
                            <span className="font-semibold text-green-600">{formatCurrency(order.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                            <span className="text-slate-600">{t('order.remainingBalance')}</span>
                            <span className="text-red-600">{formatCurrency(remainingBalance)}</span>
                        </div>
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-slate-700">{t('sales.recordPaymentModal.amountToRecord')}</label>
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
                        <div>
                            <p className="block text-sm font-medium text-slate-700 mb-2">{t('payment.chooseMethod')}</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {paymentOptions.map(option => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setPaymentMethod(option.id)}
                                        className={`flex flex-col items-center justify-center text-center space-y-1 p-2 rounded-lg border-2 transition-all h-20 ${paymentMethod === option.id ? 'border-[#c6e911] bg-[#c6e911]/10' : 'border-slate-300 bg-white hover:border-slate-400'}`}
                                    >
                                        {option.icon}<span className="text-xs font-medium">{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                        <button type="submit" disabled={!paymentMethod || amount <= 0} className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors disabled:bg-slate-300">{t('common.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordPaymentModal;
