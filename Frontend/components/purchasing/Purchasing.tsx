import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    PurchaseOrder, PurchaseOrderStatus, PaymentStatus,
    StockItem, Supplier, Subsidiary, UserRole,
} from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import {
    getPurchaseOrders, createPurchaseOrder, receivePurchaseOrderItems,
    recordPurchaseOrderPayment, CreatePurchaseOrderDto, ReceiveItemsDto,
} from '../../services/apiPurchasing/apiPurchase_order';
import { getSuppliers } from '../../services/apiPurchasing/apiSupplier';
import { getStockItemsBySubsidiary } from '../../services/apiPurchasing/apiStockItems';
import { getSubsidiaries } from '../../services/apiCommon/apiSubsidiaries';
import IconPlus from '../icons/IconPlus';
import IconEye from '../icons/IconEye';
import IconCheck from '../icons/IconCheck';
import IconCoins from '../icons/IconCoins';
import IconChevronDown from '../icons/IconChevronDown';
import IconChevronRight from '../icons/IconChevronRight';
import PurchaseOrderFormModal from './PurchaseOrderFormModal';
import PurchaseOrderDetailsModal from './PurchaseOrderDetailsModal';
import ReceiveItemsModal from './ReceiveItemsModal';
import RecordPaymentModal from './RecordPaymentModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d?: string | null) => {
    if (!d) return '—';
    const date = new Date(d);
    return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
};

const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
    [PurchaseOrderStatus.DRAFT]: 'Brouillon',
    [PurchaseOrderStatus.ORDERED]: 'Commandé',
    [PurchaseOrderStatus.PARTIALLY_RECEIVED]: 'Reçu partiel',
    [PurchaseOrderStatus.RECEIVED]: 'Reçu',
    [PurchaseOrderStatus.CANCELLED]: 'Annulé',
};

const PO_STATUS_CLASS: Record<PurchaseOrderStatus, string> = {
    [PurchaseOrderStatus.DRAFT]: 'bg-slate-100 text-slate-600',
    [PurchaseOrderStatus.ORDERED]: 'bg-blue-100 text-blue-700',
    [PurchaseOrderStatus.PARTIALLY_RECEIVED]: 'bg-amber-100 text-amber-700',
    [PurchaseOrderStatus.RECEIVED]: 'bg-green-100 text-green-700',
    [PurchaseOrderStatus.CANCELLED]: 'bg-red-100 text-red-700',
};

const PAY_STATUS_LABELS: Record<PaymentStatus, string> = {
    [PaymentStatus.UNPAID]: 'Non payé',
    [PaymentStatus.PARTIALLY_PAID]: 'Partiel',
    [PaymentStatus.PAID]: 'Payé',
};

const PAY_STATUS_CLASS: Record<PaymentStatus, string> = {
    [PaymentStatus.UNPAID]: 'bg-red-100 text-red-700',
    [PaymentStatus.PARTIALLY_PAID]: 'bg-amber-100 text-amber-700',
    [PaymentStatus.PAID]: 'bg-green-100 text-green-700',
};

