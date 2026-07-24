import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Equipment, EquipmentStatus, Subsidiary, UserRole } from '../../types';
import { getEquipments } from '../../services/apiMaintenance/apiEquipment';
import {
    createMaintenanceRecord,
    CreateMaintenanceRecordDto,
} from '../../services/apiMaintenance/apiMaintenance_record';
import { getSubsidiaries } from '../../services/apiCommon/apiSubsidiaries';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../i18n';
import { useHasRole } from '../../hooks/useHasRole';
import IconSearch from '../icons/IconSearch';
import IconPlus from '../icons/IconPlus';

const CAN_LOG_MAINTENANCE = [UserRole.ADMIN, UserRole.PRODUCTION_DIRECTOR];

const STATUS_BADGE: Record<EquipmentStatus, string> = {
    [EquipmentStatus.OPERATIONAL]: 'bg-green-100 text-green-700',
    [EquipmentStatus.NEEDS_MAINTENANCE]: 'bg-amber-100 text-amber-700',
    [EquipmentStatus.OUT_OF_SERVICE]: 'bg-red-100 text-red-700',
};

const STATUS_DOT: Record<EquipmentStatus, string> = {
    [EquipmentStatus.OPERATIONAL]: 'bg-green-500',
    [EquipmentStatus.NEEDS_MAINTENANCE]: 'bg-amber-400',
    [EquipmentStatus.OUT_OF_SERVICE]: 'bg-red-500',
};

