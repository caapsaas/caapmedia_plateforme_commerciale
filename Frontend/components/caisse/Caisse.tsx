import React, { useState, useMemo } from 'react';
import { Product, Contact, Order, CustomerPaymentMethod, TaxRate, TreasuryAccount, AccountType } from '../../types';
import IconCreditCard from '../icons/IconCreditCard';
import IconMobilePayment from '../icons/IconMobilePayment';
import IconCash from '../icons/IconCash';
import IconPlus from '../icons/IconPlus';
import IconMinus from '../icons/IconMinus';
import IconDelete from '../icons/IconDelete';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import ClientSelectionModal from './ClientSelectionModal';
import IconPaycaap from '../icons/IconPaycaap';
import OrderSelectionModal from './OrderSelectionModal';
import IconSearchDocument from '../icons/IconSearchDocument';
import AddItemMultiStepModal from '../ecommerce/AddItemMultiStepModal';
import {
    getConfiguredEquipments,
    getCommercialParams,
    resolveWorkflow,
    EquipmentWithCost,
    CommercialParams,
    ResolvedWorkflow,
} from '../../services/apiProduction/apiProduction';
import { getFormDefinition } from '../../services/apiE-commerce/apiProductSpecs';
import { FormDefinition } from '../../types';
import { SpecValues } from '../common/FormRenderer';
import { ProductionCostResult } from '../ecommerce/ProductionCostModal';
import { CartItem } from '../ecommerce/ShoppingCart';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServicesCatalog } from '../../services/apiE-commerce/apiProducts';
import { getContacts, createContactByEmployee, ContactCreationData } from '../../services/apiCrm/apicontacts';
import EmptyState from '../ui/EmptyState';
import { getOrders, recordOrderPayment, FindAllOrdersDto } from '../../services/apiE-commerce/apiOrders';
import { createDirectSale, CreateDirectSaleDto } from '../../services/apiE-commerce/apiSales';
import { getTaxes } from '../../services/apiE-commerce/apitaxes';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { getTreasuryAccounts } from '../../services/apiFinance/apiTreasury';
import { getImageUrl } from '../../utils/imageUtils';
import { useAuth } from '../../context/AuthContext';

type CaisseMode = 'new_sale' | 'payment';

