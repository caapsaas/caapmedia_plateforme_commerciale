import React, { useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { printElementAsPdf } from '../../utils/pdfExporter';
import DocumentHeader from '../common/DocumentHeader';
import DocumentFooter from '../common/DocumentFooter';
import IconPrint from '../icons/IconPrint';
import IconCancelX from '../icons/IconCancelX';

export interface TaxDeclarationColumn<T> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => React.ReactNode;
}

interface TaxDeclarationModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  periodLabel: string;
  columns: TaxDeclarationColumn<T>[];
  rows: T[];
  totalLabel: string;
  totalValue: string;
}

/**
 * Relevé récapitulatif imprimable, générique sur le type d'impôt/charge
 * (IRPP, CNPS, CFC, FNE, TVA) — un document interne de synthèse (pas un
 * formulaire officiel de déclaration reconstitué, dont on n'a pas la
 * structure légale exacte), même flux d'impression que le reste de l'appli
 * (printElementAsPdf, déjà utilisé par les documents comptables/proforma).
 */
function TaxDeclarationModal<T>({
  isOpen,
  onClose,
  title,
  periodLabel,
  columns,
  rows,
  totalLabel,
  totalValue,
}: TaxDeclarationModalProps<T>) {
  const { t } = useI18n();
  const { subsidiary } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !subsidiary) return null;

  const handlePrint = async () => {
    if (!printRef.current) return;
    setIsPrinting(true);
    try {
      await printElementAsPdf(printRef.current);
    } finally {
      setIsPrinting(false);
    }
  };

  const alignClass = (align?: 'left' | 'right' | 'center') =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{periodLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white text-sm font-semibold rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <IconPrint className="h-4 w-4" />
              {isPrinting ? t('proforma.template.generating') : t('common.print')}
            </button>
            <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <IconCancelX className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50">
          <div ref={printRef} className="bg-white p-8 mx-auto" style={{ width: '750px' }}>
            <DocumentHeader subsidiary={subsidiary} />
            <div className="mb-6">
              <h2 className="text-xl font-bold uppercase text-slate-800">{title}</h2>
              <p className="text-slate-600 mt-1">{periodLabel}</p>
            </div>

            <table className="w-full text-sm text-left text-slate-600 mb-6">
              <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className={`px-3 py-2 ${alignClass(col.align)}`}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-slate-400">{t('common.notAvailable')}</td></tr>
                ) : rows.map((row, idx) => (
                  <tr key={idx} className="border-b">
                    {columns.map((col) => (
                      <td key={col.key} className={`px-3 py-2 ${alignClass(col.align)}`}>{col.render(row)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-800">
                  <td colSpan={columns.length - 1} className="px-3 py-2 text-right">{totalLabel}</td>
                  <td className="px-3 py-2 text-right">{totalValue}</td>
                </tr>
              </tfoot>
            </table>

            <DocumentFooter message={t('taxTransparency.declaration.footerMessage')} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaxDeclarationModal;
