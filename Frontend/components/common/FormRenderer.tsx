import React from 'react';
import { FormDefinition, ProductSpecification, SpecFieldType, SpecRule } from '../../types/models';
import { useI18n } from '../../i18n';

export type SpecValues = Record<string, any>;

interface FormRendererProps {
    schema: FormDefinition;
    values: SpecValues;
    onChange: (technicalKey: string, value: any) => void;
    readOnly?: boolean;
    // Filtre les champs affichés selon le public visé (portail client / production).
    // Par défaut (undefined) : tous les champs sont affichés (vue commerciale/interne).
    audience?: 'client' | 'production';
}

const INPUT_CLASSES =
    'mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm disabled:bg-slate-100 disabled:text-slate-500';

function evaluateCondition(rule: SpecRule, values: SpecValues): boolean {
    const actual = values[rule.when.field];
    switch (rule.when.operator) {
        case 'equals':
            return actual === rule.when.value;
        case 'notEquals':
            return actual !== rule.when.value;
        case 'greaterThan':
            return Number(actual) > Number(rule.when.value);
        case 'lessThan':
            return Number(actual) < Number(rule.when.value);
        default:
            return false;
    }
}

// Les règles peuvent être déclarées sur n'importe quelle spécification (celle qui
// déclenche la condition, ou celle qui la subit) — on les agrège toutes puis on
// n'applique que celles dont la cible (`then.target`) est le champ en cours de rendu.
function computeFieldState(technicalKey: string, allRules: SpecRule[], values: SpecValues) {
    let hidden = false;
    let forcedRequired = false;
    let forcedReadOnly = false;
    for (const rule of allRules) {
        if (rule.then.target !== technicalKey) continue;
        const matches = evaluateCondition(rule, values);
        if (rule.then.action === 'hide' && matches) hidden = true;
        if (rule.then.action === 'show' && !matches) hidden = true;
        if (rule.then.action === 'require' && matches) forcedRequired = true;
        if (rule.then.action === 'readOnly' && matches) forcedReadOnly = true;
    }
    return { hidden, forcedRequired, forcedReadOnly };
}

const NATIVE_INPUT_TYPE: Partial<Record<SpecFieldType, string>> = {
    [SpecFieldType.EMAIL]: 'email',
    [SpecFieldType.URL]: 'url',
    [SpecFieldType.PHONE]: 'tel',
    [SpecFieldType.DATE]: 'date',
    [SpecFieldType.TIME]: 'time',
};

