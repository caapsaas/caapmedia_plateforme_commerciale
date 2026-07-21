import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';
import { LeaveEntitlement } from '../../services/apihr/apiPayroll';

interface LeaveEntitlementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { leaveEntitlements: LeaveEntitlement[] }) => Promise<void>;
  entitlements: LeaveEntitlement[];
  isLoading?: boolean;
}

const LeaveEntitlementsModal: React.FC<LeaveEntitlementsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  entitlements = [],
  isLoading = false,
}) => {
  const { t } = useI18n();
  const [localEntitlements, setLocalEntitlements] = useState<LeaveEntitlement[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setLocalEntitlements(entitlements || []);
    setError('');
  }, [entitlements, isOpen]);

  const handleEntitlementChange = (
    index: number,
    field: keyof LeaveEntitlement,
    value: string | number | boolean
  ) => {
    const updated = [...localEntitlements];
    if (field === 'daysPerYear') {
      updated[index][field] = parseInt(value as string) || 0;
    } else if (field === 'isPaid') {
      updated[index][field] = value as boolean;
    } else {
      (updated[index] as any)[field] = value;
    }
    setLocalEntitlements(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (localEntitlements.length === 0) {
      setError(t('payroll.errors.emptyEntitlements'));
      return;
    }

    for (const entitlement of localEntitlements) {
      if (!entitlement.type || entitlement.daysPerYear < 0) {
        setError(t('payroll.errors.invalidEntitlement'));
        return;
      }
    }

    try {
      await onSave({ leaveEntitlements: localEntitlements });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-900">
              {t('payroll.modal.updateLeaveTitle')}
            </h3>
            <p className="text-sm text-slate-600 mt-2">{t('payroll.modal.updateLeaveDesc')}</p>

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
                      <th className="px-4 py-2 text-left font-semibold">{t('payroll.form.leaveType')}</th>
                      <th className="px-4 py-2 text-left font-semibold">{t('payroll.form.daysPerYear')}</th>
                      <th className="px-4 py-2 text-left font-semibold">{t('payroll.form.isPaid')}</th>
                      <th className="px-4 py-2 text-left font-semibold">{t('payroll.form.description')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localEntitlements.map((entitlement, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={entitlement.type}
                            onChange={(e) => handleEntitlementChange(idx, 'type', e.target.value)}
                            placeholder={t('payroll.form.leaveTypePlaceholder')}
                            disabled={isLoading}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={entitlement.daysPerYear}
                            onChange={(e) => handleEntitlementChange(idx, 'daysPerYear', e.target.value)}
                            min="0"
                            disabled={isLoading}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={entitlement.isPaid || false}
                            onChange={(e) => handleEntitlementChange(idx, 'isPaid', e.target.checked)}
                            disabled={isLoading}
                            className="h-4 w-4 text-[#c6e911] border-gray-300 rounded disabled:opacity-50"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={entitlement.description || ''}
                            onChange={(e) => handleEntitlementChange(idx, 'description', e.target.value)}
                            placeholder={t('payroll.form.descriptionPlaceholder')}
                            disabled={isLoading}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                          />
                        </td>
                      </tr>
                    ))}
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

export default LeaveEntitlementsModal;
