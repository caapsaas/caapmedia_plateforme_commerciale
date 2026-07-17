import React from 'react';
import { Order, Subsidiary } from '../types';
import { useI18n } from '../i18n';
import IconPrint from '../components/icons/IconPrint';
import IconPdf from '../components/icons/IconPdf';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


interface BonDeCommandeProps {
    order: Order;
    subsidiary: Subsidiary;
    onClose: () => void;
}

const BonDeCommande: React.FC<BonDeCommandeProps> = ({ order, subsidiary, onClose }) => {
    const { t, formatCurrency, language } = useI18n();
    const LogoComponent = subsidiary.logo;
    const bcContentRef = React.useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const handleExportPdf = () => {
        if (!bcContentRef.current) return;

        html2canvas(bcContentRef.current, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`bon_de_commande_${order.id}.pdf`);
        });
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bc-title"
        >
            {/* Wrapper for printable content */}
            <div className="printable-area absolute top-0 left-0 -z-10 w-full bg-white">
                <div ref={bcContentRef} className="p-8 bg-white">
                    {/* Header avec logo et titre */}
                    <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-[#c6e911]">
                        <div>
                            {LogoComponent && <LogoComponent className="h-20 w-auto" />}
                            <p className="font-bold text-lg mt-2 text-slate-800">{subsidiary.name}</p>
                            {subsidiary.address && <p className="text-sm text-slate-600">{subsidiary.address}</p>}
                            {subsidiary.phone && <p className="text-sm text-slate-600">{t('common.phone')}: {subsidiary.phone}</p>}
                            {subsidiary.email && <p className="text-sm text-slate-600">{t('common.email')}: {subsidiary.email}</p>}
                        </div>
                        <div className="text-right">
                            <h2 className="font-bold text-2xl text-[#c6e911] mb-2">BON DE COMMANDE</h2>
                            <p className="text-slate-700 font-semibold">{t('bonDeCommande.orderNum', 'Commande N°')} <span className="font-bold text-lg">{order.id.substring(0, 12)}</span></p>
                            <p className="text-slate-600">{t('bonDeCommande.date', 'Date')}: {new Date(order.date).toLocaleDateString(language)}</p>
                            <p className="text-slate-600 mt-2 text-sm font-semibold">
                                {order.status === 'PENDING_VALIDATION' ? (
                                    <span className="text-yellow-600">En attente de validation</span>
                                ) : (
                                    <span className="text-green-600">Validée</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h5 className="font-semibold text-slate-500 uppercase text-xs mb-2">{t('bonDeCommande.billedTo', 'Commandé par')}</h5>
                            <p className="font-bold text-lg text-slate-800">{order.customerName}</p>
                        </div>
                        <div>
                            <h5 className="font-semibold text-slate-500 uppercase text-xs mb-2">{t('bonDeCommande.paymentMethod', 'Mode de paiement')}</h5>
                            <p className="font-semibold text-slate-800">{order.paymentMethod}</p>
                            {order.paymentDueDate && (
                                <p className="text-slate-600 text-sm mt-1">
                                    {t('bonDeCommande.dueDate', 'Échéance')}: {new Date(order.paymentDueDate).toLocaleDateString(language)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-x-auto mb-8">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-[#c6e911] bg-opacity-20 border-t-2 border-b-2 border-[#c6e911]">
                                <tr>
                                    <th scope="col" className="px-6 py-3">{t('bonDeCommande.item', 'Produit')}</th>
                                    <th scope="col" className="px-6 py-3 text-center">{t('bonDeCommande.quantity', 'Quantité')}</th>
                                    <th scope="col" className="px-6 py-3 text-right">{t('bonDeCommande.unitPrice', 'Prix unitaire')}</th>
                                    <th scope="col" className="px-6 py-3 text-right">{t('bonDeCommande.totalPrice', 'Total')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.orderItems?.map((item: any, index: number) => (
                                    <tr key={index} className="bg-white border-b border-slate-200">
                                        <td className="px-6 py-4 font-medium text-slate-900">{item.product?.productName || item.productName || 'Produit inconnu'}</td>
                                        <td className="px-6 py-4 text-center text-slate-800">{item.quantity}</td>
                                        <td className="px-6 py-4 text-right text-slate-800">{formatCurrency(item.unitPrice)}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-900">{formatCurrency(item.unitPrice * item.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold text-slate-800 bg-[#c6e911] bg-opacity-10 border-t-2 border-[#c6e911]">
                                    <td colSpan={3} className="px-6 py-4 text-right text-lg">{t('bonDeCommande.total', 'TOTAL')}</td>
                                    <td className="px-6 py-4 text-right text-lg text-[#c6e911] font-bold">{formatCurrency(order.totalAmount)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Footer info */}
                    <div className="border-t-2 border-slate-200 pt-6">
                        <p className="text-xs text-slate-500 text-center">
                            Merci de votre confiance. Cette commande est valide jusqu'au {new Date(order.paymentDueDate).toLocaleDateString(language)}.
                        </p>
                        <p className="text-xs text-slate-400 text-center mt-2">
                            {t('bonDeCommande.footer', 'CaapMedia Plateforme Commerciale')}
                        </p>
                    </div>
                </div>
            </div>

             {/* Modal container */}
            <div
                className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col no-print"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 id="bc-title" className="text-2xl font-bold text-slate-800">Bon de Commande</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-8 overflow-y-auto" dangerouslySetInnerHTML={{ __html: bcContentRef.current?.innerHTML || '' }} />

                <div className="p-4 bg-slate-50 border-t flex justify-end items-center space-x-4">
                     <button
                        onClick={handleExportPdf}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors"
                    >
                        <IconPdf className="h-5 w-5"/>
                        <span>{t('bonDeCommande.exportPdf', 'Exporter PDF')}</span>
                    </button>
                     <button
                        onClick={handlePrint}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors"
                    >
                        <IconPrint className="h-5 w-5"/>
                        <span>{t('bonDeCommande.print', 'Imprimer')}</span>
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

export default BonDeCommande;
