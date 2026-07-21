import React, { useState } from 'react';
import { Subsidiary, PurchaseOrder, PurchaseOrderStatus, PaymentStatus, StockItem, Supplier } from '../../types/models';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { getPurchaseOrders, createPurchaseOrder, receivePurchaseOrderItems, recordPurchaseOrderPayment } from '../../services/apiPurchasing/apiPurchase_order';
import { getSuppliers } from '../../services/apiPurchasing/apiSupplier';
import { getStockItemsBySubsidiary } from '../../services/apiPurchasing/apiStockItems';
import { CreatePurchaseOrderDto, ReceiveItemsDto } from '../../services/apiPurchasing/apiPurchase_order';
import IconPlus from '../icons/IconPlus';
import IconEye from '../icons/IconEye';
import IconCheck from '../icons/IconCheck';
import IconDelete from '../icons/IconDelete';
import PurchaseOrderFormModal from './PurchaseOrderFormModal';
import PurchaseOrderDetailsModal from './PurchaseOrderDetailsModal';
import ConfirmationModal from '../common/ConfirmationModal';
import ReceiveItemsModal from './ReceiveItemsModal';
import RecordPaymentModal from './RecordPaymentModal';
import IconCoins from '../icons/IconCoins';
import { useAuth } from '../../context/AuthContext';