const Caisse: React.FC = () => {
    const { subsidiary } = useAuth();
    const { t, formatCurrency } = useI18n();
    const toast = useToast();
    const queryClient = useQueryClient();
    
    // Global state for mode and modals
    const [mode, setMode] = useState<CaisseMode>('new_sale');
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isOrderSelectionModalOpen, setIsOrderSelectionModalOpen] = useState(false);
    // Modale unifiée multi-étapes de commande (Calculateur coût prod + Specs)
    const [addItemModalState, setAddItemModalState] = useState<{
        product: Product;
        quantity: number;
        resolvedWorkflow: ResolvedWorkflow | null;
        schema: FormDefinition | null;
    } | null>(null);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // State for 'new_sale' mode
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [applyTax, setApplyTax] = useState(true);

    // State for 'payment' mode
    const [loadedOrder, setLoadedOrder] = useState<Order | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');

    // State for UI feedback
    const [operationSuccess, setOperationSuccess] = useState(false);

    // --- TanStack Query Data Fetching & Mutations ---
    const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
        queryKey: ['services-catalog'],
        queryFn: () => getServicesCatalog(),
        enabled: !!subsidiary,
    });

    const { data: contacts = [], isLoading: isLoadingContacts } = useQuery<Contact[]>({
        queryKey: ['contacts', subsidiary?.id],
        queryFn: getContacts,
        enabled: !!subsidiary,
    });

    const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
        queryKey: ['orders', subsidiary?.id, { period: 'all_time' } as FindAllOrdersDto],
        queryFn: () => getOrders({ period: 'all_time' }),
        enabled: !!subsidiary,
    });

    const { data: taxRates = [] } = useQuery<TaxRate[]>({
        queryKey: ['taxes'],
        queryFn: getTaxes,
    });

    const { data: configuredEquipments = [] } = useQuery<EquipmentWithCost[]>({
        queryKey: ['equipment-configured'],
        queryFn: () => getConfiguredEquipments(),
    });

    const { data: commercialParams = null } = useQuery<CommercialParams | null>({
        queryKey: ['commercial-params'],
        queryFn: getCommercialParams,
        retry: false,
    });

    const { mutate: recordPaymentMutate, isPending: isRecordingPayment } = useMutation({
        mutationFn: (data: { orderId: string; amount: number; paymentMethod: CustomerPaymentMethod }) => recordOrderPayment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            setOperationSuccess(true);
            setTimeout(() => handleStartNewSale(), 3000);
        }
    });
    
    const { mutate: createDirectSaleMutate, isPending: isCheckingOut } = useMutation({
        mutationFn: (data: CreateDirectSaleDto) => createDirectSale(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            setOperationSuccess(true);
            setCart([]);
            setSelectedPaymentMethod(null);
            setSelectedContact(null);
            setTimeout(() => setOperationSuccess(false), 3000);
        }
    });

    const { mutate: createContactMutate } = useMutation({
        mutationFn: (data: ContactCreationData) => createContactByEmployee(data),
        onSuccess: (newContact) => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            handleClientSelected(newContact);
        },
        onError: (error: any) => {
            const existingContact = error?.response?.data?.existingContact;
            if (existingContact) {
                toast.success(
                    'Client déjà existant',
                    `${existingContact.contactName} existe déjà (${existingContact.subsidiary?.subsidiaryName}) — rattaché à cette vente.`,
                );
                handleClientSelected(existingContact as Contact);
            } else {
                toast.error('Erreur', 'Une erreur est survenue lors de la création du client.');
            }
        },
    });

    // Memoized data
    const filteredProducts = useMemo(() => products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())), [products, searchTerm]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<CustomerPaymentMethod | null>(null);
    // Paiements bancaires : compte + référence de transaction
    const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');
    const [transactionReference, setTransactionReference] = useState<string>('');

    // Moyens de paiement bancaires nécessitant compte + référence + validation SUPER_ADMIN
    const BANKING_METHODS: CustomerPaymentMethod[] = [
        CustomerPaymentMethod.BANK_TRANSFER,
        CustomerPaymentMethod.CARD,
        CustomerPaymentMethod.CHECK,
    ];
    const isBankingPayment = selectedPaymentMethod ? BANKING_METHODS.includes(selectedPaymentMethod) : false;

    // Comptes bancaires de la filiale (BANQUE uniquement)
    const { data: bankAccounts = [] } = useQuery<TreasuryAccount[]>({
        queryKey: ['treasury-accounts', subsidiary?.id],
        queryFn: () => getTreasuryAccounts(subsidiary?.id),
        enabled: !!subsidiary,
    });

    // Calculs financiers respectant les principes métiers Ventes (Sous-total, TVA, Total TTC)
    const subtotal = useMemo(() =>
        cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity - (item.discount || 0) + (item.assemblyPrice || 0)), 0),
        [cart]
    );

    const defaultTaxRate = useMemo(() => taxRates.find(t => t.isDefault) || { rate: 0, id: '' }, [taxRates]);
    const taxAmount = useMemo(() => applyTax ? subtotal * defaultTaxRate.rate : 0, [subtotal, defaultTaxRate, applyTax]);
    const totalAmount = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

    // --- NEW SALE MODE LOGIC ---
    // Clic sur un service -> résolution workflow + schema spec et ouverture de la modale unifiée de commande
    const handleAddToCart = async (product: Product, qtyOverride?: number) => {
        const qty = qtyOverride || quantities[product.id] || 1;
        if (qty <= 0) return;

        const [resolved, schema] = await Promise.all([
            queryClient.fetchQuery({
                queryKey: ['workflow-resolve', product.id],
                queryFn: () => resolveWorkflow(product.id),
                staleTime: 60_000,
            }),
            queryClient.fetchQuery({
                queryKey: ['form-definition', product.id],
                queryFn: () => getFormDefinition(product.id),
            }).catch(() => null),
        ]);

        setAddItemModalState({ product, quantity: qty, resolvedWorkflow: resolved, schema });
    };

    const handleAddItemConfirm = (result: ProductionCostResult, specValues?: SpecValues) => {
        if (!addItemModalState) return;
        const { product, quantity } = addItemModalState;
        const unitPrice = quantity > 0 ? result.summary.finalPrice / quantity : result.summary.finalPrice;

        setCart(currentCart => [
            ...currentCart,
            {
                id: `${product.id}-${Date.now()}`,
                product,
                quantity,
                unitPrice,
                totalPrice: result.summary.finalPrice,
                specValues,
                options: {},
            }
        ]);
        setAddItemModalState(null);
        setQuantities(prev => ({ ...prev, [product.id]: 0 }));
    };

    const updateQuantity = (cartItemId: string, newQuantity: number) => {
        setCart(currentCart => {
            const itemToUpdate = currentCart.find(item => item.id === cartItemId);
            if (!itemToUpdate) return currentCart;

            const clampedQuantity = Math.max(0, newQuantity);

            if (clampedQuantity <= 0) {
                return currentCart.filter(item => item.id !== cartItemId);
            }

            return currentCart.map(item => {
                if (item.id !== cartItemId) return item;
                const discount = item.discount || 0;
                const assembly = item.assemblyPrice || 0;
                const total = (item.unitPrice * clampedQuantity) - discount + assembly;
                return { ...item, quantity: clampedQuantity, totalPrice: total };
            });
        });
    };

    const updateCartDiscount = (itemId: string, newDiscount: number) => {
        const discountVal = isNaN(newDiscount) ? 0 : Math.max(0, newDiscount);
        setCart(currentCart => currentCart.map(item => {
            if (item.id !== itemId) return item;
            const lineDiscount = discountVal;
            const assembly = item.assemblyPrice || 0;
            const total = (item.unitPrice * item.quantity) - lineDiscount + assembly;
            return { ...item, discount: lineDiscount, totalPrice: total };
        }));
    };

    const updateCartAssemblyPrice = (itemId: string, newAssemblyPrice: number) => {
        const assemblyVal = isNaN(newAssemblyPrice) ? 0 : Math.max(0, newAssemblyPrice);
        setCart(currentCart => currentCart.map(item => {
            if (item.id !== itemId) return item;
            const lineDiscount = item.discount || 0;
            const assembly = assemblyVal;
            const total = (item.unitPrice * item.quantity) - lineDiscount + assembly;
            return { ...item, assemblyPrice: assembly, totalPrice: total };
        }));
    };
    
    const handleCheckout = () => {
        if (isCheckingOut || cart.length === 0 || !selectedPaymentMethod || !selectedContact) return;
        if (isBankingPayment && !selectedBankAccountId) {
            toast.error('Compte bancaire requis', 'Veuillez sélectionner un compte bancaire pour ce mode de paiement.');
            return;
        }
        
        const saleData: CreateDirectSaleDto = {
            items: cart.map(item => ({
                productId: item.product.id,
                productName: item.product.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount || 0,
                assemblyPrice: item.assemblyPrice || 0,
                specValues: item.specValues,
            })),
            customerId: selectedContact.id,
            paymentMethod: selectedPaymentMethod,
            applyTax,
            bankAccountId: isBankingPayment ? selectedBankAccountId : undefined,
            transactionReference: isBankingPayment && transactionReference ? transactionReference : undefined,
        };

        createDirectSaleMutate(saleData);
    };

    // --- PAYMENT MODE LOGIC ---
    const handleOrderSelected = (order: Order) => {
        setLoadedOrder(order);
        setMode('payment');
        const remaining = order.totalAmount - order.amountPaid;
        setPaymentAmount(String(remaining));
        setIsOrderSelectionModalOpen(false);
        // Reset new sale states
        setCart([]);
        setSearchTerm('');
        setSelectedContact(null);
    };

    const handleRecordPayment = () => {
        if (isRecordingPayment || !loadedOrder || !paymentAmount || !selectedPaymentMethod) return;
        const amount = parseFloat(paymentAmount);
        const remainingBalance = loadedOrder.totalAmount - loadedOrder.amountPaid;
        if (amount > 0 && amount <= remainingBalance) {
            recordPaymentMutate({ orderId: loadedOrder.id, amount, paymentMethod: selectedPaymentMethod });
        }
    };
    
    // --- MODE SWITCHING & GENERAL LOGIC ---
    const handleStartNewSale = () => {
        setMode('new_sale');
        setLoadedOrder(null);
        setPaymentAmount('');
        setOperationSuccess(false);
        setSelectedPaymentMethod(null);
        setSelectedBankAccountId('');
        setTransactionReference('');
    };
    
    const handleClientSelected = (contact: Contact) => {
        setSelectedContact(contact);
        setIsClientModalOpen(false);
    };

    const handleCreateClient = (clientData: ContactCreationData) => {
        createContactMutate(clientData);
        // The onSuccess of the mutation will select the client and close the modal
    };

    // Moyens de paiement disponibles à la caisse (sans Wave et Orange Money)
    const paymentMethods = [
        { id: CustomerPaymentMethod.CASH,         label: 'Espèces',      icon: <IconCash className="h-6 w-6" /> },
        { id: CustomerPaymentMethod.MOBILE_MONEY, label: 'Mobile Money', icon: <IconMobilePayment className="h-6 w-6" /> },
        { id: CustomerPaymentMethod.PAYCAAP,      label: 'PayCAAP',      icon: <IconPaycaap className="h-5" /> },
        { id: CustomerPaymentMethod.CARD,         label: 'Carte',        icon: <IconCreditCard className="h-6 w-6" /> },
        { id: CustomerPaymentMethod.BANK_TRANSFER,label: 'Virement',     icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg> },
        { id: CustomerPaymentMethod.CHECK,        label: 'Chèque',       icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> },
    ];
    
    const renderSuccessMessage = () => (
        <div className="h-full flex flex-col items-center justify-center text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="font-bold mt-2">{mode === 'new_sale' ? t('cashRegister.paymentSuccess') : t('cashRegister.loadedOrder.paymentSuccess')}</p>
            {mode === 'payment' && (
                <button onClick={handleStartNewSale} className="mt-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
                    {t('cashRegister.loadedOrder.newSale')}
                </button>
            )}
        </div>
    );
    
     const formatOptions = (options: Partial<ProductOptions>) => {
        return Object.entries(options)
            .filter(([, value]) => value)
            .map(([key, value]) => `${t(`calculator.${key}`)}: ${value}`)
            .join(', ');
    };

    if (!subsidiary) {
        return <div>{t('login.selectSubsidiary')}</div>;
    }

    if (isLoadingProducts || isLoadingContacts || isLoadingOrders) {
        return (
            <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-slate-800">{t('cashRegister.title')}</h2>
                </div>
                <div className="flex-grow grid grid-cols-12 gap-6 h-full">
                    <div className="col-span-12 lg:col-span-7 bg-white p-6 rounded-xl shadow-md">
                        <div className="h-9 w-full bg-slate-100 rounded-full animate-pulse mb-4" />
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="border rounded-lg p-2">
                                    <div className="w-full h-20 mb-2 rounded bg-slate-100 animate-pulse" />
                                    <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
                                    <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse mt-1" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="col-span-12 lg:col-span-5 bg-white p-6 rounded-xl shadow-md">
                        <div className="h-6 w-40 bg-slate-100 rounded animate-pulse mb-4" />
                        <div className="h-9 w-full bg-slate-100 rounded-lg animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col overflow-hidden space-y-4">
            <div className="flex justify-between items-center flex-shrink-0">
                <h2 className="text-2xl font-bold text-slate-800">{t('cashRegister.title')}</h2>
                <button onClick={() => setIsOrderSelectionModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white text-sm font-semibold rounded-md hover:bg-slate-700 transition-colors">
                    <IconSearchDocument className="h-5 w-5" />
                    <span>{t('cashRegister.findOrder')}</span>
                </button>
            </div>
            <div className="flex-grow grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
                {/* Product/Order Details Panel (Left) */}
                <div className="col-span-12 lg:col-span-7 bg-white p-5 rounded-xl shadow-md flex flex-col min-h-0 overflow-hidden">
                    {mode === 'new_sale' ? (
                        <>
                            <div className="relative mb-3 flex-shrink-0">
                                <input type="search" placeholder={t('cashRegister.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-full bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#c6e911]" />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg className="h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                            </div>
                            {/* Zone avec scroll interne propre pour la grille de services */}
                            <div className="flex-grow overflow-y-auto pr-1 min-h-0 space-y-3">
                                {filteredProducts.length === 0 ? (
                                    <EmptyState icon="search" title={t('cashRegister.noProducts')} />
                                ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {filteredProducts.map(p => (
                                        <div
                                            key={p.id}
                                            className="border border-slate-200 rounded-xl p-3 hover:border-[#c6e911] hover:shadow-md transition-all flex flex-col justify-between bg-white"
                                        >
                                            <div className="flex items-start gap-2.5 mb-2">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                                    <LazyLoadImage
                                                        src={p.productImages && p.productImages.length > 0 ? getImageUrl(p.productImages[0].imageUrl) : 'https://via.placeholder.com/150'}
                                                        alt={p.name}
                                                        effect="blur"
                                                        wrapperClassName="w-full h-full"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <h3 className="font-semibold text-xs text-slate-800 line-clamp-2">{p.name}</h3>
                                                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{p.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                                                <div className="flex items-center space-x-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuantities(prev => ({ ...prev, [p.id]: Math.max(1, (prev[p.id] || 1) - 1) }))}
                                                        className="w-5 h-5 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs"
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={quantities[p.id] || 1}
                                                        onChange={(e) => setQuantities(prev => ({ ...prev, [p.id]: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                                                        className="w-9 text-center text-xs py-0.5 border border-slate-200 rounded font-semibold text-slate-700"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuantities(prev => ({ ...prev, [p.id]: (prev[p.id] || 1) + 1 }))}
                                                        className="w-5 h-5 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddToCart(p)}
                                                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#c6e911] text-slate-800 hover:bg-[#adc40f] transition-colors flex items-center gap-1"
                                                >
                                                    <IconPlus className="h-3 w-3" />
                                                    <span>Ajouter</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                )}
                            </div>
                        </>
                    ) : loadedOrder && (
                        <div className="flex-grow overflow-y-auto pr-2 min-h-0">
                            <h3 className="text-xl font-bold text-slate-800 border-b pb-2 mb-4">{t('cashRegister.loadedOrder.title')}</h3>
                            <div className="space-y-2 mb-4 text-sm">
                                <p><strong>{t('cashRegister.loadedOrder.orderId')}:</strong> {loadedOrder.id}</p>
                                <p><strong>{t('cashRegister.clientSection.title')}:</strong> {loadedOrder.customerName}</p>
                            </div>
                             <ul className="divide-y divide-slate-200">
                                {loadedOrder.orderItems.map((item, index) => <li key={index} className="py-2 flex justify-between items-center"><p>{item.product.name} (x{item.quantity})</p><p className="font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</p></li>)}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Cart and Payment Panel (Right) */}
                <div className="col-span-12 lg:col-span-5 bg-white p-5 rounded-xl shadow-md flex flex-col min-h-0 overflow-hidden">
                    {operationSuccess ? renderSuccessMessage() : (
                    <>
                        {mode === 'new_sale' ? (
                            <div className="border-b pb-2 mb-3 flex-shrink-0">
                                <h3 className="text-base font-bold text-slate-800">{t('cashRegister.clientSection.title')}</h3>
                                {selectedContact ? <div className="flex items-center justify-between mt-1"><div><p className="font-semibold text-sm">{selectedContact.contactName}</p><p className="text-xs text-slate-500">{selectedContact.company}</p></div><button onClick={() => setIsClientModalOpen(true)} className="text-xs text-[#adc40f] hover:underline font-semibold">{t('cashRegister.clientSection.change')}</button></div> : <button onClick={() => setIsClientModalOpen(true)} className="mt-1 w-full text-center px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors">{t('cashRegister.clientSection.selectAdd')}</button>}
                            </div>
                        ) : null}
                        <h3 className="text-base font-bold text-slate-800 border-b pb-2 mb-2 flex-shrink-0">{t('cashRegister.cartTitle')}</h3>
                        <div className="flex-grow overflow-y-auto pr-1 min-h-0">
                            {(mode === 'new_sale' && cart.length === 0) ? <p className="h-full flex items-center justify-center text-slate-400 text-sm">{t('cashRegister.cartEmpty')}</p> : (
                                <ul className="divide-y divide-slate-100">
                                    {mode === 'new_sale' ? cart.map(item => (
                                        <li key={item.id} className="py-2.5 space-y-1.5 border-b border-slate-100 last:border-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-xs text-slate-800 leading-tight">{item.product.name}</p>
                                                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                                                        <span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-1.5 shrink-0">
                                                    <span className="font-bold text-xs text-slate-800">{formatCurrency(item.totalPrice)}</span>
                                                    <button onClick={() => updateQuantity(item.id, 0)} className="p-1 rounded-full hover:bg-red-100 text-red-500">
                                                        <IconDelete className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] pt-1">
                                                <div className="flex items-center space-x-1.5">
                                                    <span className="text-slate-500">{t('newOrder.discount')}:</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.discount || ''}
                                                        onChange={(e) => updateCartDiscount(item.id, parseFloat(e.target.value))}
                                                        className="w-16 p-0.5 text-center text-xs border border-slate-200 rounded text-slate-700 bg-slate-50 focus:bg-white"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="flex items-center space-x-1.5">
                                                    <span className="text-slate-500">{t('newOrder.assemblyPrice')}:</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.assemblyPrice || ''}
                                                        onChange={(e) => updateCartAssemblyPrice(item.id, parseFloat(e.target.value))}
                                                        className="w-16 p-0.5 text-center text-xs border border-slate-200 rounded text-slate-700 bg-slate-50 focus:bg-white"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                        </li>
                                    )) : null}
                                </ul>
                            )}
                        </div>
                        <div className="border-t pt-3 mt-3 space-y-3 flex-shrink-0">
                            {mode === 'new_sale' ? (
                                <div className="space-y-1.5 text-xs border-b pb-2">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Sous-total HT</span>
                                        <span className="font-semibold">{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center space-x-2 text-slate-600 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={applyTax}
                                                onChange={e => setApplyTax(e.target.checked)}
                                                className="rounded text-[#c6e911] focus:ring-[#c6e911] h-3.5 w-3.5"
                                            />
                                            <span>Appliquer la TVA ({defaultTaxRate.rate ? `${(defaultTaxRate.rate * 100).toFixed(0)}%` : 'TVA'})</span>
                                        </label>
                                        <span className="text-slate-600 font-semibold">{formatCurrency(taxAmount)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-base text-slate-800 pt-1 border-t border-slate-100">
                                        <span>Total TTC</span>
                                        <span className="text-slate-900">{formatCurrency(totalAmount)}</span>
                                    </div>
                                </div>
                            ) : loadedOrder && (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span>{t('cashRegister.loadedOrder.total')}</span><span className="font-semibold">{formatCurrency(loadedOrder.totalAmount)}</span></div>
                                    <div className="flex justify-between"><span>{t('cashRegister.loadedOrder.paid')}</span><span className="font-semibold text-green-600">{formatCurrency(loadedOrder.amountPaid)}</span></div>
                                    <div className="flex justify-between font-bold"><span>{t('cashRegister.loadedOrder.remaining')}</span><span className="text-red-600">{formatCurrency(loadedOrder.totalAmount - loadedOrder.amountPaid)}</span></div>
                                    <div className="pt-2"><label htmlFor="paymentAmount" className="block text-sm font-medium text-slate-700">{t('cashRegister.loadedOrder.amountToPay')}</label><input type="number" id="paymentAmount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} max={loadedOrder.totalAmount - loadedOrder.amountPaid} min="0" className="mt-1 block w-full border-slate-300 rounded-md shadow-sm" /></div>
                                </div>
                            )}
                            <div>
                                <p className="font-semibold text-xs mb-1.5">{t('cashRegister.paymentMethod')}</p>
                                <div className="grid grid-cols-3 gap-1.5">{paymentMethods.map(method => <button key={method.id} onClick={() => { setSelectedPaymentMethod(method.id as CustomerPaymentMethod); setSelectedBankAccountId(''); setTransactionReference(''); }} className={`flex flex-col items-center justify-center text-center space-y-1 p-1.5 rounded-lg border transition-all h-16 ${selectedPaymentMethod === method.id ? 'border-[#c6e911] bg-[#c6e911]/10 font-bold' : 'border-slate-200 bg-white hover:border-slate-300'}`}>{method.icon}<span className="text-[11px] font-medium leading-tight">{method.label}</span></button>)}</div>
                                {isBankingPayment && (
                                    <div className="mt-2.5 space-y-2">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Compte bancaire <span className="text-red-500">*</span></label>
                                            <select
                                                value={selectedBankAccountId}
                                                onChange={e => setSelectedBankAccountId(e.target.value)}
                                                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#c6e911] focus:border-transparent"
                                            >
                                                <option value="">-- Sélectionner un compte --</option>
                                                {bankAccounts
                                                    .filter(acc => acc.accountType === AccountType.BANQUE)
                                                    .map(acc => (
                                                        <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                                                    ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Référence de transaction</label>
                                            <input
                                                type="text"
                                                placeholder="N° chèque, ref virement, etc."
                                                value={transactionReference}
                                                onChange={e => setTransactionReference(e.target.value)}
                                                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#c6e911] focus:border-transparent"
                                            />
                                        </div>
                                        <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                            ⚠️ Cette transaction sera créée en attente de validation par le Super Admin.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <button onClick={mode === 'new_sale' ? handleCheckout : handleRecordPayment} disabled={(mode === 'new_sale' && (cart.length === 0 || !selectedPaymentMethod || !selectedContact || (isBankingPayment && !selectedBankAccountId))) || (mode === 'payment' && (!paymentAmount || parseFloat(paymentAmount) <= 0 || !selectedPaymentMethod))} className="w-full text-center px-4 py-2.5 bg-[#c6e911] text-slate-800 font-bold text-sm rounded-lg hover:bg-[#adc40f] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">{t('cashRegister.checkoutButton')}</button>
                        </div>
                    </>
                    )}
                </div>
            </div>
            {isClientModalOpen && <ClientSelectionModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} clients={contacts} onClientSelect={handleClientSelected} onClientCreate={handleCreateClient} />}
            {isOrderSelectionModalOpen && <OrderSelectionModal isOpen={isOrderSelectionModalOpen} onClose={() => setIsOrderSelectionModalOpen(false)} orders={orders} contacts={contacts} onOrderSelect={handleOrderSelected} />}
            {addItemModalState && (
                <AddItemMultiStepModal
                    productName={addItemModalState.product.name}
                    quantity={addItemModalState.quantity}
                    configuredEquipments={configuredEquipments}
                    commercialParams={commercialParams}
                    resolvedWorkflow={addItemModalState.resolvedWorkflow}
                    schema={addItemModalState.schema}
                    onConfirm={handleAddItemConfirm}
                    onClose={() => setAddItemModalState(null)}
                />
            )}
        </div>
    );
};

export default Caisse;