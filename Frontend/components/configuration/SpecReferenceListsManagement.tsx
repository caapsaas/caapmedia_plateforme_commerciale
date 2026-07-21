import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SpecReferenceList } from '../../types/models';
import {
    getReferenceLists, createReferenceList, deleteReferenceList,
    addReferenceValue, deleteReferenceValue,
} from '../../services/apiE-commerce/apiSpecReferenceLists';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../i18n';
import IconPlus from '../icons/IconPlus';
import IconDelete from '../icons/IconDelete';
import IconChevronDown from '../icons/IconChevronDown';
import IconChevronRight from '../icons/IconChevronRight';

// Référentiels partagés entre plusieurs services (Chantier 5) : ex. "Types de
// papier", "Grammages" — administrés une seule fois, réutilisables dans le
// Builder via optionsSource="reference" (voir SpecConfigDrawer).
const SpecReferenceListsManagement: React.FC = () => {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const toast = useToast();
    const [expandedListId, setExpandedListId] = useState<string | null>(null);
    const [newListKey, setNewListKey] = useState('');
    const [newListName, setNewListName] = useState('');
    const [isAddingList, setIsAddingList] = useState(false);
    const [newValueDrafts, setNewValueDrafts] = useState<Record<string, { value: string; label: string }>>({});

    const { data: lists = [], isLoading } = useQuery<SpecReferenceList[]>({
        queryKey: ['spec-reference-lists'],
        queryFn: getReferenceLists,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['spec-reference-lists'] });

    const createListMutation = useMutation({
        mutationFn: createReferenceList,
        onSuccess: invalidate,
        onError: () => toast.error('Erreur', t('specBuilder.referenceLists.createError')),
    });
    const deleteListMutation = useMutation({ mutationFn: deleteReferenceList, onSuccess: invalidate });
    const addValueMutation = useMutation({
        mutationFn: ({ listId, value, label }: { listId: string; value: string; label: string }) =>
            addReferenceValue(listId, { value, label }),
        onSuccess: invalidate,
    });
    const deleteValueMutation = useMutation({ mutationFn: deleteReferenceValue, onSuccess: invalidate });

    const handleCreateList = () => {
        if (!newListKey.trim() || !newListName.trim()) return;
        createListMutation.mutate({ key: newListKey.trim(), name: newListName.trim() });
        setNewListKey('');
        setNewListName('');
        setIsAddingList(false);
    };

    const handleAddValue = (listId: string) => {
        const draft = newValueDrafts[listId];
        if (!draft?.value.trim() || !draft?.label.trim()) return;
        addValueMutation.mutate({ listId, value: draft.value.trim(), label: draft.label.trim() });
        setNewValueDrafts(prev => ({ ...prev, [listId]: { value: '', label: '' } }));
    };

    if (isLoading) return <div>{t('common.loading')}</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-slate-800">{t('specBuilder.referenceLists.title')}</h3>
                    <p className="text-sm text-slate-500">{t('specBuilder.referenceLists.subtitle')}</p>
                </div>
                <button onClick={() => setIsAddingList(true)} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                    <IconPlus className="h-4 w-4" />
                    <span>{t('specBuilder.referenceLists.addNew')}</span>
                </button>
            </div>

            {isAddingList && (
                <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                        <label className="block text-xs font-medium text-slate-600">{t('specBuilder.referenceLists.technicalKey')}</label>
                        <input value={newListKey} onChange={e => setNewListKey(e.target.value)} placeholder={t('specBuilder.referenceLists.technicalKeyPlaceholder')} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600">{t('specBuilder.referenceLists.displayName')}</label>
                        <input value={newListName} onChange={e => setNewListName(e.target.value)} placeholder={t('specBuilder.referenceLists.displayNamePlaceholder')} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 border text-sm" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCreateList} className="px-3 py-2 bg-[#c6e911] text-slate-800 rounded-md text-sm hover:bg-[#adc40f]">{t('specBuilder.referenceLists.create')}</button>
                        <button onClick={() => setIsAddingList(false)} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-md text-sm hover:bg-slate-200">{t('specBuilder.referenceLists.cancel')}</button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {lists.map(list => {
                    const isExpanded = expandedListId === list.id;
                    const draft = newValueDrafts[list.id] ?? { value: '', label: '' };
                    return (
                        <div key={list.id} className="border border-slate-200 rounded-lg">
                            <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpandedListId(isExpanded ? null : list.id)}>
                                <div className="flex items-center gap-2">
                                    {isExpanded ? <IconChevronDown className="h-4 w-4 text-slate-400" /> : <IconChevronRight className="h-4 w-4 text-slate-400" />}
                                    <span className="font-semibold text-sm text-slate-800">{list.name}</span>
                                    <span className="text-xs text-slate-400">({list.key}) · {list.values.length} {t('specBuilder.referenceLists.valueCount')}</span>
                                </div>
                                <button
                                    onClick={e => { e.stopPropagation(); deleteListMutation.mutate(list.id); }}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full"
                                >
                                    <IconDelete className="h-4 w-4" />
                                </button>
                            </div>

                            {isExpanded && (
                                <div className="border-t border-slate-100 p-3 space-y-2">
                                    {list.values.map(v => (
                                        <div key={v.id} className="flex items-center justify-between text-sm py-1">
                                            <span>{v.label} <span className="text-slate-400">({v.value})</span></span>
                                            <button onClick={() => deleteValueMutation.mutate(v.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full">
                                                <IconDelete className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            value={draft.value}
                                            onChange={e => setNewValueDrafts(prev => ({ ...prev, [list.id]: { ...draft, value: e.target.value } }))}
                                            placeholder={t('specBuilder.referenceLists.valuePlaceholder')}
                                            className="flex-1 border-slate-300 rounded-md shadow-sm py-1.5 px-2 border text-sm"
                                        />
                                        <input
                                            value={draft.label}
                                            onChange={e => setNewValueDrafts(prev => ({ ...prev, [list.id]: { ...draft, label: e.target.value } }))}
                                            placeholder={t('specBuilder.referenceLists.labelPlaceholder')}
                                            className="flex-1 border-slate-300 rounded-md shadow-sm py-1.5 px-2 border text-sm"
                                        />
                                        <button onClick={() => handleAddValue(list.id)} className="p-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200">
                                            <IconPlus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                {lists.length === 0 && <p className="text-sm text-slate-400 italic">{t('specBuilder.referenceLists.empty')}</p>}
            </div>
        </div>
    );
};

export default SpecReferenceListsManagement;