const Purchasing: React.FC = () => {
    const { t, formatCurrency } = useI18n();
    const toast = useToast();
    const { subsidiary } = useAuth();
    const queryClient = useQueryClient();
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

    // --- TanStack Query: Data Fetching ---
    const { data: purchaseOrders = [], isLoading: isLoadingPOs } = useQuery<PurchaseOrder[]>({
        queryKey: ['purchaseOrders', subsidiary?.id],
        queryFn: () => getPurchaseOrders(),
        enabled: !!subsidiary,
    });

    const { data: stockItems = [], isLoading: isLoadingStockItems } = useQuery<StockItem[]>({
        queryKey: ['stockItems', subsidiary?.id],
        queryFn: () => getStockItemsBySubsidiary(),
        enabled: !!subsidiary,
    });

    const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery<Supplier[]>({
        queryKey: ['suppliers', subsidiary?.id],
        queryFn: () => getSuppliers(),
        enabled: !!subsidiary,
    });

    // --- TanStack Query: Mutations ---
    const { mutate: createPurchaseOrderMutate } = useMutation({
        mutationFn: createPurchaseOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            toast.success('Commande créée!', 'La commande d\'achat a été créée avec succès.');
        },
        onError: () => {
            toast.error('Erreur de création', 'Une erreur est survenue lors de la création de la commande.');
        }
    });
    const { mutate: receiveItemsMutate } = useMutation({
        mutationFn: ({ id, data }: { id: string, data: ReceiveItemsDto }) => receivePurchaseOrderItems(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            toast.success('Articles reçus!', 'Les articles ont été reçus avec succès.');
        },
        onError: () => {
            toast.error('Erreur de réception', 'Une erreur est survenue lors de la réception des articles.');
        }
    });
    const { mutate: recordPaymentMutate } = useMutation({
        mutationFn: ({ id, data }: { id: string, data: { amount: number } }) => recordPurchaseOrderPayment(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            toast.success('Paiement enregistré!', 'Le paiement a été enregistré avec succès.');
        },
        onError: () => {
            toast.error('Erreur de paiement', 'Une erreur est survenue lors de l\'enregistrement du paiement.');
        }
    });

    const handleOpenAddModal = () => {
        setSelectedPO(null);
        setIsFormModalOpen(true);
    };

    const handleOpenViewModal = (po: PurchaseOrder) => {
        setSelectedPO(po);
        setIsDetailsModalOpen(true);
    };

    const handleOpenReceiveModal = (po: PurchaseOrder) => {
        setSelectedPO(po);
        setIsReceiveModalOpen(true);
    };

    const handleOpenPaymentModal = (po: PurchaseOrder) => {
        setSelectedPO(po);
        setIsPaymentModalOpen(true);
    };
    
    const handleCloseModals = () => {
        setIsFormModalOpen(false);
        setIsDetailsModalOpen(false);
        setIsReceiveModalOpen(false);
        setIsPaymentModalOpen(false);
        setSelectedPO(null);
    };

    const getStatusClass = (status: PurchaseOrderStatus) => {
        switch (status) {
            case PurchaseOrderStatus.DRAFT: return 'bg-gray-100 text-gray-800';
            case PurchaseOrderStatus.ORDERED: return 'bg-blue-100 text-blue-800';
            case PurchaseOrderStatus.PARTIALLY_RECEIVED: return 'bg-yellow-100 text-yellow-800';
            case PurchaseOrderStatus.RECEIVED: return 'bg-green-100 text-green-800';
            case PurchaseOrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };
    
     const getPaymentStatusClass = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.UNPAID: return 'bg-red-100 text-red-800';
            case PaymentStatus.PARTIALLY_PAID: return 'bg-yellow-100 text-yellow-800';
            case PaymentStatus.PAID: return 'bg-green-100 text-green-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    if (!subsidiary || isLoadingPOs || isLoadingStockItems || isLoadingSuppliers) {
        return <div>{t('common.loading')}</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">{t('purchasing.title')}</h2>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">{t('purchasing.title')}</h3>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                            <IconPlus className="h-4 w-4" />
                            <span>{t('purchasing.newOrder')}</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('purchasing.poNumber')}</th>
                                <th scope="col" className="px-6 py-3">{t('purchasing.supplier')}</th>
                                <th scope="col" className="px-6 py-3">{t('purchasing.orderDate')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('purchasing.total')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('purchasing.status')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('purchasing.paymentStatus.title')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchaseOrders.map(po => (
                                <tr key={po.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-semibold">{po.id}</td>
                                    <td className="px-6 py-4">{po.supplierName}</td>
                                    <td className="px-6 py-4">{po.orderDate.split("T")[0]}</td>
                                    <td className="px-6 py-4 text-right font-bold">{formatCurrency(po.totalAmount)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(po.status)}`}>
                                            {t(`purchasing.status_${po.status}`)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                         <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusClass(po.paymentStatus)}`}>
                                            {t(`purchasing.paymentStatus.${po.paymentStatus}`)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center space-x-1">
                                        {(po.status === PurchaseOrderStatus.ORDERED || po.status === PurchaseOrderStatus.PARTIALLY_RECEIVED) && (
                                            <button onClick={() => handleOpenReceiveModal(po)} className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors" title={t('purchasing.receiveOrder')}>
                                                <IconCheck className="h-5 w-5" />
                                            </button>
                                        )}
                                        {po.paymentStatus !== PaymentStatus.PAID && po.status !== PurchaseOrderStatus.DRAFT && (
                                            <button onClick={() => handleOpenPaymentModal(po)} className="p-2 text-orange-500 hover:bg-orange-100 rounded-full transition-colors" title={t('purchasing.recordPayment')}>
                                                <IconCoins className="h-5 w-5" />
                                            </button>
                                        )}
                                        <button onClick={() => handleOpenViewModal(po)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors" title={t('purchasing.viewOrder')}>
                                            <IconEye className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isFormModalOpen && (
                <PurchaseOrderFormModal 
                    isOpen={isFormModalOpen}
                    onClose={handleCloseModals}
                    onSave={(data: CreatePurchaseOrderDto) => createPurchaseOrderMutate(data)}
                    stockItems={stockItems}
                    suppliers={suppliers}
                />
            )}

            {isDetailsModalOpen && selectedPO && (
                <PurchaseOrderDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={handleCloseModals}
                    purchaseOrder={selectedPO}
                    subsidiary={subsidiary}
                />
            )}
            
            {isReceiveModalOpen && selectedPO && (
                <ReceiveItemsModal
                    isOpen={isReceiveModalOpen}
                    onClose={handleCloseModals}
                    purchaseOrder={selectedPO}
                    onReceive={(poId, items) => receiveItemsMutate({ id: poId, data: { items } })}
                />
            )}

            {isPaymentModalOpen && selectedPO && (
                <RecordPaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={handleCloseModals}
                    purchaseOrder={selectedPO}
                    onRecordPayment={(poId, amount) => recordPaymentMutate({ id: poId, data: { amount } })}
                />
            )}

        </div>
    );
};

export default Purchasing;