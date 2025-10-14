import React from 'react';
import { Order, Subsidiary, Contact } from '../types';
import { useI18n } from '../i18n';
import IconPrint from '../components/icons/IconPrint';
import IconPdf from '../components/icons/IconPdf';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoiceModalProps {
    isOpen: boolean;
    order: Order;
    subsidiary: Subsidiary;
    client: Contact;
    onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, order, subsidiary, client, onClose }) => {
    const { t, formatCurrency, language } = useI18n();
    const LogoComponent = subsidiary.logo;
    const invoiceContentRef = React.useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const handleExportPdf = () => {
        if (!invoiceContentRef.current) return;
        
        html2canvas(invoiceContentRef.current, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`facture_${order.id}.pdf`);
        });
    };

    const InvoiceContent = () => (
        <div className="p-8 bg-white text-sm" ref={invoiceContentRef}>
            <div className="grid grid-cols-2 items-start mb-10">
                <div>
                    <LogoComponent className="h-20 w-auto" />
                    <div className="mt-4 text-slate-700">
                        <p className="font-bold text-base">{subsidiary.name}</p>
                        <p>{subsidiary.address}</p>
                        <p>{t('invoice.phone')}: {subsidiary.phone}</p>
                        <p>{t('invoice.email')}: {subsidiary.email}</p>
                        <p>{t('invoice.ifu')}: {subsidiary.ifu}</p>
                        <p>{t('invoice.rccm')}: {subsidiary.rccm}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold uppercase text-slate-800">{t('invoice.title')}</h2>
                    <p className="text-slate-600 mt-2">{t('invoice.invoiceNum')} <span className="font-semibold">{order.id}</span></p>
                    <p className="text-slate-600">{t('invoice.date')}: {new Date(order.date).toLocaleDateString(language)}</p>
                    <p className="text-slate-600">{t('invoice.paymentDueDate')}: <span className="font-semibold">{new Date(order.paymentDueDate).toLocaleDateString(language)}</span></p>
                </div>
            </div>
            
            <div className="mb-10 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-500 uppercase text-xs mb-1">{t('invoice.billedTo')}</h3>
                <p className="font-bold text-slate-800">{client.name}</p>
                <p className="text-slate-600">{client.company}</p>
                <p className="text-slate-600">{client.address}</p>
                <p className="text-slate-600">{client.phone}</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('invoice.item')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('invoice.quantity')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('invoice.unitPrice')}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t('invoice.totalPrice')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item, index) => (
                            <tr key={index} className="bg-white border-b">
                                <td className="px-6 py-4 font-medium text-slate-900">{item.product.name}</td>
                                <td className="px-6 py-4 text-center">{item.quantity}</td>
                                <td className="px-6 py-4 text-right">{formatCurrency(item.price)}</td>
                                <td className="px-6 py-4 text-right font-semibold">{formatCurrency(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

             <div className="flex justify-end mt-4">
                <div className="w-full max-w-xs">
                    <div className="flex justify-between py-1">
                        <span className="text-slate-600">{t('invoice.subtotal')}:</span>
                        <span className="font-medium text-slate-800">{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span className="text-slate-600">{t('invoice.tax')} (18%):</span>
                        <span className="font-medium text-slate-800">{formatCurrency(order.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t-2 border-slate-300 mt-2">
                        <span className="font-bold text-lg text-slate-900">{t('invoice.totalTTC')}:</span>
                        <span className="font-bold text-lg text-slate-900">{formatCurrency(order.totalAmount)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-10 pt-4 border-t border-slate-200 text-slate-600">
                <h4 className="font-semibold mb-2">{t('invoice.paymentInfo')}</h4>
                <p>Banque: {subsidiary.bankDetails.bankName}</p>
                <p>N° de compte: {subsidiary.bankDetails.accountNumber}</p>
                <p>Code SWIFT: {subsidiary.bankDetails.swift}</p>
            </div>

            <div className="mt-8 text-center text-xs text-slate-400">
                <p>Merci de votre confiance.</p>
                <p>{subsidiary.name} - Tous droits réservés.</p>
            </div>
        </div>
    );

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-title"
        >
            <div className="printable-area absolute top-0 left-0 -z-10 w-full bg-white">
                <InvoiceContent />
            </div>

            <div 
                className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col no-print"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 id="invoice-title" className="text-2xl font-bold text-slate-800">{t('invoice.title')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-8 overflow-y-auto" dangerouslySetInnerHTML={{ __html: invoiceContentRef.current?.innerHTML || '' }} />
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
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors"
                    >
                        <IconPrint className="h-5 w-5"/>
                        <span>{t('common.print')}</span>
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