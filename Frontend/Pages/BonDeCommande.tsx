import React from 'react';
import { Order, Subsidiary, OrderItem } from '../types';
import { useI18n } from '../i18n';
import IconPrint from '../components/icons/IconPrint';
import IconPdf from '../components/icons/IconPdf';
import DocumentHeader from '../components/common/DocumentHeader';
import DocumentTable from '../components/common/DocumentTable';
import DocumentFooter from '../components/common/DocumentFooter';
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

    // Contenu du document réutilisable
    const DocumentContent = () => (
        <div>
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b-4 border-[#c6e911]">
                <DocumentHeader subsidiary={subsidiary} showContactIcons={false} />
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

            {/* Table */}
            <DocumentTable
                title={t('bonDeCommande.items')}
                columns={[
                    { label: t('bonDeCommande.item'), key: 'productName', align: 'left' },
                    { label: t('bonDeCommande.quantity'), key: 'quantity', align: 'center' },
                    { label: t('bonDeCommande.unitPrice'), key: 'unitPrice', align: 'right', formatter: (v) => formatCurrency(v) },
                    { label: t('bonDeCommande.totalPrice'), key: 'total', align: 'right', formatter: (v) => formatCurrency(v) }
                ]}
                data={order.orderItems?.map((item: OrderItem) => ({
                    productName: item.product.productName || '—',
                    quantity: item.quantity,
                    unitPrice: item.price,
                    total: item.price * item.quantity
                })) || []}
                totalRow={{
                    label: t('bonDeCommande.total'),
                    value: formatCurrency(order.totalAmount || 0),
                    isHighlighted: true
                }}
                emptyMessage={t('bonDeCommande.noData')}
            />

            {/* Footer */}
            <DocumentFooter
                message={`${t('bonDeCommande.footer')} ${order.paymentDueDate ? formatDate(order.paymentDueDate) : ''}.`}
                showSignature={true}
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
            {/* Wrapper for printable content */}
            <div className="printable-area absolute top-0 left-0 -z-10 w-full bg-white">
                <div ref={bcContentRef} className="p-12 bg-white" style={{ minHeight: '100vh' }}>
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
                <div className="p-8 overflow-y-auto flex-1 bg-white">
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
