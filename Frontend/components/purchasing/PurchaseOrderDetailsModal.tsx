import React from 'react';
import { PurchaseOrder, Subsidiary } from '../../types';
import { useI18n } from '../../i18n';
import IconPrint from '../icons/IconPrint';
import IconPdf from '../icons/IconPdf';
import DocumentHeader from '../common/DocumentHeader';
import DocumentTable from '../common/DocumentTable';
import DocumentFooter from '../common/DocumentFooter';
import DocumentWatermark from '../common/DocumentWatermark';
import { printElementAsPdf, exportElementToPdf } from '../../utils/pdfExporter';
import { amountToWordsFcfa } from '../../utils/amountToWords';

interface PurchaseOrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    purchaseOrder: PurchaseOrder;
    subsidiary: Subsidiary;
}

const PurchaseOrderDetailsModal: React.FC<PurchaseOrderDetailsModalProps> = ({ isOpen, onClose, purchaseOrder, subsidiary }) => {
    const { t, formatCurrency, language } = useI18n();
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [isBusy, setIsBusy] = React.useState(false);

    if (!isOpen) return null;

    const handlePrint = async () => {
        if (!contentRef.current || isBusy) return;
        setIsBusy(true);
        try { await printElementAsPdf(contentRef.current); }
        finally { setIsBusy(false); }
    };

    const handleExportPdf = async () => {
        if (!contentRef.current) return;
        await exportElementToPdf(contentRef.current, `bon_de_commande_${purchaseOrder.id}.pdf`);
    };

    // Rendu deux fois (capture cachée + aperçu visible) — jamais cloné via
    // innerHTML, voir le même correctif sur BonDeLivraison.tsx/InvoiceModal.tsx.
    // Largeur/padding A4 fixes (w-[210mm] p-8), identiques sur les 6 documents.
    const POContent = () => (
        <div className="relative w-[210mm] p-8 bg-white mx-auto">
            <DocumentWatermark />

            <DocumentHeader subsidiary={subsidiary} />

            <div className="flex justify-between items-start mb-8 mt-4">
                <div>
                    <h5 className="font-semibold text-slate-500 uppercase text-sm mb-2">{t('purchasing.supplier')}</h5>
                    <p className="font-bold text-lg text-slate-800">{purchaseOrder.supplierName}</p>
                </div>
                <div className="text-right">
                    <h4 className="font-bold text-2xl uppercase text-slate-800">{t('purchasing.newOrder')}</h4>
                    {/* purchaseOrder.id est un UUID réel (contrairement à Order.id
                        qui est préfixé "ORD-..."), inexploitable tel quel comme
                        référence lisible — même troncature que Purchasing.tsx. */}
                    <p className="text-slate-700">{t('purchasing.poNumber')}: <span className="font-semibold font-mono">#{purchaseOrder.id.slice(-8).toUpperCase()}</span></p>
                    <p className="text-slate-600">{t('purchasing.orderDate')}: {new Date(purchaseOrder.orderDate).toLocaleDateString(language)}</p>
                </div>
            </div>

            <DocumentTable
                columns={[
                    { label: t('bonDeLivraison.item'), key: 'productName', align: 'left' },
                    { label: t('bonDeLivraison.quantity'), key: 'quantity', align: 'center' },
                    { label: t('purchasing.quantityReceived'), key: 'quantityReceived', align: 'center' },
                    { label: t('purchasing.form.purchasePrice'), key: 'purchasePrice', align: 'right', formatter: (v) => formatCurrency(v) },
                    { label: t('bonDeLivraison.totalPrice'), key: 'total', align: 'right', formatter: (v) => formatCurrency(v) },
                ]}
                data={purchaseOrder.items.map((item) => ({
                    productName: item.productName,
                    quantity: item.quantity,
                    quantityReceived: item.quantityReceived,
                    purchasePrice: item.purchasePrice,
                    total: item.purchasePrice * item.quantity,
                }))}
                totalRow={{
                    label: t('bonDeLivraison.total'),
                    value: formatCurrency(purchaseOrder.totalAmount),
                    isHighlighted: true,
                }}
                emptyMessage={t('common.notAvailable')}
            />

            <p className="text-sm text-slate-600 italic mb-8">
                {t('bonDeCommande.amountInWords', { amount: amountToWordsFcfa(purchaseOrder.totalAmount) })}
            </p>

            {purchaseOrder.history.length > 0 && (
                <div className="mb-8">
                    <h4 className="font-semibold text-slate-700 mb-2">{t('purchasing.history.title')}</h4>
                    <div className="border border-slate-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                        <ul className="space-y-2">
                            {purchaseOrder.history.map((entry, index) => (
                                <li key={index} className="text-xs text-slate-600">
                                    <span className="font-semibold">{new Date(entry.date).toLocaleDateString(language)}:</span> {entry.event}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <DocumentFooter showSignature={false} subsidiary={subsidiary} />
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
            {/* Hors-écran (voir BonDeCommande.tsx) — évite l'affichage "en double" derrière la modale. */}
            <div className="fixed top-0 left-[-9999px] bg-white">
                <div ref={contentRef}>
                    <POContent />
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col no-print" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-slate-800">{t('purchasing.modal.detailsTitle')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="overflow-y-auto bg-slate-50 p-6">
                    <POContent />
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-end items-center space-x-4">
                    <button onClick={handleExportPdf} className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors">
                        <IconPdf className="h-5 w-5"/>
                        <span>{t('common.exportPdf')}</span>
                    </button>
                    <button onClick={handlePrint} disabled={isBusy} className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                        <IconPrint className="h-5 w-5"/>
                        <span>{isBusy ? '...' : t('common.print')}</span>
                    </button>
                    <button onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 transition-colors">
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseOrderDetailsModal;
