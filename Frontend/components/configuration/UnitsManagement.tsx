import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Unit } from '../../types/models';
import { getUnits, createUnit, updateUnit, deleteUnit } from '../../services/apiPurchasing/apiUnits';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../i18n';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';

// Référentiel d'unités de mesure (Chantier 2) — administré une seule fois,
// réutilisé comme unité de base ou unité d'emballage sur chaque produit de
// stock (voir StockItemFormModal).
const UnitsManagement: React.FC = () => {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const toast = useToast();

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');

    const { data: units = [], isLoading } = useQuery<Unit[]>({
        queryKey: ['units'],
        queryFn: getUnits,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['units'] });

    const createMutation = useMutation({
        mutationFn: createUnit,
        onSuccess: () => { invalidate(); resetForm(); },
        onError: () => toast.error('Erreur', t('configuration.unitsManagement.createError')),
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name: string; symbol?: string } }) => updateUnit(id, data),
        onSuccess: () => { invalidate(); resetForm(); },
    });
    const deleteMutation = useMutation({
        mutationFn: deleteUnit,
        onSuccess: invalidate,
        onError: () => toast.error('Erreur', t('configuration.unitsManagement.deleteError')),
    });

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setName('');
        setSymbol('');
    };

    const handleStartEdit = (unit: Unit) => {
        setEditingId(unit.id);
        setName(unit.name);
        setSymbol(unit.symbol || '');
        setIsAdding(false);
    };

    const handleSubmit = () => {
        if (!name.trim()) return;
        const data = { name: name.trim(), symbol: symbol.trim() || undefined };
        if (editingId) {
            updateMutation.mutate({ id: editingId, data });
        } else {
            createMutation.mutate(data);
        }
    };

    if (isLoading) return <div>{t('common.loading')}</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-slate-800">{t('configuration.unitsManagement.title')}</h3>
                    <p className="text-sm text-slate-500">{t('configuration.unitsManagement.subtitle')}</p>
                </div>
                <button onClick={() => { setIsAdding(true); setEditingId(null); setName(''); setSymbol(''); }} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                    <IconPlus className="h-4 w-4" />
                    <span>{t('configuration.unitsManagement.addNew')}</span>
                </button>
            </div>

            {(isAdding || editingId) && (
                <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                        <label className="block text-xs font-medium text-slate-600">{t('configuration.unitsManagement.name')}</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder={t('configuration.unitsManagement.namePlaceholder')} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600">{t('configuration.unitsManagement.symbol')}</label>
                        <input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder={t('configuration.unitsManagement.symbolPlaceholder')} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border text-sm" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSubmit} className="px-3 py-2 bg-[#c6e911] text-slate-800 rounded-md text-sm hover:bg-[#adc40f]">{editingId ? t('configuration.unitsManagement.save') : t('configuration.unitsManagement.create')}</button>
                        <button onClick={resetForm} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-md text-sm hover:bg-slate-200">{t('configuration.unitsManagement.cancel')}</button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('configuration.unitsManagement.name')}</th>
                            <th scope="col" className="px-6 py-3">{t('configuration.unitsManagement.symbol')}</th>
                            <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {units.map(unit => (
                            <tr key={unit.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-semibold">{unit.name}</td>
                                <td className="px-6 py-4">{unit.symbol || '-'}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center space-x-1">
                                        <button onClick={() => handleStartEdit(unit)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.edit')}>
                                            <IconEdit className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => deleteMutation.mutate(unit.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={t('common.delete')}>
                                            <IconDelete className="h-5 w-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {units.length === 0 && (
                            <tr><td colSpan={3} className="px-6 py-4 text-center text-slate-400 italic">{t('configuration.unitsManagement.empty')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UnitsManagement;
