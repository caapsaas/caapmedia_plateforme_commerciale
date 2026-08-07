import React, { useEffect, useState } from 'react';
import {
    Order, OrderItem, PaymentStatus,
    FormDefinition, ProductSpecification, SpecFieldType, ResolvedOption,
} from '../../types';
import ConfirmationModal from '../common/ConfirmationModal';

const BACKEND_BASE = 'http://localhost:3000';

// ─── Formatters ────────────────────────────────────────────────────────────

// Exportés : réutilisés tels quels par ProductionValidationView.tsx (liste
// de la file de validation), pour ne pas dupliquer ces formatters.
export const fmtMoney = (n: number | null | undefined) =>
    n == null ? '—' : n.toLocaleString('fr-FR') + ' FCFA';

export const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const fmtNum = (n: number | string | null | undefined, decimals = 2) =>
    n == null ? '—' : Number(n).toFixed(decimals);

function formatSpecValue(spec: ProductSpecification, raw: unknown): string {
    if (raw === undefined || raw === null || raw === '') return '—';
    switch (spec.type) {
        case SpecFieldType.SELECT:
        case SpecFieldType.RADIO:
            return (spec.possibleValues as ResolvedOption[] | null)?.find(o => o.value === raw)?.label ?? String(raw);
        case SpecFieldType.MULTISELECT: {
            const vals = Array.isArray(raw) ? raw : [raw];
            return vals.map(v => (spec.possibleValues as ResolvedOption[] | null)?.find(o => o.value === v)?.label ?? String(v)).join(', ');
        }
        case SpecFieldType.CHECKBOX:
        case SpecFieldType.BOOLEAN:
            return raw ? 'Oui' : 'Non';
        case SpecFieldType.DIMENSIONS: {
            const dim = raw as { width?: number; height?: number };
            return `${dim?.width ?? '?'} × ${dim?.height ?? '?'}${spec.unit ? ` ${spec.unit}` : ''}`;
        }
        case SpecFieldType.UPLOAD:
            return typeof raw === 'string' ? raw : 'Fichier joint';
        default:
            return spec.unit ? `${raw} ${spec.unit}` : String(raw);
    }
}

// ─── Specs complètes organisées par groupe ─────────────────────────────────

