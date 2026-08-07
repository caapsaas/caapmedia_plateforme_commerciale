import React, { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Proforma, sendProforma } from '../../services/apiCrm/apiProformas';
import { printElementAsPdf, exportElementToPdf } from '../../utils/pdfExporter';
import { amountToWordsFcfa } from '../../utils/amountToWords';
import DocumentHeader from '../common/DocumentHeader';
import DocumentTable from '../common/DocumentTable';
import DocumentFooter from '../common/DocumentFooter';
import DocumentWatermark from '../common/DocumentWatermark';
import IconPrint from '../icons/IconPrint';
import IconPdf from '../icons/IconPdf';
import IconCancelX from '../icons/IconCancelX';

interface ProformaTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  proforma: Proforma | null;
}

const ProformaTemplateModal: React.FC<ProformaTemplateModalProps> = ({ isOpen, onClose, proforma }) => {
  const { t, formatCurrency, language } = useI18n();
  const { subsidiary } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

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

  // Cohérent avec les 5 autres documents (BonDeCommande, Facture...) :
  // "Exporter PDF" télécharge directement, "Imprimer" ouvre le PDF dans un
  // nouvel onglet et déclenche l'impression — jusqu'ici les deux boutons de
  // cette modale appelaient tous deux printElementAsPdf (dont un "Imprimer"
  // qui faisait un window.print() brut, sans rapport avec le rendu réel).
  const handleExportPdf = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      await exportElementToPdf(printRef.current, `proforma_${proforma.proformaNumber}.pdf`);
    } finally {
      setIsExporting(false);
    }
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Proforma {proforma.proformaNumber}</h3>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <IconCancelX className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto bg-slate-50 p-6">
          {/* Largeur/padding A4 fixes (w-[210mm] p-8), identiques sur les 6 documents. */}
          <div ref={printRef} className="relative w-[210mm] p-8 bg-white mx-auto">
            <DocumentWatermark />
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

            <DocumentTable
              columns={[
                {
                  label: t('proforma.template.item'), key: 'name', align: 'left',
                  render: (row) => (
                    <>
                      <span className="font-medium text-slate-800">{row.name}</span>
                      {row.description && <p className="text-xs text-slate-400">{row.description}</p>}
                    </>
                  ),
                },
                { label: t('proforma.template.qty'), key: 'quantity', align: 'center' },
                { label: t('proforma.template.unitPrice'), key: 'unitPrice', align: 'right', formatter: (v) => formatCurrency(v) },
                { label: t('proforma.template.total'), key: 'total', align: 'right', formatter: (v) => formatCurrency(v) },
              ]}
              data={(proforma.items || []).map((item: any) => ({
                name: item.product?.name || item.productId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                total: Number(item.unitPrice) * item.quantity,
              }))}
              emptyMessage={t('common.notAvailable')}
            />

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
              {t('proforma.template.amountInWords', { amount: amountToWordsFcfa(proforma.totalAmount) })}
            </p>

            {proforma.notes && (
              <div className="mb-8 p-4 bg-slate-50 rounded-lg">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">{t('proforma.template.notes')}</h4>
                <p className="text-sm text-slate-600 whitespace-pre-line">{proforma.notes}</p>
              </div>
            )}

            <DocumentFooter message={t('proforma.template.footerMessage')} subsidiary={subsidiary} />
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
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <IconPdf className="h-5 w-5" />
            {isExporting ? t('proforma.template.generating') : t('common.exportPdf')}
          </button>
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <IconPrint className="h-5 w-5" />
            {isPrinting ? t('proforma.template.generating') : t('common.print')}
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
