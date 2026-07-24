import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { setupTwoFactor, verifyTwoFactor, disableTwoFactor, TwoFactorSetupResponse } from '../services/apiCommon/apiTwoFactor';

type EnableStep = 'idle' | 'setup' | 'recoveryCodes';

const SecuritySettings: React.FC = () => {
  const { t } = useI18n();
  const { user, setTwoFactorEnabled } = useAuth();

  const [enableStep, setEnableStep] = useState<EnableStep>('idle');
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState('');

  const handleStartSetup = async () => {
    setError('');
    setIsLoading(true);
    try {
      const data = await setupTwoFactor();
      setSetupData(data);
      setEnableStep('setup');
    } catch (err: any) {
      setError(err.message || t('security.twoFactor.errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { recoveryCodes: codes } = await verifyTwoFactor(confirmCode);
      setRecoveryCodes(codes);
      setEnableStep('recoveryCodes');
      setTwoFactorEnabled(true);
    } catch (err: any) {
      setError(err.message || t('security.twoFactor.errorInvalidCode'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    setEnableStep('idle');
    setSetupData(null);
    setConfirmCode('');
    setRecoveryCodes([]);
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableError('');
    setIsLoading(true);
    try {
      await disableTwoFactor(disablePassword, disableCode);
      setTwoFactorEnabled(false);
      setShowDisableForm(false);
      setDisablePassword('');
      setDisableCode('');
    } catch (err: any) {
      setDisableError(err.message || t('security.twoFactor.errorInvalidCode'));
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-2 border border-slate-300 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#c6e911] focus:border-transparent transition';
  const primaryButtonClass = 'px-4 py-2 bg-[#c6e911] text-slate-800 font-semibold rounded-md hover:bg-[#adc40f] disabled:bg-lime-200 transition-colors';

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-slate-800">{t('security.title')}</h1>

      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{t('security.twoFactor.title')}</h2>
            <p className="text-sm text-slate-500">{t('security.twoFactor.description')}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${user?.twoFactorEnabled ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
            {user?.twoFactorEnabled ? t('security.twoFactor.statusEnabled') : t('security.twoFactor.statusDisabled')}
          </span>
        </div>

        {enableStep === 'idle' && !user?.twoFactorEnabled && !showDisableForm && (
          <button onClick={handleStartSetup} disabled={isLoading} className={primaryButtonClass}>
            {t('security.twoFactor.enableButton')}
          </button>
        )}

        {enableStep === 'setup' && setupData && (
          <form onSubmit={handleConfirmSetup} className="space-y-4 border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-600">{t('security.twoFactor.scanInstruction')}</p>
            <img src={setupData.qrCodeDataUrl} alt="QR code 2FA" className="w-48 h-48 border border-slate-200 rounded-md" />
            <div>
              <p className="text-xs text-slate-500 mb-1">{t('security.twoFactor.manualEntryLabel')}</p>
              <code className="text-sm bg-slate-100 px-2 py-1 rounded break-all">{setupData.secret}</code>
            </div>
            <div>
              <label htmlFor="confirm-code" className="block text-sm font-medium text-slate-700">{t('security.twoFactor.confirmCodeLabel')}</label>
              <input
                id="confirm-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                autoFocus
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                className={`${inputClass} mt-1`}
                placeholder="123456"
                disabled={isLoading}
              />
            </div>
            {error && <p role="alert" className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={isLoading} className={primaryButtonClass}>
                {t('security.twoFactor.confirmButton')}
              </button>
              <button type="button" onClick={handleFinish} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        )}

        {enableStep === 'recoveryCodes' && (
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
              {t('security.twoFactor.recoveryCodesWarning')}
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-slate-100 p-4 rounded-md">
              {recoveryCodes.map((code) => (
                <div key={code}>{code}</div>
              ))}
            </div>
            <button onClick={handleFinish} className={primaryButtonClass}>
              {t('security.twoFactor.recoveryCodesSavedButton')}
            </button>
          </div>
        )}

        {user?.twoFactorEnabled && enableStep === 'idle' && (
          <div className="border-t border-slate-200 pt-4">
            {!showDisableForm ? (
              <button onClick={() => setShowDisableForm(true)} className="px-4 py-2 bg-red-50 text-red-700 font-semibold rounded-md hover:bg-red-100 transition-colors">
                {t('security.twoFactor.disableButton')}
              </button>
            ) : (
              <form onSubmit={handleDisable} className="space-y-4">
                <div>
                  <label htmlFor="disable-password" className="block text-sm font-medium text-slate-700">{t('login.passwordLabel')}</label>
                  <input
                    id="disable-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    className={`${inputClass} mt-1`}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="disable-code" className="block text-sm font-medium text-slate-700">{t('security.twoFactor.confirmCodeLabel')}</label>
                  <input
                    id="disable-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value)}
                    className={`${inputClass} mt-1`}
                    placeholder="123456"
                    disabled={isLoading}
                  />
                </div>
                {disableError && <p role="alert" className="text-red-500 text-sm">{disableError}</p>}
                <div className="flex gap-3">
                  <button type="submit" disabled={isLoading} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:bg-red-300 transition-colors">
                    {t('security.twoFactor.disableButton')}
                  </button>
                  <button type="button" onClick={() => { setShowDisableForm(false); setDisableError(''); }} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings;
