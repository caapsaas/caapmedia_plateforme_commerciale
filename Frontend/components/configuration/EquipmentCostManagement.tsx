import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipmentCosts, upsertEquipmentCost, EquipmentWithCost } from '../../services/apiProduction/apiProduction';
import { getSubsidiaries } from '../../services/apiCommon/apiSubsidiaries';
import { Subsidiary, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import TableSkeleton from '../ui/TableSkeleton';
import EmptyState from '../ui/EmptyState';

const EquipmentCostManagement: React.FC = () => {
    const { user } = useAuth();
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const activeRole = user?.activeRole ?? user?.userRole;
    const isSuperAdmin = activeRole === UserRole.SUPER_ADMIN;

    const [filterSubsidiaryId, setFilterSubsidiaryId] = useState<string>('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingRate, setEditingRate] = useState<string>('');
    const [error, setError] = useState<string>('');

    const { data: subsidiaries = [] } = useQuery<Subsidiary[]>({
        queryKey: ['subsidiaries'],
        queryFn: getSubsidiaries,
        enabled: isSuperAdmin,
    });

    const { data: equipments = [], isLoading } = useQuery<EquipmentWithCost[]>({
        queryKey: ['equipment-costs', filterSubsidiaryId],
        queryFn: () => getEquipmentCosts(filterSubsidiaryId || undefined),
    });

    const { mutate: saveCost, isPending } = useMutation({
        mutationFn: upsertEquipmentCost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment-costs'] });
            setEditingId(null);
            setEditingRate('');
        },
        onError: () => setError(t('production.equipmentCosts.saveError')),
    });

    const handleSave = (equipmentId: string) => {
        const rate = parseFloat(editingRate);
        if (isNaN(rate) || rate < 0) { setError(t('production.equipmentCosts.invalidRate')); return; }
        setError('');
        saveCost({ equipmentId, hourlyRate: rate });
    };

    const startEdit = (eq: EquipmentWithCost) => {
        setEditingId(eq.id);
        setEditingRate(eq.hourlyRate != null ? String(eq.hourlyRate) : '');
        setError('');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">{t('production.equipmentCosts.title')}</h3>
                    <p className="text-sm text-slate-500">{t('production.equipmentCosts.subtitle')}</p>
                </div>
                {isSuperAdmin && (
                    <select
                        value={filterSubsidiaryId}
                        onChange={(e) => setFilterSubsidiaryId(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                    >
                        <option value="">{t('production.equipmentCosts.allSubsidiaries')}</option>
                        {subsidiaries.map(s => (
                            <option key={s.id} value={s.id}>{s.subsidiaryName}</option>
                        ))}
                    </select>
                )}
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th className="px-4 py-3">{t('production.equipmentCosts.colMachine')}</th>
                                <th className="px-4 py-3">{t('production.equipmentCosts.colStatus')}</th>
                                {isSuperAdmin && <th className="px-4 py-3">{t('production.equipmentCosts.colSubsidiary')}</th>}
                                <th className="px-4 py-3 text-right">{t('production.equipmentCosts.colHourlyRate')}</th>
                                <th className="px-4 py-3 text-right">{t('production.equipmentCosts.colAction')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                <TableSkeleton rows={5} columns={isSuperAdmin ? 5 : 4} />
                            ) : equipments.map(eq => (
                                <tr key={eq.id} className="bg-white hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-800">{eq.equipmentName}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            eq.status === 'OPERATIONAL' ? 'bg-green-100 text-green-700' :
                                            eq.status === 'UNDER_MAINTENANCE' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>{t(`equipements.status_${eq.status}`)}</span>
                                    </td>
                                    {isSuperAdmin && (
                                        <td className="px-4 py-3 text-slate-500 text-xs">
                                            {subsidiaries.find(s => s.id === eq.subsidiaryId)?.subsidiaryName ?? eq.subsidiaryId}
                                        </td>
                                    )}
                                    <td className="px-4 py-3 text-right">
                                        {editingId === eq.id ? (
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={editingRate}
                                                onChange={(e) => setEditingRate(e.target.value)}
                                                className="w-28 px-2 py-1 border border-slate-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className={eq.hourlyRate != null ? 'font-semibold text-slate-800' : 'text-slate-400 italic'}>
                                                {eq.hourlyRate != null
                                                    ? `${Number(eq.hourlyRate).toLocaleString('fr-FR')} F/h`
                                                    : t('production.equipmentCosts.notConfigured')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {editingId === eq.id ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleSave(eq.id)}
                                                    disabled={isPending}
                                                    className="px-3 py-1 text-xs font-semibold bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] disabled:opacity-50"
                                                >
                                                    {isPending ? t('common.saving') : t('common.save')}
                                                </button>
                                                <button
                                                    onClick={() => { setEditingId(null); setError(''); }}
                                                    className="px-3 py-1 text-xs font-semibold bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300"
                                                >
                                                    {t('common.cancel')}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => startEdit(eq)}
                                                className="px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200"
                                            >
                                                {eq.hourlyRate != null
                                                    ? t('production.equipmentCosts.modify')
                                                    : t('production.equipmentCosts.configure')}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && equipments.length === 0 && (
                                <tr>
                                    <td colSpan={isSuperAdmin ? 5 : 4}>
                                        <EmptyState icon="stock" title={t('production.equipmentCosts.noEquipment')} />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
        </div>
    );
};

export default EquipmentCostManagement;
