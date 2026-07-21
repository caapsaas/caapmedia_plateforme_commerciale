import React, { useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { ProductSpecGroup, ProductSpecification, SpecFieldType } from '../../../types/models';
import { SpecificationFormData } from '../../../services/apiE-commerce/apiProductSpecs';
import { getReferenceLists } from '../../../services/apiE-commerce/apiSpecReferenceLists';
import { useI18n } from '../../../i18n';
import SlideOverDrawer from '../../common/SlideOverDrawer';
import IconPlus from '../../icons/IconPlus';
import IconDelete from '../../icons/IconDelete';

const OPTION_TYPES = [SpecFieldType.SELECT, SpecFieldType.MULTISELECT, SpecFieldType.RADIO];

const FIELD_TYPES: SpecFieldType[] = [
    SpecFieldType.TEXT, SpecFieldType.TEXTAREA, SpecFieldType.NUMBER, SpecFieldType.DECIMAL,
    SpecFieldType.AMOUNT, SpecFieldType.SELECT, SpecFieldType.MULTISELECT, SpecFieldType.RADIO,
    SpecFieldType.CHECKBOX, SpecFieldType.BOOLEAN, SpecFieldType.DATE, SpecFieldType.TIME,
    SpecFieldType.COLOR, SpecFieldType.UPLOAD, SpecFieldType.URL, SpecFieldType.EMAIL,
    SpecFieldType.PHONE, SpecFieldType.DIMENSIONS,
];

function buildFormSchema(t: (key: string) => string) {
    return z.object({
        name: z.string().min(1, t('specBuilder.drawer.nameRequired')),
        technicalKey: z.string().min(1, t('specBuilder.drawer.technicalKeyRequired')).regex(/^[a-z][a-z0-9_]*$/, t('specBuilder.drawer.technicalKeyPattern')),
        type: z.nativeEnum(SpecFieldType),
        groupId: z.string(),
        required: z.boolean(),
        helpText: z.string(),
        placeholder: z.string(),
        unit: z.string(),
        internalDescription: z.string(),
        visibleToClient: z.boolean(),
        visibleToProduction: z.boolean(),
        editableAfterValidation: z.boolean(),
        searchable: z.boolean(),
        optionsSource: z.enum(['inline', 'reference']),
        referenceListKey: z.string(),
        options: z.array(z.object({ value: z.string().min(1, t('specBuilder.drawer.fieldRequired')), label: z.string().min(1, t('specBuilder.drawer.fieldRequired')) })),
        uploadExtensions: z.string(),
        uploadMaxSizeMb: z.string(),
        uploadMaxFiles: z.string(),
        dimMinWidth: z.string(),
        dimMaxWidth: z.string(),
        dimMinHeight: z.string(),
        dimMaxHeight: z.string(),
    });
}

type FormValues = z.infer<ReturnType<typeof buildFormSchema>>;

const emptyValues: FormValues = {
    name: '', technicalKey: '', type: SpecFieldType.TEXT, groupId: '', required: false,
    helpText: '', placeholder: '', unit: '', internalDescription: '',
    visibleToClient: true, visibleToProduction: true, editableAfterValidation: false, searchable: false,
    optionsSource: 'inline', referenceListKey: '', options: [],
    uploadExtensions: '', uploadMaxSizeMb: '', uploadMaxFiles: '',
    dimMinWidth: '', dimMaxWidth: '', dimMinHeight: '', dimMaxHeight: '',
};

function specToFormValues(spec: ProductSpecification): FormValues {
    const possibleValues = spec.possibleValues as any;
    const isReference = possibleValues && !Array.isArray(possibleValues) && possibleValues.referenceListKey;
    const typeConfig = (spec.typeConfig ?? {}) as Record<string, unknown>;

    return {
        name: spec.name,
        technicalKey: spec.technicalKey,
        type: spec.type,
        groupId: spec.groupId ?? '',
        required: spec.required,
        helpText: spec.helpText ?? '',
        placeholder: spec.placeholder ?? '',
        unit: spec.unit ?? '',
        internalDescription: '',
        visibleToClient: spec.visibleToClient,
        visibleToProduction: spec.visibleToProduction,
        editableAfterValidation: spec.editableAfterValidation,
        searchable: spec.searchable,
        optionsSource: isReference ? 'reference' : 'inline',
        referenceListKey: isReference ? possibleValues.referenceListKey : '',
        options: !isReference && Array.isArray(possibleValues) ? possibleValues : [],
        uploadExtensions: Array.isArray(typeConfig.extensions) ? (typeConfig.extensions as string[]).join(', ') : '',
        uploadMaxSizeMb: typeConfig.maxSizeMb != null ? String(typeConfig.maxSizeMb) : '',
        uploadMaxFiles: typeConfig.maxFiles != null ? String(typeConfig.maxFiles) : '',
        dimMinWidth: typeConfig.minWidth != null ? String(typeConfig.minWidth) : '',
        dimMaxWidth: typeConfig.maxWidth != null ? String(typeConfig.maxWidth) : '',
        dimMinHeight: typeConfig.minHeight != null ? String(typeConfig.minHeight) : '',
        dimMaxHeight: typeConfig.maxHeight != null ? String(typeConfig.maxHeight) : '',
    };
}

function formValuesToPayload(values: FormValues): SpecificationFormData {
    let possibleValues: unknown;
    if (OPTION_TYPES.includes(values.type)) {
        possibleValues = values.optionsSource === 'reference'
            ? { referenceListKey: values.referenceListKey }
            : values.options;
    }

    let typeConfig: Record<string, unknown> | undefined;
    if (values.type === SpecFieldType.UPLOAD) {
        typeConfig = {
            extensions: values.uploadExtensions.split(',').map(s => s.trim()).filter(Boolean),
            maxSizeMb: values.uploadMaxSizeMb ? Number(values.uploadMaxSizeMb) : undefined,
            maxFiles: values.uploadMaxFiles ? Number(values.uploadMaxFiles) : undefined,
        };
    } else if (values.type === SpecFieldType.DIMENSIONS) {
        typeConfig = {
            minWidth: values.dimMinWidth ? Number(values.dimMinWidth) : undefined,
            maxWidth: values.dimMaxWidth ? Number(values.dimMaxWidth) : undefined,
            minHeight: values.dimMinHeight ? Number(values.dimMinHeight) : undefined,
            maxHeight: values.dimMaxHeight ? Number(values.dimMaxHeight) : undefined,
        };
    }

    return {
        name: values.name,
        technicalKey: values.technicalKey,
        type: values.type,
        groupId: values.groupId || null,
        required: values.required,
        helpText: values.helpText || undefined,
        placeholder: values.placeholder || undefined,
        unit: values.unit || undefined,
        internalDescription: values.internalDescription || undefined,
        visibleToClient: values.visibleToClient,
        visibleToProduction: values.visibleToProduction,
        editableAfterValidation: values.editableAfterValidation,
        searchable: values.searchable,
        possibleValues,
        typeConfig,
    };
}

interface SpecConfigDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: SpecificationFormData) => void;
    spec: ProductSpecification | null; // null = création
    groups: ProductSpecGroup[];
}

