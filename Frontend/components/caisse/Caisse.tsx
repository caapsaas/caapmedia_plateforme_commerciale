import React, { useState, useMemo } from 'react';
import { Product, Contact, Order, ProductOptions, CustomerPaymentMethod } from '../../types';
import IconWave from '../icons/IconWave';
import IconOrangeMoney from '../icons/IconOrangeMoney';
import IconCreditCard from '../icons/IconCreditCard';
import IconMobilePayment from '../icons/IconMobilePayment';
import IconPlus from '../icons/IconPlus';
import IconMinus from '../icons/IconMinus';
import IconDelete from '../icons/IconDelete';
import { useI18n } from '../../i18n';
import ClientSelectionModal from './ClientSelectionModal';
import IconPaycaap from '../icons/IconPaycaap';
import OrderSelectionModal from './OrderSelectionModal';
import IconSearchDocument from '../icons/IconSearchDocument';
import PriceCalculatorModal from '../ecommerce/PriceCalculatorModal';
import { CartItem } from '../ecommerce/ShoppingCart';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProductsBySubsidiary } from '../../services/apiE-commerce/apiProducts';
import { getContacts, createContactByEmployee, ContactCreationData } from '../../services/apiCrm/apiContacts';
import { getOrders, recordOrderPayment, FindAllOrdersDto } from '../../services/apiE-commerce/apiOrders';
import { createDirectSale, CreateDirectSaleDto } from '../../services/apiE-commerce/apiSales';
import { getImageUrl } from '../../utils/imageUtils';
import { useAuth } from '../../context/AuthContext';

type CaisseMode = 'new_sale' | 'payment';

