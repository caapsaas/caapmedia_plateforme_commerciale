import React, { useState, useEffect, useMemo } from 'react';
import { Contact, CustomerPaymentMethod } from '../../types';
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

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmOrder: (customerInfo: { name: string; email: string; address: string; }, paymentMethod: CustomerPaymentMethod) => void;
    cartItems: CartItem[];
    customer: Contact | null;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onConfirmOrder, cartItems, customer }) => {
    const { t, formatCurrency } = useI18n();
    const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', address: '' });
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<CustomerPaymentMethod | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (customer) {
            setCustomerInfo({
                name: customer.contactName,
                email: customer.email,
                address: customer.address || '',
            });
        }
        // Reset state on open
        if (isOpen) {
            setIsProcessing(false);
            setIsSuccess(false);
            setError(null);
        }
    }, [customer, isOpen]);

    const total = useMemo(() =>
        cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
        [cartItems]
    );

    const paymentOptions: { id: CustomerPaymentMethod; label: string; icon: React.ReactNode }[] = [
        { id: CustomerPaymentMethod.CARD, label: t('payment.CARD'), icon: <div className="flex items-center gap-2"><IconVisa className="h-4" /><IconMastercard className="h-4" /></div> },
        { id: CustomerPaymentMethod.ORANGE_MONEY, label: t('payment.ORANGE_MONEY'), icon: <IconOrangeMoney className="h-5" /> },
        { id: CustomerPaymentMethod.WAVE, label: t('payment.WAVE'), icon: <IconWave className="h-6" /> },
        { id: CustomerPaymentMethod.MOBILE_MONEY, label: t('payment.MOBILE_MONEY'), icon: <IconMtnMoney className="h-6" /> },
        { id: CustomerPaymentMethod.PAYCAAP, label: t('payment.PAYCAAP'), icon: <IconPaycaap className="h-5" /> },
        { id: CustomerPaymentMethod.PAY_ON_DELIVERY, label: t('payment.PAY_ON_DELIVERY'), icon: <IconTruckCoins className="h-6 w-6" /> },
        { id: CustomerPaymentMethod.CUSTOMER_CREDIT, label: t('payment.CUSTOMER_CREDIT'), icon: <IconUserClock className="h-6 w-6" /> },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPaymentMethod) return;

        setIsProcessing(true);
        setError(null);

        // Simulation du traitement du paiement
        setTimeout(() => {
            // Pour le moment, nous supposons que le paiement réussit toujours.
            // On pourrait ajouter une logique pour simuler un échec :
            // const paymentSucceeded = Math.random() > 0.1; // 90% de chance de succès

            // Le paiement est considéré comme réussi, on confirme la commande.
            onConfirmOrder(customerInfo, selectedPaymentMethod);
            setIsSuccess(true);
            setIsProcessing(false);
            setTimeout(() => onClose(), 3000); // Fermer la modale après 3 secondes
        }, 2000); // Délai de 2 secondes pour simuler l'appel API
    };

    console.log(customer, isOpen);

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
                        <IconCheckCircle className="h-16 w-16 mx-auto text-green-500" />
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
                            {error && (
                                <div className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{error}</div>
                            )}
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