import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCommercialParams, upsertCommercialParams, CommercialParams } from '../../services/apiProduction/apiProduction';
import { useI18n } from '../../i18n';

const CommercialParamsManagement: React.FC = () => {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [min, setMin] = useState<string>('');
    const [max, setMax] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState(false);

    const { data: params, isLoading } = useQuery<CommercialParams>({
        queryKey: ['commercial-params'],
        queryFn: getCommercialParams,
        retry: false,
    });

    useEffect(() => {
        if (params) {
            setMin(String(params.minMarginPercent));
            setMax(String(params.maxMarginPercent));
        }
    }, [params]);

    const { mutate: save, isPending } = useMutation({
        mutationFn: upsertCommercialParams,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['commercial-params'] });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        },
        onError: () => setError(t('production.commercialParams.saveError')),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        const minVal = parseFloat(min);
        const maxVal = parseFloat(max);
        if (isNaN(minVal) || isNaN(maxVal)) { setError(t('production.commercialParams.invalidValues')); return; }
        if (minVal < 0 || maxVal > 100) { setError(t('production.commercialParams.outOfRange')); return; }
        if (minVal >= maxVal) { setError(t('production.commercialParams.minGtMax')); return; }
        save({ minMarginPercent: minVal, maxMarginPercent: maxVal });
    };

    const minVal = parseFloat(min);
    const maxVal = parseFloat(max);
    const rangeValid = !isNaN(minVal) && !isNaN(maxVal) && minVal >= 0 && maxVal <= 100 && minVal < maxVal;

    if (isLoading) {
        return (
            <div className="max-w-lg space-y-3">
                <div className="h-6 w-48 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-4 w-72 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-40 bg-slate-100 rounded-xl animate-pulse mt-4" />
            </div>
        );
    }

    return (
        <div className="max-w-lg space-y-5">
            {/* En-tête */}
            <div>
                <h3 className="text-lg font-bold text-slate-800">{t('production.commercialParams.title')}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{t('production.commercialParams.subtitle')}</p>
            </div>

            {/* Bandeau non configuré */}
            {!params && (
                <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <svg className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <p className="text-xs font-medium text-amber-800">{t('production.commercialParams.notConfigured')}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {/* Champs */}
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                {t('production.commercialParams.minMargin')}
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={min}
                                    onChange={e => { setMin(e.target.value); setError(''); }}
                                    className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911] bg-white placeholder-slate-300"
                                    placeholder="15"
                                    required
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                                {t('production.commercialParams.maxMargin')}
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={max}
                                    onChange={e => { setMax(e.target.value); setError(''); }}
                                    className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911] bg-white placeholder-slate-300"
                                    placeholder="60"
                                    required
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Aperçu visuel de la plage */}
                    {rangeValid && (
                        <div className="space-y-2">
                            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="absolute h-full bg-[#c6e911] rounded-full transition-all duration-300"
                                    style={{ left: `${minVal}%`, width: `${maxVal - minVal}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                <span>0 %</span>
                                <span className="text-slate-600 font-semibold">{minVal} % → {maxVal} %</span>
                                <span>100 %</span>
                            </div>
                        </div>
                    )}

                    {/* Erreur */}
                    {error && (
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                            <svg className="h-4 w-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Succès */}
                    {success && (
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-100 rounded-xl">
                            <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-green-700 font-medium">{t('production.commercialParams.success')}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                    {params ? (
                        <p className="text-[10px] text-slate-400">
                            {t('production.commercialParams.lastModified', {
                                date: new Date(params.updatedAt).toLocaleDateString('fr-FR', { dateStyle: 'medium' }),
                            })}
                        </p>
                    ) : <span />}
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-800 bg-[#c6e911] rounded-lg hover:bg-[#adc40f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <>
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                {t('common.saving')}
                            </>
                        ) : (
                            params ? t('production.commercialParams.update') : t('production.commercialParams.create')
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CommercialParamsManagement;
