import React from 'react';
import { PurchaseOrder, Subsidiary } from '../../types';
import { useI18n } from '../../i18n';
import IconPrint from '../icons/IconPrint';
import IconPdf from '../icons/IconPdf';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PurchaseOrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    purchaseOrder: PurchaseOrder;
    subsidiary: Subsidiary;
}

const PurchaseOrderDetailsModal: React.FC<PurchaseOrderDetailsModalProps> = ({ isOpen, onClose, purchaseOrder, subsidiary }) => {
    const { t, formatCurrency, language } = useI18n();
    const LogoComponent = subsidiary?.logo;
    const contentRef = React.useRef<HTMLDivElement>(null);

    const handleExportPdf = () => {
        if (!contentRef.current) return;
        html2canvas(contentRef.current, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`bon_de_commande_${purchaseOrder.id}.pdf`);
        });
    };

    const handlePrint = () => window.print();

    if (!isOpen) return null;

    const POContent = () => (
        <div className="p-8 bg-white" ref={contentRef}>
            <div className="flex justify-between items-start mb-8">
                <div>
                    {LogoComponent && <LogoComponent className="h-20 w-auto" />}
                    <p className="font-bold text-lg mt-2">{subsidiary?.name}</p>
                </div>
                <div className="text-right">
                    <h4 className="font-bold text-2xl uppercase text-slate-800">{t('purchasing.newOrder')}</h4>
                    <p className="text-slate-700">{t('purchasing.poNumber')}: <span className="font-semibold">{purchaseOrder.id}</span></p>
                    <p className="text-slate-600">{t('purchasing.orderDate')}: {new Date(purchaseOrder.orderDate).toLocaleDateString(language)}</p>
                </div>
            </div>
            <div className="mb-8">
                <h5 className="font-semibold text-slate-500 uppercase text-sm mb-2">{t('purchasing.supplier')}</h5>
                <p className="font-bold text-lg text-slate-800">{purchaseOrder.supplierName}</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('bonDeLivraison.item')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('bonDeLivraison.quantity')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('purchasing.quantityReceived')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('purchasing.form.purchasePrice')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('bonDeLivraison.totalPrice')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchaseOrder.items.map((item, index) => (
                            <tr key={index} className="bg-white border-b">
                                <td className="px-6 py-4 font-medium text-slate-900">{item.productName}</td>
                                <td className="px-6 py-4 text-center">{item.quantity}</td>
                                <td className="px-6 py-4 text-center font-semibold">{item.quantityReceived}</td>
                                <td className="px-6 py-4 text-right">{formatCurrency(item.purchasePrice)}</td>
                                <td className="px-6 py-4 text-right font-semibold">{formatCurrency(item.purchasePrice * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="font-bold text-slate-800 bg-slate-50">
                            <td colSpan={4} className="px-6 py-4 text-right text-lg">{t('bonDeLivraison.total')}</td>
                            <td className="px-6 py-4 text-right text-lg">{formatCurrency(purchaseOrder.totalAmount)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
             <div className="mt-6">
                <h4 className="font-semibold text-slate-700 mb-2">{t('purchasing.history.title')}</h4>
                <div className="border border-slate-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <ul className="space-y-2">
                        {purchaseOrder.history.map((entry, index) => (
                            <li key={index} className="text-xs text-slate-600">
                                <span className="font-semibold">{entry.date}:</span> {entry.event}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
            <div className="printable-area absolute top-0 left-0 -z-10 w-full bg-white">
                <POContent />
            </div>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col no-print" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-slate-800">{t('purchasing.modal.detailsTitle')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-8 overflow-y-auto" dangerouslySetInnerHTML={{ __html: contentRef.current?.innerHTML || '' }} />
                <div className="p-4 bg-slate-50 border-t flex justify-end items-center space-x-4">
                    <button onClick={handleExportPdf} className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors">
                        <IconPdf className="h-5 w-5"/>
                        <span>{t('common.exportPdf')}</span>
                    </button>
                    <button onClick={handlePrint} className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors">
                        <IconPrint className="h-5 w-5"/>
                        <span>{t('common.print')}</span>
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