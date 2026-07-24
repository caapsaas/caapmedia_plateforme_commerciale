import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { FormDefinition } from '../../types';
import { EquipmentWithCost, CommercialParams, ResolvedWorkflow } from '../../services/apiProduction/apiProduction';
import { ProductionCostResult, ProductionStep } from './ProductionCostModal';
import FormRenderer, { SpecValues } from '../common/FormRenderer';
import IconPlus from '../icons/IconPlus';
import IconDelete from '../icons/IconDelete';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepRow {
    id: string;
    equipmentId: string;
    equipmentNameSnapshot: string;
    estimatedTimeHours: string;
    hourlyRateSnapshot: number;
}

interface Props {
    productName: string;
    quantity: number;
    configuredEquipments: EquipmentWithCost[];
    commercialParams: CommercialParams | null;
    resolvedWorkflow: ResolvedWorkflow | null;
    schema: FormDefinition | null;
    onConfirm: (result: ProductionCostResult, specValues?: SpecValues) => void;
    onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function hasSpecContent(schema: FormDefinition | null): boolean {
    if (!schema) return false;
    return schema.ungroupedSpecifications.length > 0 || schema.groups.some(g => g.specifications.length > 0);
}

function getRequiredKeys(schema: FormDefinition): string[] {
    return [
        ...schema.ungroupedSpecifications,
        ...schema.groups.flatMap(g => g.specifications),
    ].filter(s => s.required).map(s => s.technicalKey);
}

// ─── Panel 1 — Coût de production ─────────────────────────────────────────────
// Toujours monté → état (machines, marge) préservé lors du retour depuis étape 2

interface CostPanelProps {
    productName: string;
    quantity: number;
    configuredEquipments: EquipmentWithCost[];
    commercialParams: CommercialParams | null;
    resolvedWorkflow: ResolvedWorkflow | null;
    hasSpecs: boolean;
    onNext: (result: ProductionCostResult) => void;
    onClose: () => void;
}

const ProductionCostPanel: React.FC<CostPanelProps> = ({
    productName, quantity, configuredEquipments, commercialParams,
    resolvedWorkflow, hasSpecs, onNext, onClose,
}) => {
    const [steps, setSteps] = useState<StepRow[]>([]);
    const [marginPercent, setMarginPercent] = useState('');
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

    const addStep = () => setSteps(prev => [...prev, {
        id: crypto.randomUUID(), equipmentId: '', equipmentNameSnapshot: '', estimatedTimeHours: '', hourlyRateSnapshot: 0,
    }]);

    const removeStep = (id: string) => setSteps(prev => prev.filter(s => s.id !== id));

    const updateEquipment = (id: string, equipmentId: string) => {
        const eq = configuredEquipments.find(e => e.id === equipmentId);
        setSteps(prev => prev.map(s => s.id === id
            ? { ...s, equipmentId, equipmentNameSnapshot: eq?.equipmentName ?? '', hourlyRateSnapshot: eq?.hourlyRate ?? 0 }
            : s
        ));
    };

    const updateTime = (id: string, value: string) =>
        setSteps(prev => prev.map(s => s.id === id ? { ...s, estimatedTimeHours: value } : s));

    const totalProductionCost = useMemo(() =>
        steps.reduce((sum, s) => {
            const h = parseFloat(s.estimatedTimeHours);
            return sum + (isNaN(h) ? 0 : h * s.hourlyRateSnapshot);
        }, 0), [steps]);

    const marginVal = parseFloat(marginPercent);
    const finalPrice = !isNaN(marginVal) && totalProductionCost > 0 ? totalProductionCost * (1 + marginVal / 100) : 0;
    const unitPrice = finalPrice > 0 && quantity > 0 ? finalPrice / quantity : 0;

    const minMargin = commercialParams ? Number(commercialParams.minMarginPercent) : null;
    const maxMargin = commercialParams ? Number(commercialParams.maxMarginPercent) : null;

    const margeColor = isNaN(marginVal) ? 'text-slate-400'
        : marginVal < 0 ? 'text-red-600'
        : marginVal < (minMargin ?? 10) ? 'text-orange-500'
        : 'text-green-600';

    const handleNext = () => {
        setError('');
        if (steps.length === 0) { setError('Ajoutez au moins une machine.'); return; }
        if (steps.some(s => !s.equipmentId)) { setError('Sélectionnez une machine pour chaque étape.'); return; }
        if (steps.some(s => isNaN(parseFloat(s.estimatedTimeHours)) || parseFloat(s.estimatedTimeHours) <= 0)) {
            setError('Saisissez un temps valide pour chaque étape.'); return;
        }
        if (isNaN(marginVal)) { setError('Saisissez une marge.'); return; }
        if (commercialParams) {
            if (marginVal < Number(minMargin) || marginVal > Number(maxMargin)) {
                setError(`Marge hors plage autorisée (${minMargin} – ${maxMargin} %).`); return;
            }
        }
        const builtSteps: ProductionStep[] = steps.map((s, i) => {
            const h = parseFloat(s.estimatedTimeHours);
            return { equipmentId: s.equipmentId, equipmentNameSnapshot: s.equipmentNameSnapshot, stepOrder: i + 1, estimatedTimeHours: h, hourlyRateSnapshot: s.hourlyRateSnapshot, calculatedCost: h * s.hourlyRateSnapshot };
        });
        onNext({ steps: builtSteps, summary: { totalProductionCost, marginPercent: marginVal, finalPrice } });
    };

    return (
        <div className="flex flex-col">
            {/* Corps — grandit avec le contenu, scroll si nécessaire */}
            <div className="p-6 space-y-5" style={{ maxHeight: 'calc(90vh - 230px)', overflowY: 'auto' }}>

                {/* Contexte lot */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Lot de production</p>
                        <p className="text-sm font-semibold text-slate-800">
                            <span className="text-[#6b8a00] font-bold">{quantity}</span> × {productName}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">Les heures sont pour l'ensemble du lot.</p>
                    </div>
                    {resolvedWorkflow && (
                        <span className="ml-auto text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-medium shrink-0">
                            Workflow pré-rempli
                        </span>
                    )}
                </div>

                {/* Tableau machines */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-700">Étapes de production</h4>
                        <button type="button" onClick={addStep}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                            <IconPlus className="h-3.5 w-3.5" /> Ajouter une machine
                        </button>
                    </div>

                    {steps.length === 0 ? (
                        <button type="button" onClick={addStep}
                            className="w-full py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors flex flex-col items-center gap-2">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-sm">Cliquez pour ajouter la première machine</span>
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <div className="grid grid-cols-[24px_1fr_96px_80px_32px] gap-2 px-3 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                                <span /><span>Machine</span><span className="text-center">Heures</span><span className="text-right">Coût</span><span />
                            </div>
                            {steps.map((step, idx) => {
                                const h = parseFloat(step.estimatedTimeHours) || 0;
                                const cost = h * step.hourlyRateSnapshot;
                                return (
                                    <div key={step.id} className="grid grid-cols-[24px_1fr_96px_80px_32px] gap-2 items-center px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-xs font-bold text-slate-300 text-center">{idx + 1}</span>
                                        <div>
                                            <select value={step.equipmentId} onChange={e => updateEquipment(step.id, e.target.value)}
                                                className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911] bg-white">
                                                <option value="">— Machine —</option>
                                                {configuredEquipments.map(eq => (
                                                    <option key={eq.id} value={eq.id}>{eq.equipmentName}</option>
                                                ))}
                                            </select>
                                            {step.hourlyRateSnapshot > 0 && (
                                                <p className="text-[10px] text-slate-400 mt-0.5 ml-1">{fmt(step.hourlyRateSnapshot)} F/h</p>
                                            )}
                                        </div>
                                        <input type="number" min="0.01" step="0.25" value={step.estimatedTimeHours}
                                            onChange={e => updateTime(step.id, e.target.value)} placeholder="0.0"
                                            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#c6e911] bg-white" />
                                        <div className="text-right">
                                            {cost > 0
                                                ? <span className="text-sm font-bold text-slate-800">{fmt(cost)}</span>
                                                : <span className="text-slate-300 text-sm">—</span>
                                            }
                                        </div>
                                        <button type="button" onClick={() => removeStep(step.id)}
                                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <IconDelete className="h-4 w-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Récap financier */}
                {steps.length > 0 && (
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-slate-100">
                            <span className="text-sm text-slate-600">Coût de production brut (lot)</span>
                            <span className="font-semibold text-slate-800">{fmt(totalProductionCost)} F CFA</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white border-b border-slate-100">
                            <label className="text-sm text-slate-600 shrink-0">Marge commerciale</label>
                            <div className="flex items-center gap-2">
                                {commercialParams && (
                                    <span className="text-xs text-slate-400">{minMargin} – {maxMargin} %</span>
                                )}
                                <div className="relative">
                                    <input type="number" min={minMargin ?? 0} max={maxMargin ?? 100} step="0.5"
                                        value={marginPercent} onChange={e => setMarginPercent(e.target.value)}
                                        placeholder="ex: 40"
                                        className="w-24 px-3 py-1.5 pr-7 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#c6e911]" />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">%</span>
                                </div>
                                <span className={`text-base font-bold w-14 text-right ${margeColor}`}>
                                    {!isNaN(marginVal) ? `${marginVal.toFixed(1)} %` : '—'}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-b border-slate-200">
                            <div>
                                <p className="text-sm font-semibold text-slate-700">Prix de vente total (HT)</p>
                                <p className="text-xs text-slate-400">pour {quantity} unité{quantity > 1 ? 's' : ''}</p>
                            </div>
                            <span className="text-lg font-bold text-slate-900">
                                {finalPrice > 0 ? `${fmt(finalPrice)} F CFA` : '—'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 bg-slate-800">
                            <p className="text-sm text-slate-300">Prix unitaire</p>
                            <span className="text-lg font-bold text-[#c6e911]">
                                {unitPrice > 0 ? `${fmt(unitPrice)} F CFA / u` : '—'}
                            </span>
                        </div>
                    </div>
                )}

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg border border-red-200">{error}</p>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors">
                    Annuler
                </button>
                <button type="button" onClick={handleNext}
                    disabled={steps.length === 0 || totalProductionCost <= 0 || !marginPercent}
                    className="px-6 py-2.5 bg-[#c6e911] text-slate-800 font-semibold rounded-lg hover:bg-[#adc40f] text-sm transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-2">
                    {hasSpecs ? (
                        <>Suivant <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></>
                    ) : 'Ajouter au panier'}
                </button>
            </div>
        </div>
    );
};

// ─── Panel 2 — Spécifications techniques ──────────────────────────────────────

interface SpecPanelProps {
    productName: string;
    quantity: number;
    schema: FormDefinition;
    onBack: () => void;
    onConfirm: (values: SpecValues) => void;
}

const SpecsPanel: React.FC<SpecPanelProps> = ({ productName, quantity, schema, onBack, onConfirm }) => {
    const [values, setValues] = useState<SpecValues>({});

    const missingRequired = getRequiredKeys(schema).some(k => {
        const v = values[k];
        return v === undefined || v === null || v === '';
    });

    return (
        <div className="flex flex-col">
            <div className="p-6" style={{ maxHeight: 'calc(90vh - 230px)', overflowY: 'auto' }}>
                <div className="flex items-center gap-3 mb-5 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Spécifications techniques</p>
                        <p className="text-sm font-semibold text-slate-800">
                            <span className="text-[#6b8a00] font-bold">{quantity}</span> × {productName}
                        </p>
                    </div>
                </div>
                <FormRenderer
                    schema={schema}
                    values={values}
                    onChange={(key, value) => setValues(prev => ({ ...prev, [key]: value }))}
                />
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <button type="button" onClick={onBack}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Retour
                </button>
                <button type="button" onClick={() => onConfirm(values)} disabled={missingRequired}
                    className="px-6 py-2.5 bg-[#c6e911] text-slate-800 font-semibold rounded-lg hover:bg-[#adc40f] text-sm transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed">
                    Ajouter au panier
                </button>
            </div>
        </div>
    );
};

// ─── Modale principale ─────────────────────────────────────────────────────────

const AddItemMultiStepModal: React.FC<Props> = ({
    productName, quantity, configuredEquipments, commercialParams,
    resolvedWorkflow, schema, onConfirm, onClose,
}) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [savedResult, setSavedResult] = useState<ProductionCostResult | null>(null);

    // Refs sur chaque panel pour mesurer leur hauteur réelle
    const panel1Ref = useRef<HTMLDivElement>(null);
    const panel2Ref = useRef<HTMLDivElement>(null);
    // Hauteur du wrapper glissant — undefined = auto (premier rendu)
    const [wrapperH, setWrapperH] = useState<number | undefined>(undefined);

    const hasSpecs = hasSpecContent(schema);

    // Mesure la hauteur du panel actif et met à jour wrapperH
    const syncHeight = useCallback(() => {
        const target = step === 1 ? panel1Ref.current : panel2Ref.current;
        if (target) setWrapperH(target.offsetHeight);
    }, [step]);

    // Sync immédiate après changement d'étape (avant paint)
    useLayoutEffect(() => { syncHeight(); }, [step, syncHeight]);

    // Sync quand le CONTENU change (ajout/suppression de machines, etc.)
    useEffect(() => {
        const targets = [panel1Ref.current, panel2Ref.current].filter((t): t is HTMLDivElement => t !== null);
        if (!targets.length) return;
        const ro = new ResizeObserver(syncHeight);
        targets.forEach(t => ro.observe(t));
        return () => ro.disconnect();
    }, [syncHeight]);

    const handleProductionNext = (result: ProductionCostResult) => {
        setSavedResult(result);
        if (hasSpecs) { setStep(2); } else { onConfirm(result); }
    };

    const handleSpecsConfirm = (specValues: SpecValues) => {
        if (savedResult) onConfirm(savedResult, specValues);
    };

    const stepLabels = hasSpecs ? ['Coût de production', 'Spécifications'] : ['Coût de production'];
    const panelWidth = hasSpecs ? '50%' : '100%';
    const sliderTranslate = step === 2 ? 'translateX(-50%)' : 'translateX(0%)';

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">

                {/* Header — statique */}
                <div className="px-6 pt-5 pb-4 border-b border-slate-200">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Configurer l'article</h3>
                            <p className="text-sm text-slate-500 mt-0.5 truncate">{productName}</p>
                        </div>
                        <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors text-2xl leading-none mt-0.5">
                            ×
                        </button>
                    </div>

                    {hasSpecs && (
                        <div className="flex items-center gap-2 mt-4">
                            {stepLabels.map((label, idx) => {
                                const n = (idx + 1) as 1 | 2;
                                const done = step > n;
                                const active = step === n;
                                return (
                                    <React.Fragment key={label}>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                                                ${done ? 'bg-[#c6e911] text-slate-800' : active ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                {done ? (
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : n}
                                            </span>
                                            <span className={`text-xs font-medium transition-colors duration-300 ${active ? 'text-slate-800' : 'text-slate-400'}`}>
                                                {label}
                                            </span>
                                        </div>
                                        {idx < stepLabels.length - 1 && (
                                            <div className={`flex-1 h-px transition-colors duration-500 ${done ? 'bg-[#c6e911]' : 'bg-slate-200'}`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/*
                  Wrapper glissant.
                  - overflow: hidden clips le panel hors-écran horizontalement.
                  - La hauteur est mesurée depuis le panel actif via ResizeObserver
                    et animée avec CSS transition → la modale grandit/rétrécit selon le contenu.
                  - Quand wrapperH est undefined (1er rendu), height: auto pour le rendu initial.
                */}
                <div
                    style={{
                        overflow: 'hidden',
                        height: wrapperH !== undefined ? wrapperH : 'auto',
                        transition: wrapperH !== undefined
                            ? 'height 320ms cubic-bezier(0.4, 0, 0.2, 1)'
                            : 'none',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            width: hasSpecs ? '200%' : '100%',
                            alignItems: 'flex-start',
                            transform: sliderTranslate,
                            transition: 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        {/* Panel 1 — toujours monté, état préservé */}
                        <div ref={panel1Ref} style={{ width: panelWidth }}>
                            <ProductionCostPanel
                                productName={productName}
                                quantity={quantity}
                                configuredEquipments={configuredEquipments}
                                commercialParams={commercialParams}
                                resolvedWorkflow={resolvedWorkflow}
                                hasSpecs={hasSpecs}
                                onNext={handleProductionNext}
                                onClose={onClose}
                            />
                        </div>

                        {/* Panel 2 — monté une fois et jamais démonté */}
                        {hasSpecs && schema && (
                            <div ref={panel2Ref} style={{ width: '50%' }}>
                                <SpecsPanel
                                    productName={productName}
                                    quantity={quantity}
                                    schema={schema}
                                    onBack={() => setStep(1)}
                                    onConfirm={handleSpecsConfirm}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddItemMultiStepModal;
