import React, { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useI18n } from '../i18n';
import { resetPassword } from '../services/apiCommon/apiUserAuth';
import PasswordInput from '../components/ui/PasswordInput';

const ResetPasswordPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { token } = useSearch({ from: '/reset-password' });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!token) { setError(t('resetPassword.invalidLink')); return; }
    if (password.length < 10) { setError(t('resetPassword.passwordTooShort')); return; }
    if (password !== confirmPassword) { setError(t('resetPassword.passwordsDoNotMatch')); return; }
    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || t('resetPassword.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <section className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
      <h1 className="text-2xl font-bold text-slate-800">{t('resetPassword.title')}</h1>
      {success ? <div className="mt-5 space-y-4">
        <p role="status" className="rounded-md bg-green-100 p-4 text-green-800">{t('resetPassword.success')}</p>
        <button type="button" onClick={() => navigate({ to: '/login' })} className="w-full rounded-md bg-[#c6e911] px-4 py-3 font-semibold text-slate-800">{t('resetPassword.backToLogin')}</button>
      </div> : <form onSubmit={submit} className="mt-5 space-y-4">
        <p className="text-sm text-slate-600">{t('resetPassword.instruction')}</p>
        <label className="block text-sm font-medium text-slate-700">{t('resetPassword.newPassword')}
          <PasswordInput autoComplete="new-password" required minLength={10} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c6e911]" />
        </label>
        <label className="block text-sm font-medium text-slate-700">{t('resetPassword.confirmPassword')}
          <PasswordInput autoComplete="new-password" required minLength={10} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c6e911]" />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-[#c6e911] px-4 py-3 font-semibold text-slate-800 disabled:opacity-60">{isSubmitting ? t('resetPassword.saving') : t('resetPassword.submit')}</button>
        <Link to="/login" className="block text-center text-sm font-medium text-slate-600 hover:text-slate-900">{t('resetPassword.backToLogin')}</Link>
      </form>}
    </section>
  </main>;
};

export default ResetPasswordPage;
