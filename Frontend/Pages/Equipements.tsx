import React, { useState, useMemo } from 'react';
import { Equipment, EquipmentStatus, Subsidiary, UserRole } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getEquipments,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    CreateEquipmentDto,
} from '../services/apiMaintenance/apiEquipment';
import { getSubsidiaries } from '../services/apiCommon/apiSubsidiaries';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import IconPlus from '../components/icons/IconPlus';
import IconEdit from '../components/icons/IconEdit';
import IconDelete from '../components/icons/IconDelete';
import EquipmentFormModal from '../components/maintenance/EquipmentFormModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import EmptyState from '../components/ui/EmptyState';

type SaveEquipmentDto = CreateEquipmentDto & { id?: string };

const STATUS_BADGE: Record<EquipmentStatus, string> = {
    [EquipmentStatus.OPERATIONAL]: 'bg-green-100 text-green-700',
    [EquipmentStatus.NEEDS_MAINTENANCE]: 'bg-amber-100 text-amber-700',
    [EquipmentStatus.OUT_OF_SERVICE]: 'bg-red-100 text-red-700',
};

const KpiCard: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color }) => (
    <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${color ?? 'text-slate-800'}`}>{value}</p>
    </div>
);

const Equipements: React.FC = () => {
    const { t, formatCurrency } = useI18n();
    const toast = useToast();
    const { subsidiary, user } = useAuth();
    const queryClient = useQueryClient();

    // activeRole prime sur userRole (apercu de role SUPER_ADMIN, voir Purchasing.tsx pour le meme correctif).
    const isSuperAdmin = (user?.activeRole ?? user?.userRole) === UserRole.SUPER_ADMIN;

    const [subsidiaryFilter, setSubsidiaryFilter] = useState('');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
    const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null);

    const effectiveSid = isSuperAdmin ? (subsidiaryFilter || undefined) : subsidiary?.id;

    const { data: subsidiaries = [] } = useQuery<Subsidiary[]>({
        queryKey: ['subsidiaries-list'],
        queryFn: getSubsidiaries,
        enabled: isSuperAdmin,
    });

    const { data: equipment = [], isLoading } = useQuery<Equipment[]>({
        queryKey: ['equipment', effectiveSid],
        queryFn: () => getEquipments(effectiveSid),
        enabled: isSuperAdmin || !!subsidiary,
    });

    const { mutate: createMutation } = useMutation({
        mutationFn: createEquipment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] });
            toast.success('Équipement ajouté !', '');
        },
        onError: () => toast.error('Erreur', "Impossible d'ajouter l'équipement."),
    });

    const { mutate: updateMutation } = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateEquipmentDto> }) => updateEquipment(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] });
            toast.success('Équipement modifié !', '');
        },
        onError: () => toast.error('Erreur', 'Impossible de modifier l\'équipement.'),
    });

    const { mutate: deleteMutation } = useMutation({
        mutationFn: deleteEquipment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] });
            setDeletingEquipment(null);
            toast.success('Équipement supprimé !', '');
        },
        onError: () => toast.error('Erreur', 'Impossible de supprimer l\'équipement.'),
    });

    const handleSave = (data: SaveEquipmentDto) => {
        const { id, ...saveData } = data;
        if (id) {
            updateMutation({ id, data: saveData });
        } else {
            createMutation(saveData);
        }
        setIsFormModalOpen(false);
        setEditingEquipment(null);
    };

    const showFiliale = isSuperAdmin && !subsidiaryFilter;

    const needsMaintenance = useMemo(() => equipment.filter(e => e.status === EquipmentStatus.NEEDS_MAINTENANCE).length, [equipment]);
    const outOfService = useMemo(() => equipment.filter(e => e.status === EquipmentStatus.OUT_OF_SERVICE).length, [equipment]);
    const totalValue = useMemo(() => equipment.reduce((s, e) => s + (e.acquisitionValue ?? 0), 0), [equipment]);

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800">{t('equipements.title')}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                    {isSuperAdmin && subsidiaries.length > 0 && (
                        <select
                            value={subsidiaryFilter}
                            onChange={e => setSubsidiaryFilter(e.target.value)}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                        >
                            <option value="">Toutes les filiales</option>
                            {subsidiaries.map(s => (
                                <option key={s.id} value={s.id}>{s.subsidiaryName}</option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={() => { setEditingEquipment(null); setIsFormModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-bold rounded-lg hover:bg-[#adc40f] transition-colors"
                    >
                        <IconPlus className="h-4 w-4" />
                        <span>{t('maintenance.addEquipment')}</span>
                    </button>
                </div>
            </div>

            {/* KPIs */}
            {!isLoading && equipment.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <KpiCard label="Total équipements" value={equipment.length} />
                    <KpiCard label="En maintenance" value={needsMaintenance} color={needsMaintenance > 0 ? 'text-amber-600' : 'text-slate-800'} />
                    <KpiCard label="Hors service" value={outOfService} color={outOfService > 0 ? 'text-red-600' : 'text-slate-800'} />
                    <KpiCard label="Valeur totale" value={formatCurrency(totalValue)} />
                </div>
            )}

            {/* Tableau */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide border-b border-slate-200">
                            <tr>
                                {showFiliale && <th className="px-5 py-3 text-left font-semibold">Filiale</th>}
                                <th className="px-5 py-3 text-left font-semibold">{t('maintenance.equipmentName')}</th>
                                <th className="px-5 py-3 text-left font-semibold">{t('equipements.acquisitionDate')}</th>
                                <th className="px-5 py-3 text-right font-semibold">{t('equipements.acquisitionValue')}</th>
                                <th className="px-5 py-3 text-left font-semibold">{t('maintenance.status')}</th>
                                <th className="px-5 py-3 text-left font-semibold">{t('maintenance.nextMaintenance')}</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={showFiliale ? 7 : 6} className="px-5 py-3">
                                            <div className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: `${55 + i * 9}%`, opacity: 1 - i * 0.15 }} />
                                        </td>
                                    </tr>
                                ))
                            ) : equipment.length === 0 ? (
                                <tr>
                                    <td colSpan={showFiliale ? 7 : 6}>
                                        <EmptyState
                                            icon="stock"
                                            title={t('maintenance.noEquipment')}
                                            description={`Cliquez sur « ${t('maintenance.addEquipment')} » pour commencer.`}
                                        />
                                    </td>
                                </tr>
                            ) : equipment.map(item => {
                                const nextDate = new Date(item.nextMaintenanceDate);
                                const isOverdue = nextDate < new Date();
                                const sub = subsidiaries.find(s => s.id === item.subsidiaryId);
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        {showFiliale && (
                                            <td className="px-5 py-3 text-xs text-slate-500">{sub?.subsidiaryName ?? '—'}</td>
                                        )}
                                        <td className="px-5 py-3 font-semibold text-slate-800">{item.equipmentName}</td>
                                        <td className="px-5 py-3 text-slate-500 text-xs">
                                            {new Date(item.acquisitionDate).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-5 py-3 text-right font-semibold text-slate-700 text-xs">
                                            {formatCurrency(item.acquisitionValue)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[item.status]}`}>
                                                {t(`maintenance.status_${item.status}`)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-xs">
                                            <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}>
                                                {nextDate.toLocaleDateString('fr-FR')}
                                                {isOverdue && (
                                                    <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-bold">
                                                        En retard
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => { setEditingEquipment(item); setIsFormModalOpen(true); }}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title={t('common.edit')}
                                                >
                                                    <IconEdit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingEquipment(item)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title={t('common.delete')}
                                                >
                                                    <IconDelete className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isFormModalOpen && (
                <EquipmentFormModal
                    isOpen
                    onClose={() => { setIsFormModalOpen(false); setEditingEquipment(null); }}
                    onSave={handleSave}
                    equipment={editingEquipment}
                    subsidiaries={isSuperAdmin ? subsidiaries : undefined}
                />
            )}
            {deletingEquipment && (
                <ConfirmationModal
                    isOpen
                    onClose={() => setDeletingEquipment(null)}
                    onConfirm={() => deleteMutation(deletingEquipment.id)}
                    title={t('maintenance.modal.deleteTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: deletingEquipment.equipmentName })}
                />
            )}
        </div>
    );
};

export default Equipements;
