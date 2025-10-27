
import React, { useState } from 'react';
import { TaxRate } from '../../types';
import { useI18n } from '../../i18n';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import ConfirmationModal from '../common/ConfirmationModal';
import TaxFormModal from './TaxFormModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTaxes, createTax, updateTax, deleteTax } from '../../services/apiE-commerce/apitaxes';

const TaxManagement: React.FC = () => {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState<TaxRate | null>(null);
    const [deletingTax, setDeletingTax] = useState<TaxRate | null>(null);

    const { data: taxRates = [], isLoading, isError } = useQuery<TaxRate[]>({
        queryKey: ['taxes'],
        queryFn: getTaxes,
    });

    const { mutate: saveTaxMutate } = useMutation({
        mutationFn: (taxData: Omit<TaxRate, 'id'> & { id?: string }) => 
            taxData.id ? updateTax(taxData.id, taxData) : createTax(taxData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taxes'] });
            handleCloseModals();
        },
    });

    const { mutate: deleteTaxMutate } = useMutation({
        mutationFn: deleteTax,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taxes'] });
            handleCloseModals();
        },
    });

    const handleOpenAddModal = () => {
        setEditingTax(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (tax: TaxRate) => {
        setEditingTax(tax);
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (tax: TaxRate) => {
        setDeletingTax(tax);
    };

    const handleCloseModals = () => {
        setIsModalOpen(false);
        setDeletingTax(null);
        setEditingTax(null);
    };
    
    const handleSave = (taxData: Omit<TaxRate, 'id'> & { id?: string }) => {
        saveTaxMutate(taxData);
    };

    const handleDelete = () => {
        if (deletingTax) {
            deleteTaxMutate(deletingTax.id);
        }
    };

    if (isLoading) {
        return <div>{t('common.loading')}</div>;
    }

    if (isError) {
        return <div>{t('common.error.load', { item: 'taxes' })}</div>;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('configuration.taxManagement')}</h3>
                <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                    <IconPlus className="h-4 w-4" />
                    <span>{t('configuration.addTax')}</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('configuration.form.name')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.form.rate')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.form.isDefault')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {taxRates.map((tax) => (
                            <tr key={tax.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-semibold">{tax.taxRatesName}</td>
                                <td className="px-6 py-4">{(tax.rate * 100).toFixed(2)}%</td>
                                <td className="px-6 py-4">{tax.isDefault ? 'Oui' : 'Non'}</td>
                                <td className="px-6 py-4 text-center space-x-2">
                                    <button onClick={() => handleOpenEditModal(tax)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"><IconEdit className="h-5 w-5" /></button>
                                    {!tax.isDefault && <button onClick={() => handleOpenDeleteModal(tax)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"><IconDelete className="h-5 w-5" /></button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <TaxFormModal 
                    isOpen={isModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSave}
                    taxRate={editingTax}
                />
            )}
            {deletingTax && (
                <ConfirmationModal
                    isOpen={!!deletingTax}
                    onClose={handleCloseModals}
                    onConfirm={handleDelete}
                    title={t('configuration.modal.deleteTaxTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: deletingTax.taxRatesName })}
                />
            )}
        </div>
    );
};

export default TaxManagement;
