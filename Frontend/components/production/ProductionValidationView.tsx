import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Order, UserRole, Subsidiary } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import {
    getPendingValidationOrders,
    validateOrderForProduction,
    rejectOrderByDirector,
} from '../../services/apiE-commerce/apiOrders';
import { getSubsidiaries } from '../../services/apiCommon/apiSubsidiaries';
import EmptyState from '../ui/EmptyState';
// Panneau de détail extrait dans OrderDetailsPanel.tsx pour être réutilisé
// ailleurs (Sales.tsx "Voir détails", Production.tsx) — plus de duplication
// des formatters/sections specs+workflow production ici.
import OrderDetailsPanel, { fmtMoney, fmtDate } from './OrderDetailsPanel';

// ─── Vue principale ─────────────────────────────────────────────────────────

const ProductionValidationView: React.FC = () => {
    const { t } = useI18n();
    const { user } = useAuth();
    const toast = useToast();
    const queryClient = useQueryClient();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [closingPanel, setClosingPanel] = useState(false);
    const [subsidiaryFilter, setSubsidiaryFilter] = useState<string>('');

    const closePanel = () => {
        setClosingPanel(true);
        setTimeout(() => {
            setSelectedOrder(null);
            setClosingPanel(false);
        }, 280);
    };

    const activeRole = user?.activeRole ?? user?.userRole;
    // Super Admin : vue consolidée toutes filiales, lecture seule
    const isSuperAdmin = activeRole === UserRole.SUPER_ADMIN;
    const canSeeValidation =
        activeRole === UserRole.PRODUCTION_DIRECTOR ||
        activeRole === UserRole.ADMIN ||
        activeRole === UserRole.SUPER_ADMIN;
    const canValidate =
        activeRole === UserRole.PRODUCTION_DIRECTOR ||
        activeRole === UserRole.ADMIN;

    const { data: subsidiaries = [] } = useQuery<Subsidiary[]>({
        queryKey: ['subsidiaries-list'],
        queryFn: getSubsidiaries,
        enabled: isSuperAdmin,
    });

    const { data: orders = [], isLoading } = useQuery<Order[]>({
        queryKey: ['pendingValidationOrders', subsidiaryFilter],
        queryFn: () => getPendingValidationOrders(subsidiaryFilter || undefined),
        enabled: canSeeValidation,
        refetchInterval: 30_000,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['pendingValidationOrders'] });
        queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
    };

    const { mutate: validate, isPending: isValidating } = useMutation({
        mutationFn: (orderId: string) => validateOrderForProduction(orderId),
        onSuccess: () => {
            toast.success('Commande validée', 'La commande est maintenant en production.');
            closePanel();
            invalidate();
        },
        onError: () => toast.error('Erreur', 'Impossible de valider la commande.'),
    });

    const { mutate: reject, isPending: isRejecting } = useMutation({
        mutationFn: (orderId: string) => rejectOrderByDirector(orderId),
        onSuccess: () => {
            toast.success('Commande rejetée', 'La commande a été annulée.');
            closePanel();
            invalidate();
        },
        onError: () => toast.error('Erreur', 'Impossible de rejeter la commande.'),
    });

    if (!canSeeValidation) return null;

    return (
        <div className="space-y-4">
            {/* Barre de titre */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-800">Validation des commandes</h3>
                    {orders.length > 0 && (
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                            {orders.length} en attente
                        </span>
                    )}
                </div>
                {isSuperAdmin && subsidiaries.length > 0 && (
                    <select
                        value={subsidiaryFilter}
                        onChange={e => setSubsidiaryFilter(e.target.value)}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                    >
                        <option value="">Toutes les filiales</option>
                        {subsidiaries.map(s => (
                            <option key={s.id} value={s.id}>{s.subsidiaryName}</option>
                        ))}
                    </select>
                )}
            </div>

            {isLoading ? (
                /* Skeleton */
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide">
                            <tr>
                                <th className="px-4 py-3 text-left">Client</th>
                                <th className="px-4 py-3 text-left">Commercial</th>
                                {isSuperAdmin && <th className="px-4 py-3 text-left">Filiale</th>}
                                <th className="px-4 py-3 text-left">Date</th>
                                <th className="px-4 py-3 text-center">Articles</th>
                                <th className="px-4 py-3 text-right">Montant</th>
                                <th className="px-4 py-3 text-center">Marge</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i} className="bg-white" style={{ opacity: 1 - i * 0.2 }}>
                                    <td className="px-4 py-3"><div className="h-3 w-32 bg-slate-100 rounded animate-pulse" /></td>
                                    <td className="px-4 py-3"><div className="h-3 w-24 bg-slate-100 rounded animate-pulse" /></td>
                                    {isSuperAdmin && <td className="px-4 py-3"><div className="h-3 w-20 bg-slate-100 rounded animate-pulse" /></td>}
                                    <td className="px-4 py-3"><div className="h-3 w-20 bg-slate-100 rounded animate-pulse" /></td>
                                    <td className="px-4 py-3 text-center"><div className="h-3 w-8 bg-slate-100 rounded animate-pulse mx-auto" /></td>
                                    <td className="px-4 py-3 text-right"><div className="h-3 w-24 bg-slate-100 rounded animate-pulse ml-auto" /></td>
                                    <td className="px-4 py-3 text-center"><div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse mx-auto" /></td>
                                    <td className="px-4 py-3"><div className="h-7 w-20 bg-slate-100 rounded animate-pulse ml-auto" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200">
                    <EmptyState icon="order" title="File d'attente vide" description="Toutes les commandes ont été traitées." />
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">Client</th>
                                    <th className="px-4 py-3 text-left font-semibold">Commercial</th>
                                    {isSuperAdmin && <th className="px-4 py-3 text-left font-semibold">Filiale</th>}
                                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                                    <th className="px-4 py-3 text-center font-semibold">Articles</th>
                                    <th className="px-4 py-3 text-right font-semibold">Montant</th>
                                    <th className="px-4 py-3 text-center font-semibold">Marge</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map(order => {
                                    const orderDate = order.orderDate ?? order.date;
                                    const totalQty = (order.orderItems ?? []).reduce((acc, i) => acc + i.quantity, 0);
                                    const hasNegativeMargin = (order.orderItems ?? []).some(i =>
                                        i.productionSummary && Number(i.productionSummary.marginPercent) < 0
                                    );
                                    const hasLowMargin = !hasNegativeMargin && (order.orderItems ?? []).some(i =>
                                        i.productionSummary && Number(i.productionSummary.marginPercent) < 10
                                    );
                                    const salesRepName = order.salesRep
                                        ? (`${order.salesRep.firstName ?? ''} ${order.salesRep.lastName ?? ''}`).trim() || order.salesRep.email
                                        : '—';

                                    return (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                                    <span className="font-semibold text-slate-800">{order.customerName}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{salesRepName}</td>
                                            {isSuperAdmin && (
                                                <td className="px-4 py-3 text-slate-500">{order.subsidiary?.subsidiaryName ?? '—'}</td>
                                            )}
                                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtDate(orderDate)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-slate-700 font-medium">{(order.orderItems ?? []).length}</span>
                                                <span className="text-slate-400 text-xs ml-1">({totalQty} art.)</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-800 whitespace-nowrap">
                                                {fmtMoney(order.totalAmount)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {hasNegativeMargin ? (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Marge −</span>
                                                ) : hasLowMargin ? (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Faible</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-400">OK</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors whitespace-nowrap"
                                                >
                                                    Examiner
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selectedOrder && (
                <OrderDetailsPanel
                    order={selectedOrder}
                    onClose={closePanel}
                    onValidate={() => validate(selectedOrder.id)}
                    onReject={() => reject(selectedOrder.id)}
                    isValidating={isValidating}
                    isRejecting={isRejecting}
                    canValidate={canValidate}
                    isClosing={closingPanel}
                />
            )}
        </div>
    );
};

export default ProductionValidationView;
