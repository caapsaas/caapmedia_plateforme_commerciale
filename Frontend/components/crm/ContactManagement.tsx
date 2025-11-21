import React, { useState } from 'react';
import { Contact, Opportunity, Interaction, CrmTask, User, ContactStatus, Contract, ContractStatus } from '../../types';
import { useI18n } from '../../i18n';
import IconPlus from '../icons/IconPlus';
import IconEye from '../icons/IconEye';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import ContactDetailsModal from './ContactDetailsModal';
import ContactFormModal from './ContactFormModal';
import ConfirmationModal from '../common/ConfirmationModal';

interface ContactManagementProps {
    clients: Contact[];
    opportunities: Opportunity[];
    interactions: Interaction[];
    crmTasks: CrmTask[];
    contracts: Contract[];
    onLogInteraction: (data: Omit<Interaction, 'id' | 'date' | 'userId'>) => void;
    onSave: (data: Omit<Contact, 'id' | 'subsidiaryId'> & { id?: string }) => void;
    onDelete: (id: string) => void;
}

const ContactManagement: React.FC<ContactManagementProps> = ({ 
    clients = [], 
    opportunities = [], 
    interactions = [], 
    crmTasks = [], 
    contracts = [], 
    onLogInteraction, 
    onSave, 
    onDelete }) => {
    const { t } = useI18n();
    const [selectedClient, setSelectedClient] = useState<Contact | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [deletingContact, setDeletingContact] = useState<Contact | null>(null);


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
    };

    const handleSaveContact = (data: Omit<Contact, 'id' | 'subsidiaryId'> & { id?: string }) => {
        onSave({ id: editingContact?.id, ...data});
        handleCloseModals();
    };

    const handleDeleteContact = () => {
        if(deletingContact) {
            onDelete(deletingContact.id);
            handleCloseModals();
        }
    }


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
                            <th scope="col" className="px-6 py-3 text-center">{t('crm.contacts.contracts')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map((client) => {
                            const contractCount = contracts.filter(c => c.clientId === client.id && c.status === ContractStatus.ACTIVE).length;
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
                                        {contractCount}
                                    </td>
                                    <td className="px-6 py-4 text-center space-x-1">
                                        <button onClick={() => setSelectedClient(client)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.view')}>
                                            <IconEye className="h-5 w-5" />
                                        </button>
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
