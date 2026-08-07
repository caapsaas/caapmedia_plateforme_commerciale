import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    PurchaseOrder, PurchaseOrderStatus, PaymentStatus,
    Subsidiary, Supplier, UserRole,
} from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import {
    getPurchaseOrders, getPurchaseOrderById, createPurchaseOrder, receivePurchaseOrderItems,
    CreatePurchaseOrderDto, ReceiveItemsDto, FindAllPurchaseOrdersDto, OrderPeriod,
} from '../../services/apiPurchasing/apiPurchase_order';
import { getSuppliers } from '../../services/apiPurchasing/apiSupplier';
import { getSubsidiaries } from '../../services/apiCommon/apiSubsidiaries';
import SelectFilter from '../filters/SelectFilter';
import PeriodFilter from '../filters/PeriodFilter';
import IconPlus from '../icons/IconPlus';
import IconEye from '../icons/IconEye';
import IconCheck from '../icons/IconCheck';
import IconCoins from '../icons/IconCoins';
import IconDocumentText from '../icons/IconDocumentText';
import IconChevronDown from '../icons/IconChevronDown';
import PurchaseOrderFormModal from './PurchaseOrderFormModal';
import PurchaseOrderDetailsModal from './PurchaseOrderDetailsModal';
import ReceiveItemsModal from './ReceiveItemsModal';
import PaySupplierDebtModal from '../finance/PaySupplierDebtModal';
import BonEntree from '../../Pages/BonEntree';
import EmptyState from '../ui/EmptyState';

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

const initialFilterState: FindAllPurchaseOrdersDto = { period: 'all_time' };

const getPeriodDates = (period?: OrderPeriod) => {
    const now = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    switch (period) {
        case 'last_7_days': {
            const start = new Date();
            start.setDate(now.getDate() - 7);
            return { startDate: formatDate(start), endDate: formatDate(now) };
        }
        case 'last_30_days': {
            const start = new Date();
            start.setDate(now.getDate() - 30);
            return { startDate: formatDate(start), endDate: formatDate(now) };
        }
        case 'last_90_days': {
            const start = new Date();
            start.setDate(now.getDate() - 90);
            return { startDate: formatDate(start), endDate: formatDate(now) };
        }
        case 'this_month': {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return { startDate: formatDate(start), endDate: formatDate(now) };
        }
        case 'last_month': {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            return { startDate: formatDate(start), endDate: formatDate(end) };
        }
        case 'this_year': {
            const start = new Date(now.getFullYear(), 0, 1);
            return { startDate: formatDate(start), endDate: formatDate(now) };
        }
        case 'custom':
        default:
            return { startDate: '', endDate: '' };
    }
};

