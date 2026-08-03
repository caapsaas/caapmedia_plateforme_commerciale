import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';

interface SmigUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { minWage: number; minWageEffectiveDate: string }) => Promise<void>;
  currentValue: number;
  currentDate: string;
  isLoading?: boolean;
}

const SmigUpdateModal: React.FC<SmigUpdateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentValue,
  currentDate,
  isLoading = false,
}) => {
  const { t } = useI18n();
  const [minWage, setMinWage] = useState<string>(currentValue.toString());
  const [effectiveDate, setEffectiveDate] = useState<string>(currentDate);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setMinWage(currentValue.toString());
    setEffectiveDate(currentDate);
    setError('');
  }, [currentValue, currentDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const value = parseFloat(minWage);
    if (isNaN(value) || value <= 0) {
      setError(t('payroll.errors.invalidAmount'));
      return;
    }

    try {
      const payload = {
        minWage: value,
        minWageEffectiveDate: effectiveDate,
      };
      console.log('Sending payload to backend:', payload);
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-900">
              {t('hr.payroll.modal.updateSmigTitle')}
            </h3>
            <p className="text-sm text-slate-600 mt-2">{t('hr.payroll.modal.updateSmigDesc')}</p>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="minWage" className="block text-sm font-medium text-slate-700">
                  {t('hr.payroll.form.minWage')} (FCFA)
                </label>
                <input
                  type="number"
                  id="minWage"
                  value={minWage}
                  onChange={(e) => setMinWage(e.target.value)}
                  step="1000"
                  min="0"
                  required
                  disabled={isLoading}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm disabled:bg-slate-100"
                />
              </div>

              <div>
                <label htmlFor="effectiveDate" className="block text-sm font-medium text-slate-700">
                  {t('hr.payroll.form.effectiveDate')}
                </label>
                <input
                  type="date"
                  id="effectiveDate"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  required
                  disabled={isLoading}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
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

export default SmigUpdateModal;