const VisiBadge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${color}`}>{label}</span>
);

const SpecsFullView: React.FC<{ schema: FormDefinition; values: Record<string, unknown> }> = ({ schema, values }) => {
    const allSpecs = [
        ...schema.ungroupedSpecifications,
        ...schema.groups.flatMap(g => g.specifications),
    ];
    const filled = allSpecs.filter(s => {
        const v = values[s.technicalKey];
        return v !== undefined && v !== null && v !== '';
    });

    if (filled.length === 0) return <p className="text-slate-400 text-xs italic">Aucune spécification renseignée.</p>;

    const groupsWithValues = schema.groups
        .map(g => ({
            ...g,
            filledSpecs: g.specifications.filter(s => {
                const v = values[s.technicalKey];
                return v !== undefined && v !== null && v !== '';
            }),
        }))
        .filter(g => g.filledSpecs.length > 0);

    const ungroupedFilled = schema.ungroupedSpecifications.filter(s => {
        const v = values[s.technicalKey];
        return v !== undefined && v !== null && v !== '';
    });

    const renderSpecRow = (spec: ProductSpecification) => (
        <div key={spec.id} className="grid grid-cols-[1fr_auto_auto] items-start gap-x-3 gap-y-0 py-1.5 border-b border-slate-100 last:border-0">
            <div>
                <span className="text-sm text-slate-700 font-medium">{spec.name}</span>
                {spec.unit && <span className="text-xs text-slate-400 ml-1">({spec.unit})</span>}
            </div>
            <div className="flex gap-1 mt-0.5">
                {spec.visibleToClient && <VisiBadge label="Client" color="bg-blue-100 text-blue-700" />}
                {spec.visibleToProduction && <VisiBadge label="Prod." color="bg-[#c6e911]/30 text-slate-700" />}
            </div>
            <span className="text-sm text-slate-900 font-semibold text-right">
                {formatSpecValue(spec, values[spec.technicalKey])}
            </span>
        </div>
    );

    return (
        <div className="space-y-4">
            {ungroupedFilled.length > 0 && (
                <div className="divide-y divide-slate-100">
                    {ungroupedFilled.map(renderSpecRow)}
                </div>
            )}
            {groupsWithValues.map(g => (
                <div key={g.id}>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{g.name}</p>
                    <div className="divide-y divide-slate-100">
                        {g.filledSpecs.map(renderSpecRow)}
                    </div>
                </div>
            ))}
        </div>
    );
};

// ─── Tableau de calcul du coût de production (machines / workflow) ─────────

const ProductionCostTable: React.FC<{ item: OrderItem }> = ({ item }) => {
    const steps = item.productionSteps ?? [];
    const summary = item.productionSummary;

    if (steps.length === 0 && !summary) return null;

    const totalStepsCost = steps.reduce((acc, s) => acc + Number(s.calculatedCost), 0);

    return (
        <div className="rounded-xl overflow-hidden border border-slate-200">
            <div className="bg-slate-100 px-4 py-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-bold text-slate-600">Workflow de production (machines)</span>
            </div>

            {steps.length > 0 && (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide">
                            <th className="px-4 py-2 text-left w-6">#</th>
                            <th className="px-4 py-2 text-left">Machine</th>
                            <th className="px-4 py-2 text-right">Temps estimé</th>
                            <th className="px-4 py-2 text-right">Coût / h</th>
                            <th className="px-4 py-2 text-right">= Coût</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {steps.map(step => (
                            <tr key={step.id ?? step.stepOrder} className="hover:bg-slate-50">
                                <td className="px-4 py-2.5 text-slate-300 font-bold text-xs">{step.stepOrder}</td>
                                <td className="px-4 py-2.5 font-semibold text-slate-800">{step.equipmentNameSnapshot}</td>
                                <td className="px-4 py-2.5 text-right text-slate-700">
                                    <span className="font-semibold">{fmtNum(step.estimatedTimeHours)} h</span>
                                </td>
                                <td className="px-4 py-2.5 text-right text-slate-400 text-xs">
                                    {fmtMoney(step.hourlyRateSnapshot)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                                    {fmtMoney(step.calculatedCost)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50 border-t border-slate-200">
                            <td colSpan={4} className="px-4 py-2.5 text-sm font-semibold text-slate-600">
                                Total coût production
                            </td>
                            <td className="px-4 py-2.5 text-right text-base font-bold text-slate-800">
                                {fmtMoney(totalStepsCost)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            )}

            {summary && (() => {
                const coutBrut = Number(summary.totalProductionCost);
                const marge = Number(summary.marginPercent);
                const prixFinal = Number(summary.finalPrice);
                const margeColor = marge < 0 ? 'text-red-600' : marge < 10 ? 'text-orange-500' : 'text-green-600';

                return (
                    <div className="border-t border-slate-200">
                        <div className="flex justify-between items-center px-4 py-2.5 bg-white text-sm border-b border-slate-100">
                            <div className="flex items-center gap-2 text-slate-500">
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                                Coût de production brut
                            </div>
                            <span className="font-semibold text-slate-700">{fmtMoney(coutBrut)}</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-2.5 bg-white text-sm border-b border-slate-100">
                            <div className="flex items-center gap-2 text-slate-500">
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                                Marge définie par le commercial
                            </div>
                            <span className={`text-base font-bold ${margeColor}`}>
                                {fmtNum(marge, 1)} %
                            </span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3 bg-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-600 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                                <span className="text-sm font-semibold text-slate-300">Prix de vente total (HT)</span>
                            </div>
                            <span className="text-lg font-bold text-white">{fmtMoney(prixFinal)}</span>
                        </div>
                        {marge < 0 && (
                            <p className="text-xs text-red-700 bg-red-50 px-4 py-2 border-t border-red-100">
                                ⚠ Marge négative — le prix de vente est inférieur au coût de production.
                            </p>
                        )}
                        {marge >= 0 && marge < 10 && (
                            <p className="text-xs text-orange-600 bg-orange-50 px-4 py-2 border-t border-orange-100">
                                ⚠ Marge faible — à vérifier avant validation.
                            </p>
                        )}
                    </div>
                );
            })()}
        </div>
    );
};

// ─── Panneau de détail commande ────────────────────────────────────────────

const paymentBadge = (status: PaymentStatus) => {
    const cls =
        status === PaymentStatus.PAID ? 'bg-green-100 text-green-800' :
        status === PaymentStatus.PARTIALLY_PAID ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800';
    const labels: Record<string, string> = {
        PAID: 'Payé', PARTIALLY_PAID: 'Partiellement payé', UNPAID: 'Non payé',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{labels[status] ?? status}</span>;
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{children}</h4>
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between gap-4 py-1.5 border-b border-slate-100 last:border-0 text-sm">
        <span className="text-slate-500 shrink-0">{label}</span>
        <span className="text-slate-800 font-medium text-right">{value}</span>
    </div>
);

// Le backend renvoie toujours order.orderItems (jamais order.items — voir le
// même correctif sur BonDeCommande.tsx/BonDeLivraison.tsx).
const getOrderItems = (order: Order): OrderItem[] =>
    ((order as any).orderItems?.length ? (order as any).orderItems : order.items) ?? [];

export interface OrderDetailsPanelProps {
    order: Order;
    onClose: () => void;
    // Actions de validation production — optionnelles : absentes = panneau
    // en lecture seule (cas Sales.tsx "Voir détails", Production.tsx "détails").
    onValidate?: () => void;
    onReject?: () => void;
    isValidating?: boolean;
    isRejecting?: boolean;
    canValidate?: boolean;
    // Piloté par l'appelant pour l'animation de fermeture (slide-out avant
    // démontage) — voir ProductionValidationView.tsx::closePanel.
    isClosing?: boolean;
}

/**
 * Détail complet d'une commande : infos générales, résumé financier, chaque
 * ligne avec options/spécifications techniques/fichier BAT/workflow de
 * production (machines, temps, coût), historique de production. Extrait de
 * ProductionValidationView.tsx (OrderDetailPanel) pour être réutilisé partout
 * où une commande doit être consultée en détail — pas seulement la file de
 * validation production (Sales.tsx "Voir détails", Production.tsx).
 */
const OrderDetailsPanel: React.FC<OrderDetailsPanelProps> = ({
    order, onClose, onValidate, onReject, isValidating = false, isRejecting = false, canValidate = false, isClosing = false,
}) => {
    const [confirmReject, setConfirmReject] = useState(false);
    const [entered, setEntered] = useState(false);
    const orderDate = order.orderDate ?? order.date;
    const items = getOrderItems(order);

    useEffect(() => {
        const id = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const isOut = isClosing || !entered;
    const salesRepName = order.salesRep
        ? `${order.salesRep.firstName ?? ''} ${order.salesRep.lastName ?? ''}`.trim() || order.salesRep.email
        : '—';

    return (
        <div
            className={`fixed inset-0 z-50 flex justify-end bg-black/60 transition-opacity duration-300 ease-in-out ${isOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            onClick={onClose}
        >
            <div
                className={`h-full w-full max-w-3xl bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOut ? 'translate-x-full' : 'translate-x-0'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* En-tête */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50 shrink-0">
                    <div>
                        <p className="text-xs text-slate-500 font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                        <h3 className="text-xl font-bold text-slate-900 mt-0.5">{order.customerName}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Commande du {fmtDate(orderDate)} · {order.subsidiary?.subsidiaryName ?? ''}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-3xl leading-none shrink-0 mt-0.5">×</button>
                </div>

                {/* Corps scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

                    {/* Infos générales */}
                    <div>
                        <SectionTitle>Informations générales</SectionTitle>
                        <div className="bg-slate-50 rounded-lg p-4">
                            <Row label="Client" value={order.customer?.contactName ?? order.customerName} />
                            {order.customer?.email && <Row label="Email client" value={order.customer.email} />}
                            {order.customer?.phone && <Row label="Tél client" value={order.customer.phone} />}
                            <Row label="Commercial" value={salesRepName} />
                            <Row label="Date commande" value={fmtDate(orderDate)} />
                            <Row label="Échéance paiement" value={fmtDate(order.paymentDueDate)} />
                        </div>
                    </div>

                    {/* Résumé financier */}
                    <div>
                        <SectionTitle>Résumé financier</SectionTitle>
                        <div className="bg-slate-50 rounded-lg p-4">
                            <Row label="Sous-total HT" value={fmtMoney(order.subtotal)} />
                            <Row label={`TVA (${(Number(order.taxRateValue) * 100).toFixed(0)} %)`} value={fmtMoney(order.taxAmount)} />
                            <Row label="Total TTC" value={<span className="text-base font-bold text-slate-900">{fmtMoney(order.totalAmount)}</span>} />
                            <Row label="Montant payé" value={fmtMoney(order.amountPaid)} />
                            <Row label="Reste à payer" value={fmtMoney(Number(order.totalAmount) - Number(order.amountPaid))} />
                            <Row label="Statut paiement" value={paymentBadge(order.paymentStatus)} />
                        </div>
                    </div>

                    {/* Lignes de commande */}
                    <div>
                        <SectionTitle>Lignes de commande ({items.length})</SectionTitle>
                        <div className="space-y-6">
                            {items.map((item, idx) => {
                                const lineTotal = Number(item.total) || (Number(item.unitPrice) * item.quantity - Number(item.discount ?? 0));
                                return (
                                    <div key={item.id ?? idx} className="border border-slate-200 rounded-xl overflow-hidden">

                                        {/* En-tête de ligne */}
                                        <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold bg-[#c6e911] text-slate-800 rounded-full w-6 h-6 flex items-center justify-center shrink-0">{idx + 1}</span>
                                                <span className="font-bold text-white">{(item as any).productName ?? item.product?.name ?? '—'}</span>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-[#c6e911]">{fmtMoney(lineTotal)}</p>
                                                <p className="text-xs text-slate-300">
                                                    {item.quantity} × {fmtMoney(item.unitPrice)}/u
                                                    {item.discount && Number(item.discount) > 0 ? ` − ${fmtMoney(item.discount)}` : ''}
                                                    {item.assemblyPrice != null && Number(item.assemblyPrice) > 0 ? ` + ${fmtMoney(item.assemblyPrice)} assemblage` : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-4 space-y-5">

                                            {/* Options produit */}
                                            {item.productOptions && item.productOptions.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Options</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.productOptions.map((o, i) => (
                                                            <span key={i} className="px-2.5 py-1 bg-slate-100 rounded-lg text-sm text-slate-700">
                                                                <span className="text-slate-400 text-xs">{o.optionType} : </span>{o.optionValue}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Prix d'assemblage — coût de finition post-production pour
                                                certains services, saisi par le commercial à la commande. */}
                                            {item.assemblyPrice != null && Number(item.assemblyPrice) > 0 && (
                                                <div className="flex justify-between items-center bg-slate-50 rounded-lg px-4 py-2.5">
                                                    <span className="text-sm text-slate-600">Prix d'assemblage</span>
                                                    <span className="text-sm font-bold text-slate-800">{fmtMoney(item.assemblyPrice)}</span>
                                                </div>
                                            )}

                                            {/* Spécifications complètes */}
                                            {item.specSnapshot && item.specValues && (() => {
                                                const vals = item.specValues as Record<string, unknown>;
                                                const hasValues = [
                                                    ...item.specSnapshot.ungroupedSpecifications,
                                                    ...item.specSnapshot.groups.flatMap(g => g.specifications),
                                                ].some(s => vals[s.technicalKey] !== undefined && vals[s.technicalKey] !== null && vals[s.technicalKey] !== '');
                                                return hasValues ? (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <p className="text-xs font-semibold text-slate-500 uppercase">Spécifications techniques</p>
                                                        </div>
                                                        <div className="bg-slate-50 rounded-lg px-4 py-2">
                                                            <SpecsFullView schema={item.specSnapshot} values={vals} />
                                                        </div>
                                                    </div>
                                                ) : null;
                                            })()}

                                            {/* Fichier BAT / design */}
                                            {item.designFileUrl && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Fichier BAT</p>
                                                    <a
                                                        href={`${BACKEND_BASE}${item.designFileUrl}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors border border-blue-200"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                        </svg>
                                                        {item.designFileName ?? 'Voir le fichier BAT'}
                                                    </a>
                                                </div>
                                            )}

                                            {/* Calcul du coût de production */}
                                            {((item.productionSteps && item.productionSteps.length > 0) || item.productionSummary) && (
                                                <ProductionCostTable item={item} />
                                            )}

                                            {/* Aucune étape de production — article simple sans workflow */}
                                            {(!item.productionSteps || item.productionSteps.length === 0) && !item.productionSummary && (
                                                <p className="text-xs text-slate-400 italic">
                                                    Pas de workflow de production défini pour cet article.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Historique des statuts de production */}
                    {order.productionHistory && order.productionHistory.length > 0 && (
                        <div>
                            <SectionTitle>Historique production</SectionTitle>
                            <div className="space-y-1">
                                {order.productionHistory.map((h, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm py-1">
                                        <span className="w-2 h-2 rounded-full bg-[#c6e911] shrink-0" />
                                        <span className="text-slate-700">{h.status}</span>
                                        <span className="text-slate-400 text-xs ml-auto">{fmtDate(h.changeDate ?? h.date)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer — actions de validation, uniquement quand fournies par l'appelant */}
                {(onValidate || onReject) && (
                    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4 shrink-0">
                        {canValidate ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setConfirmReject(true)}
                                    disabled={isRejecting || isValidating}
                                    className="px-5 py-2.5 rounded-lg border-2 border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                                >
                                    {isRejecting ? 'Rejet en cours…' : 'Rejeter'}
                                </button>
                                <button
                                    type="button"
                                    onClick={onValidate}
                                    disabled={isValidating || isRejecting}
                                    className="px-6 py-2.5 rounded-lg bg-[#c6e911] text-slate-800 text-sm font-bold hover:bg-[#adc40f] disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {isValidating ? 'Validation…' : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Valider pour production
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <p className="text-xs text-slate-400 italic">
                                Lecture seule — la validation est réservée au directeur de production.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {confirmReject && onReject && (
                <ConfirmationModal
                    isOpen
                    onClose={() => setConfirmReject(false)}
                    onConfirm={() => { setConfirmReject(false); onReject(); }}
                    title="Rejeter la commande"
                    message={`Voulez-vous rejeter la commande de « ${order.customerName} » ? Elle sera annulée et le commercial devra la recréer.`}
                />
            )}
        </div>
    );
};

export default OrderDetailsPanel;
