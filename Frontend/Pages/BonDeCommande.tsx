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

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            return date.toLocaleDateString(language, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateString || 'N/A';
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bc-title"
        >
            {/* Wrapper for printable content */}
            <div className="printable-area absolute top-0 left-0 -z-10 w-full bg-white">
                <div ref={bcContentRef} className="p-12 bg-white" style={{ minHeight: '100vh' }}>
                    {/* Header avec logo et titre */}
                    <div className="flex justify-between items-start mb-8 pb-6 border-b-4 border-[#c6e911]">
                        <div>
                            {LogoComponent && <LogoComponent className="h-16 w-auto" />}
                            <p className="font-bold text-xl mt-4 text-slate-900">{subsidiary.name}</p>
                            {subsidiary.address && <p className="text-sm text-slate-600 mt-1">{subsidiary.address}</p>}
                            {subsidiary.phone && <p className="text-sm text-slate-600">{t('common.phone')}: {subsidiary.phone}</p>}
                            {subsidiary.email && <p className="text-sm text-slate-600">{t('common.email')}: {subsidiary.email}</p>}
                        </div>
                        <div className="text-right">
                            <h2 className="font-bold text-3xl text-[#c6e911] mb-4">{t('bonDeCommande.title')}</h2>
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

                    {/* Items Table */}
                    <div className="mb-10">
                        <h3 className="font-semibold text-slate-700 uppercase text-xs tracking-wide mb-4">{t('bonDeCommande.items', 'Détail de la commande')}</h3>
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-[#c6e911] bg-opacity-25 border-t-2 border-b-2 border-[#c6e911]">
                                <tr>
                                    <th scope="col" className="px-6 py-4 font-bold">{t('bonDeCommande.item')}</th>
                                    <th scope="col" className="px-6 py-4 text-center font-bold">{t('bonDeCommande.quantity')}</th>
                                    <th scope="col" className="px-6 py-4 text-right font-bold">{t('bonDeCommande.unitPrice')}</th>
                                    <th scope="col" className="px-6 py-4 text-right font-bold">{t('bonDeCommande.totalPrice')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.orderItems && order.orderItems.length > 0 ? (
                                    order.orderItems.map((item: any, index: number) => (
                                        <tr key={index} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-900">{item.product?.productName || item.productName || '—'}</td>
                                            <td className="px-6 py-4 text-center text-slate-800">{item.quantity || 0}</td>
                                            <td className="px-6 py-4 text-right text-slate-800">{formatCurrency(item.unitPrice || 0)}</td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-900">{formatCurrency((item.unitPrice || 0) * (item.quantity || 0))}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="bg-white border-b border-slate-100">
                                        <td colSpan={4} className="px-6 py-4 text-center text-slate-500">{t('bonDeCommande.noData')}</td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold text-slate-900 bg-[#c6e911] bg-opacity-15 border-t-2 border-[#c6e911]">
                                    <td colSpan={3} className="px-6 py-4 text-right text-base">{t('bonDeCommande.total')}:</td>
                                    <td className="px-6 py-4 text-right text-lg text-[#c6e911] font-bold">{formatCurrency(order.totalAmount || 0)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Footer info */}
                    <div className="border-t-4 border-[#c6e911] pt-8 mt-8">
                        <p className="text-sm text-slate-600 text-center leading-relaxed">
                            {t('bonDeCommande.footer')} {order.paymentDueDate && formatDate(order.paymentDueDate)}.
                        </p>
                        <p className="text-xs text-slate-400 text-center mt-6">
                            ___________________________________________________________
                        </p>
                        <p className="text-xs text-slate-400 text-center mt-2">
                            CaapMedia Plateforme Commerciale
                        </p>
                    </div>
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
                <div className="p-8 overflow-y-auto flex-1 bg-white">
                    {bcContentRef.current && (
                        <div>
                            {/* Re-render the document content */}
                            <div className="flex justify-between items-start mb-8 pb-6 border-b-4 border-[#c6e911]">
                                <div>
                                    {LogoComponent && <LogoComponent className="h-16 w-auto" />}
                                    <p className="font-bold text-xl mt-4 text-slate-900">{subsidiary.name}</p>
                                    {subsidiary.address && <p className="text-sm text-slate-600 mt-1">{subsidiary.address}</p>}
                                    {subsidiary.phone && <p className="text-sm text-slate-600">{t('common.phone')}: {subsidiary.phone}</p>}
                                    {subsidiary.email && <p className="text-sm text-slate-600">{t('common.email')}: {subsidiary.email}</p>}
                                </div>
                                <div className="text-right">
                                    <h2 className="font-bold text-3xl text-[#c6e911] mb-4">{t('bonDeCommande.title')}</h2>
                                    <div className="space-y-2 text-sm">
                                        <p className="text-slate-700 font-semibold">{t('bonDeCommande.orderNum')}: <span className="font-bold text-base text-[#c6e911]">{order.id}</span></p>
                                        <p className="text-slate-600">{t('bonDeCommande.date')}: <span className="font-semibold text-slate-800">{formatDate(order.date)}</span></p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-12 mb-10">
                                <div>
                                    <h5 className="font-semibold text-slate-600 uppercase text-xs tracking-wide mb-3 border-b pb-2">{t('bonDeCommande.billedTo')}</h5>
                                    <p className="font-bold text-lg text-slate-900">{order.customerName}</p>
                                </div>
                                <div>
                                    <h5 className="font-semibold text-slate-600 uppercase text-xs tracking-wide mb-3 border-b pb-2">{t('bonDeCommande.paymentMethod')}</h5>
                                    <p className="font-semibold text-slate-800">{order.paymentMethod || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="mb-10">
                                <table className="w-full text-sm text-left text-slate-600">
                                    <thead className="text-xs text-slate-700 uppercase bg-[#c6e911] bg-opacity-25 border-t-2 border-b-2 border-[#c6e911]">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 font-bold">{t('bonDeCommande.item')}</th>
                                            <th scope="col" className="px-6 py-4 text-center font-bold">{t('bonDeCommande.quantity')}</th>
                                            <th scope="col" className="px-6 py-4 text-right font-bold">{t('bonDeCommande.unitPrice')}</th>
                                            <th scope="col" className="px-6 py-4 text-right font-bold">{t('bonDeCommande.totalPrice')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.orderItems && order.orderItems.length > 0 ? (
                                            order.orderItems.map((item: any, index: number) => (
                                                <tr key={index} className="bg-white border-b border-slate-100">
                                                    <td className="px-6 py-4 font-medium text-slate-900">{item.product?.productName || item.productName || '—'}</td>
                                                    <td className="px-6 py-4 text-center text-slate-800">{item.quantity || 0}</td>
                                                    <td className="px-6 py-4 text-right text-slate-800">{formatCurrency(item.unitPrice || 0)}</td>
                                                    <td className="px-6 py-4 text-right font-semibold text-slate-900">{formatCurrency((item.unitPrice || 0) * (item.quantity || 0))}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr className="bg-white border-b border-slate-100">
                                                <td colSpan={4} className="px-6 py-4 text-center text-slate-500">{t('bonDeCommande.noData')}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-bold text-slate-900 bg-[#c6e911] bg-opacity-15 border-t-2 border-[#c6e911]">
                                            <td colSpan={3} className="px-6 py-4 text-right text-base">{t('bonDeCommande.total')}:</td>
                                            <td className="px-6 py-4 text-right text-lg text-[#c6e911] font-bold">{formatCurrency(order.totalAmount || 0)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
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
                        className="flex items-center space-x-2 px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all shadow-md hover:shadow-lg"
                    >
                        <IconPrint className="h-5 w-5"/>
                        <span>{t('bonDeCommande.print')}</span>
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
