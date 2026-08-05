import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LongTermDebt } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { createLongTermDebt, updateLongTermDebt } from '../../services/apiFinance/apiDebts';

interface LongTermDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  subsidiaryId: string;
  debtToEdit: LongTermDebt | null;
}

const LongTermDebtModal: React.FC<LongTermDebtModalProps> = ({
  isOpen,
  onClose,
  subsidiaryId,
  debtToEdit,
}) => {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEditMode = !!debtToEdit;

  const [debtsName, setDebtsName] = useState('');
  const [initialAmount, setInitialAmount] = useState(0);
  const [interestRate, setInterestRate] = useState(0);
  const [maturityDate, setMaturityDate] = useState('');
  // Le backend n'autorise que la mise à jour du solde restant (remboursement
  // progressif) — nom/taux/échéance sont figés à la création.
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setDebtsName(debtToEdit?.debtsName ?? '');
      setInitialAmount(debtToEdit?.initialAmount ?? 0);
      setInterestRate(debtToEdit?.interestRate ?? 0);
      setMaturityDate(debtToEdit?.maturityDate?.split('T')[0] ?? '');
      setCurrentBalance(debtToEdit?.currentBalance ?? 0);
    }
  }, [isOpen, debtToEdit]);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () =>
      isEditMode
        ? updateLongTermDebt(debtToEdit!.id, { currentBalance })
        : createLongTermDebt({ debtsName, initialAmount, interestRate, maturityDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['longTermDebts', subsidiaryId] });
      toast.success(
        isEditMode ? t('supplierDebts.longTerm.updateSuccess') : t('supplierDebts.longTerm.createSuccess'),
        isEditMode ? t('supplierDebts.longTerm.updateSuccessMessage') : t('supplierDebts.longTerm.createSuccessMessage'),
      );
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        isEditMode ? t('supplierDebts.longTerm.updateError') : t('supplierDebts.longTerm.createError'),
        error?.response?.data?.message ||
          (isEditMode ? t('supplierDebts.longTerm.updateErrorMessage') : t('supplierDebts.longTerm.createErrorMessage')),
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) {
      if (currentBalance < 0) return;
    } else if (!debtsName || initialAmount <= 0 || interestRate < 0 || !maturityDate) {
      return;
    }
    submit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-800">
              {isEditMode ? t('supplierDebts.longTerm.editModal.title') : t('supplierDebts.longTerm.createModal.title')}
            </h3>

            <div className="mt-4 space-y-4">
              {isEditMode ? (
                <>
                  <p className="text-sm text-slate-500">{debtToEdit!.debtsName}</p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('supplierDebts.longTerm.currentBalance')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentBalance}
                      onChange={(e) => setCurrentBalance(parseFloat(e.target.value) || 0)}
                      required
                      className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('supplierDebts.longTerm.name')}</label>
                    <input
                      type="text"
                      value={debtsName}
                      onChange={(e) => setDebtsName(e.target.value)}
                      required
                      className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">{t('supplierDebts.longTerm.initialAmount')}</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={initialAmount || ''}
                        onChange={(e) => setInitialAmount(parseFloat(e.target.value) || 0)}
                        required
                        className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">{t('supplierDebts.longTerm.interestRate')} (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={interestRate || ''}
                        onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                        required
                        className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('supplierDebts.longTerm.maturityDate')}</label>
                    <input
                      type="date"
                      value={maturityDate}
                      onChange={(e) => setMaturityDate(e.target.value)}
                      required
                      className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                    />
                  </div>
                </>
              )}
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

export default LongTermDebtModal;