// ─── Composant principal ─────────────────────────────────────────────────────
const Maintenance: React.FC = () => {
    const { t, formatCurrency } = useI18n();
    const toast = useToast();
    const { subsidiary, user } = useAuth();
    const queryClient = useQueryClient();

    const isSuperAdmin = user?.userRole === UserRole.SUPER_ADMIN || user?.activeRole === UserRole.SUPER_ADMIN;
    const { hasRole } = useHasRole();
    const canLogMaintenance = hasRole(CAN_LOG_MAINTENANCE);

    const [subsidiaryFilter, setSubsidiaryFilter] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<EquipmentStatus | ''>('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [form, setForm] = useState({
        maintenanceDate: new Date().toISOString().split('T')[0],
        technician: '',
        description: '',
        maintenanceCost: 0,
    });

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

    const { mutate: addRecord, isPending } = useMutation({
        mutationFn: (data: CreateMaintenanceRecordDto) => createMaintenanceRecord(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] });
            toast.success('Intervention enregistrée !', 'Le journal de maintenance a été mis à jour.');
            setShowAddForm(false);
            setForm({
                maintenanceDate: new Date().toISOString().split('T')[0],
                technician: '',
                description: '',
                maintenanceCost: 0,
            });
        },
        onError: () => toast.error('Erreur', "Impossible d'enregistrer l'intervention."),
    });

    // Dérive l'équipement sélectionné depuis la liste fraîche (mise à jour après mutation)
    const selectedEquipment = useMemo(
        () => equipment.find(e => e.id === selectedId) ?? null,
        [equipment, selectedId],
    );

    const filteredEquipment = useMemo(() => {
        let list = equipment;
        if (statusFilter) list = list.filter(e => e.status === statusFilter);
        if (search) {
            const term = search.toLowerCase();
            list = list.filter(e => e.equipmentName.toLowerCase().includes(term));
        }
        return list;
    }, [equipment, statusFilter, search]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedId) return;
        addRecord({
            equipmentId: selectedId,
            ...form,
            maintenanceDate: new Date(form.maintenanceDate).toISOString(),
        });
    };

    const sortedHistory = useMemo(() => {
        if (!selectedEquipment) return [];
        return [...(selectedEquipment.maintenanceRecords ?? [])].sort(
            (a, b) => new Date(b.maintenanceDate).getTime() - new Date(a.maintenanceDate).getTime(),
        );
    }, [selectedEquipment]);

    return (
        <div className="space-y-6">

        {/* En-tête */}
        <div>
            <h2 className="text-2xl font-bold text-slate-800">{t('maintenance.title')}</h2>
            <p className="text-sm text-slate-500 mt-1">{t('maintenance.description')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">

            {/* ── Colonne gauche : liste équipements ──────────────────────── */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                {/* Header filtre */}
                <div className="px-4 py-3 border-b border-slate-100 space-y-2">
                    {isSuperAdmin && subsidiaries.length > 0 && (
                        <select
                            value={subsidiaryFilter}
                            onChange={e => { setSubsidiaryFilter(e.target.value); setSelectedId(null); }}
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                        >
                            <option value="">Toutes les filiales</option>
                            {subsidiaries.map(s => (
                                <option key={s.id} value={s.id}>{s.subsidiaryName}</option>
                            ))}
                        </select>
                    )}
                    {/* Tabs statut */}
                    <div className="flex gap-1 flex-wrap">
                        {(['', ...Object.values(EquipmentStatus)] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                                    statusFilter === s
                                        ? 'bg-slate-800 text-white'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            >
                                {s === '' ? 'Tous' : t(`maintenance.status_${s}`)}
                            </button>
                        ))}
                    </div>
                    {/* Recherche */}
                    <div className="relative">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Rechercher un équipement…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                        />
                    </div>
                </div>

                {/* Liste */}
                <div className="overflow-y-auto" style={{ maxHeight: '480px' }}>
                    {isLoading ? (
                        <div className="p-4 space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" style={{ opacity: 1 - i * 0.12 }} />
                            ))}
                        </div>
                    ) : filteredEquipment.length === 0 ? (
                        <p className="text-center text-sm text-slate-400 py-10">Aucun équipement trouvé.</p>
                    ) : (
                        <ul className="divide-y divide-slate-50">
                            {filteredEquipment.map(item => {
                                const isSelected = item.id === selectedId;
                                const nextDate = new Date(item.nextMaintenanceDate);
                                const overdue = nextDate < new Date();
                                return (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedId(item.id); setShowAddForm(false); }}
                                            className={`w-full text-left px-4 py-3 flex items-start justify-between gap-3 transition-colors ${
                                                isSelected
                                                    ? 'bg-[#c6e911]/15 border-l-2 border-[#adc40f]'
                                                    : 'hover:bg-slate-50 border-l-2 border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-start gap-2.5 min-w-0">
                                                <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[item.status]}`} />
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-semibold truncate ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                                                        {item.equipmentName}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        {item.maintenanceRecords?.length ?? 0} intervention{(item.maintenanceRecords?.length ?? 0) !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className={`text-xs font-semibold ${overdue ? 'text-red-500' : 'text-slate-400'}`}>
                                                    {overdue ? '⚠ ' : ''}
                                                    {nextDate.toLocaleDateString('fr-FR')}
                                                </span>
                                                <p className="text-[10px] text-slate-300 mt-0.5">prochaine maintenance</p>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* ── Colonne droite : historique + formulaire ─────────────────── */}
            <div className="lg:col-span-3 space-y-4">
                {selectedEquipment ? (
                    <>
                        {/* Fiche équipement */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            {/* Header */}
                            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">
                                        Équipement sélectionné
                                    </p>
                                    <h3 className="text-base font-bold text-slate-800">{selectedEquipment.equipmentName}</h3>
                                    <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[selectedEquipment.status]}`}>
                                        {t(`maintenance.status_${selectedEquipment.status}`)}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedId(null); setShowAddForm(false); }}
                                    className="text-slate-400 hover:text-slate-600 text-xl leading-none mt-0.5"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                                <div className="px-4 py-3 text-center">
                                    <p className="text-xs text-slate-400 mb-1">Dernière maintenance</p>
                                    <p className="text-sm font-bold text-slate-700">
                                        {new Date(selectedEquipment.lastMaintenanceDate).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <div className="px-4 py-3 text-center">
                                    <p className="text-xs text-slate-400 mb-1">Prochaine maintenance</p>
                                    <p className={`text-sm font-bold ${new Date(selectedEquipment.nextMaintenanceDate) < new Date() ? 'text-red-600' : 'text-slate-700'}`}>
                                        {new Date(selectedEquipment.nextMaintenanceDate).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <div className="px-4 py-3 text-center">
                                    <p className="text-xs text-slate-400 mb-1">Valeur d'achat</p>
                                    <p className="text-sm font-bold text-slate-700">
                                        {formatCurrency(selectedEquipment.acquisitionValue)}
                                    </p>
                                </div>
                            </div>

                            {/* Formulaire d'ajout d'intervention */}
                            {canLogMaintenance && (
                                <div className="px-5 py-4 border-b border-slate-100">
                                    {!showAddForm ? (
                                        <button
                                            onClick={() => setShowAddForm(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-bold rounded-lg hover:bg-[#adc40f] transition-colors"
                                        >
                                            <IconPlus className="h-4 w-4" />
                                            <span>{t('maintenance.logMaintenance')}</span>
                                        </button>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-3">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                Nouvelle intervention
                                            </p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                                                        {t('maintenance.form.maintenanceDate')}
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={form.maintenanceDate}
                                                        onChange={e => setForm(p => ({ ...p, maintenanceDate: e.target.value }))}
                                                        required
                                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                                                        {t('maintenance.form.technician')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={form.technician}
                                                        onChange={e => setForm(p => ({ ...p, technician: e.target.value }))}
                                                        required
                                                        placeholder="Nom du technicien"
                                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">
                                                    {t('maintenance.form.description')}
                                                </label>
                                                <textarea
                                                    value={form.description}
                                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                                    required
                                                    rows={2}
                                                    placeholder="Travaux effectués…"
                                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911] resize-none"
                                                />
                                            </div>
                                            <div className="flex items-end gap-3">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                                                        {t('maintenance.form.cost')} (FCFA)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={form.maintenanceCost}
                                                        onChange={e => setForm(p => ({ ...p, maintenanceCost: parseFloat(e.target.value) || 0 }))}
                                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAddForm(false)}
                                                    className="px-3 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                                >
                                                    {t('common.cancel')}
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isPending}
                                                    className="px-4 py-2 text-sm font-bold text-slate-800 bg-[#c6e911] rounded-lg hover:bg-[#adc40f] disabled:opacity-50 transition-colors"
                                                >
                                                    {isPending ? 'Enregistrement…' : t('common.save')}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* Historique des interventions */}
                            <div className="px-5 py-4">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                    {t('maintenance.history')}
                                    <span className="ml-2 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px]">
                                        {sortedHistory.length}
                                    </span>
                                </p>

                                {sortedHistory.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-slate-400">Aucune intervention enregistrée.</p>
                                        {!isSuperAdmin && (
                                            <p className="text-xs text-slate-300 mt-1">
                                                Cliquez sur « {t('maintenance.logMaintenance')} » ci-dessus.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <ol className="relative border-l border-slate-200 space-y-0 ml-2">
                                        {sortedHistory.map((record, idx) => (
                                            <li key={record.id} className="ml-5 pb-5 last:pb-0">
                                                <span className={`absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${idx === 0 ? 'bg-[#c6e911]' : 'bg-slate-200'}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${idx === 0 ? 'bg-slate-700' : 'bg-slate-400'}`} />
                                                </span>
                                                <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <time className="text-xs font-semibold text-slate-500">
                                                            {new Date(record.maintenanceDate).toLocaleDateString('fr-FR', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric',
                                                            })}
                                                        </time>
                                                        <span className="text-xs font-bold text-slate-700">
                                                            {formatCurrency(record.maintenanceCost)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-semibold text-[#adc40f]">{record.technician}</p>
                                                    <p className="text-sm text-slate-700 mt-1">{record.description}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Placeholder */
                    <div className="bg-white rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center py-24 text-center">
                        <svg className="w-10 h-10 text-slate-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <p className="text-sm font-medium text-slate-400">Sélectionnez un équipement</p>
                        <p className="text-xs text-slate-300 mt-1">dans la liste à gauche pour voir son historique de maintenance</p>
                    </div>
                )}
            </div>
        </div>
        </div>
    );
};

export default Maintenance;
