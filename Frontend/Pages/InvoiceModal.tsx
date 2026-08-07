import React from 'react';
import { Order, Subsidiary, Contact } from '../types';
import { useI18n } from '../i18n';
import IconPrint from '../components/icons/IconPrint';
import IconPdf from '../components/icons/IconPdf';
import DocumentHeader from '../components/common/DocumentHeader';
import DocumentTable from '../components/common/DocumentTable';
import DocumentFooter from '../components/common/DocumentFooter';
import DocumentWatermark from '../components/common/DocumentWatermark';
import { printElementAsPdf, exportElementToPdf } from '../utils/pdfExporter';
import { amountToWordsFcfa } from '../utils/amountToWords';
import SpecValuesSummary from '../components/common/SpecValuesSummary';

interface InvoiceModalProps {
    isOpen: boolean;
    order: Order;
    subsidiary: Subsidiary;
    client: Contact | null;
    onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, order, subsidiary, client, onClose }) => {
    const { t, formatCurrency, language } = useI18n();
    const invoiceContentRef = React.useRef<HTMLDivElement>(null);
    const [isBusy, setIsBusy] = React.useState(false);

    if (!isOpen || !client) return null;

    const handlePrint = async () => {
        if (!invoiceContentRef.current || isBusy) return;
        setIsBusy(true);
        try { await printElementAsPdf(invoiceContentRef.current); }
        finally { setIsBusy(false); }
    };

    const handleExportPdf = async () => {
        if (!invoiceContentRef.current) return;
        await exportElementToPdf(invoiceContentRef.current, `facture_${order.id}.pdf`);
    };

    // Rendu une seule fois (ref caché pour la capture PDF/impression) puis
    // réutilisé tel quel — pas de clone via innerHTML (perd les event
    // handlers/état) ni de duplicata codé en dur qui risque de diverger de
    // l'aperçu visible (voir le bug corrigé sur BonDeLivraison.tsx).
    // Largeur/padding A4 fixes (w-[210mm] p-8), identiques sur les 6
    // documents imprimables — voir BonDeCommande.tsx.
    const InvoiceContent = () => (
        <div className="relative w-[210mm] p-8 bg-white text-sm mx-auto">
            <DocumentWatermark />

            <DocumentHeader subsidiary={subsidiary} showFiscalInfo />

            <div className="flex justify-between items-start mb-10 mt-4">
                <div className="p-4 bg-slate-50 rounded-lg max-w-xs">
                    <h3 className="font-semibold text-slate-500 uppercase text-xs mb-1">{t('invoice.billedTo')}</h3>
                    <p className="font-bold text-slate-800">{client.contactName}</p>
                    <p className="text-slate-600">{client.company}</p>
                    <p className="text-slate-600">{client.address}</p>
                    <p className="text-slate-600">{client.phone}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold uppercase text-slate-800">{t('invoice.title')}</h2>
                    <p className="text-slate-600 mt-2">{t('invoice.invoiceNum')} <span className="font-semibold">{order.id}</span></p>
                    <p className="text-slate-600">{t('invoice.date')}: {new Date(order.date).toLocaleDateString(language)}</p>
                    <p className="text-slate-600">{t('invoice.paymentDueDate')}: <span className="font-semibold">{new Date(order.paymentDueDate).toLocaleDateString(language)}</span></p>
                </div>
            </div>

            <DocumentTable
                columns={[
                    {
                        label: t('invoice.item'), key: 'productName', align: 'left',
                        render: (row) => (
                            <>
                                <span className="font-medium text-slate-900">{row.productName}</span>
                                <SpecValuesSummary schema={row.specSnapshot} values={row.specValues} audience="client" />
                            </>
                        ),
                    },
                    { label: t('invoice.quantity'), key: 'quantity', align: 'center' },
                    { label: t('invoice.unitPrice'), key: 'unitPrice', align: 'right', formatter: (v) => formatCurrency(v) },
                    { label: t('invoice.totalPrice'), key: 'total', align: 'right', formatter: (v) => formatCurrency(v) },
                ]}
                data={order.orderItems.map((item) => ({
                    productName: item.product.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: item.unitPrice * item.quantity - (item.discount ?? 0),
                    specSnapshot: item.specSnapshot,
                    specValues: item.specValues,
                }))}
                emptyMessage={t('common.notAvailable')}
            />

            <div className="flex justify-end mt-4 mb-8">
                <div className="w-full max-w-xs">
                    <div className="flex justify-between py-1">
                        <span className="text-slate-600">{t('invoice.subtotal')}:</span>
                        <span className="font-medium text-slate-800">{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span className="text-slate-600">{t('invoice.tax')} ({(order.taxRateValue * 100).toFixed(2)}%):</span>
                        <span className="font-medium text-slate-800">{formatCurrency(order.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t-2 border-slate-300 mt-2">
                        <span className="font-bold text-lg text-slate-900">{t('invoice.totalTTC')}:</span>
                        <span className="font-bold text-lg text-slate-900">{formatCurrency(order.totalAmount)}</span>
                    </div>
                </div>
            </div>

            <p className="text-sm text-slate-600 italic mb-8">
                {t('invoice.amountInWords', { amount: amountToWordsFcfa(order.totalAmount) })}
            </p>

            {subsidiary.bankDetails && (
                <div className="mb-8 pt-4 border-t border-slate-200 text-slate-600">
                    <h4 className="font-semibold mb-2">{t('invoice.paymentInfo')}</h4>
                    <p>Banque: {subsidiary.bankDetails.bankName}</p>
                    <p>N° de compte: {subsidiary.bankDetails.accountNumber}</p>
                    <p>Code SWIFT: {subsidiary.bankDetails.swift}</p>
                </div>
            )}

            <DocumentFooter subsidiary={subsidiary} />
        </div>
    );

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-title"
        >
            {/* Hors-écran (voir BonDeCommande.tsx) — évite l'affichage "en double" derrière la modale. */}
            <div className="fixed top-0 left-[-9999px] bg-white">
                <div ref={invoiceContentRef}>
                    <InvoiceContent />
                </div>
            </div>

            <div
                className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col no-print"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 id="invoice-title" className="text-2xl font-bold text-slate-800">{t('invoice.title')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="overflow-y-auto bg-slate-50 p-6">
                    <InvoiceContent />
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-end items-center space-x-4">
                     <button
                        onClick={handleExportPdf}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors"
                    >
                        <IconPdf className="h-5 w-5"/>
                        <span>{t('invoice.exportPdf')}</span>
                    </button>
                     <button
                        onClick={handlePrint}
                        disabled={isBusy}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <IconPrint className="h-5 w-5"/>
                        <span>{isBusy ? '...' : t('common.print')}</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 transition-colors"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
