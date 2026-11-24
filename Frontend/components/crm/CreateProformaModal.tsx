import { Check, FileText, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../../i18n';
import { Lead, Product, TaxRate } from '../../types';
import {
  createProforma,
  updateProforma,
  CreateProformaData,
  ProformaItem,
  Proforma,
} from '../../services/apiCrm/apiProformas';
import { getLeadsPaginated } from '../../services/apiCrm/apiCrm';
import { getProductsPaginated } from '../../services/apiE-commerce/apiProducts';
import { getTaxes } from '../../services/apiE-commerce/apitaxes';
import IconPlus from '../icons/IconPlus';
import IconDelete from '../icons/IconDelete';
import IconCheckCircle from '../icons/IconCheckCircle';
import { AsyncSelect } from '../ui/AsyncSelect';

const steps = ['client', 'items', 'terms', 'review'] as const;

interface CreateProformaModalProps {
  isOpen: boolean;
  onClose: () => void;
  proformaToEdit?: Proforma | null;
}

const CreateProformaModal: React.FC<CreateProformaModalProps> = ({ isOpen, onClose, proformaToEdit = null }) => {
  const { t, formatCurrency, language } = useI18n();
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const isEditMode = !!proformaToEdit;
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  // Le taux de TVA par défaut vient toujours du backend (module taxes) ; 0 ici
  // n'est qu'un état de chargement neutre le temps que taxRates arrive.
  const [taxRate, setTaxRate] = useState(0);
  const [taxRateTouched, setTaxRateTouched] = useState(false);
  const [validityDays, setValidityDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ProformaItem[]>([]);
  const [productLabels, setProductLabels] = useState<Record<string, string>>({});
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: taxRates = [] } = useQuery<TaxRate[]>({
    queryKey: ['taxes'],
    queryFn: getTaxes,
  });

  // Pré-remplit le taux de TVA avec le taux par défaut configuré côté backend
  // dès qu'il est chargé — tant que le commercial n'a pas modifié le champ.
  useEffect(() => {
    if (taxRateTouched || isEditMode) return;
    const defaultRate = taxRates.find((t) => t.isDefault);
    if (defaultRate) setTaxRate(defaultRate.rate * 100);
  }, [taxRates, taxRateTouched, isEditMode]);

  // Pré-remplissage en mode édition — le lead n'est volontairement pas
  // modifiable (le backend n'accepte pas leadId sur update-proforma.dto.ts).
  useEffect(() => {
    if (!isOpen) return;
    if (!proformaToEdit) return;

    setSelectedLeadId(proformaToEdit.leadId);
    setClientName(proformaToEdit.clientName);
    setClientEmail(proformaToEdit.clientEmail);
    setClientPhone(proformaToEdit.clientPhone);
    setClientCompany(proformaToEdit.clientCompany || '');
    setTaxRate(Number(proformaToEdit.taxRate));
    setTaxRateTouched(true);
    setNotes(proformaToEdit.notes || '');
    setItems(
      (proformaToEdit.items || []).map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        description: item.description || '',
      })),
    );
    setProductLabels((prev) => {
      const next = { ...prev };
      for (const item of proformaToEdit.items || []) {
        if (item.product) next[item.productId] = `${item.product.name} (${item.product.category})`;
      }
      return next;
    });
  }, [isOpen, proformaToEdit]);

  const mutation = useMutation({
    mutationFn: (data: CreateProformaData) =>
      isEditMode ? updateProforma(proformaToEdit!.id, data) : createProforma(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformas'] });
      setIsSuccess(true);
    },
  });

  const handleSelectLead = (leadId: string | undefined, lead?: Lead) => {
    setSelectedLeadId(leadId ?? '');
    setSelectedLead(lead ?? null);
    if (lead) {
      setClientName(lead.leadName);
      setClientEmail(lead.email ?? '');
      setClientPhone(lead.phone ?? '');
      setClientCompany(lead.company);
    }
  };

  const handleSelectProduct = (productId: string | undefined, product?: Product) => {
    setSelectedProductId(productId ?? '');
    setSelectedProduct(product ?? null);
    if (product) {
      setProductLabels((prev) => ({ ...prev, [product.id]: `${product.name} (${product.category})` }));
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
    setSelectedProduct(null);
    setQuantity(1);
    setUnitPrice(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const total = Math.round(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) * 100) / 100;
    const taxAmount = taxRate > 0 ? Math.round(((total * taxRate) / (100 + taxRate)) * 100) / 100 : 0;
    const subtotal = total - taxAmount;
    return {
      subtotal,
      taxAmount,
      total,
    };
  };

  const handleNext = () => {
    if (
      step === 0 &&
      (!selectedLeadId ||
        !clientName.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim()) ||
        !clientPhone.trim())
    ) {
      setStepError(t('proforma.form.clientRequired'));
      return;
    }
    if (step === 1 && items.length === 0) {
      setStepError(t('proforma.form.itemsRequired'));
      return;
    }
    if (step === 2 && (taxRate < 0 || taxRate > 100 || (!isEditMode && validityDays < 1))) {
      setStepError(t('proforma.form.termsInvalid'));
      return;
    }
    setStepError(null);
    setStep(step + 1);
  };

  const handleSubmit = () => {
    mutation.mutate({
      leadId: selectedLeadId,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      clientCompany,
      items,
      taxRate,
      ...(!isEditMode && { validityDays }),
      notes,
    });
  };

  const { subtotal, taxAmount, total } = calculateTotal();

  if (!isOpen) return null;

  const close = () => {
    if (!mutation.isPending) onClose();
  };

  return (
    <div className="fixed inset-0 modal-backdrop z-50 flex justify-center items-center p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="proforma-form-title"
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#c6e911]/25 text-slate-900">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 id="proforma-form-title" className="mr-auto text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            {t(
              isSuccess
                ? isEditMode
                  ? 'proforma.form.updated'
                  : 'proforma.form.created'
                : isEditMode
                  ? 'proforma.form.edit'
                  : 'proforma.form.create',
            )}
          </h2>
          <button
            type="button"
            onClick={close}
            disabled={mutation.isPending}
            aria-label={t('common.close')}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {!isSuccess && (
          <ol className="grid grid-cols-4 gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2.5 sm:gap-2 sm:px-6">
            {steps.map((name, index) => (
              <li
                key={name}
                aria-current={step === index ? 'step' : undefined}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-lg px-0.5 py-1.5 text-center text-[11px] font-semibold sm:flex-row sm:gap-2 sm:px-2 sm:text-left sm:text-xs ${step === index ? 'bg-white ring-1 ring-slate-200' : ''}`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${step === index ? 'bg-slate-900 text-white' : index < step ? 'bg-[#c6e911]/35 text-slate-900' : 'bg-slate-200 text-slate-600'}`}
                >
                  {index < step ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
                </span>
                <span className={step === index ? 'text-slate-900' : 'text-slate-600'}>
                  {t(`proforma.form.steps.${name}`)}
                </span>
              </li>
            ))}
          </ol>
        )}

        {isSuccess ? (
          <div className="p-8 text-center">
            <IconCheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <button
              type="button"
              onClick={close}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              {t('common.close')}
            </button>
          </div>
        ) : (
          <div key={step} className="min-h-0 overflow-y-auto p-4 space-y-5 sm:p-6">
            {step === 0 && (
              <>
                {/* Sélection du Lead — verrouillée en édition (non modifiable côté backend) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('proforma.form.lead')} *</label>
                  {isEditMode ? (
                    <p className="px-4 py-2 bg-slate-100 rounded-md text-slate-700">
                      {clientName} ({clientCompany || '—'})
                    </p>
                  ) : (
                    <AsyncSelect<Lead>
                      queryKey="proforma-leads"
                      placeholder={t('proforma.form.leadPlaceholder')}
                      value={selectedLeadId || undefined}
                      defaultOptions={selectedLead ? [selectedLead] : []}
                      onChange={handleSelectLead}
                      getOptionLabel={(l) => `${l.leadName} (${l.company})`}
                      getOptionValue={(l) => l.id}
                      fetcher={({ page, limit, search }) => getLeadsPaginated({ page, limit, search })}
                    />
                  )}
                </div>

                {/* Informations Client */}
                {selectedLeadId && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="proforma-clientName" className="block text-sm font-medium text-slate-700 mb-2">
                        {t('proforma.form.clientName')} *
                      </label>
                      <input
                        id="proforma-clientName"
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c6e911]/50"
                      />
                    </div>
                    <div>
                      <label htmlFor="proforma-email" className="block text-sm font-medium text-slate-700 mb-2">
                        {t('proforma.form.email')} *
                      </label>
                      <input
                        id="proforma-email"
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c6e911]/50"
                      />
                    </div>
                    <div>
                      <label htmlFor="proforma-phone" className="block text-sm font-medium text-slate-700 mb-2">
                        {t('proforma.form.phone')} *
                      </label>
                      <input
                        id="proforma-phone"
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c6e911]/50"
                      />
                    </div>
                    <div>
                      <label htmlFor="proforma-company" className="block text-sm font-medium text-slate-700 mb-2">
                        {t('proforma.form.company')}
                      </label>
                      <input
                        id="proforma-company"
                        type="text"
                        value={clientCompany}
                        onChange={(e) => setClientCompany(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c6e911]/50"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 1 && (
              <div>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t('proforma.form.product')}
                    </label>
                    <AsyncSelect<Product>
                      queryKey="proforma-products"
                      placeholder={t('proforma.form.productPlaceholder')}
                      value={selectedProductId || undefined}
                      onChange={handleSelectProduct}
                      defaultOptions={selectedProduct ? [selectedProduct] : []}
                      getOptionLabel={(p) => `${p.name} (${p.category})`}
                      getOptionValue={(p) => p.id}
                      fetcher={({ page, limit, search }) => getProductsPaginated({ page, limit, search })}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label htmlFor="proforma-quantity" className="block text-sm font-medium text-slate-700 mb-2">
                        {t('proforma.form.quantity')}
                      </label>
                      <input
                        id="proforma-quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c6e911]/50"
                      />
                    </div>
                    <div>
                      <label htmlFor="proforma-unitPrice" className="block text-sm font-medium text-slate-700 mb-2">
                        {t('proforma.form.unitPrice')} (FCFA)
                      </label>
                      <input
                        id="proforma-unitPrice"
                        type="number"
                        min="0"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c6e911]/50"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleAddProduct}
                        disabled={!selectedProductId || quantity <= 0 || unitPrice <= 0}
                        className="w-full px-4 py-2 bg-[#c6e911] text-slate-800 font-semibold rounded-md hover:bg-[#adc40f] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <IconPlus className="h-4 w-4" />
                        {t('proforma.form.addItem')}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Liste des articles */}
                {items.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 sm:px-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2">{t('proforma.form.product')}</th>
                          <th className="text-right py-2">{t('proforma.form.quantity')}</th>
                          <th className="text-right py-2">{t('proforma.form.unitPrice')}</th>
                          <th className="text-right py-2">{t('proforma.form.lineTotal')}</th>
                          <th className="text-center py-2">{t('proforma.form.action')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => {
                          return (
                            <tr key={idx} className="border-b border-slate-200">
                              <td className="py-2">{productLabels[item.productId]}</td>
                              <td className="text-right">{item.quantity}</td>
                              <td className="text-right">{formatCurrency(item.unitPrice, 2)}</td>
                              <td className="text-right font-semibold">
                                {formatCurrency(item.quantity * item.unitPrice, 2)}
                              </td>
                              <td className="text-center">
                                <button
                                  onClick={() => handleRemoveItem(idx)}
                                  aria-label={t('proforma.form.removeItem')}
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

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="proforma-taxRate" className="block text-sm font-medium text-slate-700 mb-2">
                      {t('proforma.form.taxRate')}
                    </label>
                    <input
                      id="proforma-taxRate"
                      type="number"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => {
                        setTaxRateTouched(true);
                        setTaxRate(parseFloat(e.target.value) || 0);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c6e911]/50"
                    />
                  </div>
                  {!isEditMode && (
                    <div>
                      <label htmlFor="proforma-validity" className="block text-sm font-medium text-slate-700 mb-2">
                        {t('proforma.form.validity')}
                      </label>
                      <input
                        id="proforma-validity"
                        type="number"
                        min="1"
                        value={validityDays}
                        onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c6e911]/50"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="proforma-notes" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('proforma.form.notes')}
                  </label>
                  <textarea
                    id="proforma-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c6e911]/50"
                    placeholder={t('proforma.form.notesPlaceholder')}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <>
                <div className="space-y-1 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{clientName}</p>
                  {clientCompany && <p>{clientCompany}</p>}
                  <p className="break-words">{clientEmail}</p>
                  <p>{clientPhone}</p>
                  {notes && <p className="whitespace-pre-wrap break-words pt-2">{notes}</p>}
                </div>
                <ul className="divide-y divide-slate-200 text-sm">
                  {items.map((item, index) => (
                    <li key={index} className="flex justify-between gap-4 py-2">
                      <span>
                        {item.quantity} × {productLabels[item.productId] || item.productId}
                      </span>
                      <span className="shrink-0">{formatCurrency(item.quantity * item.unitPrice, 2)}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-slate-600">
                  {isEditMode
                    ? t('proforma.form.validUntil', {
                        date: new Date(proformaToEdit.validityDate).toLocaleDateString(language),
                      })
                    : t('proforma.form.validitySummary', { days: validityDays })}
                </p>
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span>{t('proforma.form.subtotal')}</span>
                    <span className="font-semibold">{formatCurrency(subtotal, 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('proforma.form.taxAmount', { rate: taxRate })}</span>
                    <span className="font-semibold">{formatCurrency(taxAmount, 2)}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-base text-slate-900">
                    <span className="font-bold">{t('proforma.form.lineTotal')}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(total, 2)}</span>
                  </div>
                </div>
              </>
            )}
            {(stepError || mutation.isError) && (
              <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
                {stepError || t('proforma.form.saveError')}
              </p>
            )}
          </div>
        )}

        {!isSuccess && (
          <div className="flex justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={
                step === 0
                  ? close
                  : () => {
                      setStepError(null);
                      mutation.reset();
                      setStep(step - 1);
                    }
              }
              disabled={mutation.isPending}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50"
            >
              {t(step === 0 ? 'common.cancel' : 'proforma.form.previous')}
            </button>
            <button
              type="button"
              onClick={step === steps.length - 1 ? handleSubmit : handleNext}
              disabled={mutation.isPending}
              className="rounded-md bg-[#c6e911] px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[#adc40f] disabled:opacity-50"
            >
              {t(
                mutation.isPending
                  ? 'common.loading'
                  : step < steps.length - 1
                    ? 'proforma.form.next'
                    : isEditMode
                      ? 'proforma.form.save'
                      : 'proforma.form.create',
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateProformaModal;
