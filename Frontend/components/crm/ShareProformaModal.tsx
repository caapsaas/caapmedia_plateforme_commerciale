import { Mail, MessageCircle, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../../i18n';
import {
  getProformaPdf,
  Proforma,
  prepareProformaWhatsApp,
  sendProforma,
  sendProformaEmail,
  sendProformaWhatsApp,
  WhatsAppProformaShare,
} from '../../services/apiCrm/apiProformas';

export default function ShareProformaModal({ proforma, onClose }: { proforma: Proforma; onClose: () => void }) {
  const { t } = useI18n();
  const cache = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [whatsappSubmitted, setWhatsAppSubmitted] = useState(false);
  const [share, setShare] = useState<(WhatsAppProformaShare & { file: File; fileUrl: string }) | null>(null);
  const [messageCopied, setMessageCopied] = useState(false);
  const [opened, setOpened] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    if (!share) return;
    return () => URL.revokeObjectURL(share.fileUrl);
  }, [share]);
  const refresh = () => cache.invalidateQueries({ queryKey: ['proformas'] });
  const status = proforma.status === 'DRAFT' && (emailSent || whatsappSubmitted || confirmed) ? 'SENT' : proforma.status;
  const run = async (channel: string, work: () => Promise<void>) => {
    if (busy) return;
    setBusy(channel);
    setError('');
    try {
      await work();
    } catch (failure) {
      const message = isAxiosError<{ message?: string | string[] }>(failure)
        ? failure.response?.data.message
        : undefined;
      setError(
        typeof message === 'string'
          ? message
          : Array.isArray(message)
            ? message.join(' ')
            : t('proforma.sharing.error'),
      );
    } finally {
      setBusy(null);
    }
  };
  const copyMessage = async () => {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.caption);
      setMessageCopied(true);
    } catch {
      setError(t('proforma.sharing.copyMessageError'));
    }
  };
  return (
    <div
      className="fixed inset-0 z-[70] modal-backdrop flex items-center justify-center p-4"
      onClick={(event) => {
        event.stopPropagation();
        if (!busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-proforma-title"
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 id="share-proforma-title" className="text-lg font-bold tracking-tight text-slate-900">
              {t('proforma.sharing.title')}
            </h3>
            <p className="mt-1 break-words text-sm text-slate-600">
              {proforma.proformaNumber} · {proforma.clientName} · {t(`proforma.statuses.${status}`)}
            </p>
          </div>
          <button
            type="button"
            disabled={!!busy}
            onClick={onClose}
            aria-label={t('common.close')}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 space-y-3 overflow-y-auto bg-slate-50 p-4 sm:px-6">
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Mail className="h-4 w-4 text-slate-600" aria-hidden="true" />
              {t('proforma.sharing.email')}
            </h4>
            <p className="break-all text-sm text-slate-600">
              {proforma.clientEmail || t('proforma.sharing.missingEmail')}
            </p>
            <p className="text-xs text-slate-500">{t('proforma.sharing.attachment')}</p>
            <button
              type="button"
              disabled={!!busy || !proforma.clientEmail}
              className="rounded-lg bg-[#c6e911] px-3 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-[#adc40f] disabled:opacity-50"
              onClick={() =>
                run('email', async () => {
                  await sendProformaEmail(proforma.id, proforma.clientEmail);
                  setEmailSent(true);
                  await refresh();
                })
              }
            >
              {busy === 'email'
                ? t('proforma.sharing.sending')
                : t(
                    status !== 'DRAFT'
                      ? 'proforma.sharing.resendEmail'
                      : 'proforma.sharing.sendEmail',
                  )}
            </button>
            {emailSent && (
              <p role="status" className="text-sm text-green-700">
                {t('proforma.sharing.emailSuccess')}
              </p>
            )}
          </div>
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <MessageCircle className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              WhatsApp
            </h4>
            <p className="text-sm text-slate-600">
              {share ? `+${share.phone}` : proforma.clientPhone || t('proforma.sharing.missingPhone')}
            </p>
            <button
              type="button"
              disabled={!!busy || !proforma.clientPhone || whatsappSubmitted}
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              onClick={() => run('whatsapp-send', async () => {
                await sendProformaWhatsApp(proforma.id, proforma.clientPhone);
                setWhatsAppSubmitted(true);
                await refresh();
              })}
            >
              {t(busy === 'whatsapp-send' ? 'proforma.sharing.sending' : 'proforma.sharing.sendWhatsAppDirect')}
            </button>
            {whatsappSubmitted && (
              <p role="status" className="text-sm text-green-700">
                {t('proforma.sharing.whatsAppAccepted')}
              </p>
            )}
            {!whatsappSubmitted && (
              <p className="text-xs text-slate-500">{t('proforma.sharing.whatsappHint')}</p>
            )}
            {!whatsappSubmitted && (!share ? (
              <button
                type="button"
                disabled={!!busy || !proforma.clientPhone}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
                onClick={() =>
                  run('whatsapp', async () => {
                    const details = await prepareProformaWhatsApp(proforma.id);
                    try {
                      const pdf = await getProformaPdf(proforma.id);
                      if (await pdf.slice(0, 5).text() !== '%PDF-') throw new Error('Invalid PDF');
                      const filename = `proforma_${proforma.proformaNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
                      const file = new File([pdf], filename, { type: 'application/pdf' });
                      setShare({ ...details, file, fileUrl: URL.createObjectURL(file) });
                    } catch {
                      setError(t('proforma.sharing.pdfDownloadError'));
                    }
                  })
                }
              >
                {busy === 'whatsapp' ? t('common.loading') : t('proforma.sharing.prepareWhatsApp')}
              </button>
            ) : (
              <>
                <pre className="text-xs whitespace-pre-wrap break-all bg-slate-50 p-3 rounded-md max-h-36 overflow-y-auto">
                  {share.caption}
                </pre>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={share.fileUrl}
                    download={share.file.name}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                  >
                    {t('proforma.sharing.downloadPdf')}
                  </a>
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => run('copy-whatsapp-message', copyMessage)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50"
                  >
                    {t('proforma.sharing.copyMessage')}
                  </button>
                  <a
                    href={`https://wa.me/${share.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpened(true)}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    {t('proforma.sharing.openWhatsApp')}
                  </a>
                </div>
                {messageCopied && (
                  <p role="status" className="text-sm text-green-700">{t('proforma.sharing.messageCopied')}</p>
                )}
                {opened && status === 'DRAFT' && (
                  <button
                    type="button"
                    disabled={!!busy}
                    className="block text-sm text-blue-700 underline disabled:opacity-50"
                    onClick={() =>
                      run('confirm', async () => {
                        await sendProforma(proforma.id);
                        setConfirmed(true);
                        await refresh();
                      })
                    }
                  >
                    {t('proforma.sharing.confirmWhatsApp')}
                  </button>
                )}
                {confirmed && (
                  <p role="status" className="text-sm text-green-700">
                    {t('proforma.sharing.confirmed')}
                  </p>
                )}
              </>
            ))}
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
