import React from 'react';
import { FormDefinition, ProductSpecification, SpecFieldType } from '../../types/models';
import { SpecValues } from './FormRenderer';

interface SpecValuesSummaryProps {
    schema?: FormDefinition | null;
    values?: SpecValues | null;
    // Filtre les champs affichés selon le public visé — mêmes règles que FormRenderer.
    audience?: 'client' | 'production';
    className?: string;
}

function formatSpecValue(spec: ProductSpecification, raw: unknown): string {
    switch (spec.type) {
        case SpecFieldType.SELECT:
        case SpecFieldType.RADIO:
            return spec.possibleValues?.find(o => o.value === raw)?.label ?? String(raw);

        case SpecFieldType.MULTISELECT: {
            const values = Array.isArray(raw) ? raw : [raw];
            return values
                .map(v => spec.possibleValues?.find(o => o.value === v)?.label ?? String(v))
                .join(', ');
        }

        case SpecFieldType.CHECKBOX:
        case SpecFieldType.BOOLEAN:
            return raw ? 'Oui' : 'Non';

        case SpecFieldType.DIMENSIONS: {
            const dim = raw as { width?: number; height?: number };
            return `${dim?.width ?? '?'} × ${dim?.height ?? '?'}${spec.unit ? ` ${spec.unit}` : ''}`;
        }

        case SpecFieldType.UPLOAD:
            return typeof raw === 'string' ? raw : 'Fichier joint';

        default:
            return spec.unit ? `${raw} ${spec.unit}` : String(raw);
    }
}

// Affichage lecture seule et compact des spécifications techniques figées sur une
// ligne de commande (specSnapshot + specValues, Chantier 5) — utilisé partout où on
// consulte une commande passée (facture, bon de livraison, production) sans jamais
// permettre la modification : le formulaire de saisie est FormRenderer, celui-ci
// n'en est qu'un résumé texte.
const SpecValuesSummary: React.FC<SpecValuesSummaryProps> = ({ schema, values, audience, className }) => {
    if (!schema || !values) return null;

    const allSpecs = [...schema.ungroupedSpecifications, ...schema.groups.flatMap(g => g.specifications)];
    const visibleSpecs = allSpecs.filter(spec => {
        if (audience === 'client') return spec.visibleToClient;
        if (audience === 'production') return spec.visibleToProduction;
        return true;
    });

    const entries = visibleSpecs
        .map(spec => ({ spec, raw: values[spec.technicalKey] }))
        .filter(({ raw }) => raw !== undefined && raw !== null && raw !== '');

    if (entries.length === 0) return null;

    return (
        <dl className={className ?? 'mt-1 space-y-0.5 text-xs text-slate-500'}>
            {entries.map(({ spec, raw }) => (
                <div key={spec.id} className="flex gap-1">
                    <dt className="font-medium text-slate-600">{spec.name}:</dt>
                    <dd>{formatSpecValue(spec, raw)}</dd>
                </div>
            ))}
        </dl>
    );
};

export default SpecValuesSummary;
