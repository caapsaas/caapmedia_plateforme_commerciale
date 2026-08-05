import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PurchaseOrder } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { getPurchaseOrders } from '../../services/apiPurchasing/apiPurchase_order';
import { createSupplierDebt, SupplierDebtCreationData } from '../../services/apiFinance/apiDebts';

interface CreateSupplierDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  subsidiaryId: string;
}

const CreateSupplierDebtModal: React.FC<CreateSupplierDebtModalProps> = ({
  isOpen,
  onClose,
  subsidiaryId,
}) => {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState(0);
  const [invoiceUrl, setInvoiceUrl] = useState('');

  const resetForm = () => {
    setPurchaseOrderId('');
    setSupplierName('');
    setInvoiceId('');
    setDueDate('');
    setAmount(0);
    setInvoiceUrl('');
  };

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  const { data: purchaseOrders = [] } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchaseOrders', subsidiaryId],
    queryFn: () => getPurchaseOrders(),
    enabled: isOpen,
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: (data: SupplierDebtCreationData) => createSupplierDebt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierDebts', subsidiaryId] });
      toast.success(t('supplierDebts.createSuccess'), t('supplierDebts.createSuccessMessage'));
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        t('supplierDebts.createError'),
        error?.response?.data?.message || t('supplierDebts.createErrorMessage'),
      );
    },
  });

  const handlePurchaseOrderChange = (id: string) => {
    setPurchaseOrderId(id);
    const po = purchaseOrders.find((p) => p.id === id);
    if (po) setSupplierName(po.supplierName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseOrderId || !supplierName || !invoiceId || !dueDate || amount <= 0 || !invoiceUrl) return;
    submit({ purchaseOrderId, supplierName, invoiceId, dueDate, amount, invoiceUrl });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-800">{t('supplierDebts.createModal.title')}</h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">{t('supplierDebts.createModal.purchaseOrder')}</label>
                <select
                  value={purchaseOrderId}
                  onChange={(e) => handlePurchaseOrderChange(e.target.value)}
                  required
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                >
                  <option value="">-- {t('common.select')} --</option>
                  {purchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.supplierName} — {po.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">{t('supplierDebts.invoiceId')}</label>
                <input
                  type="text"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  required
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('supplierDebts.amount')}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    required
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('supplierDebts.dueDate')}</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">{t('supplierDebts.createModal.invoiceUrl')}</label>
                <input
                  type="text"
                  value={invoiceUrl}
                  onChange={(e) => setInvoiceUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] disabled:opacity-50"
            >
              {isPending ? '...' : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSupplierDebtModal;