const Caisse: React.FC = () => {
    const { subsidiary } = useAuth();
    const { t, formatCurrency } = useI18n();
    const queryClient = useQueryClient();
    
    // Global state for mode and modals
    const [mode, setMode] = useState<CaisseMode>('new_sale');
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isOrderSelectionModalOpen, setIsOrderSelectionModalOpen] = useState(false);
    const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null);

    // State for 'new_sale' mode
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    // State for 'payment' mode
    const [loadedOrder, setLoadedOrder] = useState<Order | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');

    // State for UI feedback
    const [operationSuccess, setOperationSuccess] = useState(false);

    // --- TanStack Query Data Fetching & Mutations ---
    const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
        queryKey: ['products', subsidiary?.id],
        queryFn: () => getProductsBySubsidiary(),
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

    const { mutate: recordPaymentMutate, isPending: isRecordingPayment } = useMutation({
        mutationFn: (data: { orderId: string; amount: number; paymentMethod: CustomerPaymentMethod }) => recordOrderPayment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
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
        }
    });

    // Memoized data
    const filteredProducts = useMemo(() => products.filter(p => p.productName.toLowerCase().includes(searchTerm.toLowerCase())), [products, searchTerm]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<CustomerPaymentMethod | null>(null);

    // --- NEW SALE MODE LOGIC ---
     const addSimpleProductToCart = (product: Product) => {
        const cartItem: CartItem = {
            id: product.id,
            product,
            quantity: 1,
            options: {},
            unitPrice: product.sellingPrice,
            totalPrice: product.sellingPrice,
        };
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.id === cartItem.id);
            if (existingItem) {
                const newQuantity = existingItem.quantity + 1;
                if (newQuantity > product.stock) return currentCart; // Do not add if stock is exceeded
                return currentCart.map(item => item.id === product.id ? { ...item, quantity: newQuantity, totalPrice: item.unitPrice * newQuantity } : item);
            }
            return [...currentCart, cartItem];
        });
    };

    const handleProductClick = (product: Product) => {
        if (product.configurableOptions) {
            setConfiguringProduct(product);
        } else {
            addSimpleProductToCart(product);
        }
    };
    
    const handleAddToCartFromModal = (item: CartItem) => {
        setCart(currentCart => {
            // For configured items, we assume each configuration is unique and add as a new line.
            // A more complex logic could merge items with identical configurations.
            return [...currentCart, item];
        });
        setConfiguringProduct(null);
    };

    const updateQuantity = (cartItemId: string, newQuantity: number) => {
        setCart(currentCart => {
            const itemToUpdate = currentCart.find(item => item.id === cartItemId);
            if (!itemToUpdate) return currentCart;
            
            const clampedQuantity = Math.max(0, Math.min(newQuantity, itemToUpdate.product.stock));
            
            if (clampedQuantity <= 0) {
                return currentCart.filter(item => item.id !== cartItemId);
            }
            
            return currentCart.map(item =>
                item.id === cartItemId ? { ...item, quantity: clampedQuantity, totalPrice: item.unitPrice * clampedQuantity } : item
            );
        });
    };
    
    const newSaleTotal = useMemo(() => cart.reduce((sum, item) => sum + item.totalPrice, 0), [cart]);

    const handleCheckout = () => {
        if (isCheckingOut || cart.length === 0 || !selectedPaymentMethod || !selectedContact) return;
        
        // Préparer le DTO pour la vente directe
        const saleData: CreateDirectSaleDto = {
            items: cart.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
            })),
            customerId: selectedContact.id,
            paymentMethod: selectedPaymentMethod,
        };

        // Appeler la mutation pour créer la vente directe
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
    };
    
    const handleClientSelected = (contact: Contact) => {
        setSelectedContact(contact);
        setIsClientModalOpen(false);
    };

    const handleCreateClient = (clientData: ContactCreationData) => {
        createContactMutate(clientData);
        // The onSuccess of the mutation will select the client and close the modal
    };

    const paymentMethods = [
        { id: CustomerPaymentMethod.WAVE, label: t('payment.WAVE'), icon: <IconWave className="h-6 w-6" /> },
        { id: CustomerPaymentMethod.CARD, label: t('payment.CARD'), icon: <IconCreditCard className="h-6 w-6" /> },
        { id: CustomerPaymentMethod.ORANGE_MONEY, label: t('payment.ORANGE_MONEY'), icon: <IconOrangeMoney className="h-6 w-6" /> },
        { id: CustomerPaymentMethod.MOBILE_MONEY, label: t('payment.MOBILE_MONEY'), icon: <IconMobilePayment className="h-6 w-6" /> },
        { id: CustomerPaymentMethod.PAYCAAP, label: t('payment.PAYCAAP'), icon: <IconPaycaap className="h-5" /> }
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

    if (!subsidiary || isLoadingProducts || isLoadingContacts || isLoadingOrders) {
        return <div>{t('common.loading')}</div>;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">{t('cashRegister.title')}</h2>
                <button onClick={() => setIsOrderSelectionModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white text-sm font-semibold rounded-md hover:bg-slate-700 transition-colors">
                    <IconSearchDocument className="h-5 w-5" />
                    <span>{t('cashRegister.findOrder')}</span>
                </button>
            </div>
            <div className="flex-grow grid grid-cols-12 gap-6 h-full">
                {/* Product/Order Details Panel (Left) */}
                <div className="col-span-12 lg:col-span-7 bg-white p-6 rounded-xl shadow-md flex flex-col">
                    {mode === 'new_sale' ? (
                        <>
                            <div className="relative mb-4">
                                <input type="search" placeholder={t('cashRegister.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-full bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#c6e911]" />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                            </div>
                            <div className="flex-grow overflow-y-auto pr-2">
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredProducts.map(p => {
                                        const isService = p.mainCategory === 'Prestations de services';
                                        const isOutOfStock = !isService && p.stock <= 0;

                                        return (
                                            <button 
                                                key={p.id} 
                                                onClick={() => handleProductClick(p)} 
                                                className="border rounded-lg p-2 text-left hover:shadow-lg hover:border-[#c6e911] transition-all flex flex-col justify-start disabled:opacity-50 disabled:cursor-not-allowed" 
                                                disabled={isOutOfStock}
                                            >
                                                <div className="w-full h-20 mb-2 rounded overflow-hidden bg-slate-100">
                                                    <img src={p.productImages && p.productImages.length > 0 ? getImageUrl(p.productImages[0].imageUrl) : 'https://via.placeholder.com/150'} alt={p.name} className="w-full h-full object-cover"/>
                                                </div>
                                                <div className="flex-grow flex flex-col">
                                                    <h3 className="font-semibold text-sm leading-tight">{p.productName}</h3>
                                                    <p className="font-bold text-[#c6e911] mt-1 text-sm">{formatCurrency(p.sellingPrice)}</p>
                                                </div>
                                                {isService ? (
                                                     <p className="text-xs mt-auto pt-1 text-green-600 font-semibold">{t('stock.available')}</p>
                                                ) : (
                                                     <p className={`text-xs mt-auto pt-1 ${p.stock < 10 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                                        {t('stock.currentStock')}: {p.stock}
                                                     </p>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : loadedOrder && (
                        console.log(loadedOrder),
                        <div className="flex-grow overflow-y-auto pr-2">
                            <h3 className="text-xl font-bold text-slate-800 border-b pb-2 mb-4">{t('cashRegister.loadedOrder.title')}</h3>
                            <div className="space-y-2 mb-4 text-sm">
                                <p><strong>{t('cashRegister.loadedOrder.orderId')}:</strong> {loadedOrder.id}</p>
                                <p><strong>{t('cashRegister.clientSection.title')}:</strong> {loadedOrder.customerName}</p>
                            </div>
                             <ul className="divide-y divide-slate-200">
                                {loadedOrder.orderItems.map((item, index) => <li key={index} className="py-2 flex justify-between items-center"><p>{item.product.productName} (x{item.quantity})</p><p className="font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</p></li>)}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Cart and Payment Panel (Right) */}
                <div className="col-span-12 lg:col-span-5 bg-white p-6 rounded-xl shadow-md flex flex-col">
                    {operationSuccess ? renderSuccessMessage() : (
                    <>
                        {mode === 'new_sale' ? (
                            <div className="border-b pb-2 mb-4">
                                <h3 className="text-xl font-bold text-slate-800">{t('cashRegister.clientSection.title')}</h3>
                                {selectedContact ? <div className="flex items-center justify-between mt-2"><div><p className="font-semibold">{selectedContact.contactName}</p><p className="text-sm text-slate-500">{selectedContact.company}</p></div><button onClick={() => setIsClientModalOpen(true)} className="text-sm text-[#c6e911] hover:underline">{t('cashRegister.clientSection.change')}</button></div> : <button onClick={() => setIsClientModalOpen(true)} className="mt-2 w-full text-center px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">{t('cashRegister.clientSection.selectAdd')}</button>}
                            </div>
                        ) : null}
                        <h3 className="text-xl font-bold text-slate-800 border-b pb-2 mb-4">{t('cashRegister.cartTitle')}</h3>
                        <div className="flex-grow overflow-y-auto">
                            {(mode === 'new_sale' && cart.length === 0) ? <p className="h-full flex items-center justify-center text-slate-500">{t('cashRegister.cartEmpty')}</p> : (
                                <ul className="divide-y divide-slate-200">
                                    {mode === 'new_sale' ? cart.map(item => <li key={item.id} className="py-3 flex items-center justify-between"><div><p className="font-semibold text-slate-800">{item.product.productName}</p><p className="text-xs text-slate-500">{formatOptions(item.options)}</p><p className="text-sm text-slate-500 mt-1">{formatCurrency(item.unitPrice)}</p></div><div className="flex items-center space-x-2"><button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded-full bg-slate-200 hover:bg-slate-300"><IconMinus className="h-4 w-4" /></button><span className="font-bold w-6 text-center">{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded-full bg-slate-200 hover:bg-slate-300"><IconPlus className="h-4 w-4" /></button><button onClick={() => updateQuantity(item.id, 0)} className="p-1 rounded-full hover:bg-red-100 text-red-500"><IconDelete className="h-4 w-4" /></button></div></li>) : null}
                                </ul>
                            )}
                        </div>
                        <div className="border-t pt-4 mt-4 space-y-4">
                            {mode === 'new_sale' ? (
                                <div className="flex justify-between font-bold text-lg"><span>{t('cashRegister.total')}</span><span>{formatCurrency(newSaleTotal)}</span></div>
                            ) : loadedOrder && (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span>{t('cashRegister.loadedOrder.total')}</span><span className="font-semibold">{formatCurrency(loadedOrder.totalAmount)}</span></div>
                                    <div className="flex justify-between"><span>{t('cashRegister.loadedOrder.paid')}</span><span className="font-semibold text-green-600">{formatCurrency(loadedOrder.amountPaid)}</span></div>
                                    <div className="flex justify-between font-bold"><span>{t('cashRegister.loadedOrder.remaining')}</span><span className="text-red-600">{formatCurrency(loadedOrder.totalAmount - loadedOrder.amountPaid)}</span></div>
                                    <div className="pt-2"><label htmlFor="paymentAmount" className="block text-sm font-medium text-slate-700">{t('cashRegister.loadedOrder.amountToPay')}</label><input type="number" id="paymentAmount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} max={loadedOrder.totalAmount - loadedOrder.amountPaid} min="0" className="mt-1 block w-full border-slate-300 rounded-md shadow-sm" /></div>
                                </div>
                            )}
                            <div>
                                <p className="font-semibold mb-2">{t('cashRegister.paymentMethod')}</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{paymentMethods.map(method => <button key={method.id} onClick={() => setSelectedPaymentMethod(method.id as CustomerPaymentMethod)} className={`flex flex-col items-center justify-center text-center space-y-1 p-2 rounded-lg border-2 transition-all h-20 ${selectedPaymentMethod === method.id ? 'border-[#c6e911] bg-[#c6e911]/10' : 'border-slate-300 bg-white hover:border-slate-400'}`}>{method.icon}<span className="text-xs font-medium">{method.label}</span></button>)}</div>
                            </div>
                            <button onClick={mode === 'new_sale' ? handleCheckout : handleRecordPayment} disabled={(mode === 'new_sale' && (cart.length === 0 || !selectedPaymentMethod || !selectedContact)) || (mode === 'payment' && (!paymentAmount || parseFloat(paymentAmount) <= 0 || !selectedPaymentMethod))} className="w-full text-center px-4 py-3 bg-[#c6e911] text-slate-800 font-bold rounded-lg hover:bg-[#adc40f] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">{t('cashRegister.checkoutButton')}</button>
                        </div>
                    </>
                    )}
                </div>
            </div>
            {isClientModalOpen && <ClientSelectionModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} clients={contacts} onClientSelect={handleClientSelected} onClientCreate={handleCreateClient} />}
            {isOrderSelectionModalOpen && <OrderSelectionModal isOpen={isOrderSelectionModalOpen} onClose={() => setIsOrderSelectionModalOpen(false)} orders={orders} contacts={contacts} onOrderSelect={handleOrderSelected} />}
             {configuringProduct && (
                <PriceCalculatorModal
                    isOpen={!!configuringProduct}
                    onClose={() => setConfiguringProduct(null)}
                    product={configuringProduct}
                    onAddToCart={handleAddToCartFromModal}
                />
            )}
        </div>
    );
};

export default Caisse;