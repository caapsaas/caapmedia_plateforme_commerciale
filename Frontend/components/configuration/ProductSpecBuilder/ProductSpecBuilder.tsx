import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProductSpecification } from '../../../types/models';
import {
    createSpecGroup, deleteSpecGroup,
    createSpecification, updateSpecification, deleteSpecification,
    reorderSpecifications, getBuilderStructure, getFormDefinition,
    SpecificationFormData, ReorderSpecItem,
} from '../../../services/apiE-commerce/apiProductSpecs';
import { useI18n } from '../../../i18n';
import SpecGroupList from './SpecGroupList';
import SpecConfigDrawer from './SpecConfigDrawer';
import FormRenderer, { SpecValues } from '../../common/FormRenderer';
import IconPlus from '../../icons/IconPlus';

interface ProductSpecBuilderProps {
    productId: string;
    productName: string;
}

// Orchestrateur du Builder (Chantier 5) : liste des specs réordonnable par
// glisser-déposer à gauche, prévisualisation live du formulaire exact que
// verra le commercial à droite — les deux s'appuient sur le même moteur
// (FormRenderer) que celui utilisé en création de commande.
const ProductSpecBuilder: React.FC<ProductSpecBuilderProps> = ({ productId, productName }) => {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingSpec, setEditingSpec] = useState<ProductSpecification | null>(null);
    const [newSpecGroupId, setNewSpecGroupId] = useState<string | null>(null);
    const [isAddingGroup, setIsAddingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [previewValues, setPreviewValues] = useState<SpecValues>({});

    const structureQuery = useQuery({
        queryKey: ['spec-structure', productId],
        queryFn: () => getBuilderStructure(productId),
    });

    const previewQuery = useQuery({
        queryKey: ['form-definition', productId],
        queryFn: () => getFormDefinition(productId),
    });

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['spec-structure', productId] });
        queryClient.invalidateQueries({ queryKey: ['form-definition', productId] });
    };

    const createGroupMutation = useMutation({
        mutationFn: (name: string) => createSpecGroup(productId, { name }),
        onSuccess: invalidateAll,
    });

    const deleteGroupMutation = useMutation({
        mutationFn: (groupId: string) => deleteSpecGroup(groupId),
        onSuccess: invalidateAll,
    });

    const createSpecMutation = useMutation({
        mutationFn: (data: SpecificationFormData) => createSpecification(productId, data),
        onSuccess: invalidateAll,
    });

    const updateSpecMutation = useMutation({
        mutationFn: ({ specId, data }: { specId: string; data: SpecificationFormData }) =>
            updateSpecification(specId, data),
        onSuccess: invalidateAll,
    });

    const deleteSpecMutation = useMutation({
        mutationFn: (specId: string) => deleteSpecification(specId),
        onSuccess: invalidateAll,
    });

    const reorderMutation = useMutation({
        mutationFn: (items: ReorderSpecItem[]) => reorderSpecifications(productId, items),
        onSuccess: invalidateAll,
    });

    const handleAddSpec = (groupId: string | null) => {
        setEditingSpec(null);
        setNewSpecGroupId(groupId);
        setDrawerOpen(true);
    };

    const handleEditSpec = (spec: ProductSpecification) => {
        setEditingSpec(spec);
        setNewSpecGroupId(spec.groupId);
        setDrawerOpen(true);
    };

    const handleDeleteSpec = (spec: ProductSpecification) => {
        if (window.confirm(t('specBuilder.builder.confirmDeleteSpec', { name: spec.name }))) {
            deleteSpecMutation.mutate(spec.id);
        }
    };

    const handleDeleteGroup = (group: { id: string; name: string }) => {
        if (window.confirm(t('specBuilder.builder.confirmDeleteGroup', { name: group.name }))) {
            deleteGroupMutation.mutate(group.id);
        }
    };

    const handleSaveSpec = (data: SpecificationFormData) => {
        const payload = { ...data, groupId: newSpecGroupId };
        if (editingSpec) {
            updateSpecMutation.mutate({ specId: editingSpec.id, data: payload });
        } else {
            createSpecMutation.mutate(payload);
        }
        setDrawerOpen(false);
    };

    const handleReorderWithinGroup = (groupId: string | null, orderedIds: string[]) => {
        reorderMutation.mutate(orderedIds.map((id, index) => ({ id, order: index + 1, groupId })));
    };

    const handleConfirmAddGroup = () => {
        if (!newGroupName.trim()) return;
        createGroupMutation.mutate(newGroupName.trim());
        setNewGroupName('');
        setIsAddingGroup(false);
    };

    if (structureQuery.isLoading) {
        return <p className="text-sm text-slate-500 p-4">{t('specBuilder.builder.loading')}</p>;
    }

    if (structureQuery.isError || !structureQuery.data) {
        return <p className="text-sm text-red-600 p-4">{t('specBuilder.builder.loadError')}</p>;
    }

    const { groups, ungroupedSpecifications } = structureQuery.data;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800">{t('specBuilder.builder.fieldsTitle', { productName })}</h3>
                </div>

                <SpecGroupList
                    groups={groups}
                    ungrouped={ungroupedSpecifications}
                    onReorderWithinGroup={handleReorderWithinGroup}
                    onEditSpec={handleEditSpec}
                    onDeleteSpec={handleDeleteSpec}
                    onAddSpec={handleAddSpec}
                    onDeleteGroup={handleDeleteGroup}
                    onAddGroup={() => setIsAddingGroup(true)}
                />

                {isAddingGroup && (
                    <div className="mt-3 flex items-center gap-2">
                        <input
                            autoFocus
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleConfirmAddGroup()}
                            placeholder={t('specBuilder.builder.newGroupPlaceholder')}
                            className="flex-grow border-slate-300 rounded-md shadow-sm py-2 px-3 border text-sm focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911]"
                        />
                        <button onClick={handleConfirmAddGroup} className="px-3 py-2 bg-[#c6e911] text-slate-800 rounded-md text-sm hover:bg-[#adc40f]">
                            <IconPlus className="h-4 w-4" />
                        </button>
                        <button onClick={() => setIsAddingGroup(false)} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-md text-sm hover:bg-slate-200">
                            {t('specBuilder.builder.cancel')}
                        </button>
                    </div>
                )}
            </div>

            <div>
                <h3 className="font-bold text-slate-800 mb-4">{t('specBuilder.builder.previewTitle')}</h3>
                <div className="bg-white border border-slate-200 rounded-lg p-4 sticky top-4">
                    {previewQuery.data ? (
                        <FormRenderer
                            schema={previewQuery.data}
                            values={previewValues}
                            onChange={(key, value) => setPreviewValues(prev => ({ ...prev, [key]: value }))}
                        />
                    ) : (
                        <p className="text-sm text-slate-400 italic">{t('specBuilder.builder.noFields')}</p>
                    )}
                </div>
            </div>

            <SpecConfigDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSave={handleSaveSpec}
                spec={editingSpec}
                groups={groups}
            />
        </div>
    );
};

export default ProductSpecBuilder;
