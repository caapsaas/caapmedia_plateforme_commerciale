import React, { useState, useMemo, useEffect } from 'react';
import { Subsidiary, Product, Order, Contact, TaxRate, OrderStatus, ProductionStatus, PaymentStatus, CustomerPaymentMethod, FormDefinition } from '../types';
import IconMinus from '../components/icons/IconMinus';
import IconPlus from '../components/icons/IconPlus';
import IconDelete from '../components/icons/IconDelete';
import { useI18n } from '../i18n';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getContacts, searchContactsGlobal, GlobalContactSearchResult } from '../services/apiCrm/apicontacts';
import { getTaxes } from '../services/apiE-commerce/apitaxes';
import { getFormDefinition } from '../services/apiE-commerce/apiProductSpecs';
import {
    getConfiguredEquipments, getCommercialParams,
    resolveWorkflow,
    EquipmentWithCost, CommercialParams, ResolvedWorkflow,
} from '../services/apiProduction/apiProduction';
import SelectFilter from '../components/filters/SelectFilter';
import { SpecValues } from '../components/common/FormRenderer';
import type { ProductionCostResult, ProductionStep, ProductionSummary } from '../components/ecommerce/ProductionCostModal';
import AddItemMultiStepModal from '../components/ecommerce/AddItemMultiStepModal';
import { getImageUrl } from '../utils/imageUtils';
import EmptyState from '../components/ui/EmptyState';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface NewOrderProps {
    subsidiary: Subsidiary;
    products: Product[];
    selectedCustomer?: Contact;
    onOrderPlaced: (newOrder: Omit<Order, 'id' | 'subsidiaryId'>) => void;
}

type CartItem = {
    lineId: string;
    product: Product;
    quantity: number;
    unitPrice: number;      // = finalPrice / quantity (prix par unité)
    discount: number;
    // Prix d'assemblage (montant) — pour certains services, coût de
    // finition/assemblage facturé après la production, distinct du prix
    // unitaire et non lié à une machine du workflow de production.
    assemblyPrice?: number;
    specValues?: SpecValues;
    productionSteps?: ProductionStep[];
    productionSummary?: ProductionSummary;
};

