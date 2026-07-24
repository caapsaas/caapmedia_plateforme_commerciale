import React, { useState, useEffect, useMemo } from 'react';
import { EquipmentWithCost, CommercialParams, ResolvedWorkflow } from '../../services/apiProduction/apiProduction';
import { useI18n } from '../../i18n';
import IconPlus from '../icons/IconPlus';
import IconDelete from '../icons/IconDelete';

export interface ProductionStep {
    equipmentId: string;
    equipmentNameSnapshot: string;
    stepOrder: number;
    estimatedTimeHours: number;
    hourlyRateSnapshot: number;
    calculatedCost: number;
}

export interface ProductionSummary {
    totalProductionCost: number;
    marginPercent: number;
    finalPrice: number;
}

export interface ProductionCostResult {
    steps: ProductionStep[];
    summary: ProductionSummary;
}

interface Props {
    productName: string;
    configuredEquipments: EquipmentWithCost[];
    commercialParams: CommercialParams | null;
    resolvedWorkflow: ResolvedWorkflow | null;
    onConfirm: (result: ProductionCostResult) => void;
    onClose: () => void;
}

interface StepRow {
    id: string;
    equipmentId: string;
    equipmentNameSnapshot: string;
    estimatedTimeHours: string;
    hourlyRateSnapshot: number;
}

