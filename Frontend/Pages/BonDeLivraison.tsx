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


interface BonDeLivraisonProps {
    order: Order;
    subsidiary: Subsidiary;
    onClose: () => void;
}

const BonDeLivraison: React.FC<BonDeLivraisonProps> = ({ order, subsidiary, onClose }) => {
    const { t, formatCurrency, language } = useI18n();
    const blContentRef = React.useRef<HTMLDivElement>(null);
    const [isBusy, setIsBusy] = React.useState(false);

    // Le backend renvoie toujours `orderItems` (jamais `items`, malgré le
    // type frontend Order.items) avec un productName/unitPrice à plat sur
    // chaque ligne — pas de order.product imbriqué. Sans ce fallback, le
    // tableau restait vide (le vrai bug derrière "rien ne s'affiche").
    const billableItems: any[] = (order as any).orderItems?.length
        ? (order as any).orderItems
        : (order.items ?? []);

    const handlePrint = async () => {
        if (!blContentRef.current || isBusy) return;
        setIsBusy(true);
        try { await printElementAsPdf(blContentRef.current); }
        finally { setIsBusy(false); }
    };

    const handleExportPdf = async () => {
        if (!blContentRef.current) return;
        await exportElementToPdf(blContentRef.current, `bon_de_livraison_${order.id}.pdf`);
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

    // Contenu du document réutilisable — rendu deux fois (capture PDF/impression
    // cachée + aperçu visible dans la modale), jamais cloné via innerHTML :
    // évite qu'un contenu caché diverge silencieusement de l'aperçu (bug corrigé
    // ici — l'ancien bloc caché codé en dur référençait un LogoComponent
    // jamais défini et plantait à l'impression/export PDF).
    // Largeur/padding A4 fixes (w-[210mm] p-8), identiques sur les 6
    // documents imprimables — voir BonDeCommande.tsx pour la même remarque.
    const DocumentContent = () => (
        <div className="relative w-[210mm] p-8 bg-white mx-auto">
            <DocumentWatermark />

            {/* Header */}
            <DocumentHeader subsidiary={subsidiary} />
            <div className="flex justify-between items-start mb-8">
                <h2 className="font-bold text-2xl text-slate-800 uppercase">{t('bonDeLivraison.title')}</h2>
                <div className="text-right">
                    <div className="space-y-2 text-sm">
                        <p className="text-slate-700 font-semibold">{t('bonDeLivraison.orderNum')}: <span className="font-bold text-base text-[#c6e911]">{order.id}</span></p>
                        <p className="text-slate-600">{t('bonDeLivraison.date')}: <span className="font-semibold text-slate-800">{formatDate(order.date)}</span></p>
                    </div>
                </div>
            </div>

            {/* Customer Info */}
            <div className="mb-10">
                <h5 className="font-semibold text-slate-600 uppercase text-xs tracking-wide mb-3 border-b pb-2">{t('bonDeLivraison.billedTo')}</h5>
                <p className="font-bold text-lg text-slate-900">{order.customerName}</p>
            </div>

            {/* Table */}
            <DocumentTable
                title={t('bonDeLivraison.items')}
                columns={[
                    { label: t('bonDeLivraison.item'), key: 'productName', align: 'left' },
                    { label: t('bonDeLivraison.quantity'), key: 'quantity', align: 'center' },
                    { label: t('bonDeLivraison.unitPrice'), key: 'unitPrice', align: 'right', formatter: (v) => formatCurrency(v) },
                    { label: t('bonDeLivraison.totalPrice'), key: 'total', align: 'right', formatter: (v) => formatCurrency(v) }
                ]}
                data={billableItems.map((item: any) => ({
                    productName: item.productName || item.product?.name || '—',
                    quantity: item.quantity || 0,
                    unitPrice: item.unitPrice ?? item.price ?? 0,
                    total: (item.unitPrice ?? item.price ?? 0) * (item.quantity || 0)
                }))}
                totalRow={{
                    label: t('bonDeLivraison.total'),
                    value: formatCurrency(order.totalAmount),
                    isHighlighted: true
                }}
                emptyMessage={t('bonDeLivraison.noData')}
            />

            
            <DocumentFooter
                message={`${t('bonDeLivraison.footer')} ${order.paymentDueDate ? formatDate(order.paymentDueDate) : ''}.`}
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
            aria-labelledby="bl-title"
        >
            {/* Wrapper for printable content — hors-écran (voir BonDeCommande.tsx). */}
            <div className="fixed top-0 left-[-9999px] bg-white">
                <div ref={blContentRef}>
                    <DocumentContent />
                </div>
            </div>

            {/* Modal container */}
            <div
                className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col no-print"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b-2 border-slate-200 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
                    <h3 id="bl-title" className="text-2xl font-bold text-slate-800">{t('bonDeLivraison.title')}</h3>
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
                        <span>{t('bonDeLivraison.exportPdf')}</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={isBusy}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <IconPrint className="h-5 w-5"/>
                        <span>{isBusy ? '...' : t('bonDeLivraison.print')}</span>
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

export default BonDeLivraison;
