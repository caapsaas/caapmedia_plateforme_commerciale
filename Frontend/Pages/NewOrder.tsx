import React, { useState, useMemo, useEffect } from 'react';

import { Subsidiary, Product, Order, Contact, TaxRate, OrderStatus, ProductionStatus, PaymentStatus, ConfigurableOptionItem, CustomerPaymentMethod, ProductOptions } from '../types';

import IconMinus from '../components/icons/IconMinus';

import IconDelete from '../components/icons/IconDelete';

import { useI18n } from '../i18n';

import { useQuery } from '@tanstack/react-query';

import { getContacts } from '../services/apiCrm/apicontacts';

import { getTaxes } from '../services/apiE-commerce/apitaxes';

import SelectFilter from '../components/filters/SelectFilter';



interface NewOrderProps {

    subsidiary: Subsidiary;

    products: Product[];

    selectedCustomer?: Contact; // Customer can be pre-selected

    onOrderPlaced: (newOrder: Omit<Order, 'id' | 'subsidiaryId'>) => void;

}



type CartItem = {

    product: Product;

    quantity: number;

};



const mapConfigurableOptionKey = (key: string): keyof ProductOptions => {
    const mappings: Record<string, keyof ProductOptions> = {
        'FORMATS': 'format',
        'GRAMMAGES': 'grammage',
        'PRINTSIDES': 'printSide',
        'LAMINATIONS': 'lamination',
        'SIZES': 'size',
        'COLORS': 'color',
        'MATERIALS': 'material',
        'DIMENSIONS': 'dimension',
        'BINDINGS': 'binding',
        'FOLDINGS': 'folding',
        'CORNERS': 'corner',
        'EYELETS': 'eyelet',
        'PAGES': 'page',
        'HANDLES': 'handle',
        'STUB': 'stub',
        'NUMBERING': 'numbering',
    };
    return mappings[key] || (key.toLowerCase() as keyof ProductOptions);
};

const mapCartItemToOrderItem = (
    cartItem: CartItem,
    cartItemPrices: Record<string, number>
): OrderItem => {
    const options: Partial<ProductOptions> = cartItem.product.configurableOptions
        ? Object.entries(cartItem.product.configurableOptions).reduce((acc, [optionType, optionItems]) => {
            if (optionItems && optionItems.length > 0) {
                const mappedKey = mapConfigurableOptionKey(optionType);
                acc[mappedKey] = optionItems[0].optionName;
            }
            return acc;
        }, {} as Partial<ProductOptions>)
        : {};

    const unitPrice = cartItemPrices[cartItem.product.id] || 0;

    return {
        product: cartItem.product,
        quantity: cartItem.quantity,
        price: unitPrice,
        options: options,
    };
};

interface OrderValidationError {
    field: string;
    message: string;
}

const validateOrder = (
    cart: CartItem[],
    cartItemPrices: Record<string, number>,
    selectedCustomerId: string,
    availableProducts: Product[]
): OrderValidationError[] => {
    const errors: OrderValidationError[] = [];

    if (!selectedCustomerId) {
        errors.push({ field: 'customer', message: 'Veuillez sélectionner un client' });
    }

    if (cart.length === 0) {
        errors.push({ field: 'cart', message: 'Le panier est vide' });
        return errors;
    }

    cart.forEach((item, index) => {
        const price = cartItemPrices[item.product.id] || 0;
        if (price <= 0) {
            errors.push({
                field: `price_${index}`,
                message: `Le produit "${item.product.productName}" doit avoir un prix > 0`,
            });
        }

        if (item.quantity <= 0) {
            errors.push({
                field: `quantity_${index}`,
                message: `Le produit "${item.product.productName}" doit avoir une quantité > 0`,
            });
        }

        if (!availableProducts.find(p => p.id === item.product.id)) {
            errors.push({
                field: `product_${index}`,
                message: `Le produit "${item.product.productName}" n'est plus disponible`,
            });
        }
    });

    return errors;
};

