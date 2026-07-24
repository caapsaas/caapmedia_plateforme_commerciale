import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';
import { TaxBracket } from '../../services/apihr/apiPayroll';

interface IrppBracketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { irppBrackets: TaxBracket[] }) => Promise<void>;
  brackets: TaxBracket[];
  isLoading?: boolean;
}

const IrppBracketsModal: React.FC<IrppBracketsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  brackets = [],
  isLoading = false,
}) => {
  const { t } = useI18n();
  const [localBrackets, setLocalBrackets] = useState<TaxBracket[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setLocalBrackets(brackets || []);
    setError('');
  }, [brackets, isOpen]);

  const handleBracketChange = (index: number, field: string, value: string | number) => {
    const updated = [...localBrackets];
    const bracket = updated[index] as any;

    if (field === 'minSalary' || field === 'maxSalary' || field === 'minAmount' || field === 'maxAmount') {
      bracket[field] = parseFloat(value as string) || 0;
    } else if (field === 'rate') {
      bracket[field] = parseFloat(value as string) / 100 || 0;
    } else {
      bracket[field] = value;
    }
    setLocalBrackets(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (localBrackets.length === 0) {
      setError(t('payroll.errors.emptyBrackets'));
      return;
    }

    for (const bracket of localBrackets) {
      if (bracket.minAmount < 0 || bracket.rate < 0 || bracket.rate > 1) {
        setError(t('payroll.errors.invalidBracket'));
        return;
      }
    }

    try {
      await onSave({ irppBrackets: localBrackets });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-900">
              {t('payroll.modal.updateIrppTitle')}
            </h3>
            <p className="text-sm text-slate-600 mt-2">{t('payroll.modal.updateIrppDesc')}</p>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">{t('payroll.form.minAmount')}</th>
                      <th className="px-4 py-2 text-left font-semibold">{t('payroll.form.maxAmount')}</th>
                      <th className="px-4 py-2 text-left font-semibold">{t('payroll.form.rate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localBrackets.map((bracket, idx) => {
                      const minVal = (bracket as any).minSalary ?? (bracket as any).minAmount ?? 0;
                      const maxVal = (bracket as any).maxSalary ?? (bracket as any).maxAmount ?? 0;
                      const rateVal = (bracket as any).rate || 0;
                      return (
                        <tr key={idx} className="border-b">
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={minVal}
                              onChange={(e) => handleBracketChange(idx, 'minSalary', e.target.value)}
                              min="0"
                              step="1000"
                              disabled={isLoading}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={maxVal}
                              onChange={(e) => handleBracketChange(idx, 'maxSalary', e.target.value)}
                              min="0"
                              step="1000"
                              disabled={isLoading}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <input
                                type="number"
                                value={typeof rateVal === 'number' ? (rateVal > 1 ? rateVal : rateVal * 100) : 0}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  handleBracketChange(idx, 'rate', val > 1 ? val / 100 : val);
                                }}
                                min="0"
                                max="100"
                                step="0.1"
                                disabled={isLoading}
                                className="w-full px-2 py-1 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                              />
                              <span className="ml-2 text-slate-600">%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors disabled:opacity-50"
            >
              {isLoading ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IrppBracketsModal;
