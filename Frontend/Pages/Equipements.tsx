import React, { useState } from 'react';
import { Subsidiary, Equipment, EquipmentStatus } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipments, saveEquipment, deleteEquipment, SaveEquipmentDto } from '../services/apiMaintenance';
import { useI18n } from '../i18n';
import IconPlus from '../components/icons/IconPlus';
import IconEdit from '../components/icons/IconEdit';
import IconDelete from '../components/icons/IconDelete';
import EquipmentFormModal from '../components/maintenance/EquipmentFormModal';
import ConfirmationModal from '../components/common/ConfirmationModal';

interface EquipementsProps {
    subsidiary: Subsidiary;
}

const Equipements: React.FC<EquipementsProps> = ({ subsidiary }) => {
    const { t, formatCurrency } = useI18n();
    const queryClient = useQueryClient();

    const { data: equipment = [], isLoading } = useQuery({ 
        queryKey: ['equipment', subsidiary.id], 
        queryFn: () => getEquipments(subsidiary.id) 
    });
    const { mutate: saveMutation } = useMutation({ mutationFn: saveEquipment, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipment'] }) });
    const { mutate: deleteMutation } = useMutation({ mutationFn: deleteEquipment, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipment'] }) });
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
    const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null);
    
    const totalAcquisitionValue = equipment.reduce((acc, item) => acc + item.acquisitionValue, 0);

    const handleOpenAddModal = () => {
        setEditingEquipment(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (item: Equipment) => {
        setEditingEquipment(item);
        setIsFormModalOpen(true);
    };

    const handleOpenDeleteModal = (item: Equipment) => {
        setDeletingEquipment(item);
    };

    const handleCloseModals = () => {
        setIsFormModalOpen(false);
        setDeletingEquipment(null);
    };

    const handleSave = (data: SaveEquipmentDto) => {
        saveMutation(data);
        handleCloseModals();
    };

    const handleDelete = () => {
        if (deletingEquipment) {
            deleteMutation(deletingEquipment.id);
            handleCloseModals();
        }
    };

    const getStatusClass = (status: EquipmentStatus) => {
        switch (status) {
            case EquipmentStatus.OPERATIONAL: return 'bg-green-100 text-green-800';
            case EquipmentStatus.NEEDS_MAINTENANCE: return 'bg-yellow-100 text-yellow-800';
            case EquipmentStatus.OUT_OF_SERVICE: return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    if (isLoading) {
        return <div className="p-6 text-center">{t('common.loading')}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-slate-800">{t('equipements.title')}</h2>
                <div className="text-right"><div className="text-sm text-slate-500">Valeur totale</div><div className="text-2xl font-bold">{formatCurrency(totalAcquisitionValue)}</div></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-slate-800">{t('equipements.listTitle')}</h3>
                     <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                        <IconPlus className="h-4 w-4" />
                        <span>{t('maintenance.addEquipment')}</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('maintenance.equipmentName')}</th>
                                <th scope="col" className="px-6 py-3">{t('equipements.acquisitionDate')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('equipements.acquisitionValue')}</th>
                                <th scope="col" className="px-6 py-3">{t('maintenance.status')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipment.map((item) => (
                                <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-semibold">{item.name}</td>
                                    <td className="px-6 py-4">{item.acquisitionDate}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{formatCurrency(item.acquisitionValue)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(item.status)}`}>
                                            {t(`maintenance.status_${item.status}`)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center space-x-1">
                                        <button onClick={() => handleOpenEditModal(item)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full" title={t('common.edit')}>
                                            <IconEdit className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleOpenDeleteModal(item)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full" title={t('common.delete')}>
                                            <IconDelete className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isFormModalOpen && (
                <EquipmentFormModal
                    isOpen={isFormModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSave}
                    equipment={editingEquipment}
                />
            )}
             {deletingEquipment && (
                <ConfirmationModal
                    isOpen={!!deletingEquipment}
                    onClose={handleCloseModals}
                    onConfirm={handleDelete}
                    title={t('maintenance.modal.deleteTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: deletingEquipment.name })}
                />
            )}
        </div>
    );
};

export default Equipements;
