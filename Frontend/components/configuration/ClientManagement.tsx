import React, { useState } from 'react';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import { Contact } from '../../types';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import ClientFormModal from './ClientFormModal';
import ConfirmationModal from '../common/ConfirmationModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getContacts, saveContact, deleteContact } from '../../services/apiCrm/apiCrm';


const ClientManagement: React.FC = () => {
    const { t } = useI18n();
    const toast = useToast();
    const { subsidiary } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

    // --- Data Fetching & Mutations ---
    const { data: contacts = [], isLoading, isError } = useQuery<Contact[]>({
        queryKey: ['contacts', subsidiary?.id],
        queryFn: () => getContacts(subsidiary!.id),
        enabled: !!subsidiary,
    });

    const { mutate: onSave } = useMutation<Contact, Error, Omit<Contact, 'id'> & { id?: string }>({ 
        mutationFn: saveContact, 
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['contacts', subsidiary?.id] });
            const action = variables.id ? 'modifié' : 'ajouté';
            toast.success('Client sauvegardé!', `Le client a été ${action} avec succès.`);
            handleCloseModals();
        },
        onError: () => {
            toast.error('Erreur de sauvegarde', 'Une erreur est survenue lors de la sauvegarde du client.');
        }
    });
    const { mutate: onDelete } = useMutation<void, Error, string>({ 
        mutationFn: deleteContact, 
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts', subsidiary?.id] });
            toast.success('Client supprimé!', 'Le client a été supprimé avec succès.');
            handleCloseModals();
        },
        onError: () => {
            toast.error('Erreur de suppression', 'Une erreur est survenue lors de la suppression du client.');
        }
    });

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
        onSave({ ...contactData, subsidiaryId: subsidiary!.id });
    };

    const handleDeleteContact = () => {
        if (deletingContact) {
            onDelete(deletingContact.id);
        }
    };

    if (!subsidiary) return <div className="p-6 text-center">{t('common.loading')}</div>;

    if (isLoading) {
        return <div className="p-6 text-center">{t('common.loading')}</div>;
    }

    if (isError) {
        return <div className="p-6 text-center text-red-500">Erreur lors du chargement des clients.</div>;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('configuration.clientManagement')}</h3>
                <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
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
                                <td className="px-6 py-4 font-semibold">{contact.contactName}</td>
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
                    message={t('configuration.modal.deleteConfirmMessage', {itemName: deletingContact.contactName})}
                />
            )}
        </div>
    );
};

export default ClientManagement;