import React from 'react';
import { Subsidiary, SupplierDebt } from '../../types';
import { useI18n } from '../../i18n';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';

interface SupplierDebtsProps {
    subsidiary: Subsidiary;
    supplierDebts: SupplierDebt[];
}

const SupplierDebts: React.FC<SupplierDebtsProps> = ({ subsidiary, supplierDebts: allSupplierDebts }) => {
    const { t, formatCurrency } = useI18n();
    const supplierDebts = allSupplierDebts.filter(d => d.subsidiaryId === subsidiary.id);
    const totalDebts = supplierDebts.filter(d => d.status !== 'Payé').reduce((acc, debt) => acc + Number(debt.amount), 0);
    
    const getStatusClass = (status: SupplierDebt['status']) => {
        switch (status) {
            case 'Payé': return 'bg-green-100 text-green-800';
            case 'À payer': return 'bg-blue-100 text-blue-800';
            case 'En retard': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    }

    const getTranslatedStatus = (status: SupplierDebt['status']) => {
        switch (status) {
            case 'Payé': return t('supplierDebts.statusPaid');
            case 'À payer': return t('supplierDebts.statusToPay');
            case 'En retard': return t('supplierDebts.statusOverdue');
            default: return status;
        }
    }

    const handlePrint = () => window.print();

    const handleExport = () => {
        const headers = [
            { key: 'supplierName', label: t('supplierDebts.supplier') },
            { key: 'invoiceId', label: t('supplierDebts.invoiceId') },
            { key: 'dueDate', label: t('supplierDebts.dueDate') },
            { key: 'amount', label: t('supplierDebts.amount') },
            { key: 'status', label: t('supplierDebts.status') },
        ];
        const data = supplierDebts.map(d => ({
            ...d,
            status: getTranslatedStatus(d.status),
        }));
        exportToCsv('dettes_fournisseurs', headers, data);
    };

    const handleExportPdf = () => {
        const headers = [
            { key: 'supplierName', label: t('supplierDebts.supplier') },
            { key: 'invoiceId', label: t('supplierDebts.invoiceId') },
            { key: 'dueDate', label: t('supplierDebts.dueDate') },
            { key: 'amount', label: t('supplierDebts.amount') },
            { key: 'status', label: t('supplierDebts.status') },
        ];
        const data = supplierDebts.map(d => ({
            ...d,
            status: getTranslatedStatus(d.status),
            amount: formatCurrency(d.amount),
        }));
        exportToPdf(t('supplierDebts.trackingTitle'), headers, data, 'dettes_fournisseurs');
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
                                <th scope="col" className="px-6 py-3">{t('supplierDebts.invoiceId')}</th>
                                <th scope="col" className="px-6 py-3">{t('supplierDebts.dueDate')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('supplierDebts.amount')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('supplierDebts.status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierDebts.map((debt) => (
                                <tr key={debt.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{debt.supplierName}</td>
                                    <td className="px-6 py-4">
                                        {debt.invoiceUrl ? (
                                            <a href={debt.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">
                                                {debt.invoiceId}
                                            </a>
                                        ) : (
                                            debt.invoiceId
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{debt.dueDate}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{formatCurrency(debt.amount)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(debt.status)}`}>
                                            {getTranslatedStatus(debt.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SupplierDebts;