// Panneau de configuration d'une spécification — la configuration affichée
// s'adapte automatiquement selon le type de champ choisi (options pour les
// listes, extensions pour l'upload, min/max pour les dimensions...).
const SpecConfigDrawer: React.FC<SpecConfigDrawerProps> = ({ isOpen, onClose, onSave, spec, groups }) => {
    const { t } = useI18n();
    const formSchema = useMemo(() => buildFormSchema(t), [t]);
    const { register, handleSubmit, watch, control, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: emptyValues,
    });
    const { fields, append, remove } = useFieldArray({ control, name: 'options' });

    const type = watch('type');
    const optionsSource = watch('optionsSource');

    useEffect(() => {
        reset(spec ? specToFormValues(spec) : emptyValues);
    }, [spec, isOpen, reset]);

    const { data: referenceLists = [] } = useQuery({
        queryKey: ['spec-reference-lists'],
        queryFn: getReferenceLists,
        enabled: isOpen && OPTION_TYPES.includes(type),
    });

    const isOptionType = OPTION_TYPES.includes(type);

    const onSubmit = (values: FormValues) => {
        onSave(formValuesToPayload(values));
    };

    const fieldLabelClass = 'block text-sm font-medium text-slate-700';
    const fieldInputClass = 'mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm';

    return (
        <SlideOverDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={spec ? t('specBuilder.drawer.editTitle') : t('specBuilder.drawer.addTitle')}
            footer={
                <div className="flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('specBuilder.drawer.cancel')}</button>
                    <button type="submit" form="spec-config-form" className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors">{t('specBuilder.drawer.save')}</button>
                </div>
            }
        >
            <form id="spec-config-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className={fieldLabelClass}>{t('specBuilder.drawer.name')}</label>
                    <input {...register('name')} className={fieldInputClass} />
                    {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                    <label className={fieldLabelClass}>{t('specBuilder.drawer.technicalKey')}</label>
                    <input {...register('technicalKey')} placeholder={t('specBuilder.drawer.technicalKeyPlaceholder')} className={fieldInputClass} />
                    {errors.technicalKey && <p className="text-xs text-red-600 mt-1">{errors.technicalKey.message}</p>}
                </div>
                <div>
                    <label className={fieldLabelClass}>{t('specBuilder.drawer.type')}</label>
                    <select {...register('type')} className={fieldInputClass}>
                        {FIELD_TYPES.map(ft => <option key={ft} value={ft}>{t(`specBuilder.fieldTypes.${ft}`)}</option>)}
                    </select>
                </div>
                <div>
                    <label className={fieldLabelClass}>{t('specBuilder.drawer.group')}</label>
                    <select {...register('groupId')} className={fieldInputClass}>
                        <option value="">{t('specBuilder.drawer.noGroup')}</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className={fieldLabelClass}>{t('specBuilder.drawer.helpText')}</label>
                    <input {...register('helpText')} className={fieldInputClass} />
                </div>
                <div>
                    <label className={fieldLabelClass}>{t('specBuilder.drawer.placeholder')}</label>
                    <input {...register('placeholder')} className={fieldInputClass} />
                </div>
                <div>
                    <label className={fieldLabelClass}>{t('specBuilder.drawer.unit')}</label>
                    <input {...register('unit')} className={fieldInputClass} />
                </div>
                <div>
                    <label className={fieldLabelClass}>{t('specBuilder.drawer.internalDescription')}</label>
                    <textarea {...register('internalDescription')} rows={2} className={fieldInputClass} />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" {...register('required')} /> {t('specBuilder.drawer.required')}
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" {...register('visibleToClient')} /> {t('specBuilder.drawer.visibleToClient')}
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" {...register('visibleToProduction')} /> {t('specBuilder.drawer.visibleToProduction')}
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" {...register('editableAfterValidation')} /> {t('specBuilder.drawer.editableAfterValidation')}
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" {...register('searchable')} /> {t('specBuilder.drawer.searchable')}
                    </label>
                </div>

                {/* Configuration adaptative selon le type */}
                {isOptionType && (
                    <div className="pt-3 border-t space-y-3">
                        <h5 className="font-semibold text-sm text-slate-700">{t('specBuilder.drawer.possibleValues')}</h5>
                        <div className="flex gap-4 text-sm">
                            <label className="flex items-center gap-1.5">
                                <input type="radio" value="inline" {...register('optionsSource')} /> {t('specBuilder.drawer.optionsSourceInline')}
                            </label>
                            <label className="flex items-center gap-1.5">
                                <input type="radio" value="reference" {...register('optionsSource')} /> {t('specBuilder.drawer.optionsSourceReference')}
                            </label>
                        </div>

                        {optionsSource === 'reference' ? (
                            <select {...register('referenceListKey')} className={fieldInputClass}>
                                <option value="">{t('specBuilder.drawer.selectReferenceList')}</option>
                                {referenceLists.map(list => (
                                    <option key={list.key} value={list.key}>{list.name}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="space-y-2">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                                        <input
                                            {...register(`options.${index}.value` as const)}
                                            placeholder={t('specBuilder.drawer.optionValuePlaceholder')}
                                            className="col-span-5 border-slate-300 rounded-md shadow-sm py-1.5 px-2 border text-sm"
                                        />
                                        <input
                                            {...register(`options.${index}.label` as const)}
                                            placeholder={t('specBuilder.drawer.optionLabelPlaceholder')}
                                            className="col-span-6 border-slate-300 rounded-md shadow-sm py-1.5 px-2 border text-sm"
                                        />
                                        <button type="button" onClick={() => remove(index)} className="col-span-1 p-1 text-red-500 hover:bg-red-100 rounded-full">
                                            <IconDelete className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => append({ value: '', label: '' })}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200"
                                >
                                    <IconPlus className="h-3 w-3" /> {t('specBuilder.drawer.addOption')}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {type === SpecFieldType.UPLOAD && (
                    <div className="pt-3 border-t space-y-3">
                        <h5 className="font-semibold text-sm text-slate-700">{t('specBuilder.drawer.uploadConfigTitle')}</h5>
                        <div>
                            <label className={fieldLabelClass}>{t('specBuilder.drawer.uploadExtensions')}</label>
                            <input {...register('uploadExtensions')} placeholder={t('specBuilder.drawer.uploadExtensionsPlaceholder')} className={fieldInputClass} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={fieldLabelClass}>{t('specBuilder.drawer.uploadMaxSize')}</label>
                                <input type="number" {...register('uploadMaxSizeMb')} className={fieldInputClass} />
                            </div>
                            <div>
                                <label className={fieldLabelClass}>{t('specBuilder.drawer.uploadMaxFiles')}</label>
                                <input type="number" {...register('uploadMaxFiles')} className={fieldInputClass} />
                            </div>
                        </div>
                    </div>
                )}

                {type === SpecFieldType.DIMENSIONS && (
                    <div className="pt-3 border-t space-y-3">
                        <h5 className="font-semibold text-sm text-slate-700">{t('specBuilder.drawer.dimensionsConfigTitle')}</h5>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={fieldLabelClass}>{t('specBuilder.drawer.dimMinWidth')}</label>
                                <input type="number" {...register('dimMinWidth')} className={fieldInputClass} />
                            </div>
                            <div>
                                <label className={fieldLabelClass}>{t('specBuilder.drawer.dimMaxWidth')}</label>
                                <input type="number" {...register('dimMaxWidth')} className={fieldInputClass} />
                            </div>
                            <div>
                                <label className={fieldLabelClass}>{t('specBuilder.drawer.dimMinHeight')}</label>
                                <input type="number" {...register('dimMinHeight')} className={fieldInputClass} />
                            </div>
                            <div>
                                <label className={fieldLabelClass}>{t('specBuilder.drawer.dimMaxHeight')}</label>
                                <input type="number" {...register('dimMaxHeight')} className={fieldInputClass} />
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </SlideOverDrawer>
    );
};

export default SpecConfigDrawer;
