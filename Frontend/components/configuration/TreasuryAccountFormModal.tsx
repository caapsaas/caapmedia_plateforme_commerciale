import React, { useState, useEffect } from 'react';
import { TreasuryAccount, Subsidiary, AccountType } from '../../types/models';
import { useI18n } from '../../i18n';
import { CreateTreasuryAccountData, UpdateTreasuryAccountData } from '../../services/apiFinance/apiTreasuryAccounts';

interface TreasuryAccountFormModalProps {
  account: TreasuryAccount | null;
  subsidiary: Subsidiary;
  onClose: () => void;
  onSave: (account: TreasuryAccount) => void;
}

const TreasuryAccountFormModal: React.FC<TreasuryAccountFormModalProps> = ({
  account,
  subsidiary,
  onClose,
  onSave,
}) => {
  const { t } = useI18n();
  
  const [formData, setFormData] = useState({
    accountName: '',
    balance: '',
    currency: 'XOF',
    accountType: AccountType.BANQUE,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      setFormData({
        accountName: account.accountName,
        balance: account.balance.toString(),
        currency: account.currency,
        accountType: account.accountType,
      });
    } else {
      setFormData({
        accountName: '',
        balance: '0',
        currency: 'XOF',
        accountType: AccountType.BANQUE,
      });
    }
  }, [account]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountName.trim()) {
      newErrors.accountName = t('treasuryAccounts.validation.accountNameRequired');
    }

    if (!formData.balance || isNaN(Number(formData.balance))) {
      newErrors.balance = t('treasuryAccounts.validation.validBalance');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const accountData: TreasuryAccount = {
        id: account?.id || Date.now().toString(),
        accountName: formData.accountName.trim(),
        balance: parseFloat(formData.balance),
        currency: formData.currency,
        accountType: formData.accountType,
        subsidiaryId: subsidiary.id,
      };

      onSave(accountData);
    } catch (error) {
      console.error('Error saving treasury account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#c6e911] to-[#a8d814] px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-white">
            {account ? t('treasuryAccounts.edit.title') : t('treasuryAccounts.create.title')}
          </h3>
        </div>
        
        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('treasuryAccounts.form.accountName')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-colors ${
                  errors.accountName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={t('treasuryAccounts.form.accountNamePlaceholder')}
                required
              />
              {errors.accountName && (
                <p className="mt-1 text-sm text-red-600">{errors.accountName}</p>
              )}
            </div>

            {/* Balance */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('treasuryAccounts.form.balance')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 text-sm">
                  {formData.currency === 'XOF' ? 'FCFA' : 'EUR'}
                </span>
                <input
                  type="number"
                  name="balance"
                  value={formData.balance}
                  onChange={handleChange}
                  className={`w-full pl-16 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-colors ${
                    errors.balance ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  step="0.01"
                  required
                />
              </div>
              {errors.balance && (
                <p className="mt-1 text-sm text-red-600">{errors.balance}</p>
              )}
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('treasuryAccounts.form.accountType')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-colors"
                required
              >
                <option value={AccountType.BANQUE}>{t('treasuryAccounts.accountTypes.bank')}</option>
                <option value={AccountType.CAISSE}>{t('treasuryAccounts.accountTypes.cash')}</option>
                <option value={AccountType.COMPTE_PREFINANCEMENT}>{t('treasuryAccounts.accountTypes.prefinancement')}</option>
              </select>
              {formData.accountType === AccountType.COMPTE_PREFINANCEMENT }
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('treasuryAccounts.form.currency')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c6e911] focus:border-[#c6e911] transition-colors"
                required
              >
                <option value="XOF">XOF (FCFA)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="USD">USD (Dollar américain)</option>
              </select>
            </div>

            {/* Subsidiary Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{t('treasuryAccounts.form.subsidiary')}:</span> {subsidiary.name}
              </p>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors font-medium disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-[#c6e911] text-slate-800 rounded-lg hover:bg-[#adc40f] focus:outline-none focus:ring-2 focus:ring-[#c6e911] transition-colors font-medium shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-800" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('common.saving')}
              </span>
            ) : (
              t('common.save')
            )}
          </button>
        </div>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors disabled:opacity-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TreasuryAccountFormModal;