const NewOrder: React.FC<NewOrderProps> = ({ subsidiary, products: allProducts, selectedCustomer, onOrderPlaced }) => {

    const { t, formatCurrency } = useI18n();

    const [searchTerm, setSearchTerm] = useState('');

    const [cart, setCart] = useState<CartItem[]>([]);

    const [orderPlaced, setOrderPlaced] = useState(false);

    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>(selectedCustomer?.id || '');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<CustomerPaymentMethod>(CustomerPaymentMethod.PAY_ON_DELIVERY);

    // États pour les prix et taxes manuels
    const [cartItemPrices, setCartItemPrices] = useState<Record<string, number>>({});
    const [useCustomTaxRate, setUseCustomTaxRate] = useState(false);
    const [customTaxRate, setCustomTaxRate] = useState(19.25);



    useEffect(() => {

        if (selectedCustomer) {

            setSelectedCustomerId(selectedCustomer.id);

        }

    }, [selectedCustomer]);



    const availableProducts = useMemo(() =>

        allProducts.filter(p => p.subsidiaryId === subsidiary.id),

        [subsidiary.id, allProducts]

    );



    const filteredProducts = useMemo(() =>

        availableProducts.filter(product =>

            (product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||

                product.description.toLowerCase().includes(searchTerm.toLowerCase()))

            // Suppression du filtre de stock pour afficher tous les produits

        ), [availableProducts, searchTerm]

    );



    const { data: clients = [] } = useQuery<Contact[]>({

        queryKey: ['contacts', subsidiary.id],

        queryFn: getContacts,

    });



    const { data: taxRates = [] } = useQuery<TaxRate[]>({

        queryKey: ['taxes'],

        queryFn: getTaxes,

    });



    const handleQuantityChange = (productId: string, quantity: number) => {

        const newQuantity = isNaN(quantity) ? 0 : quantity;

        const product = availableProducts.find(p => p.id === productId);

        if (product) {

            setQuantities(prev => ({ ...prev, [productId]: Math.max(0, Math.min(newQuantity, product.stock)) }));

        } else {
          toast.error("Erreur", "Le produit n'existe plus. Veuillez rafraîchir la page.");
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

        // Initialiser le prix de cet article s'il n'existe pas
        if (!cartItemPrices[product.id]) {
          setCartItemPrices(prev => ({ ...prev, [product.id]: 0 }));
        }

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

        cart.reduce((sum, item) => {
          const unitPrice = cartItemPrices[item.product.id] || 0;
          return sum + unitPrice * item.quantity;
        }, 0),

        [cart, cartItemPrices]

    );



    const defaultTaxRate = useMemo(() => taxRates.find(t => t.isDefault) || { rate: 0.1925, id: '' }, [taxRates]);

    const effectiveTaxRate = useCustomTaxRate ? customTaxRate / 100 : defaultTaxRate.rate;
    const taxAmount = useMemo(() => subtotal * effectiveTaxRate, [subtotal, effectiveTaxRate]);

    const totalAmount = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);


    const handleSubmitOrder = () => {
        // Valider la commande
        const validationErrors = validateOrder(cart, cartItemPrices, selectedCustomerId, availableProducts);

        if (validationErrors.length > 0) {
          const mainError = validationErrors[0];
          toast.error("Erreur de validation", mainError.message);
          return;
        }

        const customer = clients.find(c => c.id === selectedCustomerId);
        if (!customer) {
          toast.error("Erreur", "Client non trouvé");
          return;
        }



        const paymentDueDate = new Date();

        paymentDueDate.setDate(paymentDueDate.getDate() + 30);



        const newOrderData = {

            orderId: `ORD-${Date.now()}`, // Generate unique order ID

            date: new Date().toISOString(),

            customerId: customer.id,

            customerName: customer.contactName,

            items: cart.map(item => mapCartItemToOrderItem(item, cartItemPrices)),
            orderItems: cart.map(item => mapCartItemToOrderItem(item, cartItemPrices)),

            subtotal,

            taxAmount,

            totalAmount,

            taxRateId: defaultTaxRate.id,

            taxRateValue: useCustomTaxRate ? customTaxRate / 100 : defaultTaxRate.rate,

            customTaxRate: useCustomTaxRate ? customTaxRate : undefined,

            paymentDueDate: paymentDueDate.toISOString(),

            // Ajout des propriétés manquantes pour correspondre au type Order

            status: OrderStatus.NEW,

            productionStatus: ProductionStatus.PREPRESS,

            paymentStatus: PaymentStatus.UNPAID,

            amountPaid: 0,

            productionHistory: [{ status: ProductionStatus.PREPRESS, date: new Date().toISOString() }],

            paymentMethod: selectedPaymentMethod,

        };



        onOrderPlaced(newOrderData);



        setOrderPlaced(true);

    };



    const clientOptions = useMemo(() => clients.map(c => ({ value: c.id, label: `${c.contactName} (${c.company || 'N/A'})` })), [clients]);



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

                <div className="flex-grow overflow-auto pr-2" style={{ maxHeight: '60vh' }}>

                    <div className="overflow-x-auto">

                        <table className="w-full text-sm text-left text-slate-500">

                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">

                                <tr>

                                    <th scope="col" className="px-4 py-3">Image</th>

                                    <th scope="col" className="px-4 py-3">{t('newOrder.product')}</th>

                                    <th scope="col" className="px-4 py-3 text-right">{t('newOrder.price')}</th>

                                    <th scope="col" className="px-4 py-3 text-center">Stock</th>

                                    <th scope="col" className="px-4 py-3 text-center">{t('newOrder.quantity')}</th>

                                    <th scope="col" className="px-4 py-3"></th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-slate-200">

                                {filteredProducts.map(product => (

                                    <tr key={product.id}>

                                        <td className="px-4 py-3">

                                            <img src={product.productImages?.[0]?.imageUrl || 'https://via.placeholder.com/100'} alt={product.productName} className="h-12 w-12 object-cover rounded-md" />

                                        </td>

                                        <td className="px-4 py-3">

                                            <div className="font-semibold text-slate-800">{product.productName}</div>

                                            <div className="text-xs text-slate-500 max-w-xs">{product.description}</div>

                                        </td>

                                        <td className="px-4 py-3 text-right text-slate-500 text-xs">

                                            À définir

                                        </td>

                                        <td className="px-4 py-3 text-center">

                                            <span className={`text-sm font-medium ${product.stock <= 0 ? 'text-red-600' : 'text-green-600'}`}>

                                                {product.stock <= 0 ? 'Rupture' : product.stock}

                                            </span>

                                        </td>

                                        <td className="px-4 py-3">

                                            <input

                                                type="number"

                                                min="0"

                                                max={product.stock}

                                                value={quantities[product.id] || ''}

                                                onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value, 10))}

                                                className={`w-20 p-1 text-center border rounded-md ${

                                                    product.stock <= 0 

                                                        ? 'border-red-300 bg-red-50 text-red-500' 

                                                        : 'border-slate-300'

                                                }`}

                                                placeholder="0"

                                                disabled={product.stock <= 0}

                                            />

                                        </td>

                                        <td className="px-4 py-3 text-right">

                                            <button 

                                                onClick={() => addToCart(product)} 

                                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${

                                                    product.stock <= 0

                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'

                                                        : 'bg-[#c6e911] text-slate-800 hover:bg-[#adc40f]'

                                                }`}

                                                disabled={product.stock <= 0}

                                            >

                                                {product.stock <= 0 ? 'Indisponible' : t('newOrder.addToCart')}

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

                {!selectedCustomer && (

                    <div className="mb-4">

                        <SelectFilter

                            label={t('filter.client')}

                            name="customer"

                            value={selectedCustomerId}

                            onChange={(e) => setSelectedCustomerId(e.target.value)}

                            options={clientOptions}

                            placeholder={t('cashRegister.clientSection.selectAdd')}

                        />

                    </div>

                )}

                <h3 className="text-xl font-bold text-slate-800 border-b pb-2 mb-4">{t('newOrder.orderSummary')}</h3>

                <div className="flex-grow overflow-y-auto">

                    {orderPlaced ? (

                        <div className="h-full flex items-center justify-center text-green-600 text-center flex-col gap-4">

                            <div>

                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>

                                <p className="font-bold mt-2">{t('newOrder.orderPlacedSuccess')}</p>

                            </div>

                            <button
                              onClick={() => {
                                setOrderPlaced(false);
                                setCart([]);
                                setCartItemPrices({});
                                setUseCustomTaxRate(false);
                                setCustomTaxRate(19.25);
                                setSelectedCustomerId(selectedCustomer?.id || '');
                              }}
                              className="px-4 py-2 bg-[#c6e911] text-slate-800 font-semibold rounded-lg hover:bg-[#adc40f] transition-colors"
                            >
                              Créer une nouvelle commande
                            </button>

                        </div>

                    ) : cart.length === 0 ? (

                        <div className="h-full flex items-center justify-center text-slate-500">

                            {t('newOrder.cartEmpty')}

                        </div>

                    ) : (

                        <ul className="divide-y divide-slate-200">

                            {cart.map(item => {
                              const unitPrice = cartItemPrices[item.product.id] || 0;
                              const itemTotal = unitPrice * item.quantity;

                              return (
                                <li key={item.product.id} className="py-3 flex flex-col gap-2">

                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-semibold text-slate-800">{item.product.productName}</p>
                                        <p className="text-xs text-slate-500">Stock: {item.product.stock}</p>
                                      </div>
                                      <div className="flex items-center space-x-1">

                                        <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="p-1 rounded-full bg-slate-200 hover:bg-slate-300"><IconMinus className="h-4 w-4" /></button>

                                        <span className="w-8 text-center font-medium">{item.quantity}</span>

                                        <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} className="p-1 rounded-full bg-slate-200 hover:bg-slate-300"><IconMinus className="h-4 w-4 rotate-180" /></button>

                                        <button onClick={() => updateCartQuantity(item.product.id, 0)} className="p-1 rounded-full hover:bg-red-100 text-red-500"><IconDelete className="h-4 w-4" /></button>

                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded">
                                      <label className="text-slate-600 whitespace-nowrap">Prix/u:</label>
                                      <input
                                        type="number"
                                        value={unitPrice}
                                        onChange={(e) => setCartItemPrices(prev => ({ ...prev, [item.product.id]: parseFloat(e.target.value) || 0 }))}
                                        className="flex-1 px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#c6e911]"
                                        min="0"
                                        step="100"
                                      />
                                      <span className="font-bold text-slate-700 whitespace-nowrap">{formatCurrency(itemTotal)}</span>
                                    </div>

                                </li>
                              );
                            })}

                        </ul>

                    )}

                </div>

                <div className="border-t pt-4 mt-4 space-y-3">

                    <div className="flex justify-between text-sm">

                        <span>{t('invoice.subtotal')}</span>

                        <span>{formatCurrency(subtotal)}</span>

                    </div>

                    <div className="border p-3 rounded-md bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700">Taxes</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setUseCustomTaxRate(false)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${!useCustomTaxRate ? 'bg-[#c6e911] text-slate-800' : 'bg-slate-200 text-slate-600'}`}
                          >
                            Par défaut
                          </button>
                          <button
                            onClick={() => setUseCustomTaxRate(true)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${useCustomTaxRate ? 'bg-[#c6e911] text-slate-800' : 'bg-slate-200 text-slate-600'}`}
                          >
                            Personnalisé
                          </button>
                        </div>
                      </div>

                      {useCustomTaxRate ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={customTaxRate}
                            onChange={(e) => setCustomTaxRate(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                            min="0"
                            max="100"
                            step="0.01"
                            className="flex-1 px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#c6e911]"
                          />
                          <span className="text-sm font-medium text-slate-700">%</span>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-600">
                          Taux par défaut: {(defaultTaxRate.rate * 100).toFixed(2)}%
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between text-sm">

                        <span>{t('invoice.tax')} ({(effectiveTaxRate * 100).toFixed(2)}%)</span>

                        <span>{formatCurrency(taxAmount)}</span>

                    </div>

                    <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">

                        <span>{t('newOrder.total')}</span>

                        <span>{formatCurrency(totalAmount)}</span>

                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Méthode de paiement
                        </label>
                        <select
                            value={selectedPaymentMethod}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value as CustomerPaymentMethod)}
                            className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                        >
                            <option value={CustomerPaymentMethod.PAY_ON_DELIVERY}>Paiement à la livraison</option>
                            <option value={CustomerPaymentMethod.CARD}>Carte bancaire</option>
                            <option value={CustomerPaymentMethod.ORANGE_MONEY}>Orange Money</option>
                            <option value={CustomerPaymentMethod.WAVE}>Wave</option>
                            <option value={CustomerPaymentMethod.MOBILE_MONEY}>Mobile Money</option>
                            <option value={CustomerPaymentMethod.PAYCAAP}>PayCaap</option>
                            <option value={CustomerPaymentMethod.CUSTOMER_CREDIT}>Crédit client</option>
                        </select>
                    </div>

                    <button

                        onClick={handleSubmitOrder}

                        disabled={cart.length === 0 || orderPlaced || !selectedCustomerId}

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

