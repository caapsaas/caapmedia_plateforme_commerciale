import React from 'react';
import { MOCK_TREASURY_ACCOUNTS } from '../../constants';
import { FinancialTransaction, Subsidiary } from '../../types';
import { useI18n } from '../../i18n';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';

interface TreasuryManagementProps {
    subsidiary: Subsidiary;
    financialTransactions: FinancialTransaction[];
}

const TreasuryManagement: React.FC<TreasuryManagementProps> = ({ subsidiary, financialTransactions: allTransactions }) => {
    const { t, formatCurrency } = useI18n();
    const treasuryAccounts = MOCK_TREASURY_ACCOUNTS.filter(a => a.subsidiaryId === subsidiary.id);
    const transactions = allTransactions.filter(t => t.subsidiaryId === subsidiary.id);

    const getStatusClass = (status: FinancialTransaction['status']) => {
        switch (status) {
            case 'Validé': return 'bg-green-100 text-green-800';
            case 'En attente': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    }
    
    const getTranslatedStatus = (status: FinancialTransaction['status']) => {
        switch (status) {
            case 'Validé': return t('treasury.statusValidated');
            case 'En attente': return t('treasury.statusPending');
            default: return status;
        }
    }
    
    const getTranslatedType = (type: FinancialTransaction['type']) => {
        switch (type) {
            case 'Recette': return t('treasury.typeIncome');
            case 'Dépense': return t('treasury.typeExpense');
            default: return type;
        }
    }

    const handlePrint = () => window.print();

    const handleExport = () => {
        const headers = [
            { key: 'date', label: t('treasury.date') },
            { key: 'description', label: t('treasury.description') },
            { key: 'account', label: t('treasury.account') },
            { key: 'type', label: t('treasury.type') },
            { key: 'amount', label: t('treasury.amount') },
            { key: 'status', label: t('treasury.status') },
        ];
        const data = transactions.map(tx => ({
            ...tx,
            type: getTranslatedType(tx.type),
            status: getTranslatedStatus(tx.status),
        }));
        exportToCsv('transactions_tresorerie', headers, data);
    };

    const handleExportPdf = () => {
        const headers = [
            { key: 'date', label: t('treasury.date') },
            { key: 'description', label: t('treasury.description') },
            { key: 'account', label: t('treasury.account') },
            { key: 'type', label: t('treasury.type') },
            { key: 'amount', label: t('treasury.amount') },
            { key: 'status', label: t('treasury.status') },
        ];
        const data = transactions.map(tx => ({
            ...tx,
            type: getTranslatedType(tx.type),
            status: getTranslatedStatus(tx.status),
            amount: `${tx.type === 'Recette' ? '+' : '-'}${formatCurrency(tx.amount)}`
        }));
        exportToPdf(t('treasury.recentTransactions'), headers, data, 'tresorerie');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
                {treasuryAccounts.map(account => (
                    <div key={account.id} className="bg-white p-6 rounded-xl shadow-md">
                        <h4 className="font-semibold text-slate-500">{account.name}</h4>
                        <p className="text-3xl font-bold text-slate-800 mt-2">{formatCurrency(account.balance)}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">{t('treasury.recentTransactions')}</h3>
                    <div className="flex flex-wrap items-center gap-2 no-print">
                         <button className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-md hover:bg-red-600 transition-colors">{t('treasury.addExpense')}</button>
                         <button className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-md hover:bg-green-600 transition-colors">{t('treasury.addIncome')}</button>
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
                                <th scope="col" className="px-6 py-3">{t('treasury.date')}</th>
                                <th scope="col" className="px-6 py-3">{t('treasury.description')}</th>
                                <th scope="col" className="px-6 py-3">{t('treasury.account')}</th>
                                <th scope="col" className="px-6 py-3">{t('treasury.type')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('treasury.amount')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('treasury.status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4">{tx.date}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{tx.description}</td>
                                    <td className="px-6 py-4">{tx.account}</td>
                                    <td className={`px-6 py-4 font-semibold ${tx.type === 'Recette' ? 'text-green-600' : 'text-red-600'}`}>{getTranslatedType(tx.type)}</td>
                                    <td className={`px-6 py-4 text-right font-bold ${tx.type === 'Recette' ? 'text-green-700' : 'text-red-700'}`}>
                                        {tx.type === 'Recette' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                         <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(tx.status)}`}>
                                            {getTranslatedStatus(tx.status)}
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

export default TreasuryManagement;