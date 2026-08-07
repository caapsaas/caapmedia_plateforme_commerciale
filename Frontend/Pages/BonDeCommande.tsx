import React from 'react';
import { Order, Subsidiary } from '../types';
import { useI18n } from '../i18n';
import IconPrint from '../components/icons/IconPrint';
import IconPdf from '../components/icons/IconPdf';
import DocumentHeader from '../components/common/DocumentHeader';
import DocumentTable from '../components/common/DocumentTable';
import DocumentFooter from '../components/common/DocumentFooter';
import DocumentWatermark from '../components/common/DocumentWatermark';
import { printElementAsPdf, exportElementToPdf } from '../utils/pdfExporter';
import { amountToWordsFcfa } from '../utils/amountToWords';


interface BonDeCommandeProps {
    order: Order;
    subsidiary: Subsidiary;
    onClose: () => void;
}

const BonDeCommande: React.FC<BonDeCommandeProps> = ({ order, subsidiary, onClose }) => {
    const { t, formatCurrency, language } = useI18n();
    const bcContentRef = React.useRef<HTMLDivElement>(null);
    const [isBusy, setIsBusy] = React.useState(false);

    // Le backend renvoie toujours `orderItems` (jamais `items`, malgré le
    // type frontend Order.items) avec un productName/unitPrice à plat sur
    // chaque ligne — pas de order.product imbriqué. Sans ce fallback, le
    // tableau restait vide (le vrai bug derrière "rien ne s'affiche").
    const billableItems: any[] = (order as any).orderItems?.length
        ? (order as any).orderItems
        : (order.items ?? []);

    const handlePrint = async () => {
        if (!bcContentRef.current || isBusy) return;
        setIsBusy(true);
        try { await printElementAsPdf(bcContentRef.current); }
        finally { setIsBusy(false); }
    };

    const handleExportPdf = async () => {
        if (!bcContentRef.current) return;
        await exportElementToPdf(bcContentRef.current, `bon_de_commande_${order.id}.pdf`);
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'N/A';
            }
            return date.toLocaleDateString(language, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return 'N/A';
        }
    };

    // Contenu du document réutilisable — largeur/padding A4 fixes (w-[210mm]
    // p-8), identiques sur les 6 documents imprimables, pour un rendu
    // cohérent aperçu/PDF/impression (voir DocumentFooter.tsx qui compense
    // ce p-8 précis pour la bande légale en bord à bord).
    const DocumentContent = () => (
        <div className="relative w-[210mm] p-8 bg-white mx-auto">
            <DocumentWatermark />
            {/* Header */}
            <DocumentHeader subsidiary={subsidiary} />
            <div className="flex justify-between items-start mb-8">
                <h2 className="font-bold text-2xl text-slate-800 uppercase">{t('bonDeCommande.title')}</h2>
                <div className="text-right">
                    <div className="space-y-2 text-sm">
                        <p className="text-slate-700 font-semibold">{t('bonDeCommande.orderNum')}: <span className="font-bold text-base text-[#c6e911]">{order.id}</span></p>
                        <p className="text-slate-600">{t('bonDeCommande.date')}: <span className="font-semibold text-slate-800">{formatDate(order.date)}</span></p>
                        <p className="text-slate-600 mt-3 text-xs font-semibold">
                            {order.status === 'PENDING_VALIDATION' ? (
                                <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded">⏳ En attente</span>
                            ) : (
                                <span className="text-green-600 bg-green-50 px-2 py-1 rounded">✓ Validée</span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-12 mb-10">
                <div>
                    <h5 className="font-semibold text-slate-600 uppercase text-xs tracking-wide mb-3 border-b pb-2">{t('bonDeCommande.billedTo')}</h5>
                    <p className="font-bold text-lg text-slate-900">{order.customerName}</p>
                </div>
                <div>
                    <h5 className="font-semibold text-slate-600 uppercase text-xs tracking-wide mb-3 border-b pb-2">{t('bonDeCommande.paymentMethod')}</h5>
                    <p className="font-semibold text-slate-800">{order.paymentMethod || 'N/A'}</p>
                    {order.paymentDueDate && (
                        <p className="text-slate-600 text-sm mt-3">
                            <span className="font-semibold">{t('bonDeCommande.dueDate')}:</span> {formatDate(order.paymentDueDate)}
                        </p>
                    )}
                </div>
            </div>

            {/* Table */}
            <DocumentTable
                title={t('bonDeCommande.items')}
                columns={[
                    { label: t('bonDeCommande.item'), key: 'productName', align: 'left' },
                    { label: t('bonDeCommande.quantity'), key: 'quantity', align: 'center' },
                    { label: t('bonDeCommande.unitPrice'), key: 'unitPrice', align: 'right', formatter: (v) => formatCurrency(v) },
                    { label: t('bonDeCommande.totalPrice'), key: 'total', align: 'right', formatter: (v) => formatCurrency(v) }
                ]}
                data={billableItems.map((item: any) => ({
                    productName: item.productName || item.product?.name || '—',
                    quantity: item.quantity || 0,
                    unitPrice: item.unitPrice ?? item.price ?? 0,
                    total: (item.unitPrice ?? item.price ?? 0) * (item.quantity || 0)
                }))}
                totalRow={{
                    label: t('bonDeCommande.total'),
                    value: formatCurrency(order.totalAmount),
                    isHighlighted: true
                }}
                emptyMessage={t('bonDeCommande.noData')}
            />

            <p className="text-sm text-slate-600 italic mb-8">
                {t('bonDeCommande.amountInWords', { amount: amountToWordsFcfa(order.totalAmount) })}
            </p>

            {/* Footer */}
            <DocumentFooter
                message={`${t('bonDeCommande.footer')} ${order.paymentDueDate ? formatDate(order.paymentDueDate) : ''}.`}
                showSignature={true}
                subsidiary={subsidiary}
            />
        </div>
    );

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bc-title"
        >
            {/* Wrapper for printable content — hors-écran (pas juste -z-10 : un enfant
                positionné reste visible dans les zones non couvertes par la modale
                centrée, d'où le rendu "en double" derrière). Même pattern que gmo. */}
            <div className="fixed top-0 left-[-9999px] bg-white">
                <div ref={bcContentRef}>
                    <DocumentContent />
                </div>
            </div>

            {/* Modal container */}
            <div
                className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col no-print"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b-2 border-slate-200 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
                    <h3 id="bc-title" className="text-2xl font-bold text-slate-800">{t('bonDeCommande.title')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-slate-600"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 bg-slate-50 p-6">
                    <DocumentContent />
                </div>

                <div className="p-6 bg-slate-50 border-t-2 border-slate-200 flex justify-end items-center space-x-3 flex-shrink-0">
                    <button
                        onClick={handleExportPdf}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all shadow-md hover:shadow-lg"
                    >
                        <IconPdf className="h-5 w-5"/>
                        <span>{t('bonDeCommande.exportPdf')}</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={isBusy}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <IconPrint className="h-5 w-5"/>
                        <span>{isBusy ? '...' : t('bonDeCommande.print')}</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="px-7 py-2.5 bg-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-400 transition-all"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BonDeCommande;
