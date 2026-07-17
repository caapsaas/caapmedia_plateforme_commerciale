import React, { useState, useEffect } from 'react';
import { Product, Contact, CustomerPaymentMethod } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { getProducts, getProductsBySubsidiary } from '../../services/apiE-commerce/apiProducts';
import { getContacts } from '../../services/apiCrm/apicontacts';
import { createOrderBySalesRepJson } from '../../services/apiE-commerce/apiOrders';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  options?: { optionType: string; optionValue: string }[];
}

const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t, formatCurrency } = useI18n();
  const toast = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState<OrderItem[]>([{ productId: '', quantity: 1, unitPrice: 0 }]);
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<CustomerPaymentMethod>(CustomerPaymentMethod.CARD);
  const [isFormValid, setIsFormValid] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => {
      try {
        const result = await getProductsBySubsidiary();
        return result || [];
      } catch {
        return [];
      }
    },
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-all'],
    queryFn: () => getContacts(),
  });

  const { mutate: submitOrder, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      if (!items[0].productId) {
        throw new Error('Veuillez sélectionner un produit');
      }
      if (!customerName && !customerId) {
        throw new Error('Veuillez sélectionner un client');
      }
      if (!paymentDueDate) {
        throw new Error('Veuillez sélectionner une date de paiement');
      }

      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          options: item.options,
        })),
        customerName: customerName || contacts.find(c => c.id === customerId)?.contactName || '',
        paymentDueDate: new Date(paymentDueDate).toISOString(),
        paymentMethod,
        source: 'ECOMMERCE',
      };

      return createOrderBySalesRepJson({
        ...orderData,
        customerId: customerId || '',
      });
    },
    onSuccess: () => {
      toast.success('Succès', 'Commande créée avec succès');
      resetForm();
      onClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Erreur lors de la création de la commande';
      toast.error('Erreur', message);
    },
  });

  useEffect(() => {
    validateForm();
  }, [items, customerName, customerId, paymentDueDate, paymentMethod]);

  const validateForm = () => {
    const hasValidItem = items.some(item => item.productId && item.quantity > 0 && item.unitPrice > 0);
    const hasCustomer = customerName.trim() !== '' || customerId.trim() !== '';
    const hasPaymentDate = paymentDueDate !== '';
    setIsFormValid(hasValidItem && hasCustomer && hasPaymentDate);
  };

  const resetForm = () => {
    setItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
    setCustomerName('');
    setCustomerId('');
    setPaymentDueDate('');
    setPaymentMethod(CustomerPaymentMethod.CARD);
  };

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].productId = value;
        newItems[index].unitPrice = product.sellingPrice || 0;
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#c6e911] to-[#a8c000] p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Nouvelle Commande</h2>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 p-1 rounded-full hover:bg-white/20"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Client Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Client</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sélectionner un client existant
                </label>
                <select
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    if (e.target.value) {
                      const selected = contacts.find(c => c.id === e.target.value);
                      setCustomerName(selected?.contactName || '');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                >
                  <option value="">-- Sélectionner --</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.contactName} {c.company && `(${c.company})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ou entrer le nom du client
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nom du client"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Articles de la commande</h3>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-slate-50">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-medium text-slate-700">Article {index + 1}</span>
                    {items.length > 1 && (
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Produit *
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                      >
                        <option value="">-- Sélectionner un produit --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.productName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Quantité *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Prix unitaire *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Sous-total
                      </label>
                      <div className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddItem}
              className="w-full py-2 px-4 border-2 border-dashed border-[#c6e911] text-[#c6e911] font-semibold rounded-lg hover:bg-[#c6e911]/10 transition-colors"
            >
              + Ajouter un article
            </button>
          </div>

          {/* Payment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Paiement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mode de paiement *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as CustomerPaymentMethod)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                >
                  <option value={CustomerPaymentMethod.CARD}>Carte bancaire</option>
                  <option value={CustomerPaymentMethod.BANK_TRANSFER}>Virement bancaire</option>
                  <option value={CustomerPaymentMethod.PAY_ON_DELIVERY}>Paiement à la livraison</option>
                  <option value={CustomerPaymentMethod.CUSTOMER_CREDIT}>Crédit client</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date limite de paiement *
                </label>
                <input
                  type="date"
                  value={paymentDueDate}
                  onChange={(e) => setPaymentDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-100 p-4 rounded-lg">
            <div className="flex justify-between items-center text-lg font-bold text-slate-900">
              <span>Total HT:</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => submitOrder()}
            disabled={!isFormValid || isSubmitting}
            className={`px-6 py-2 font-semibold rounded-lg transition-colors ${
              isFormValid && !isSubmitting
                ? 'bg-[#c6e911] text-slate-900 hover:bg-[#b8d60a]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Création en cours...' : 'Créer la commande'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewOrderModal;
