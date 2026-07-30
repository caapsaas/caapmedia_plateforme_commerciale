import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../../i18n';
import { Lead } from '../../types';
import { createProforma, CreateProformaData, ProformaItem } from '../../services/apiCrm/apiProformas';
import { getProducts } from '../../services/apiE-commerce/apiProducts';
import IconPlus from '../icons/IconPlus';
import IconDelete from '../icons/IconDelete';
import IconCheckCircle from '../icons/IconCheckCircle';

interface CreateProformaModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
}

const CreateProformaModal: React.FC<CreateProformaModalProps> = ({ isOpen, onClose, leads }) => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [taxRate, setTaxRate] = useState(18);
  const [validityDays, setValidityDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ProformaItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(1),
  });

  const mutation = useMutation({
    mutationFn: (data: CreateProformaData) => createProforma(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformas'] });
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    },
  });

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      setClientName(lead.leadName);
      setClientEmail(lead.email);
      setClientPhone(lead.phone);
      setClientCompany(lead.company);
    }
  };

  const handleAddProduct = () => {
    if (!selectedProductId || quantity <= 0 || unitPrice <= 0) return;

    const newItem: ProformaItem = {
      productId: selectedProductId,
      quantity,
      unitPrice,
      description: '',
    };

    setItems([...items, newItem]);
    setSelectedProductId('');
    setQuantity(1);
    setUnitPrice(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    };
  };

  const handleSubmit = () => {
    if (!selectedLeadId || !clientName || !clientEmail || items.length === 0) {
      alert('Veuillez remplir tous les champs requis et ajouter au moins un article');
      return;
    }

    mutation.mutate({
      leadId: selectedLeadId,
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      items,
      taxRate,
      validityDays,
      notes,
    });
  };

  const resetForm = () => {
    setSelectedLeadId('');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setClientCompany('');
    setTaxRate(18);
    setValidityDays(30);
    setNotes('');
    setItems([]);
    setSelectedProductId('');
    setQuantity(1);
    setUnitPrice(0);
    setIsSuccess(false);
  };

  const { subtotal, taxAmount, total } = calculateTotal();
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-slate-800">
            {isSuccess ? '✅ Proforma Créée' : 'Créer une Proforma'}
          </h2>
          {!isSuccess && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100"
            >
              ✕
            </button>
          )}
        </div>

        {isSuccess ? (
          <div className="p-8 text-center">
            <IconCheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <p className="text-slate-600">La proforma a été créée avec succès!</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Sélection du Lead */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sélectionner un Lead *
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => handleSelectLead(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
              >
                <option value="">-- Choisir un lead --</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.leadName} ({lead.company})
                  </option>
                ))}
              </select>
            </div>

            {/* Informations Client */}
            {selectedLeadId && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nom Client *
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Entreprise
                  </label>
                  <input
                    type="text"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                  />
                </div>
              </div>
            )}

            {/* Ajouter des Articles */}
            {selectedLeadId && (
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Articles (Produits) *</h3>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Produit
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        setSelectedProductId(e.target.value);
                        const prod = products.find((p) => p.id === e.target.value);
                        if (prod) setUnitPrice(prod.sellingPrice);
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                    >
                      <option value="">-- Choisir un produit --</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.productName} ({prod.mainCategory})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Quantité
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Prix Unitaire (FCFA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleAddProduct}
                        className="w-full px-4 py-2 bg-[#c6e911] text-slate-800 font-semibold rounded-md hover:bg-[#adc40f] flex items-center justify-center gap-2"
                      >
                        <IconPlus className="h-4 w-4" />
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>

                {/* Liste des articles */}
                {items.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Produit</th>
                          <th className="text-right py-2">Qty</th>
                          <th className="text-right py-2">Prix Unit</th>
                          <th className="text-right py-2">Total</th>
                          <th className="text-center py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => {
                          const prod = products.find((p) => p.id === item.productId);
                          return (
                            <tr key={idx} className="border-b">
                              <td className="py-2">{prod?.productName}</td>
                              <td className="text-right">{item.quantity}</td>
                              <td className="text-right">{item.unitPrice.toLocaleString()}</td>
                              <td className="text-right font-semibold">
                                {(item.quantity * item.unitPrice).toLocaleString()}
                              </td>
                              <td className="text-center">
                                <button
                                  onClick={() => handleRemoveItem(idx)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <IconDelete className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Conditions */}
            {selectedLeadId && (
              <div className="border-t pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Taux de TVA (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Validité (jours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={validityDays}
                      onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes / Conditions Spéciales
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                    placeholder="Ex: Délai de livraison, conditions de paiement, etc."
                  />
                </div>
              </div>
            )}

            {/* Résumé */}
            {selectedLeadId && items.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Sous-total :</span>
                  <span className="font-semibold">{subtotal.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA ({taxRate}%) :</span>
                  <span className="font-semibold">{taxAmount.toLocaleString()} FCFA</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg">
                  <span className="font-bold">Total :</span>
                  <span className="font-bold text-[#c6e911]">{total.toLocaleString()} FCFA</span>
                </div>
              </div>
            )}
          </div>
        )}

        {!isSuccess && (
          <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-100"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="px-6 py-2 bg-[#c6e911] text-slate-800 font-bold rounded-lg hover:bg-[#adc40f] disabled:bg-slate-400"
            >
              {mutation.isPending ? 'Création...' : 'Créer Proforma'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateProformaModal;
