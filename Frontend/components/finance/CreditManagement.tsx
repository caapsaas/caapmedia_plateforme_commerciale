import React, { useMemo, useState } from 'react';
import { Subsidiary, CreditAccount } from '../../types';
import { getCustomerReceivables, CustomerReceivablesStats } from '../../services/apiStatistic/apiFinanceStats';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';
import IconCash from '../icons/IconCash';
import IconEye from '../icons/IconEye';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, recordOrderPayment } from '../../services/apiE-commerce/apiOrders';
import { getPublicContact } from '../../services/apiCrm/apicontacts';
import { getContactById } from '../../services/apiCrm/apicontacts';
import { CustomerPaymentMethod, Order, PaymentStatus, Contact } from '../../types';
import KpiCard from '../../Pages/KpiCard';
import IconCreditCard from '../icons/IconCreditCard';
import CreditDetailsModal from './CreditDetailsModal';
import CreditPaymentModal from './CreditPaymentModal';

interface CreditManagementProps {
    subsidiary: Subsidiary;
}


const CreditManagement: React.FC<CreditManagementProps> = ({ subsidiary }) => {
    const { t, formatCurrency } = useI18n();
    const toast = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // 1. Récupération des commandes avec statuts UNPAID et PARTIALLY_PAID
    const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({ 
        queryKey: ['orders', 'unpaid'], 
        queryFn: () => getOrders({
            paymentStatus: PaymentStatus.UNPAID
        }).then(orders1 => 
            getOrders({
                paymentStatus: PaymentStatus.PARTIALLY_PAID
            }).then(orders2 => [...orders1, ...orders2])
        )
    });

    // 2. Récupération des informations clients pour obtenir les noms de société
    const { data: clients = {} } = useQuery<Record<string, Contact>>({
        queryKey: ['clients'],
        queryFn: async () => {
            const uniqueCustomerIds = [...new Set(orders.map(order => order.customerId))];
            const clientsData: Record<string, Contact> = {};
            
            await Promise.all(
                uniqueCustomerIds.map(async (customerId) => {
                    try {
                        const client = await getPublicContact(customerId);
                        clientsData[customerId] = client;
                    } catch (error) {
                        console.warn(`Impossible de récupérer le client ${customerId}:`, error);
                    }
                })
            );
            
            return clientsData;
        },
        enabled: orders.length > 0
    });

    // 3. Transformation des commandes en format de crédit pour l'affichage
    const transformedCredits = useMemo(() => {
        return orders.map(order => {
            const client = clients[order.customerId];
            return {
                id: order.orderId,
                clientName: order.customerName,
                companyName: client?.company || '',
                balance: order.totalAmount - order.amountPaid, // Solde restant dû
                lastPaymentDate: order.paymentStatus === PaymentStatus.PARTIALLY_PAID ? order.paymentDueDate : '', // Date d'échéance pour partiellement payées
                orderDate: order.date, // Date de la commande
                paymentDueDate: order.paymentDueDate, // Date d'échéance de paiement
                subsidiaryId: order.subsidiaryId,
                originalOrder: order // Conserver la commande originale pour les actions
            };
        });
    }, [orders, clients]);

    // 4. Filtrage pour la barre de recherche
    const filteredCredits = useMemo(() => {
        // On ne montre que les crédits avec un solde > 0
        const activeCredits = transformedCredits.filter(c => Math.round(c.balance) > 0);
        const lowercasedTerm = searchTerm.toLowerCase();
        if (!lowercasedTerm) return activeCredits;
        return activeCredits.filter(credit => 
            credit.clientName.toLowerCase().includes(lowercasedTerm) ||
            (credit.companyName && credit.companyName.toLowerCase().includes(lowercasedTerm))
        );
    }, [transformedCredits, searchTerm]);

    // Calcul du total des dettes clients à partir des commandes filtrées
    const totalCustomerDebts = useMemo(() => {
        return filteredCredits.reduce((total, credit) => {
            const balance = Number(credit.balance) || 0;
            return total + balance;
        }, 0);
    }, [filteredCredits]);

    const { data: totalReceivablesData = { totalReceivables: 0 }, isLoading: isLoadingReceivable } = useQuery<CustomerReceivablesStats>({
        queryKey: ['totalReceivables'],
        queryFn: () => getCustomerReceivables({
            period: 'ALL_TIME',
        })
    });

    const handlePrint = () => {
        window.print();
        toast.info('Impression lancée', 'La page est en cours d\'impression.');
    };

    const handleExport = () => {
        try {
            const headers = [
                { key: 'clientName', label: t('credit.customerName') },
                { key: 'companyName', label: t('credit.company') },
                { key: 'balance', label: t('credit.balanceDue') },
                { key: 'lastPaymentDate', label: t('credit.lastPaymentDate') },
            ];
            exportToCsv('comptes_credits', headers, filteredCredits);
            toast.success('Export CSV réussi!', 'Les données ont été exportées au format CSV.');
        } catch (error) {
            toast.error('Erreur d\'export', 'Une erreur est survenue lors de l\'export CSV.');
        }
    };

    const handleExportPdf = () => {
        try {
            const headers = [
                { key: 'clientName', label: t('credit.customerName') },
                { key: 'companyName', label: t('credit.company') },
                { key: 'lastPaymentDate', label: t('credit.lastPaymentDate') },
                { key: 'balance', label: t('credit.balanceDue') },
            ];
            const data = filteredCredits.map(d => ({ ...d, balance: formatCurrency(d.balance) }));
            exportToPdf(t('credit.customerCreditTracking'), headers, data, 'credits_clients');
            toast.success('Export PDF réussi!', 'Les données ont été exportées au format PDF.');
        } catch (error) {
            toast.error('Erreur d\'export', 'Une erreur est survenue lors de l\'export PDF.');
        }
    };

    const handleViewDetails = (account: any) => {
        // Créer un objet compatible avec CreditAccount pour le modal
        const creditAccount: CreditAccount = {
            id: account.originalOrder.orderId,
            clientName: account.clientName,
            companyName: account.companyName,
            balance: account.balance,
            lastPaymentDate: account.lastPaymentDate,
            subsidiaryId: account.subsidiaryId,
            // Ajouter les propriétés attendues par le modal
            ...(account.originalOrder.customerId && { contactId: account.originalOrder.customerId })
        } as CreditAccount;
        
        setSelectedAccount(creditAccount);
        setIsDetailsModalOpen(true);
    };

    const handleRecordPayment = (account: any) => {
        // Créer un objet compatible avec CreditAccount pour le modal
        const creditAccount: CreditAccount = {
            id: account.originalOrder.orderId,
            clientName: account.clientName,
            companyName: account.companyName,
            balance: account.balance,
            lastPaymentDate: account.lastPaymentDate,
            subsidiaryId: account.subsidiaryId,
            // Ajouter les propriétés attendues par le modal
            ...(account.originalOrder.customerId && { contactId: account.originalOrder.customerId })
        } as CreditAccount;
        
        setSelectedAccount(creditAccount);
        setIsPaymentModalOpen(true);
    };

    // Mutation pour enregistrer un paiement
    const { mutate: recordPaymentMutate } = useMutation({
        mutationFn: ({ orderId, amount, paymentMethod }: { orderId: string; amount: number; paymentMethod: CustomerPaymentMethod }) => 
            recordOrderPayment({ orderId, amount, paymentMethod }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders', 'unpaid'] });
            toast.success('Paiement enregistré!', 'Le paiement a été enregistré avec succès.');
            setIsPaymentModalOpen(false);
        },
        onError: () => {
            toast.error('Erreur de paiement', 'Une erreur est survenue lors de l\'enregistrement du paiement.');
        }
    });

    const handlePaymentSubmit = (orderId: string, amount: number, paymentMethod: CustomerPaymentMethod) => {
        recordPaymentMutate({ orderId, amount, paymentMethod });
    };

    const kpiData = {
        titleKey: 'credit.totalReceivables',
        value: formatCurrency(isNaN(totalCustomerDebts) ? 0 : totalCustomerDebts),
        change: '', // Ajout de la propriété 'change' manquante
        icon: <IconCreditCard className="h-6 w-6 text-slate-500" />,
        changeType: 'increase' as const,
        descriptionKey: 'credit.totalReceivablesDesc'
    };

    if (isLoadingReceivable || isLoadingOrders) {
        return <div className="p-6 text-center">{t('common.loading')}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
                <KpiCard {...kpiData} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">{t('credit.customerCreditTracking')}</h3>
                  
                    <div className="flex flex-wrap gap-2 no-print">
                        <button onClick={handlePrint} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                            <IconPrint className="h-4 w-4" />
                            <span>{t('common.print')}</span>
                        </button>
                        <button onClick={handleExport} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                            <IconExport className="h-4 w-4" />
                            <span>{t('common.export')}</span>
                        </button>
                        <button onClick={handleExportPdf} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                            <IconPdf className="h-4 w-4" />
                            <span>{t('common.exportPdf')}</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('credit.customerName')}</th>
                                <th scope="col" className="px-6 py-3">{t('credit.company')}</th>
                                <th scope="col" className="px-6 py-3">{t('credit.lastPaymentDate')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('credit.balanceDue')}</th>
                                <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCredits.length > 0 ? (
                                filteredCredits.map((account) => (
                                    <tr key={`credit-${account.id}-${account.clientName}`} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{account.clientName}</td>
                                        <td className="px-6 py-4">{account.companyName}</td>
                                        <td className="px-6 py-4">{account.lastPaymentDate ? new Date(account.lastPaymentDate).toLocaleDateString('fr-FR') : t('common.notAvailable')}</td>
                                        <td className="px-6 py-4 text-right font-bold text-red-600">{formatCurrency(account.balance)}</td>
                                        <td className="px-6 py-4 text-center no-print">
                                            <button onClick={() => handleViewDetails(account)} className="font-medium text-[#c6e911] hover:text-[#adc40f] mr-4"><IconEye className="h-4 w-4" /></button>
                                            <button onClick={() => handleRecordPayment(account)} className="font-medium text-green-600 hover:text-green-800"><IconCash className="h-4 w-4" /></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr key="no-credits-row">
                                    <td colSpan={5} className="text-center py-8 text-slate-500">
                                        {searchTerm ? "Aucun crédit ne correspond à votre recherche." : "Aucun crédit client en cours."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {isDetailsModalOpen && selectedAccount && (
                <CreditDetailsModal 
                    isOpen={isDetailsModalOpen} 
                    onClose={() => setIsDetailsModalOpen(false)} 
                    account={selectedAccount} 
                />
            )}
            {isPaymentModalOpen && selectedAccount && (
                <CreditPaymentModal 
                    isOpen={isPaymentModalOpen} 
                    onClose={() => setIsPaymentModalOpen(false)} 
                    account={selectedAccount} 
                />
            )}
        </div>
    );
};

export default CreditManagement;