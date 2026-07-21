import React from 'react';
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ProductSpecGroup, ProductSpecification } from '../../../types/models';
import { useI18n } from '../../../i18n';
import SpecCard from './SpecCard';
import IconPlus from '../../icons/IconPlus';
import IconDelete from '../../icons/IconDelete';

interface SpecGroupSectionProps {
    title: string;
    specifications: ProductSpecification[];
    onDragEnd: (event: DragEndEvent) => void;
    onEditSpec: (spec: ProductSpecification) => void;
    onDeleteSpec: (spec: ProductSpecification) => void;
    onAddSpec: () => void;
    onDeleteGroup?: () => void;
}

// Une section (groupe ou "sans groupe") avec tri par glisser-déposer limité à
// son propre périmètre — le déplacement d'une spécification vers un autre
// groupe se fait via le Drawer (sélecteur "Groupe"), pas par drag inter-groupes.
const SpecGroupSection: React.FC<SpecGroupSectionProps> = ({
    title, specifications, onDragEnd, onEditSpec, onDeleteSpec, onAddSpec, onDeleteGroup,
}) => {
    const { t } = useI18n();
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">{title}</h4>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onAddSpec}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-[#c6e911]/20 text-[#6b7a08] rounded-md hover:bg-[#c6e911]/30"
                    >
                        <IconPlus className="h-3 w-3" /> {t('specBuilder.groupList.addField')}
                    </button>
                    {onDeleteGroup && (
                        <button onClick={onDeleteGroup} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full" title={t('specBuilder.groupList.deleteGroupTooltip')}>
                            <IconDelete className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {specifications.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">{t('specBuilder.groupList.emptyGroup')}</p>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={specifications.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {specifications.map(spec => (
                                <SpecCard
                                    key={spec.id}
                                    spec={spec}
                                    onEdit={() => onEditSpec(spec)}
                                    onDelete={() => onDeleteSpec(spec)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
};

interface SpecGroupListProps {
    groups: ProductSpecGroup[];
    ungrouped: ProductSpecification[];
    onReorderWithinGroup: (groupId: string | null, orderedIds: string[]) => void;
    onEditSpec: (spec: ProductSpecification) => void;
    onDeleteSpec: (spec: ProductSpecification) => void;
    onAddSpec: (groupId: string | null) => void;
    onDeleteGroup: (group: ProductSpecGroup) => void;
    onAddGroup: () => void;
}

const SpecGroupList: React.FC<SpecGroupListProps> = ({
    groups, ungrouped, onReorderWithinGroup, onEditSpec, onDeleteSpec, onAddSpec, onDeleteGroup, onAddGroup,
}) => {
    const { t } = useI18n();
    const makeDragEndHandler = (groupId: string | null, specifications: ProductSpecification[]) => (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = specifications.findIndex(s => s.id === active.id);
        const newIndex = specifications.findIndex(s => s.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const reordered = [...specifications];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);
        onReorderWithinGroup(groupId, reordered.map(s => s.id));
    };

    return (
        <div className="space-y-4">
            {groups.map(group => (
                <SpecGroupSection
                    key={group.id}
                    title={group.name}
                    specifications={group.specifications}
                    onDragEnd={makeDragEndHandler(group.id, group.specifications)}
                    onEditSpec={onEditSpec}
                    onDeleteSpec={onDeleteSpec}
                    onAddSpec={() => onAddSpec(group.id)}
                    onDeleteGroup={() => onDeleteGroup(group)}
                />
            ))}

            <SpecGroupSection
                title={t('specBuilder.groupList.noGroup')}
                specifications={ungrouped}
                onDragEnd={makeDragEndHandler(null, ungrouped)}
                onEditSpec={onEditSpec}
                onDeleteSpec={onDeleteSpec}
                onAddSpec={() => onAddSpec(null)}
            />

            <button
                onClick={onAddGroup}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50 w-full justify-center"
            >
                <IconPlus className="h-4 w-4" /> {t('specBuilder.groupList.addGroup')}
            </button>
        </div>
    );
};

export default SpecGroupList;
