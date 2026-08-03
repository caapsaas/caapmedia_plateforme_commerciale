import React, { useState } from 'react';
import { Subsidiary, StockItem, PurchaseOrderItem, PaymentTerms, Supplier } from '../../types';
import { useI18n } from '../../i18n';
import IconDelete from '../icons/IconDelete';
import { CreatePurchaseOrderDto } from '../../services/apiPurchasing/apiPurchase_order';
import { getSuppliersPaginated } from '../../services/apiPurchasing/apiSupplier';
import { getStockItemsPaginated } from '../../services/apiPurchasing/apiStockItems';
import { AsyncSelect } from '../ui/AsyncSelect';

interface PurchaseOrderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreatePurchaseOrderDto) => void;
    subsidiaryId: string;
}

const PurchaseOrderFormModal: React.FC<PurchaseOrderFormModalProps> = ({ isOpen, onClose, onSave, subsidiaryId }) => {
    const { t, formatCurrency } = useI18n();
    const [supplierId, setSupplierId] = useState('');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(PaymentTerms.CREDIT);
    const [items, setItems] = useState<PurchaseOrderItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedProductData, setSelectedProductData] = useState<StockItem | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [purchasePrice, setPurchasePrice] = useState(0);
    const [purchaseUnitId, setPurchaseUnitId] = useState('');

    // Unité de base (pas de conversion) + unités d'emballage disponibles pour ce produit (Chantier 2).
    const availablePurchaseUnits = selectedProductData
        ? [
            ...(selectedProductData.baseUnit ? [{ id: '', name: selectedProductData.baseUnit.name }] : []),
            ...(selectedProductData.packagingUnits ?? []).map(pu => ({ id: pu.unitId, name: pu.unit.name })),
        ]
        : [];

    const handleAddProduct = () => {
        if (!selectedProduct || quantity <= 0 || purchasePrice <= 0) return;
        const product = selectedProductData;
        if (!product) return;

        setItems(prev => [...prev, {
            productId: product.id,
            productName: product.name,
            quantity,
            purchasePrice,
            quantityReceived: 0,
            purchaseUnitId: purchaseUnitId || undefined,
            purchaseUnit: availablePurchaseUnits.find(u => u.id === purchaseUnitId) as PurchaseOrderItem['purchaseUnit'],
        }]);

        // Reset fields
        setSelectedProduct('');
        setSelectedProductData(null);
        setQuantity(1);
        setPurchasePrice(0);
        setPurchaseUnitId('');
    };

    const handleRemoveItem = (productId: string) => {
        setItems(prev => prev.filter(item => item.productId !== productId));
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId || items.length === 0) return;
        
        onSave({
            supplierId,
            expectedDeliveryDate,
            paymentTerms,
            items,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-bold text-slate-900">{t('purchasing.modal.addTitle')}</h3>
                    </div>
                    <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                        {/* PO Header */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <AsyncSelect<Supplier>
                                    queryKey="po-form-suppliers"
                                    label={t('purchasing.form.supplier')}
                                    placeholder={t('purchasing.form.selectSupplier')}
                                    value={supplierId || undefined}
                                    onChange={value => setSupplierId(value || '')}
                                    getOptionLabel={s => s.supplierName}
                                    getOptionValue={s => s.id}
                                    fetcher={({ page, limit, search }) => getSuppliersPaginated({ page, limit, search, subsidiaryId })}
                                />
                            </div>
                            <div>
                                <label htmlFor="paymentTerms" className="block text-sm font-medium text-slate-700">{t('purchasing.form.paymentTerms')}</label>
                                <select id="paymentTerms" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value as PaymentTerms)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                    <option value={PaymentTerms.IMMEDIATE}>{t('purchasing.terms_IMMEDIATE')}</option>
                                    <option value={PaymentTerms.CREDIT}>{t('purchasing.terms_CREDIT')}</option>
                                    <option value={PaymentTerms.DRAFT_PAYMENT}>{t('purchasing.terms_DRAFT_PAYMENT')}</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="orderDate" className="block text-sm font-medium text-slate-700">{t('purchasing.form.orderDate')}</label>
                                <input type="date" id="orderDate" value={orderDate} onChange={e => setOrderDate(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="expectedDeliveryDate" className="block text-sm font-medium text-slate-700">{t('purchasing.form.deliveryDate')}</label>
                                <input type="date" id="expectedDeliveryDate" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                        </div>

                        {/* Add Item Section */}
                        <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                             <h4 className="font-semibold text-slate-700">{t('purchasing.form.addProduct')}</h4>
                             <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                                <div className="md:col-span-2">
                                     <AsyncSelect<StockItem>
                                        queryKey="po-form-stock-items"
                                        placeholder={t('purchasing.form.selectProduct')}
                                        value={selectedProduct || undefined}
                                        onChange={(value, option) => {
                                            setSelectedProduct(value || '');
                                            setSelectedProductData(option || null);
                                            setPurchasePrice(option?.price || 0);
                                            setPurchaseUnitId('');
                                        }}
                                        getOptionLabel={p => p.name}
                                        getOptionValue={p => p.id}
                                        fetcher={({ page, limit, search }) => getStockItemsPaginated({ page, limit, search, subsidiaryId })}
                                    />
                                </div>
                                <div>
                                     <label htmlFor="purchaseUnit" className="sr-only">{t('purchasing.form.purchaseUnit')}</label>
                                     <select id="purchaseUnit" value={purchaseUnitId} onChange={e => setPurchaseUnitId(e.target.value)} disabled={!selectedProduct} className="w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border disabled:bg-slate-100">
                                        {availablePurchaseUnits.map(u => <option key={u.id || 'base'} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                     <label htmlFor="purchasePrice" className="sr-only">{t('purchasing.form.purchasePrice')}</label>
                                     <input type="number" placeholder={t('purchasing.form.purchasePrice')} value={purchasePrice} onChange={e => setPurchasePrice(Number(e.target.value))} className="w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border" />
                                </div>
                                <div>
                                     <label htmlFor="quantity" className="sr-only">{t('purchasing.form.quantity')}</label>
                                     <input type="number" placeholder={t('purchasing.form.quantity')} value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border" />
                                </div>
                             </div>
                             <button type="button" onClick={handleAddProduct} className="w-full py-2 bg-[#c6e911] text-white rounded-md hover:bg-[#a8c70f] transition-colors">{t('purchasing.form.addProduct')}</button>
                        </div>

                        {/* Items Table */}
                        <div>
                            <h4 className="font-semibold text-slate-700 mb-2">{t('purchasing.form.orderSummary')}</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-2">{t('purchasing.form.product')}</th>
                                            <th className="px-4 py-2">{t('purchasing.form.quantity')}</th>
                                            <th className="px-4 py-2 text-right">{t('purchasing.form.purchasePrice')}</th>
                                            <th className="px-4 py-2 text-right">{t('purchasing.form.total')}</th>
                                            <th className="px-4 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {items.map(item => (
                                            <tr key={item.productId}>
                                                <td className="px-4 py-2 font-medium">{item.productName}</td>
                                                <td className="px-4 py-2 text-center">{item.quantity}{item.purchaseUnit ? ` ${item.purchaseUnit.name}` : ''}</td>
                                                <td className="px-4 py-2 text-right">{formatCurrency(item.purchasePrice)}</td>
                                                <td className="px-4 py-2 text-right font-semibold">{formatCurrency(item.quantity * item.purchasePrice)}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <button type="button" onClick={() => handleRemoveItem(item.productId)}>
                                                        <IconDelete className="h-4 w-4 text-red-500 hover:text-red-700" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-bold bg-slate-100">
                                            <td colSpan={3} className="text-right px-4 py-2">{t('purchasing.form.total')}</td>
                                            <td className="text-right px-4 py-2">{formatCurrency(totalAmount)}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                        <button type="submit" disabled={items.length === 0 || !supplierId} className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] disabled:bg-slate-400 transition-colors">{t('common.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PurchaseOrderFormModal;