import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../i18n';
import { submitQrPointage } from '../services/apihr/apiAttendance';

function getPointageError(error: unknown) {
  if (!isAxiosError<{ code?: string; message?: { code?: string } | string | string[] }>(error)) {
    return 'unavailable';
  }
  if (!error.response) {
    return error.code === 'ERR_NETWORK' ? 'network' : 'unavailable';
  }

  const { data, status } = error.response;
  const message = data?.message;
  const code = data?.code ?? (message && !Array.isArray(message) && typeof message === 'object' ? message.code : undefined);

  switch (code) {
    case 'QR_EXPIRED': return 'invalidQr';
    case 'QR_REVOKED': return 'replacedQr';
    case 'ALREADY_CHECKED_IN': return 'alreadyArrived';
    case 'INVALID_DEPARTURE': return 'invalidDeparture';
  }

  switch (status) {
    case 400: return 'invalidInput';
    case 401:
    case 403: return 'forbidden';
    case 404: return 'employeeNotFound';
    case 429: return 'tooManyAttempts';
    default: return 'unavailable';
  }
}

export const PointagePage: React.FC = () => {
  const { t } = useI18n();
  const token = new URLSearchParams(window.location.search).get('t')?.trim() || '';
  const queryClient = useQueryClient();

  const [matricule, setMatricule] = useState('');
  const [action, setAction] = useState<'arrival' | 'departure'>('arrival');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Awaited<ReturnType<typeof submitQrPointage>> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const employeeId = matricule.trim();
    if (!employeeId || employeeId.length > 100) {
      setError('invalidEmployeeId');
      return;
    }

    setLoading(true);
    try {
      const response = await submitQrPointage({
        token,
        matricule: employeeId,
        action,
      });
      setSuccess(response);
      setMatricule('');

      // Invalidate attendance records cache to refresh history
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
    } catch (err) {
      setError(getPointageError(err));
    } finally {
      setLoading(false);
    }
  };

  if (token.length < 20 || token.length > 128) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-4">
            {t('qrPointage.invalidLinkTitle')}
          </h1>
          <p className="text-center text-slate-600">
            {t(token ? 'qrPointage.errors.invalidQr' : 'qrPointage.errors.missingQr')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-[#c6e911] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-slate-800" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Pointage</h1>
          <p className="text-slate-600">Entrez vos informations pour pointer</p>
        </div>

        {/* Error Message */}
        {error && (
          <div role="alert" className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-800 text-sm font-medium">{t(`qrPointage.errors.${error}`)}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-green-800 font-bold">{success.message}</p>
            </div>
            <p className="text-green-700 text-sm">
              {success.employeeName} - {success.status}
            </p>
            {success.duration && (
              <p className="text-green-700 text-sm mt-1">
                Durée: {success.duration}
              </p>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="matricule" className="block text-sm font-medium text-slate-700 mb-2">
             Entrez votre Matricule Employé
             <span className="text-red-600 ml-1" aria-hidden="true">*</span></label>
            <input
              id="matricule"
              type="text"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911] focus:border-transparent"
              placeholder="Entrez votre matricule"
              disabled={loading}
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="action" className="block text-sm font-medium text-slate-700 mb-2">
              Type de pointage
            </label>
            <select
              id="action"
              value={action}
              onChange={(e) => setAction(e.target.value as 'arrival' | 'departure')}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6e911] focus:border-transparent"
              disabled={loading}
            >
              <option value="arrival">{t('qrPointage.arrival')}</option>
              <option value="departure">{t('qrPointage.departure')}</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !matricule}
            className="w-full bg-[#c6e911] hover:bg-[#b0cc0f] text-slate-800 font-semibold py-3 px-4 rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Pointer ma présence
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Système de pointage sécurisé - CaapMedia
        </p>
      </div>
    </div>
  );
};

export default PointagePage;
