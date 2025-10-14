import React, { useState, useEffect } from 'react';
import { Product, Contact } from '../types';
import { useI18n } from '../i18n';
import { CartItem } from '../components/ecommerce/ShoppingCart';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmOrder: (customerInfo: { name: string; email: string; address: string; }) => void;
    cartItems: CartItem[];
    customer: Contact | null;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onConfirmOrder, cartItems, customer }) => {
    const { t, formatCurrency } = useI18n();
    const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', address: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    
    useEffect(() => {
        if(customer) {
            setCustomerInfo({
                name: customer.name,
                email: customer.email,
                address: customer.address,
            });
        }
    }, [customer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCustomerInfo({ ...customerInfo, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            onConfirmOrder(customerInfo);
            setIsSubmitting(false);
            setOrderSuccess(true);
            setTimeout(() => { // Close modal after showing success
                onClose();
                setOrderSuccess(false); // Reset for next time
            }, 3000);
        }, 1500);
    };

    if (!isOpen) return null;

    const total = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">{orderSuccess ? t('ecommerce.orderSuccess') : t('ecommerce.checkoutTitle')}</h2>
                    {!orderSuccess && <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>}
                </div>

                {orderSuccess ? (
                    <div className="p-8 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-slate-600 mt-2">Nous vous contacterons bientôt pour la livraison.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">{t('ecommerce.customerInfo')}</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-slate-700">{t('ecommerce.fullName')}</label>
                                        <input type="text" name="name" id="name" value={customerInfo.name} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">{t('ecommerce.email')}</label>
                                        <input type="email" name="email" id="email" value={customerInfo.email} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="address" className="block text-sm font-medium text-slate-700">{t('ecommerce.deliveryAddress')}</label>
                                        <textarea name="address" id="address" value={customerInfo.address} onChange={handleChange} required rows={3} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 flex justify-end items-center space-x-4 rounded-b-lg">
                            <span className="font-bold text-lg">{t('ecommerce.total')}: {formatCurrency(total)}</span>
                            <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-[#F7941F] text-white font-bold rounded-lg hover:bg-[#dd861c] disabled:bg-slate-400">
                                {isSubmitting ? t('common.loading') : t('ecommerce.confirmOrder')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CheckoutModal;