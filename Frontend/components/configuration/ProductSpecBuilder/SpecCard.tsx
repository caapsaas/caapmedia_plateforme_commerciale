import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProductSpecification } from '../../../types/models';
import { useI18n } from '../../../i18n';
import IconGripVertical from '../../icons/IconGripVertical';
import IconEdit from '../../icons/IconEdit';
import IconDelete from '../../icons/IconDelete';

interface SpecCardProps {
    spec: ProductSpecification;
    onEdit: () => void;
    onDelete: () => void;
}

// Carte réordonnable par glisser-déposer (dnd-kit) représentant une spécification
// du Builder — le tri se fait au sein d'un même groupe (voir SpecGroupList).
const SpecCard: React.FC<SpecCardProps> = ({ spec, onEdit, onDelete }) => {
    const { t } = useI18n();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: spec.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg shadow-sm"
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1"
                aria-label={t('specBuilder.card.reorder')}
            >
                <IconGripVertical className="h-4 w-4" />
            </button>
            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-slate-800 truncate">{spec.name}</p>
                    {spec.required && <span className="text-xs text-red-500 font-semibold">{t('specBuilder.card.required')}</span>}
                </div>
                <p className="text-xs text-slate-500">
                    {t(`specBuilder.fieldTypes.${spec.type}`)}
                    {spec.unit ? ` · ${spec.unit}` : ''}
                    {spec.technicalKey ? ` · ${spec.technicalKey}` : ''}
                </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={onEdit} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full" title={t('common.edit')}>
                    <IconEdit className="h-4 w-4" />
                </button>
                <button onClick={onDelete} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full" title={t('common.delete')}>
                    <IconDelete className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default SpecCard;
