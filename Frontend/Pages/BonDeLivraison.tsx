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
    initialDeliveryId?: string;
    onClose: () => void;
}

const BonDeLivraison: React.FC<BonDeLivraisonProps> = ({ order, subsidiary, initialDeliveryId, onClose }) => {
    const { t, language } = useI18n();
    const blContentRef = React.useRef<HTMLDivElement>(null);
    const [isBusy, setIsBusy] = React.useState(false);
    const deliveries = order.deliveries ?? [];
    const [selectedDeliveryId, setSelectedDeliveryId] = React.useState(() => initialDeliveryId ?? deliveries.at(-1)?.id ?? '');
    const deliveryIndex = deliveries.findIndex(record => record.id === selectedDeliveryId);
    const delivery = deliveries[deliveryIndex];

    const items = order.orderItems?.length ? order.orderItems : (order.items ?? []);

    const handlePrint = async () => {
        if (!blContentRef.current || isBusy) return;
        setIsBusy(true);
        try { await printElementAsPdf(blContentRef.current); }
        finally { setIsBusy(false); }
    };

    const handleExportPdf = async () => {
        if (!blContentRef.current) return;
        const reference = delivery ? `${order.id}-${deliveryIndex + 1}` : order.id;
        await exportElementToPdf(blContentRef.current, `bon_de_livraison_${reference}.pdf`);
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return '—';
            }
            return date.toLocaleDateString(language, {
                timeZone: 'UTC',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return '—';
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
            <DocumentHeader subsidiary={subsidiary} usePublicContact />
            <div className="flex justify-between items-center gap-6 mb-8 pb-4 border-b border-slate-200">
                <div>
                    <h2 className="font-bold text-2xl text-slate-900 uppercase tracking-tight">{t('bonDeLivraison.documentTitle')}</h2>
                </div>
                <div className="text-right">
                    <div className="space-y-1.5 text-sm">
                        <div>
                            <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wide">{t('bonDeLivraison.orderNum')}</p>
                            <p className="font-semibold font-mono text-xs text-slate-900">{order.id}</p>
                        </div>
                        {delivery && <p className="text-slate-600">{t('bonDeLivraison.deliveryNumber', { number: deliveryIndex + 1 })}</p>}
                        <p className="text-slate-600">
                            {t(delivery ? 'bonDeLivraison.deliveryDate' : 'bonDeLivraison.date')}: <span className="font-semibold text-slate-900">
                                {formatDate(delivery ? delivery.deliveredOn : order.orderDate ?? order.date)}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Customer Info */}
            <div className="mb-8">
                <h5 className="font-medium text-slate-500 uppercase text-[10px] tracking-wide mb-1">{t('bonDeLivraison.recipient')}</h5>
                <p className="font-semibold text-base text-slate-900">{order.customerName}</p>
            </div>

            {/* Table */}
            <DocumentTable
                title={t('bonDeLivraison.items')}
                columns={[
                    { label: t('bonDeLivraison.designation'), key: 'productName', align: 'left' },
                    { label: t('bonDeLivraison.orderedQuantity'), key: 'quantity', align: 'center', formatter: String },
                    { label: t('bonDeLivraison.packageCount'), key: 'packageCount', align: 'center' },
                    { label: t('bonDeLivraison.deliveredQuantity'), key: 'deliveredQuantity', align: 'center' }
                ]}
                data={delivery ? delivery.lines.map(line => ({
                    productName: line.productName,
                    quantity: line.orderedQuantity,
                    packageCount: String(line.packageCount),
                    deliveredQuantity: String(line.deliveredQuantity)
                })) : items.map(item => ({
                    productName: item.productName || item.product?.name || '—',
                    quantity: item.quantity ?? '—',
                    packageCount: '—',
                    deliveredQuantity: '—'
                }))}
                emptyMessage={t('bonDeLivraison.noData')}
            />

            
            <DocumentFooter
                message={t('bonDeLivraison.footer')}
                showSignature={true}
                subsidiary={subsidiary}
            />
        </div>
    );

    return (
        <div
            className="fixed inset-0 modal-backdrop z-40 flex justify-center items-center p-4"
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
                {deliveries.length > 1 && (
                    <label className="flex flex-wrap items-center gap-3 px-6 py-3 text-sm font-medium text-slate-700">
                        {t('bonDeLivraison.chooseDelivery')}
                        <select value={selectedDeliveryId} onChange={event => setSelectedDeliveryId(event.target.value)}
                            className="rounded-md border border-slate-300 px-3 py-2">
                            {deliveries.map((record, index) => (
                                <option key={record.id} value={record.id}>
                                    {t('bonDeLivraison.deliveryNumber', { number: index + 1 })} · {formatDate(record.deliveredOn)}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
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
