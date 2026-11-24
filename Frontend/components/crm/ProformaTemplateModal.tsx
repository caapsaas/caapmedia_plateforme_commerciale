import ProformaPdfActions from './ProformaPdfActions';
import DocumentHeader from '../common/DocumentHeader';
import DocumentTable from '../common/DocumentTable';
import DocumentFooter from '../common/DocumentFooter';
import DocumentWatermark from '../common/DocumentWatermark';
import { amountToWordsFcfa } from '../../utils/amountToWords';
import { useI18n } from '../../i18n';
import { Proforma } from '../../services/apiCrm/apiProformas';
import { X } from 'lucide-react';

interface ProformaTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  proforma: Proforma | null;
}

export default function ProformaTemplateModal({ isOpen, onClose, proforma }: ProformaTemplateModalProps) {
  const { t, formatCurrency, language } = useI18n();

  if (!isOpen || !proforma) return null;

  const subtotal = Number(proforma.subtotal);
  const taxAmount = Number(proforma.taxAmount);
  const totalAmount = Number(proforma.totalAmount);
  const branch = proforma.subsidiary;
  const subsidiary = branch && {
    ...branch,
    name: branch.subsidiaryName,
    bankDetails: { bankName: branch.bankName, accountNumber: branch.accountNumber, swift: '' },
  };

  return (
    <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="proforma-preview-title"
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
          <h3 id="proforma-preview-title" className="text-lg font-bold tracking-tight text-slate-900">
            {t('proforma.template.documentTitle')} · {proforma.proformaNumber}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 overflow-auto bg-slate-100 p-3 sm:p-5">
          <div className="relative mx-auto w-[210mm] bg-white p-8">
            <DocumentWatermark />
            {subsidiary && <DocumentHeader subsidiary={subsidiary} usePublicContact />}

            <div className="flex justify-between items-start mb-8">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">
                  {t('proforma.template.billedTo')}
                </h4>
                <p className="font-bold text-slate-800">{proforma.clientName}</p>
                {proforma.clientCompany && <p className="text-slate-600">{proforma.clientCompany}</p>}
                <p className="text-slate-600">{proforma.clientEmail}</p>
                <p className="text-slate-600">{proforma.clientPhone}</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold uppercase text-slate-800">{t('proforma.template.documentTitle')}</h2>
                <p className="text-slate-600 mt-1">
                  {t('proforma.template.number')} <span className="font-semibold">{proforma.proformaNumber}</span>
                </p>
                <p className="text-slate-600">
                  {t('proforma.template.date')} :{' '}
                  {new Date(proforma.createdAt).toLocaleDateString(language, { timeZone: 'Africa/Douala' })}
                </p>
                <p className="text-slate-600">
                  {t('proforma.template.validity')} :{' '}
                  {new Date(proforma.validityDate).toLocaleDateString(language, { timeZone: 'Africa/Douala' })}
                </p>
              </div>
            </div>

            <DocumentTable
              columns={[
                {
                  label: t('proforma.template.item'),
                  key: 'name',
                  align: 'left',
                  render: (row) => (
                    <>
                      <span className="font-medium text-slate-800">{row.name}</span>
                      {row.description && <p className="text-xs text-slate-400">{row.description}</p>}
                    </>
                  ),
                },
                { label: t('proforma.template.qty'), key: 'quantity', align: 'center' },
                {
                  label: t('proforma.template.unitPrice'),
                  key: 'unitPrice',
                  align: 'right',
                  formatter: (v) => formatCurrency(v, 2),
                },
                {
                  label: t('proforma.template.total'),
                  key: 'total',
                  align: 'right',
                  formatter: (v) => formatCurrency(v, 2),
                },
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

            <div className={`flex justify-end ${proforma.notes ? 'mb-3' : 'mb-8'}`}>
              <div className="w-full max-w-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('proforma.template.subtotal')} :</span>
                  <span className="font-medium text-slate-800">{formatCurrency(subtotal, 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    {t('proforma.template.tax')} ({Number(proforma.taxRate)}%) :
                  </span>
                  <span className="font-medium text-slate-800">{formatCurrency(taxAmount, 2)}</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-300 mt-1">
                  <span className="font-bold text-lg text-slate-900">{t('proforma.template.total')} :</span>
                  <span className="font-bold text-lg text-slate-900">{formatCurrency(totalAmount, 2)}</span>
                </div>
              </div>
            </div>

            {proforma.notes && (
              <div className="mb-5 rounded-r-lg border-l-4 border-[#c6e911] bg-lime-50/70 px-4 py-3">
                <h4 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {t('proforma.template.notes')}
                </h4>
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">{proforma.notes}</p>
              </div>
            )}

            <p className="text-sm text-slate-600 italic mb-8">
              {t('proforma.template.amountInWords', { amount: amountToWordsFcfa(totalAmount) })}
            </p>

            <DocumentFooter message={t('proforma.template.footerMessage')} subsidiary={subsidiary} />
          </div>
        </div>
        <footer className="border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
          <ProformaPdfActions key={proforma.id} proforma={proforma} />
        </footer>
      </section>
    </div>
  );
}
