import React, { useState } from 'react';
import { Lead, LeadStatus, User } from '../../types';
import { useI18n } from '../../i18n';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import IconCheckCircle from '../icons/IconCheckCircle';
import LeadFormModal from './LeadFormModal';
import ConfirmationModal from '../common/ConfirmationModal';

interface LeadsManagementProps {
    leads: Lead[];
    onSave: (data: Omit<Lead, 'id' | 'subsidiaryId'> & { id?: string }) => void;
    onDelete: (id: string) => void;
    onConvertLead: (leadId: string) => void;
}

const LeadsManagement: React.FC<LeadsManagementProps> = ({ leads, onSave, onDelete, onConvertLead }) => {
    const { t } = useI18n();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [deletingLead, setDeletingLead] = useState<Lead | null>(null);

    const handleOpenAddModal = () => {
        setEditingLead(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (lead: Lead) => {
        setEditingLead(lead);
        setIsFormModalOpen(true);
    };

    const handleOpenDeleteModal = (lead: Lead) => {
        setDeletingLead(lead);
    };

    const handleCloseModals = () => {
        setIsFormModalOpen(false);
        setDeletingLead(null);
    };

    const handleSave = (data: Omit<Lead, 'id' | 'subsidiaryId'>) => {
        onSave({ id: editingLead?.id, ...data });
        handleCloseModals();
    };

    const handleDelete = () => {
        if (deletingLead) {
            onDelete(deletingLead.id);
            handleCloseModals();
        }
    };

    const getStatusClass = (status: LeadStatus) => {
        switch (status) {
            case LeadStatus.NEW: return 'bg-blue-100 text-blue-800';
            case LeadStatus.CONTACTED: return 'bg-yellow-100 text-yellow-800';
            case LeadStatus.QUALIFIED: return 'bg-green-100 text-green-800';
            case LeadStatus.LOST: return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('crm.leads.title')}</h3>
                <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                    <IconPlus className="h-4 w-4" />
                    <span>{t('crm.leads.add')}</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('crm.leads.name')}</th>
                            <th scope="col" className="px-6 py-3">{t('crm.leads.company')}</th>
                            <th scope="col" className="px-6 py-3">{t('crm.leads.email')}</th>
                            <th scope="col" className="px-6 py-3">{t('crm.leads.phone')}</th>
                            <th scope="col" className="px-6 py-3">{t('crm.leads.status')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map((lead) => (
                            <tr key={lead.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-semibold">{lead.leadName}</td>
                                <td className="px-6 py-4">{lead.company}</td>
                                <td className="px-6 py-4">{lead.email}</td>
                                <td className="px-6 py-4">{lead.phone}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(lead.status)}`}>
                                        {t(`crm.leads.status_${lead.status}`)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center space-x-1">
                                    {lead.status === LeadStatus.QUALIFIED && (
                                        <button
                                            onClick={() => onConvertLead(lead.id)}
                                            className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                                            title={t('crm.leads.convert')}
                                        >
                                            <IconCheckCircle className="h-5 w-5" />
                                        </button>
                                    )}

                                    <button onClick={() => handleOpenEditModal(lead)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.edit')}>
                                        <IconEdit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleOpenDeleteModal(lead)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={t('common.delete')}>
                                        <IconDelete className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormModalOpen && (
                <LeadFormModal 
                    isOpen={isFormModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSave}
                    lead={editingLead}
                />
            )}
             {deletingLead && (
                <ConfirmationModal
                    isOpen={!!deletingLead}
                    onClose={handleCloseModals}
                    onConfirm={handleDelete}
                    title={t('crm.leads.modal.deleteTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: deletingLead.leadName })}
                />
            )}
        </div>
    );
};

export default LeadsManagement;