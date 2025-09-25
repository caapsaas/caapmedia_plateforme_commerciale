import React, { useState, useEffect } from 'react';
import { Subsidiary, Product, PurchaseOrder, PurchaseOrderItem, PaymentTerms, PurchaseOrderStatus, PaymentStatus } from '../../types';
import { MOCK_SUPPLIERS } from '../../constants';
import { useI18n } from '../../i18n';
import IconDelete from '../icons/IconDelete';

interface PurchaseOrderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (po: Omit<PurchaseOrder, 'id' | 'subsidiaryId'>) => void;
    subsidiary: Subsidiary;
    products: Product[];
}

const PurchaseOrderFormModal: React.FC<PurchaseOrderFormModalProps> = ({ isOpen, onClose, onSave, subsidiary, products }) => {
    const { t, formatCurrency } = useI18n();
    const [supplierId, setSupplierId] = useState('');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(PaymentTerms.CREDIT);
    const [items, setItems] = useState<PurchaseOrderItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [purchasePrice, setPurchasePrice] = useState(0);

    const suppliers = MOCK_SUPPLIERS.filter(s => s.subsidiaryId === subsidiary.id);

    const handleAddProduct = () => {
        if (!selectedProduct || quantity <= 0 || purchasePrice <= 0) return;
        const product = products.find(p => p.id === selectedProduct);
        if (!product) return;

        setItems(prev => [...prev, {
            productId: product.id,
            productName: product.name,
            quantity,
            purchasePrice,
            quantityReceived: 0,
        }]);

        // Reset fields
        setSelectedProduct('');
        setQuantity(1);
        setPurchasePrice(0);
    };

    const handleRemoveItem = (productId: string) => {
        setItems(prev => prev.filter(item => item.productId !== productId));
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier || items.length === 0) return;
        
        onSave({
            supplierId,
            supplierName: supplier.name,
            orderDate,
            expectedDeliveryDate,
            items,
            totalAmount,
            status: PurchaseOrderStatus.ORDERED,
            paymentTerms,
            paymentStatus: PaymentStatus.UNPAID,
            amountPaid: 0,
            history: [{ date: orderDate, event: 'Commande créée.' }]
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
                                <label htmlFor="supplierId" className="block text-sm font-medium text-slate-700">{t('purchasing.form.supplier')}</label>
                                <select id="supplierId" value={supplierId} onChange={e => setSupplierId(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                    <option value="" disabled>{t('purchasing.form.selectSupplier')}</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="paymentTerms" className="block text-sm font-medium text-slate-700">{t('purchasing.form.paymentTerms')}</label>
                                <select id="paymentTerms" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value as PaymentTerms)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                    <option value={PaymentTerms.IMMEDIATE}>{t('purchasing.terms_IMMEDIATE')}</option>
                                    <option value={PaymentTerms.CREDIT}>{t('purchasing.terms_CREDIT')}</option>
                                    <option value={PaymentTerms.DRAFT_PAYMENT}>{t('purchasing.terms_DRAFT_PAYMENT')}</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="orderDate" className="block text-sm font-medium text-slate-700">{t('purchasing.form.orderDate')}</label>
                                <input type="date" id="orderDate" value={orderDate} onChange={e => setOrderDate(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="expectedDeliveryDate" className="block text-sm font-medium text-slate-700">{t('purchasing.form.deliveryDate')}</label>
                                <input type="date" id="expectedDeliveryDate" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                            </div>
                        </div>

                        {/* Add Item Section */}
                        <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                             <h4 className="font-semibold text-slate-700">{t('purchasing.form.addProduct')}</h4>
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <div className="md:col-span-2">
                                     <label htmlFor="product" className="sr-only">{t('purchasing.form.product')}</label>
                                     <select id="product" value={selectedProduct} onChange={e => { setPurchasePrice(products.find(p => p.id === e.target.value)?.price || 0); setSelectedProduct(e.target.value); }} className="w-full border-slate-300 rounded-md shadow-sm">
                                        <option value="">{t('purchasing.form.selectProduct')}</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                     <label htmlFor="purchasePrice" className="sr-only">{t('purchasing.form.purchasePrice')}</label>
                                     <input type="number" placeholder={t('purchasing.form.purchasePrice')} value={purchasePrice} onChange={e => setPurchasePrice(Number(e.target.value))} className="w-full border-slate-300 rounded-md shadow-sm" />
                                </div>
                                <div>
                                     <label htmlFor="quantity" className="sr-only">{t('purchasing.form.quantity')}</label>
                                     <input type="number" placeholder={t('purchasing.form.quantity')} value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full border-slate-300 rounded-md shadow-sm" />
                                </div>
                             </div>
                             <button type="button" onClick={handleAddProduct} className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">{t('purchasing.form.addProduct')}</button>
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
                                                <td className="px-4 py-2 text-center">{item.quantity}</td>
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