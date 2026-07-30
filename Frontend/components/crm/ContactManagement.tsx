import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Contact, Opportunity, Interaction, CrmTask, User, ContactStatus, Contract, ContractStatus } from '../../types';
import { useI18n } from '../../i18n';
import { getContactsPaginated } from '../../services/apiCrm/apiCrm';
import IconPlus from '../icons/IconPlus';
import IconEye from '../icons/IconEye';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import ContactDetailsModal from './ContactDetailsModal';
import ContactFormModal from './ContactFormModal';
import ContactAccountActions from './ContactAccountActions';
import ConfirmationModal from '../common/ConfirmationModal';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';
import Pagination from '../common/Pagination';
import { LockIcon, MailIcon } from 'lucide-react';

const CONTACTS_PAGE_SIZE = 10;

interface ContactManagementProps {
    subsidiaryId: string;
    filterSubsidiaryId?: string;
    filterSalesRepId?: string;
    opportunities: Opportunity[];
    interactions: Interaction[];
    crmTasks: CrmTask[];
    contracts: Contract[];
    onLogInteraction: (data: Omit<Interaction, 'id' | 'date' | 'userId'>) => void;
    onSave: (data: Omit<Contact, 'id' | 'subsidiaryId'> & { id?: string }) => Promise<{ tempPassword?: string; message?: string } | void>;
    onDelete: (id: string) => void;
    onResetPassword?: (contactId: string) => Promise<{ tempPassword: string; message: string }>;
    onEnablePortal?: (contactId: string) => Promise<{ tempPassword: string; message: string }>;
}

