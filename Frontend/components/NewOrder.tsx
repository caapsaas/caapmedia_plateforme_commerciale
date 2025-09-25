import React, { useState, useMemo } from 'react';
import { Subsidiary, Product, Order, OrderStatus, Contact, PaymentStatus, ProductionStatus } from '../types';
import IconMinus from './icons/IconMinus';
import IconDelete from './icons/IconDelete';
import { useI18n } from '../i18n';
// FIX: Import useAppContext to access global state.
import { useAppContext } from '../context/AppContext';

interface NewOrderProps {
    subsidiary: Subsidiary;
    products: Product[];
    // FIX: Correct the type for onOrderPlaced to match the 'PLACE_ORDER' action payload.
    onOrderPlaced: (newOrder: Omit<Order, 'id' | 'subsidiaryId' | 'status' | 'salesRepId' | 'paymentStatus' | 'amountPaid' | 'productionStatus' | 'productionHistory' | 'taxRateId' | 'taxRateValue'>) => void;
    currentCustomer: Contact;
}

type CartItem = {
    product: Product;
    quantity: number;
};

const NewOrder: React.FC<NewOrderProps> = ({ subsidiary, products: allProducts, onOrderPlaced, currentCustomer }) => {
    const { t, formatCurrency } = useI18n();
    // FIX: Get state from context to access tax rates.
    const { state } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const availableProducts = useMemo(() => 
        allProducts.filter(p => p.subsidiaryId === subsidiary.id),
        [subsidiary.id, allProducts]
    );

    const filteredProducts = useMemo(() =>
        availableProducts.filter(product =>
            (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase()))
            && product.stock > 0
        ), [availableProducts, searchTerm]
    );

    const handleQuantityChange = (productId: string, quantity: number) => {
        const newQuantity = isNaN(quantity) ? 0 : quantity;
        const product = availableProducts.find(p => p.id === productId);
        if (product) {
            setQuantities(prev => ({ ...prev, [productId]: Math.max(0, Math.min(newQuantity, product.stock)) }));
        }
    };

    const addToCart = (product: Product) => {
        const quantity = quantities[product.id] || 0;
        if (quantity <= 0) return;

        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.product.id === product.id);
            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                const clampedQuantity = Math.min(newQuantity, product.stock);
                return currentCart.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: clampedQuantity }
                        : item
                );
            }
            return [...currentCart, { product, quantity }];
        });
        setQuantities(prev => ({ ...prev, [product.id]: 0 }));
    };

    const updateCartQuantity = (productId: string, newQuantity: number) => {
        setCart(currentCart => {
            const itemToUpdate = currentCart.find(item => item.product.id === productId);
            if (!itemToUpdate) return currentCart;

            const clampedQuantity = Math.max(0, Math.min(newQuantity, itemToUpdate.product.stock));

            if (clampedQuantity <= 0) {
                return currentCart.filter(item => item.product.id !== productId);
            }
            return currentCart.map(item =>
                item.product.id === productId ? { ...item, quantity: clampedQuantity } : item
            );
        });
    };
    
    const subtotal = useMemo(() =>
        cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0),
        [cart]
    );

    // FIX: Use default tax rate from context for calculations.
    const defaultTaxRate = useMemo(() => state.taxRates.find(t => t.isDefault) || { rate: 0.1925 }, [state.taxRates]);
    const taxAmount = useMemo(() => subtotal * defaultTaxRate.rate, [subtotal, defaultTaxRate]);
    const totalAmount = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

    const handleSubmitOrder = () => {
        if (!currentCustomer) return;
        
        const paymentDueDate = new Date();
        paymentDueDate.setDate(paymentDueDate.getDate() + 30);

        // FIX: Create newOrderData without taxRateId and taxRateValue to match the expected type.
        // The reducer will add these properties.
        const newOrderData = {
            date: new Date().toISOString().split('T')[0],
            customerId: currentCustomer.id,
            customerName: currentCustomer.name,
            items: cart.map(item => ({
                product: item.product,
                quantity: item.quantity,
                price: item.product.sellingPrice
            })),
            subtotal,
            taxAmount,
            totalAmount,
            paymentDueDate: paymentDueDate.toISOString().split('T')[0],
        };
        
        onOrderPlaced(newOrderData);

        setOrderPlaced(true);
        setCart([]);
        setTimeout(() => setOrderPlaced(false), 4000);
    };

    return (
        <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-7 bg-white p-6 rounded-xl shadow-md flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 mb-4">{t('newOrder.productCatalog')}</h3>
                <div className="relative mb-4">
                    <input
                        type="search"
                        placeholder={t('newOrder.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-full bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
                <div className="flex-grow overflow-auto pr-2" style={{maxHeight: '60vh'}}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Image</th>
                                    <th scope="col" className="px-4 py-3">{t('newOrder.product')}</th>
                                    <th scope="col" className="px-4 py-3 text-right">{t('newOrder.price')}</th>
                                    <th scope="col" className="px-4 py-3 text-center">{t('newOrder.quantity')}</th>
                                    <th scope="col" className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredProducts.map(product => (
                                    <tr key={product.id}>
                                        <td className="px-4 py-3">
                                            <img src={product.imageUrls?.[0] || 'https://via.placeholder.com/100'} alt={product.name} className="h-12 w-12 object-cover rounded-md"/>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-800">{product.name}</div>
                                            <div className="text-xs text-slate-500 max-w-xs">{product.description}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-700">{formatCurrency(product.sellingPrice)}</td>
                                        <td className="px-4 py-3">
                                            <input 
                                                type="number" 
                                                min="0"
                                                max={product.stock}
                                                value={quantities[product.id] || ''}
                                                onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value, 10))}
                                                className="w-20 p-1 text-center border border-slate-300 rounded-md"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => addToCart(product)} className="px-3 py-1 bg-[#c6e911] text-slate-800 text-xs font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                                                {t('newOrder.addToCart')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="col-span-12 lg:col-span-5 bg-white p-6 rounded-xl shadow-md flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 border-b pb-2 mb-4">{t('newOrder.orderSummary')}</h3>
                <div className="flex-grow overflow-y-auto">
                    {orderPlaced ? (
                        <div className="h-full flex items-center justify-center text-green-600 text-center">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="font-bold mt-2">{t('newOrder.orderPlacedSuccess')}</p>
                            </div>
                        </div>
                    ) : cart.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-500">
                            {t('newOrder.cartEmpty')}
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-200">
                            {cart.map(item => (
                                <li key={item.product.id} className="py-3 flex items-center">
                                    <div className="flex-grow">
                                        <p className="font-semibold text-slate-800">{item.product.name}</p>
                                        <div className="flex items-center space-x-2 text-sm text-slate-500">
                                            <span>{item.quantity} x {formatCurrency(item.product.sellingPrice)}</span>
                                            <span className="font-bold text-slate-700">{formatCurrency(item.product.sellingPrice * item.quantity)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="p-1 rounded-full bg-slate-200 hover:bg-slate-300"><IconMinus className="h-4 w-4" /></button>
                                        <button onClick={() => updateCartQuantity(item.product.id, 0)} className="p-1 rounded-full hover:bg-red-100 text-red-500"><IconDelete className="h-4 w-4" /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="border-t pt-4 mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>{t('invoice.subtotal')}</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        {/* FIX: Use dynamic tax rate from context */}
                        <span>{t('invoice.tax')} ({(defaultTaxRate.rate * 100).toFixed(2)}%)</span>
                        <span>{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                        <span>{t('newOrder.total')}</span>
                        <span>{formatCurrency(totalAmount)}</span>
                    </div>
                    <button 
                        onClick={handleSubmitOrder}
                        disabled={cart.length === 0 || orderPlaced}
                        className="w-full text-center px-4 py-3 bg-[#c6e911] text-slate-800 font-bold rounded-lg hover:bg-[#adc40f] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {t('newOrder.submitOrder')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewOrder;
