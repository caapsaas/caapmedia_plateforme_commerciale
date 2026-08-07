import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Order, CustomerPaymentMethod, TreasuryAccount, AccountType } from '../../types';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { getTreasuryAccounts } from '../../services/apiFinance/apiTreasury';
import IconCreditCard from '../icons/IconCreditCard';
import IconMobilePayment from '../icons/IconMobilePayment';
import IconCash from '../icons/IconCash';
import IconPaycaap from '../icons/IconPaycaap';
import IconTruckCoins from '../icons/IconTruckCoins';
import IconUserClock from '../icons/IconUserClock';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    onRecordPayment: (
        orderId: string,
        amount: number,
        paymentMethod: CustomerPaymentMethod,
        bankAccountId?: string,
        transactionReference?: string,
    ) => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, order, onRecordPayment }) => {
    const { t, formatCurrency } = useI18n();
    const { subsidiary } = useAuth();
    
    const remainingBalance = useMemo(() => {
        return order.totalAmount - order.amountPaid;
    }, [order]);
    
    const [amount, setAmount] = useState(remainingBalance);
    const [paymentMethod, setPaymentMethod] = useState<CustomerPaymentMethod | null>(null);
    const [bankAccountId, setBankAccountId] = useState<string>('');
    const [transactionReference, setTransactionReference] = useState<string>('');

    // Moyens de paiement bancaires nécessitant compte + référence + validation SUPER_ADMIN
    const BANKING_METHODS: CustomerPaymentMethod[] = [
        CustomerPaymentMethod.BANK_TRANSFER,
        CustomerPaymentMethod.CARD,
        CustomerPaymentMethod.CHECK,
    ];
    const isBankingPayment = paymentMethod ? BANKING_METHODS.includes(paymentMethod) : false;

    // Comptes bancaires de la filiale (BANQUE uniquement)
    const { data: bankAccounts = [] } = useQuery<TreasuryAccount[]>({
        queryKey: ['treasury-accounts', subsidiary?.id],
        queryFn: () => getTreasuryAccounts(subsidiary?.id),
        enabled: isOpen && !!subsidiary,
    });

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        const newAmount = isNaN(value) ? 0 : Math.max(0, Math.min(value, remainingBalance));
        setAmount(newAmount);
    };
    
    const paymentOptions: { id: CustomerPaymentMethod; label: string; icon: React.ReactNode }[] = [
        { id: CustomerPaymentMethod.CASH, label: 'Espèces', icon: <IconCash className="h-6 w-6" /> },
        { id: CustomerPaymentMethod.MOBILE_MONEY, label: 'Mobile Money', icon: <IconMobilePayment className="h-6 w-6" /> },
        { id: CustomerPaymentMethod.PAYCAAP, label: 'PayCAAP', icon: <IconPaycaap className="h-5" /> },
        { id: CustomerPaymentMethod.CARD, label: 'Carte', icon: <IconCreditCard className="h-6 w-6" /> },
        { id: CustomerPaymentMethod.BANK_TRANSFER, label: 'Virement', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg> },
        { id: CustomerPaymentMethod.CHECK, label: 'Chèque', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> },
        { id: CustomerPaymentMethod.PAY_ON_DELIVERY, label: t('payment.PAY_ON_DELIVERY'), icon: <IconTruckCoins className="h-6 w-6" /> },
        { id: CustomerPaymentMethod.CUSTOMER_CREDIT, label: t('payment.CUSTOMER_CREDIT'), icon: <IconUserClock className="h-6 w-6" /> },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0 || !paymentMethod) return;
        if (isBankingPayment && !bankAccountId) return;
        
        onRecordPayment(
            order.id,
            amount,
            paymentMethod,
            isBankingPayment ? bankAccountId : undefined,
            isBankingPayment && transactionReference ? transactionReference : undefined,
        );
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
                    <div className="px-6 py-4 border-b shrink-0">
                        <h3 className="text-lg font-bold text-slate-900">{t('sales.recordPaymentModal.title')}</h3>
                        <p className="text-xs text-slate-500">{t('order.orderId')}: {order.id}</p>
                    </div>
                    <div className="p-6 space-y-4 overflow-y-auto flex-1">
                        <div className="p-3 bg-slate-100 rounded-lg text-center">
                            <p className="text-xs text-slate-600">{t('order.total')}</p>
                            <p className="text-xl font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">{t('order.amountPaid')}</span>
                            <span className="font-semibold text-green-600">{formatCurrency(order.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-600">{t('order.remainingBalance')}</span>
                            <span className="text-red-600">{formatCurrency(remainingBalance)}</span>
                        </div>
                        <div>
                            <label htmlFor="amount" className="block text-xs font-medium text-slate-700">{t('sales.recordPaymentModal.amountToRecord')}</label>
                            <input 
                                type="number" 
                                id="amount" 
                                name="amount"
                                value={amount}
                                onChange={handleAmountChange}
                                max={remainingBalance}
                                min="0"
                                required 
                                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] text-sm" 
                            />
                        </div>
                        <div>
                            <p className="block text-xs font-medium text-slate-700 mb-2">{t('payment.chooseMethod')}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {paymentOptions.map(option => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => {
                                            setPaymentMethod(option.id);
                                            setBankAccountId('');
                                            setTransactionReference('');
                                        }}
                                        className={`flex flex-col items-center justify-center text-center space-y-1 p-2 rounded-lg border-2 transition-all h-16 ${paymentMethod === option.id ? 'border-[#c6e911] bg-[#c6e911]/10 font-bold' : 'border-slate-300 bg-white hover:border-slate-400'}`}
                                    >
                                        {option.icon}<span className="text-[11px] font-medium leading-none">{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Champs spécifiques aux règlements bancaires */}
                        {isBankingPayment && (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Compte bancaire <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={bankAccountId}
                                        onChange={e => setBankAccountId(e.target.value)}
                                        required
                                        className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                                    >
                                        <option value="">-- Sélectionner un compte bancaire --</option>
                                        {bankAccounts
                                            .filter(acc => acc.accountType === AccountType.BANQUE)
                                            .map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Référence de transaction
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="N° chèque, réf virement, etc."
                                        value={transactionReference}
                                        onChange={e => setTransactionReference(e.target.value)}
                                        className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                                    />
                                </div>

                                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1">
                                    ⚠️ Cette transaction financière sera créée avec le statut <strong>EN ATTENTE</strong> de validation par le Super Admin.
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                        <button type="submit" disabled={!paymentMethod || amount <= 0 || (isBankingPayment && !bankAccountId)} className="px-4 py-2 bg-[#c6e911] text-slate-800 font-bold rounded-md hover:bg-[#adc40f] transition-colors disabled:bg-slate-300">{t('common.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordPaymentModal;