const ContactManagement: React.FC<ContactManagementProps> = ({
    subsidiaryId,
    filterSubsidiaryId,
    filterSalesRepId,
    opportunities = [],
    interactions = [],
    crmTasks = [],
    contracts = [],
    onLogInteraction,
    onSave,
    onDelete,
    onResetPassword,
    onEnablePortal
}) => {
    const { t } = useI18n();
    const [selectedClient, setSelectedClient] = useState<Contact | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
    const [accountActionsContact, setAccountActionsContact] = useState<Contact | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [filterSubsidiaryId, filterSalesRepId]);

    const { data: paginatedContacts, isLoading } = useQuery({
        // Le préfixe ['contacts', subsidiaryId] doit rester aligné avec
        // queryKey('contacts') dans Pages/Crm.tsx pour que l'invalidation des
        // mutations (create/update/delete) déclenche aussi le refetch ici.
        queryKey: ['contacts', subsidiaryId, 'paginated', page, filterSubsidiaryId, filterSalesRepId],
        queryFn: () =>
            getContactsPaginated({
                page,
                limit: CONTACTS_PAGE_SIZE,
                subsidiaryId: filterSubsidiaryId,
                salesRepId: filterSalesRepId,
            }),
    });

    const clients = paginatedContacts?.data || [];
    const meta = paginatedContacts?.meta;


    const handleOpenAddModal = () => {
        setEditingContact(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (contact: Contact) => {
        setEditingContact(contact);
        setIsFormModalOpen(true);
    };
    
    const handleOpenDeleteModal = (contact: Contact) => {
        setDeletingContact(contact);
    };

    const handleCloseModals = () => {
        setIsFormModalOpen(false);
        setDeletingContact(null);
        setSelectedClient(null);
        setAccountActionsContact(null);
    };

    const handleSaveContact = async (data: Omit<Contact, 'id' | 'subsidiaryId'> & { id?: string }) => {
        const result = await onSave({ id: editingContact?.id, ...data});
        handleCloseModals();
        return result;
    };

    const handleDeleteContact = () => {
        if(deletingContact) {
            onDelete(deletingContact.id);
            handleCloseModals();
        }
    }

    const handleOpenAccountActions = (contact: Contact) => {
        setAccountActionsContact(contact);
    };


    const getStatusClass = (status?: ContactStatus) => {
        switch (status) {
            case ContactStatus.ACTIVE: return 'bg-green-100 text-green-800';
            case ContactStatus.INACTIVE: return 'bg-gray-100 text-gray-800';
            case ContactStatus.PROSPECT: return 'bg-blue-100 text-blue-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('crm.contacts.title')}</h3>
                <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                    <IconPlus className="h-4 w-4" />
                    <span>{t('crm.contacts.add')}</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('crm.contacts.contact')}</th>
                            <th scope="col" className="px-6 py-3">{t('crm.contacts.company')}</th>
                            <th scope="col" className="px-6 py-3">{t('crm.contacts.email')}</th>
                            <th scope="col" className="px-6 py-3">{t('crm.contacts.status')}</th>
                            <th scope="col" className="px-6 py-3 text-center">Compte</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('crm.contacts.contracts')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <TableSkeleton rows={CONTACTS_PAGE_SIZE} columns={7} />
                        ) : clients.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <EmptyState icon="document" title={t('crm.contacts.title')} description={t('common.notAvailable')} />
                                </td>
                            </tr>
                        ) : clients.map((client) => {
                            const contractCount = contracts.filter(c => c.clientId === client.id && c.status === ContractStatus.ACTIVE).length;
                            const hasAccount = !!client.password;
                            return (
                                <tr key={client.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-semibold">{client.contactName}</td>
                                    <td className="px-6 py-4">{client.company}</td>
                                    <td className="px-6 py-4">{client.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(client.status)}`}>
                                            {client.status ? t(`crm.contacts.statuses.${client.status}`) : t('common.notAvailable')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {hasAccount ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <LockIcon className="w-3 h-3 mr-1" />
                                                Activé
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                <LockIcon className="w-3 h-3 mr-1" />
                                                Non activé
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {contractCount}
                                    </td>
                                    <td className="px-6 py-4 text-center space-x-1">
                                        <button onClick={() => setSelectedClient(client)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.view')}>
                                            <IconEye className="h-5 w-5" />
                                        </button>
                                        {(onResetPassword || onEnablePortal) && (
                                            <button 
                                                onClick={() => handleOpenAccountActions(client)} 
                                                className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-100 rounded-full transition-colors" 
                                                aria-label="Gérer le compte"
                                            >
                                                <LockIcon className="h-5 w-5" />
                                            </button>
                                        )}
                                        <button onClick={() => handleOpenEditModal(client)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.edit')}>
                                            <IconEdit className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleOpenDeleteModal(client)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={t('common.delete')}>
                                            <IconDelete className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            {meta && <Pagination meta={meta} onPageChange={setPage} />}
            {selectedClient && (
                <ContactDetailsModal 
                    isOpen={!!selectedClient}
                    onClose={() => setSelectedClient(null)}
                    client={selectedClient}
                    opportunities={opportunities.filter(o => o.contactId === selectedClient.id)}
                    interactions={interactions.filter(i => i.contactId === selectedClient.id)}
                    tasks={crmTasks.filter(t => t.contactId === selectedClient.id)}
                    contracts={contracts.filter(c => c.clientId === selectedClient.id)}
                    onLogInteraction={onLogInteraction}
                />
            )}
            {isFormModalOpen && (
                <ContactFormModal 
                    isOpen={isFormModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSaveContact}
                    contact={editingContact}
                    isCreating={!editingContact}
                />
            )}
            {accountActionsContact && (
                <ContactAccountActions
                    contact={accountActionsContact}
                    onResetPassword={onResetPassword || (() => Promise.reject('Non implémenté'))}
                    onEnablePortal={onEnablePortal || (() => Promise.reject('Non implémenté'))}
                />
            )}
             {deletingContact && (
                <ConfirmationModal
                    isOpen={!!deletingContact}
                    onClose={handleCloseModals}
                    onConfirm={handleDeleteContact}
                    title={t('configuration.modal.deleteClientTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: deletingContact.contactName })}
                />
            )}
        </div>
    );
};

export default ContactManagement;
