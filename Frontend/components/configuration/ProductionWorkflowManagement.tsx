import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getWorkflows, createWorkflow, updateWorkflow, deleteWorkflow,
    getConfiguredEquipments, Workflow, CreateWorkflowDto,
} from '../../services/apiProduction/apiProduction';
import { getSubsidiaries } from '../../services/apiCommon/apiSubsidiaries';
import { Subsidiary, UserRole, Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { getServicesCatalog } from '../../services/apiE-commerce/apiProducts';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import IconX from '../icons/IconX';
import ConfirmationModal from '../common/ConfirmationModal';

interface StepInput { equipmentId: string; stepOrder: number }

interface WorkflowFormState {
    name: string;
    description: string;
    itemId: string;
    isActive: boolean;
    steps: StepInput[];
}

const EMPTY_FORM: WorkflowFormState = { name: '', description: '', itemId: '', isActive: true, steps: [] };

const ProductionWorkflowManagement: React.FC = () => {
    const { user } = useAuth();
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const activeRole = user?.activeRole ?? user?.userRole;
    const isSuperAdmin = activeRole === UserRole.SUPER_ADMIN;

    const [filterSubsidiaryId, setFilterSubsidiaryId] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Workflow | null>(null);
    const [form, setForm] = useState<WorkflowFormState>(EMPTY_FORM);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const { data: subsidiaries = [] } = useQuery<Subsidiary[]>({
        queryKey: ['subsidiaries'],
        queryFn: getSubsidiaries,
        enabled: isSuperAdmin,
    });

    const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
        queryKey: ['workflows', filterSubsidiaryId],
        queryFn: () => getWorkflows(filterSubsidiaryId || undefined),
    });

    const { data: configuredEquipments = [] } = useQuery({
        queryKey: ['equipment-configured'],
        queryFn: () => getConfiguredEquipments(),
    });

    const { data: services = [] } = useQuery<Product[]>({
        queryKey: ['services-catalog'],
        queryFn: getServicesCatalog,
    });

    const { mutate: create, isPending: isCreating } = useMutation({
        mutationFn: createWorkflow,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); closeForm(); },
        onError: () => setError(t('production.workflows.form.createError')),
    });

    const { mutate: edit, isPending: isEditing } = useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateWorkflowDto> }) => updateWorkflow(id, dto),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); closeForm(); },
        onError: () => setError(t('production.workflows.form.editError')),
    });

    const { mutate: remove } = useMutation({
        mutationFn: deleteWorkflow,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); setDeletingId(null); },
    });

    const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setShowForm(true); };
    const openEdit = (w: Workflow) => {
        setEditing(w);
        setForm({
            name: w.name,
            description: w.description ?? '',
            itemId: w.itemId ?? '',
            isActive: w.isActive,
            steps: w.steps.map(s => ({ equipmentId: s.equipmentId, stepOrder: s.stepOrder })),
        });
        setError('');
        setShowForm(true);
    };
    const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); setError(''); };

    const addStep = () => {
        const nextOrder = form.steps.length + 1;
        setForm(f => ({ ...f, steps: [...f.steps, { equipmentId: '', stepOrder: nextOrder }] }));
    };
    const removeStep = (idx: number) => {
        setForm(f => ({
            ...f,
            steps: f.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepOrder: i + 1 })),
        }));
    };
    const updateStep = (idx: number, equipmentId: string) => {
        setForm(f => ({ ...f, steps: f.steps.map((s, i) => i === idx ? { ...s, equipmentId } : s) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!form.name.trim()) { setError(t('production.workflows.form.nameRequired')); return; }
        if (form.steps.some(s => !s.equipmentId)) { setError(t('production.workflows.form.equipmentRequired')); return; }
        const dto: CreateWorkflowDto = {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            itemId: form.itemId || undefined,
            isActive: form.isActive,
            steps: form.steps,
        };
        if (editing) { edit({ id: editing.id, dto }); } else { create(dto); }
    };

    const isPending = isCreating || isEditing;

    return (
        <div className="space-y-4">
            {/* En-tête */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">{t('production.workflows.title')}</h3>
                    <p className="text-sm text-slate-500">{t('production.workflows.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    {isSuperAdmin && (
                        <select
                            value={filterSubsidiaryId}
                            onChange={e => setFilterSubsidiaryId(e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#c6e911] bg-white text-slate-700"
                        >
                            <option value="">{t('production.workflows.allSubsidiaries')}</option>
                            {subsidiaries.map(s => (
                                <option key={s.id} value={s.id}>{s.subsidiaryName}</option>
                            ))}
                        </select>
                    )}
                    {isSuperAdmin && (
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-1.5 px-3 py-2 bg-[#c6e911] text-slate-800 text-xs font-bold rounded-lg hover:bg-[#adc40f] transition-colors"
                        >
                            <IconPlus className="h-4 w-4" />
                            {t('production.workflows.newWorkflow')}
                        </button>
                    )}
                </div>
            </div>

            {/* Liste */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-white border border-slate-200 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : workflows.length === 0 ? (
                <div className="py-16 text-center bg-white border border-dashed border-slate-200 rounded-xl">
                    <svg className="w-10 h-10 mx-auto mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h10M4 18h6" />
                    </svg>
                    <p className="text-sm font-medium text-slate-400">{t('production.workflows.noWorkflow')}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {workflows.map(w => (
                        <div key={w.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-start justify-between gap-4 hover:border-slate-300 transition-colors">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-slate-800">{w.name}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${w.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                                        {w.isActive ? t('production.workflows.active') : t('production.workflows.inactive')}
                                    </span>
                                    {w.item && (
                                        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
                                            {w.item.name}
                                        </span>
                                    )}
                                </div>
                                {w.description && (
                                    <p className="text-xs text-slate-400 mt-0.5 truncate">{w.description}</p>
                                )}
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {w.steps.length === 0 ? (
                                        <span className="text-[10px] text-slate-300 italic">{t('production.workflows.noSteps')}</span>
                                    ) : (
                                        w.steps.sort((a, b) => a.stepOrder - b.stepOrder).map(s => (
                                            <span key={s.id} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md">
                                                {s.stepOrder}. {s.equipment.equipmentName}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>
                            {isSuperAdmin && (
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => openEdit(w)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title={t('common.edit')}
                                    >
                                        <IconEdit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeletingId(w.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title={t('common.delete')}
                                    >
                                        <IconDelete className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal création/édition */}
            {showForm && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                    onClick={closeForm}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col"
                        style={{ maxHeight: '90vh' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {editing ? t('production.workflows.form.editTitle') : t('production.workflows.form.createTitle')}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {editing ? `Modifier « ${editing.name} »` : 'Définissez les étapes de production du workflow.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeForm}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <IconX className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Body scrollable */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                                {/* Nom */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                                        {t('production.workflows.form.name')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder={t('production.workflows.form.namePlaceholder')}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911] bg-white placeholder-slate-300"
                                        autoFocus
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                                        {t('production.workflows.form.description')}
                                    </label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        rows={2}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911] resize-none bg-white placeholder-slate-300"
                                        placeholder="Description optionnelle…"
                                    />
                                </div>

                                {/* Service lié + Actif */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                                            {t('production.workflows.form.linkedService')}
                                        </label>
                                        <select
                                            value={form.itemId}
                                            onChange={e => setForm(f => ({ ...f, itemId: e.target.value }))}
                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911] bg-white text-slate-700"
                                        >
                                            <option value="">{t('production.workflows.form.noLinkedService')}</option>
                                            {services.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col justify-end">
                                        <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    id="isActive"
                                                    checked={form.isActive}
                                                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                                                    className="sr-only"
                                                />
                                                <div className={`w-8 h-4 rounded-full transition-colors ${form.isActive ? 'bg-[#c6e911]' : 'bg-slate-200'}`} />
                                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-4' : ''}`} />
                                            </div>
                                            <span className="text-xs font-medium text-slate-700">{t('production.workflows.form.isActive')}</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Étapes */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                            {t('production.workflows.form.steps')}
                                            <span className="ml-1.5 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px]">{form.steps.length}</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addStep}
                                            className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                                        >
                                            <IconPlus className="h-3.5 w-3.5" />
                                            {t('production.workflows.form.addStep')}
                                        </button>
                                    </div>

                                    {form.steps.length === 0 ? (
                                        <button
                                            type="button"
                                            onClick={addStep}
                                            className="w-full py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-300 hover:border-slate-300 hover:text-slate-400 transition-colors flex flex-col items-center gap-2"
                                        >
                                            <IconPlus className="h-7 w-7" />
                                            <span className="text-xs">{t('production.workflows.form.noStepsDefined')}</span>
                                        </button>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-[20px_1fr_28px] gap-2 px-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                                                <span className="text-center">#</span>
                                                <span>{t('production.workflows.form.chooseEquipment')}</span>
                                                <span />
                                            </div>
                                            {form.steps.map((step, idx) => (
                                                <div key={idx} className="grid grid-cols-[20px_1fr_28px] gap-2 items-center px-2 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                                    <span className="text-[10px] font-bold text-slate-300 text-center">{step.stepOrder}</span>
                                                    <select
                                                        value={step.equipmentId}
                                                        onChange={e => updateStep(idx, e.target.value)}
                                                        className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911] bg-white"
                                                    >
                                                        <option value="">— {t('production.workflows.form.chooseEquipment')} —</option>
                                                        {configuredEquipments.map(eq => (
                                                            <option key={eq.id} value={eq.id}>
                                                                {eq.equipmentName}
                                                                {eq.hourlyRate != null ? ` · ${Number(eq.hourlyRate).toLocaleString('fr-FR')} F/h` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeStep(idx)}
                                                        className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <IconDelete className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Erreur */}
                                {error && (
                                    <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                                        <svg className="h-4 w-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-xs text-red-600 font-medium">{error}</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer sticky */}
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl shrink-0">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-2 text-sm font-bold text-slate-800 bg-[#c6e911] rounded-lg hover:bg-[#adc40f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPending ? t('common.saving') : editing ? t('production.workflows.form.update') : t('production.workflows.newWorkflow')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation suppression */}
            <ConfirmationModal
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={() => deletingId && remove(deletingId)}
                title={t('production.workflows.deleteConfirm.title')}
                message={t('production.workflows.deleteConfirm.message')}
            />
        </div>
    );
};

export default ProductionWorkflowManagement;