// ─── Composant principal ──────────────────────────────────────────────────────
const Purchasing: React.FC = () => {
    const { t, formatCurrency } = useI18n();
    const toast = useToast();
    const { subsidiary, user } = useAuth();
    const queryClient = useQueryClient();

    const isSuperAdmin = user?.userRole === UserRole.SUPER_ADMIN || user?.activeRole === UserRole.SUPER_ADMIN;

    const [subsidiaryFilter, setSubsidiaryFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | ''>('');
    const [expandedPoId, setExpandedPoId] = useState<string | null>(null);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [modal, setModal] = useState<'form' | 'details' | 'receive' | 'payment' | null>(null);

    const openModal = (po: PurchaseOrder | null, type: typeof modal) => { setSelectedPO(po); setModal(type); };
    const closeModal = () => { setSelectedPO(null); setModal(null); };

    // Filiales (SUPER_ADMIN uniquement)
    const { data: subsidiaries = [] } = useQuery<Subsidiary[]>({
        queryKey: ['subsidiaries-list'],
        queryFn: getSubsidiaries,
        enabled: isSuperAdmin,
    });

    const { data: orders = [], isLoading } = useQuery<PurchaseOrder[]>({
        queryKey: ['purchaseOrders', subsidiaryFilter, statusFilter],
        queryFn: () => getPurchaseOrders({
            ...(statusFilter ? { status: statusFilter } : {}),
            ...(isSuperAdmin && subsidiaryFilter ? { subsidiaryId: subsidiaryFilter } : {}),
        }),
        enabled: isSuperAdmin || !!subsidiary,
    });

    const { data: stockItems = [] } = useQuery<StockItem[]>({
        queryKey: ['stockItems', subsidiary?.id],
        queryFn: () => getStockItemsBySubsidiary(),
        enabled: !!subsidiary,
    });

    const { data: suppliers = [] } = useQuery<Supplier[]>({
        queryKey: ['suppliers', subsidiary?.id],
        queryFn: () => getSuppliers(),
        enabled: !!subsidiary,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });

    const { mutate: createPO } = useMutation({
        mutationFn: createPurchaseOrder,
        onSuccess: () => { toast.success('Commande créée', 'Le bon de commande a été envoyé.'); invalidate(); closeModal(); },
        onError: () => toast.error('Erreur', 'Impossible de créer la commande.'),
    });

    const { mutate: receiveItems } = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ReceiveItemsDto }) => receivePurchaseOrderItems(id, data),
        onSuccess: () => { toast.success('Articles reçus', 'Le stock a été mis à jour.'); invalidate(); closeModal(); },
        onError: () => toast.error('Erreur', 'Impossible d\'enregistrer la réception.'),
    });

    const { mutate: recordPayment } = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { amount: number } }) => recordPurchaseOrderPayment(id, data),
        onSuccess: () => { toast.success('Paiement enregistré', 'Le règlement a été comptabilisé.'); invalidate(); closeModal(); },
        onError: () => toast.error('Erreur', 'Impossible d\'enregistrer le paiement.'),
    });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">{t('purchasing.title')}</h2>

            <div className="space-y-4">
                {/* Barre d'outils */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Filtre filiale (SUPER_ADMIN) */}
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
                        {/* Filtre statut */}
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as PurchaseOrderStatus | '')}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                        >
                            <option value="">Tous les statuts</option>
                            {Object.values(PurchaseOrderStatus).map(s => (
                                <option key={s} value={s}>{PO_STATUS_LABELS[s]}</option>
                            ))}
                        </select>
                    </div>
                    {!isSuperAdmin && (
                        <button
                            onClick={() => openModal(null, 'form')}
                            className="flex items-center gap-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-bold rounded-lg hover:bg-[#adc40f] transition-colors"
                        >
                            <IconPlus className="h-4 w-4" />
                            {t('purchasing.newOrder')}
                        </button>
                    )}
                </div>

                {/* Tableau */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <div className="min-w-max">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide border-b border-slate-200">
                                    <tr>
                                        <th className="w-10 px-3 py-3"></th>
                                        <th className="px-4 py-3 text-left font-semibold">Réf.</th>
                                        <th className="px-4 py-3 text-left font-semibold">{t('purchasing.supplier')}</th>
                                        {isSuperAdmin && <th className="px-4 py-3 text-left font-semibold">Filiale</th>}
                                        <th className="px-4 py-3 text-left font-semibold">{t('purchasing.orderDate')}</th>
                                        <th className="px-4 py-3 text-left font-semibold">Livraison prévue</th>
                                        <th className="px-4 py-3 text-right font-semibold">{t('purchasing.total')}</th>
                                        <th className="px-4 py-3 text-center font-semibold">{t('purchasing.status')}</th>
                                        <th className="px-4 py-3 text-center font-semibold">{t('purchasing.paymentStatus.title')}</th>
                                        <th className="px-4 py-3 sticky right-0 bg-slate-50 border-l border-slate-200 shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.06)]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {isLoading ? (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <tr key={i}>
                                                <td colSpan={isSuperAdmin ? 10 : 9} className="px-4 py-3">
                                                    <div className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: `${65 + i * 8}%`, opacity: 1 - i * 0.2 }} />
                                                </td>
                                            </tr>
                                        ))
                                    ) : orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={isSuperAdmin ? 10 : 9} className="py-20 text-center">
                                                <svg className="w-12 h-12 mx-auto mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="font-medium text-slate-500">Aucun bon de commande</p>
                                                <p className="text-sm text-slate-400 mt-1">
                                                    {statusFilter
                                                        ? `Aucune commande avec le statut « ${PO_STATUS_LABELS[statusFilter as PurchaseOrderStatus]} ».`
                                                        : 'Les bons de commande apparaîtront ici.'}
                                                </p>
                                            </td>
                                        </tr>
                                    ) : orders.map(po => {
                                        const isExpanded = expandedPoId === po.id;
                                        const toggle = () => setExpandedPoId(isExpanded ? null : po.id);
                                        const colSpan = isSuperAdmin ? 10 : 9;

                                        return (
                                            <React.Fragment key={po.id}>
                                                <tr
                                                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                                                    onClick={toggle}
                                                >
                                                    <td className="px-3 py-3 text-slate-400">
                                                        {isExpanded
                                                            ? <IconChevronDown className="h-4 w-4" />
                                                            : <IconChevronRight className="h-4 w-4" />
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                                        #{po.id.slice(-8).toUpperCase()}
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-slate-800">{po.supplierName}</td>
                                                    {isSuperAdmin && (
                                                        <td className="px-4 py-3 text-slate-500">
                                                            {(po as any).subsidiary?.subsidiaryName ?? '—'}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtDate(po.orderDate)}</td>
                                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtDate(po.expectedDeliveryDate)}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-800 whitespace-nowrap">
                                                        {formatCurrency(po.totalAmount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PO_STATUS_CLASS[po.status]}`}>
                                                            {PO_STATUS_LABELS[po.status]}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PAY_STATUS_CLASS[po.paymentStatus]}`}>
                                                            {PAY_STATUS_LABELS[po.paymentStatus]}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 sticky right-0 bg-white border-l border-slate-100 shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.06)]"
                                                        onClick={e => e.stopPropagation()}>
                                                        <div className="flex items-center gap-1">
                                                            {!isSuperAdmin && (po.status === PurchaseOrderStatus.ORDERED || po.status === PurchaseOrderStatus.PARTIALLY_RECEIVED) && (
                                                                <button onClick={() => openModal(po, 'receive')}
                                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                    title={t('purchasing.receiveOrder')}>
                                                                    <IconCheck className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                            {!isSuperAdmin && po.paymentStatus !== PaymentStatus.PAID && po.status !== PurchaseOrderStatus.DRAFT && (
                                                                <button onClick={() => openModal(po, 'payment')}
                                                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                                    title={t('purchasing.recordPayment')}>
                                                                    <IconCoins className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                            <button onClick={() => openModal(po, 'details')}
                                                                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                                                title={t('purchasing.viewOrder')}>
                                                                <IconEye className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Ligne dépliée : détail des articles */}
                                                {isExpanded && (
                                                    <tr className="bg-slate-50/80">
                                                        <td colSpan={colSpan} className="px-10 py-4">
                                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                                                                Lignes de commande ({po.items.length})
                                                            </p>
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="text-slate-400 border-b border-slate-200">
                                                                        <th className="text-left pb-1.5">Produit</th>
                                                                        <th className="text-center pb-1.5">Qté commandée</th>
                                                                        <th className="text-center pb-1.5">Qté reçue</th>
                                                                        <th className="text-right pb-1.5">P.U. achat</th>
                                                                        <th className="text-right pb-1.5">Total ligne</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100">
                                                                    {po.items.map((item, idx) => {
                                                                        const unit = item.purchaseUnit ?? item.product?.baseUnit;
                                                                        const allReceived = item.quantityReceived >= item.quantity;
                                                                        return (
                                                                            <tr key={idx}>
                                                                                <td className="py-1.5 text-slate-700 font-medium">{item.productName}</td>
                                                                                <td className="py-1.5 text-center text-slate-500">
                                                                                    {item.quantity}{unit ? ` ${unit.symbol ?? unit.name}` : ''}
                                                                                </td>
                                                                                <td className="py-1.5 text-center">
                                                                                    <span className={`font-semibold ${allReceived ? 'text-green-600' : 'text-amber-600'}`}>
                                                                                        {item.quantityReceived}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="py-1.5 text-right text-slate-500">{formatCurrency(item.purchasePrice)}</td>
                                                                                <td className="py-1.5 text-right font-bold text-slate-700">{formatCurrency(item.purchasePrice * item.quantity)}</td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {modal === 'form' && (
                <PurchaseOrderFormModal
                    isOpen onClose={closeModal}
                    onSave={(data: CreatePurchaseOrderDto) => createPO(data)}
                    stockItems={stockItems} suppliers={suppliers}
                />
            )}
            {modal === 'details' && selectedPO && subsidiary && (
                <PurchaseOrderDetailsModal
                    isOpen onClose={closeModal}
                    purchaseOrder={selectedPO} subsidiary={subsidiary}
                />
            )}
            {modal === 'receive' && selectedPO && (
                <ReceiveItemsModal
                    isOpen onClose={closeModal}
                    purchaseOrder={selectedPO}
                    onReceive={(id, items) => receiveItems({ id, data: { items } })}
                />
            )}
            {modal === 'payment' && selectedPO && (
                <RecordPaymentModal
                    isOpen onClose={closeModal}
                    purchaseOrder={selectedPO}
                    onRecordPayment={(id, amount) => recordPayment({ id, data: { amount } })}
                />
            )}
        </div>
    );
};

export default Purchasing;
