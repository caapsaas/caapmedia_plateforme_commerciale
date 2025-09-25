import React from 'react';
import { MOCK_CREDIT_ACCOUNTS } from '../../constants';
import { Subsidiary } from '../../types';
import { useI18n } from '../../i18n';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';

interface CreditManagementProps {
    subsidiary: Subsidiary;
}

const CreditManagement: React.FC<CreditManagementProps> = ({ subsidiary }) => {
    const { t, formatCurrency } = useI18n();
    const creditAccounts = MOCK_CREDIT_ACCOUNTS.filter(c => c.subsidiaryId === subsidiary.id);
    const totalReceivables = creditAccounts.reduce((acc, account) => acc + account.balance, 0);

    const handlePrint = () => window.print();

    const handleExport = () => {
        const headers = [
            { key: 'clientName', label: t('credit.customerName') },
            { key: 'companyName', label: t('credit.company') },
            { key: 'balance', label: t('credit.balanceDue') },
            { key: 'lastPaymentDate', label: t('credit.lastPaymentDate') },
        ];
        exportToCsv('comptes_credits', headers, creditAccounts);
    };

    const handleExportPdf = () => {
        const headers = [
            { key: 'clientName', label: t('credit.customerName') },
            { key: 'companyName', label: t('credit.company') },
            { key: 'lastPaymentDate', label: t('credit.lastPaymentDate') },
            { key: 'balance', label: t('credit.balanceDue') },
        ];
        const data = creditAccounts.map(d => ({ ...d, balance: formatCurrency(d.balance) }));
        exportToPdf(t('credit.customerCreditTracking'), headers, data, 'credits_clients');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
                <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-md">
                    <h4 className="font-semibold text-slate-500">{t('credit.totalReceivables')}</h4>
                    <p className="text-3xl font-bold text-slate-800 mt-2">{formatCurrency(totalReceivables)}</p>
                    <p className="text-sm text-slate-400 mt-1">{t('credit.totalReceivablesDesc')}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">{t('credit.customerCreditTracking')}</h3>
                    <div className="flex space-x-2 no-print">
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
                                <th scope="col" className="px-6 py-3">{t('credit.customerName')}</th>
                                <th scope="col" className="px-6 py-3">{t('credit.company')}</th>
                                <th scope="col" className="px-6 py-3">{t('credit.lastPaymentDate')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('credit.balanceDue')}</th>
                                <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {creditAccounts.map((account) => (
                                <tr key={account.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{account.clientName}</td>
                                    <td className="px-6 py-4">{account.companyName}</td>
                                    <td className="px-6 py-4">{account.lastPaymentDate}</td>
                                    <td className="px-6 py-4 text-right font-bold text-red-600">{formatCurrency(account.balance)}</td>
                                    <td className="px-6 py-4 text-center no-print">
                                        <button className="font-medium text-[#c6e911] hover:text-[#adc40f] mr-4">{t('credit.viewDetails')}</button>
                                        <button className="font-medium text-green-600 hover:text-green-800">{t('credit.recordPayment')}</button>
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

export default CreditManagement;