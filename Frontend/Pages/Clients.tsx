import React, { useState } from 'react';
import { Contact, Subsidiary } from '../types';
import IconPlus from '../components/icons/IconPlus';
import IconEdit from '../components/icons/IconEdit';
import IconDelete from '../components/icons/IconDelete';
import { useI18n } from '../i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ClientFormModal from '../components/configuration/ClientFormModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { exportToCsv } from '../utils/csvExporter';
import { exportToPdf } from '../utils/pdfExporter';
import IconPrint from '../components/icons/IconPrint';
import IconExport from '../components/icons/IconExport';
import IconPdf from '../components/icons/IconPdf';
import { getContacts, saveContact, deleteContact } from '../services/apiCrm/apiCrm';

interface ClientsProps {
    subsidiary: Subsidiary;
}

const Clients: React.FC<ClientsProps> = ({ subsidiary }) => {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

    const queryKey = ['contacts', subsidiary.id];

    // --- Data Fetching ---
    const { data: contacts = [], isLoading } = useQuery({
        queryKey: queryKey,
        queryFn: () => getContacts(subsidiary.id)
    });

    // --- Mutations ---
    const { mutate: saveMutation } = useMutation({ mutationFn: saveContact, onSuccess: () => queryClient.invalidateQueries({ queryKey }) });
    const { mutate: deleteMutation } = useMutation({ mutationFn: deleteContact, onSuccess: () => queryClient.invalidateQueries({ queryKey }) });

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
        saveMutation({ ...contactData, id: editingContact?.id });
        handleCloseModals();
    };

    const handleDeleteContact = () => {
        if (deletingContact) {
            deleteMutation(deletingContact.id);
            handleCloseModals();
        }
    };

    const handlePrint = () => window.print();

    const handleExport = () => {
        const headers = [
            { key: 'id', label: t('clients.customerId') },
            { key: 'name', label: t('clients.name') },
            { key: 'company', label: t('clients.company') },
            { key: 'email', label: t('clients.email') },
            { key: 'phone', label: t('clients.phone') },
            { key: 'since', label: t('clients.customerSince') },
        ];
        exportToCsv('liste_clients', headers, contacts);
    };

    const handleExportPdf = () => {
        const headers = [
            { key: 'name', label: t('clients.name') },
            { key: 'company', label: t('clients.company') },
            { key: 'email', label: t('clients.email') },
            { key: 'phone', label: t('clients.phone') },
        ];
        exportToPdf(t('clients.listTitle'), headers, contacts, 'clients');
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">{t('clients.title')}</h2>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">{t('clients.listTitle')}</h3>
                    <div className="flex space-x-2 no-print">
                        <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                            <IconPlus className="h-4 w-4" />
                            <span>{t('clients.addCustomer')}</span>
                        </button>
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
                {isLoading && (
                    <div className="text-center p-4">{t('common.loading')}</div>
                )}
                {!isLoading && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('clients.customerId')}</th>
                                <th scope="col" className="px-6 py-3">{t('clients.name')}</th>
                                <th scope="col" className="px-6 py-3">{t('clients.company')}</th>
                                <th scope="col" className="px-6 py-3">{t('clients.email')}</th>
                                <th scope="col" className="px-6 py-3">{t('clients.phone')}</th>
                                <th scope="col" className="px-6 py-3">{t('clients.customerSince')}</th>
                                <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.map((contact) => (
                                <tr key={contact.id} className="bg-white border-b hover:bg-slate-50">
                                    <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{contact.id}</th>
                                    <td className="px-6 py-4">{contact.contactName}</td>
                                    <td className="px-6 py-4">{contact.company}</td>
                                    <td className="px-6 py-4">{contact.email}</td>
                                    <td className="px-6 py-4">{contact.phone}</td>
                                    <td className="px-6 py-4">{contact.since}</td>
                                    <td className="px-6 py-4 text-center space-x-2 no-print">
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
                )}
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
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: deletingContact.contactName })}
                />
            )}
        </div>
    );
};

export default Clients;