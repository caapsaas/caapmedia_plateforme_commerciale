import React, { useState } from 'react';
import { FormDefinition } from '../../types/models';
import { useI18n } from '../../i18n';
import FormRenderer, { SpecValues } from './FormRenderer';

interface SpecValuesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (values: SpecValues) => void;
    productName: string;
    schema: FormDefinition;
}

function getAllRequiredKeys(schema: FormDefinition): string[] {
    const allSpecs = [...schema.ungroupedSpecifications, ...schema.groups.flatMap(g => g.specifications)];
    return allSpecs.filter(s => s.required).map(s => s.technicalKey);
}

// Formulaire de saisie des spécifications techniques d'une ligne de commande
// (Chantier 5) — s'affiche au moment d'ajouter au panier un service qui
// définit des champs techniques. La validation définitive reste côté serveur.
const SpecValuesModal: React.FC<SpecValuesModalProps> = ({ isOpen, onClose, onConfirm, productName, schema }) => {
    const { t } = useI18n();
    const [values, setValues] = useState<SpecValues>({});

    if (!isOpen) return null;

    const requiredKeys = getAllRequiredKeys(schema);
    const missingRequired = requiredKeys.some(key => {
        const value = values[key];
        return value === undefined || value === null || value === '';
    });

    const handleConfirm = () => {
        if (missingRequired) return;
        onConfirm(values);
        setValues({});
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-900">{t('specBuilder.valuesModal.title', { productName })}</h3>
                    <p className="text-sm text-slate-500 mt-1">{t('specBuilder.valuesModal.subtitle')}</p>
                    <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                        <FormRenderer
                            schema={schema}
                            values={values}
                            onChange={(key, value) => setValues(prev => ({ ...prev, [key]: value }))}
                        />
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('specBuilder.valuesModal.cancel')}</button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={missingRequired}
                        className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                        {t('specBuilder.valuesModal.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SpecValuesModal;
