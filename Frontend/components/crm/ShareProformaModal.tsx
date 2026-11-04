import React, { useState } from 'react';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../../i18n';
import { Proforma, prepareProformaWhatsApp, sendProforma, sendProformaEmail, WhatsAppProformaShare } from '../../services/apiCrm/apiProformas';

export default function ShareProformaModal({ proforma, onClose }: { proforma: Proforma; onClose: () => void }) {
  const { t, language } = useI18n();
  const cache = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [share, setShare] = useState<WhatsAppProformaShare | null>(null);
  const [opened, setOpened] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const refresh = () => { void cache.invalidateQueries({ queryKey: ['proformas'] }); };
  const run = async (channel: string, work: () => Promise<void>) => {
    if (busy) return;
    setBusy(channel);
    setError('');
    try { await work(); }
    catch (failure) {
      const message = isAxiosError<{ message?: string | string[] }>(failure) ? failure.response?.data.message : undefined;
      setError(typeof message === 'string' ? message : Array.isArray(message) ? message.join(' ') : t('proforma.sharing.error'));
    } finally { setBusy(null); }
  };
  return <div className="fixed inset-0 z-[70] modal-backdrop flex items-center justify-center p-4" onClick={event => { event.stopPropagation(); if (!busy) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="share-proforma-title" className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5" onClick={event => event.stopPropagation()}>
      <div>
        <h3 id="share-proforma-title" className="text-lg font-bold">{t('proforma.sharing.title')}</h3>
        <p className="text-sm text-slate-600">{proforma.proformaNumber} · {proforma.clientName}</p>
      </div>
      <div className="rounded-lg border p-4 space-y-2">
        <h4 className="font-semibold">{t('proforma.sharing.email')}</h4>
        <p className="break-all text-sm text-slate-600">{proforma.clientEmail || t('proforma.sharing.missingEmail')}</p>
        <p className="text-xs text-slate-500">{t('proforma.sharing.attachment')}</p>
        <button type="button" disabled={!!busy || !proforma.clientEmail} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
          onClick={() => run('email', async () => { await sendProformaEmail(proforma.id, proforma.clientEmail); setEmailSent(true); refresh(); })}>
          {busy === 'email' ? t('proforma.sharing.sending') : t(emailSent || proforma.status !== 'DRAFT' ? 'proforma.sharing.resendEmail' : 'proforma.sharing.sendEmail')}
        </button>
        {emailSent && <p role="status" className="text-sm text-green-700">{t('proforma.sharing.emailSuccess')}</p>}
      </div>
      <div className="rounded-lg border p-4 space-y-3">
        <h4 className="font-semibold">WhatsApp</h4>
        <p className="text-sm text-slate-600">{share ? `+${share.phone}` : proforma.clientPhone || t('proforma.sharing.missingPhone')}</p>
        <p className="text-xs text-slate-500">{t('proforma.sharing.whatsappHint')}</p>
        {!share ? <button type="button" disabled={!!busy || !proforma.clientPhone} className="px-4 py-2 bg-green-700 text-white rounded-md disabled:opacity-50"
          onClick={() => run('whatsapp', async () => { setShare(await prepareProformaWhatsApp(proforma.id)); })}>
          {busy === 'whatsapp' ? t('common.loading') : t('proforma.sharing.prepareWhatsApp')}
        </button> : <>
          <pre className="text-xs whitespace-pre-wrap break-all bg-slate-50 p-3 rounded-md max-h-36 overflow-y-auto">{share.message}</pre>
          <p className="text-xs text-slate-500">{t('proforma.sharing.expires', { date: new Date(share.expiresAt).toLocaleString(language, { timeZone: 'Africa/Douala' }) })}</p>
          <a href={share.whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpened(true)} className="inline-block px-4 py-2 bg-green-700 text-white rounded-md">
            {t('proforma.sharing.openWhatsApp')}
          </a>
          {opened && proforma.status === 'DRAFT' && !emailSent && !confirmed && <button type="button" disabled={!!busy} className="block text-sm text-blue-700 underline disabled:opacity-50"
            onClick={() => run('confirm', async () => { await sendProforma(proforma.id); setConfirmed(true); refresh(); })}>
            {t('proforma.sharing.confirmWhatsApp')}
          </button>}
          {confirmed && <p role="status" className="text-sm text-green-700">{t('proforma.sharing.confirmed')}</p>}
        </>}
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end"><button type="button" disabled={!!busy} onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-md disabled:opacity-50">{t('common.close')}</button></div>
    </section>
  </div>;
}
