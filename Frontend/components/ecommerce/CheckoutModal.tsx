import React, { useState, useEffect, useMemo } from 'react';
import { Contact } from '../../types';
import { useI18n } from '../../i18n';
import { CartItem } from './ShoppingCart';
import IconVisa from '../icons/IconVisa';
import IconMastercard from '../icons/IconMastercard';
import IconOrangeMoney from '../icons/IconOrangeMoney';
import IconWave from '../icons/IconWave';
import IconMtnMoney from '../icons/IconMtnMoney';
import IconPaycaap from '../icons/IconPaycaap';
import IconCheckCircle from '../icons/IconCheckCircle';
import IconTruckCoins from '../icons/IconTruckCoins';
import IconUserClock from '../icons/IconUserClock';

type PaymentMethod = 'Card' | 'OrangeMoney' | 'Wave' | 'MtnMoney' | 'Paycaap' | 'delivery' | 'credit';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmOrder: (customerInfo: { name: string; email: string; address: string; }, paymentMethod: string) => void;
    cartItems: CartItem[];
    customer: Contact | null;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onConfirmOrder, cartItems, customer }) => {
    const { t, formatCurrency } = useI18n();
    const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', address: '' });
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (customer) {
            setCustomerInfo({
                name: customer.name,
                email: customer.email,
                address: customer.address || '',
            });
        }
    }, [customer]);

    const total = useMemo(() =>
        cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
        [cartItems]
    );

    const paymentOptions: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
        { id: 'Card', label: t('payment.creditCard'), icon: <div className="flex items-center gap-2"><IconVisa className="h-4" /><IconMastercard className="h-4" /></div> },
        { id: 'OrangeMoney', label: t('payment.orangeMoney'), icon: <IconOrangeMoney className="h-5" /> },
        { id: 'Wave', label: t('payment.wave'), icon: <IconWave className="h-6" /> },
        { id: 'MtnMoney', label: t('payment.mtnMoney'), icon: <IconMtnMoney className="h-6" /> },
        { id: 'Paycaap', label: t('payment.paycaap'), icon: <IconPaycaap className="h-5" /> },
        { id: 'delivery', label: t('payment.payOnDelivery'), icon: <IconTruckCoins className="h-6 w-6" /> },
        { id: 'credit', label: t('payment.customerCredit'), icon: <IconUserClock className="h-6 w-6" /> },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPaymentMethod) return;

        setIsProcessing(true);
        setTimeout(() => {
            onConfirmOrder(customerInfo, selectedPaymentMethod);
            setIsProcessing(false);
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false); // Reset for next use
            }, 3000);
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">{isSuccess ? t('payment.success') : t('ecommerce.checkoutTitle')}</h2>
                    {!isSuccess && <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>}
                </div>

                {isSuccess ? (
                    <div className="p-8 text-center">
                        <IconCheckCircle className="h-16 w-16 mx-auto text-green-500"/>
                        <p className="text-slate-600 mt-2">{t('ecommerce.orderSuccess')}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">{t('ecommerce.customerInfo')}</h3>
                                <div className="space-y-3">
                                    <p><strong className="font-medium">{t('ecommerce.fullName')}:</strong> {customerInfo.name}</p>
                                    <p><strong className="font-medium">{t('ecommerce.email')}:</strong> {customerInfo.email}</p>
                                    <p><strong className="font-medium">{t('ecommerce.deliveryAddress')}:</strong> {customerInfo.address}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">{t('payment.chooseMethod')}</h3>
                                <div className="space-y-2">
                                    {paymentOptions.map(option => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setSelectedPaymentMethod(option.id)}
                                            className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${selectedPaymentMethod === option.id ? 'border-[#c6e911] bg-lime-50' : 'border-slate-300 bg-white hover:border-slate-400'}`}
                                        >
                                            <span className="font-semibold">{option.label}</span>
                                            <div className="h-6 flex items-center">{option.icon}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 flex justify-end items-center space-x-4 rounded-b-lg">
                            <span className="font-bold text-lg">{t('ecommerce.total')}: {formatCurrency(total)}</span>
                            <button 
                                type="submit" 
                                disabled={isProcessing || !selectedPaymentMethod}
                                className="px-6 py-3 bg-[#c6e911] text-slate-800 font-bold rounded-lg hover:bg-[#adc40f] disabled:bg-slate-400 flex items-center justify-center min-w-[120px]"
                            >
                                {isProcessing ? (
                                    <svg className="animate-spin h-5 w-5 text-slate-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : t('payment.pay')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CheckoutModal;