import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TreasuryAccount } from '../../types';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { getAccountTransactions } from '../../services/apiFinance/apiTreasury';
import { printElementAsPdf } from '../../utils/pdfExporter';
import DocumentHeader from '../common/DocumentHeader';
import DocumentFooter from '../common/DocumentFooter';
import IconPrint from '../icons/IconPrint';
import IconCancelX from '../icons/IconCancelX';

interface TreasuryStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: TreasuryAccount | null;
}

/**
 * Relevé de compte imprimable — flux en deux étapes calqué sur gmo
 * (BankStatementPrint/SafeStatementPrint) : 1) formulaire de période,
 * 2) aperçu du relevé généré + export PDF (printElementAsPdf, déjà utilisé
 * par les modules comptables). Générique sur tous les types de compte de
 * trésorerie (contrairement à gmo qui a un composant par type), puisque le
 * modèle TreasuryAccount de caapmedia est déjà unifié.
 */
const TreasuryStatementModal: React.FC<TreasuryStatementModalProps> = ({ isOpen, onClose, account }) => {
  const { t, formatCurrency, language } = useI18n();
  const { subsidiary } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerated, setIsGenerated] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['treasuryStatement', account?.id, startDate, endDate],
    queryFn: () => getAccountTransactions(account!.id, { startDate, endDate, limit: 500 }),
    enabled: false,
  });

  const lines = data?.data ?? [];

  const handleClose = () => {
    setIsGenerated(false);
    setStartDate('');
    setEndDate('');
    onClose();
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) return;
    await refetch();
    setIsGenerated(true);
  };

  const handlePrint = async () => {
    if (!printRef.current) return;
    setIsPrinting(true);
    try {
      await printElementAsPdf(printRef.current);
    } finally {
      setIsPrinting(false);
    }
  };

  if (!isOpen || !account || !subsidiary) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={handleClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{t('treasury.statement.title')}</h3>
            <p className="text-sm text-slate-500 mt-1">{account.accountName}</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <IconCancelX className="h-5 w-5" />
          </button>
        </div>

        {!isGenerated ? (
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-100 text-blue-800 text-sm rounded-lg px-4 py-3">
              {t('treasury.statement.selectPeriod')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">{t('treasury.history.startDate')}</label>
                <input
                  type="date"
                  value={startDate}
                  max={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">{t('treasury.history.endDate')}</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  max={today}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={handleClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleGenerate}
                disabled={!startDate || !endDate || isLoading}
                className="px-4 py-2 bg-[#c6e911] text-slate-800 font-semibold rounded-md hover:bg-[#adc40f] transition-colors disabled:opacity-50"
              >
                {isLoading ? t('common.loading') : t('treasury.statement.generate')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3">
              <p className="text-sm text-slate-500">
                {new Date(startDate).toLocaleDateString(language)} — {new Date(endDate).toLocaleDateString(language)} · {lines.length} {t('treasury.statement.lines')}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setIsGenerated(false)} className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                  {t('treasury.statement.changePeriod')}
                </button>
                <button
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white text-sm font-semibold rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <IconPrint className="h-4 w-4" />
                  {isPrinting ? t('proforma.template.generating') : t('common.print')}
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50">
              <div ref={printRef} className="bg-white p-8 mx-auto" style={{ width: '750px' }}>
                <DocumentHeader subsidiary={subsidiary} />
                <div className="mb-6">
                  <h2 className="text-xl font-bold uppercase text-slate-800">{t('treasury.statement.title')}</h2>
                  <p className="text-slate-600 mt-1">{t('treasury.account')} : <span className="font-semibold">{account.accountName}</span></p>
                  {account.accountNumber && <p className="text-slate-600">{t('treasuryAccounts.table.accountName')} N° : {account.accountNumber}</p>}
                  <p className="text-slate-600">
                    {t('treasury.statement.period')} : {new Date(startDate).toLocaleDateString(language)} — {new Date(endDate).toLocaleDateString(language)}
                  </p>
                </div>

                <table className="w-full text-sm text-left text-slate-600 mb-6">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                    <tr>
                      <th className="px-3 py-2">{t('treasury.date')}</th>
                      <th className="px-3 py-2">{t('treasury.description')}</th>
                      <th className="px-3 py-2 text-right">{t('treasury.statement.debit')}</th>
                      <th className="px-3 py-2 text-right">{t('treasury.statement.credit')}</th>
                      <th className="px-3 py-2 text-right">{t('treasury.statement.balance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">{t('common.notAvailable')}</td></tr>
                    ) : lines.map((tx) => {
                      const isSource = tx.sourceAccountId === account.id || tx.treasuryAccountId === account.id;
                      const balanceAfter = isSource ? tx.balanceAfterSource : tx.balanceAfterDest;
                      return (
                        <tr key={tx.id} className="border-b">
                          <td className="px-3 py-2">{new Date(tx.transactionDate).toLocaleDateString(language)}</td>
                          <td className="px-3 py-2">{tx.description}</td>
                          <td className="px-3 py-2 text-right">{isSource ? formatCurrency(tx.amount) : ''}</td>
                          <td className="px-3 py-2 text-right">{!isSource ? formatCurrency(tx.amount) : ''}</td>
                          <td className="px-3 py-2 text-right font-semibold">{balanceAfter != null ? formatCurrency(balanceAfter) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-800">
                      <td colSpan={4} className="px-3 py-2 text-right">{t('treasury.statement.currentBalance')}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(account.balance)}</td>
                    </tr>
                  </tfoot>
                </table>

                <DocumentFooter message={t('treasury.statement.footerMessage')} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TreasuryStatementModal;
