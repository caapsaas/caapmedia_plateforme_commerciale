import React from 'react';
import { PurchaseOrder, Subsidiary } from '../types';
import { useI18n } from '../i18n';
import IconPrint from '../components/icons/IconPrint';
import IconPdf from '../components/icons/IconPdf';
import DocumentHeader from '../components/common/DocumentHeader';
import DocumentTable from '../components/common/DocumentTable';
import DocumentFooter from '../components/common/DocumentFooter';
import DocumentWatermark from '../components/common/DocumentWatermark';
import { printElementAsPdf, exportElementToPdf } from '../utils/pdfExporter';

interface BonEntreeProps {
    purchaseOrder: PurchaseOrder;
    subsidiary: Subsidiary;
    onClose: () => void;
}

// Bon d'entrée (réception marchandises) — calqué sur
// Frontend_GMO/components/purchasing/GoodsReceiptNoteModal.tsx, simplifié :
// pas d'entité GoodsReceipt séparée ni de capture de signature électronique
// côté caapmedia (choix assumé, hors périmètre actuel) — le document reflète
// l'état cumulé de réception du bon de commande (quantityReceived par
// ligne), avec des blocs signature à remplir à la main comme sur un
// formulaire papier.
const BonEntree: React.FC<BonEntreeProps> = ({ purchaseOrder, subsidiary, onClose }) => {
    const { t, language, formatNumber } = useI18n();
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [isBusy, setIsBusy] = React.useState(false);

    const handlePrint = async () => {
        if (!contentRef.current || isBusy) return;
        setIsBusy(true);
        try { await printElementAsPdf(contentRef.current); }
        finally { setIsBusy(false); }
    };

    const handleExportPdf = async () => {
        if (!contentRef.current) return;
        await exportElementToPdf(contentRef.current, `bon_entree_${purchaseOrder.id}.pdf`);
    };

    const receivedItems = purchaseOrder.items.filter((item) => item.quantityReceived > 0);
    const isFullyReceived = purchaseOrder.items.every((item) => item.quantityReceived >= item.quantity);

    // Largeur/padding A4 fixes (w-[210mm] p-8), identiques sur les 6 documents.
    const DocumentContent = () => (
        <div className="relative w-[210mm] p-8 bg-white mx-auto">
            <DocumentWatermark />

            <DocumentHeader subsidiary={subsidiary} />

            <div className="flex justify-between items-start mb-8 mt-4">
                <div>
                    <h4 className="text-2xl font-bold text-slate-800">{t('purchasing.goodsReceipt.title')}</h4>
                    {/* purchaseOrder.id est un UUID réel — même troncature que Purchasing.tsx/PurchaseOrderDetailsModal.tsx. */}
                    <p className="text-slate-600 mt-1">
                        {t('purchasing.poNumber')} : <span className="font-semibold font-mono">#{purchaseOrder.id.slice(-8).toUpperCase()}</span>
                    </p>
                    <p className="text-slate-600">
                        {t('purchasing.orderDate')} : {new Date(purchaseOrder.orderDate).toLocaleDateString(language)}
                    </p>
                    <p className="text-slate-600">
                        {t('purchasing.goodsReceipt.receiptDate')} : {new Date().toLocaleDateString(language)}
                    </p>
                </div>
                <div className="text-right">
                    <h5 className="uppercase text-xs text-slate-500">{t('purchasing.supplier')}</h5>
                    <p className="font-bold text-lg text-slate-800">{purchaseOrder.supplierName}</p>
                    <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isFullyReceived ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {isFullyReceived ? t('purchasing.status_RECEIVED') : t('purchasing.status_PARTIALLY_RECEIVED')}
                    </span>
                </div>
            </div>

            <DocumentTable
                title={t('purchasing.goodsReceipt.itemsTitle')}
                columns={[
                    { label: t('purchasing.form.product'), key: 'productName', align: 'left' },
                    { label: t('purchasing.receiveItemsModal.ordered'), key: 'quantity', align: 'center' },
                    { label: t('purchasing.goodsReceipt.quantityReceived'), key: 'quantityReceived', align: 'center' },
                ]}
                data={purchaseOrder.items.map((item) => ({
                    productName: item.productName,
                    quantity: item.quantity,
                    quantityReceived: formatNumber(item.quantityReceived),
                }))}
                emptyMessage={t('common.notAvailable')}
            />
            <p className="text-xs italic text-slate-400 -mt-6 mb-8">
                {t('purchasing.goodsReceipt.disclaimer')}
            </p>

            {/* Blocs signature — remplis à la main, pas de capture électronique (hors périmètre actuel). */}
            <div className="grid grid-cols-2 gap-6 mt-4">
                <div className="border border-slate-200 rounded-lg p-4">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-8">{t('purchasing.goodsReceipt.warehouseKeeper')}</p>
                    <div className="border-t border-dashed border-slate-300 pt-2 text-center text-xs text-slate-300 italic">
                        {t('purchasing.goodsReceipt.signature')}
                    </div>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-8">{t('purchasing.goodsReceipt.supplierOrCarrier')}</p>
                    <div className="border-t border-dashed border-slate-300 pt-2 text-center text-xs text-slate-300 italic">
                        {t('purchasing.goodsReceipt.signature')}
                    </div>
                </div>
            </div>

            <DocumentFooter showSignature={false} subsidiary={subsidiary} />
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            {/* Hors-écran (voir BonDeCommande.tsx) — évite l'affichage "en double" derrière la modale. */}
            <div className="fixed top-0 left-[-9999px] bg-white">
                <div ref={contentRef}>
                    <DocumentContent />
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col no-print" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-slate-800">{t('purchasing.goodsReceipt.title')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="overflow-y-auto bg-slate-50 p-6">
                    {receivedItems.length === 0 ? (
                        <p className="text-sm text-slate-400 italic text-center py-8">{t('purchasing.goodsReceipt.noneReceivedYet')}</p>
                    ) : (
                        <DocumentContent />
                    )}
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-end items-center space-x-4">
                    <button onClick={handleExportPdf} className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors">
                        <IconPdf className="h-5 w-5" />
                        <span>{t('common.exportPdf')}</span>
                    </button>
                    <button onClick={handlePrint} disabled={isBusy} className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                        <IconPrint className="h-5 w-5" />
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

export default BonEntree;
