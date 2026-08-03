import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';

interface CnpsRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { cnpsEmployeeRate: number; cnpsEmployerRate: number }) => Promise<void>;
  employeeRate: number;
  employerRate: number;
  isLoading?: boolean;
}

const CnpsRatesModal: React.FC<CnpsRatesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employeeRate,
  employerRate,
  isLoading = false,
}) => {
  const { t } = useI18n();
  const [empRate, setEmpRate] = useState<string>((employeeRate * 100).toString());
  const [empRateEmp, setEmpRateEmp] = useState<string>((employerRate * 100).toString());
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setEmpRate((employeeRate * 100).toString());
    setEmpRateEmp((employerRate * 100).toString());
    setError('');
  }, [employeeRate, employerRate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const empValue = parseFloat(empRate);
    const empEmpValue = parseFloat(empRateEmp);

    if (isNaN(empValue) || empValue < 0 || empValue > 100) {
      setError(t('payroll.errors.invalidRate'));
      return;
    }
    if (isNaN(empEmpValue) || empEmpValue < 0 || empEmpValue > 100) {
      setError(t('payroll.errors.invalidRate'));
      return;
    }

    try {
      await onSave({
        cnpsEmployeeRate: empValue / 100,
        cnpsEmployerRate: empEmpValue / 100,
      });
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
              {t('hr.payroll.modal.updateCnpsTitle')}
            </h3>
            <p className="text-sm text-slate-600 mt-2">{t('hr.payroll.modal.updateCnpsDesc')}</p>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="empRate" className="block text-sm font-medium text-slate-700">
                  {t('hr.payroll.form.employeeRate')}
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="number"
                    id="empRate"
                    value={empRate}
                    onChange={(e) => setEmpRate(e.target.value)}
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    disabled={isLoading}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm disabled:bg-slate-100"
                  />
                  <span className="ml-2 text-slate-600">%</span>
                </div>
              </div>

              <div>
                <label htmlFor="empRateEmp" className="block text-sm font-medium text-slate-700">
                  {t('hr.payroll.form.employerRate')}
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="number"
                    id="empRateEmp"
                    value={empRateEmp}
                    onChange={(e) => setEmpRateEmp(e.target.value)}
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    disabled={isLoading}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm disabled:bg-slate-100"
                  />
                  <span className="ml-2 text-slate-600">%</span>
                </div>
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

export default CnpsRatesModal;
