import React, { useState } from 'react';
import { DebtStatus, Subsidiary, SupplierDebt, UserRole } from '../../types';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';
import IconCoins from '../icons/IconCoins';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import PaySupplierDebtModal from './PaySupplierDebtModal';

interface SupplierDebtsProps {
    // `null` = vue consolidée toutes filiales (SUPER_ADMIN, "Toutes les
    // filiales" — voir Finance.tsx). Auparavant `effectiveSubsidiary`
    // retombait toujours sur la première filiale de la liste, empêchant
    // le SUPER_ADMIN de voir les dettes (payées ou non) des autres filiales.
    subsidiary: Subsidiary | null;
    supplierDebts: SupplierDebt[];
    isLoading?: boolean;
}

// `debt.dueDate` était affiché brut (ISO, ex: "2026-08-15T00:00:00.000Z")
// au lieu d'une date localisée.
const fmtDate = (date?: string | null, language = 'fr') => {
    if (!date) return '—';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(language);
};

const SupplierDebts: React.FC<SupplierDebtsProps> = ({ subsidiary, supplierDebts: allSupplierDebts, isLoading = false }) => {
    const { t, formatCurrency, language } = useI18n();
    const { user } = useAuth();
    // Le paiement d'une dette fournisseur prélève le Coffre-fort/la Banque
    // (comptes centralisés au siège) : réservé au SUPER_ADMIN, comme tout
    // décaissement SAFE/BANQUE (voir Pages/Disbursement.tsx). Les autres
    // rôles voient la liste mais ne peuvent pas payer.
    // activeRole prime sur userRole (apercu de role SUPER_ADMIN, voir Purchasing.tsx pour le meme correctif).
    const isSuperAdmin = (user?.activeRole ?? user?.userRole) === UserRole.SUPER_ADMIN;
    const isConsolidated = subsidiary === null;
    const supplierDebts = isConsolidated
        ? allSupplierDebts
        : allSupplierDebts.filter(d => d.subsidiaryId === subsidiary.id);
    const totalDebts = supplierDebts.filter(d => d.status !== DebtStatus.PAYER).reduce((acc, debt) => acc + Number(debt.amount), 0);
    const colSpan = isConsolidated ? 7 : 6;

    const [debtToPay, setDebtToPay] = useState<SupplierDebt | null>(null);

    const getStatusClass = (status: SupplierDebt['status']) => {
        switch (status) {
            case DebtStatus.PAYER: return 'bg-green-100 text-green-800';
            case DebtStatus.PARTIELLEMENT_PAYE: return 'bg-amber-100 text-amber-800';
            case DebtStatus.A_PAYER: return 'bg-blue-100 text-blue-800';
            case DebtStatus.EN_ATTENTE: return 'bg-amber-100 text-amber-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    }

    const getTranslatedStatus = (status: SupplierDebt['status']) => {
        switch (status) {
            case DebtStatus.PAYER: return t('supplierDebts.statusPaid');
            case DebtStatus.PARTIELLEMENT_PAYE: return t('supplierDebts.statusPartiallyPaid');
            case DebtStatus.A_PAYER: return t('supplierDebts.statusToPay');
            case DebtStatus.EN_ATTENTE: return t('supplierDebts.statusPending');
            default: return status;
        }
    }

    const handlePrint = () => window.print();

    const exportHeaders = [
        { key: 'supplierName', label: t('supplierDebts.supplier') },
        ...(isConsolidated ? [{ key: 'subsidiaryName', label: 'Filiale' }] : []),
        { key: 'invoiceId', label: t('supplierDebts.invoiceId') },
        { key: 'dueDate', label: t('supplierDebts.dueDate') },
        { key: 'amount', label: t('supplierDebts.amount') },
        { key: 'status', label: t('supplierDebts.status') },
    ];

    const handleExport = () => {
        const data = supplierDebts.map(d => ({
            ...d,
            subsidiaryName: d.subsidiary?.subsidiaryName ?? '—',
            status: getTranslatedStatus(d.status),
        }));
        exportToCsv('dettes_fournisseurs', exportHeaders, data);
    };

    const handleExportPdf = () => {
        const data = supplierDebts.map(d => ({
            ...d,
            subsidiaryName: d.subsidiary?.subsidiaryName ?? '—',
            status: getTranslatedStatus(d.status),
            amount: formatCurrency(d.amount),
            dueDate: fmtDate(d.dueDate, language),
        }));
        exportToPdf(t('supplierDebts.trackingTitle'), exportHeaders, data, 'dettes_fournisseurs');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
                 <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-md">
                    <h4 className="font-semibold text-slate-500">{t('supplierDebts.totalDebts')}</h4>
                    <p className="text-3xl font-bold text-slate-800 mt-2">{formatCurrency(totalDebts)}</p>
                    <p className="text-sm text-slate-400 mt-1">{t('supplierDebts.totalDebtsDesc')}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">{t('supplierDebts.trackingTitle')}</h3>
                    <div className="flex flex-wrap gap-2 no-print self-start md:self-center">
                        <button onClick={handlePrint} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                            <IconPrint className="h-4 w-4" />
                            <span>{t('common.print')}</span>
                        </button>
                        <button onClick={handleExport} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                            <IconExport className="h-4 w-4" />
                            <span>{t('common.export')}</span>
                        </button>
                        <button onClick={handleExportPdf} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                            <IconPdf className="h-4 w-4" />
                            <span>{t('common.exportPdf')}</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('supplierDebts.supplier')}</th>
                                {isConsolidated && <th scope="col" className="px-6 py-3">Filiale</th>}
                                <th scope="col" className="px-6 py-3">{t('supplierDebts.invoiceId')}</th>
                                <th scope="col" className="px-6 py-3">{t('supplierDebts.dueDate')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('supplierDebts.amount')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('supplierDebts.status')}</th>
                                <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <TableSkeleton rows={8} columns={colSpan} />
                            ) : supplierDebts.length === 0 ? (
                                <tr>
                                    <td colSpan={colSpan}>
                                        <EmptyState icon="truck" title={t('supplierDebts.trackingTitle')} description={t('common.notAvailable')} />
                                    </td>
                                </tr>
                            ) : supplierDebts.map((debt) => (
                                <tr key={debt.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{debt.supplierName}</td>
                                    {isConsolidated && (
                                        <td className="px-6 py-4 text-slate-500">{debt.subsidiary?.subsidiaryName ?? '—'}</td>
                                    )}
                                    <td className="px-6 py-4">
                                        {debt.invoiceUrl ? (
                                            <a href={debt.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">
                                                {debt.invoiceId}
                                            </a>
                                        ) : (
                                            debt.invoiceId
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{fmtDate(debt.dueDate, language)}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{formatCurrency(debt.amount)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(debt.status)}`}>
                                            {getTranslatedStatus(debt.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center no-print">
                                        {debt.status !== DebtStatus.PAYER && isSuperAdmin && (
                                            <button
                                                onClick={() => setDebtToPay(debt)}
                                                className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-100 rounded-full transition-colors"
                                                title={t('supplierDebts.pay')}
                                            >
                                                <IconCoins className="h-5 w-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <PaySupplierDebtModal
                isOpen={!!debtToPay}
                onClose={() => setDebtToPay(null)}
                debtId={debtToPay?.id ?? null}
                supplierName={debtToPay?.supplierName ?? ''}
                reference={debtToPay?.invoiceId ?? ''}
                totalAmount={debtToPay?.purchaseOrder?.totalAmount ?? debtToPay?.amount ?? 0}
                amountPaid={debtToPay?.purchaseOrder?.amountPaid ?? 0}
                remainingAmount={debtToPay?.amount ?? 0}
            />
        </div>
    );
};

export default SupplierDebts;