// ─── Composant principal ──────────────────────────────────────────────────────
const Purchasing: React.FC = () => {
    const { t, formatCurrency } = useI18n();
    const toast = useToast();
    const { subsidiary, user } = useAuth();
    const queryClient = useQueryClient();

    // `activeRole` prime sur `userRole` (aperçu de rôle par un SUPER_ADMIN,
    // voir AppContext) — l'ancien check `userRole === SUPER_ADMIN ||
    // activeRole === SUPER_ADMIN` restait vrai même en aperçu "Directeur des
    // achats", cachant les actions Nouveau bon de commande/Réceptionner à un
    // SUPER_ADMIN prévisualisant ce rôle.
    const activeRole = user?.activeRole ?? user?.userRole;
    const isSuperAdmin = activeRole === UserRole.SUPER_ADMIN;

    const [activeTab, setActiveTab] = useState<'orders' | 'receipts'>('orders');
    const [showHistory, setShowHistory] = useState(true);
    const [filters, setFilters] = useState<FindAllPurchaseOrdersDto>(initialFilterState);
    const [appliedFilters, setAppliedFilters] = useState<FindAllPurchaseOrdersDto>(initialFilterState);
    const [expandedPoId, setExpandedPoId] = useState<string | null>(null);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [modal, setModal] = useState<'form' | 'details' | 'receive' | 'payment' | 'goodsReceipt' | null>(null);

    const openModal = (po: PurchaseOrder | null, type: typeof modal) => { setSelectedPO(po); setModal(type); };
    const closeModal = () => { setSelectedPO(null); setModal(null); };

    // Filiales (SUPER_ADMIN uniquement)
    const { data: subsidiaries = [] } = useQuery<Subsidiary[]>({
        queryKey: ['subsidiaries-list'],
        queryFn: getSubsidiaries,
        enabled: isSuperAdmin,
    });

    const { data: suppliers = [] } = useQuery<Supplier[]>({
        queryKey: ['suppliers-list'],
        queryFn: getSuppliers,
        enabled: isSuperAdmin || !!subsidiary,
    });

    const { data: orders = [], isLoading } = useQuery<PurchaseOrder[]>({
        queryKey: ['purchaseOrders', subsidiary?.id, appliedFilters],
        queryFn: () => getPurchaseOrders(appliedFilters),
        enabled: isSuperAdmin || !!subsidiary,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });

    const { mutate: createPO } = useMutation({
        mutationFn: createPurchaseOrder,
        onSuccess: () => { toast.success('Commande créée', 'Le bon de commande a été envoyé.'); invalidate(); closeModal(); },
        onError: () => toast.error('Erreur', 'Impossible de créer la commande.'),
    });

    // Après réception, on rouvre directement le bon d'entrée (re-fetch : la
    // mutation ne renvoie pas les lignes/quantités mises à jour) — sinon
    // l'utilisateur doit rouvrir manuellement la commande pour le voir.
    const { mutate: receiveItems } = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ReceiveItemsDto }) => receivePurchaseOrderItems(id, data),
        onSuccess: async (_, { id }) => {
            toast.success('Articles reçus', 'Le stock a été mis à jour.');
            invalidate();
            const updated = await getPurchaseOrderById(id);
            setSelectedPO(updated);
            setModal('goodsReceipt');
        },
        onError: () => toast.error('Erreur', 'Impossible d\'enregistrer la réception.'),
    });

    const handleApplyFilters = () => {
        const cleaned: FindAllPurchaseOrdersDto = {};
        if (isSuperAdmin && filters.subsidiaryId) cleaned.subsidiaryId = filters.subsidiaryId;
        if (filters.supplierId) cleaned.supplierId = filters.supplierId;
        if (filters.status) cleaned.status = filters.status;
        if (filters.paymentStatus) cleaned.paymentStatus = filters.paymentStatus;
        if (filters.period) cleaned.period = filters.period;
        if (filters.startDate) cleaned.startDate = filters.startDate;
        if (filters.endDate) cleaned.endDate = filters.endDate;
        setAppliedFilters(cleaned);
    };

    const handleResetFilters = () => {
        setFilters(initialFilterState);
        setAppliedFilters(initialFilterState);
    };

    const subsidiaryOptions = useMemo(
        () => subsidiaries.map(s => ({ value: s.id, label: s.subsidiaryName })),
        [subsidiaries],
    );
    const supplierOptions = useMemo(
        () => suppliers.map(s => ({ value: s.id, label: s.supplierName })),
        [suppliers],
    );
    const statusOptions = useMemo(
        () => Object.values(PurchaseOrderStatus).map(s => ({ value: s, label: PO_STATUS_LABELS[s] })),
        [],
    );
    const paymentStatusOptions = useMemo(
        () => Object.values(PaymentStatus).map(s => ({ value: s, label: PAY_STATUS_LABELS[s] })),
        [],
    );

    // Il n'existe pas d'entité GoodsReceipt séparée (choix assumé, voir
    // Pages/BonEntree.tsx) — un "bon d'entrée" correspond à toute commande
    // ayant reçu au moins un article, dérivée de son statut.
    const receivedOrders = useMemo(
        () => orders.filter(po => po.status === PurchaseOrderStatus.PARTIALLY_RECEIVED || po.status === PurchaseOrderStatus.RECEIVED),
        [orders],
    );
    const lastReceiptDate = (po: PurchaseOrder) => po.history.find(h => h.event.includes('Réception'))?.date;

    const colSpan = isSuperAdmin ? 10 : 9;
    const receiptsColSpan = isSuperAdmin ? 6 : 5;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800">{t('purchasing.title')}</h2>
                <div className="flex items-center gap-3 self-start sm:self-center">
                    <div className="flex items-center space-x-2 p-1 bg-slate-200 rounded-lg">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${activeTab === 'orders' ? 'bg-[#c6e911] text-slate-800 shadow' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                        >
                            {t('purchasing.tabs.orders')}
                        </button>
                        <button
                            onClick={() => setActiveTab('receipts')}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${activeTab === 'receipts' ? 'bg-[#c6e911] text-slate-800 shadow' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                        >
                            {t('purchasing.tabs.receipts')}
                        </button>
                    </div>
                    {!isSuperAdmin && activeTab === 'orders' && (
                        <button
                            onClick={() => openModal(null, 'form')}
                            className="flex items-center gap-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-bold rounded-lg hover:bg-[#adc40f] transition-colors"
                        >
                            <IconPlus className="h-4 w-4" />
                            {t('purchasing.newOrder')}
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'orders' ? (
            <div className="bg-white rounded-xl shadow-md p-6 pt-0 space-y-4">
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full p-4 text-left flex justify-between items-center"
                >
                    <h3 className="text-xl font-semibold text-slate-800">{t('purchasing.historyTitle')}</h3>
                    <IconChevronDown className={`h-6 w-6 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                </button>
                {showHistory && (
                    <div className="p-6 pt-0">
                        {/* Filtres */}
                        <div className="bg-slate-50 rounded-lg px-4 my-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {isSuperAdmin && subsidiaries.length > 0 && (
                                    <SelectFilter
                                        name="subsidiaryId"
                                        label={t('analytics.allSubsidiaries')}
                                        value={filters.subsidiaryId || ''}
                                        onChange={e => setFilters(prev => ({ ...prev, subsidiaryId: e.target.value }))}
                                        options={subsidiaryOptions}
                                        placeholder={t('analytics.allSubsidiaries')}
                                    />
                                )}
                                <SelectFilter
                                    name="supplierId"
                                    label={t('filter.supplier')}
                                    value={filters.supplierId || ''}
                                    onChange={e => setFilters(prev => ({ ...prev, supplierId: e.target.value }))}
                                    options={supplierOptions}
                                    placeholder={t('filter.allSuppliers')}
                                />
                                <SelectFilter
                                    name="status"
                                    label={t('filter.status')}
                                    value={filters.status || ''}
                                    onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as PurchaseOrderStatus }))}
                                    options={statusOptions}
                                    placeholder={t('filter.allStatuses')}
                                />
                                <SelectFilter
                                    name="paymentStatus"
                                    label={t('filter.paymentStatus')}
                                    value={filters.paymentStatus || ''}
                                    onChange={e => setFilters(prev => ({ ...prev, paymentStatus: e.target.value as PaymentStatus }))}
                                    options={paymentStatusOptions}
                                    placeholder={t('filter.allPaymentStatuses')}
                                />
                                <div className="md:col-span-2 lg:col-span-4">
                                    <PeriodFilter
                                        period={filters.period || 'all_time'}
                                        onPeriodChange={e => {
                                            const period = e.target.value as OrderPeriod;
                                            const dates = getPeriodDates(period);
                                            if (period === 'all_time') {
                                                setFilters(prev => {
                                                    const { startDate, endDate, ...rest } = prev;
                                                    return { ...rest, period };
                                                });
                                            } else {
                                                setFilters(prev => ({ ...prev, period, startDate: dates.startDate, endDate: dates.endDate }));
                                            }
                                        }}
                                        startDate={filters.startDate || ''}
                                        onStartDateChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value, period: 'custom' }))}
                                        endDate={filters.endDate || ''}
                                        onEndDateChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value, period: 'custom' }))}
                                    />
                                </div>
                                <div className="md:col-span-2 lg:col-span-4 flex justify-end items-center gap-2 mt-2">
                                    <button
                                        onClick={handleResetFilters}
                                        className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors h-10"
                                    >
                                        {t('filter.reset')}
                                    </button>
                                    <button
                                        onClick={handleApplyFilters}
                                        className="px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors h-10"
                                    >
                                        {t('filter.apply')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tableau */}
                        <div className="relative w-full max-w-full overflow-hidden">
                            <div className="w-full overflow-x-auto">
                                <div className="min-w-max w-full">
                                    {isLoading ? (
                                        <table className="w-full text-sm text-left text-slate-500">
                                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                                <tr>
                                                    <th className="px-3 py-3 bg-slate-50 w-8"></th>
                                                    <th className="px-4 py-3 bg-slate-50 whitespace-nowrap">Réf.</th>
                                                    <th className="px-4 py-3 bg-slate-50 whitespace-nowrap">{t('purchasing.supplier')}</th>
                                                    {isSuperAdmin && <th className="px-4 py-3 bg-slate-50 whitespace-nowrap">Filiale</th>}
                                                    <th className="px-4 py-3 bg-slate-50 whitespace-nowrap">{t('purchasing.orderDate')}</th>
                                                    <th className="px-4 py-3 bg-slate-50 whitespace-nowrap">Livraison prévue</th>
                                                    <th className="px-4 py-3 bg-slate-50 text-right whitespace-nowrap">{t('purchasing.total')}</th>
                                                    <th className="px-4 py-3 bg-slate-50 text-center whitespace-nowrap">{t('purchasing.status')}</th>
                                                    <th className="px-4 py-3 bg-slate-50 text-center whitespace-nowrap">{t('purchasing.paymentStatus.title')}</th>
                                                    <th className="sticky right-0 z-10 px-4 py-3 bg-slate-100 text-center whitespace-nowrap border-l border-slate-200 shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.08)]">{t('common.actions')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.from({ length: 4 }).map((_, i) => (
                                                    <tr key={i} className="bg-white border-b" style={{ opacity: 1 - i * 0.1 }}>
                                                        <td className="px-3 py-4"><div className="h-3 w-4 bg-slate-200 rounded animate-pulse" /></td>
                                                        <td className="px-4 py-4"><div className="h-3 w-16 bg-slate-200 rounded animate-pulse" /></td>
                                                        <td className="px-4 py-4"><div className="h-3 w-28 bg-slate-200 rounded animate-pulse" /></td>
                                                        {isSuperAdmin && <td className="px-4 py-4"><div className="h-3 w-20 bg-slate-200 rounded animate-pulse" /></td>}
                                                        <td className="px-4 py-4"><div className="h-3 w-20 bg-slate-200 rounded animate-pulse" /></td>
                                                        <td className="px-4 py-4"><div className="h-3 w-20 bg-slate-200 rounded animate-pulse" /></td>
                                                        <td className="px-4 py-4"><div className="h-3 w-20 bg-slate-200 rounded animate-pulse ml-auto" /></td>
                                                        <td className="px-4 py-4 text-center"><div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse mx-auto" /></td>
                                                        <td className="px-4 py-4 text-center"><div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse mx-auto" /></td>
                                                        <td className="sticky right-0 z-10 px-4 py-4 text-center bg-white border-l border-slate-200"><div className="h-5 w-24 bg-slate-200 rounded animate-pulse mx-auto" /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <>
                                            <table className="w-full text-sm text-left text-slate-500">
                                                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                                    <tr>
                                                        <th scope="col" className="px-3 py-3 bg-slate-50 whitespace-nowrap"></th>
                                                        <th scope="col" className="px-4 py-3 bg-slate-50 whitespace-nowrap">Réf.</th>
                                                        <th scope="col" className="px-4 py-3 bg-slate-50 whitespace-nowrap">{t('purchasing.supplier')}</th>
                                                        {isSuperAdmin && <th scope="col" className="px-4 py-3 bg-slate-50 whitespace-nowrap">Filiale</th>}
                                                        <th scope="col" className="px-4 py-3 bg-slate-50 whitespace-nowrap">{t('purchasing.orderDate')}</th>
                                                        <th scope="col" className="px-4 py-3 bg-slate-50 whitespace-nowrap">Livraison prévue</th>
                                                        <th scope="col" className="px-4 py-3 bg-slate-50 text-right whitespace-nowrap">{t('purchasing.total')}</th>
                                                        <th scope="col" className="px-4 py-3 bg-slate-50 text-center whitespace-nowrap">{t('purchasing.status')}</th>
                                                        <th scope="col" className="px-4 py-3 bg-slate-50 text-center whitespace-nowrap">{t('purchasing.paymentStatus.title')}</th>
                                                        <th scope="col" className="sticky right-0 z-10 px-4 py-3 bg-slate-100 text-center whitespace-nowrap border-l border-slate-200 shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.08)]">{t('common.actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orders.map(po => {
                                                        const isExpanded = expandedPoId === po.id;
                                                        const toggle = () => setExpandedPoId(isExpanded ? null : po.id);

                                                        return (
                                                            <React.Fragment key={po.id}>
                                                                <tr
                                                                    className="bg-white border-b hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                                                                    onClick={toggle}
                                                                >
                                                                    <td className="px-3 py-4 text-slate-400">
                                                                        <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                                        </svg>
                                                                    </td>
                                                                    <td className="px-4 py-4 font-mono text-xs text-slate-500">
                                                                        #{po.id.slice(-8).toUpperCase()}
                                                                    </td>
                                                                    <td className="px-4 py-4 font-semibold text-slate-800">{po.supplierName}</td>
                                                                    {isSuperAdmin && (
                                                                        <td className="px-4 py-4 text-slate-500">
                                                                            {po.subsidiary?.subsidiaryName ?? '—'}
                                                                        </td>
                                                                    )}
                                                                    <td className="px-4 py-4 text-slate-500">{fmtDate(po.orderDate)}</td>
                                                                    <td className="px-4 py-4 text-slate-500">{fmtDate(po.expectedDeliveryDate)}</td>
                                                                    <td className="px-4 py-4 text-right font-bold text-slate-800">
                                                                        {formatCurrency(po.totalAmount)}
                                                                    </td>
                                                                    <td className="px-4 py-4 text-center">
                                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PO_STATUS_CLASS[po.status]}`}>
                                                                            {PO_STATUS_LABELS[po.status]}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-4 text-center">
                                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PAY_STATUS_CLASS[po.paymentStatus]}`}>
                                                                            {PAY_STATUS_LABELS[po.paymentStatus]}
                                                                        </span>
                                                                    </td>
                                                                    <td
                                                                        className="sticky right-0 z-10 px-4 py-4 text-center bg-white border-l border-slate-200 shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.08)]"
                                                                        onClick={e => e.stopPropagation()}
                                                                    >
                                                                        <div className="flex justify-center items-center gap-1">
                                                                            {!isSuperAdmin && (po.status === PurchaseOrderStatus.ORDERED || po.status === PurchaseOrderStatus.PARTIALLY_RECEIVED) && (
                                                                                <button onClick={() => openModal(po, 'receive')}
                                                                                    className="p-2 text-green-600 hover:bg-green-100 rounded-full"
                                                                                    title={t('purchasing.receiveOrder')}>
                                                                                    <IconCheck className="h-5 w-5" />
                                                                                </button>
                                                                            )}
                                                                            {/* Le paiement (Coffre-fort/Banque) est réservé au SUPER_ADMIN,
                                                                                comme tout décaissement SAFE/BANQUE (voir Disbursement.tsx). */}
                                                                            {isSuperAdmin && po.paymentStatus !== PaymentStatus.PAID && po.status !== PurchaseOrderStatus.DRAFT && (
                                                                                <button onClick={() => openModal(po, 'payment')}
                                                                                    className="p-2 text-amber-600 hover:bg-amber-100 rounded-full"
                                                                                    title={t('purchasing.recordPayment')}>
                                                                                    <IconCoins className="h-5 w-5" />
                                                                                </button>
                                                                            )}
                                                                            {(po.status === PurchaseOrderStatus.PARTIALLY_RECEIVED || po.status === PurchaseOrderStatus.RECEIVED) && (
                                                                                <button onClick={() => openModal(po, 'goodsReceipt')}
                                                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                                                                                    title={t('purchasing.viewGoodsReceipt')}>
                                                                                    <IconDocumentText className="h-5 w-5" />
                                                                                </button>
                                                                            )}
                                                                            <button onClick={() => openModal(po, 'details')}
                                                                                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
                                                                                title={t('purchasing.viewOrder')}>
                                                                                <IconEye className="h-5 w-5" />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>

                                                                {/* Ligne dépliée : détail des articles */}
                                                                {isExpanded && (
                                                                    <tr className="bg-slate-50">
                                                                        <td colSpan={colSpan} className="p-4">
                                                                            <div className="pl-10">
                                                                                <h4 className="font-semibold text-sm mb-3 text-slate-700">
                                                                                    Lignes de commande ({po.items.length})
                                                                                </h4>
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
                                                                                                <tr key={item.id ?? idx}>
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
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                            {orders.length === 0 && (
                                                <EmptyState
                                                    icon="order"
                                                    title="Aucun bon de commande"
                                                    description={t('filter.noResults')}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            ) : (
            <div className="bg-white rounded-xl shadow-md p-6 pt-0 space-y-4">
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full p-4 text-left flex justify-between items-center"
                >
                    <h3 className="text-xl font-semibold text-slate-800">{t('purchasing.tabs.receipts')}</h3>
                    <IconChevronDown className={`h-6 w-6 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                </button>
                {showHistory && (
                    <div className="p-6 pt-0">
                        <div className="relative w-full max-w-full overflow-hidden">
                            <div className="w-full overflow-x-auto">
                                <div className="min-w-max w-full">
                                    <table className="w-full text-sm text-left text-slate-500">
                                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                            <tr>
                                                <th scope="col" className="px-4 py-3 bg-slate-50 whitespace-nowrap">Réf.</th>
                                                <th scope="col" className="px-4 py-3 bg-slate-50 whitespace-nowrap">{t('purchasing.supplier')}</th>
                                                {isSuperAdmin && <th scope="col" className="px-4 py-3 bg-slate-50 whitespace-nowrap">Filiale</th>}
                                                <th scope="col" className="px-4 py-3 bg-slate-50 whitespace-nowrap">{t('purchasing.goodsReceiptsList.receiptDate')}</th>
                                                <th scope="col" className="px-4 py-3 bg-slate-50 text-center whitespace-nowrap">{t('purchasing.status')}</th>
                                                <th scope="col" className="sticky right-0 z-10 px-4 py-3 bg-slate-100 text-center whitespace-nowrap border-l border-slate-200 shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.08)]">{t('common.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoading ? (
                                                Array.from({ length: 4 }).map((_, i) => (
                                                    <tr key={i} className="bg-white border-b" style={{ opacity: 1 - i * 0.1 }}>
                                                        <td colSpan={receiptsColSpan} className="px-4 py-4">
                                                            <div className="h-3 bg-slate-200 rounded animate-pulse" style={{ width: `${65 + i * 8}%` }} />
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : receivedOrders.map(po => (
                                                <tr key={po.id} className="bg-white border-b hover:bg-slate-50 whitespace-nowrap">
                                                    <td className="px-4 py-4 font-mono text-xs text-slate-500">
                                                        #{po.id.slice(-8).toUpperCase()}
                                                    </td>
                                                    <td className="px-4 py-4 font-semibold text-slate-800">{po.supplierName}</td>
                                                    {isSuperAdmin && (
                                                        <td className="px-4 py-4 text-slate-500">
                                                            {po.subsidiary?.subsidiaryName ?? '—'}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-4 text-slate-500">{fmtDate(lastReceiptDate(po))}</td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PO_STATUS_CLASS[po.status]}`}>
                                                            {PO_STATUS_LABELS[po.status]}
                                                        </span>
                                                    </td>
                                                    <td
                                                        className="sticky right-0 z-10 px-4 py-4 text-center bg-white border-l border-slate-200 shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.08)]"
                                                    >
                                                        <button onClick={() => openModal(po, 'goodsReceipt')}
                                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                                                            title={t('purchasing.viewGoodsReceipt')}>
                                                            <IconDocumentText className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {!isLoading && receivedOrders.length === 0 && (
                                        <EmptyState
                                            icon="order"
                                            title={t('purchasing.tabs.receipts')}
                                            description={t('purchasing.goodsReceiptsList.empty')}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* Modals */}
            {modal === 'form' && (
                <PurchaseOrderFormModal
                    isOpen onClose={closeModal}
                    onSave={(data: CreatePurchaseOrderDto) => createPO(data)}
                    subsidiaryId={subsidiary?.id || ''}
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
                <PaySupplierDebtModal
                    isOpen onClose={closeModal}
                    debtId={selectedPO.supplierDebts?.[0]?.id ?? null}
                    supplierName={selectedPO.supplierName}
                    reference={selectedPO.id}
                    totalAmount={selectedPO.totalAmount}
                    amountPaid={selectedPO.amountPaid}
                    remainingAmount={selectedPO.totalAmount - selectedPO.amountPaid}
                    onPaid={invalidate}
                />
            )}
            {modal === 'goodsReceipt' && selectedPO && subsidiary && (
                <BonEntree
                    purchaseOrder={selectedPO}
                    subsidiary={subsidiary}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

export default Purchasing;