const NewOrder: React.FC<NewOrderProps> = ({ subsidiary, products: allProducts, selectedCustomer, onOrderPlaced }) => {
    const { t, formatCurrency } = useI18n();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // Modale unifiée multi-étapes (coût de production → specs)
    const [addItemModalState, setAddItemModalState] = useState<{
        product: Product;
        quantity: number;
        resolvedWorkflow: ResolvedWorkflow | null;
        schema: FormDefinition | null;
    } | null>(null);

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>(selectedCustomer?.id || '');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<CustomerPaymentMethod>(CustomerPaymentMethod.PAY_ON_DELIVERY);
    const [applyTax, setApplyTax] = useState(true);
    const [globalSearchTerm, setGlobalSearchTerm] = useState('');
    const [externalCustomer, setExternalCustomer] = useState<GlobalContactSearchResult | null>(null);

    useEffect(() => {
        if (selectedCustomer) setSelectedCustomerId(selectedCustomer.id);
    }, [selectedCustomer]);

    const filteredProducts = useMemo(() =>
        allProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase())
        ), [allProducts, searchTerm]
    );

    const { data: clients = [] } = useQuery<Contact[]>({
        queryKey: ['contacts', subsidiary.id],
        queryFn: getContacts,
    });

    const { data: taxRates = [] } = useQuery<TaxRate[]>({
        queryKey: ['taxes'],
        queryFn: getTaxes,
    });

    const { data: globalSearchResults = [] } = useQuery<GlobalContactSearchResult[]>({
        queryKey: ['contacts-global-search', globalSearchTerm],
        queryFn: () => searchContactsGlobal(globalSearchTerm),
        enabled: globalSearchTerm.trim().length >= 2,
    });

    // Données nécessaires pour ProductionCostModal — chargées une fois au montage
    const { data: configuredEquipments = [] } = useQuery<EquipmentWithCost[]>({
        queryKey: ['equipment-configured'],
        queryFn: () => getConfiguredEquipments(),
    });

    const { data: commercialParams = null } = useQuery<CommercialParams | null>({
        queryKey: ['commercial-params'],
        queryFn: getCommercialParams,
        retry: false,
    });

    const handleSelectExternalCustomer = (result: GlobalContactSearchResult) => {
        setExternalCustomer(result);
        setSelectedCustomerId(result.id);
        setGlobalSearchTerm('');
    };

    const handleQuantityChange = (productId: string, quantity: number) => {
        setQuantities(prev => ({ ...prev, [productId]: Math.max(0, isNaN(quantity) ? 0 : quantity) }));
    };

    // Commit final au panier (après production cost + specs optionnels)
    const commitAddToCart = (
        product: Product,
        quantity: number,
        productionResult: ProductionCostResult,
        specValues?: SpecValues,
    ) => {
        // finalPrice = prix total du lot → on divise par quantity pour obtenir le prix unitaire
        const unitPrice = quantity > 0 ? productionResult.summary.finalPrice / quantity : productionResult.summary.finalPrice;
        setCart(currentCart => {
            // Chaque configuration (specs ou production) distincte = ligne séparée
            if (specValues) {
                return [...currentCart, {
                    lineId: crypto.randomUUID(),
                    product, quantity, unitPrice, discount: 0,
                    specValues, productionSteps: productionResult.steps,
                    productionSummary: productionResult.summary,
                }];
            }
            // Même service, même coût de prod, pas de specs → fusionne si possible
            const existing = currentCart.find(item =>
                item.product.id === product.id &&
                !item.specValues &&
                Math.abs(item.unitPrice - unitPrice) < 0.01
            );
            if (existing) {
                return currentCart.map(item =>
                    item.lineId === existing.lineId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...currentCart, {
                lineId: crypto.randomUUID(),
                product, quantity, unitPrice, discount: 0,
                productionSteps: productionResult.steps,
                productionSummary: productionResult.summary,
            }];
        });
        setQuantities(prev => ({ ...prev, [product.id]: 0 }));
    };

    // Clic "Ajouter" → résolution workflow + schema en parallèle → ouverture modale unifiée
    const handleAddToCart = async (product: Product) => {
        const quantity = quantities[product.id] || 0;
        if (quantity <= 0) return;

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

        setAddItemModalState({ product, quantity, resolvedWorkflow: resolved, schema });
    };

    // Confirmation finale de la modale unifiée
    const handleAddItemConfirm = (result: ProductionCostResult, specValues?: SpecValues) => {
        if (!addItemModalState) return;
        commitAddToCart(addItemModalState.product, addItemModalState.quantity, result, specValues);
        setAddItemModalState(null);
    };

    const updateCartQuantity = (lineId: string, newQuantity: number) => {
        const clamped = Math.max(0, newQuantity);
        setCart(currentCart =>
            clamped <= 0
                ? currentCart.filter(item => item.lineId !== lineId)
                : currentCart.map(item => item.lineId === lineId ? { ...item, quantity: clamped } : item)
        );
    };

    const updateCartDiscount = (lineId: string, newDiscount: number) => {
        const clamped = isNaN(newDiscount) ? 0 : Math.max(0, newDiscount);
        setCart(currentCart => currentCart.map(item =>
            item.lineId === lineId ? { ...item, discount: clamped } : item
        ));
    };

    const updateCartAssemblyPrice = (lineId: string, newAssemblyPrice: number) => {
        const clamped = isNaN(newAssemblyPrice) ? 0 : Math.max(0, newAssemblyPrice);
        setCart(currentCart => currentCart.map(item =>
            item.lineId === lineId ? { ...item, assemblyPrice: clamped } : item
        ));
    };

    const subtotal = useMemo(() =>
        cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity - item.discount + (item.assemblyPrice || 0)), 0),
        [cart]
    );

    // Le taux vient toujours du backend (taxe par défaut configurée) — aucune
    // valeur métier en dur ici ; { rate: 0, id: '' } n'est qu'un état de
    // chargement neutre le temps que taxRates arrive.
    const defaultTaxRate = useMemo(() => taxRates.find(t => t.isDefault) || { rate: 0, id: '' }, [taxRates]);
    const taxAmount = useMemo(() => applyTax ? subtotal * defaultTaxRate.rate : 0, [subtotal, defaultTaxRate, applyTax]);
    const totalAmount = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

    const handleSubmitOrder = () => {
        const customer = clients.find(c => c.id === selectedCustomerId)
            || (externalCustomer?.id === selectedCustomerId ? externalCustomer : null);
        if (!customer) return;

        const paymentDueDate = new Date();
        paymentDueDate.setDate(paymentDueDate.getDate() + 30);

        const buildItems = () => cart.map(item => ({
            product: item.product,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            assemblyPrice: item.assemblyPrice,
            specValues: item.specValues,
            productionSteps: item.productionSteps,
            productionSummary: item.productionSummary,
        }));

        const newOrderData = {
            orderId: `ORD-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            customerId: customer.id,
            customerName: customer.contactName,
            items: buildItems(),
            orderItems: buildItems(),
            subtotal,
            taxAmount,
            totalAmount,
            taxRateId: defaultTaxRate.id,
            taxRateValue: applyTax ? defaultTaxRate.rate : 0,
            applyTax,
            paymentDueDate: paymentDueDate.toISOString().split('T')[0],
            status: OrderStatus.NEW,
            productionStatus: ProductionStatus.PREPRESS,
            paymentStatus: PaymentStatus.UNPAID,
            amountPaid: 0,
            productionHistory: [{ status: ProductionStatus.PREPRESS, date: new Date().toISOString() }],
            paymentMethod: selectedPaymentMethod,
        };

        onOrderPlaced(newOrderData);

        setOrderPlaced(true);
        setCart([]);
        setTimeout(() => {
            setOrderPlaced(false);
            setSelectedCustomerId(selectedCustomer?.id || '');
        }, 4000);
    };

    const clientOptions = useMemo(() =>
        clients.map(c => ({ value: c.id, label: `${c.contactName} (${c.company || 'N/A'})` })),
        [clients]
    );

    return (
        <div className="grid grid-cols-12 gap-6">
            {/* Catalogue */}
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
                                    <th scope="col" className="px-4 py-3 text-center">{t('newOrder.quantity')}</th>
                                    <th scope="col" className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredProducts.length === 0 ? (
                                    <tr><td colSpan={4}><EmptyState icon="search" title={t('filter.noResults')} /></td></tr>
                                ) : filteredProducts.map(product => (
                                    <tr key={product.id}>
                                        <td className="px-4 py-3">
                                            <div className="h-12 w-12 rounded-md overflow-hidden bg-slate-100">
                                                <LazyLoadImage
                                                    src={product.productImages?.length ? getImageUrl(product.productImages[0].imageUrl) : 'https://via.placeholder.com/100'}
                                                    alt={product.name}
                                                    effect="blur"
                                                    width="100%"
                                                    height="100%"
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-800">{product.name}</div>
                                            <div className="text-xs text-slate-500 max-w-xs">{product.description}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min="0"
                                                value={quantities[product.id] || ''}
                                                onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value, 10))}
                                                className="w-20 p-1 text-center border rounded-md border-slate-300"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleAddToCart(product)}
                                                disabled={!(quantities[product.id] > 0)}
                                                className="px-3 py-1 text-xs font-semibold rounded-md transition-colors bg-[#c6e911] text-slate-800 hover:bg-[#adc40f] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                                            >
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

            {/* Panier */}
            <div className="col-span-12 lg:col-span-5 bg-white p-6 rounded-xl shadow-md flex flex-col">
                {!selectedCustomer && (
                    <div className="mb-4 space-y-2">
                        {externalCustomer && selectedCustomerId === externalCustomer.id ? (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-800">{externalCustomer.contactName}</p>
                                    <p className="text-xs text-blue-700">{externalCustomer.subsidiary.subsidiaryName}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setExternalCustomer(null); setSelectedCustomerId(''); }}
                                    className="text-xs text-red-600 hover:underline"
                                >
                                    {t('common.cancel')}
                                </button>
                            </div>
                        ) : (
                            <SelectFilter
                                label={t('filter.client')}
                                name="customer"
                                value={selectedCustomerId}
                                onChange={(e) => setSelectedCustomerId(e.target.value)}
                                options={clientOptions}
                                placeholder={t('cashRegister.clientSection.selectAdd')}
                            />
                        )}
                        <div className="relative">
                            <input
                                type="text"
                                value={globalSearchTerm}
                                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                                placeholder={t('newOrder.searchClientOtherSubsidiary')}
                                className="w-full text-sm px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911]"
                            />
                            {globalSearchTerm.trim().length >= 2 && globalSearchResults.length > 0 && (
                                <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {globalSearchResults.map(result => (
                                        <li key={result.id}>
                                            <button
                                                type="button"
                                                onClick={() => handleSelectExternalCustomer(result)}
                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                                            >
                                                <span className="font-medium text-slate-800">{result.contactName}</span>
                                                <span className="block text-xs text-slate-500">{result.email} — {result.subsidiary.subsidiaryName}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

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
                                <li key={item.lineId} className="py-3 flex items-start gap-3">
                                    <div className="flex-grow">
                                        <p className="font-semibold text-slate-800">{item.product.name}</p>
                                        <div className="flex items-center space-x-2 text-sm text-slate-500">
                                            <span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
                                            <span className="font-bold text-slate-700">{formatCurrency(item.unitPrice * item.quantity - item.discount + (item.assemblyPrice || 0))}</span>
                                        </div>
                                        {/* Badge coût de production */}
                                        {item.productionSummary && (
                                            <div className="mt-1 text-xs text-slate-400">
                                                Coût prod. {formatCurrency(item.productionSummary.totalProductionCost)} · Marge {item.productionSummary.marginPercent}%
                                            </div>
                                        )}
                                        {item.specValues && Object.keys(item.specValues).length > 0 && (
                                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                                                {Object.values(item.specValues).filter(v => v !== '' && v != null).join(' · ')}
                                            </p>
                                        )}
                                        <div className="flex items-center space-x-2 mt-1">
                                            <label className="text-xs text-slate-500">{t('newOrder.discount')}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.discount || ''}
                                                onChange={(e) => updateCartDiscount(item.lineId, parseFloat(e.target.value))}
                                                className="w-20 p-0.5 text-xs text-center border rounded-md border-slate-300"
                                                placeholder="0"
                                            />
                                        </div>
                                        {/* Prix d'assemblage — pour certains services, coût de finition facturé
                                            après la production, distinct du prix unitaire (voir types/models.ts::OrderItem). */}
                                        <div className="flex items-center space-x-2 mt-1">
                                            <label className="text-xs text-slate-500">{t('newOrder.assemblyPrice')}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.assemblyPrice || ''}
                                                onChange={(e) => updateCartAssemblyPrice(item.lineId, parseFloat(e.target.value))}
                                                className="w-20 p-0.5 text-xs text-center border rounded-md border-slate-300"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 shrink-0">
                                        <button onClick={() => updateCartQuantity(item.lineId, item.quantity - 1)} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"><IconMinus className="h-4 w-4" /></button>
                                        <span className="text-sm font-bold text-slate-700 w-7 text-center">{item.quantity}</span>
                                        <button onClick={() => updateCartQuantity(item.lineId, item.quantity + 1)} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"><IconPlus className="h-4 w-4" /></button>
                                        <button onClick={() => updateCartQuantity(item.lineId, 0)} className="p-1 rounded-full hover:bg-red-100 text-red-400 ml-1"><IconDelete className="h-4 w-4" /></button>
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
                    <label className="flex items-center justify-between text-sm cursor-pointer">
                        <span className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={applyTax}
                                onChange={(e) => setApplyTax(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-[#c6e911] focus:ring-[#c6e911]"
                            />
                            {t('invoice.tax')} {applyTax && `(${(defaultTaxRate.rate * 100).toFixed(2)}%)`}
                        </span>
                        <span>{formatCurrency(taxAmount)}</span>
                    </label>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                        <span>{t('newOrder.total')}</span>
                        <span>{formatCurrency(totalAmount)}</span>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('newOrder.paymentMethod')}
                        </label>
                        <select
                            value={selectedPaymentMethod}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value as CustomerPaymentMethod)}
                            className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                        >
                            <option value={CustomerPaymentMethod.PAY_ON_DELIVERY}>{t('newOrder.paymentMethod_PAY_ON_DELIVERY')}</option>
                            <option value={CustomerPaymentMethod.CARD}>{t('newOrder.paymentMethod_CARD')}</option>
                            <option value={CustomerPaymentMethod.ORANGE_MONEY}>{t('newOrder.paymentMethod_ORANGE_MONEY')}</option>
                            <option value={CustomerPaymentMethod.WAVE}>{t('newOrder.paymentMethod_WAVE')}</option>
                            <option value={CustomerPaymentMethod.MOBILE_MONEY}>{t('newOrder.paymentMethod_MOBILE_MONEY')}</option>
                            <option value={CustomerPaymentMethod.PAYCAAP}>{t('newOrder.paymentMethod_PAYCAAP')}</option>
                            <option value={CustomerPaymentMethod.CUSTOMER_CREDIT}>{t('newOrder.paymentMethod_CUSTOMER_CREDIT')}</option>
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

            {/* Modale unifiée multi-étapes */}
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

export default NewOrder;