const ProductionCostModal: React.FC<Props> = ({
    productName,
    configuredEquipments,
    commercialParams,
    resolvedWorkflow,
    onConfirm,
    onClose,
}) => {
    const { t } = useI18n();
    const [steps, setSteps] = useState<StepRow[]>([]);
    const [marginPercent, setMarginPercent] = useState<string>('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (resolvedWorkflow?.steps?.length) {
            setSteps(resolvedWorkflow.steps.map(s => ({
                id: crypto.randomUUID(),
                equipmentId: s.equipmentId,
                equipmentNameSnapshot: s.equipmentName,
                estimatedTimeHours: '',
                hourlyRateSnapshot: s.hourlyRate ?? 0,
            })));
        }
    }, [resolvedWorkflow]);

    const addStep = () => {
        setSteps(prev => [...prev, {
            id: crypto.randomUUID(),
            equipmentId: '',
            equipmentNameSnapshot: '',
            estimatedTimeHours: '',
            hourlyRateSnapshot: 0,
        }]);
    };

    const removeStep = (id: string) => setSteps(prev => prev.filter(s => s.id !== id));

    const updateEquipment = (id: string, equipmentId: string) => {
        const eq = configuredEquipments.find(e => e.id === equipmentId);
        setSteps(prev => prev.map(s => s.id === id ? {
            ...s,
            equipmentId,
            equipmentNameSnapshot: eq?.equipmentName ?? '',
            hourlyRateSnapshot: eq?.hourlyRate ?? 0,
        } : s));
    };

    const updateTime = (id: string, value: string) => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, estimatedTimeHours: value } : s));
    };

    const totalProductionCost = useMemo(() =>
        steps.reduce((sum, s) => {
            const h = parseFloat(s.estimatedTimeHours);
            return sum + (isNaN(h) ? 0 : h * s.hourlyRateSnapshot);
        }, 0),
        [steps]
    );

    const marginVal = parseFloat(marginPercent);
    const finalPrice = !isNaN(marginVal) && totalProductionCost > 0
        ? totalProductionCost * (1 + marginVal / 100)
        : 0;

    const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const handleConfirm = () => {
        setError('');

        if (steps.length === 0) { setError(t('production.costModal.noStepsError')); return; }
        if (steps.some(s => !s.equipmentId)) { setError(t('production.costModal.noEquipmentError')); return; }
        if (steps.some(s => isNaN(parseFloat(s.estimatedTimeHours)) || parseFloat(s.estimatedTimeHours) <= 0)) {
            setError(t('production.costModal.invalidTimeError')); return;
        }
        if (isNaN(marginVal)) { setError(t('production.costModal.noMarginError')); return; }
        if (commercialParams) {
            const min = Number(commercialParams.minMarginPercent);
            const max = Number(commercialParams.maxMarginPercent);
            if (marginVal < min || marginVal > max) {
                setError(t('production.costModal.marginRangeError', { min: String(min), max: String(max) })); return;
            }
        }

        const builtSteps: ProductionStep[] = steps.map((s, i) => {
            const h = parseFloat(s.estimatedTimeHours);
            return {
                equipmentId: s.equipmentId,
                equipmentNameSnapshot: s.equipmentNameSnapshot,
                stepOrder: i + 1,
                estimatedTimeHours: h,
                hourlyRateSnapshot: s.hourlyRateSnapshot,
                calculatedCost: h * s.hourlyRateSnapshot,
            };
        });

        onConfirm({
            steps: builtSteps,
            summary: { totalProductionCost, marginPercent: marginVal, finalPrice },
        });
    };

    const minMargin = commercialParams ? Number(commercialParams.minMarginPercent) : null;
    const maxMargin = commercialParams ? Number(commercialParams.maxMarginPercent) : null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">{t('production.costModal.title')}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{productName}</p>
                    {resolvedWorkflow && (
                        <p className="text-xs text-blue-600 mt-1">
                            {t('production.costModal.prefilledWorkflow', { name: resolvedWorkflow.workflowName })}
                        </p>
                    )}
                </div>

                {/* Corps scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-slate-700">{t('production.costModal.stepsTitle')}</h4>
                            <button type="button" onClick={addStep} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                <IconPlus className="h-3.5 w-3.5" /> {t('production.costModal.addMachine')}
                            </button>
                        </div>

                        <div className="space-y-2">
                            {steps.length === 0 && (
                                <p className="text-sm text-slate-400 italic text-center py-4 border border-dashed border-slate-300 rounded-lg">
                                    {t('production.costModal.noSteps')}
                                </p>
                            )}
                            {steps.map((step, idx) => (
                                <div key={step.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 rounded-lg">
                                    <span className="col-span-1 text-xs text-slate-400 text-center">{idx + 1}</span>
                                    <div className="col-span-5">
                                        <select
                                            value={step.equipmentId}
                                            onChange={e => updateEquipment(step.id, e.target.value)}
                                            className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                                        >
                                            <option value="">{t('production.costModal.chooseMachine')}</option>
                                            {configuredEquipments.map(eq => (
                                                <option key={eq.id} value={eq.id}>{eq.equipmentName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={step.estimatedTimeHours}
                                            onChange={e => updateTime(step.id, e.target.value)}
                                            placeholder={t('production.costModal.hoursPlaceholder')}
                                            className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                                        />
                                    </div>
                                    <div className="col-span-3 text-right">
                                        {step.hourlyRateSnapshot > 0 ? (
                                            <div>
                                                <p className="text-xs text-slate-400">{fmt(step.hourlyRateSnapshot)} F/h</p>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {fmt((parseFloat(step.estimatedTimeHours) || 0) * step.hourlyRateSnapshot)} F
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">—</p>
                                        )}
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <button type="button" onClick={() => removeStep(step.id)} className="p-1 text-red-400 hover:text-red-600">
                                            <IconDelete className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Récapitulatif financier */}
                    <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">{t('production.costModal.totalCost')}</span>
                            <span className="font-semibold text-slate-800">{fmt(totalProductionCost)} F CFA</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="text-sm text-slate-600 whitespace-nowrap">{t('production.costModal.margin')}</label>
                            <input
                                type="number"
                                min={minMargin ?? 0}
                                max={maxMargin ?? 100}
                                step="0.1"
                                value={marginPercent}
                                onChange={e => setMarginPercent(e.target.value)}
                                placeholder={commercialParams ? `${minMargin} – ${maxMargin}` : ''}
                                className="w-24 px-2 py-1.5 border border-slate-300 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                            />
                            {commercialParams && (
                                <span className="text-xs text-slate-400">
                                    {t('production.costModal.marginRange', { min: String(minMargin), max: String(maxMargin) })}
                                </span>
                            )}
                        </div>

                        <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
                            <span className="text-slate-700">{t('production.costModal.finalPrice')}</span>
                            <span className="text-[#6b8a00]">{fmt(finalPrice)} F CFA</span>
                        </div>
                        {finalPrice > 0 && (
                            <p className="text-xs text-slate-400">{t('production.costModal.priceNote')}</p>
                        )}
                    </div>

                    {error && <p className="text-red-600 text-sm">{error}</p>}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-xl border-t border-slate-200">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 text-sm transition-colors">
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={steps.length === 0 || totalProductionCost <= 0 || !marginPercent}
                        className="px-4 py-2 bg-[#c6e911] text-slate-800 font-semibold rounded-md hover:bg-[#adc40f] text-sm transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                        {t('production.costModal.confirmButton')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductionCostModal;