// Moteur de rendu UNIQUE de formulaires dynamiques (Chantier 5) — utilisé partout
// où une commande affiche/saisit les spécifications d'un service : création,
// consultation, portail client, production. Le frontend ne contient ici aucune
// logique spécifique à un produit : tout vient de `schema` (voir getFormDefinition).
const FormRenderer: React.FC<FormRendererProps> = ({ schema, values, onChange, readOnly, audience }) => {
    const { t } = useI18n();
    const allSpecs = [
        ...schema.ungroupedSpecifications,
        ...schema.groups.flatMap(g => g.specifications),
    ];
    const allRules = allSpecs.flatMap(s => s.rules ?? []);

    const isVisibleForAudience = (spec: ProductSpecification) => {
        if (audience === 'client') return spec.visibleToClient;
        if (audience === 'production') return spec.visibleToProduction;
        return true;
    };

    const renderField = (spec: ProductSpecification) => {
        if (!isVisibleForAudience(spec)) return null;

        const { hidden, forcedRequired, forcedReadOnly } = computeFieldState(spec.technicalKey, allRules, values);
        if (hidden) return null;

        const isRequired = spec.required || forcedRequired;
        const isDisabled = !!readOnly || forcedReadOnly;
        const value = values[spec.technicalKey] ?? spec.defaultValue ?? '';

        let input: React.ReactNode;

        switch (spec.type) {
            case SpecFieldType.TEXTAREA:
                input = (
                    <textarea
                        id={spec.technicalKey}
                        disabled={isDisabled}
                        required={isRequired}
                        value={value}
                        rows={3}
                        placeholder={spec.placeholder ?? ''}
                        onChange={e => onChange(spec.technicalKey, e.target.value)}
                        className={INPUT_CLASSES}
                    />
                );
                break;

            case SpecFieldType.NUMBER:
            case SpecFieldType.DECIMAL:
            case SpecFieldType.AMOUNT:
                input = (
                    <input
                        type="number"
                        step={spec.type === SpecFieldType.NUMBER ? 1 : 0.01}
                        id={spec.technicalKey}
                        disabled={isDisabled}
                        required={isRequired}
                        value={value}
                        placeholder={spec.placeholder ?? ''}
                        onChange={e => onChange(spec.technicalKey, e.target.value === '' ? '' : Number(e.target.value))}
                        className={INPUT_CLASSES}
                    />
                );
                break;

            case SpecFieldType.SELECT:
                input = (
                    <select
                        id={spec.technicalKey}
                        disabled={isDisabled}
                        required={isRequired}
                        value={value}
                        onChange={e => onChange(spec.technicalKey, e.target.value)}
                        className={INPUT_CLASSES}
                    >
                        <option value="">{spec.placeholder || t('specBuilder.formRenderer.selectPlaceholder')}</option>
                        {(spec.possibleValues ?? []).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );
                break;

            case SpecFieldType.MULTISELECT: {
                const selected: string[] = Array.isArray(value) ? value : [];
                input = (
                    <div className="mt-1 flex flex-wrap gap-3">
                        {(spec.possibleValues ?? []).map(opt => {
                            const checked = selected.includes(opt.value);
                            return (
                                <label key={opt.value} className="flex items-center gap-1.5 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        disabled={isDisabled}
                                        checked={checked}
                                        onChange={e => {
                                            const next = e.target.checked
                                                ? [...selected, opt.value]
                                                : selected.filter(v => v !== opt.value);
                                            onChange(spec.technicalKey, next);
                                        }}
                                    />
                                    {opt.label}
                                </label>
                            );
                        })}
                    </div>
                );
                break;
            }

            case SpecFieldType.RADIO:
                input = (
                    <div className="mt-1 flex flex-wrap gap-4">
                        {(spec.possibleValues ?? []).map(opt => (
                            <label key={opt.value} className="flex items-center gap-1.5 text-sm text-slate-700">
                                <input
                                    type="radio"
                                    disabled={isDisabled}
                                    name={spec.technicalKey}
                                    checked={value === opt.value}
                                    onChange={() => onChange(spec.technicalKey, opt.value)}
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                );
                break;

            case SpecFieldType.CHECKBOX:
            case SpecFieldType.BOOLEAN:
                input = (
                    <label className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            disabled={isDisabled}
                            checked={!!value}
                            onChange={e => onChange(spec.technicalKey, e.target.checked)}
                        />
                        {spec.placeholder}
                    </label>
                );
                break;

            case SpecFieldType.COLOR:
                input = (
                    <input
                        type="color"
                        disabled={isDisabled}
                        value={value || '#000000'}
                        onChange={e => onChange(spec.technicalKey, e.target.value)}
                        className="mt-1 h-9 w-16 p-0 border border-slate-300 rounded-md"
                    />
                );
                break;

            case SpecFieldType.UPLOAD: {
                const extensions = (spec.typeConfig?.extensions as string[] | undefined) ?? [];
                const accept = extensions.length
                    ? extensions.map(ext => `.${ext.toLowerCase()}`).join(',')
                    : undefined;
                input = (
                    <input
                        type="file"
                        disabled={isDisabled}
                        accept={accept}
                        onChange={e => onChange(spec.technicalKey, e.target.files?.[0] ?? null)}
                        className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#c6e911]/20 file:text-[#8a9e0c] hover:file:bg-[#c6e911]/30"
                    />
                );
                break;
            }

            case SpecFieldType.DIMENSIONS: {
                const dim = (value as { width?: number; height?: number }) || {};
                input = (
                    <div className="mt-1 flex items-center gap-2">
                        <input
                            type="number"
                            disabled={isDisabled}
                            placeholder="Largeur"
                            value={dim.width ?? ''}
                            onChange={e => onChange(spec.technicalKey, { ...dim, width: Number(e.target.value) })}
                            className="w-24 border-slate-300 rounded-md shadow-sm py-2 px-3 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                        />
                        <span className="text-slate-400">×</span>
                        <input
                            type="number"
                            disabled={isDisabled}
                            placeholder="Hauteur"
                            value={dim.height ?? ''}
                            onChange={e => onChange(spec.technicalKey, { ...dim, height: Number(e.target.value) })}
                            className="w-24 border-slate-300 rounded-md shadow-sm py-2 px-3 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                        />
                        {spec.unit && <span className="text-xs text-slate-500">{spec.unit}</span>}
                    </div>
                );
                break;
            }

            default:
                // TEXT, EMAIL, URL, PHONE, DATE, TIME — champs texte natifs simples.
                input = (
                    <input
                        type={NATIVE_INPUT_TYPE[spec.type] ?? 'text'}
                        id={spec.technicalKey}
                        disabled={isDisabled}
                        required={isRequired}
                        value={value}
                        placeholder={spec.placeholder ?? ''}
                        onChange={e => onChange(spec.technicalKey, e.target.value)}
                        className={INPUT_CLASSES}
                    />
                );
        }

        return (
            <div key={spec.id}>
                <label htmlFor={spec.technicalKey} className="block text-sm font-medium text-slate-700">
                    {spec.name}
                    {isRequired && <span className="text-red-500"> *</span>}
                    {spec.unit && spec.type !== SpecFieldType.DIMENSIONS && (
                        <span className="text-xs text-slate-400"> ({spec.unit})</span>
                    )}
                </label>
                {input}
                {spec.helpText && <p className="text-xs text-slate-500 mt-1">{spec.helpText}</p>}
            </div>
        );
    };

    const visibleGroups = schema.groups.filter(g => g.specifications.length > 0);

    if (visibleGroups.length === 0 && schema.ungroupedSpecifications.length === 0) {
        return null;
    }

    return (
        <div className="space-y-6">
            {visibleGroups.map(group => (
                <div key={group.id}>
                    <h4 className="font-semibold text-sm text-slate-600 mb-3 uppercase tracking-wide border-b pb-1">
                        {group.name}
                    </h4>
                    <div className="space-y-4">{group.specifications.map(renderField)}</div>
                </div>
            ))}
            {schema.ungroupedSpecifications.length > 0 && (
                <div className="space-y-4">{schema.ungroupedSpecifications.map(renderField)}</div>
            )}
        </div>
    );
};

export default FormRenderer;
