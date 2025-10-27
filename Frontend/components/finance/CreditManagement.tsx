import React, { useMemo, useState } from 'react';
import { Subsidiary, CreditAccount } from '../../types';
import { getCustomerReceivables, CustomerReceivablesStats } from '../../services/apiStatistic/apiFinanceStats';
import { useI18n } from '../../i18n';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';
import { useQuery } from '@tanstack/react-query';
import { getCredit } from '../../services/apiE-commerce/apiOrders';
import KpiCard from '../../Pages/KpiCard';
import IconCreditCard from '../icons/IconCreditCard';

interface CreditManagementProps {
    subsidiary: Subsidiary;
}

const CreditManagement: React.FC<CreditManagementProps> = ({ subsidiary }) => {
    const { t, formatCurrency } = useI18n();
    const [searchTerm, setSearchTerm] = useState('');

    // 1. Récupération des données réelles depuis le backend
    const { data: customerCredit = [], isLoading: isLoadingcredit } = useQuery<CreditAccount[]>({ 
        queryKey: ['credit'], 
        queryFn: () => getCredit()
    });

    const { data: totalReceivables = 0, isLoading: isLoadingReceivable } = useQuery<CustomerReceivablesStats>({
        queryKey: ['totalReceivables'],
        queryFn: () => getCustomerReceivables({
            period: 'ALL_TIME',
        })
    });

    // 3. Filtrage pour la barre de recherche
    const filteredCredits = useMemo(() => {
        const lowercasedTerm = searchTerm.toLowerCase();
        if (!lowercasedTerm) return customerCredit;
        return customerCredit.filter(credit => 
            credit.clientName.toLowerCase().includes(lowercasedTerm) ||
            (credit.companyName && credit.companyName.toLowerCase().includes(lowercasedTerm))
        );
    }, [customerCredit, searchTerm]);

    const handlePrint = () => window.print();

    const handleExport = () => {
        const headers = [
            { key: 'clientName', label: t('credit.customerName') },
            { key: 'companyName', label: t('credit.company') },
            { key: 'balance', label: t('credit.balanceDue') },
            { key: 'lastPaymentDate', label: t('credit.lastPaymentDate') },
        ];
        exportToCsv('comptes_credits', headers, filteredCredits);
    };

    const handleExportPdf = () => {
        const headers = [
            { key: 'clientName', label: t('credit.customerName') },
            { key: 'companyName', label: t('credit.company') },
            { key: 'lastPaymentDate', label: t('credit.lastPaymentDate') },
            { key: 'balance', label: t('credit.balanceDue') },
        ];
        const data = filteredCredits.map(d => ({ ...d, balance: formatCurrency(d.balance) }));
        exportToPdf(t('credit.customerCreditTracking'), headers, data, 'credits_clients');
    };

    const kpiData = {
        titleKey: 'credit.totalReceivables',
        value: formatCurrency(totalReceivables.totalReceivables),
        change: '', // Ajout de la propriété 'change' manquante
        icon: <IconCreditCard className="h-6 w-6 text-slate-500" />,
        changeType: 'increase' as const,
        descriptionKey: 'credit.totalReceivablesDesc'
    };

    if (isLoadingReceivable) {
        return <div className="p-6 text-center">{t('common.loading')}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
                <KpiCard {...kpiData} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">{t('credit.customerCreditTracking')}</h3>
                    <div className="relative w-full md:w-auto">
                        <input
                            type="search"
                            placeholder={t('common.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-full bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                    </div>
                    <div className="flex flex-wrap gap-2 no-print">
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
                            {filteredCredits.map((account) => (
                                console.log(account),
                                <tr key={account.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{account.clientName}</td>
                                    <td className="px-6 py-4">{account.companyName}</td>
                                    <td className="px-6 py-4">{new Date(account.lastPaymentDate).toLocaleDateString('fr-FR')}</td>
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