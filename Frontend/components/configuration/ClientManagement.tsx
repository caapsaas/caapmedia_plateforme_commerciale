import React, { useState } from 'react';
import { MOCK_CONTACTS } from '../../constants';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import { Subsidiary, Contact } from '../../types';
import { useI18n } from '../../i18n';
import ClientFormModal from './ClientFormModal';
import ConfirmationModal from '../common/ConfirmationModal';

interface ClientManagementProps {
    subsidiary: Subsidiary;
}

const ClientManagement: React.FC<ClientManagementProps> = ({ subsidiary }) => {
    const { t } = useI18n();
    const [contacts, setContacts] = useState(MOCK_CONTACTS.filter(c => c.subsidiaryId === subsidiary.id));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

    const handleOpenAddModal = () => {
        setEditingContact(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (contact: Contact) => {
        setEditingContact(contact);
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (contact: Contact) => {
        setDeletingContact(contact);
    };

    const handleCloseModals = () => {
        setIsModalOpen(false);
        setDeletingContact(null);
        setEditingContact(null);
    };

    const handleSaveContact = (contactData: Omit<Contact, 'id' | 'subsidiaryId'> & { id?: string }) => {
        if (editingContact) {
            setContacts(contacts.map(c => c.id === editingContact.id ? { ...editingContact, ...contactData } : c));
        } else {
            const newContact: Contact = {
                ...contactData,
                id: `C${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}${Date.now() % 100}`,
                subsidiaryId: subsidiary.id,
                since: contactData.since || new Date().toISOString().split('T')[0],
            };
            setContacts([newContact, ...contacts]);
        }
        handleCloseModals();
    };

    const handleDeleteContact = () => {
        if (deletingContact) {
            setContacts(contacts.filter(c => c.id !== deletingContact.id));
            handleCloseModals();
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('configuration.clientManagement')}</h3>
                <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#F7941F] text-white text-sm font-semibold rounded-md hover:bg-[#dd861c] transition-colors">
                    <IconPlus className="h-4 w-4" />
                    <span>{t('configuration.addClient')}</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('configuration.productId')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.name')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.company')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.email')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.phone')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map((contact) => (
                            <tr key={contact.id} className="bg-white border-b hover:bg-slate-50">
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{contact.id}</th>
                                <td className="px-6 py-4 font-semibold">{contact.name}</td>
                                <td className="px-6 py-4">{contact.company}</td>
                                <td className="px-6 py-4">{contact.email}</td>
                                <td className="px-6 py-4">{contact.phone}</td>
                                <td className="px-6 py-4 text-center space-x-2">
                                    <button onClick={() => handleOpenEditModal(contact)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.edit')}>
                                        <IconEdit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleOpenDeleteModal(contact)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={t('common.delete')}>
                                        <IconDelete className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             {isModalOpen && (
                <ClientFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSaveContact}
                    client={editingContact}
                />
            )}
            {deletingContact && (
                 <ConfirmationModal
                    isOpen={!!deletingContact}
                    onClose={handleCloseModals}
                    onConfirm={handleDeleteContact}
                    title={t('configuration.modal.deleteClientTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', {itemName: deletingContact.name})}
                />
            )}
        </div>
    );
};

export default ClientManagement;