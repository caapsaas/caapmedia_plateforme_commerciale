import React, { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Proforma, sendProforma } from '../../services/apiCrm/apiProformas';
import { printElementAsPdf } from '../../utils/pdfExporter';
import DocumentHeader from '../common/DocumentHeader';
import DocumentFooter from '../common/DocumentFooter';
import IconPrint from '../icons/IconPrint';
import IconPdf from '../icons/IconPdf';
import IconCancelX from '../icons/IconCancelX';

interface ProformaTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  proforma: Proforma | null;
}

// Nombre → toutes lettres (FR), montants en FCFA — implémentation minimale
// suffisante pour un document commercial (pas de gestion des décimales : les
// montants XOF n'en portent jamais).
const numberToWordsFr = (n: number): string => {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

  const chunk = (num: number): string => {
    if (num === 0) return '';
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const t = Math.floor(num / 10);
      const u = num % 10;
      return tens[t] + (u ? (t === 7 || t === 9 ? '-' + teens[u] : '-' + units[u]) : '') + (u === 1 && (t === 8) ? 's' : '');
    }
    const h = Math.floor(num / 100);
    const rest = num % 100;
    return (h > 1 ? units[h] + ' cent' : 'cent') + (rest ? ' ' + chunk(rest) : h > 1 ? 's' : '');
  };

  if (n === 0) return 'zéro';
  let result = '';
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;

  if (millions) result += (millions > 1 ? chunk(millions) + ' millions' : 'un million') + ' ';
  if (thousands) result += (thousands > 1 ? chunk(thousands) + ' mille' : 'mille') + ' ';
  if (rest) result += chunk(rest);

  return result.trim();
};

const ProformaTemplateModal: React.FC<ProformaTemplateModalProps> = ({ isOpen, onClose, proforma }) => {
  const { t, formatCurrency, language } = useI18n();
  const { subsidiary } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { mutate: send, isPending: isSending } = useMutation({
    mutationFn: (id: string) => sendProforma(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformas'] });
      toast.success(t('proforma.template.sentSuccess'), t('proforma.template.sentSuccessMessage'));
    },
    onError: (error: any) => {
      toast.error(t('proforma.template.sentError'), error?.response?.data?.message || t('proforma.template.sentErrorMessage'));
    },
  });

  if (!isOpen || !proforma || !subsidiary) return null;

  const handlePrint = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      await printElementAsPdf(printRef.current);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Proforma {proforma.proformaNumber}</h3>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <IconCancelX className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto bg-slate-50">
          <div ref={printRef} className="bg-white p-10 mx-auto" style={{ width: '800px' }}>
            <DocumentHeader subsidiary={subsidiary} />

            <div className="flex justify-between items-start mb-8">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">{t('proforma.template.billedTo')}</h4>
                <p className="font-bold text-slate-800">{proforma.clientName}</p>
                {proforma.clientCompany && <p className="text-slate-600">{proforma.clientCompany}</p>}
                <p className="text-slate-600">{proforma.clientEmail}</p>
                <p className="text-slate-600">{proforma.clientPhone}</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold uppercase text-slate-800">{t('proforma.template.documentTitle')}</h2>
                <p className="text-slate-600 mt-1">{t('proforma.template.number')} <span className="font-semibold">{proforma.proformaNumber}</span></p>
                <p className="text-slate-600">{t('proforma.template.date')} : {new Date(proforma.createdAt).toLocaleDateString(language)}</p>
                <p className="text-slate-600">{t('proforma.template.validity')} : {new Date(proforma.validityDate).toLocaleDateString(language)}</p>
              </div>
            </div>

            <table className="w-full text-sm text-left text-slate-600 mb-6">
              <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                <tr>
                  <th className="px-4 py-3">{t('proforma.template.item')}</th>
                  <th className="px-4 py-3 text-center">{t('proforma.template.qty')}</th>
                  <th className="px-4 py-3 text-right">{t('proforma.template.unitPrice')}</th>
                  <th className="px-4 py-3 text-right">{t('proforma.template.total')}</th>
                </tr>
              </thead>
              <tbody>
                {(proforma.items || []).map((item: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {item.product?.name || item.productId}
                      {item.description && <p className="text-xs text-slate-400">{item.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(Number(item.unitPrice))}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(Number(item.unitPrice) * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mb-8">
              <div className="w-full max-w-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('proforma.template.subtotal')} :</span>
                  <span className="font-medium text-slate-800">{formatCurrency(proforma.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('proforma.template.tax')} ({Number(proforma.taxRate)}%) :</span>
                  <span className="font-medium text-slate-800">{formatCurrency(proforma.taxAmount)}</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-300 mt-1">
                  <span className="font-bold text-lg text-slate-900">{t('proforma.template.total')} :</span>
                  <span className="font-bold text-lg text-slate-900">{formatCurrency(proforma.totalAmount)}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 italic mb-8">
              {t('proforma.template.amountInWords', { amount: numberToWordsFr(Math.round(proforma.totalAmount)) })}
            </p>

            {proforma.notes && (
              <div className="mb-8 p-4 bg-slate-50 rounded-lg">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">{t('proforma.template.notes')}</h4>
                <p className="text-sm text-slate-600 whitespace-pre-line">{proforma.notes}</p>
              </div>
            )}

            <DocumentFooter message={t('proforma.template.footerMessage')} />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t flex flex-wrap justify-end items-center gap-3">
          {(proforma.status === 'DRAFT') && (
            <button
              onClick={() => send(proforma.id)}
              disabled={isSending}
              className="px-4 py-2 bg-[#c6e911] text-slate-800 font-semibold rounded-md hover:bg-[#adc40f] transition-colors disabled:opacity-50"
            >
              {isSending ? t('proforma.template.sending') : t('proforma.template.markSent')}
            </button>
          )}
          <button
            onClick={handlePrint}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <IconPdf className="h-5 w-5" />
            {isExporting ? t('proforma.template.generating') : t('common.exportPdf')}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors"
          >
            <IconPrint className="h-5 w-5" />
            {t('common.print')}
          </button>
          <button onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 transition-colors">
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProformaTemplateModal;
